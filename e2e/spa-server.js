// Minimal stand-in for Vercel: static Angular build + /api proxy to the Express API.
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = process.argv[2];
const API = 'http://127.0.0.1:3000';
const PORT = Number(process.argv[3] || 4300);
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.ico': 'image/x-icon', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
http.createServer((req, res) => {
  if (req.url.startsWith('/api/') || req.url.startsWith('/uploads/')) {
    const u = new URL(API + req.url);
    const p = http.request({ host: u.hostname, port: u.port, path: u.pathname + u.search, method: req.method, headers: { ...req.headers, host: '127.0.0.1:3000' } }, (r) => {
      res.writeHead(r.statusCode, r.headers); r.pipe(res);
    });
    p.on('error', (e) => { res.writeHead(502); res.end('proxy error ' + e.message); });
    req.pipe(p);
    return;
  }
  const clean = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(ROOT, clean);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(ROOT, 'index.html');
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log('SPA on http://127.0.0.1:' + PORT));
