// espnApi - CommonJS adapter for browser and Node test scripts
// Exports: listTeams, getTeam, getTeamRoster, buildLocalPlayerIndex,
// searchPlayersLocal, getPlayerLocalById, getPlayer, searchPlayers

const BASES = {
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl',
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb'
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
    if (Array.isArray(local)) return local.map(t => (t.team || t.raw || t));
    if (local.teams) return local.teams.map(t => (t.team || t.raw || t));
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
    // Validate inner team metadata to ensure this local file actually represents the requested id/slug
    try {
      const localTeamCandidate = local;
      const localSlug = (localTeamCandidate?.detail?.team?.slug || localTeamCandidate?.slug || '').toLowerCase();
      const localId = String(localTeamCandidate?.detail?.team?.id || localTeamCandidate?.id || '').toLowerCase();
      const localDisplay = (localTeamCandidate?.detail?.team?.displayName || localTeamCandidate?.displayName || localTeamCandidate?.name || '').toLowerCase();
      const query = String(idOrSlug || '').toLowerCase();
      if (localSlug === query || localId === query || localDisplay === query || String(query).includes(localSlug) || localSlug.includes(String(query))) {
        try { local._fromLocal = true; local._league = league; } catch (e) {}
        return local;
      }
      // otherwise, ignore this local file and continue to remote/team-list matching below
    } catch (e) {
      // fallthrough
    }
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
            if (tryLocal) {
              // Validate that the local file actually represents the intended team
              try {
                const localTeamCandidate = tryLocal;
                const localSlug = (localTeamCandidate?.detail?.team?.slug || localTeamCandidate?.slug || '').toLowerCase();
                const localId = String(localTeamCandidate?.detail?.team?.id || localTeamCandidate?.id || '').toLowerCase();
                const localDisplay = (localTeamCandidate?.detail?.team?.displayName || localTeamCandidate?.displayName || localTeamCandidate?.name || '').toLowerCase();
                const foundSlug = (found?.slug || '').toLowerCase();
                const foundId = String(found?.id || '').toLowerCase();
                const foundDisplay = (found?.displayName || found?.name || '').toLowerCase();
                // Accept file only if slug/id/displayName matches the found team, otherwise skip (prevents location-only files from matching the wrong team)
                if (localSlug && localSlug === foundSlug) { localTeam = localTeamCandidate; break; }
                if (localId && foundId && localId === foundId) { localTeam = localTeamCandidate; break; }
                if (localDisplay && foundDisplay && localDisplay === foundDisplay) { localTeam = localTeamCandidate; break; }
                // as a last resort, if the trial filename exactly matches the requested trial name, accept it
                if (String(tname).toLowerCase() === String(teamIdOrSlug).toLowerCase()) { localTeam = localTeamCandidate; break; }
              } catch (e) {
                // if validation fails for any reason, skip this file
              }
            }
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
  const localMatches = (idx.list || []).filter(p => (p.name || '').toLowerCase().includes(q)).slice(0, limit).map(p => ({ id: p.id, name: p.name, img: p.head, _league: p._league || league }));
  if (localMatches.length) return localMatches;
  // If no local matches found, fallback to remote search API so teams missing from the local index (e.g., Chargers) are still discoverable
  try {
    const sp = await searchPlayers(query, limit);
    const results = [];
    if (sp && Array.isArray(sp.results)) {
      for (const r of sp.results) {
        // If result is a group with .contents, flatten them
        if (Array.isArray(r.contents) && r.contents.length) {
          for (const c of r.contents) {
            const obj = c.object || c;
              // try to coerce uid-style ids to the numeric trailing id when present
              let id = obj.id || null;
              if (!id && obj.uid) {
                const parts = String(obj.uid).split('~');
                id = parts.length ? parts[parts.length - 1] : obj.uid;
              }
              // prefer numeric id if present in headshot or links
              if (!id) {
                const href = obj.links && (obj.links.web || obj.links.team || obj.links.player) ? (obj.links.web?.href || obj.links.team?.href || obj.links.player?.href) : null;
                const m = href ? String(href).match(/\/(?:id|_id)\/(\d+)/) || String(href).match(/\/(\d+)\./) : null;
                if (m && m[1]) id = m[1];
              }
            const name = obj.displayName || obj.name || null;
              const img = (obj.image && (obj.image.default || obj.image)) || (obj.links && obj.links?.image && obj.links.image?.href) || null;
              const leagueGuess = obj.defaultLeagueSlug || (obj.sport === 'football' ? 'nfl' : (obj.sport === 'basketball' ? 'nba' : null));
              // only include results that are clearly NFL or NBA (avoid MLB/NHL/other sports leaking in)
              if (id && name && (leagueGuess === 'nfl' || leagueGuess === 'nba')) results.push({ id: String(id), name, img, _league: leagueGuess });
          }
          continue;
        }
        const obj = r.object || r;
        // coerce uid-like ids
        let id = obj.id || null;
        if (!id && obj.uid) {
          const parts = String(obj.uid).split('~');
          id = parts.length ? parts[parts.length - 1] : obj.uid;
        }
        const name = obj.displayName || obj.name || null;
        const img = (obj.image && (obj.image.default || obj.image)) || (obj.links && obj.links?.image && obj.links.image?.href) || null;
        const leagueGuess = obj.defaultLeagueSlug || (obj.sport === 'football' ? 'nfl' : (obj.sport === 'basketball' ? 'nba' : null));
        if (id && name && (leagueGuess === 'nfl' || leagueGuess === 'nba')) results.push({ id: String(id), name, img, _league: leagueGuess });
      }
    }
    return results.slice(0, limit);
  } catch (e) {
    return localMatches;
  }
}

