const espnApi = require('../src/utils/espnApi');

async function run(id) {
  console.log('Checking id', id);
  try {
    const p = await espnApi.getPlayer('nfl', id);
    console.log('\ngetPlayer result:\n', JSON.stringify(p && ( { id: p.id, name: p.name, height: p.height, weight: p.weight, seasons: (p.seasons||[]).length, currentSeasonStats: !!p.currentSeasonStats } ), null, 2));
  } catch (e) { console.error('getPlayer error', e && e.message); }

  try {
    const pf = await espnApi.getPlayerFull('nfl', id);
    console.log('\ngetPlayerFull result:\n', JSON.stringify(pf && ({ id: pf.id, name: pf.name, height: pf.height, weight: pf.weight, seasons: (pf.seasons||[]).length, hasRaw: !!pf.raw }), null, 2));
  } catch (e) { console.error('getPlayerFull error', e && e.message); }

  try {
    const ov = await espnApi.getAthleteOverview('nfl', id);
    const small = ov ? { id: ov.id, name: ov.name, height: ov.height, displayHeight: ov.displayHeight, weight: ov.weight, displayWeight: ov.displayWeight, seasons: (ov.seasons||[]).length } : null;
    console.log('\ngetAthleteOverview normalized result:\n', JSON.stringify(small, null, 2));
    if (ov && ov.raw && typeof ov.raw === 'object') {
      try {
        console.log('\ngetAthleteOverview raw top-level keys:\n', Object.keys(ov.raw).slice(0,50));
        if (ov.raw.statistics && typeof ov.raw.statistics === 'object') {
          console.log('\nraw.statistics keys:', Object.keys(ov.raw.statistics));
          if (ov.raw.statistics.player) console.log('\nraw.statistics.player keys:', Object.keys(ov.raw.statistics.player));
          try {
            console.log('\nraw.statistics.displayName:', ov.raw.statistics.displayName || null);
            if (Array.isArray(ov.raw.statistics.splits) && ov.raw.statistics.splits.length) {
              console.log('\nraw.statistics.splits[0] keys:', Object.keys(ov.raw.statistics.splits[0] || {}).slice(0,50));
              console.log('\nraw.statistics.splits[0] preview:', JSON.stringify(ov.raw.statistics.splits[0], (k,v) => (typeof v === 'object' && v && Object.keys(v).length>20)? '[Object]' : v, 2).slice(0,2000));
            }
          } catch (e) {}
        }
        if (ov.raw.athlete) console.log('\nraw.athlete keys:', Object.keys(ov.raw.athlete));
        if (ov.raw.player) console.log('\nraw.player keys:', Object.keys(ov.raw.player));
      } catch (e) {}
    }
  } catch (e) { console.error('getAthleteOverview error', e && e.message); }
}

const ids = process.argv.slice(2);
(async () => {
  if (ids.length === 0) {
    console.log('Usage: node debug_athlete_overview.js <id> [id2 ...]');
    process.exit(1);
  }
  for (const id of ids) {
    await run(id);
    console.log('\n----\n');
  }
})();

// Extra helper: optionally call getTeamRoster for a team provided via env TEAM
if (process.env.TEAM) {
  (async () => {
    const team = process.env.TEAM;
    console.log('\nChecking roster for team', team);
    try {
      const roster = await (require('../src/utils/espnApi')).getTeamRoster('nfl', team);
      console.log('Roster length:', (roster || []).length);
      // print first 3 players keys
      const sample = roster.slice(0,3).map(r => ({ id: r.id, name: r.name, height: r.height, weight: r.weight, position: r.position }));
      console.log('Sample roster entries:', JSON.stringify(sample, null, 2));
    } catch (e) { console.error('getTeamRoster error', e && e.message); }
  })();
}
