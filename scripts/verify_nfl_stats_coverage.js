const espnApi = require('../src/utils/espnApi');
const fs = require('fs');
const path = require('path');

async function loadIndex() {
  const file = path.resolve(__dirname, '../public/db/espn/nfl/player_index.json');
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw);
}

function countHasStats(p) {
  if (!p) return { hasHeight: false, hasWeight: false, seasons: 0, hasCurrent: false };
  const hasHeight = !!(p.height || p.displayHeight || (p.raw && (p.raw.displayHeight || p.raw.height)));
  const hasWeight = !!(p.weight || p.displayWeight || (p.raw && (p.raw.displayWeight || p.raw.weight)));
  const seasons = Array.isArray(p.seasons) ? p.seasons.length : 0;
  const hasCurrent = !!(p.currentSeasonStats || (p.seasons && p.seasons.some(s=>s && (s.stats || Object.keys(s).length>1 && !!s.season))));
  return { hasHeight, hasWeight, seasons, hasCurrent };
}

async function run(sampleLimit = 500) {
  const idx = await loadIndex();
  const ids = Object.keys(idx.byId || {}).slice(0, sampleLimit);
  const report = { total: ids.length, getPlayer: { height:0, weight:0, seasons:0, current:0 }, getPlayerFull: { height:0, weight:0, seasons:0, current:0 }, overview: { height:0, weight:0, seasons:0, current:0 }, examples: [] };

  for (const id of ids) {
    try {
      const p = await espnApi.getPlayer('nfl', id);
      const c = countHasStats(p);
      if (c.hasHeight) report.getPlayer.height++;
      if (c.hasWeight) report.getPlayer.weight++;
      if (c.seasons>0) report.getPlayer.seasons++;
      if (c.hasCurrent) report.getPlayer.current++;

      const pf = await espnApi.getPlayerFull('nfl', id);
      const c2 = countHasStats(pf);
      if (c2.hasHeight) report.getPlayerFull.height++;
      if (c2.hasWeight) report.getPlayerFull.weight++;
      if (c2.seasons>0) report.getPlayerFull.seasons++;
      if (c2.hasCurrent) report.getPlayerFull.current++;

      const ov = await espnApi.getAthleteOverview('nfl', id);
      const c3 = countHasStats(ov);
      if (c3.hasHeight) report.overview.height++;
      if (c3.hasWeight) report.overview.weight++;
      if (c3.seasons>0) report.overview.seasons++;
      if (c3.hasCurrent) report.overview.current++;

      // capture a few examples where overview gave seasons but others didn't
      if (c3.seasons>0 && c.seasons===0 && c2.seasons===0 && report.examples.length<10) {
        report.examples.push({ id, name: idx.byId[id].name, overviewSeasons: c3.seasons });
      }
    } catch (e) {
      // ignore single id errors
    }
  }

  console.log('Sample size:', report.total);
  console.log('\ngetPlayer coverage:', report.getPlayer);
  console.log('\ngetPlayerFull coverage:', report.getPlayerFull);
  console.log('\nathleteOverview coverage:', report.overview);
  console.log('\nExamples where overview provided seasons but other sources did not:');
  console.log(JSON.stringify(report.examples, null, 2));
}

(async ()=>{
  await run(500);
})();
