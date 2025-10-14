(async () => {
  const urls = [
    'http://localhost:3000/db/espn/nba/San_Antonio.json',
    'http://localhost:3000/db/espn/nba/player_index.json'
  ];
  for (const u of urls) {
    try {
      const res = await fetch(u);
      console.log(u, '->', res.status, res.headers.get('content-type'));
      const txt = await res.text();
      console.log('Length:', txt.length);
    } catch (e) {
      console.error('Failed to fetch', u, e.message);
    }
  }
})();
