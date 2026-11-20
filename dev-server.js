const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

const PORT = process.env.PORT || 3000;
if (!process.env.SITE_URL) {
  process.env.SITE_URL = `http://localhost:${PORT}`;
}
const ROOT = __dirname;
const FUNCTIONS_DIR = path.join(ROOT, 'netlify', 'functions');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // ==================== NETLIFY FUNCTIONS DISPATCHER ====================
  let functionName = null;
  if (pathname.startsWith('/api/')) {
    functionName = pathname.slice(5).split('/')[0];
  } else if (pathname.startsWith('/.netlify/functions/')) {
    functionName = pathname.slice(20).split('/')[0];
  }

  if (functionName) {
    const fnFile = path.join(FUNCTIONS_DIR, `${functionName}.js`);
    if (fs.existsSync(fnFile)) {
      let bodyData = '';
      req.on('data', chunk => {
        bodyData += chunk;
      });
      req.on('end', async () => {
        try {
          // Clear require cache for live development reloads
          delete require.cache[require.resolve(fnFile)];
          const { handler } = require(fnFile);
          const netlifyEvent = {
            path: pathname,
            httpMethod: req.method,
            headers: req.headers,
            queryStringParameters: parsedUrl.query ? querystring.parse(parsedUrl.query) : {},
            body: bodyData
          };
          const context = {};
          const result = await handler(netlifyEvent, context);

          res.writeHead(result.statusCode || 200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Idempotency-Key',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            ...(result.headers || {})
          });
          res.end(result.body || '');
        } catch (err) {
          console.error(`[DEV SERVER FUNCTION ERROR] ${functionName}:`, err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }
  }

  // Security block: Prevent public access to backup files
  if (pathname.toUpperCase().includes('BACKUP_')) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  // Normalize path
  if (pathname.toLowerCase() === '/ps' || pathname.toLowerCase() === '/ps/') {
    res.writeHead(301, { 'Location': '/' });
    res.end();
    return;
  } else if (pathname.startsWith('/ps/')) {
    pathname = '/PS/' + pathname.slice(4);
  } else if (pathname === '/ebook' || pathname === '/ebook/') {
    pathname = '/ebook-home.html';
  } else if (pathname === '/connect' || pathname === '/connect/') {
    pathname = '/connect/dist/index.html';
  } else if (pathname === '/meeting' || pathname === '/meeting/') {
    pathname = '/meeting/index.html';
  } else if (pathname.startsWith('/meeting/') && !path.extname(pathname)) {
    pathname = '/meeting/index.html';
  } else if (pathname === '/service' || pathname === '/service/') {
    pathname = '/service-meet/index.html';
  } else if (pathname.startsWith('/service/') && !path.extname(pathname)) {
    pathname = '/service-meet/index.html';
  } else if (pathname === '/wa.vc' || pathname === '/wa.vc/' || pathname === '/wa-vc' || pathname === '/wa-vc/') {
    pathname = '/wa-vc/index.html';
  } else if (pathname === '/') {
    // Primary Homepage is now the PlayStation Events Platform
    pathname = '/index.html';
  }

  let filePath = path.join(ROOT, pathname);

  // If path is a directory, look for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    // Check in service-meet fallback
    const serviceFallback = path.join(ROOT, 'service-meet', pathname);
    if (fs.existsSync(serviceFallback) && !fs.statSync(serviceFallback).isDirectory()) {
      filePath = serviceFallback;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${pathname}`);
      return;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Support video range requests for smooth mp4 streaming
  if (ext === '.mp4') {
    const stat = fs.statSync(filePath);
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      });
      file.pipe(res);
      return;
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': contentType,
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  // Static file delivery
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`500 Server Error: ${err.message}`);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Sanskruti Local Dev Server is LIVE!`);
  console.log(`👉 CONNECT APP:     http://localhost:${PORT}/connect/`);
  console.log(`👉 MEETING APP:     http://localhost:${PORT}/meeting/`);
  console.log(`👉 SERVICE PORTAL:  http://localhost:${PORT}/`);
  console.log(`👉 WA MEET:         http://localhost:${PORT}/wa-vc/WA%20Meet.html`);
  console.log(`==================================================\n`);
});