async function getPlayerLocalById(id, league = 'nba') {
  const idx = await buildLocalPlayerIndex(league);
  if (!idx) return null;
  if (idx.byId && idx.byId[String(id)]) return idx.byId[String(id)];
  // try numeric espn id lookup if id is numeric-like or if local entries have espnId
  try {
    const numeric = String(id).match(/^\d+$/) ? String(id) : null;
    if (numeric && idx.byEspnId && idx.byEspnId[numeric]) return idx.byEspnId[numeric];
    // if id is uid-like, try extract trailing numeric segment
    if (String(id).includes('~')) {
      const parts = String(id).split('~');
      const last = parts[parts.length - 1];
      if (last && idx.byEspnId && idx.byEspnId[last]) return idx.byEspnId[last];
    }
  } catch (e) {}
  return null;
}

async function searchPlayers(query, limit = 50) { const url = `https://site.web.api.espn.com/apis/search/v2?query=${encodeURIComponent(query)}&limit=${limit}&type=player`; return _fetchWithCache(url); }

async function searchSite(query, limit = 50) { const url = `https://site.web.api.espn.com/apis/search/v2?query=${encodeURIComponent(query)}&limit=${limit}`; return _fetchWithCache(url); }

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
  // Special-case NFL: try the site.web.api athlete overview endpoint as a high-value fallback
  try {
    // If league is nfl, attempt to resolve an athlete id then call getAthleteOverview
    if ((league || '').toLowerCase() === 'nfl') {
      // If idOrQuery is numeric-like, try it directly
      let candidateId = null;
      if (String(idOrQuery).match(/^\d+$/)) candidateId = String(idOrQuery);
      // Otherwise try to discover an id via the search API
      if (!candidateId) {
        try {
          const sp = await searchPlayers(String(idOrQuery), 10);
          if (sp && Array.isArray(sp.results) && sp.results.length > 0) {
            // look through results for a numeric id in .id, .uid or link
            for (const r of sp.results) {
              const objs = Array.isArray(r.contents) && r.contents.length ? r.contents : [r.object || r];
              for (const o of objs) {
                const oid = o && (o.id || (o.uid && String(o.uid).split('~').pop()));
                if (oid && String(oid).match(/^\d+$/)) { candidateId = String(oid); break; }
                // try to extract numeric id from link fields
                const link = o && ((o.link && o.link.web) || (o.links && o.links.web && o.links.web.href) || o.canonicalUrl || null);
                if (link) {
                  const m = String(link).match(/\/(?:id|_id)\/(\d+)/) || String(link).match(/\/(\d+)\./);
                  if (m && m[1]) { candidateId = m[1]; break; }
                }
              }
              if (candidateId) break;
            }
          }
        } catch (e) {}
      }

      if (candidateId) {
        try {
          const overview = await getAthleteOverview('nfl', candidateId);
          if (overview) {
            // normalize overview into a player-like shape
            const playerLike = {
              id: overview.id || candidateId,
              name: overview.name || null,
              headshot: overview.headshot || null,
              height: overview.height || overview.displayHeight || null,
              weight: overview.weight || overview.displayWeight || null,
              position: overview.position || null,
              seasons: overview.seasons || [],
              raw: overview.raw || overview
            };
            return playerLike;
          }
        } catch (e) {}
      }
    }
  } catch (e) {}

  try { const raw = await _fetchWithCache(`${BASES[league]}/players/${encodeURIComponent(idOrQuery)}`); return _normPlayer(raw); } catch (e) {}
  try { const sp = await searchPlayers(idOrQuery, 10); if (sp && Array.isArray(sp.results) && sp.results.length > 0) return _normPlayer(sp.results[0].object || sp.results[0]); } catch (e) {}
  return null;
}

