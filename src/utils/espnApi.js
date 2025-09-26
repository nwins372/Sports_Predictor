// espnApi - CommonJS adapter for browser and Node test scripts
// Exports: listTeams, getTeam, getTeamRoster, buildLocalPlayerIndex,
// searchPlayersLocal, getPlayerLocalById, getPlayer, searchPlayers

const BASES = {
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl',
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'
};

function _cacheKey(k) { return `espn_cache:${k}`; }

async function _fetchWithCache(url, ttl = 1000 * 60 * 5) {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const rk = _cacheKey(url);
      const raw = sessionStorage.getItem(rk);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.ts < ttl) return parsed.data;
      }
    }
  } catch (e) {}

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
  const data = await res.json();

  try { if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(_cacheKey(url), JSON.stringify({ ts: Date.now(), data })); } catch (e) {}
  return data;
}

async function _tryLocal(path) {
  // In browser, try fetching the static file under public/
  try {
    if (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions && process.versions.node) {
      // Node environment: read from filesystem under project public/
      try {
        const fs = require('fs');
        const pth = require('path');
        const rel = path.startsWith('/') ? path : `/${path}`;
        const file = pth.resolve(__dirname, '../../public' + rel);
        const raw = fs.readFileSync(file, 'utf8');
        return JSON.parse(raw);
      } catch (e) {
        // fallthrough to HTTP fetch attempt below
      }
    }
    return await _fetchWithCache(path, 1000 * 60 * 60);
  } catch (e) { return null; }
}

function _normTeam(raw) {
  const d = raw?.detail || raw;
  const t = d?.team || d || {};
  return {
    id: t?.id || t?.teamId || null,
    slug: t?.slug || (t?.displayName || t?.name || '').replace(/\s+/g, '_'),
    displayName: t?.displayName || t?.name || null,
    abbreviation: t?.abbreviation || null,
    logos: t?.logos || d?.logos || [],
    raw
  };
}

function _normRoster(e) {
  const a = e?.athlete || e?.person || e || {};
  return {
    id: a?.id || a?.personId || null,
    name: a?.displayName || a?.fullName || a?.name || null,
    headshot: a?.headshot?.href || a?.photo?.href || null,
    position: a?.position || null
  };
}

function _normPlayer(raw) {
  const p = raw?.player || raw?.athlete || raw || {};
  return {
    id: p?.id || p?.personId || null,
    name: p?.displayName || p?.fullName || p?.name || null,
    headshot: p?.headshot?.href || p?.photo?.href || null,
    team: p?.team || null,
    raw: p
  };
}

async function listTeams(league = 'nba') {
  if (!BASES[league]) throw new Error('Unsupported league');
  const local = await _tryLocal(`/db/espn/${league}/teams.json`);
  if (local) {
    if (Array.isArray(local)) return local.map(t => (t.team || t));
    if (local.teams) return local.teams.map(t => (t.team || t));
  }
  const json = await _fetchWithCache(`${BASES[league]}/teams`);
  const teams = (json?.sports?.[0]?.leagues?.[0]?.teams) || json?.teams || [];
  return teams.map(t => (t.team || t));
}

