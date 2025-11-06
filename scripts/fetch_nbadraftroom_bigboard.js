const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

async function fetchHtml(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Fetch failed: ' + res.status);
  return await res.text();
}

async function parseBigBoard(html) {
  const $ = cheerio.load(html);
  // Prefer parsing the big board table inside the article (entry-content). The NBADraftRoom big board is published
  // as a wp-block-table / <table> with rows where the first <td> often contains the rank and the second contains
  // the player's name and description (the <a> inside the second <td> is the player's page link and contains the clean name).
  const candidates = [];
  const seen = new Set();

  // Find tables inside the article/content and pick the one with the most rows (likely the big board)
  const tables = $('.entry-content table, article table, .wp-block-table table').toArray();
  let bestTable = null;
  let bestRows = 0;
  for (const t of tables) {
    const rows = $(t).find('tbody tr').length || $(t).find('tr').length;
    if (rows > bestRows) {
      bestRows = rows;
      bestTable = t;
    }
  }

  if (bestTable && bestRows > 0) {
    $(bestTable).find('tbody tr, tr').each((i, tr) => {
      const tds = $(tr).find('td').toArray();
      if (tds.length < 2) return; // skip weird rows
      const first = $(tds[0]).text().trim();
      // second cell usually contains the name (often as an <a> tag)
      const second = $(tds[1]);

      // skip tier header rows (contain 'TIER' or 'Back to the mock draft' or are empty)
      const secondText = second.text().trim();
      if (!secondText) return;
      const skipPatterns = [/TIER/i, /Back to the mock draft/i, /^>$/, /^</, /About The Tiers/i];
      if (skipPatterns.some(rx => rx.test(secondText))) return;

      // Prefer the <a> text if available (clean player name)
      let name = null;
      const a = second.find('a').first();
      let link = null;
      if (a && a.length) {
        name = a.text().trim();
        const href = a.attr('href');
        if (href) link = href.trim();
      } else {
        // fallback: try to extract the leading name in the cell (before the dash/–/—)
        const txt = secondText.replace(/\s{2,}/g, ' ');
        const m = txt.match(/^([A-Z][A-Za-z'`\-\. ]+?)(?:\s+[\-–—]\s+|\s+–\s+|\s+—\s+|,|\(|$)/);
        name = m ? m[1].trim() : txt.split('\n')[0].trim();
      }

      // derive rank if possible
      let rank = null;
      const rankMatch = first.match(/(\d{1,2})/);
      if (rankMatch) rank = Number(rankMatch[1]);

      if (!name) return;
      name = name.replace(/[.,;:\s]+$/, '');
      const key = name.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      candidates.push({ rank, name, extra: null, link, cellText: secondText });
    });
  }

  // If parsing the table yielded too few results, fall back to previous heuristics
  if (candidates.length < 20) {
    const text = $('body').text();
    const lines = text.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
    // Pattern matches like: "1. John Doe", "1 - John Doe", "1 — John Doe" followed optionally by ", School" or "(School)"
    const rankNameRe = /^\s*(\d{1,2})\s*[\.\-|–|—]?\s*([A-Z][A-Za-z'`\-\. ]+?)(?:\s*[,\(\-–—]\s*([^\n\r]+?))?\s*$/;
    for (const line of lines) {
      const m = line.match(rankNameRe);
      if (m) {
        const rank = Number(m[1]);
        let name = m[2].replace(/\s{2,}/g,' ').trim();
        name = name.replace(/[.,;:\s]+$/,'');
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        candidates.push({ rank, name, extra: null, link: null, cellText: null });
      }
    }
  }

  // Final sanity: ensure unique order-preserving and limit to 70
  const uniq = [];
  const uSet = new Set();
  for (const c of candidates) {
    const key = c.name.toLowerCase();
    if (uSet.has(key)) continue;
    uSet.add(key);
    uniq.push(c);
    if (uniq.length >= 70) break;
  }

  // Enrich candidates by visiting their links (where available) to extract school/position/height
  // helper for escaping regex
  function escRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // normalize position to PG/SG/SF/PF/C where possible
  function normalizePosition(pos) {
    if (!pos) return null;
    const p = String(pos).toLowerCase();
    if (/point/.test(p) || /\bpg\b/.test(p)) return 'PG';
    if (/shooting/.test(p) || /\bsg\b/.test(p)) return 'SG';
    if (/small/.test(p) || /\bsf\b/.test(p)) return 'SF';
    if (/power/.test(p) || /\bpf\b/.test(p)) return 'PF';
    if (/center/.test(p) || /\bc\b/.test(p) || /centre/.test(p)) return 'C';
    // common combos like G/F or F/G -> pick the primary letter
    const m = p.match(/\b([pgsfc])[\s\/-]?([pgsfc])?\b/);
    if (m) return m[1].toUpperCase() + (m[2] ? ',' + m[2].toUpperCase() : '');
    // heuristics: generic words
    if (/wing/.test(p)) return 'SF';
    if (/guard/.test(p)) return 'PG,SG';
    if (/forward/.test(p)) return 'SF,PF';
    return null;
  }

  // normalize heights to format like "6-9" (feet-inches)
  function normalizeHeight(h) {
    if (!h) return null;
    let s = String(h).replace(/”|"/g, '"').replace(/[’‘`]/g, "'").trim();
    // patterns: 6-9, 6'9, 6 ft 9 in, 6ft9, 6 9, 6-09
    // try feet'inches with apostrophe
    let m = s.match(/(\d)\s*[']\s*(\d{1,2})/);
    if (!m) m = s.match(/(\d)\s*[-–]\s*(\d{1,2})/);
    if (!m) m = s.match(/(\d)\s*ft\s*(\d{1,2})/i);
    if (!m) m = s.match(/(\d)\s*(\d{2})\b/); // fallback like 6 09
    if (m) {
      const feet = parseInt(m[1], 10);
      const inches = parseInt(m[2], 10);
      if (!Number.isNaN(feet) && !Number.isNaN(inches)) return `${feet}-${inches}`;
    }
    // sometimes it appears as 79 or 711 (inches) - ignore those
    // as a last resort, try to find a pattern like 7-1 or 6-11 earlier
    m = s.match(/\b(\d{1})[-–](\d{1,2})\b/);
    if (m) return `${parseInt(m[1],10)}-${parseInt(m[2],10)}`;
    return null;
  }

  // clean a school string: remove parentheticals and trailing commentary
  function cleanSchool(s) {
    if (!s) return null;
    let out = String(s).trim();
    // remove trailing notes after a comma or semicolon that are not part of school
    out = out.split(/[;,]/)[0].trim();
    // remove parentheses content
    out = out.replace(/\([^\)]*\)/g, '').trim();
    // remove multiple spaces
    out = out.replace(/\s{2,}/g, ' ');
    // strip trailing punctuation
    out = out.replace(/[\.:;,-]+$/g, '').trim();
    // if the remaining string looks like "School – description" or includes sentence-like verbs,
    // split on common sentence-start words and keep the left side as the school
    const splitOn = [/\b is \b/i, /\b looks? \b/i, /\b will \b/i, /\b who \b/i, /\b that \b/i, /\b has \b/i, /\b likely \b/i, /\b could \b/i];
    for (const rx of splitOn) {
      const m = out.match(rx);
      if (m) {
        out = out.split(rx)[0].trim();
        break;
      }
    }
    return out || null;
  }

  async function enrichCandidate(c, forceFetch = false) {
    const result = { name: c.name, rank: c.rank || null, position: null, school: null, height: null, weight: null, notes: null };

    // First, try to parse the table cell text (this is the most reliable source on the big board page)
    if (c.cellText) {
      let cell = c.cellText;
      // remove the name from the start if present
      const nameRegex = new RegExp('^' + escRegex(c.name), 'i');
      cell = cell.replace(nameRegex, '').trim();

      // Try an explicit "– height – school" pattern first (most reliable)
      const explicit = cell.match(/[–—-]\s*(\d{1,2}['’]?[-–]?\d{1,2}|\d{1,2}-\d{1,2}|\d'\d{1,2})\s*[–—-]\s*([^\n\r]+)/);
      if (explicit) {
        result.height = explicit[1].trim();
        // school may include trailing punctuation; take the first sentence-like segment
        result.school = explicit[2].split(/[.,;\n]/)[0].trim();
      } else {
        // split on em-dash / en-dash / hyphen
        const parts = cell.split(/[–—-]/).map(s => s.trim()).filter(Boolean);
        // look for height in the first part
        if (parts.length > 0) {
          const h = parts[0].match(/\b(\d{1,2}[’'\"]?[-–]?\d{1,2}|\d{1,2}-\d{1,2}|\d{1}\.\d{1})\b/);
          if (h) result.height = h[0];
        }
        // school is often the last meaningful part
        if (parts.length >= 2) {
          result.school = parts[parts.length - 1].split(/[.,;\n]/)[0].trim();
        }
      }

      // position: try to find position words inside the cell text
      const posMatchCell = cell.match(/\b(PG|SG|SF|PF|C|Point Guard|Shooting Guard|Small Forward|Power Forward|Center)\b/i);
      if (posMatchCell) result.position = posMatchCell[0];
      if (result.height || result.school || result.position) result.notes = 'Parsed from big board cell';
    }

    // If vital fields still missing or forceFetch requested and a link exists, try to fetch the player's page for more info
    if ((forceFetch || !result.school || !result.height || !result.position) && c.link) {
      try {
        const playerHtml = await fetchHtml(c.link);
        const $$ = cheerio.load(playerHtml);
        const p = $$('.entry-content p').first().text().trim() || $$('article p').first().text().trim() || $$('.post p').first().text().trim();
        const fullText = (p || $$('article').text() || $$('body').text() || '').replace(/\s+/g, ' ').trim();

        if (!result.height) {
          const heightMatch = fullText.match(/(\d\s*[']\s*\d{1,2}|\d[-–]\d{1,2}|\d\s*ft\s*\d{1,2}|\d\s?ft\s*\d{1,2}in)/i);
          if (heightMatch) result.height = normalizeHeight(heightMatch[0]);
        }
        if (!result.school) {
          // try pattern Name – 6-5 – School
          const afterName = p ? p.replace(new RegExp(escRegex(c.name), 'i'), '').trim() : '';
          const schoolMatch = afterName.match(/[-–—]\s*([^\-–—\(\n]+)/);
          if (schoolMatch) result.school = cleanSchool(schoolMatch[1].trim());
        }
        if (!result.position) {
          const posMatch = fullText.match(/\b(PG|SG|SF|PF|C|Point Guard|Shooting Guard|Small Forward|Power Forward|Center)\b/i);
          if (posMatch) result.position = normalizePosition(posMatch[0]);
        }
        if (!result.notes) result.notes = 'Enriched from player page';
      } catch (e) {
        // ignore fetch errors
      }
    }

    // Final normalization: position from cell text if present
    if (!result.position && c.cellText) {
      const posMatchCell = c.cellText.match(/\b(PG|SG|SF|PF|C|Point Guard|Shooting Guard|Small Forward|Power Forward|Center)\b/i);
      if (posMatchCell) result.position = normalizePosition(posMatchCell[0]);
    }
    // normalize height if it was parsed earlier but not normalized
    if (result.height) result.height = normalizeHeight(result.height) || result.height;
    // if school still contains extra descriptive text, try to clean it and capture leftover as notes
    if (result.school) {
      const rawSchool = result.school;
      let cleaned = cleanSchool(rawSchool) || rawSchool;
      // if cleaned ends with the player's last name (e.g., "Duke â€“ Boozer"), strip the trailing surname
      try {
        const parts = String(c.name || '').split(' ');
        const lastName = parts.length ? parts[parts.length-1] : null;
        if (lastName) {
          const ln = lastName.toLowerCase();
          if (cleaned.toLowerCase().endsWith(ln)) {
            cleaned = cleaned.substring(0, cleaned.length - lastName.length).trim();
          }
        }
      } catch(e) {}
      result.school = cleaned;
      const leftover = rawSchool.replace(cleaned, '').trim();
      if (leftover) result.notes = (result.notes ? result.notes + ' | ' : '') + leftover.replace(/^[-–—:,]+/,'').trim();
    }
    // if we have cellText that contains additional notes beyond school, capture them
    if (c.cellText && result.school) {
      const idx = c.cellText.indexOf(result.school);
      if (idx >= 0) {
        const before = c.cellText.substring(0, idx).replace(c.name, '').trim();
        const after = c.cellText.substring(idx + result.school.length).trim();
        const notesParts = [];
        if (before) notesParts.push(before.replace(/^[-–—:,]+/,'').trim());
        if (after) notesParts.push(after.replace(/^[-–—:,]+/,'').trim());
        if (notesParts.length > 0) result.notes = (result.notes ? result.notes + ' | ' : '') + notesParts.join(' | ');
      }
    }

    // ensure position is normalized final time
    if (result.position) result.position = normalizePosition(result.position) || result.position;

    return result;
  }

  // enrich up to first 70 candidates but do it sequentially to avoid rate limits
  const enriched = [];
  for (let i = 0; i < uniq.length; i++) {
    const c = uniq[i];
    const force = i < 45; // force fetch for top-45
    const info = await enrichCandidate(c, force);
    enriched.push(Object.assign({}, c, info));
  }

  return enriched;
}

(async ()=>{
  const url = process.argv[2] || 'https://nbadraftroom.com/2026-nba-draft-big-board-1-0';
  console.log('Fetching NBAdraftroom big board from', url);
  try {
    const html = await fetchHtml(url);
    const players = await parseBigBoard(html);
    if (!players || players.length === 0) {
      console.error('No players parsed. Aborting.');
      process.exit(2);
    }
  // Map top 45 into prospects file (use enriched fields if present)
  const limit = 45;
  const prospects = players.slice(0,limit).map((p,i)=>({ id: i+1, name: p.name, position: p.position || null, school: p.school || null, height: p.height || null, weight: p.weight || null, talent: 90 - i, notes: p.notes || 'Imported from NBADraftRoom big board', rank: p.rank }));
    const outPath = path.resolve(__dirname, '../src/assets/nba2026_prospects.json');
    fs.writeFileSync(outPath, JSON.stringify(prospects, null, 2), 'utf8');
    console.log('Wrote', outPath, 'with', prospects.length, 'prospects');
    // print top 10
    console.log('Top 10:');
  prospects.slice(0,10).forEach(p => console.log(`${p.id}. ${p.name}${p.position ? ' — ' + p.position : ''}${p.school ? ' — ' + p.school : ''}${p.height ? ' — ' + p.height : ''}`));
  } catch (e) {
    console.error('Error', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
