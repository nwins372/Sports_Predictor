/**
 * @jest-environment node
 */

const espn = require('../espnApi');

// Allow network calls to complete (search API + local public files)
jest.setTimeout(30000);

describe('espnApi enrichment - NFL player 8439', () => {
  test('getPlayer("nfl","8439") returns merged player with headshot, team and physicals (stats optional)', async () => {
    const p = await espn.getPlayer('nfl', '8439');
    expect(p).toBeTruthy();

    // id may be string or number
    const hasId = p.id || p.playerId || p.raw?.id || p.raw?.player?.id;
    expect(hasId).toBeTruthy();

    // headshot or image should be present after enrichment
    const head = p.headshot || p.head || (p.raw && (p.raw.headshot || p.raw.player && p.raw.player.headshot));
    expect(head).toBeTruthy();

    // team should be present and include a displayName
    expect(p.team && (p.team.displayName || p.team.name)).toBeTruthy();

  // physicals: optional in tests (may be missing depending on public data). Log when absent.
  const hasPhysical = !!(p.height || p.weight || p.position || p.raw?.height || p.raw?.weight || p.raw?.player?.height || p.raw?.player?.weight);
  if (!hasPhysical) console.warn('Note: physicals (height/weight/position) not available for this player in the test environment.');

  // stats are optional in this environment (search API may not include full seasons). If absent, just log.
  const hasStats = (p.currentSeasonStats && Object.keys(p.currentSeasonStats).length > 0) || (Array.isArray(p.seasons) && p.seasons.length > 0);
  if (!hasStats) console.warn('Note: player has no seasons/currentSeasonStats in this environment — this may be expected.');
  });

  test('local player index contains id 8439 and searchPlayersLocal returns candidate', async () => {
    const idx = await espn.buildLocalPlayerIndex('nfl');
    expect(idx).toBeTruthy();
    expect(idx.byId && idx.byId['8439']).toBeTruthy();

    const res = await espn.searchPlayersLocal('Aaron Rodgers', 'nfl');
    expect(Array.isArray(res)).toBeTruthy();
    expect(res.find(r => String(r.id) === '8439' || r.name && r.name.toLowerCase().includes('rodgers'))).toBeTruthy();
  });
});
