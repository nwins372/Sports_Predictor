const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

async function fetchHtml(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Fetch failed: ' + res.status);
  return await res.text();
}

async function parseSpotrac(html) {
  const $ = cheerio.load(html);
  const rows = [];

  // Try to find the main table of future picks
  const tables = $('table').toArray();
  let best = null;
  let bestCount = 0;
  for (const t of tables) {
    const r = $(t).find('tr').length;
    if (r > bestCount) { bestCount = r; best = t; }
  }
  if (!best) return rows;

  $(best).find('tbody tr, tr').each((i, tr) => {
    const tds = $(tr).find('td').toArray().map(td => $(td).text().trim());
    if (!tds || tds.length === 0) return;
    // Heuristics: many Spotrac tables have columns: Team (owner), Year, Round, Pick From / Notes
    // We'll capture what we can and filter to year === '2026' or numeric 2026
    const text = tds.join(' | ');
    // try to find a year cell
    const yearCell = tds.find(c => /\b2026\b/.test(c));
    if (!yearCell) return;
    // owner is often the first cell
    const owner = tds[0] || null;
    // attempt to find original team (the "from" team) in any cell
    let from = null;
    for (const c of tds) {
      const m = c.match(/from\s+([A-Za-z\s\.\-\(\)]+)/i);
      if (m) { from = m[1].trim(); break; }
    }
    // round detection
    const round = tds.find(c => /round|1st|1st round|2nd/i.test(c)) || null;
    rows.push({ owner: owner || null, from: from || null, round: round || null, year: 2026, raw: text });
  });
  return rows;
}

(async ()=>{
  const url = process.argv[2] || 'https://www.spotrac.com/nba/draft/future';
  console.log('Fetching Spotrac future picks from', url);
  try {
    const html = await fetchHtml(url);
    const picks = await parseSpotrac(html);
    const outPath = path.resolve(__dirname, '../src/assets/spotrac_2026_picks.json');
    fs.writeFileSync(outPath, JSON.stringify(picks, null, 2), 'utf8');
    console.log('Wrote', outPath, 'with', picks.length, 'entries (2026)');
    if (picks.length > 0) console.log('Sample:', picks.slice(0,5));
  } catch (e) {
    console.error('Error', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
