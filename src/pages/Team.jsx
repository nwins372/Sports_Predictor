import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import NavBar from '../components/NavBar';
import espnApi from '../utils/espnApi';
import './Team.css';

export default function Team() {
  const { abbr } = useParams();
  const [team, setTeam] = useState(null);
  const [logoError, setLogoError] = useState(false);
  const [remoteRoster, setRemoteRoster] = useState(null);

  // build roster - support many shapes (memoized)
  const rosterEntries = useMemo(() => {
    const det = team?.detail || team || {};
    return det?.roster?.athletes || det?.roster?.entries || team?.roster || det?.athletes || det?.team?.roster || [];
  }, [team]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const t = await espnApi.getTeam('nba', abbr);
        if (mounted) setTeam(t);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [abbr]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if ((!rosterEntries || rosterEntries.length === 0) && team) {
          // try fetch from live API using id or slug
          const tid = team?.detail?.team?.id || team?.id || team?.detail?.team?.slug || team?.slug || abbr;
          const rr = await espnApi.getTeamRoster('nba', tid);
          if (mounted && rr && rr.length > 0) setRemoteRoster(rr);
        }
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, [team, rosterEntries, abbr]);

  if (!team) return (
    <>
      <NavBar />
      <div className="team-page">Loading team {abbr}…</div>
    </>
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
    const pname = athlete?.displayName || athlete?.fullName || athlete?.name || athlete?.shortName || `Player ${idx + 1}`;
    const pimg = athlete?.headshot?.href || athlete?.photo?.href || athlete?.images?.[0]?.url || athlete?.image?.url || null;
    return (
      <li key={pid || idx} className="roster-item">
        {pimg ? (
          <img src={pimg} alt={pname} className="player-thumb" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div className="player-thumb placeholder" />
        )}
        <div className="player-name">
          {pid ? <Link to={`/player/${encodeURIComponent(pid)}`}>{pname}</Link> : <span>{pname}</span>}
        </div>
      </li>
    );
  };

  return (
    <>
      <NavBar />
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
        </div>
      </div>

      <div className="roster">
        <h3>Roster</h3>
        {((rosterEntries && rosterEntries.length > 0) || (remoteRoster && remoteRoster.length > 0)) ? (
          <ul className="roster-list">
            {(rosterEntries && rosterEntries.length > 0 ? rosterEntries : remoteRoster).map((r, i) => renderPlayer(r, i))}
          </ul>
        ) : (
          <div className="sb-state">Roster not available.</div>
        )}
      </div>

        <div className="team-debug">Loaded from checked-in JSON (debug output hidden in production)</div>
      </div>
    </>
  );
}
