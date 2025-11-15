import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import './NavBar.css';
import mg from '../assets/mag_glass.png';
import { supabase } from "../supabaseClient";
import espnApi from '../utils/espnApi';
import { LanguageSelector } from './LanguageSelector';
import { TranslatedText } from './TranslatedText';

export default function NavBar() {
const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [localTeams, setLocalTeams] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  // helper: normalize token and resolve a canonical local team from in-memory localTeams
  const resolveLocalTeam = (token) => {
    if (!token) return null;
    const normalizeKey = (s) => String(s || '').toLowerCase().replace(/[_\s-]+/g, '');
    const q = normalizeKey(token);
    return localTeams.find(t => {
      const slug = normalizeKey(t.slug || t.displayName || t.name || t.location || '');
      const abbr = normalizeKey(t.abbreviation || '');
      const display = normalizeKey(t.displayName || t.name || '');
      return slug === q || abbr === q || display === q || display.includes(q) || slug.includes(q);
    });
  };
  // helper: derive a short numeric ESPN player id from a search result object when possible
  const getShortPlayerId = async (r) => {
    if (!r) return null;
    const tryExtractFrom = (s) => {
      if (!s) return null;
      const str = String(s);
      // match /id/12345 or /_id/12345 or /players/.../12345.png
      const m1 = str.match(/\/(?:id|_id)\/(\d+)/);
      if (m1 && m1[1]) return m1[1];
      const m2 = str.match(/\/(?:players|full)\/(?:full\/)?(\d+)\./);
      if (m2 && m2[1]) return m2[1];
      const m3 = str.match(/(\d{4,7})/); // fallback: first 4-7 digit block
      if (m3 && m3[1]) return m3[1];
      return null;
    };

    // direct numeric id
    if (String(r.id).match(/^\d+$/)) return String(r.id);

    // uid-like id: take trailing segment after ~ if numeric
    if (r.id && String(r.id).includes('~')) {
      const parts = String(r.id).split('~');
      const last = parts[parts.length - 1];
      if (String(last).match(/^\d+$/)) return last;
    }

    // try href or img
    const href = r.href || (r.object && r.object.links && r.object.links.web && r.object.links.web.href) || null;
    const fromHref = tryExtractFrom(href);
    if (fromHref) return fromHref;
    const fromImg = tryExtractFrom(r.img || (r.object && (r.object.headshot || r.object.photo || (r.object.image && (r.object.image.default || r.object.image)))));
    if (fromImg) return fromImg;

    // try extracting from local index entry if present (may be UUID) and contains headshot/raw link
    try {
      if (espnApi.getPlayerLocalById) {
        const localNba = await espnApi.getPlayerLocalById(r.id, 'nba');
        const localNfl = await espnApi.getPlayerLocalById(r.id, 'nfl');
        const local = localNba || localNfl;
        if (local) {
          const fromLocal = tryExtractFrom(local.head || local.headshot || (local.raw && (local.raw.headshot || local.raw.head)) || (local.raw && local.raw.canonicalUrl) || local.link || local.url);
          if (fromLocal) return fromLocal;
          // also check nested raw link fields
          const rawLink = local.raw && (local.raw.link || (local.raw.links && local.raw.links.web && local.raw.links.web.href));
          const fromRaw = tryExtractFrom(rawLink);
          if (fromRaw) return fromRaw;
        }
      }
    } catch (e) {}

    // last resort: try remote search by name and pick a numeric candidate
    try {
      if (r.name) {
        const sp = await espnApi.searchPlayers(r.name, 8);
        if (sp && Array.isArray(sp.results)) {
          for (const res of sp.results) {
            const obj = res.object || res;
            const candId = obj.id || (obj.uid && String(obj.uid).split('~').pop()) || null;
            if (candId && String(candId).match(/^\d+$/)) return String(candId);
            const link = (obj.link && obj.link.web) || obj.canonicalUrl || (obj.links && obj.links.web && obj.links.web.href) || null;
            const ex = tryExtractFrom(link);
            if (ex) return ex;
          }
        }
      }
    } catch (e) {}

    return null;
  };
  useEffect(() => {
    // Check sessions
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Listener checks for whether user logs in or out
    const subscription = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    // cleanup
    return () => {
      try { subscription?.data?.unsubscribe(); } catch (e) {}
    };
  }, []);

  // load local teams once for quick filtering
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [nbaTeams, nflTeams] = await Promise.all([
          (async () => { try { return await espnApi.listTeams('nba'); } catch (e) { return []; } })(),
          (async () => { try { return await espnApi.listTeams('nfl'); } catch (e) { return []; } })()
        ]);
        if (!mounted) return;
        // store combined teams with league marker
        const wrap = (arr, league) => (Array.isArray(arr) ? arr.map(t => ({...t, _league: league})) : []);
        setLocalTeams([...wrap(nbaTeams, 'nba'), ...wrap(nflTeams, 'nfl')]);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  // handle query with debounce
  useEffect(() => {
    if (!showSearch) return;
    setActiveIndex(-1);
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        // run site search and local player search in parallel; fall back to remote player search if needed
        const [site, localPlayers] = await Promise.all([
          (async () => { try { return await espnApi.searchSite(query, 30); } catch (e) { return null; } })(),
            // run local searches for both NBA and NFL
            (async () => { try {
              const [nbaLocal, nflLocal] = await Promise.all([
                espnApi.searchPlayersLocal(query, 'nba', 30),
                espnApi.searchPlayersLocal(query, 'nfl', 30)
              ]);
              return [...(nbaLocal||[]), ...(nflLocal||[])];
            } catch (e) { return null; } })(),
        ]);

        const localMatches = localTeams.filter(t => (t.displayName || t.name || '').toLowerCase().includes(query.toLowerCase()) || (t.abbreviation || '').toLowerCase() === query.toLowerCase()).slice(0,10).map(t => ({
          type: 'team',
          id: t.id,
          league: t._league || 'nba',
          name: t.displayName || t.name || t.fullName || t.location,
          // prefer slug for routing (matches filename under public/db/espn/<league>)
          abbr: t.slug || t.abbreviation || t.location || t.displayName,
          href: t.links?.web?.href || t.website || null,
          img: (t.raw && t.raw.logos && t.raw.logos[0] && t.raw.logos[0].href) || (t.logos && t.logos[0] && t.logos[0].href) || (t.logo && t.logo.href) || (t.team && t.team.logos && t.team.logos[0] && t.team.logos[0].href) || null
        }));

        const extractIdFromHref = (href) => {
          if (!href) return null;
          // try common ESPN player URL patterns e.g. /player/_/id/12345/name
          const m = href.match(/\/player\/_\/id\/(\d+)/) || href.match(/\/athlete\/profile\/(\d+)/) || href.match(/id=(\d+)/);
          return m ? m[1] : null;
        };

        const siteResults = Array.isArray(site?.results) ? site.results.slice(0,12).map(r => {
          const href = r.object?.links?.web?.href || r.object?.links?.team?.href || r.object?.links?.player?.href || r.object?.link || null;
          const maybeId = r.id || r.object?.id || extractIdFromHref(href);
          return ({
            type: r.type || (r.object?.type) || 'unknown',
            id: maybeId,
            name: r.headline || r.object?.text || r.object?.title || r.object?.displayName || r.object?.name || r.object?.fullName,
            href,
            // try to capture league from known fields
            league: r.object?.defaultLeagueSlug || r.object?.sport || null,
            // player/team images can live under different properties depending on the search result shape
            img: r.object?.photo?.href || r.object?.headshot?.href || (r.object?.logos && r.object.logos[0] && r.object.logos[0].href) || (r.object?.team && r.object.team.logos && r.object.team.logos[0] && r.object.team.logos[0].href) || null
          })
        }) : [];

        // map local player results (if any) and preserve league when available
        let playerResults = [];
        if (Array.isArray(localPlayers)) {
          const hasLeagueProp = localPlayers.some(p => p && (p._league || p.league));
          if (hasLeagueProp) {
            playerResults = localPlayers.map(r => ({ type: 'player', id: r.id, name: r.name, img: r.img || null, league: r._league || r.league }));
          } else {
            playerResults = localPlayers.slice(0,12).map(r => ({ type: 'player', id: r.id, name: r.name, img: r.img || null }));
          }
          playerResults = playerResults.slice(0,12);
        }

        // if no local players found, try the remote searchPlayers endpoint
        if ((!playerResults || playerResults.length === 0)) {
          try {
            const remote = await espnApi.searchPlayers(query, 12);
            if (remote && Array.isArray(remote.results)) {
              const remap = remote.results.map(r => ({ type: 'player', id: r.id || r.object?.id, name: r.headline || r.object?.displayName || r.object?.name || r.object?.fullName, href: r.object?.links?.web?.href || r.object?.links?.player?.href || null, img: r.object?.headshot?.href || r.object?.photo?.href || null }));
              playerResults.push(...remap.slice(0,12));
            }
          } catch (e) {}
        }

        if (!cancelled) {
          // merge and dedupe by href/name
          const combined = [...localMatches, ...playerResults, ...siteResults];
          const seen = new Set();
          const dedup = combined.filter(it => {
            const key = (it.href || '') + '|' + (it.name || '');
            if (seen.has(key)) return false; seen.add(key); return true;
          });
          setResults(dedup.slice(0,25));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(id); };
  }, [query, showSearch, localTeams]);

  // keyboard handlers
  useEffect(() => {
    const makeSlug = (s) => String(s || '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^\w\-_.]/g, '')
      .replace(/^_+|_+$/g, '');

    const normalizeKey = (s) => String(s || '').toLowerCase().replace(/[_\s-]+/g, '');

    // resolve a candidate team token (abbr/name/slug) to the canonical local team slug and league when possible
    const resolveLocalTeam = (token) => {
      if (!token) return null;
      const q = normalizeKey(token);
      return localTeams.find(t => {
        const slug = normalizeKey(t.slug || t.displayName || t.name || t.location || '');
        const abbr = normalizeKey(t.abbreviation || '');
        const display = normalizeKey(t.displayName || t.name || '');
        return slug === q || abbr === q || display === q || display.includes(q) || slug.includes(q);
      });
    };

    const onKey = async (e) => {
      if (!showSearch) return;
      if (e.key === 'Escape') { setShowSearch(false); }
      if (e.key === 'ArrowDown') { setActiveIndex(i => Math.min(results.length - 1, i + 1)); }
      if (e.key === 'ArrowUp') { setActiveIndex(i => Math.max(-1, i - 1)); }
        if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
        const r = results[activeIndex];
        // prefer internal routing when possible
        if (r.type && r.type.toLowerCase().includes('team')) {
          const rawAb = r.slug || r.abbr || r.id || r.name;
          let ab = makeSlug(rawAb);
          let league = r.league || r._league || null;
          // prefer a canonical match from in-memory localTeams (fast and authoritative for served JSON)
          const resolved = resolveLocalTeam(rawAb) || resolveLocalTeam(ab);
          if (resolved) {
            ab = resolved.slug || makeSlug(resolved.displayName || resolved.name || resolved.location || ab);
            league = resolved._league || league;
          } else if (!league && ab) {
            // fallback: try a looser find
            const match = localTeams.find(t => normalizeKey(t.slug) === normalizeKey(ab) || normalizeKey(t.abbreviation) === normalizeKey(ab) || normalizeKey(t.displayName || t.name) === normalizeKey(ab));
            if (match) league = match._league;
          }
          if (ab) {
            setShowSearch(false);
            if (league) { navigate(`/team/${encodeURIComponent(league)}/${encodeURIComponent(ab)}`); } else { navigate(`/team/${encodeURIComponent(ab)}`); }
            return;
          }
        }
        if (r.type && r.type.toLowerCase().includes('player')) {
          let pid = r.id;
          let league = r.league || r._league || null;
          if (!league && pid) {
            // try local NBA index
            try {
              if (espnApi.getPlayerLocalById) {
                const local = await espnApi.getPlayerLocalById(pid, 'nba');
                if (local && local._league) league = local._league;
              }
            } catch (e) {
              // ignore
            }
            // try local NFL index
            if (!league && pid) {
              try {
                if (espnApi.getPlayerLocalById) {
                  const local = await espnApi.getPlayerLocalById(pid, 'nfl');
                  if (local && local._league) league = local._league;
                }
              } catch (e) {
                // ignore
              }
            }
          }
          if (pid) {
            setShowSearch(false);
            const path = league ? `/player/${encodeURIComponent(league)}/${encodeURIComponent(pid)}` : `/player/${encodeURIComponent(pid)}`;
            // pass the result name in location state so the Player page can show a friendly loading label
            navigate(path, { state: { name: r.name || null } });
            return;
          }
        }
        // fallback: open external link
        if (r.href) window.open(r.href, '_blank');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSearch, results, activeIndex, navigate]);
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="site-title"><TranslatedText>SportsPredictor</TranslatedText></Link>
      </div>

      <div className="navbar-center">
        <Link to="/local-sports" className="nav-link" id="local-sports"><TranslatedText>Local Sports</TranslatedText></Link>
        <Link to="/following" className="nav-link" id="following"><TranslatedText>Following</TranslatedText></Link>
        <Link to="/comments" className="nav-link" id="comments"><TranslatedText>Comments</TranslatedText></Link>
        <Link to="/statistics" className="nav-link" id="statistics"><TranslatedText>Statistics</TranslatedText></Link>
        <Link to="/mock-draft" className="nav-link" id="mock-draft"><TranslatedText>Mock Draft</TranslatedText></Link>
        <Link to="/sports-news" className="nav-link"><TranslatedText>Sports News</TranslatedText></Link>
        {!session && <Link to="/login" id="login-button"><TranslatedText>Login</TranslatedText></Link>}
        <Link to="/schedules" className="nav-link"><TranslatedText>Schedules</TranslatedText></Link>
        <LanguageSelector />
        <button className="nav-link icon-placeholder" id="search" onClick={() => { setShowSearch(s => !s); setTimeout(() => inputRef.current?.focus(), 50); }} aria-haspopup="true" aria-expanded={showSearch} aria-label="Search">
          <img src={mg} alt="Search Icon" width="26" height="26" />
        </button>
        
        {showSearch && (
          <div className="search-popup" role="dialog" aria-label="Search">
            <input 
              ref={inputRef} 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder={<TranslatedText>Search teams or players…</TranslatedText>} 
              className="search-input" 
            />
            <div className="search-results">
              {loading && <div className="search-loading"><TranslatedText>Searching…</TranslatedText></div>}
              {!loading && results.length === 0 && <div className="search-empty"><TranslatedText>No results</TranslatedText></div>}
              <ul>
                {results.map((r, idx) => {
                  const actionable = (r && (r.id || r.href));
                  // include league in key when present to avoid duplicate keys across leagues
                  const itemKey = `${r._league || r.league || 'any'}|${r.href||r.id||r.name||idx}`;
                  return (
                    <li key={itemKey} className={`${idx === activeIndex ? 'active' : ''} ${!actionable ? 'disabled' : ''}`} onMouseEnter={() => setActiveIndex(idx)} onClick={async () => {
                      if (!actionable) return; // no-op for unavailable items
                      // click behavior mirrors Enter: prefer internal routing when type suggests team/player
                      if (r.type && r.type.toLowerCase().includes('team')) {
                        let ab = r.abbr || r.id || r.name;
                        let league = r.league || r._league || null;
                        // prefer canonical slug from in-memory localTeams
                        const resolved = resolveLocalTeam(ab);
                        if (resolved) {
                          ab = resolved.slug || (resolved.displayName || resolved.name || resolved.location || ab);
                          league = resolved._league || league;
                        }
                        // last resort: consult remote team lists
                        if (!league && ab) {
                          try {
                            const [nbaTeams, nflTeams] = await Promise.all([
                              (async () => { try { return await espnApi.listTeams('nba'); } catch (e) { return []; } })(),
                              (async () => { try { return await espnApi.listTeams('nfl'); } catch (e) { return []; } })()
                            ]);
                            const findMatch = (arr) => arr.find(t => {
                              const slug = (t.slug || '').toLowerCase();
                              const abbrc = (t.abbreviation || '').toLowerCase();
                              const name = (t.displayName || t.name || '').toLowerCase();
                              const q = String(ab || '').toLowerCase();
                              return slug === q || abbrc === q || name === q || name.includes(q) || slug.includes(q);
                            });
                            const m1 = findMatch(nbaTeams);
                            const m2 = findMatch(nflTeams);
                            if (m1 && !m2) league = 'nba';
                            if (m2 && !m1) league = 'nfl';
                            if (!league && m2 && m1 && String(m2.slug).toLowerCase() === String(ab).toLowerCase()) league = 'nfl';
                            if (!league && m1 && m2 && String(m1.slug).toLowerCase() === String(ab).toLowerCase()) league = 'nba';
                          } catch (e) {}
                        }
                        if (ab) {
                          setShowSearch(false);
                          if (league) { navigate(`/team/${encodeURIComponent(league)}/${encodeURIComponent(ab)}`); } else { navigate(`/team/${encodeURIComponent(ab)}`); }
                          return;
                        }
                      }
                      if (r.type && r.type.toLowerCase().includes('player')) {
                        let pid = r.id;
                        let league = r.league || r._league || null;
                        if (!league && pid) {
                          // try lookup in local index to find league
                          try { const local = await espnApi.getPlayerLocalById(pid, 'nba'); if (local && local._league) league = local._league; } catch (e) {}
                          if (!league && pid) {
                            try { const local = await espnApi.getPlayerLocalById(pid, 'nfl'); if (local && local._league) league = local._league; } catch (e) {}
                          }
                        }
                        if (pid) {
                          // try to normalize to short numeric id when possible
                          try { const short = await getShortPlayerId(r); if (short) pid = short; } catch (e) {}
                          setShowSearch(false);
                          if (league) { navigate(`/player/${encodeURIComponent(league)}/${encodeURIComponent(pid)}`, { state: { name: r.name || null } }); } else { navigate(`/player/${encodeURIComponent(pid)}`, { state: { name: r.name || null } }); }
                          return;
                        }
                      }
                      if (r.href) window.open(r.href, '_blank');
                    }}>
                      {r.img ? <img src={r.img} alt={r.name || ''} className="result-img" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }} /> : <div className="result-img placeholder" />}
                      <div style={{display:'flex', flexDirection:'column'}}>
                        <div style={{display:'flex', gap:8, alignItems:'center'}}>
                          <div className="result-type">{r.type}</div>
                          { (r.league || r._league) && <div className="result-badge">{(r.league || r._league).toUpperCase()}</div> }
                        </div>
                        <div className="result-name">{r.name || 'Unavailable'}</div>
                        {!actionable && <div className="result-unavailable">Unavailable</div>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>

    {/* Signout Button if logged in */}
      <div className="navbar-right">
          {session && ( <button onClick={async () => { await supabase.auth.signOut();}} className="nav-link"> Logout </button>
  )}

  {/* Profile link shown always */}
  { session && <Link to="/profile" className="nav-link" id="profile">Profile</Link> }
        {/* Settings link always available */}
        <Link to="/settings" className="nav-link" id="settings">Settings</Link>
      </div>
    </nav>
  );
}