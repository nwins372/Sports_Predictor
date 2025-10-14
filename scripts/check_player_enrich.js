const espn = require('../src/utils/espnApi');

(async () => {
  try {
    console.log('=== getPlayer("nfl","8439") ===');
    const p = await espn.getPlayer('nfl', '8439');
    console.log(JSON.stringify(p, null, 2));

    console.log('\n=== searchPlayers("Aaron Rodgers") ===');
    const s = await espn.searchPlayers('Aaron Rodgers');
    console.log(JSON.stringify(s, null, 2));
  } catch (err) {
    console.error('ERROR', err && (err.stack || err));
    process.exit(1);
  }
})();
