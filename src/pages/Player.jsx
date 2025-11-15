import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import espnApi from '../utils/espnApi';
import './Player.css';
import FollowButton from '../components/FollowButton';

// Inline ErrorBoundary to catch rendering/runtime errors and show a visible
// message instead of a grey blank screen.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    this.setState({ error, info });
    // still log to console
    console.error('Player page error', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:20,background:'#fff6f6',color:'#800',border:'1px solid #f5c6cb'}}>
          <h3>Something went wrong rendering this player page</h3>
          <div style={{whiteSpace:'pre-wrap',fontFamily:'monospace',fontSize:12}}>{String(this.state.error && this.state.error.toString())}</div>
          {this.state.info && this.state.info.componentStack ? <details style={{marginTop:8}}><summary>Stack</summary><pre style={{whiteSpace:'pre-wrap'}}>{this.state.info.componentStack}</pre></details> : null}
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Player() {
  const params = useParams();
  // support /player/:league/:id and /player/:id
  const id = params.id || Object.values(params).slice(-1)[0];
  const leagueParam = params.league || null;
  const [player, setPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [splitsData, setSplitsData] = useState(null);
  const [gamelogData, setGamelogData] = useState(null);
  const [fantasyNews, setFantasyNews] = useState([]);
  const [showRawOverview, setShowRawOverview] = useState(false);
  const location = useLocation();
  const loadingName = location?.state?.name || null;
  

  // Normalize athlete overview payloads from ESPN into a consistent shape
  const normalizeOverviewPayload = (ov, league) => {
    if (!ov) return { team: null, seasons: [], currentSeasonStats: null, headshot: null };
  const out = { team: null, seasons: [], currentSeasonStats: null, headshot: null, birthDate: null, birthPlace: null, college: null, draft: null, status: null, injuries: [], contracts: [], transactions: [], position: null, height: null, weight: null, stories: [] };
    try {
      // Team info: prefer nested objects or name fields
      const t = ov.team || ov.currentTeam || ov.teamInfo || ov.teamId || ov.teamName || ov.club || ov.teamData || ov.teamObj || null;
      if (t) {
        if (typeof t === 'string') {
          out.team = { displayName: t, slug: String(t).replace(/\s+/g,'_'), abbreviation: null, logos: [] };
        } else if (typeof t === 'object') {
          out.team = {
            id: t.id || t.teamId || t.team_id || null,
            displayName: t.displayName || t.name || t.teamName || t.fullName || null,
            abbreviation: t.abbreviation || t.abbr || null,
            logos: t.logos || t.images || (t.logo ? [{ href: t.logo }] : [])
          };
        }
      }

      // Basic bio fields
      out.birthDate = ov.birthDate || ov.dateOfBirth || ov.dob || ov.birth || null;
      if (ov.birthPlace) {
        if (typeof ov.birthPlace === 'string') out.birthPlace = ov.birthPlace;
        else out.birthPlace = [ov.birthPlace.city, ov.birthPlace.state, ov.birthPlace.country].filter(Boolean).join(', ');
      } else if (ov.placeOfBirth) {
        const b = ov.placeOfBirth;
        out.birthPlace = [b.city, b.state, b.country].filter(Boolean).join(', ');
      }
      out.college = ov.college || (ov.education && ov.education.college) || (ov.school && ov.school.college) || null;

      // draft / status / injuries / contracts / transactions
      out.draft = ov.draft || ov.draftInfo || ov.draftStatus || null;
      out.status = ov.status || ov.currentStatus || (ov.playerStatus && ov.playerStatus.text) || null;
      out.injuries = ov.injuries || ov.injury || ov.health || [];
      out.contracts = ov.contracts || ov.contract || ov.playerContracts || [];
      out.transactions = ov.transactions || ov.transactionHistory || ov.moves || [];

      // physicals & position
      out.position = ov.position || (ov.player && ov.player.position) || null;
      out.height = ov.height || ov.displayHeight || ov.player?.height || null;
      out.weight = ov.weight || ov.displayWeight || ov.player?.weight || null;

      // Headshot
      out.headshot = ov.headshot || ov.head || (ov.images && (ov.images[0] && (ov.images[0].href || ov.images[0].url))) || (ov.player && (ov.player.headshot || ov.player.head)) || null;

      // Stories / related articles: various payloads use different keys
      try {
        const storyCandidates = [];
        if (ov.storylines) storyCandidates.push(ov.storylines);
        if (ov.stories) storyCandidates.push(ov.stories);
        if (ov.story) storyCandidates.push(ov.story);
        if (ov.about) storyCandidates.push(ov.about);
        if (ov.articles) storyCandidates.push(ov.articles);
        if (ov.news) storyCandidates.push(ov.news);
        if (ov.items && Array.isArray(ov.items)) storyCandidates.push(ov.items);
        if (ov.data && ov.data.items) storyCandidates.push(ov.data.items);
        // flatten and normalize simple article objects to {title, url, summary, published}
        const flatten = (arr) => Array.isArray(arr) ? arr.flatMap(x => Array.isArray(x) ? x : [x]) : [];
        const candidatesFlat = flatten(storyCandidates);
        for (const s of candidatesFlat) {
          if (!s) continue;
          // Some story nodes are strings or simple text blocks
          if (typeof s === 'string') out.stories.push({ title: null, url: null, summary: s });
          else if (s.title || s.headline || s.name) {
            const title = s.title || s.headline || s.name || null;
            const url = s.url || (s.link && (s.link.web || s.link.href)) || (s.canonicalUrl || null);
            const summary = s.summary || s.description || s.lede || s.excerpt || null;
            const published = s.datePublished || s.published || s.publishDate || s.publishedDate || null;
            out.stories.push({ title, url, summary, published, raw: s });
          } else if (s.type && (s.type === 'article' || s.type === 'story') && (s.content || s.body || s.summary)) {
            const title = s.headline || s.content?.headline || null;
            const url = s.links?.web?.href || s.link?.web || null;
            const summary = s.summary || s.lede || s.content?.summary || null;
            out.stories.push({ title, url, summary, raw: s });
          }
        }
        // dedupe by url/title
        const seen = new Set();
        out.stories = out.stories.filter(st => {
          const key = (st.url || st.title || st.summary || '').toString();
          if (!key) return false;
          if (seen.has(key)) return false; seen.add(key); return true;
        });
      } catch (e) { /* ignore story parsing errors */ }

      // Seasons normalization: support several shapes, prefer statistics.splits with labels (regular season splits)
      try {
        // Helper: find a statistics root in multiple nested locations used by ESPN
        const findStatsRoot = (root) => {
          if (!root) return null;
          // direct common fields
          if (root.statistics && root.statistics.splits) return root.statistics;
          if (root.stats && root.stats.splits) return root.stats;
          if (root.statisticsRoot && root.statisticsRoot.splits) return root.statisticsRoot;
          // sometimes labels/displayNames live at the same level
          if (root.statistics && (root.statistics.displayNames || root.statistics.labels || root.statistics.names)) return root.statistics;
          if (root.stats && (root.stats.displayNames || root.stats.labels || root.stats.names)) return root.stats;
          // search seasons[].raw.statistics or seasons[].statistics
          const seasons = root.seasons || root.seasonStats || root.seasonsRaw || null;
          if (Array.isArray(seasons)) {
            for (const s of seasons) {
              if (!s) continue;
              if (s.raw && s.raw.statistics) return s.raw.statistics;
              if (s.raw && s.raw.stats) return s.raw.stats;
              if (s.statistics && s.statistics.splits) return s.statistics;
              if (s.stats && s.stats.splits) return s.stats;
              // sometimes the season object itself contains displayNames + splits
              if (s.displayNames && s.splits) return s;
              if (s.labels && s.splits) return s;
            }
          }
          // player wrapper
          if (root.player) return findStatsRoot(root.player);
          if (root.raw) return findStatsRoot(root.raw);
          return null;
        };

        // Only use the statistics root if it explicitly provides displayNames/labels/names and splits.
        // Per request: do NOT fall back to other parts of the payload (seasons, raw, etc.).
        const statsRoot = findStatsRoot(ov);
        if (statsRoot && statsRoot.splits && Array.isArray(statsRoot.splits) && (Array.isArray(statsRoot.labels) || Array.isArray(statsRoot.names) || Array.isArray(statsRoot.displayNames))) {
          const labels = statsRoot.labels || statsRoot.names || statsRoot.displayNames || [];
          const mapLabelsToKey = (lbl) => String(lbl).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
          const built = [];
          for (const sp of statsRoot.splits) {
            const display = sp.displayName || sp.label || sp.name || sp.season || '';
            // prefer regular season splits but if none are labeled as regular season, include all
            const isRegular = String(display).toLowerCase().includes('regular') || String(display).toLowerCase().includes('regular season') || String(display).toLowerCase().includes('season');
            // honor explicit current-season flags when present on split objects
            const isCurrentSplit = !!sp.isCurrent || !!sp.currentSeason || !!sp.is_current;
            // if split.stats is array, map by position using labels order
            const statsObj = {};
            const vals = Array.isArray(sp.stats) ? sp.stats : (sp.stats && typeof sp.stats === 'object' ? Object.values(sp.stats) : []);
            for (let i = 0; i < labels.length; i++) {
              const lbl = labels[i] || i;
              const key = mapLabelsToKey(lbl);
              let rawVal = vals[i] !== undefined && vals[i] !== null ? vals[i] : null;
              if (rawVal !== null) rawVal = String(rawVal).replace(/,/g, '');
              const val = rawVal !== null && rawVal !== '' ? (isNaN(Number(rawVal)) ? rawVal : Number(rawVal)) : null;
              if (val !== null) statsObj[key] = val;
            }
            // also merge object-style stat maps if present
            if (sp.stats && typeof sp.stats === 'object' && !Array.isArray(sp.stats)) {
              for (const k of Object.keys(sp.stats)) {
                const kk = mapLabelsToKey(k);
                if (!(kk in statsObj)) {
                  let v = sp.stats[k];
                  if (v !== null && v !== undefined && v !== '') {
                    v = String(v).replace(/,/g, '');
                    statsObj[kk] = (isNaN(Number(v)) ? v : Number(v));
                  }
                }
              }
            }
            built.push({ season: display || null, stats: statsObj, raw: sp, isRegular, isCurrent: isCurrentSplit });
          }
          // prefer only regular-season splits when available
          const regs = built.filter(b => b.isRegular);
          out.seasons = (regs.length ? regs : built).map(b => ({ season: b.season, stats: b.stats, raw: b.raw, isCurrent: !!b.isCurrent }));
        } else {
          // Do NOT fallback to other season structures. If the API response does not
          // include the canonical displayNames + splits structure, we intentionally leave
          // seasons empty so the UI doesn't pick potentially incorrect stat entries.
          out.seasons = [];
        }
      } catch (e) {
        // fallback to empty seasons
        out.seasons = [];
      }
      if (ov.currentSeasonStats && typeof ov.currentSeasonStats === 'object') out.currentSeasonStats = ov.currentSeasonStats;
      else {
        const cur = out.seasons.find(s => s.isCurrent) || out.seasons[0];
        if (cur) out.currentSeasonStats = cur.stats || null;
      }
    } catch (e) { /* ignore */ }
    return out;
  };

  // Normalize season stat values (convert numeric strings like "1,337" to numbers)
  const normalizeSeasonsValues = (pl) => {
    if (!pl) return pl;
    try {
      const seasons = pl.seasons || [];
      for (const s of seasons) {
        if (!s || !s.stats) continue;
        for (const k of Object.keys(s.stats)) {
          let v = s.stats[k];
          if (v === null || v === undefined) continue;
          if (typeof v === 'string') {
            const cleaned = v.replace(/[,\u00A0]/g, '').trim();
            if (cleaned === '') { s.stats[k] = v; continue; }
            const n = Number(cleaned);
            if (!isNaN(n)) s.stats[k] = n; else s.stats[k] = v;
          }
        }
      }
    } catch (e) {}
    return pl;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      let resolvedPlayer = null;
      try {
        // use unified getPlayer which tries local index, player endpoint, then remote search
        const league = leagueParam || 'nba';
        const p = await espnApi.getPlayer(league, id);
        if (p && mounted) {
          // ensure player has league metadata
          if (!p._league) p._league = league;
          let enriched = p;
          let enrichmentSource = 'local';
          // If local index provided only a compact record with teamSlug, try to resolve full team JSON for logo/team name
          try {
            if (!p.team && p.teamSlug) {
              // try both leagues when unsure
              let t = null;
              try { t = await espnApi.getTeam(p._league || league, p.teamSlug); } catch (e) { t = null; }
              if (!t) {
                try { t = await espnApi.getTeam(p._league === 'nba' ? 'nfl' : 'nba', p.teamSlug); } catch (e) { t = null; }
              }
              if (t) enriched = Object.assign({}, enriched, { team: t });
            }
          } catch (e) {}

          // If no seasons/stats were present, attempt a remote fetch to enrich the player record
          const hasSeasons = (enriched.currentSeasonStats) || (enriched.seasons && enriched.seasons.length > 0);
          if (!hasSeasons) {
            try {
              // Prefer calling the full players endpoint which tends to include seasons and stats
              const remote = await espnApi.getPlayerFull(p._league || league, id);
              if (remote) {
                enriched = Object.assign({}, enriched, {
                  headshot: enriched.headshot || remote.headshot || remote.head,
                  head: enriched.head || remote.head || remote.headshot,
                  team: enriched.team || remote.team || enriched.team,
                  height: enriched.height || remote.height,
                  weight: enriched.weight || remote.weight,
                  seasons: remote.seasons && remote.seasons.length > 0 ? remote.seasons : (enriched.seasons || []),
                  currentSeasonStats: remote.currentSeasonStats || enriched.currentSeasonStats || null,
                  raw: enriched.raw || remote.raw
                });
                enrichmentSource = 'getPlayerFull';
              }
            } catch (e) {
              // fallback: try the existing getPlayer (which may search) in the alternate league
              try {
                const remoteAlt = await espnApi.getPlayer(p._league || league, id);
                if (remoteAlt) { enriched = Object.assign({}, enriched, { seasons: remoteAlt.seasons || enriched.seasons, currentSeasonStats: remoteAlt.currentSeasonStats || enriched.currentSeasonStats, team: enriched.team || remoteAlt.team }); enrichmentSource = 'getPlayer'; }
              } catch (e2) {}
            }
            // If still no seasons, try to pull physicals and position info from the team's roster entries
            if ((!enriched.seasons || enriched.seasons.length === 0) && enriched.team && enriched.team.detail) {
              try {
                const det = enriched.team.detail || enriched.team;
                const roster = det?.roster?.athletes || det?.roster?.entries || det?.athletes || det?.team?.roster || [];
                const flat = Array.isArray(roster) ? roster.flatMap(r => (r.items || [r])) : [];
                const match = flat.find(a => {
                  const idc = a?.athlete?.id || a?.person?.id || a?.id || a?.athlete?.personId || a?.person?.personId;
                  return String(idc) === String(id) || String(a?.athlete?.id) === String(id) || String(a?.id) === String(id);
                });
                if (match) {
                  const athlete = match?.athlete || match?.person || match || {};
                  enriched.height = enriched.height || athlete?.height || athlete?.displayHeight || athlete?.bio?.height || athlete?.measurements?.height;
                  enriched.weight = enriched.weight || athlete?.weight || athlete?.displayWeight || athlete?.bio?.weight || athlete?.measurements?.weight;
                  enriched.position = enriched.position || (athlete?.position && (typeof athlete.position === 'string' ? athlete.position : athlete.position?.abbreviation || athlete.position?.name)) || athlete?.positionName || null;
                  enrichmentSource = enrichmentSource || 'teamRoster';
                }
              } catch (e) {}
            }
            // NFL-specific: try the athlete overview endpoint as an extra fallback (espn site.web api)
            try {
              if ((!enriched.seasons || enriched.seasons.length === 0 || !enriched.height || !enriched.weight) && (p._league || league) === 'nfl') {
                // Attempt to derive a numeric athlete id for the overview endpoint when the local id is a UUID or slug
                const extractNumericId = (obj, fallbackId) => {
                  // prefer explicit numeric id
                  if (String(fallbackId).match(/^\d+$/)) return String(fallbackId);
                  try {
                    // try to extract from headshot url (/full/{digits}.png)
                    const head = obj?.head || obj?.headshot || obj?.photo || obj?.images?.[0]?.url || obj?.headshot?.href;
                    if (head) {
                      const m = String(head).match(/\/(?:full|players)\/(?:full\/)?(\d+)\.png/) || String(head).match(/\/(\d+)\.png/);
                      if (m && m[1]) return m[1];
                    }
                  } catch (e) {}
                  try {
                    // try to parse link fields in raw payload
                    const r = obj?.raw || obj;
                    const link = r?.link?.web || r?.links?.web?.href || r?.canonicalUrl || r?.url || null;
                    if (link) {
                      const m2 = String(link).match(/\/(?:id|_id)\/(\d+)/) || String(link).match(/\/(\d+)\//);
                      if (m2 && m2[1]) return m2[1];
                    }
                  } catch (e) {}
                  return null;
                };

                const athleteId = extractNumericId(enriched, id);
                let ov = null;
                if (athleteId) ov = await espnApi.getAthleteOverview(p._league || league, athleteId);
                // as a last resort, try by name if numeric id not found
                if (!ov) {
                  try { ov = await espnApi.getAthleteOverview(p._league || league, enriched.id || enriched.name); } catch (e) { ov = null; }
                }
                if (ov) {
                  enriched.height = enriched.height || ov.height || ov.displayHeight;
                  enriched.weight = enriched.weight || ov.weight || ov.displayWeight;
                  enriched.position = enriched.position || ov.position;
                  enriched.seasons = (enriched.seasons && enriched.seasons.length) ? enriched.seasons : (ov.seasons || enriched.seasons || []);
                  enriched.raw = enriched.raw || ov.raw;
                  enrichmentSource = 'athleteOverview';
                }
              }
            } catch (e) {}
          }

          // attach a hint about which enrichment source supplied seasons/physicals
          enriched._enrichmentSource = enrichmentSource;
          if (mounted) { normalizeSeasonsValues(enriched); setPlayer(enriched); resolvedPlayer = enriched; }
          // attempt to fetch athlete overview (site.web.api) for both NBA and NFL to get richer info
          try {
            const tryOverview = async () => {
              // prefer numeric athlete id when available
              const extractNumericId = (obj, fallbackId) => {
                if (String(fallbackId).match(/^\d+$/)) return String(fallbackId);
                try {
                  const head = obj?.head || obj?.headshot || obj?.photo || obj?.images?.[0]?.url || obj?.headshot?.href;
                  if (head) {
                    const m = String(head).match(/\/(?:full|players)\/(?:full\/)?(\d+)\.png/) || String(head).match(/\/(\d+)\.png/);
                    if (m && m[1]) return m[1];
                  }
                } catch (e) {}
                try {
                  const r = obj?.raw || obj;
                  const link = r?.link?.web || r?.links?.web?.href || r?.canonicalUrl || r?.url || null;
                  if (link) {
                    const m2 = String(link).match(/\/(?:id|_id)\/(\d+)/) || String(link).match(/\/(\d+)\//);
                    if (m2 && m2[1]) return m2[1];
                  }
                } catch (e) {}
                return null;
              };

              let athleteId = extractNumericId(enriched, id) || extractNumericId(enriched, enriched.id) || null;
              let ov = null;
              try {
                if (athleteId) ov = await espnApi.getAthleteOverview(enriched._league || league, athleteId);
              } catch (e) { ov = null; }
              if (!ov) {
                try { ov = await espnApi.getAthleteOverview(enriched._league || league, enriched.name || enriched.displayName || id); } catch (e) { ov = null; }
              }
              return ov;
            };

            const overview = await tryOverview();
              if (overview && mounted) {
              // normalize overview and merge into player
              const norm = normalizeOverviewPayload(overview, enriched._league || league);
              const merged = Object.assign({}, enriched, { _overview: overview });
              merged._overviewNormalized = norm;
              // top-level fields
              merged.height = merged.height || overview.height || overview.displayHeight || merged.height;
              merged.weight = merged.weight || overview.weight || overview.displayWeight || merged.weight;
              merged.position = merged.position || overview.position || merged.position;
              // team: prefer existing player.team, otherwise use normalized overview team
              if ((!merged.team || !merged.team.displayName) && norm.team) merged.team = norm.team;
              if (!merged.head && norm.headshot) merged.head = norm.headshot;
              // seasons/current stats: prefer existing, otherwise normalized overview seasons
              merged.seasons = (merged.seasons && merged.seasons.length) ? merged.seasons : (norm.seasons || merged.seasons || []);
              merged.currentSeasonStats = merged.currentSeasonStats || norm.currentSeasonStats || null;
              merged._athleteOverviewFetched = true;
              // attach any overview-extracted stories and try to fetch news/articles
              try {
                if (norm && Array.isArray(norm.stories) && norm.stories.length) merged._overviewStories = norm.stories;
                try {
                  const news = await espnApi.getPlayerNews(merged.id || merged.name || id, merged._league || league);
                  if (news && Array.isArray(news) && news.length) merged._news = news;
                } catch (e) { /* ignore news fetch errors */ }
              } catch (e) {}
              if (mounted) { normalizeSeasonsValues(merged); setPlayer(merged); resolvedPlayer = merged; }
            }
          } catch (e) {
            // ignore overview fetch errors
          }
          // return early removed to allow overview merge
        }

        // If not found, try the local indexes across both leagues (id might live in the other league)
        try {
          const localFromSame = await espnApi.getPlayerLocalById(id, league);
          if (localFromSame && mounted) {
            // enrich compact record: resolve team if teamSlug present
            if (localFromSame.teamSlug && !localFromSame.team) {
              try { const t = await espnApi.getTeam(localFromSame._league || league, localFromSame.teamSlug); if (t) localFromSame.team = t; } catch (e) {}
            }
            // only set a local compact record if we don't already have a richer resolved player
            if (!resolvedPlayer || (!(resolvedPlayer.seasons && resolvedPlayer.seasons.length) && !resolvedPlayer._athleteOverviewFetched)) {
              setPlayer(localFromSame); resolvedPlayer = localFromSame; return;
            }
          }
        } catch (e) {}

        try {
          // try the other league if league wasn't specified
          if (!leagueParam) {
            const alt = league === 'nba' ? 'nfl' : 'nba';
            const localAlt = await espnApi.getPlayerLocalById(id, alt);
            if (localAlt && mounted) {
              if (localAlt.teamSlug && !localAlt.team) {
                try { const t2 = await espnApi.getTeam(localAlt._league || alt, localAlt.teamSlug); if (t2) localAlt.team = t2; } catch (e) {}
              }
              if (!resolvedPlayer || (!(resolvedPlayer.seasons && resolvedPlayer.seasons.length) && !resolvedPlayer._athleteOverviewFetched)) {
                setPlayer(localAlt); resolvedPlayer = localAlt; return;
              }
            }
          }
        } catch (e) {}

        // Last resort: run the remote search API and pick the first matching player
        try {
          const res = await espnApi.searchPlayers(id, 20);
          const found = (res?.results || []).find(r => String(r.id) === String(id) || String(r.object?.id) === String(id) || String(r.object?.id) === String(id));
          if (found && mounted && !resolvedPlayer) { setPlayer(found.object || found); resolvedPlayer = found.object || found; return; }
          // If nothing matched by id, use the first player-like result if present
          const first = (res?.results || []).find(r => (r.object && (r.object.player || r.object.athlete || r.object.id)));
          if (first && mounted && !resolvedPlayer) { setPlayer(first.object || first); resolvedPlayer = first.object || first; return; }
        } catch (e) {}
      } catch (e) { /* swallow, show loading/no-data UI below */ }
    })();
    return () => { mounted = false; };
  }, [id, leagueParam]);

  // When the resolved player changes, fetch canonical splits/gamelog/news from site.web.api
  useEffect(() => {
    if (!player) return;
    let mounted = true;
    (async () => {
      // compute league from the resolved player or the route param; avoid
      // referencing `playerLeague` here because it's declared later in the
      // component and referencing it before declaration causes a runtime
      // ReferenceError (which produced the grey screen).
      const league = player._league || leagueParam || 'nfl';
      const extractNumericId = (obj, fallbackId) => {
        if (!obj && !fallbackId) return null;
        if (String(fallbackId).match(/^\d+$/)) return String(fallbackId);
        try {
          const head = obj?.head || obj?.headshot || obj?.photo || obj?.images?.[0]?.url || obj?.headshot?.href || null;
          if (head) {
            const m = String(head).match(/\/(?:full|players)\/(?:full\/)?(\d+)\.png/) || String(head).match(/\/(\d+)\.png/);
            if (m && m[1]) return m[1];
          }
        } catch (e) {}
        try {
          const r = obj?.raw || obj;
          const link = r?.link?.web || r?.links?.web?.href || r?.canonicalUrl || r?.url || null;
          if (link) {
            const m2 = String(link).match(/\/(?:id|_id)\/(\d+)/) || String(link).match(/\/(\d+)\//);
            if (m2 && m2[1]) return m2[1];
          }
        } catch (e) {}
        return null;
      };

      const athleteId = extractNumericId(player, player?.id || player?.espnId || id);
      try {
        if (athleteId) {
          const s = await espnApi.getPlayerSplits(league, athleteId);
          if (mounted) setSplitsData(s || null);
          const g = await espnApi.getPlayerGamelog(league, athleteId);
          if (mounted) setGamelogData(g || null);
          const fn = await espnApi.getPlayerFantasyNews(athleteId, 50);
          if (mounted && Array.isArray(fn)) setFantasyNews(fn || []);
        }
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, [player, id, leagueParam]);

  if (!player) return (
    <div className="player-page">Loading {loadingName ? (`${loadingName}`) : (`player ${id}`)}…</div>
  );
  const name = player?.name || player?.displayName || player?.fullName || player?.headline;
  const head = player?.head || player?.headshot?.href || player?.photo?.href || player?.images?.[0]?.url || null;
  const extractTeamObj = (p) => {
    if (!p) return null;
    // prefer explicit normalized overview team
    if (p._overviewNormalized && p._overviewNormalized.team) return p._overviewNormalized.team;
    if (p._overview && p._overview.team) return p._overview.team;
    let t = p.team || null;
    if (!t && p.teamName) t = { displayName: p.teamName };
    // drill into common wrappers
    try {
      if (t && t.detail && t.detail.team) t = t.detail.team;
      if (t && t.team && (t.team.displayName || t.team.name)) t = t.team;
    } catch (e) {}
    // final normalization: ensure displayName exists when available
    if (t && !(t.displayName || t.name) && (t.slug || t.abbreviation)) {
      return { displayName: t.displayName || t.name || t.slug || t.abbreviation, abbreviation: t.abbreviation || null, slug: t.slug || null, logos: t.logos || t.images || [] };
    }
    return t;
  };
  const teamObj = extractTeamObj(player);
  const team = teamObj?.displayName || teamObj?.name || player?.teamName || null;
  // derive player's league: prefer explicit metadata, then route param, otherwise null
  const playerLeague = player?._league || leagueParam || null;
  // derive a team logo url from common locations; do NOT fallback to the app icon (avoid showing React logo)
  const teamLogo = teamObj?.logos?.[0]?.href || teamObj?.logo || teamObj?.image?.url || teamObj?.logoURL || null;
  const position = player?.position || player?.position?.abbreviation || player?.positionName || player?.bio?.position || null;
  // physicals: try normalized props then fallbacks
  const _rawHeight = player?.height || player?.bio?.height || player?.displayHeight || (player?.seasons && player.seasons[0] && player.seasons[0].height) || null;
  const _rawWeight = player?.weight || player?.bio?.weight || player?.displayWeight || (player?.seasons && player.seasons[0] && player.seasons[0].weight) || null;
  const formatHeight = (h) => {
    if (!h) return null;
    if (typeof h === 'string') {
      if (h.includes("'") || h.toLowerCase().includes('cm') || h.toLowerCase().includes('ft')) return h;
      const n = parseInt(h.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(n) && n > 50) { const ft = Math.floor(n/12); const inch = n % 12; return `${ft}'${inch}"`; }
      return h;
    }
    if (typeof h === 'number') { const ft = Math.floor(h/12); const inch = h % 12; return `${ft}'${inch}"`; }
    return null;
  };
  const formatWeight = (w) => {
    if (!w) return null;
    if (typeof w === 'string') {
      if (w.toLowerCase().includes('lb') || w.toLowerCase().includes('kg')) return w;
      const n = parseInt(w.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(n)) return `${n} lbs`;
      return w;
    }
    if (typeof w === 'number') return `${w} lbs`;
    return null;
  };
  const height = formatHeight(_rawHeight);
  const weight = formatWeight(_rawWeight);
  const overview = player?._overviewNormalized || player?._overview || null;

  const renderSeasonTable = (season) => {
    if (!season) return null;
    const stats = (season.stats || season || {});
    const keys = Object.keys(stats).filter(k => stats[k] !== null && stats[k] !== undefined).slice(0, 40);
    // mapping for pretty labels
    const labelMap = {
      // passing
      completions: 'Comp',
      cmp: 'Comp',
      passing_attempts: 'Att',
  pass_att: 'Att',
  passAttempts: 'Att',
      completion_percentage: 'Comp %',
      completion_rate: 'Comp %',
      passing_yards: 'YDS',
      pass_yards: 'YDS',
      passYds: 'YDS',
      passing_touchdowns: 'TD',
      pass_tds: 'TD',
      interceptions: 'INT',
      ints: 'INT',
      passer_rating: 'RTG',
      // rushing/receiving
      rushing_attempts: 'Att',
      rushAtt: 'Att',
      rushing_yards: 'YDS',
      rec: 'REC',
      receptions: 'REC',
      receiving_yards: 'YDS',
      receiving_targets: 'TGT',
      receiving_touchdowns: 'TD',
      // NBA common
      games_played: 'GP',
      minutes_per_game: 'MPG',
      points_per_game: 'PTS',
      rebounds_per_game: 'REB',
      assists_per_game: 'AST',
      field_goal_percentage: 'FG%',
      '3point_field_goal_percentage': '3P%',
      free_throw_percentage: 'FT%'
    };
    const prettyLabel = (k) => {
      if (!k) return k;
      if (labelMap[k]) return labelMap[k];
      // fallback: replace underscores and camelCase -> Title Case
      const fromSnake = String(k).replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
      return fromSnake.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };
    return (
      <table className="overview-season-table">
        <thead><tr><th>Stat</th><th>Value</th></tr></thead>
        <tbody>
          {keys.map(k => (
            <tr key={k}><td className="stat-key">{prettyLabel(String(k))}</td><td className="stat-val">{String(stats[k])}</td></tr>
          ))}
        </tbody>
      </table>
    );
  };
  // prefer currentSeasonStats; otherwise select the most recent season (highest season year) as offseason fallback
  // Helper: choose best season object (prefer explicit currentSeasonStats, then seasons[].isCurrent, then highest season year)
  const chooseBestSeason = (p) => {
    if (!p) return null;
    // only prefer currentSeasonStats if it actually contains numeric stat fields
    const hasNumericStats = (s) => {
      if (!s || typeof s !== 'object') return false;
      // include common NBA and NFL stat keys
      const keys = ['pts','points','p','ppg','reb','rebounds','r','rpg','ast','assists','a','apg','mpg','minutesPerGame','m',
        // NFL passing
        'passYds','passingYards','passAttempts','passAtt','cmp','completions','yds','passTd','passTds','tds','ints','int','rating','passerRating',
        // NFL rushing/receiving
        'rushYds','rushingYards','rushAtt','rushAttempts','rushTds','rec','receptions','recYds','receivingYards','targets','recTds',
        // defensive
        'tackles','sacks','ff','fumbles'
      ];
      return keys.some(k => typeof s[k] === 'number' || (typeof s[k] === 'string' && !isNaN(parseFloat(s[k]))));
    };
    if (p.currentSeasonStats && hasNumericStats(p.currentSeasonStats)) return { stats: p.currentSeasonStats, seasonLabel: 'current' };
    const seasons = p.seasons || [];
    if (Array.isArray(seasons) && seasons.length) {
      // prefer an explicit isCurrent === true flag ONLY. Do NOT use seasons where isCurrent is explicitly false.
      const current = seasons.find(s => s.isCurrent === true);
      if (current && (current.stats || Object.keys(current).length)) return { stats: current.stats || current, seasonLabel: current.season || (current.raw && (current.raw.season || current.raw.seasonYear)) || 'current' };
      // If no explicit current season present, do not fall back to non-current seasons (respect 'isCurrent:false' markers)
      return null;
    }
    return null;
  };
  // Heuristic: inspect raw payload for common stat fields when normalized seasons are missing
  const extractStatsFromRaw = (p) => {
    if (!p || !p.raw) return null;
    const raw = p.raw || {};
    // common places where stats may appear
    const candidates = [];
    if (raw.currentSeasonStats) candidates.push(raw.currentSeasonStats);
    if (raw.player && raw.player.stats) candidates.push(raw.player.stats);
    if (raw.player && raw.player.seasons) candidates.push(raw.player.seasons);
    if (raw.stats) candidates.push(raw.stats);
    if (raw.seasons) candidates.push(raw.seasons);
    if (raw.splits) candidates.push(raw.splits);
    if (raw.seasonStats) candidates.push(raw.seasonStats);
    // sometimes ESPN returns per-game abbreviations or ppg/rpg/apg
    // deep search for numeric fields
    const flat = [].concat(...candidates.map(c => Array.isArray(c) ? c : [c]));
    for (const cand of flat) {
      if (!cand) continue;
      // cand may be an object with stats map or direct fields
      const stats = cand.stats || cand.stat || cand;
      if (stats && (stats.pts || stats.points || stats.p || stats.ppg || stats.reb || stats.rebounds || stats.r || stats.rpg || stats.ast || stats.assists || stats.a || stats.apg || stats.mpg)) {
        return stats;
      }
      // sometimes stats are flattened in the object itself
      const maybe = {};
      const keys = ['pts','points','p','ppg','reb','rebounds','r','rpg','ast','assists','a','apg','mpg','minutesPerGame','m'];
      let found = false;
      for (const k of keys) {
        if (cand[k] !== undefined) { maybe[k] = cand[k]; found = true; }
      }
      if (found) return maybe;
    }

    // fallback: scan raw for top-level numeric summaries
    const top = raw.player || raw.athlete || raw;
    if (top) {
      const maybe = {};
      ['pts','points','p','reb','rebounds','r','ast','assists','a','mpg','minutesPerGame','m'].forEach(k => { if (top[k] !== undefined) maybe[k] = top[k]; });
      if (Object.keys(maybe).length) return maybe;
    }
    return null;
  };
  // if chooseBestSeason didn't yield anything try raw extractor
  const seasonPick = chooseBestSeason(player) || (player ? { stats: extractStatsFromRaw(player), seasonLabel: 'last-available' } : null);
  const currentStats = seasonPick ? seasonPick.stats : null;
  const statsSeasonLabel = seasonPick ? seasonPick.seasonLabel : null;

  // Debug: show enrichment source and chosen season in browser console for verification
  try { console.debug && console.debug('Player enrichment', { id: player?.id || id, league: playerLeague, enrichment: player?._enrichmentSource, seasonLabel: statsSeasonLabel, stats: currentStats }); } catch (e) {}

  return (
    <ErrorBoundary>
    <div className="player-page">
      {/* Debug banner to surface key state when the page appears blank */}
      <div style={{padding:6,background:'#eee',color:'#333',fontSize:12,borderBottom:'1px solid #ddd'}}>
        Debug: route id={String(id)} | playerId={String(player?.id || '')} | league={String(player?._league || leagueParam || '')} | enrichment={String(player?._enrichmentSource || '')} | activeTab={activeTab}
      </div>
      <div className="player-hero">
        {head ? <img src={head} alt={name} className="player-headshot" /> : <div className="player-headshot placeholder" />}
        <div>
          <div className="player-name">{name}</div>
          <div className="player-meta">
            {team ? (
              <a href={`/team/${encodeURIComponent(playerLeague || 'nba')}/${encodeURIComponent(teamObj?.abbreviation || teamObj?.slug || team || '')}`} className="team-link">
                {teamLogo ? <img src={teamLogo} alt={team} className="team-logo" /> : null}
                {team}
              </a>
            ) : (
              <span className="free-agent"><span className="league-badge">{(playerLeague || 'NBA').toUpperCase()}</span> Free Agent</span>
            )}
            {position ? ` • ${position}` : ''} • Player ID: {player?.id || id}
          </div>
          {/* Follow button placed next to player meta */}
          <div style={{marginTop:8}}>
            <FollowButton entityType="player" entityId={player?.id || id} />
          </div>
        </div>
      </div>

      <div className="player-tabs" style={{marginTop:16}}>
        <div style={{display:'flex',gap:8,marginBottom:8}}>
          <button onClick={() => setActiveTab('overview')} className={activeTab === 'overview' ? 'tab active' : 'tab'}>Overview</button>
          <button onClick={() => setActiveTab('stats')} className={activeTab === 'stats' ? 'tab active' : 'tab'}>Stats</button>
          <button onClick={() => setActiveTab('gamelog')} className={activeTab === 'gamelog' ? 'tab active' : 'tab'}>Gamelog</button>
          <button onClick={() => setActiveTab('news')} className={activeTab === 'news' ? 'tab active' : 'tab'}>News</button>
        </div>

        <div className="tab-content">
          {activeTab === 'stats' && (
            <div>
              <strong>Stats (site.web.api splits)</strong>
              <div style={{marginTop:8}}>
                {splitsData ? (
                  (() => {
                    // try to parse canonical statistics root
                    const statsRoot = splitsData?.statistics || splitsData?.stats || splitsData;
                    if (statsRoot && Array.isArray(statsRoot.splits) && (Array.isArray(statsRoot.labels) || Array.isArray(statsRoot.names) || Array.isArray(statsRoot.displayNames))) {
                      const labels = statsRoot.labels || statsRoot.names || statsRoot.displayNames || [];
                      const mapLabelsToKey = (lbl) => String(lbl).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                      const built = [];
                      for (const sp of statsRoot.splits) {
                        const display = sp.displayName || sp.label || sp.name || sp.season || '';
                        const vals = Array.isArray(sp.stats) ? sp.stats : (sp.stats && typeof sp.stats === 'object' ? Object.values(sp.stats) : []);
                        const statsObj = {};
                        for (let i = 0; i < labels.length; i++) {
                          const lbl = labels[i] || i;
                          const key = mapLabelsToKey(lbl);
                          let rawVal = vals[i] !== undefined && vals[i] !== null ? vals[i] : null;
                          if (rawVal !== null) rawVal = String(rawVal).replace(/,/g, '');
                          const val = rawVal !== null && rawVal !== '' ? (isNaN(Number(rawVal)) ? rawVal : Number(rawVal)) : null;
                          if (val !== null) statsObj[key] = val;
                        }
                        built.push({ season: display || null, stats: statsObj, raw: sp });
                      }
                      // prefer regular season split
                      const regs = built.filter(b => String(b.season || '').toLowerCase().includes('regular'));
                      const chosen = regs.length ? regs[0] : (built[0] || null);
                      return chosen ? renderSeasonTable(chosen) : <div style={{color:'var(--muted)'}}>No splits found</div>;
                    }
                    return <div style={{color:'var(--muted)'}}>No splits available for this player.</div>;
                  })()
                ) : (
                  <div style={{color:'var(--muted)'}}>Loading splits…</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'gamelog' && (
            <div>
              <strong>Gamelog</strong>
              <div style={{marginTop:8}}>
                {gamelogData ? (
                  (() => {
                    const games = gamelogData?.games || gamelogData?.events || gamelogData?.items || gamelogData?.data || null;
                    if (!games) return <div style={{color:'var(--muted)'}}>No gamelog data available.</div>;
                    const arr = Array.isArray(games) ? games : (games?.entries || []);
                    if (!arr || arr.length === 0) return <div style={{color:'var(--muted)'}}>No gamelog entries.</div>;
                    return (
                      <table className="overview-season-table">
                        <thead><tr><th>Date</th><th>Oppt</th><th>Summary</th></tr></thead>
                        <tbody>
                          {arr.slice(0,50).map((g, i) => {
                            const date = g.date || g.gameDate || g.eventDate || (g.raw && g.raw.date) || null;
                            const opp = (g.opponent && (g.opponent.displayName || g.opponent.abbreviation)) || g.opponentName || (g.game && g.game.opponent) || null;
                            const summary = g.summary || g.line || JSON.stringify(g.stats || g.box || g.raw || {}).slice(0,200);
                            return <tr key={i}><td>{date}</td><td>{opp}</td><td style={{maxWidth:600}}>{summary}</td></tr>;
                          })}
                        </tbody>
                      </table>
                    );
                  })()
                ) : (
                  <div style={{color:'var(--muted)'}}>Loading gamelog…</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'news' && (
            <div>
              <strong>News</strong>
              <div style={{marginTop:8}}>
                {((fantasyNews && fantasyNews.length) || (player && player._news && player._news.length) || (player && player._overviewStories && player._overviewStories.length)) ? (
                  <div>
                    {fantasyNews && fantasyNews.map((a, i) => (
                      <div key={`fn-${i}`} style={{marginBottom:8}}>
                        {a.title ? <div style={{fontWeight:600}}><a href={a.url} target="_blank" rel="noreferrer">{a.title}</a></div> : null}
                        {a.summary ? <div style={{color:'var(--muted)'}}>{a.summary}</div> : null}
                        {a.published ? <div style={{fontSize:12, color:'var(--muted)'}}>{a.published}</div> : null}
                      </div>
                    ))}
                    {player._news && player._news.map((a, i) => (
                      <div key={`pn-${i}`} style={{marginBottom:8}}>
                        {a.title ? <div style={{fontWeight:600}}><a href={a.url} target="_blank" rel="noreferrer">{a.title}</a></div> : null}
                        {a.summary ? <div style={{color:'var(--muted)'}}>{a.summary}</div> : null}
                        {a.published ? <div style={{fontSize:12, color:'var(--muted)'}}>{a.published}</div> : null}
                      </div>
                    ))}
                    {player._overviewStories && player._overviewStories.map((s, i) => (
                      <div key={`os-${i}`} style={{marginBottom:8}}>
                        {s.title ? <div style={{fontWeight:600}}>{s.title}</div> : null}
                        {s.summary ? <div style={{color:'var(--muted)'}}>{s.summary}</div> : null}
                        {s.url ? <div><a href={s.url} target="_blank" rel="noreferrer">Read</a></div> : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{color:'var(--muted)'}}>No news available.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="player-overview">
        <h4>Athlete overview</h4>
        {overview ? (
          <div className="overview-grid">
            <div className="overview-left">
              {overview.birthDate && <div><strong>Born:</strong> {overview.birthDate}</div>}
              {overview.birthPlace && <div><strong>Birthplace:</strong> {overview.birthPlace}</div>}
              {overview.college && <div><strong>College:</strong> {overview.college}</div>}
              {overview.school && <div><strong>School:</strong> {overview.school}</div>}
              {overview.draft && (
                <div style={{marginTop:8}}>
                  <strong>Draft</strong>
                  <div>Year: {overview.draft?.year ?? overview.draft?.season}</div>
                  <div>Round: {overview.draft?.round ?? overview.draft?.roundNumber}</div>
                  <div>Pick: {overview.draft?.pick ?? overview.draft?.overall}</div>
                  <div>Team: {overview.draft?.team ?? overview.draft?.teamName}</div>
                </div>
              )}
              {overview.status && <div style={{marginTop:8}}><strong>Status:</strong> {overview.status}</div>}
            </div>
            <div className="overview-right">
              {overview.position && <div><strong>Position:</strong> {overview.position}</div>}
              {overview.height && <div><strong>Height:</strong> {overview.height}</div>}
              {overview.weight && <div><strong>Weight:</strong> {overview.weight}</div>}
              {overview.headshot && <div style={{marginTop:8}}><img src={overview.headshot} alt="headshot" className="player-headshot small"/></div>}
            </div>
          </div>
        ) : (
          <div style={{color:'var(--muted)'}}>No athlete overview data available.</div>
        )}

        {overview && overview.contracts && overview.contracts.length > 0 && (
          <div className="overview-section">
            <strong>Contracts</strong>
            <div className="contracts-list">
              {overview.contracts.map((c, i) => (
                <div key={i} className="contract-row"><div>{c.team || c.teamName || ''}</div><div>{c.amount || c.totalValue || c.value || ''}</div><div>{c.start && c.end ? `${c.start} → ${c.end}` : ''}</div></div>
              ))}
            </div>
          </div>
        )}

        {overview && overview.transactions && overview.transactions.length > 0 && (
          <div className="overview-section">
            <strong>Transactions</strong>
            <ul>
              {overview.transactions.map((t,i) => <li key={i}>{t.date ? `${t.date} — ` : ''}{t.description || t.event || JSON.stringify(t)}</li>)}
            </ul>
          </div>
        )}

        {overview && overview.injuries && overview.injuries.length > 0 && (
          <div className="overview-section">
            <strong>Injuries</strong>
            <ul>
              {overview.injuries.map((inj,i) => <li key={i}>{inj.status || inj.description || JSON.stringify(inj)}</li>)}
            </ul>
          </div>
        )}

        {overview && overview.seasons && overview.seasons.length > 0 && (
          <div className="overview-section">
            <strong>Seasons</strong>
            <div className="seasons-list">
              {overview.seasons.map((s, idx) => (
                <div key={idx} className="season-item">
                  <div className="season-title">{s.season || s.seasonYear || s.displayName || `Season ${idx+1}`}</div>
                  {renderSeasonTable(s)}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="overview-section">
          <button className="toggle-raw" onClick={() => setShowRawOverview(!showRawOverview)}>{showRawOverview ? 'Hide' : 'Show'} raw overview JSON</button>
          {showRawOverview && <pre className="raw-json">{JSON.stringify(overview || player || {}, null, 2)}</pre>}
        </div>
      </div>

      <div className="player-bio">
        <strong>About</strong>
        <div style={{marginTop:8}}>{player?.bio || player?.shortBio || player?.headline || 'No biography available.'}</div>

        {((player && player._overviewStories && player._overviewStories.length) || (player && player._news && player._news.length)) && (
          <div style={{marginTop:12}} className="overview-section">
            <strong>Stories & News</strong>
            <div style={{marginTop:8}}>
              {player._overviewStories && player._overviewStories.map((s, i) => (
                <div key={`ov-${i}`} style={{marginBottom:8}}>
                  {s.title ? <div style={{fontWeight:600}}>{s.title}</div> : null}
                  {s.summary ? <div style={{color:'var(--muted)'}}>{s.summary}</div> : null}
                  {s.url ? <div><a href={s.url} target="_blank" rel="noreferrer">Read</a></div> : null}
                </div>
              ))}
              {player._news && player._news.map((a, i) => (
                <div key={`news-${i}`} style={{marginBottom:8}}>
                  {a.title ? <div style={{fontWeight:600}}><a href={a.url} target="_blank" rel="noreferrer">{a.title}</a></div> : null}
                  {a.summary ? <div style={{color:'var(--muted)'}}>{a.summary}</div> : null}
                  {a.published ? <div style={{fontSize:12, color:'var(--muted)'}}>{a.published}</div> : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {(height || weight || position) && (
          <div style={{marginTop:8, color:'var(--muted)'}}>
            <strong>Physicals</strong>
            <div style={{marginTop:6}}>{position ? <><strong>Position:</strong> {position}</> : null}{(position && (height || weight)) ? ' • ' : ''}{height ? `${height}` : ''}{(height && weight) ? ` • ${weight}` : (weight ? `${weight}` : '')}</div>
          </div>
        )}

        <div style={{marginTop:12}}>
          <strong>Season stats{statsSeasonLabel ? ` — ${statsSeasonLabel}` : ''}</strong>
          {currentStats ? (
            <div className="player-stats" style={{marginTop:8}}>
              {/* NFL-specific rendering */}
              { (playerLeague === 'nfl') ? (
                <>
                  {/* Passing */}
                  {(currentStats?.passYds || currentStats?.passingYards || currentStats?.cmp || currentStats?.completions) && (
                    <div>
                      <div className="stats-group-title">Passing</div>
                      <div className="stats-row"><div>Comp</div><div>{currentStats?.cmp ?? currentStats?.completions ?? currentStats?.passComp ?? ''}</div></div>
                      <div className="stats-row"><div>Att</div><div>{currentStats?.passAtt ?? currentStats?.passAttempts ?? ''}</div></div>
                      <div className="stats-row"><div>YDS</div><div>{currentStats?.passYds ?? currentStats?.passingYards ?? currentStats?.yds ?? ''}</div></div>
                      <div className="stats-row"><div>TD</div><div>{currentStats?.passTds ?? currentStats?.passTd ?? currentStats?.tds ?? ''}</div></div>
                      <div className="stats-row"><div>INT</div><div>{currentStats?.ints ?? currentStats?.int ?? ''}</div></div>
                      { (currentStats?.rating || currentStats?.passerRating) && <div className="stats-row"><div>RTG</div><div>{currentStats?.rating ?? currentStats?.passerRating}</div></div> }
                    </div>
                  )}
                  {/* Rushing */}
                  {(currentStats?.rushYds || currentStats?.rushingYards || currentStats?.rushAtt) && (
                    <div>
                      <div className="stats-group-title">Rushing</div>
                      <div className="stats-row"><div>Att</div><div>{currentStats?.rushAtt ?? currentStats?.rushAttempts ?? ''}</div></div>
                      <div className="stats-row"><div>YDS</div><div>{currentStats?.rushYds ?? currentStats?.rushingYards ?? ''}</div></div>
                      <div className="stats-row"><div>TD</div><div>{currentStats?.rushTds ?? currentStats?.rushTd ?? ''}</div></div>
                    </div>
                  )}
                  {/* Receiving */}
                  {(currentStats?.rec || currentStats?.receptions || currentStats?.recYds) && (
                    <div>
                      <div className="stats-group-title">Receiving</div>
                      <div className="stats-row"><div>REC</div><div>{currentStats?.rec ?? currentStats?.receptions ?? ''}</div></div>
                      <div className="stats-row"><div>YDS</div><div>{currentStats?.recYds ?? currentStats?.receivingYards ?? ''}</div></div>
                      <div className="stats-row"><div>TD</div><div>{currentStats?.recTds ?? ''}</div></div>
                      { currentStats?.targets && <div className="stats-row"><div>TGT</div><div>{currentStats?.targets}</div></div> }
                    </div>
                  )}
                  {/* Defensive / other */}
                  {(currentStats?.tackles || currentStats?.sacks || currentStats?.fumbles || currentStats?.ints || currentStats?.interceptions) && (
                    <div>
                      <div className="stats-group-title">Other</div>
                      { currentStats?.tackles && <div className="stats-row"><div>TKL</div><div>{currentStats?.tackles}</div></div> }
                      { (currentStats?.ints || currentStats?.interceptions) && <div className="stats-row"><div>INT</div><div>{currentStats?.ints ?? currentStats?.interceptions}</div></div> }
                      { currentStats?.sacks && <div className="stats-row"><div>SCK</div><div>{currentStats?.sacks}</div></div> }
                      { currentStats?.fumbles && <div className="stats-row"><div>FUM</div><div>{currentStats?.fumbles}</div></div> }
                    </div>
                  )}
                  {/* Fallback: show a few generic numeric fields if none of the above matched */}
                  {(!(currentStats?.passYds||currentStats?.rushYds||currentStats?.rec)&& Object.keys(currentStats||{}).some(k => typeof currentStats[k] === 'number' || (!isNaN(parseFloat(currentStats[k]))))) && (
                    <div>
                      {(() => {
                        const humanLabel = (k) => {
                          if (!k) return k;
                          const s = String(k).toLowerCase();
                          const map = {
                            tot: 'Total Tackles',
                            tackles: 'Total Tackles',
                            tkl: 'Total Tackles',
                            yds: 'YDS',
                            passyds: 'Pass YDS',
                            rushyds: 'Rush YDS',
                            recyds: 'Rec YDS',
                            td: 'TD',
                            tds: 'TD',
                            rec: 'REC',
                            cmp: 'CMP',
                            att: 'ATT',
                            passatt: 'ATT',
                            passerRating: 'RTG',
                            rating: 'RTG',
                            sacks: 'SACKS',
                            fumbles: 'FUM',
                            targets: 'TGT'
                          };
                          if (map[s]) return map[s];
                          return String(k).replace(/_/g,' ').replace(/\b(yds|yards)\b/i,'YDS').replace(/\b(td|tds)\b/i,'TD').replace(/\b(att|attempts)\b/i,'ATT').toUpperCase();
                        };
                        return Object.entries(currentStats).slice(0,6).map(([k,v]) => (
                          <div key={k} className="stats-row"><div>{humanLabel(k)}</div><div>{v}</div></div>
                        ));
                      })()}
                    </div>
                  )}
                </>
              ) : (
                // Default/NBA rendering (existing)
                <>
                  <div className="stats-row"><div>PTS</div><div>{currentStats?.pts ?? currentStats?.points ?? currentStats?.p ?? currentStats?.ppg ?? ''}</div></div>
                  <div className="stats-row"><div>REB</div><div>{currentStats?.reb ?? currentStats?.rebounds ?? currentStats?.r ?? currentStats?.rpg ?? ''}</div></div>
                  <div className="stats-row"><div>AST</div><div>{currentStats?.ast ?? currentStats?.assists ?? currentStats?.a ?? currentStats?.apg ?? ''}</div></div>
                  <div className="stats-row"><div>MPG</div><div>{currentStats?.mpg ?? currentStats?.minutesPerGame ?? currentStats?.m ?? ''}</div></div>
                  { (currentStats?.fgPct || currentStats?.fg_pct) && <div className="stats-row"><div>FG%</div><div>{currentStats?.fgPct ?? currentStats?.fg_pct}</div></div> }
                  { (currentStats?.threePtPct || currentStats?.fg3Pct) && <div className="stats-row"><div>3P%</div><div>{currentStats?.threePtPct ?? currentStats?.fg3Pct ?? currentStats?.fg3_pct}</div></div> }
                  { (currentStats?.turnovers || currentStats?.to) && <div className="stats-row"><div>TO</div><div>{currentStats?.turnovers ?? currentStats?.to}</div></div> }
                </>
              )}
            </div>
          ) : (
            <div style={{marginTop:8, color:'var(--muted)'}}>No season stats available.</div>
          )}
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
