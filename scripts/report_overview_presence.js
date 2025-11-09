const fs = require('fs');
const path = require('path');
const dataPath = path.join(__dirname, '..', 'tmp_player_fetch.json');
const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const targets = ['nfl|13241','nfl|3918298','nfl|3043078','nfl|4361307','nfl|4262921','nfl|4040982','nfl|3043107','nfl|4427250','nba|3975','nba|4593125'];

function hasKeyRecursive(obj, keys) {
  let found = {};
  const seen = new Set();
  function walk(o) {
    if (!o || typeof o !== 'object') return;
    if (seen.has(o)) return; seen.add(o);
    for (const k of Object.keys(o)) {
      const lower = k.toLowerCase();
      for (const key of keys) if (lower.includes(key)) found[key]=true;
      walk(o[k]);
    }
  }
  walk(obj);
  return found;
}

const keysToCheck = ['stats','statistics','story','stories','news','article','bio','college','draft','contract','transaction','injury'];
const report = [];
for (const t of targets) {
  const entry = raw[t];
  if (!entry) { report.push({key:t, found:false}); continue; }
  const r = {
    key: t,
    id: entry.id || entry.espnId || null,
    name: entry.name || null,
    hasHead: !!entry.head,
    hasTeam: !!entry.team,
    teamLogos: (entry.team && entry.team.logos && entry.team.logos.length) || 0,
    hasRaw: !!entry.raw,
  };
  const found = hasKeyRecursive(entry, keysToCheck);
  r.found = found;
  // quick detect stats arrays on top-level
  r.topLevelStats = !!(entry.stats || (entry.raw && entry.raw.stats) || (entry._overview && entry._overview.statistics));
  report.push(r);
}
console.log(JSON.stringify(report, null, 2));
