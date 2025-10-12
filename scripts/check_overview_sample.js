const espn = require('../src/utils/espnApi');

async function run() {
  const ids = [4030793,  3916259,  4035528]; // Justin Herbert, Keenan Allen, Austin Ekeler (example ids)
  for (const id of ids) {
    try {
      const ov = await espn.getAthleteOverview('nfl', String(id));
      console.log('---', id, ov?.name || 'no name');
      console.dir({ seasons: ov?.seasons?.slice(0,3) }, { depth: 4 });
    } catch (e) { console.error('err', id, e && e.message); }
  }
}

run();
