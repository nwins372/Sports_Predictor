const fs = require('fs');
const path = require('path');

// Copy checked-in db/espn/nfl JSONs into public/db/espn/nfl so the client dev server serves them.
const src = path.join(__dirname, '..', '..', 'db', 'espn', 'nfl');
const dst = path.join(__dirname, '..', '..', 'public', 'db', 'espn', 'nfl');

function main() {
  if (!fs.existsSync(src)) { console.error('Source NFL dir not found:', src); process.exit(1); }
  if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
  const files = fs.readdirSync(src).filter(f => f.endsWith('.json'));
  for (const f of files) {
    const s = path.join(src, f);
    const d = path.join(dst, f);
    fs.copyFileSync(s, d);
    console.log('Copied', f);
  }
  console.log('Sync complete.');
}

main();
