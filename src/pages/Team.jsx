import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import espnApi from '../utils/espnApi';
import './Team.css';
import FollowButton from '../components/FollowButton';
import { TranslatedText } from '../components/TranslatedText';

export default function Team() {
  const params = useParams();
  // support both /team/:abbr and /team/:league/:abbr
  const abbr = params.abbr || params.slug || params.team || Object.values(params).slice(-1)[0];
  const leagueParam = params.league || null;
  const [team, setTeam] = useState(null);
  const [teamLeague, setTeamLeague] = useState(null);
  const [logoError, setLogoError] = useState(false);
  const [remoteRoster, setRemoteRoster] = useState(null);

  // build roster - support many shapes (memoized)
  const rosterEntries = useMemo(() => {
    const det = team?.detail || team || {};
    return det?.roster?.athletes || det?.roster?.entries || team?.roster || det?.athletes || det?.team?.roster || [];
  }, [team]);

  // helper: categorize position into offense/defense/special
  const categorizePosition = (pos) => {
    if (!pos) return 'other';
    const p = String(pos).toLowerCase();
    const offense = ['qb','rb','fb','hb','wr','te','ol','lt','lg','c','rg','rt','fullback','halfback','running back','wide receiver','tight end'];
    const defense = ['cb','s','safety','lb','olb','ilb','mlb','dl','dt','de','defensive','cornerback','linebacker','safeties'];
    const special = ['k','p','ls','kp','kr','pr','long snapper','kicker','punter'];
    if (offense.some(x => p.includes(x))) return 'offense';
    if (defense.some(x => p.includes(x))) return 'defense';
    if (special.some(x => p.includes(x))) return 'special';
    return 'other';
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Resolve candidate teams for both leagues (favor local JSON results and exact slug/abbr matches)
        let t = null;
        if (leagueParam) {
          try { t = await espnApi.getTeam(leagueParam, abbr); } catch (e) { t = null; }
        } else {
          // Try both leagues and prefer a local JSON match or exact slug/abbreviation match
          const [nbaT, nflT] = await Promise.all([
            (async () => { try { return await espnApi.getTeam('nba', abbr); } catch (e) { return null; } })(),
            (async () => { try { return await espnApi.getTeam('nfl', abbr); } catch (e) { return null; } })()
          ]);
          // prefer local file matches
          if (nbaT && nbaT._fromLocal) t = nbaT;
          if (nflT && nflT._fromLocal) {
            // if both local, try exact slug match to decide
            if (!t) t = nflT; else {
              const q = String(abbr || '').toLowerCase();
              const nbaSlug = String(nbaT.slug || nbaT.displayName || '').toLowerCase();
              const nflSlug = String(nflT.slug || nflT.displayName || '').toLowerCase();
              if (nflSlug === q && nbaSlug !== q) t = nflT;
            }
          }
          // if none chosen yet, prefer exact slug/abbreviation match on the candidates
          if (!t) {
            const q = String(abbr || '').toLowerCase();
            if (nbaT && ((String(nbaT.slug || '').toLowerCase() === q) || (String(nbaT.abbreviation || '').toLowerCase() === q) || (String(nbaT.displayName || '').toLowerCase().includes(q)))) t = nbaT;
            if (nflT && ((String(nflT.slug || '').toLowerCase() === q) || (String(nflT.abbreviation || '').toLowerCase() === q) || (String(nflT.displayName || '').toLowerCase().includes(q)))) {
              // if already matched NBA but NFL is a clearer exact match, prefer NFL
              const nflExact = String(nflT.slug || '').toLowerCase() === q || String(nflT.abbreviation || '').toLowerCase() === q;
              const nbaExact = t && (String(t.slug || '').toLowerCase() === q || String(t.abbreviation || '').toLowerCase() === q);
              if (!t || (!nbaExact && nflExact)) t = nflT;
            }
          }
          // fallback: if only one exists, use it
          if (!t) t = nbaT || nflT || null;
        }
        if (mounted && t) { setTeam(t); if (t && t._league) setTeamLeague(t._league); }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [abbr, leagueParam]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // reset remoteRoster before attempting fetch to avoid showing stale data
        if (mounted) setRemoteRoster(null);
        if ((!rosterEntries || rosterEntries.length === 0) && team) {
          // try fetch from live API using resolved team's league and id/slug
          const tid = team?.detail?.team?.id || team?.id || team?.detail?.team?.slug || team?.slug || abbr;
          const leagueToUse = team._league || team._fromLocal && team._league ? team._league : null;
          let rr = [];
          if (leagueToUse) {
            rr = await espnApi.getTeamRoster(leagueToUse, tid);
          } else {
            // try the league that seems most likely based on team object
            try { rr = await espnApi.getTeamRoster(team._league || 'nba', tid); } catch (e) { rr = []; }
            if ((!rr || rr.length === 0)) {
              try { rr = await espnApi.getTeamRoster('nfl', tid); } catch (e) { rr = []; }
            }
          }
          if (mounted) {
            if (rr && rr.length > 0) setRemoteRoster(rr);
            else setRemoteRoster([]);
          }
        }
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, [team, rosterEntries, abbr]);

  if (!team) return (
    <div className="team-page">Loading team {abbr}…</div>
  );

  const detail = team?.detail || team;
  const teamObj = detail?.team || detail;
  const name = teamObj?.displayName || teamObj?.name || teamObj?.shortDisplayName || teamObj?.location || abbr;

  // prefer scoreboard or default logos when available
  const logos = teamObj?.logos || detail?.logos || teamObj?.raw?.logos || [];
  const pickLogo = () => {
    const l = logos.find(l => Array.isArray(l.rel) && l.rel.includes('scoreboard')) || logos.find(l => Array.isArray(l.rel) && l.rel.includes('default')) || logos[0];
    return l?.href || null;
  };
  const logo = !logoError ? pickLogo() : null;

  // record and venue
  const record = teamObj?.record || detail?.record || {};
  const venue = teamObj?.venue || teamObj?.franchise?.venue || detail?.venue || null;

  

  const renderPlayer = (entry, idx) => {
    const athlete = entry?.athlete || entry?.person || entry || {};
    const pid = athlete?.id || athlete?.personId || athlete?.uid || athlete?.athleteId || null;
    // try to extract short numeric id from headshot or links
    const extractNumeric = (s) => {
      if (!s) return null;
      const str = String(s);
      const m = str.match(/\/(?:id|_id)\/(\d+)/) || str.match(/\/(?:players|full)\/(?:full\/)?(\d+)\./) || str.match(/(\d{4,7})/);
      return m && m[1] ? m[1] : null;
    };
    const shortFromImg = extractNumeric(athlete?.headshot || athlete?.photo || athlete?.images?.[0]?.url || athlete?.image?.url);
    const shortFromHref = extractNumeric(athlete?.href || athlete?.link || athlete?.canonicalUrl || (athlete?.raw && (athlete.raw.canonicalUrl || (athlete.raw.links && athlete.raw.links.web && athlete.raw.links.web.href))));
    const shortPid = (String(pid).match(/^\d+$/) ? String(pid) : (shortFromImg || shortFromHref || null));
    const pname = athlete?.displayName || athlete?.fullName || athlete?.name || athlete?.shortName || `Player ${idx + 1}`;
    const pimg = athlete?.headshot?.href || athlete?.headshot || athlete?.photo?.href || athlete?.images?.[0]?.url || athlete?.image?.url || null;
    const position = athlete?.position || athlete?.positionName || athlete?.position?.abbreviation || (athlete?.raw && athlete.raw.position) || null;
    // height might be provided as a string like "6'7\"" or as inches number. Normalize to display string.
    const _rawHeight = athlete?.height || (athlete?.bio && athlete.bio.height) || (athlete?.raw && athlete.raw.height) || null;
    const _rawWeight = athlete?.weight || (athlete?.bio && athlete.bio.weight) || (athlete?.raw && athlete.raw.weight) || null;
    const formatHeight = (h) => {
      if (!h) return null;
      // if it's already a string containing feet/apostrophe or cm, return raw
      if (typeof h === 'string') {
        if (h.includes("'") || h.toLowerCase().includes('cm') || h.toLowerCase().includes('ft')) return h;
        // try parse numeric inches in string
        const num = parseInt(h.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num) && num > 50) {
          const ft = Math.floor(num / 12);
          const inch = num % 12;
          return `${ft}'${inch}"`;
        }
        return h;
      }
      if (typeof h === 'number') {
        const ft = Math.floor(h / 12);
        const inch = h % 12;
        return `${ft}'${inch}"`;
      }
      return null;
    };
    const formatWeight = (w) => {
      if (!w) return null;
      if (typeof w === 'string') {
        if (w.toLowerCase().includes('lb') || w.toLowerCase().includes('kg')) return w;
        const num = parseInt(w.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num)) return `${num} lbs`;
        return w;
      }
      if (typeof w === 'number') return `${w} lbs`;
      return null;
    };
    const height = formatHeight(_rawHeight);
    const weight = formatWeight(_rawWeight);

  return (
      <li key={pid || idx} className="roster-item">
        {pimg ? (
          <img src={pimg} alt={pname} className="player-thumb" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div className="player-thumb placeholder" />
        )}
        <div className="player-info">
          <div className="player-name">
            { (shortPid || pid) ? <Link to={teamLeague ? `/player/${encodeURIComponent(teamLeague)}/${encodeURIComponent(shortPid || pid)}` : `/player/${encodeURIComponent(shortPid || pid)}`} state={{ name: pname }}>{pname}</Link> : <span>{pname}</span>}
          </div>
          <div className="player-meta">
            {position && <span className="player-pos">{position}</span>}
            {(height || weight) && (
              <span className="player-phys">{height ? height : ''}{height && weight ? ' • ' : ''}{weight ? weight : ''}</span>
            )}
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="team-page">
      <div className="team-hero">
        {logo ? (
          <img src={logo} alt={`${name} logo`} className="team-logo" onError={() => setLogoError(true)} />
        ) : (
          <div className="team-logo placeholder" />
        )}
        <div className="team-hero-meta">
          <div className="team-title">{name}</div>
          <div className="team-meta">{teamObj?.location || ''} {teamObj?.nickname ? `• ${teamObj.nickname}` : ''}</div>
          {record && record.summary && <div className="team-record">{record.summary}</div>}
          {venue && venue.fullName && <div className="team-venue">Arena: {venue.fullName}</div>}
          {/* Follow team button: also updates favorite team preference via FollowButton */}
          <div style={{marginTop: '8px'}}>
            <FollowButton entityType="team" entityId={teamObj?.slug || teamObj?.id || name} label={`Follow ${teamObj?.shortDisplayName || name}`} entityMeta={{ name, slug: teamObj?.slug, id: teamObj?.id }} />
          </div>
        </div>
      </div>

      <div className="roster">
        <h3><TranslatedText>Roster</TranslatedText></h3>
        {((rosterEntries && rosterEntries.length > 0) || (remoteRoster && remoteRoster.length > 0)) ? (
          <ul className="roster-list">
            {(rosterEntries && rosterEntries.length > 0 ? rosterEntries : remoteRoster).map((r, i) => renderPlayer(r, i))}
          </ul>
        ) : (
          <div className="sb-state"><TranslatedText>Roster not available.</TranslatedText></div>
        )}
      </div>

        <div className="team-debug"><TranslatedText>Loaded from checked-in JSON (debug output hidden in production)</TranslatedText></div>
      </div>
    );
}
