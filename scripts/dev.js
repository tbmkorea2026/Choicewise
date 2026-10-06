#!/usr/bin/env node
'use strict';

/**
 * Local dev server: builds the site, serves dist/ with clean URLs,
 * rebuilds on changes to content/, src/ or public/ and live-reloads the browser.
 *
 *   npm run dev            → http://localhost:3000 (drafts included)
 *   npm run preview        → serve the production build without watching
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { build, DIST, ROOT } = require('./build');

const PORT = Number(process.env.PORT) || 3000;
const watch = !process.argv.includes('--no-watch');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

const clients = new Set();

function safeBuild() {
  try {
    build({ includeDrafts: watch, devReload: watch });
    return true;
  } catch (err) {
    console.error(`✖ ${err.message}`);
    return false;
  }
}

safeBuild();

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);

  if (url === '/__reload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write('\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  let file = path.join(DIST, url);
  if (!file.startsWith(DIST)) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!url.endsWith('/')) { res.writeHead(301, { Location: url + '/' }); res.end(); return; }
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': TYPES['.html'] });
    fs.createReadStream(path.join(DIST, '404.html')).pipe(res);
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, () => console.log(`\n  ChoiceWise running at http://localhost:${PORT}\n`));

if (watch) {
  let timer;
  const onChange = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (safeBuild()) for (const c of clients) c.write('data: reload\n\n');
    }, 150);
  };
  for (const dir of ['content', 'src', 'public']) {
    fs.watch(path.join(ROOT, dir), { recursive: true }, onChange);
  }
  console.log('  Watching content/, src/ and public/ for changes…');
}
