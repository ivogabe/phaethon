import lib = require('../server/main');
import path = require('path');

var server = new lib.Server();
server.listenHttp(8800);
server.listener = (request: lib.ServerRequest) => {
    var path = request.path.toLowerCase();

    if (path === '/') return home(request);
    if (path === '/query') return query(request);
    if (path === '/body') return body(request);
    if (path === '/headers') return headers(request);
    if (path === '/source') return source(request);
    if (path === '/not-found') return notFound(request);
    if (path === '/redirect') return redirect(request);
    if (path === '/promises') return promises(request);

    throw new lib.ServerError(lib.StatusCode.ClientErrorNotFound);
};

var home = (request: lib.ServerRequest) => {
    return new lib.ServerResponse('Hello World!');
};

var query = (request: lib.ServerRequest) => {
    return new lib.ServerResponse(JSON.stringify(request.query));
};

var body = (request: lib.ServerRequest) => {
    return request.bodyBuffer.then(buffer => {
        return new lib.ServerResponse(buffer);
    });
};

var headers = (request: lib.ServerRequest) => {
    return new lib.ServerResponse(JSON.stringify(request.headers));
};

var source = (request: lib.ServerRequest) => {
    return lib.responses.file(path.join(__dirname, 'basic.js'));
};

var notFound = (request: lib.ServerRequest) => {
    return lib.responses.file(path.join(__dirname, 'this-file-does-not-exist.foo'));
};

var redirect = (request: lib.ServerRequest) => {
    return lib.responses.redirect('http://localhost:8800/');
};

var promises = (request: lib.ServerRequest) => {
    var timeout = () => new Promise<number>((resolve, reject) => {
        setTimeout(() => {
            resolve(42);
        }, 5);
    });

    var result: number = 0;

    return request.bodyBuffer.then(buffer => {
        result = buffer.length;
        return timeout();
    }).then(value1 => {
        result += value1;
        return timeout();
    }).then(value2 => {
        result += value2;
        return new lib.ServerResponse(result.toString());
    });
};
