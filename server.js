const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const port = Number(process.env.PORT || 3000);
const distDir = path.join(__dirname, 'public_html');
const indexPath = path.join(distDir, 'index.html');

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function setCommonHeaders(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  response.setHeader('Content-Type', mimeTypes[extension] || 'application/octet-stream');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (filePath.includes(`${path.sep}assets${path.sep}`)) {
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return;
  }

  response.setHeader('Cache-Control', 'no-cache');
}

function sendFile(response, filePath, method) {
  fs.readFile(filePath, (error, buffer) => {
    if (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Failed to read file.');
      return;
    }

    setCommonHeaders(response, filePath);
    response.statusCode = 200;

    if (method === 'HEAD') {
      response.end();
      return;
    }

    response.end(buffer);
  });
}

function resolveStaticFile(pathname) {
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const normalizedRequest = path.normalize(requestedPath).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(distDir, normalizedRequest);
  const normalizedFilePath = path.normalize(filePath);

  if (!normalizedFilePath.startsWith(distDir)) {
    return null;
  }

  if (fs.existsSync(normalizedFilePath) && fs.statSync(normalizedFilePath).isFile()) {
    return normalizedFilePath;
  }

  return null;
}

const server = http.createServer((request, response) => {
  const method = request.method || 'GET';

  if (!['GET', 'HEAD'].includes(method)) {
    response.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Method not allowed');
    return;
  }

  if (!fs.existsSync(indexPath)) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Web build not found. Run `npm run build` before starting the server.');
    return;
  }

  const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  if (requestUrl.pathname === '/api' || requestUrl.pathname.startsWith('/api/')) {
    response.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ error: 'Backend API is hosted on api2.codeyourcareer.my.id.' }));
    return;
  }

  const staticFile = resolveStaticFile(requestUrl.pathname);

  if (staticFile) {
    sendFile(response, staticFile, method);
    return;
  }

  sendFile(response, indexPath, method);
});

server.listen(port, () => {
  console.log(`Web app listening on http://localhost:${port}`);
});