// espnApi export is declared at the end of this file after helper additions
// Fetch recent news articles that mention a player (by id or name). Uses the search v2 article type.
async function getPlayerNews(idOrName, league = 'nba', limit = 10) {
  try {
    let q = idOrName;
    if (String(q).match(/^\d+$/)) {
      // resolve numeric id to a name when possible
      try {
        const p = await getPlayer(league, q);
        if (p && (p.name || p.displayName)) q = p.name || p.displayName;
      } catch (e) {}
    }
    const url = `https://site.web.api.espn.com/apis/search/v2?query=${encodeURIComponent(q)}&limit=${limit}&type=article`;
    const res = await _fetchWithCache(url, 1000 * 60 * 10);
    const items = [];
    if (res && Array.isArray(res.results)) {
      for (const r of res.results) {
        const obj = r.object || r;
        const link = obj.link && obj.link.web ? obj.link.web : (obj.canonicalUrl || (obj.links && obj.links.web && obj.links.web.href) || null);
        const title = obj.headline || obj.displayName || obj.title || obj.name || null;
        const published = obj.datePublished || obj.publishDate || obj.published || null;
        const summary = obj.summary || obj.description || obj.lede || null;
        if (title && link) items.push({ id: obj.id || obj.uid || link, title, url: link, published, summary, raw: obj });
      }
    }
    return items.slice(0, limit);
  } catch (e) { return []; }
}

// Try to extract contract information for a player. ESPN's site payload sometimes contains a contracts field on the player
// object; if not present, fall back to returning contract-related news articles found by searching "<name> contract".
async function getPlayerContracts(league = 'nba', idOrName) {
  try {
    // If idOrName is numeric assume it's an id and fetch the player endpoint
    if (String(idOrName).match(/^\d+$/)) {
      try {
        const raw = await _fetchWithCache(`${BASES[league]}/players/${encodeURIComponent(idOrName)}`, 1000 * 60 * 10);
        const playerObj = raw?.player || raw || {};
        let contracts = playerObj?.contracts || playerObj?.contract || null;
        if (!contracts && playerObj?.player) contracts = playerObj.player.contracts || playerObj.player.contract || null;
        if (contracts) {
          if (!Array.isArray(contracts)) contracts = [contracts];
          return contracts.map(c => ({ team: c?.team || c?.teamName || (c?.team && (c.team.displayName || c.team.name)) || null, start: c?.startDate || c?.from || null, end: c?.endDate || c?.to || null, amount: c?.value || c?.amount || c?.totalValue || c?.salary || null, raw: c }));
        }
      } catch (e) {}
    }
  } catch (e) {}

  // fallback: search news for contract-related articles
  try {
    let name = idOrName;
    if (String(name).match(/^\d+$/)) {
      try { const p = await getPlayer(league, name); if (p && (p.name || p.displayName)) name = p.name || p.displayName; } catch (e) {}
    }
    const sp = await searchPlayers(`${name} contract`, 10);
    const contractArticles = [];
    if (sp && Array.isArray(sp.results)) {
      for (const r of sp.results) {
        const obj = r.object || r;
        const title = obj.headline || obj.displayName || obj.title || '';
        if (title && title.toLowerCase().includes('contract')) {
          const link = obj.link && obj.link.web ? obj.link.web : (obj.canonicalUrl || null);
          contractArticles.push({ title, url: link, summary: obj.summary || null, published: obj.datePublished || null, raw: obj });
        }
      }
    }
    if (contractArticles.length) return { articles: contractArticles };
  } catch (e) {}

  return null;
}

