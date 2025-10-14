const ids=[1966,3202];
(async ()=>{
  for (const id of ids) {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/players/${id}`;
      console.log('Fetching', url);
      const res = await fetch(url);
      console.log('status', res.status);
      const j = await res.json();
      console.log('top keys:', Object.keys(j).slice(0,20));
      const maybe = JSON.stringify(j, null, 2).slice(0,2000);
      console.log('preview:', maybe);
    } catch (e) { console.error('err', e && e.message); }
  }
})();
