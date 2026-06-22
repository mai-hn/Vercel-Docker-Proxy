const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');
const https = require('node:https');

const proxy = require('../api/proxy');

function invoke(handler, host) {
	return new Promise((resolve, reject) => {
		const req = {
			url: '/v2/',
			method: 'GET',
			headers: { host, 'user-agent': 'Docker-Client' },
		};
		const res = new Writable({
			write(chunk, encoding, callback) {
				callback();
			},
		});
		res.writeHead = () => {};
		res.once('finish', resolve);
		handler(req, res).catch(reject);
	});
}

test('routes Docker Hub after an alternate registry without sharing upstream state', async () => {
	const originalRequest = https.request;
	const requestedUrls = [];

	https.request = (url, options, callback) => {
		requestedUrls.push(url);
		const request = new EventEmitter();
		request.end = () => {
			const response = Readable.from([]);
			response.statusCode = 401;
			response.headers = {};
			queueMicrotask(() => callback(response));
		};
		return request;
	};

	try {
		await invoke(proxy, 'ghcr.proxy.xecho.me');
		await invoke(proxy, 'docker.proxy.xecho.me');
	} finally {
		https.request = originalRequest;
	}

	assert.deepEqual(requestedUrls, [
		'https://ghcr.io/v2/',
		'https://registry-1.docker.io/v2/',
	]);
});
