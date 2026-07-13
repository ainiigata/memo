import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const server = http.createServer(async (req, res) => {
  const requested = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const path = join(root, requested);
  try {
    const body = await readFile(path);
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'text/plain; charset=utf-8' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
});
server.listen(process.env.PORT || 4173, () => console.log(`Kioku Desk: http://localhost:${process.env.PORT || 4173}`));
