import http from 'node:http';
import { readFile } from 'node:fs/promises';

const server = http.createServer(async (req, res) => {
  if (req.url !== '/' && req.url !== '/review.html') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  try {
    const html = await readFile(new URL('./cinematic-review/review.html', import.meta.url));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(html);
  } catch {
    res.writeHead(500);
    res.end('Review file unavailable');
  }
});
server.listen(50273, '127.0.0.1', () => console.log('http://127.0.0.1:50273/'));
