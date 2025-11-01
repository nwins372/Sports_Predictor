const path = require('path');
const espnApi = require(path.resolve(__dirname, '../src/utils/espnApi.js'));

(async () => {
  try {
    console.log('Testing getPlayer(nfl, 4038941) - Justin Herbert (expected)');
    const p = await espnApi.getPlayer('nfl', '4038941');
    console.log('RESULT:', JSON.stringify(p && (p.name || p.id) ? p : p, null, 2));
  } catch (e) {
    console.error('ERROR', e && e.message ? e.message : e);
  }
})();