async function getTeam(league = 'nba', idOrSlug) {
  if (!BASES[league]) throw new Error('Unsupported league');
  // Try local JSON by filename (served at /db/espn/{league}/{team}.json) first
  const candidate = String(idOrSlug).endsWith('.json') ? idOrSlug : `${idOrSlug}.json`;
  const local = await _tryLocal(`/db/espn/${league}/${candidate}`);
  if (local) return _normTeam(local);

  // Try to match against the teams list (id, slug, abbreviation)
  try {
    const teams = await listTeams(league);
    const found = teams.find(t => String(t.id) === String(idOrSlug) || String(t.slug) === String(idOrSlug) || String(t.abbreviation) === String(idOrSlug));
    if (found) {
      try {
        const raw = await _fetchWithCache(`${BASES[league]}/teams/${encodeURIComponent(found.id)}`);
        return _normTeam(raw);
      } catch (e) {
        // if remote teams/{id} fails, return normalized team from list
        return _normTeam(found);
      }
    }

    // Try fuzzy match: convert underscores to hyphens and try matching slug contains
    const norm = String(idOrSlug).toLowerCase().replace(/_/g, '-');
    const fuzzy = teams.find(t => (t.slug || '').toLowerCase().includes(norm) || (t.displayName || '').toLowerCase().includes(norm.replace(/-/g, ' ')));
    if (fuzzy) {
      try { const raw = await _fetchWithCache(`${BASES[league]}/teams/${encodeURIComponent(fuzzy.id)}`); return _normTeam(raw); } catch (e) { return _normTeam(fuzzy); }
    }
  } catch (e) {}

  // Try direct remote requests with some common variants
  const variants = [String(idOrSlug), String(idOrSlug).replace(/_/g, '-'), String(idOrSlug).toLowerCase(), String(idOrSlug).toUpperCase()];
  for (const v of variants) {
    try {
      const raw = await _fetchWithCache(`${BASES[league]}/teams/${encodeURIComponent(v)}`);
      if (raw) return _normTeam(raw);
    } catch (e) {}
  }

  return null;
}

async function getTeamRoster(league = 'nba', teamIdOrSlug) {
  if (!BASES[league]) throw new Error('Unsupported league');
  try {
    const res = await _fetchWithCache(`${BASES[league]}/teams/${encodeURIComponent(teamIdOrSlug)}/roster`);
    const roster = res?.roster?.entries || res?.athletes || res?.entries || res || [];
    if (!Array.isArray(roster)) return [];
    return roster.map(_normRoster);
  } catch (e) {
    try {
      const teams = await listTeams(league);
      const found = teams.find(t => String(t.id) === String(teamIdOrSlug) || String(t.slug) === String(teamIdOrSlug) || String(t.abbreviation) === String(teamIdOrSlug));
      if (found) return getTeamRoster(league, found.id);
    } catch (e2) {}
  }
  return [];
}

async function buildLocalPlayerIndex(league = 'nba') {
  try {
    const pre = await _tryLocal(`/db/espn/${league}/player_index.json`);
    if (pre && pre.byId && pre.list) return pre;
  } catch (e) {}
  return { byId: {}, list: [] };
}

async function searchPlayersLocal(query, league = 'nba', limit = 40) {
  if (!query) return [];
  const idx = await buildLocalPlayerIndex(league);
  const q = query.toLowerCase();
  return (idx.list || []).filter(p => (p.name || '').toLowerCase().includes(q)).slice(0, limit).map(p => ({ id: p.id, name: p.name, img: p.head }));
}

async function getPlayerLocalById(id, league = 'nba') { const idx = await buildLocalPlayerIndex(league); return idx.byId && idx.byId[String(id)] ? idx.byId[String(id)] : null; }

async function searchPlayers(query, limit = 50) { const url = `https://site.web.api.espn.com/apis/search/v2?query=${encodeURIComponent(query)}&limit=${limit}&type=player`; return _fetchWithCache(url); }

async function getPlayer(league = 'nba', idOrQuery) {
  try { const local = await getPlayerLocalById(idOrQuery, league); if (local) return local; } catch (e) {}
  try { const raw = await _fetchWithCache(`${BASES[league]}/players/${encodeURIComponent(idOrQuery)}`); return _normPlayer(raw); } catch (e) {}
  try { const sp = await searchPlayers(idOrQuery, 10); if (sp && Array.isArray(sp.results) && sp.results.length > 0) return _normPlayer(sp.results[0].object || sp.results[0]); } catch (e) {}
  return null;
}

const espnApi = { listTeams, getTeam, getTeamRoster, buildLocalPlayerIndex, searchPlayersLocal, getPlayerLocalById, getPlayer, searchPlayers };
module.exports = espnApi;