// Fetch full player payload directly from the ESPN site players endpoint and normalize it.
async function getPlayerFull(league = 'nba', idOrQuery) {
  if (!BASES[league]) throw new Error('Unsupported league');
  // Try several common endpoint variants; some ESPN IDs require the '/_/id/{id}' form
  const tried = [];
  const candidates = [
    `${BASES[league]}/players/${encodeURIComponent(idOrQuery)}`,
    `${BASES[league]}/players/_/id/${encodeURIComponent(idOrQuery)}`
  ];
  // If idOrQuery looks like a slug (contains letters and hyphens) try appending it to the _/id variant
  if (typeof idOrQuery === 'string' && idOrQuery.match(/[-a-zA-Z]/)) {
    candidates.push(`${BASES[league]}/players/_/id/${encodeURIComponent(idOrQuery)}/${encodeURIComponent(idOrQuery)}`);
  }

  for (const url of candidates) {
    try {
      tried.push(url);
      const raw = await _fetchWithCache(url, 1000 * 60 * 10);
      if (raw) return _normPlayer(raw);
    } catch (e) {
      // continue to next candidate
    }
  }

  // As a last resort try using the search API to find a player page URL and extract an id from it
  try {
    const sp = await searchPlayers(String(idOrQuery), 10);
    if (sp && Array.isArray(sp.results)) {
      const candidates2 = [];
      for (const r of sp.results) {
        const obj = r.object || r;
        // prefer objects that look like players or have links
        const link = (obj.link && obj.link.web) || obj.canonicalUrl || (obj?.links && obj.links.web && obj.links.web.href) || null;
        if (link) candidates2.push(link);
      }
      for (const l of candidates2) {
        try {
          // try to extract numeric id from the web link
          const m = String(l).match(/\/(?:id|_id)\/(\d+)/) || String(l).match(/\/(?:player)\/(?:_|)id\/(\d+)/);
          const foundId = m ? m[1] : null;
          if (foundId) {
            const tryUrl = `${BASES[league]}/players/_/id/${encodeURIComponent(foundId)}`;
            try {
              const raw2 = await _fetchWithCache(tryUrl, 1000 * 60 * 10);
              if (raw2) return _normPlayer(raw2);
            } catch (e) {}
          }
        } catch (e) {}
      }
    }
  } catch (e) {}

  return null;
}

