const fs = require('fs');
const path = require('path');
const dataPath = path.join(__dirname, '..', 'tmp_player_fetch.json');
const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const keys = Object.keys(raw).sort();

function mapKey(lbl){
  return String(lbl).replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'').toLowerCase();
}

const report = {};
for(const k of keys){
  const entry = raw[k];
  // Try several places where statistics may live
  let overview = entry.overview || (entry.fetched && entry.fetched.raw) || (entry.full && entry.full.raw) || null;
  let statsRoot = null;
  if (overview) statsRoot = overview.statistics || overview.stats || overview.player?.statistics || overview.player?.stats || null;
  // fallback: look inside fetched.seasons[*].raw.statistics
  if (!statsRoot && entry.fetched && Array.isArray(entry.fetched.seasons)) {
    for (const s of entry.fetched.seasons) {
      const rr = s && s.raw && (s.raw.statistics || s.raw.stats || s.raw.player?.statistics || s.raw.player?.stats);
      if (rr) { statsRoot = rr; break; }
    }
  }
  // also check overview.seasons[*].raw.statistics when overview exists
  if (!statsRoot && overview && Array.isArray(overview.seasons)) {
    for (const s of overview.seasons) {
      const rr = s && s.raw && (s.raw.statistics || s.raw.stats || s.raw.player?.statistics || s.raw.player?.stats);
      if (rr) { statsRoot = rr; break; }
    }
  }
  if (!statsRoot) { report[k] = { error: 'no statsRoot' }; continue; }
  const labels = statsRoot.displayNames || statsRoot.labels || statsRoot.names || [];
  const splits = statsRoot.splits || statsRoot.Splits || [];
  if (!Array.isArray(splits) || splits.length===0) { report[k] = { error: 'no splits' }; continue; }
  // prefer Regular Season
  let reg = splits.find(s => String(s.displayName||s.label||'').toLowerCase().includes('regular')) || splits[0];
  const values = Array.isArray(reg.stats) ? reg.stats : (reg.stats && typeof reg.stats === 'object' ? Object.values(reg.stats) : []);
  const mapped = {};
  for(let i=0;i<labels.length;i++){
    const lbl = labels[i] || `col${i}`;
    const keyName = mapKey(lbl);
    let rawVal = values[i] !== undefined && values[i] !== null ? values[i] : null;
    if (rawVal !== null) rawVal = String(rawVal).replace(/,/g,'');
    const val = rawVal !== null && rawVal !== '' ? (isNaN(Number(rawVal)) ? rawVal : Number(rawVal)) : null;
    mapped[keyName] = val;
  }
  report[k] = { name: entry.fetched && entry.fetched.name, regularSplitName: reg.displayName || reg.label || reg.name, mappedKeys: mapped };
}

console.log(JSON.stringify(report, null, 2));
