import http = require('http');
import StatusCode = require('./statuscode');
import ServerResponse = require('./serverresponse');

class ServerError extends ServerResponse {
    constructor(status: StatusCode, content: string = undefined, headers: { [ header: string ]: string } = {}) {
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

export = ServerError;
