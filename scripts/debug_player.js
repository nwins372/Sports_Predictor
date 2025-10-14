(async () => {
  try {
    const espn = require('../src/utils/espnApi.js');
    const p = await espn.getPlayer('nfl','8439');
    console.log('PLAYER:', JSON.stringify(p, null, 2));
  } catch (e) { console.error(e); process.exit(1); }
})();
