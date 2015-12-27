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
	if (path === '/session') return session(request);

    throw new lib.ServerError(lib.StatusCode.ClientErrorNotFound);
};

var home = (request: lib.ServerRequest) => {
    return new lib.ServerResponse('Hello World!');
};

var query = (request: lib.ServerRequest) => {
    return new lib.ServerResponse(JSON.stringify(request.query));
};

var body = async (request: lib.ServerRequest) => {
    const buffer = await request.bodyBuffer;
    return new lib.ServerResponse(buffer);
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

var promises = async (request: lib.ServerRequest) => {
    var timeout = () => new Promise<number>((resolve, reject) => {
        setTimeout(() => {
            resolve(42);
        }, 5);
    });

    const buffer = await request.bodyBuffer;
	let result = buffer.length;
	
    result += await timeout();
    result += await timeout();
    return new lib.ServerResponse(result.toString());
};

interface SessionData {
	name: string;
}
const store = new lib.SessionStore<SessionData>('session', () => ({ name: '' }), 24 * 60 * 60 /* 1 day */ , 2048);
const session = async (request: lib.ServerRequest) => {
	const session = await store.findOrCreate(request);
	let response = 'Name: ' + session.data.name;
	console.log('session', session.data.name, request.query);
	const newName = request.query['name'];
	if (typeof newName === 'string') {
		session.data.name = newName;
		response += '\nNew name: ' + session.data.name;
	}
	const serverResponse = new lib.ServerResponse(response);
	serverResponse.setCookie(store.toCookie(session));
	return serverResponse;
};
