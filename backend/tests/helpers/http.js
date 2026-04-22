// INPUT: Express app instances plus request options
// OUTPUT: in-process HTTP response snapshots
// EFFECT: Lets backend tests exercise API routes without starting a network server
const { PassThrough, Readable, Writable } = require('node:stream');

async function invokeApp(app, path, options = {}) {
  const method = options.method || 'GET';
  const bodyString = options.body ? JSON.stringify(options.body) : '';
  const headers = Object.fromEntries(
    Object.entries({
      ...(options.headers || {}),
      ...(bodyString ? { 'content-type': 'application/json' } : {}),
      ...(bodyString ? { 'content-length': Buffer.byteLength(bodyString).toString() } : {}),
    }).map(([key, value]) => [key.toLowerCase(), value])
  );

  const req = new Readable({
    read() {
      if (bodyString) this.push(bodyString);
      this.push(null);
    },
  });

  req.url = path;
  req.method = method;
  req.headers = headers;
  const socket = new PassThrough();
  req.connection = socket;
  req.socket = socket;

  const chunks = [];
  const responseHeaders = {};

  let resolveResponse;
  const done = new Promise((resolve) => {
    resolveResponse = resolve;
  });

  const res = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      callback();
    },
  });

  res.statusCode = 200;
  res.setHeader = (name, value) => {
    responseHeaders[name.toLowerCase()] = value;
  };
  res.getHeader = (name) => responseHeaders[name.toLowerCase()];
  res.removeHeader = (name) => {
    delete responseHeaders[name.toLowerCase()];
  };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.writeHead = (code, maybeHeaders, moreHeaders) => {
    res.statusCode = code;
    const nextHeaders = typeof maybeHeaders === 'object' ? maybeHeaders : moreHeaders;
    if (nextHeaders) {
      for (const [name, value] of Object.entries(nextHeaders)) {
        res.setHeader(name, value);
      }
    }
    return res;
  };
  res.json = (payload) => {
    if (!res.getHeader('content-type')) {
      res.setHeader('content-type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify(payload));
    return res;
  };
  res.send = (payload) => {
    if (typeof payload === 'object' && payload !== null && !Buffer.isBuffer(payload)) {
      return res.json(payload);
    }
    res.end(payload);
    return res;
  };

  const originalEnd = res.end.bind(res);
  res.end = (chunk, encoding, callback) => {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
    }
    originalEnd(callback);
    const text = Buffer.concat(chunks).toString('utf8');
    let json;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }
    resolveResponse({
      statusCode: res.statusCode,
      headers: responseHeaders,
      text,
      json,
    });
  };

  app.handle(req, res);

  return done;
}

module.exports = { invokeApp };
