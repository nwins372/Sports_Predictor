const path = require('path');
const espnApi = require(path.resolve(__dirname, '../src/utils/espnApi.js'));

(async () => {
  try {
    console.log('Testing getPlayer(nfl, 4038941) - Justin Herbert (expected)');
    const p = await espnApi.getPlayer('nfl', '4038941');
    if (!p) { console.log('No player returned'); return; }
    console.log('id:', p.id);
    console.log('name:', p.name || p.displayName || (p.raw && (p.raw.displayName || p.raw.fullName)));
    console.log('position:', p.position || (p.raw && p.raw.position) || null);
    console.log('height:', p.height || p.displayHeight || null);
    console.log('weight:', p.weight || p.displayWeight || null);
    console.log('seasons:', Array.isArray(p.seasons) ? p.seasons.length : (p.currentSeasonStats ? 1 : 0));
  } catch (e) {
    console.error('ERROR', e && e.message ? e.message : e);
  }
})();