// Fetch athlete overview from the site.web.api endpoint (useful for NFL athletes)
async function getAthleteOverview(league = 'nfl', athleteId) {
  try {
    // Only NFL currently supported for this endpoint shape
    if (!athleteId) return null;
    const base = 'https://site.web.api.espn.com/apis/common/v3/sports/football/nfl';
    const url = `${base}/athletes/${encodeURIComponent(athleteId)}/overview`;
    const raw = await _fetchWithCache(url, 1000 * 60 * 10);
    if (!raw) return null;
    // Try several likely locations for the athlete object inside the overview payload
    const candidatePaths = [
      raw?.athlete,
      raw?.player,
      raw?.person,
      raw?.data?.athlete,
      raw?.data?.player,
      raw?.data?.person,
      (Array.isArray(raw?.items) && raw.items[0]) || null,
      (Array.isArray(raw?.data?.items) && raw.data.items[0]) || null,
      raw?.content?.athlete,
      raw?.content?.player,
      raw
    ];
    let a = null;
    for (const c of candidatePaths) {
      if (!c) continue;
      // choose object-like candidate that contains at least a name or id or displayHeight/displayWeight
      if (typeof c === 'object' && (c.id || c.personId || c.displayName || c.fullName || c.height || c.displayHeight || c.displayWeight || c.weight)) { a = c; break; }
    }
    if (!a) a = raw;
    const height = a?.height || a?.displayHeight || a?.measurements?.height || (a?.bio && (a.bio.height || a.bio.displayHeight)) || raw?.displayHeight || null;
    const weight = a?.weight || a?.displayWeight || a?.measurements?.weight || (a?.bio && (a.bio.weight || a.bio.displayWeight)) || raw?.displayWeight || null;
    const position = (a?.position && (typeof a.position === 'string' ? a.position : a.position?.abbreviation || a.position?.name)) || a?.positionName || (raw?.position && raw.position.name) || null;
    // attempt to extract seasons/stats if present on the overview
    let seasons = raw?.seasons || raw?.player?.seasons || raw?.stats || a?.seasons || a?.stats || null;
    // normalize site.web.api statistics shape when present: { labels/names, splits: [{ displayName, stats: [...] }] }
    try {
      const statsRoot = raw?.statistics || raw?.stats || null;
      if (statsRoot && Array.isArray(statsRoot.splits) && (Array.isArray(statsRoot.names) || Array.isArray(statsRoot.labels) || Array.isArray(statsRoot.displayNames))) {
        const labels = statsRoot.labels || statsRoot.names || statsRoot.displayNames || [];
        // mapping common uppercase/short labels to canonical keys
        const labelMap = (lbl) => {
          if (!lbl) return null;
          const s = String(lbl).toLowerCase();
          // Passing
          if (s.match(/pass(er)?\b/) || s.match(/^cmp$|^comp$/)) {
            if (s.match(/yd|yards/)) return 'passYds';
            if (s.match(/^td$|tds|touchdown/)) return 'passTds';
            if (s.match(/att|attempt/)) return 'passAtt';
            return 'cmp';
          }
          if (s.match(/^cmp$|^comp$|^comp_pct$/)) return 'cmp';
          if (s.match(/int|ints|interceptions/)) return 'ints';
          if (s.match(/rating|passer/)) return 'passerRating';
          // Rushing
          if (s.match(/rush|rushing/)) {
            if (s.match(/att|attempt/)) return 'rushAtt';
            if (s.match(/td/)) return 'rushTds';
            if (s.match(/yd|yards/)) return 'rushYds';
            return 'rush';
          }
          // Receiving
          if (s.match(/rec|receptions|catch/)) {
            if (s.match(/td/)) return 'recTds';
            if (s.match(/yd|yards/)) return 'recYds';
            if (s.match(/tg|target|tgts/)) return 'targets';
            return 'rec';
          }
          if (s.match(/\bcar\b|carries|carry/)) return 'rushAtt';
          // Defense / misc
          if (s.match(/tackles|tot|total tackles|solo/)) return 'tackles';
          if (s.match(/sacks?/)) return 'sacks';
          if (s.match(/fumble/)) return 'fumbles';
          if (s.match(/^fd$|first down|firstdowns|first down/)) return 'firstDowns';
          // default: slugified label
          return String(lbl).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
        };

  const built = statsRoot.splits.map(sp => {
          // sp.stats may be an array or an object mapping label->value
          let arr = [];
          let statsObj = {};
          // determine split type from labels or the split displayName (passing / receiving / rushing / defense)
          const joinedLabels = labels.join(' ').toLowerCase();
          let splitType = null;
          if (joinedLabels.match(/cmp|comp|pass|passing|qbr|passer/)) splitType = 'pass';
          else if (joinedLabels.match(/rec|receptions|receiving|targets|tg/)) splitType = 'rec';
          else if (joinedLabels.match(/rush|rushing|car|attempts|att|rush_att/)) splitType = 'rush';
          else if (joinedLabels.match(/tackles|sacks|int|interception|fumble/)) splitType = 'def';
          // if split has a displayName like '2025 Passing' prefer that
          const spLabel = String(sp?.displayName || '').toLowerCase();
          if (spLabel.includes('pass') || spLabel.includes('passing')) splitType = 'pass';
          else if (spLabel.includes('rec') || spLabel.includes('receiving')) splitType = 'rec';
          else if (spLabel.includes('rush') || spLabel.includes('rushing') || spLabel.includes('rush')) splitType = 'rush';
          else if (spLabel.includes('def') || spLabel.includes('tackle') || spLabel.includes('sack')) splitType = 'def';

          if (Array.isArray(sp.stats)) {
            arr = sp.stats;
            for (let i = 0; i < labels.length; i++) {
              const rawLabel = labels[i] || i;
              let key = labelMap(rawLabel);
              // remap generic keys to split-specific keys when possible
              if (key === 'yds' && splitType) key = (splitType === 'pass' ? 'passYds' : (splitType === 'rec' ? 'recYds' : (splitType === 'rush' ? 'rushYds' : key)));
              if ((key === 'tds' || key === 'td') && splitType) key = (splitType === 'pass' ? 'passTds' : (splitType === 'rec' ? 'recTds' : (splitType === 'rush' ? 'rushTds' : key)));
              if (key === 'att' && splitType) key = (splitType === 'pass' ? 'passAtt' : (splitType === 'rush' ? 'rushAtt' : key));
              if (key === 'rec' && splitType) key = 'rec';
              const val = arr[i] !== undefined && arr[i] !== null ? (isNaN(Number(arr[i])) ? arr[i] : Number(arr[i])) : null;
              statsObj[key] = val;
            }
          } else if (sp.stats && typeof sp.stats === 'object') {
            // object form: keys may be label names or numeric keys
            for (const rawLabel of labels) {
              const key = labelMap(rawLabel);
              // try several lookup strategies
              const rawKeyCandidates = [rawLabel, String(rawLabel).toUpperCase(), String(rawLabel).toLowerCase(), key];
              let val = null;
              for (const rk of rawKeyCandidates) {
                if (rk && sp.stats[rk] !== undefined) { val = sp.stats[rk]; break; }
              }
              if (val === null) {
                // also check keyed fields like 'passingYards', 'rushYds' inside sp.stats
                if (sp.stats[key] !== undefined) val = sp.stats[key];
                else if (sp.stats[String(rawLabel).replace(/\s+/g,'_')] !== undefined) val = sp.stats[String(rawLabel).replace(/\s+/g,'_')];
              }
              if (val !== null && val !== undefined) {
                let finalKey = key;
                if (finalKey === 'yds' && splitType) finalKey = (splitType === 'pass' ? 'passYds' : (splitType === 'rec' ? 'recYds' : (splitType === 'rush' ? 'rushYds' : finalKey)));
                if ((finalKey === 'tds' || finalKey === 'td') && splitType) finalKey = (splitType === 'pass' ? 'passTds' : (splitType === 'rec' ? 'recTds' : (splitType === 'rush' ? 'rushTds' : finalKey)));
                if (finalKey === 'att' && splitType) finalKey = (splitType === 'pass' ? 'passAtt' : (splitType === 'rush' ? 'rushAtt' : finalKey));
                statsObj[finalKey] = (isNaN(Number(val)) ? val : Number(val));
              }
            }
            // include any other numeric fields not covered by labels
            for (const k of Object.keys(sp.stats)) {
              if (statsObj[k]) continue;
              const v = sp.stats[k];
              if (v !== null && v !== undefined && (typeof v === 'number' || (!isNaN(Number(v)) && v !== '')) ) statsObj[String(k).replace(/\s+/g,'_').toLowerCase()] = isNaN(Number(v)) ? v : Number(v);
            }
          }
          return { season: (statsRoot.displayName || sp.displayName || null), stats: statsObj, raw: sp };
        });
        // aggregate splits into a single combined stats object so pages can show passing/rushing/receiving together
        try {
          const agg = {};
          for (const s of built) {
            const st = s.stats || {};
            for (const k of Object.keys(st)) {
              const v = st[k];
              if (v === null || v === undefined) continue;
              if (agg[k] === undefined || agg[k] === null) agg[k] = v;
              else if (typeof agg[k] === 'number' && typeof v === 'number' && (k.toLowerCase().includes('yd') || k.toLowerCase().includes('td') || k.toLowerCase().includes('att') || k.toLowerCase().includes('rec'))) {
                // prefer the numeric value (do not overwrite), but as a fallback sum complementary values
                // keep existing
              }
            }
          }
          seasons = [{ season: statsRoot.displayName || built[0]?.season || 'overview', stats: agg, raw: raw }];
        } catch (e) {
          seasons = built;
        }
      }
    } catch (e) {}
    return {
      id: a?.id || a?.personId || null,
      name: a?.displayName || a?.fullName || a?.name || null,
      height,
      displayHeight: a?.displayHeight || (height && (typeof height === 'number' ? null : String(height))) || null,
      weight,
      displayWeight: a?.displayWeight || (weight && (typeof weight === 'number' ? null : String(weight))) || null,
      position,
      seasons: Array.isArray(seasons) ? seasons : (seasons ? [seasons] : []),
      raw
    };
  } catch (e) {
    return null;
  }
}

const espnApi = { listTeams, getTeam, getTeamRoster, buildLocalPlayerIndex, searchPlayersLocal, getPlayerLocalById, getPlayer, searchPlayers, searchSite, getPlayerNews, getPlayerContracts, getPlayerFull, getAthleteOverview };
module.exports = espnApi;
