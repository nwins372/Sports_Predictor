(async () => {
  try {
    const espn = require('../src/utils/espnApi.js');
    const teamsToTest = [
      { league: 'nfl', key: 'Tennessee' },
      { league: 'nfl', key: 'New_York' },
      { league: 'nfl', key: 'Houston' },
      { league: 'nba', key: 'Houston' }
    ];

    for (const t of teamsToTest) {
      console.log('\n--- TEST', t.league, t.key, '---');
      try {
        const team = await espn.getTeam(t.league, t.key);
        console.log('getTeam =>', team ? { id: team.id, slug: team.slug, displayName: team.displayName, _league: team._league, _fromLocal: team._fromLocal } : null);
        const tid = team?.detail?.team?.id || team?.id || team?.slug || t.key;
        const roster = await espn.getTeamRoster(t.league, tid);
        console.log('roster count:', Array.isArray(roster) ? roster.length : 'not-array');
        if (Array.isArray(roster)) console.log('first 3:', roster.slice(0,3));
      } catch (e) {
        console.error('error for', t, e && e.message);
      }
    }
  } catch (err) { console.error(err); process.exit(1); }
})();
