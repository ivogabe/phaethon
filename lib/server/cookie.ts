import cookie = require('cookie');
import Map = require('./map');

class Cookie {
	name: string;
	value: string;
	expires: Date;
	maxAge: number;
	path: string;
	domain: string;
	secure: boolean;
	httpOnly: boolean;
	constructor(name: string, value: string, expiresOrMaxAge?: Date | number, path?: string, domain?: string, secure?: boolean, httpOnly?: boolean) {
		this.name = name;
		this.value = value;
		if (<any> expiresOrMaxAge instanceof Date) {
			this.expires = <Date> expiresOrMaxAge;
			this.maxAge = undefined;
		} else if (typeof expiresOrMaxAge === 'number') {
			this.maxAge = expiresOrMaxAge;
			this.expires = undefined;
		} else {
			this.expires = undefined;
			this.maxAge = undefined;
		}
		this.path = path;
		this.domain = domain;
		this.secure = secure || false;
		this.httpOnly = httpOnly || false;
    }

	toString() {
		return cookie.serialize(this.name, this.value, {
			path: this.path,
			expires: this.expires,
			maxAge: this.maxAge,
			domain: this.domain,
			secure: this.secure,
			httpOnly: this.httpOnly
		});
	}

	static parse: (str: string) => Map<string> = cookie.parse;
}

export = Cookie;
