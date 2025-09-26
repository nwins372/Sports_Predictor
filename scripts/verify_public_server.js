// One-off helper: serve ./public on port 3000 and fetch two JSON files to verify
const http = require('http');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..', 'public');
const port = 3000;

const server = http.createServer((req, res) => {
  const urlPath = decodeURI(req.url.split('?')[0]);
  const file = path.join(root, urlPath);
  if (!file.startsWith(root)) { res.statusCode = 403; res.end('forbidden'); return; }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.statusCode = 404; res.end('not found'); return; }
    const stream = fs.createReadStream(file);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    stream.pipe(res);
  });
});

server.listen(port, '127.0.0.1', async () => {
  console.log('serve-public listening on', port, 'root', root);
  try {
    const fetch = global.fetch || (await import('node:undici')).fetch;
    const purl = `http://127.0.0.1:${port}/db/espn/nba/player_index.json`;
    const turl = `http://127.0.0.1:${port}/db/espn/nba/San_Antonio.json`;
    const pr = await fetch(purl);
    console.log('player_index.json status', pr.status);
    const pj = await pr.json();
    console.log('player_index byId count:', Object.keys(pj.byId||{}).length);
    const tr = await fetch(turl);
    console.log('San_Antonio.json status', tr.status);
    const tj = await tr.json();
    console.log('San_Antonio keys:', Object.keys(tj).slice(0,6));
  } catch (e) {
    console.error('verify error', e);
  } finally {
    server.close(() => process.exit(0));
  }
});
