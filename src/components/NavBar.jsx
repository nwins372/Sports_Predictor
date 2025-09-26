import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import './NavBar.css'; 
import mg from '../assets/mag_glass.png';
import { supabase } from "../supabaseClient";
import espnApi from '../utils/espnApi';

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
        const teams = await espnApi.listTeams('nba');
        if (!mounted) return;
        setLocalTeams(Array.isArray(teams) ? teams : []);
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
          (async () => { try { return await espnApi.searchPlayersLocal(query, 'nba', 30); } catch (e) { return null; } })(),
        ]);

        const localMatches = localTeams.filter(t => (t.displayName || t.name || '').toLowerCase().includes(query.toLowerCase()) || (t.abbreviation || '').toLowerCase() === query.toLowerCase()).slice(0,10).map(t => ({
          type: 'team',
          id: t.id,
          name: t.displayName || t.name || t.fullName || t.location,
          abbr: t.abbreviation || t.location || t.displayName || t.slug,
          href: t.links?.web?.href || t.website || null,
          // try several common locations for team logos
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
            // player/team images can live under different properties depending on the search result shape
            img: r.object?.photo?.href || r.object?.headshot?.href || (r.object?.logos && r.object.logos[0] && r.object.logos[0].href) || (r.object?.team && r.object.team.logos && r.object.team.logos[0] && r.object.team.logos[0].href) || null
          })
        }) : [];

        // map local player results (if any)
        const playerResults = Array.isArray(localPlayers) ? localPlayers.slice(0,12).map(r => ({
          type: 'player',
          id: r.id,
          name: r.name,
          href: r.href || null,
          img: r.img || null,
        })) : [];

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
    const onKey = (e) => {
      if (!showSearch) return;
      if (e.key === 'Escape') { setShowSearch(false); }
      if (e.key === 'ArrowDown') { setActiveIndex(i => Math.min(results.length - 1, i + 1)); }
      if (e.key === 'ArrowUp') { setActiveIndex(i => Math.max(-1, i - 1)); }
      if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
        const r = results[activeIndex];
        // prefer internal routing when possible
        if (r.type && r.type.toLowerCase().includes('team')) {
          const ab = r.abbr || r.id || r.name;
          if (ab) {
            setShowSearch(false);
            navigate(`/team/${encodeURIComponent(ab)}`);
            return;
          }
        }
        if (r.type && r.type.toLowerCase().includes('player')) {
          const pid = r.id;
          if (pid) {
            setShowSearch(false);
            navigate(`/player/${encodeURIComponent(pid)}`);
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
        <Link to="/" className="site-title">SportsPredictor</Link>
      </div>

      <div className="navbar-center">
        <Link to="/following" className="nav-link" id="following">Following</Link>
        <Link to="/sports" className="nav-link" id="sports">Sports</Link>
        <Link to="/sports-news" className="nav-link">Sports News</Link>
        {!session && <Link to="/login" id="login-button">Login</Link>}
        <button className="nav-link icon-placeholder" id="search" onClick={() => { setShowSearch(s => !s); setTimeout(() => inputRef.current?.focus(), 50); }} aria-haspopup="true" aria-expanded={showSearch} aria-label="Search">
          <img src={mg} alt="Search Icon" width="26" height="26" />
        </button>

        {showSearch && (
          <div className="search-popup" role="dialog" aria-label="Search">
            <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search teams or players…" className="search-input" />
            <div className="search-results">
              {loading && <div className="search-loading">Searching…</div>}
              {!loading && results.length === 0 && <div className="search-empty">No results</div>}
              <ul>
                {results.map((r, idx) => {
                  const actionable = (r && (r.id || r.href));
                  return (
                    <li key={(r.href||r.id||r.name||idx)} className={`${idx === activeIndex ? 'active' : ''} ${!actionable ? 'disabled' : ''}`} onMouseEnter={() => setActiveIndex(idx)} onClick={() => {
                      if (!actionable) return; // no-op for unavailable items
                      // click behavior mirrors Enter: prefer internal routing when type suggests team/player
                      if (r.type && r.type.toLowerCase().includes('team')) {
                        const ab = r.abbr || r.id || r.name;
                        if (ab) { setShowSearch(false); navigate(`/team/${encodeURIComponent(ab)}`); return; }
                      }
                      if (r.type && r.type.toLowerCase().includes('player')) {
                        const pid = r.id;
                        if (pid) { setShowSearch(false); navigate(`/player/${encodeURIComponent(pid)}`); return; }
                      }
                      if (r.href) window.open(r.href, '_blank');
                    }}>
                      {r.img ? <img src={r.img} alt={r.name || ''} className="result-img" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }} /> : <div className="result-img placeholder" />}
                      <div style={{display:'flex', flexDirection:'column'}}>
                        <div className="result-type">{r.type}</div>
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