// @jest-environment node
const espn = require('./espnApi');
const path = require('path');

describe('espnApi local index (smoke)', () => {
  test('public player_index.json contains NFL entries and Aaron Rodgers', async () => {
    const idx = require(path.resolve(__dirname, '../../public/db/espn/nfl/player_index.json'));
    expect(idx).toBeDefined();
    expect(idx.byId).toBeDefined();
    const keys = Object.keys(idx.byId || {});
    expect(keys.length).toBeGreaterThan(0);
    expect(idx.byId['8439']).toBeDefined();
    expect(idx.byId['8439'].name).toMatch(/Aaron/i);
    expect(idx.byId['8439']._league).toBe('nfl');
  });

  test('getTeam resolves Pittsburgh team', async () => {
    const t = await espn.getTeam('nfl', 'Pittsburgh');
    expect(t).toBeTruthy();
    const display = t.displayName || t.name || t.slug || '';
    expect(String(display).toLowerCase()).toContain('pittsburgh');
  });
});
