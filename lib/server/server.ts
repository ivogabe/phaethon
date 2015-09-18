import * as http from 'http';
import * as https from 'https';
import { ServerRequest } from './serverrequest';
import { ServerResponse } from './serverresponse';
import { StatusCode } from './statuscode';

export class Server {
    constructor() {

    }

    listenHttp(port: number) {
        var httpServer = http.createServer((request: http.ServerRequest, response: http.ServerResponse) => {
			this.handleRequest(request, response);
		});
        httpServer.listen(port);
    }
    listenHttps(port: number, config: https.ServerOptions) {
        var httpsServer = https.createServer(config, (request: http.ServerRequest, response: http.ServerResponse) => {
			this.handleRequest(request, response);
		});
        httpsServer.listen(port);
    }

    listener: (request: ServerRequest) => ServerResponse | Promise<ServerResponse>;

	private handleRequest(request: http.ServerRequest, response: http.ServerResponse) {
		Promise.resolve(new ServerRequest(request))
			.then(this.listener)
			.then((res) => {
				res.write(response);
			}, (err) => {
				if (err instanceof ServerResponse) {
					(<ServerResponse> err).write(response);
				} else {
					response.writeHead(StatusCode.ServerErrorInternalServerError, { 'Content-Type': 'text/plain' });
					response.end('500 Internal server error');
				}
			});
	}
}
