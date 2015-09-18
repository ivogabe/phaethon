import * as http from 'http';
import * as url from 'url';
import * as querystring from 'querystring';
import * as headers from './headers';
import { Map } from './map';
import { Cookie } from './cookie';
import { Dictionary } from './dictionary';

const defaultMaxBodyLength = 1048576;

export class ServerRequest {
	httpRequest: http.ServerRequest;

	constructor(httpRequest: http.ServerRequest) {
		this.httpRequest = httpRequest;

		this.method = httpRequest.method;
		this.url = httpRequest.url;
		this.headers = httpRequest.headers;
	}

	method: string;
	url: string;
	headers: Map<string | string[]>;

	private _parsedUrl: url.Url = undefined;
	get parsedUrl() {
		if (this._parsedUrl !== undefined) return this._parsedUrl;

		return this._parsedUrl = url.parse(this.url, true);
	}
	get path(): string {
		return this.parsedUrl.pathname;
	}
	get query(): Map<string | string[]> {
		return this.parsedUrl.query;
	}


    maxBodyLength = defaultMaxBodyLength;

	getSingleHeader(header: string): string {
		var value = this.headers[header];
		if (typeof value === 'string') {
			return value;
		} else {
			return value[0];
		}
	}
	getFullHeader(header: string): string[] {
		var value = this.headers[header];
		if (typeof value === 'string') {
			return [value];
		} else {
			return value;
		}
	}

	private _cookies: Map<string>;
	get cookies() {
		if (this._cookies !== undefined) return this._cookies;

		return this._cookies = Cookie.parse(this.getSingleHeader(headers.cookie));
	}

    private _bodyBuffer: Promise<Buffer> = undefined;
	get bodyBuffer(): Promise<Buffer> {
        if (this._bodyBuffer !== undefined) return this._bodyBuffer;

		const maxLength = this.maxBodyLength;

        return this._bodyBuffer = new Promise<Buffer>((resolve, reject) => {
			let headerContentLengthString = this.getSingleHeader(headers.contentLength);
			let headerContentLength: number;

            let onData: (data: Buffer) => void;
            let onEnd: () => void;
            let onError: (error: any) => void;
            let onClose: () => void;

            let cleanUp = () => {
                this.httpRequest.removeListener('data', onData);
                this.httpRequest.removeListener('end', onEnd);
                this.httpRequest.removeListener('error', onError);
                this.httpRequest.removeListener('close', onClose);
            };

            onError = (error: any) => {
                reject(error);
                cleanUp();
            };
            onClose = () => {
                reject(new Error('Connection closed'));
                cleanUp();
            };

			if (headerContentLengthString !== undefined && headerContentLengthString !== '') {
				try {
					headerContentLength = parseInt(headerContentLengthString, 10);
				} catch (e) {
					throw new Error('Header Content-Length invalid');
				}
				if (headerContentLength > maxLength) {
					throw new Error('Too much data in http body');
				}
				if (headerContentLength < 0) {
					throw new Error('Header Content-Length invalid');
				}

				let buffer = new Buffer(headerContentLength);
				let index = 0;

                // Callbacks
                onData = (data: Buffer) => {
					let length = data.length;
					let newIndex = index + length;
					if (newIndex > headerContentLength) {
						reject(new Error('Too much data in http body'));
                        cleanUp();
						this.httpRequest.connection.destroy();
                        return;
					}
					data.copy(buffer, index);
					index += data.length;
				};
				onEnd = () => {
                    if (index !== headerContentLength) {
                        reject(new Error('Not enough data in http body received'));
                        cleanUp();
                        return;
                    }
					resolve(buffer);
				};
			} else {
				let buffers: Buffer[] = [];
				let length = 0;

				onData = (data: Buffer) => {
					length += data.length;
					if (length > maxLength) {
						reject(new Error('Too much data in http body'));
						this.httpRequest.connection.destroy();
                        cleanUp();
					}
					buffers.push(data);
				};
				onEnd = () => {
					resolve(Buffer.concat(buffers, length));
                    cleanUp();
				};
			}

            this.httpRequest.on('data', onData);
            this.httpRequest.on('end', onEnd);
            this.httpRequest.on('error', onError);
            this.httpRequest.on('close', onClose);
		});
	}

    private _bodyString: Promise<string> = undefined;
    get bodyString(): Promise<string> {
        return this._bodyString || (this._bodyString = this.bodyBuffer.then((buff) => {
            return buff.toString(); // TODO: Get charset from headers
        }));
    }

    private _bodyQuery: Promise<any> = undefined;
    get bodyQuery(): Promise<any> {
        return this._bodyQuery || (this._bodyQuery = this.bodyString.then((str) => {
            return querystring.parse(str); // TODO: Get charset from headers
        }));
    }

    private _bodyJson: Promise<any> = undefined;
    get bodyJson(): Promise<any> {
        return this._bodyJson || (this._bodyJson = this.bodyString.then((str) => {
            return JSON.parse(str);
        }));
    }

	private _bodyJsonDictionary: Promise<Dictionary> = undefined;
	get bodyJsonDictionary(): Promise<Dictionary> {
		return this._bodyJsonDictionary || (this._bodyJsonDictionary = this.bodyJson.then((obj) => {
			return new Dictionary(obj);
		}));
	}
}
