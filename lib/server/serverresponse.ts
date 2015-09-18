import * as stream from 'stream';
import * as http from 'http';
import * as headers from './headers';
import { StatusCode } from './statuscode';
import { Cookie } from './cookie';
import { Map } from './map';

export class ServerResponse {
    constructor(content: ServerResponseContent = undefined, headers: { [ header: string ]: string | string[] } = {}, status = StatusCode.SuccessOK) {
        this.content = content;
        this.headers = headers;
        this.status = status;
    }

    status: StatusCode;
    headers: Map<string | string[]>;
    content: ServerResponseContent;
    addExtraHeaders = true;

    setHeader(header: string, value: string, append = false) {
        if (append) {
            let old = this.headers[header];
            if (old === undefined) {
                this.headers[header] = value;
            } else if (typeof old === 'string') {
                this.headers[header] = [old, value];
            } else {
                (<string[]> old).push(value);
            }
        } else {
            this.headers[header] = value;
        }
    }
	setCookie(cookie: Cookie) {
		this.setHeader(headers.setCookie, cookie.toString());
	}

    write(to: http.ServerResponse) {
        let buffer: Buffer;

        if (typeof this.content === 'string') {
            buffer = new Buffer(<string> this.content);
        } else if (Buffer.isBuffer(this.content)) {
            buffer = <Buffer> this.content;
        }

        if (this.addExtraHeaders) {
            if (buffer) {
                // Add Content-Length header
                this.headers[headers.contentLength] = buffer.length.toString();
            }
        }

        to.writeHead(this.status, this.headers);

        if (buffer) {
            to.end(buffer);
        } else {
            (<stream.Readable> this.content).pipe(to);
        }
    }
}

export type ServerResponseContent = string | Buffer | stream.Readable;
