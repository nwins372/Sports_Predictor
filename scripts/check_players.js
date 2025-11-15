const espnApi = require('../src/utils/espnApi');
const fs = require('fs');

(async () => {
  const players = [
    { league: 'nfl', id: '3115922' }, // Nick Allegretti (example from earlier)
    { league: 'nfl', id: '3918298' }, // Josh Allen
    { league: 'nfl', id: '4035788' }, // Tyler Biadasz
    { league: 'nfl', id: '4685030' }, // Brandon Coleman (example)
    // user requested set (numeric espn ids resolved from player_index.json)
    { league: 'nfl', id: '13241' },   // Trent Williams
    { league: 'nfl', id: '3918298' }, // Josh Allen
    { league: 'nfl', id: '3043078' }, // Derrick Henry
    { league: 'nfl', id: '4361307' }, // Trey McBride
    { league: 'nfl', id: '4262921' }, // Justin Jefferson
    { league: 'nfl', id: '4040982' }, // Quinnen Williams
    { league: 'nfl', id: '3043107' }, // Alex Anzalone
    { league: 'nfl', id: '4427250' }, // Sauce Gardner
    // NBA examples
    { league: 'nba', id: '3975' }, // Stephen Curry
    { league: 'nba', id: '4593125' } // Santi Aldama (example)
  ];

  const results = {};
  for (const p of players) {
    try {
      const obj = await espnApi.getPlayer(p.league, p.id);
      // also attempt to fetch the fuller player endpoint and athlete overview + news
      let full = null;
      let overview = null;
      let news = [];
      try { full = await espnApi.getPlayerFull(p.league, p.id); } catch (e) { full = null; }
      try {
        // try athlete overview for NFL (and for others as a fallback)
        overview = await espnApi.getAthleteOverview(p.league, p.id).catch(() => null);
        if (!overview && obj && obj.id) overview = await espnApi.getAthleteOverview(p.league, obj.id).catch(() => null);
      } catch (e) { overview = null; }
      try { news = await espnApi.getPlayerNews(p.id, p.league, 10); } catch (e) { news = []; }

      results[`${p.league}|${p.id}`] = { fetched: obj || null, full: full || null, overview: overview || null, news: news || [] };
      console.log(`Fetched ${p.league}|${p.id} -> ${obj ? (obj.name || obj.displayName || obj.fullName) : 'NOT FOUND'}`);
    } catch (e) {
      results[`${p.league}|${p.id}`] = { error: String(e) };
      console.error(`Error fetching ${p.league}|${p.id}:`, e && e.message ? e.message : e);
    }
  }

  fs.writeFileSync('./tmp_player_fetch.json', JSON.stringify(results, null, 2));
  console.log('\nWrote ./tmp_player_fetch.json with results.');
})();
