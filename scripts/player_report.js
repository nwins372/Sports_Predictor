const fs = require('fs');
const path = require('path');
const dataPath = path.join(__dirname, '..', 'tmp_player_fetch.json');
const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const keys = Object.keys(raw).sort();
const report = [];
for (const k of keys) {
  const entry = raw[k];
  const fetched = entry.fetched || entry;
  const full = entry.full || null;
  const overview = entry.overview || (fetched && fetched.raw) || null;
  const news = entry.news || (entry.fetched && entry.fetched._news) || [];
  const seasonsFetched = (fetched && ((fetched.seasons && fetched.seasons.length) || (fetched.currentSeasonStats ? 1 : 0))) || 0;
  const seasonsFull = (full && ((full.seasons && full.seasons.length) || (full.currentSeasonStats ? 1 : 0))) || 0;
  const seasonsOverview = (overview && ((overview.seasons && overview.seasons.length) || (overview.statistics && overview.statistics.splits && overview.statistics.splits.length) || 0)) || 0;
  // detect regular-season splits keys if present
  let overviewFirstSeasonKeys = [];
  try {
    const statsRoot = overview && (overview.statistics || overview.stats || overview.player?.statistics || overview.player?.stats);
    if (statsRoot && statsRoot.splits && Array.isArray(statsRoot.splits) && (Array.isArray(statsRoot.labels) || Array.isArray(statsRoot.names) || Array.isArray(statsRoot.displayNames))) {
      const labels = statsRoot.labels || statsRoot.names || statsRoot.displayNames || [];
      const reg = statsRoot.splits.find(s => (s.displayName || '').toLowerCase().includes('regular')) || statsRoot.splits[0];
      if (reg) {
        if (Array.isArray(reg.stats)) {
          overviewFirstSeasonKeys = labels.slice(0,6).map(l=>String(l));
        } else if (reg.stats && typeof reg.stats === 'object') {
          overviewFirstSeasonKeys = Object.keys(reg.stats).slice(0,6);
        }
      }
    } else if (overview && overview.seasons && overview.seasons[0]) {
      overviewFirstSeasonKeys = Object.keys(overview.seasons[0].stats || overview.seasons[0]).slice(0,6);
    }
  } catch (e) {}

  report.push({ key: k, name: fetched && (fetched.name || fetched.displayName || fetched.fullName) || null, hasFetched: !!entry.fetched, hasFull: !!entry.full, hasOverview: !!entry.overview, seasonsFetched, seasonsFull, seasonsOverview, overviewFirstSeasonKeys, newsCount: (Array.isArray(news)?news.length:0) });
}
console.log(JSON.stringify(report, null, 2));
