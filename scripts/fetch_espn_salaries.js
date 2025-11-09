#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const yearArg = process.argv[2] || `${new Date().getFullYear()}`;
const year = String(yearArg);

const outDir = path.resolve(__dirname, '../public/db/espn');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const normalizeSalary = (s) => {
  if (!s) return 0;
  const n = String(s).replace(/[^0-9.-]+/g, '');
  const v = Number(n);
  return isNaN(v) ? 0 : v;
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log(`Fetching ESPN NBA salaries for season ${year}...`);
  const results = [];
  let page = 1;
  // try multiple URL templates to support different ESPN URL formats and the season dropdown
  const urlTemplates = [
    (p) => `https://www.espn.com/nba/salaries/_/year/${year}/page/${p}`,
    (p) => `https://www.espn.com/nba/salaries/_/page/${p}`,
    (p) => `https://www.espn.com/nba/salaries/_/season/${year}/page/${p}`,
  ];
  while (page < 100) {
    let pageText = null;
    let usedUrl = null;
    for (const makeUrl of urlTemplates) {
      const tryUrl = makeUrl(page);
      console.log('TRY', tryUrl);
      try {
        const res = await fetch(tryUrl, { headers: { 'User-Agent': 'node-fetch' } });
        if (!res.ok) { console.log('Non-OK response', res.status, 'for', tryUrl); continue; }
        const text = await res.text();
        // Verify this page looks like salaries table
        const $ = cheerio.load(text);
        const rows = $('table tbody tr');
        if (rows && rows.length > 0) { pageText = text; usedUrl = tryUrl; break; }
      } catch (e) {
        console.log('Fetch error for', tryUrl, e && e.message ? e.message : e);
        continue;
      }
      // be polite small delay between tries
      await sleep(200);
    }
    if (!pageText) {
      console.log('No rows found on any url for page', page, '— stopping.');
      break;
    }
    console.log('GET', usedUrl);
    try {
      const $ = cheerio.load(pageText);
      // find table rows
      const rows = $('table tbody tr');
      if (!rows || rows.length === 0) {
        console.log('No more rows, stopping at page', page);
        break;
      }
      rows.each((i, el) => {
        const tds = $(el).find('td');
        if (!tds || tds.length < 2) return;
        // heuristic: player name likely in second cell
        const nameCell = tds.eq(1);
        // get anchor if present for more reliable name / player id
        const a = nameCell.find('a');
        const nameText = a && a.length ? a.text().trim() : nameCell.text().trim();
        const href = a && a.length ? a.attr('href') : null;
        // team often in third cell
        const team = tds.eq(2).text().trim();
        // salary likely in last cell
        const salaryCell = tds.eq(tds.length - 1);
        const salaryStr = salaryCell.text().trim();
        const salary = normalizeSalary(salaryStr);
        // try to extract player id from href if present (e.g., /nba/player/_/id/xxxxx/name/...)
        let playerId = null;
        if (href) {
          const m = href.match(/\/(?:player|athlete)\/_\/id\/(\d+)/i);
          if (m && m[1]) playerId = m[1];
        }
        if (nameText) results.push({ name: nameText, team, salary, salaryRaw: salaryStr, href: href || null, playerId });
      });
      page += 1;
      // be polite
      await sleep(800);
    } catch (e) {
      console.error('Fetch error', e && e.message ? e.message : e);
      break;
    }
  }

  const outFile = path.join(outDir, `nba_salaries_${year}.json`);
  fs.writeFileSync(outFile, JSON.stringify({ year, generated: new Date().toISOString(), list: results }, null, 2));
  // Also write a default copy
  try { fs.writeFileSync(path.join(outDir, `nba_salaries.json`), JSON.stringify({ year, generated: new Date().toISOString(), list: results }, null, 2)); } catch (e) {}

  console.log(`Wrote ${results.length} salary entries to ${outFile}`);
})();
