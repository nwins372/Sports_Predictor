(async function(){
  try{
    const espn = require('../src/utils/espnApi');
    console.log('Running diagnostics: player 8439 (NFL)');
    const idx = await espn.buildLocalPlayerIndex('nfl');
    console.log('playersIndexed=', Object.keys(idx.byId || {}).length);
    console.log('has8439=', !!idx.byId['8439']);
    console.log('sampleKeys=', Object.keys(idx.byId['8439'] || {}));
    console.log('getPlayerLocal=');
    console.log(JSON.stringify(await espn.getPlayerLocalById('8439','nfl'), null, 2));

    console.log('\ngetTeam Pittsburgh (local/public):');
    try{
      const t = await espn.getTeam('nfl','Pittsburgh');
      console.log(JSON.stringify(t && (t.detail || t), null, 2));
    } catch(e){ console.error('getTeam error', e && e.message); }

    console.log('\nAttempting espn.getPlayer("nfl","8439") to test enrichment:');
    try{
      const p = await espn.getPlayer('nfl','8439');
      console.log('raw getPlayer() output:');
      console.log(JSON.stringify(p, null, 2));

      // simulate Player.jsx enrichment steps
      let enriched = p && typeof p === 'object' ? Object.assign({}, p) : null;
      if (enriched && !enriched.team && enriched.teamSlug) {
        try {
          const t = await espn.getTeam(enriched._league || 'nfl', enriched.teamSlug);
          if (t) enriched.team = t;
        } catch (e) { /* ignore */ }
      }
      // if no seasons, try remote player endpoint (will likely 404)
      const hasSeasons = enriched && ((enriched.currentSeasonStats) || (enriched.seasons && enriched.seasons.length > 0));
      if (enriched && !hasSeasons) {
        try { const remote = await espn.getPlayer(enriched._league || 'nfl', '8439'); if (remote) {
            enriched = Object.assign({}, enriched, { seasons: remote.seasons || enriched.seasons, currentSeasonStats: remote.currentSeasonStats || enriched.currentSeasonStats, height: enriched.height || remote.height, weight: enriched.weight || remote.weight });
        } } catch (e) { /* ok */ }
      }
      console.log('\nSimulated enriched player:');
      console.log(JSON.stringify(enriched, null, 2));
    } catch(e){ console.error('getPlayer remote error', e && e.message); }

  }catch(e){ console.error('DIAG ERROR', e && e.stack); }
})();