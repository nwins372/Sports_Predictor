(async ()=>{
  try{
    const BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
    const id = '8439';
    const urls = [`${BASE}/players/${id}`, `${BASE}/athletes/${id}`, `${BASE}/players/${encodeURIComponent(id)}`];
    for(const u of urls){
      try{
        console.log('\nFetching', u);
        const res = await fetch(u);
        console.log(' status=', res.status);
        const txt = await res.text();
        console.log(' body starts:', txt.slice(0,400));
      }catch(e){ console.error('fetch err', e && e.message); }
    }
  }catch(e){ console.error('ERR', e && e.stack); }
})();