phaethon
========
Fast, promise-based, non-magical server package for node.js.

Use it with TypeScript:
```typescript
import * as phaethon from 'phaethon';

var server = new phaethon.Server();

server.listener = request => {
    var path = request.path.toLowerCase();

    if (path === '/') return new phaethon.ServerResponse('Hello World!');
    if (path === '/hello') return new phaethon.ServerResponse('Hello, ' + request.query.name + '!');
    
	throw new phaethon.ServerError(phaethon.http.Status.ClientErrorNotFound);
};

server.listenHttp(8800);
```

Or plain JavaScript:
```typescript
var phaethon = require('phaethon');

var server = new phaethon.Server();

server.listener = function(request) {
    var path = request.path.toLowerCase();

    if (path === '/') return new phaethon.ServerResponse('Hello World!');
    if (path === '/hello') return new phaethon.ServerResponse('Hello, ' + request.query.name + '!');
    
	throw new phaethon.ServerError(404);
};

server.listenHttp(8800);
```

Installation
------------
```
npm install phaethon
```
The package includes TypeScript declarations. It's not necessary to reference some declaration file, TypeScript will automatically find it.

Features
--------
* ES6 Promise based
* Focus on performance
* No callback hell

Routing
-------
A router is just a function in phaethon, so you can write your router like this:
```typescript
server.listener = (request: phaethon.ServerRequest) => {
    var path = request.path.toLowerCase();

    if (path === '/') return home(request);
	if (path === '/account') return account(request);
    
	throw new phaethon.ServerError(404);
};
function home(request: phaethon.ServerRequest) {
	return new phaethon.ServerResponse('Hello World!');
}
function account(request: phaethon.ServerRequest) {
	return new phaethon.ServerResponse('Your account');
}

```

Promises
--------
The listener callback may return a promise, actually in most cases it will return one. Example:
```typescript
declare function somePromiseTask(input: string): Promise<string>;

server.listener = (request: phaethon.ServerRequest) => {
	var values: string[] = [];
	somePromiseTask('').then(valueA => {
		values.push(valueA);
		console.log(valueA);
		return somePromiseTask(valueA);
	}).then(valueB => {
		values.push(valueB);
		return somePromiseTask(valueB);
	}).then(valueC => {
		return new phaethon.ServerResponse(values.join(',') + '; ' + valueC);
	}).catch((e) => {
		throw new phaethon.ServerError(404);
	});
}
```
Errors will be catched by phaethon. If a ServerError is catched, it will be shown to the user. ServerError is a class that just has the status code of the error and optionally a text and headers. Otherwise the user will see `500 Internal server error.`

Async functions
---------------
You can also use phaethon with async functions, since async functions use promises. You can use Babel or TypeScript to transpile async functions. For TypeScript, set `target` to `es6` and `experimentalAsyncFunctions` to `true`.
Same example as above:
```typescript
declare function somePromiseTask(input: string): Promise<string>;

server.listener = async (request: phaethon.ServerRequest) => {
	try {
		var values: string[] = [];
		var valueA = await somePromiseTask('');
		values.push(valueA);
		console.log(valueA);
		var valueB = await somePromiseTask(valueA);
		values.push(valueB);
		var valueC = await somePromiseTask(valueB);
		return new phaethon.ServerResponse(values.join(',') + '; ' + valueC);
	} catch (e) {
		throw new phaethon.ServerError(404);
	};
}
```
