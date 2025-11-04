const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

async function fetchUrl(u) {
  try {
    const res = await fetch(u);
    if (!res.ok) throw new Error('Fetch failed: ' + res.status);
    return await res.text();
  } catch (e) { throw e; }
}

function extractNamesFromText(text) {
  // simple regex to capture sequences of two capitalized words (First Last)
  const nameRegex = /\b([A-Z][a-z'`-]+)\s+([A-Z][a-z'`-]+)\b/g;
  const stopList = new Set(['The','And','For','With','From','That','This','Which','Have','Has','Will','Their','After','Before','During']);
  const found = new Map();
  let m;
  while ((m = nameRegex.exec(text)) !== null) {
    const a = m[1]; const b = m[2];
    if (a.length < 2 || b.length < 2) continue;
    if (stopList.has(a) || stopList.has(b)) continue;
    const name = `${a} ${b}`;
    // simple filter: exclude common non-person tokens (Team, Game, Coach, NBA, ESPN)
    if (/\b(Team|Game|Coach|NBA|ESPN|Draft|Round|Pick|College|University)\b/i.test(name)) continue;
    found.set(name, (found.get(name)||0)+1);
  }
  // sort by frequency
  const arr = Array.from(found.entries()).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
  return arr.slice(0,30);
}

(async ()=>{
  const url = process.argv[2];
  if (!url) { console.error('Usage: node fetch_nba2026_prospects.js <article_url>'); process.exit(1); }
  console.log('Fetching', url);
  try {
    const html = await fetchUrl(url);
    const $ = cheerio.load(html);
    // get article text if present
    let articleText = '';
    const article = $('article');
    if (article.length) articleText = article.text();
    if (!articleText) articleText = $('body').text();
    const names = extractNamesFromText(articleText);
    if (!names.length) { console.error('No names extracted. Try a different URL or refine extractor.'); process.exit(2); }
    const prospects = names.map((n,i)=>({ id: i+1, name: n, position: null, school: null, height: null, weight: null, talent: null, notes: 'Imported from ' + url }));
    const outPath = path.resolve(__dirname, '../src/assets/nba2026_prospects.json');
    fs.writeFileSync(outPath, JSON.stringify(prospects, null, 2), 'utf8');
    console.log('Wrote', outPath, 'with', prospects.length, 'prospects');
  } catch (e) {
    console.error('Error', e && e.message ? e.message : e);
    process.exit(3);
  }
})();
