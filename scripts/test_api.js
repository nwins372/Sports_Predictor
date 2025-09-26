const espn = require('../src/utils/espnApi.js');
(async () => {
  try {
    console.log('Listing teams (first 5):');
    const teams = await espn.listTeams('nba');
    console.log('Teams count:', teams.length);
    console.log(teams.slice(0,5).map(t => ({ id: t.id, slug: t.slug, abbreviation: t.abbreviation, displayName: t.displayName || t.name })));

    console.log('\nGet team San_Antonio:');
    const team = await espn.getTeam('nba','San_Antonio');
    console.log('Team keys:', Object.keys(team).slice(0,10));
    console.log('Team detail team name:', team?.detail?.team?.displayName || team?.displayName || team?.name);

    // pick a player id from the player_index
    const idx = require('../public/db/espn/nba/player_index.json');
    const id = Object.keys(idx.byId).slice(0,5)[0];
    console.log('\nTesting getPlayer for id', id);
    const p = await espn.getPlayer('nba', id);
    console.log('Player name (getPlayer):', p?.name || p?.displayName || p?.fullName || p?.headline || '(none)');
  } catch (e) {
    console.error('ERROR', e);
  }
})();
