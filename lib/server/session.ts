import * as crypto from 'crypto';
import { ServerRequest } from './serverrequest';
import { ServerResponse } from './serverresponse';
import { Cookie } from './cookie';

export interface Session<T> {
	id: string;
	token: string;
	start: Date;
	active: Date;

	data: T;
}

const max = 2 ** 30 - 1;
function randomBytes(length: number) {
	return new Promise<Buffer>((resolve, reject) => {
		crypto.randomBytes(length, (error, result) => {
			if (error) {
				reject(error);
			} else {
				resolve(result);
			}
		});
	});
}


export class SessionStore<T> {
	constructor(
		private cookieName: string,
		private empty: () => T,
		/**
		 * When a session has been inactive for this amount of seconds, the session is expired and deleted.
		 */
		private inactiveTime: number,
		private maxSessions: number
	) {
		setTimeout(() => this.clean(), inactiveTime * 1000 / 2);
	}

	private id = -1;
	private sessions = new Map<string, Session<T>>();
	
	/**
	 * Removes inactive sessions
	 */
	private clean() {
		// Sessions before this date will be deleted
		const minimumTime = Date.now() - this.inactiveTime * 1000;
		for (const id of this.sessions.keys()) {
			const session = this.sessions.get(id);
			if (+session.active < minimumTime) {
				// Session expired
				this.sessions.delete(id);
			}
		}
	}
	
	async find(request: ServerRequest) {
		// This function is async to allow async stores in the future,
		// like file based or database instead of in memory.
		
		const cookie = request.cookies[this.cookieName];
		if (cookie === undefined) return undefined;
		const index = cookie.lastIndexOf(':');
		
		// Check invalid values
		if (index === -1) return undefined;
		
		const id = cookie.substring(0, index);
		const token = cookie.substring(index + 1);
		const session = this.sessions.get(id);
		
		// Session not found or invalid
		if (session === undefined || session.token !== token) return undefined;
		
		if (Date.now() - +session.active >= this.inactiveTime * 1000) {
			// Session expired
			this.sessions.delete(id);
			return undefined;
		}
		session.active = new Date();
		return session;
	}
	async create() {
		if (this.sessions.size >= this.maxSessions) {
			// Remove first session
			for (const id of this.sessions.keys()) {
				this.sessions.delete(id);
				break;
			}
		}

		this.id++;
		if (this.id >= max) {
			this.id = 0;
		}
		
		const start = new Date();
		const id = (+start).toString(16) + ':' + this.id.toString(16);
		const bytes = await randomBytes(16);
		const token = bytes.toString('hex');
		
		const session: Session<T> = {
			id,
			token,
			start,
			active: start,
			data: this.empty()
		};
		
		this.sessions.set(id, session);
		
		return session;
	}
	async findOrCreate(request: ServerRequest) {
		return await this.find(request) || await this.create();
	}
	toCookie(session: Session<T>, path?: string, domain?: string, secure?: boolean, httpOnly?: boolean) {
		const value = session.id + ':' + session.token;
		return new Cookie(this.cookieName, value, this.inactiveTime, path, domain, secure, httpOnly);
	}
	addCookie(response: ServerResponse, session: Session<T>, path?: string, domain?: string, secure?: boolean, httpOnly?: boolean) {
		const cookie = this.toCookie(session, path, domain, secure, httpOnly);
		response.setCookie(cookie);
	}
	/**
	 * Wraps a listener so you don't have to create the session manually.
	 * Example:
	 * server.listener = sessionStore.wrapListener((request, session) => {
	 *     
	 * });
	 */
	wrapListener(listener: (request: ServerRequest, session: Session<T>) => ServerResponse | Promise<ServerResponse>) {
		return async (request: ServerRequest) => {
			const session = await this.findOrCreate(request);
			const response = await listener(request, session);
			this.addCookie(response, session);
			return response;
		};
	}
}
