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
  // Use dynamic require to avoid bundlers statically including node core modules.
  // This code path only runs in Node (test scripts); keep it explicit and disable eslint for eval.
  /* eslint-disable-next-line no-eval */
  const rq = eval('require');
        const fs = rq('fs');
        const pth = rq('path');
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
  // normalize common height/weight keys used across ESPN payloads
  const height = a?.height || a?.displayHeight || a?.bio?.height || a?.measurements?.height || null;
  const weight = a?.weight || a?.displayWeight || a?.bio?.weight || a?.measurements?.weight || null;
  const position = (a?.position && (typeof a.position === 'string' ? a.position : a.position?.abbreviation || a.position?.name)) || a?.positionName || null;
  return {
    id: a?.id || a?.personId || null,
    name: a?.displayName || a?.fullName || a?.name || null,
    headshot: a?.headshot?.href || a?.photo?.href || a?.images?.[0]?.url || a?.image?.url || null,
    position,
    height,
    weight,
    raw: a
  };
}

function _normPlayer(raw) {
  const p = raw?.player || raw?.athlete || raw || {};
  const height = p?.height || p?.displayHeight || p?.bio?.height || p?.measurements?.height || null;
  const weight = p?.weight || p?.displayWeight || p?.bio?.weight || p?.measurements?.weight || null;
  const headshot = p?.headshot?.href || p?.photo?.href || p?.images?.[0]?.url || p?.image?.url || p?.head || p?.headshotUrl || null;

  // extract seasons/stats heuristically
  function _extractSeasons(obj) {
    const candidates = obj?.player?.stats || obj?.stats || obj?.seasons || obj?.splits || obj?.seasonStats || [];
    const arr = Array.isArray(candidates) ? candidates : (candidates ? [candidates] : []);
    const seasons = arr.map(s => {
      const season = s?.season || s?.seasonYear || s?.seasonId || (s?.displayName && String(s.displayName).match(/\d{4}/) ? String(s.displayName).match(/\d{4}/)[0] : null);
      const isCurrent = !!s?.isCurrentSeason || !!s?.currentSeason || !!s?.isCurrent;
      const stats = s?.stats || s?.splits || s?.appliedTo || s || null;
      return { season, isCurrent, stats, raw: s };
    }).filter(Boolean);
    if (seasons.length === 0) return { seasons: [], chosen: null };
    const chosen = seasons.find(s => s.isCurrent) || seasons.reduce((a,b) => {
      const as = parseInt(a.season || 0, 10) || 0;
      const bs = parseInt(b.season || 0, 10) || 0;
      return bs > as ? b : a;
    }, seasons[0]);
    return { seasons, chosen };
  }

  const seasonsInfo = _extractSeasons(raw);

  return {
    id: p?.id || p?.personId || null,
    name: p?.displayName || p?.fullName || p?.name || null,
    headshot,
    team: p?.team || null,
    height,
    weight,
    seasons: seasonsInfo.seasons,
    currentSeasonStats: seasonsInfo.chosen ? seasonsInfo.chosen.stats : null,
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
  if (local) {
    // When a full local team JSON exists, return it as-is so callers can access detail/roster
    try {
      local._fromLocal = true;
      local._league = league;
    } catch (e) {}
    return local;
  }

  // Try to match against the teams list (id, slug, abbreviation)
  try {
    const teams = await listTeams(league);
    const found = teams.find(t => String(t.id) === String(idOrSlug) || String(t.slug) === String(idOrSlug) || String(t.abbreviation) === String(idOrSlug));
        if (found) {
      try {
        const raw = await _fetchWithCache(`${BASES[league]}/teams/${encodeURIComponent(found.id)}`);
        const nt = _normTeam(raw);
        nt._league = league;
        nt._fromLocal = false;
        return nt;
      } catch (e) {
        // if remote teams/{id} fails, return normalized team from list
        const nt = _normTeam(found);
        nt._league = league;
        nt._fromLocal = false;
        return nt;
      }
    }

    // Try fuzzy match: convert underscores to hyphens and try matching slug contains
    const norm = String(idOrSlug).toLowerCase().replace(/_/g, '-');
    const fuzzy = teams.find(t => (t.slug || '').toLowerCase().includes(norm) || (t.displayName || '').toLowerCase().includes(norm.replace(/-/g, ' ')));
    if (fuzzy) {
      try { const raw = await _fetchWithCache(`${BASES[league]}/teams/${encodeURIComponent(fuzzy.id)}`); const nt = _normTeam(raw); nt._league = league; return nt; } catch (e) { const nt = _normTeam(fuzzy); nt._league = league; return nt; }
    }
  } catch (e) {}

  // Try direct remote requests with some common variants
  const variants = [String(idOrSlug), String(idOrSlug).replace(/_/g, '-'), String(idOrSlug).toLowerCase(), String(idOrSlug).toUpperCase()];
  for (const v of variants) {
    try {
      const raw = await _fetchWithCache(`${BASES[league]}/teams/${encodeURIComponent(v)}`);
      if (raw) { const nt = _normTeam(raw); nt._league = league; return nt; }
    } catch (e) {}
  }

  return null;
}

async function getTeamRoster(league = 'nba', teamIdOrSlug) {
  if (!BASES[league]) throw new Error('Unsupported league');

  // Helper to normalize and filter roster arrays
  const normalizeArray = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.map(_normRoster).filter(p => p && (p.id || p.name));
  };

  // Try local team JSON by several candidate filenames
  try {
    const candidatePath = String(teamIdOrSlug);
    let localTeam = await _tryLocal(`/db/espn/${league}/${candidatePath}.json`);
    if (!localTeam) {
      try {
        const teams = await listTeams(league);
        const found = teams.find(t => String(t.id) === String(teamIdOrSlug) || String(t.slug) === String(teamIdOrSlug) || String(t.abbreviation) === String(teamIdOrSlug));
        if (found) {
          const trials = [];
          if (found.slug) trials.push(found.slug);
          if (found.displayName) trials.push(String(found.displayName).replace(/\s+/g,'_'));
          if (found.name) trials.push(String(found.name).replace(/\s+/g,'_'));
          if (found.location) trials.push(String(found.location).replace(/\s+/g,'_'));
          if (found.abbreviation) trials.push(String(found.abbreviation));
          for (const tname of trials) {
            if (!tname) continue;
            const tryLocal = await _tryLocal(`/db/espn/${league}/${tname}.json`);
            if (tryLocal) { localTeam = tryLocal; break; }
          }
        }
      } catch (e) {}
    }

    if (localTeam) {
      // extract roster from known local shapes
      let roster = localTeam?.detail?.roster?.entries || localTeam?.detail?.roster || localTeam?.athletes || localTeam?.roster || localTeam?.team?.roster || null;
      if (!roster) return [];

      // If roster is an object with grouped 'athletes', flatten their items
      if (roster && roster.athletes && Array.isArray(roster.athletes)) {
        roster = roster.athletes.flatMap(g => {
          if (Array.isArray(g.items)) return g.items;
          if (Array.isArray(g.athletes)) return g.athletes;
          return [g];
        });
      }

      // If roster is an array but contains grouping objects with .items or .athletes, flatten them
      if (Array.isArray(roster)) {
        const hasGroups = roster.some(r => r && (Array.isArray(r.items) || Array.isArray(r.athletes)));
        if (hasGroups) {
          const flat = [];
          for (const r of roster) {
            if (r && Array.isArray(r.items)) flat.push(...r.items);
            else if (r && Array.isArray(r.athletes)) flat.push(...r.athletes);
            else flat.push(r);
          }
          roster = flat;
        }
      } else if (typeof roster === 'object') {
        // If roster is a plain object with arrays as values, collect arrays
        const arr = [];
        for (const k of Object.keys(roster)) {
          const v = roster[k];
          if (Array.isArray(v)) arr.push(...v);
          else if (v && Array.isArray(v.items)) arr.push(...v.items);
        }
        roster = arr;
      }

      return normalizeArray(roster);
    }
  } catch (e) {}

  // Try remote roster endpoint and normalize similar grouping structures
  try {
    const res = await _fetchWithCache(`${BASES[league]}/teams/${encodeURIComponent(teamIdOrSlug)}/roster`);
    let roster = res?.roster?.entries || res?.athletes || res?.entries || res || [];

    if (roster && roster.athletes && Array.isArray(roster.athletes)) {
      roster = roster.athletes.flatMap(g => Array.isArray(g.items) ? g.items : (Array.isArray(g.athletes) ? g.athletes : [g]));
    }
    if (Array.isArray(roster)) {
      const hasGroups = roster.some(r => r && (Array.isArray(r.items) || Array.isArray(r.athletes)));
      if (hasGroups) {
        const flat = [];
        for (const r of roster) {
          if (r && Array.isArray(r.items)) flat.push(...r.items);
          else if (r && Array.isArray(r.athletes)) flat.push(...r.athletes);
          else flat.push(r);
        }
        roster = flat;
      }
    } else if (typeof roster === 'object') {
      const arr = [];
      for (const k of Object.keys(roster)) {
        const v = roster[k];
        if (Array.isArray(v)) arr.push(...v);
        else if (v && Array.isArray(v.items)) arr.push(...v.items);
      }
      roster = arr;
    }

    return normalizeArray(roster);
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
  return (idx.list || []).filter(p => (p.name || '').toLowerCase().includes(q)).slice(0, limit).map(p => ({ id: p.id, name: p.name, img: p.head, _league: p._league || league }));
}

async function getPlayerLocalById(id, league = 'nba') { const idx = await buildLocalPlayerIndex(league); return idx.byId && idx.byId[String(id)] ? idx.byId[String(id)] : null; }

async function searchPlayers(query, limit = 50) { const url = `https://site.web.api.espn.com/apis/search/v2?query=${encodeURIComponent(query)}&limit=${limit}&type=player`; return _fetchWithCache(url); }

async function getPlayer(league = 'nba', idOrQuery) {
  try {
    const local = await getPlayerLocalById(idOrQuery, league);
    if (local) {
      // ensure league metadata
      if (!local._league) local._league = league;
      // If local has season info, return it. Otherwise try to enrich from team files or remote search
      const hasSeasons = (local.currentSeasonStats) || (local.seasons && local.seasons.length > 0);
      // Try to resolve team from teamSlug when present
      if (!local.team && local.teamSlug) {
        try {
          let t = null;
          try { t = await getTeam(local._league || league, local.teamSlug); } catch (e) { t = null; }
          if (!t) {
            const alt = (local._league || league) === 'nba' ? 'nfl' : 'nba';
            try { t = await getTeam(alt, local.teamSlug); } catch (e) { t = null; }
          }
          if (t) local.team = t;
        } catch (e) {}
      }

      // Normalize local.team shape: extract inner detail.team or team wrapper when present
      try {
        if (local.team) {
          let teamObj = local.team;
          if (teamObj.detail && teamObj.detail.team) teamObj = teamObj.detail.team;
          else if (teamObj.team && (teamObj.team.displayName || teamObj.team.name)) teamObj = teamObj.team;
          if (!(teamObj.displayName || teamObj.name) && (teamObj.slug || teamObj.id || teamObj.abbreviation)) {
            try { const resolved = await getTeam(local._league || league, teamObj.slug || teamObj.id || teamObj.abbreviation); if (resolved) teamObj = (resolved.detail && resolved.detail.team) ? resolved.detail.team : (resolved.team || resolved); } catch (e) {}
          }
          local.team = teamObj;
        }
      } catch (e) {}

      if (hasSeasons) return local;

      // Try remote enrichment via search API first (more reliable across leagues)
      try {
        const sp = await searchPlayers(idOrQuery, 10);
        if (sp && Array.isArray(sp.results) && sp.results.length > 0) {
          // Flatten results which may include .contents arrays (search v2 shape)
          const candidates = [];
          for (const r of sp.results) {
            if (Array.isArray(r.contents) && r.contents.length) {
              for (const c of r.contents) candidates.push(c);
            } else if (r.object) {
              candidates.push(r.object);
            } else {
              candidates.push(r);
            }
          }

          // Try to find by id/uid/link then fallback to first candidate
          let found = null;
          for (const c of candidates) {
            const cid = c.id || (c.uid && String(c.uid).split('~').pop()) || null;
            const linkIdMatch = c.link && c.link.web && String(c.link.web).match(/\/(?:id|_id)\/(\d+)/);
            const linkId = linkIdMatch ? linkIdMatch[1] : null;
            if (cid && String(cid) === String(idOrQuery)) { found = c; break; }
            if (linkId && String(linkId) === String(idOrQuery)) { found = c; break; }
          }
          if (!found) found = candidates[0];

          if (found) {
            // Build a minimal player-like object from search content so _normPlayer can extract headshot/team info
            const pseudo = { player: {
              id: found.id || (found.uid && String(found.uid).split('~').pop()) || null,
              displayName: found.displayName || found.name || null,
              headshot: { href: (found.image && (found.image.default || found.image)) || found.image },
              team: found.subtitle ? { displayName: found.subtitle, slug: (found.subtitle || '').replace(/\s+/g, '_') } : null
            }};
            const remoteNorm = _normPlayer(pseudo);
            const merged = Object.assign({}, local, {
              _league: local._league || league || found.defaultLeagueSlug || (found.sport === 'football' ? 'nfl' : null),
              headshot: local.headshot || remoteNorm.headshot,
              team: local.team || remoteNorm.team,
              height: local.height || remoteNorm.height,
              weight: local.weight || remoteNorm.weight,
              seasons: remoteNorm.seasons && remoteNorm.seasons.length > 0 ? remoteNorm.seasons : (local.seasons || []),
              currentSeasonStats: remoteNorm.currentSeasonStats || local.currentSeasonStats || null,
              raw: local.raw || remoteNorm.raw
            });

            // Normalize merged.team: if the team is a full local JSON, extract the inner team object; if it's incomplete, try resolving via getTeam
            try {
              if (merged.team) {
                let teamObj = merged.team;
                // prefer inner shapes: detail.team or team when present
                if (teamObj.detail && teamObj.detail.team) teamObj = teamObj.detail.team;
                else if (teamObj.team && (teamObj.team.displayName || teamObj.team.name)) teamObj = teamObj.team;
                // if teamObj still lacks a displayName/name but has a slug/id/abbreviation, try to resolve the full team
                if (!(teamObj.displayName || teamObj.name) && (teamObj.slug || teamObj.id || teamObj.abbreviation)) {
                  try {
                    const resolved = await getTeam(merged._league || league, teamObj.slug || teamObj.id || teamObj.abbreviation);
                    if (resolved) teamObj = (resolved.detail && resolved.detail.team) ? resolved.detail.team : (resolved.team || resolved);
                  } catch (e) {}
                }
                merged.team = teamObj;
              }
            } catch (e) {}

            // If we resolved a team but still lack physicals, try to extract from the team's roster
            try {
              if (merged.team && (!merged.height || !merged.weight || !merged.position)) {
                const tslug = merged.team.slug || merged.team.displayName || merged.team.name || null;
                if (tslug) {
                  const roster = await getTeamRoster(merged._league || league, tslug);
                  if (Array.isArray(roster) && roster.length) {
                    const match = roster.find(r => String(r.id) === String(merged.id) || (r.name && merged.name && r.name.toLowerCase() === merged.name.toLowerCase()));
                    if (match) {
                      merged.height = merged.height || match.height;
                      merged.weight = merged.weight || match.weight;
                      merged.position = merged.position || match.position;
                      merged.headshot = merged.headshot || match.headshot;
                    }
                  }
                }
              }
            } catch (e) {}

            return merged;
          }
        }
      } catch (e) {}

      // As a last attempt, try the site players endpoint (may 404); if it works merge it
      try {
        const raw = await _fetchWithCache(`${BASES[league]}/players/${encodeURIComponent(idOrQuery)}`);
        const remoteNorm = _normPlayer(raw);
        const result = Object.assign({}, local, {
          _league: local._league || league,
          headshot: local.headshot || remoteNorm.headshot,
          team: local.team || remoteNorm.team,
          height: local.height || remoteNorm.height,
          weight: local.weight || remoteNorm.weight,
          seasons: remoteNorm.seasons && remoteNorm.seasons.length > 0 ? remoteNorm.seasons : (local.seasons || []),
          currentSeasonStats: remoteNorm.currentSeasonStats || local.currentSeasonStats || null,
          raw: local.raw || remoteNorm.raw
        });
        // Normalize team on the returned result as well
        try {
          if (result.team) {
            let teamObj = result.team;
            // prefer inner shapes: detail.team or team when present
            if (teamObj.detail && teamObj.detail.team) teamObj = teamObj.detail.team;
            else if (teamObj.team && (teamObj.team.displayName || teamObj.team.name)) teamObj = teamObj.team;
            if (!(teamObj.displayName || teamObj.name) && (teamObj.slug || teamObj.id || teamObj.abbreviation)) {
              try { const resolved = await getTeam(result._league || league, teamObj.slug || teamObj.id || teamObj.abbreviation); if (resolved) teamObj = (resolved.detail && resolved.detail.team) ? resolved.detail.team : (resolved.team || resolved); } catch (e) {}
            }
            result.team = teamObj;
          }
        } catch (e) {}
        return result;
      } catch (e) {
        return local;
      }
    }
  } catch (e) {}
  // If no local record, try remote players endpoint then search API
  try { const raw = await _fetchWithCache(`${BASES[league]}/players/${encodeURIComponent(idOrQuery)}`); return _normPlayer(raw); } catch (e) {}
  try { const sp = await searchPlayers(idOrQuery, 10); if (sp && Array.isArray(sp.results) && sp.results.length > 0) return _normPlayer(sp.results[0].object || sp.results[0]); } catch (e) {}
  return null;
}

const espnApi = { listTeams, getTeam, getTeamRoster, buildLocalPlayerIndex, searchPlayersLocal, getPlayerLocalById, getPlayer, searchPlayers };
module.exports = espnApi;
