const fs = require('fs');

(async ()=>{
  const url = process.argv[2] || 'https://nbadraftroom.com/2026-nba-draft-big-board-1-0';
  console.log('Fetching', url);
  try {
    const res = await fetch(url);
    const txt = await res.text();
    const out = 'tmp_nbadraft_bigboard.html';
    fs.writeFileSync(out, txt, 'utf8');
    console.log('Saved to', out);
  } catch (e) { console.error(e); process.exit(1); }
})();
