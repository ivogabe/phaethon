import * as http from 'http';
import { StatusCode } from './statuscode';
import { ServerResponse } from './serverresponse';

export class ServerError extends ServerResponse {
    constructor(status: StatusCode, content?: string, headers?: { [ header: string ]: string }) {
        super(content, headers, status);
    }

    content: string;

    write(to: http.ServerResponse) {
        if (this.content === undefined) {
            this.content = this.status + ' ' + http.STATUS_CODES[this.status];
        }
        super.write(to);
    }
}
