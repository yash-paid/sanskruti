import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

function netlifyFunctionsPlugin() {
  return {
    name: 'netlify-functions-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/.netlify/functions/')) {
          try {
            const parsedUrl = new URL(req.url, 'http://localhost');
            const parts = parsedUrl.pathname.split('/.netlify/functions/');
            const funcName = parts[1]?.split('/')[0];
            if (!funcName) return next();

            const funcPath = path.resolve(__dirname, `../netlify/functions/${funcName}.js`);
            if (!fs.existsSync(funcPath)) return next();

            const fileUrl = pathToFileURL(funcPath).href + `?t=${Date.now()}`;
            const mod = await import(fileUrl);
            const handler = mod.handler || mod.default?.handler;
            if (!handler) return next();

            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              const queryParams = {};
              for (const [k, v] of parsedUrl.searchParams.entries()) {
                queryParams[k] = v;
              }

              const event = {
                httpMethod: req.method,
                headers: req.headers,
                queryStringParameters: queryParams,
                body: body,
              };
              const response = await handler(event, {});
              res.writeHead(response.statusCode, response.headers || {});
              res.end(response.body);
            });
            return;
          } catch (e) {
            console.error('Local netlify function error:', e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
            return;
          }
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), netlifyFunctionsPlugin()],
  base: './',
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    emptyOutDir: true,
  },
});

