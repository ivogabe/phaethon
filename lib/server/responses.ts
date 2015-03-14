import ServerError = require('./servererror');
import ServerResponse = require('./serverresponse');
import fs = require('fs');
import mime = require('mime');
import headers = require('./headers');
import Map = require('./map');
import StatusCode = require('./statuscode');

export function redirect(to: string, permanent = false): ServerResponse {
    let response = new ServerResponse();
    response.content = '';
    response.headers[headers.location] = to;
    response.status = permanent ? StatusCode.RedirectionMovedPermanently : StatusCode.RedirectionSeeOther;
    return response;
}
export function file(filename: string): Promise<ServerResponse> {
    return new Promise<ServerResponse>((resolve, reject) => {
        let stream = fs.createReadStream(filename);
        let resolved = false;
        let responseHeaders: Map<string | string[]> = {};
        responseHeaders[headers.contentType] = mime.lookup(filename);

        let cleanUp: () => void;

        let onOpen = (data) => {
            let response = new ServerResponse(stream, responseHeaders);
            resolved = true;

            resolve(response);
        };
        let onCloseOrEnd = () => {
            cleanUp();
        };
        let onError = (error) => {
            console.log(error);
            if (!resolved) {
                if (error.code === 'ENOENT') {
                    reject(new ServerError(StatusCode.ClientErrorNotFound));
                } else {
                    reject(new ServerError(StatusCode.ServerErrorInternalServerError));
                }
            }
            cleanUp();
            stream.close();
        };

        cleanUp = () => {
            stream.removeListener('open', onOpen);
            stream.removeListener('error', onError);
            stream.removeListener('close', onCloseOrEnd);
            stream.removeListener('end', onCloseOrEnd);
        };

        stream.on('open', onOpen);
        stream.on('error', onError);
        stream.on('close', onCloseOrEnd);
        stream.on('end', onCloseOrEnd);
    });
}
