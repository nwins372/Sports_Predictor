const path = require('path');
const espnApi = require(path.resolve(__dirname, '../src/utils/espnApi.js'));

const name = process.argv[2] || 'Cam Skattebo';
(async () => {
  try {
    console.log(`Testing getPlayer(nfl, "${name}")`);
    const p = await espnApi.getPlayer('nfl', name);
    if (!p) { console.log('No player returned'); return; }
    console.log('id:', p.id);
    console.log('name:', p.name || p.displayName || (p.raw && (p.raw.displayName || p.raw.fullName)));
    console.log('position:', p.position || (p.raw && p.raw.position) || null);
    console.log('height:', p.height || p.displayHeight || null);
    console.log('weight:', p.weight || p.displayWeight || null);
    console.log('seasons:', Array.isArray(p.seasons) ? p.seasons.length : (p.currentSeasonStats ? 1 : 0));
    console.log('rawIdSnippet:', p.raw && p.raw.id ? p.raw.id : (p.raw && p.raw.personId ? p.raw.personId : (p.raw && p.raw.data && p.raw.data.athlete && p.raw.data.athlete.id ? p.raw.data.athlete.id : 'n/a')));
  } catch (e) {
    console.error('ERROR', e && e.message ? e.message : e);
  }
})();
