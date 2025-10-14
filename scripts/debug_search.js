const espn = require('../src/utils/espnApi');

async function run() {
  const queries = ['Justin Herbert', 'Keenan Allen', 'Austin Ekeler'];
  for (const q of queries) {
    console.log('--- SEARCH:', q);
    const local = await espn.searchPlayersLocal(q, 'nfl', 10);
    console.log('local matches:', local.slice(0,5));
    const sp = await espn.searchPlayers(q, 10);
    console.log('remote search results samples:', (sp && sp.results && sp.results.slice(0,3).map(r => ({ id: r.object?.id || r.id, name: r.object?.displayName || r.displayName || r.name }))) || []);
    if (local && local.length) {
      for (const p of local.slice(0,3)) {
        // try to extract numeric id similar to Player.jsx
        const extractNumericId = (obj, fallbackId) => {
          if (String(fallbackId).match(/^\d+$/)) return String(fallbackId);
          try {
            const head = obj?.img || obj?.head || null;
            if (head) {
              const m = String(head).match(/\/(?:full|players)\/(?:full\/)?(\d+)\.png/) || String(head).match(/\/(\d+)\.png/);
              if (m && m[1]) return m[1];
            }
          } catch (e) {}
          return null;
        };
        const aid = extractNumericId(p, p.id);
        console.log('extracted athleteId for', p.name, aid);
        const ov = await espn.getAthleteOverview('nfl', aid || p.id || p.name);
        console.log('overview for', p.name, ov && ov.seasons && ov.seasons[0] ? Object.keys(ov.seasons[0].stats).slice(0,20) : 'no seasons');
      }
    }
  }
}

run();
