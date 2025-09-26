import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import NavBar from '../components/NavBar';
import espnApi from '../utils/espnApi';
import './Player.css';

export default function Player() {
  const params = useParams();
  // support /player/:league/:id and /player/:id
  const id = params.id || Object.values(params).slice(-1)[0];
  const leagueParam = params.league || null;
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // use unified getPlayer which tries local index, player endpoint, then remote search
        const league = leagueParam || 'nba';
        const p = await espnApi.getPlayer(league, id);
        if (p && mounted) {
          // ensure player has league metadata
          if (!p._league) p._league = league;
          let enriched = p;
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
              const remote = await espnApi.getPlayer(p._league || league, id);
              if (remote) {
                // merge remote into enriched
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
              }
            } catch (e) {
              // try the alternate league when league not specified
              if (!leagueParam) {
                const alt = (p._league || league) === 'nba' ? 'nfl' : 'nba';
                try {
                  const remoteAlt = await espnApi.getPlayer(alt, id);
                  if (remoteAlt) enriched = Object.assign({}, enriched, { seasons: remoteAlt.seasons || enriched.seasons, currentSeasonStats: remoteAlt.currentSeasonStats || enriched.currentSeasonStats, team: enriched.team || remoteAlt.team });
                } catch (e2) {}
              }
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
                }
              } catch (e) {}
            }
          }

          if (mounted) { setPlayer(enriched); return; }
        }

        // If not found, try the local indexes across both leagues (id might live in the other league)
        try {
          const localFromSame = await espnApi.getPlayerLocalById(id, league);
          if (localFromSame && mounted) {
            // enrich compact record: resolve team if teamSlug present
            if (localFromSame.teamSlug && !localFromSame.team) {
              try { const t = await espnApi.getTeam(localFromSame._league || league, localFromSame.teamSlug); if (t) localFromSame.team = t; } catch (e) {}
            }
            setPlayer(localFromSame); return;
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
              setPlayer(localAlt); return;
            }
          }
        } catch (e) {}

        // Last resort: run the remote search API and pick the first matching player
        try {
          const res = await espnApi.searchPlayers(id, 20);
          const found = (res?.results || []).find(r => String(r.id) === String(id) || String(r.object?.id) === String(id) || String(r.object?.id) === String(id));
          if (found && mounted) { setPlayer(found.object || found); return; }
          // If nothing matched by id, use the first player-like result if present
          const first = (res?.results || []).find(r => (r.object && (r.object.player || r.object.athlete || r.object.id)));
          if (first && mounted) { setPlayer(first.object || first); return; }
        } catch (e) {}
      } catch (e) { /* swallow, show loading/no-data UI below */ }
    })();
    return () => { mounted = false; };
  }, [id, leagueParam]);

  if (!player) return (
    <>
      <NavBar />
      <div className="player-page">Loading player {id}…</div>
    </>
  );
  const name = player?.name || player?.displayName || player?.fullName || player?.headline;
  const head = player?.head || player?.headshot?.href || player?.photo?.href || player?.images?.[0]?.url || null;
  const teamObj = player?.team || (player?.team && player.team.team) || null;
  const team = teamObj?.displayName || teamObj?.name || player?.teamName || null;
  // derive player's league: prefer explicit metadata, then route param, otherwise null
  const playerLeague = player?._league || leagueParam || null;
  // derive a team logo url from common locations; do NOT fallback to the app icon (avoid showing React logo)
  const teamLogo = teamObj?.logos?.[0]?.href || teamObj?.logo || teamObj?.image?.url || teamObj?.logoURL || null;
  const position = player?.position || player?.position?.abbreviation || player?.positionName || player?.bio?.position || null;
  // physicals: try normalized props then fallbacks
  const _rawHeight = player?.height || player?.bio?.height || (player?.seasons && player.seasons[0] && player.seasons[0].height) || null;
  const _rawWeight = player?.weight || player?.bio?.weight || (player?.seasons && player.seasons[0] && player.seasons[0].weight) || null;
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
  // prefer currentSeasonStats; otherwise select the most recent season (highest season year) as offseason fallback
  const currentStats = player?.currentSeasonStats || (player?.seasons && player.seasons.length > 0 ? (() => {
    try {
      const numericSeasons = player.seasons.map(s => ({ s, year: parseInt(s.season || s.seasonYear || (s.raw && s.raw.season) || 0, 10) || 0 }));
      numericSeasons.sort((a,b) => b.year - a.year);
      return numericSeasons[0]?.s?.stats || numericSeasons[0]?.s || null;
    } catch (e) { return player.seasons[0].stats || player.seasons[0]; }
  })() : null);

  return (
    <>
      <NavBar />
      <div className="player-page">
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
        </div>
      </div>

      <div className="player-bio">
        <strong>About</strong>
        <div style={{marginTop:8}}>{player?.bio || player?.shortBio || player?.headline || 'No biography available.'}</div>
  {(height || weight) && <div style={{marginTop:8, color:'var(--muted)'}}>Physical: {height ? height + (weight ? ` • ${weight}` : '') : weight}</div>}

        <div style={{marginTop:12}}>
          <strong>Season stats</strong>
          {currentStats ? (
            <div className="player-stats" style={{marginTop:8}}>
              {/* Render common stat fields when present */}
              <div className="stats-row">
                <div>PTS</div><div>{currentStats.pts ?? currentStats.points ?? currentStats.p ?? ''}</div>
              </div>
              <div className="stats-row">
                <div>REB</div><div>{currentStats.reb ?? currentStats.rebounds ?? currentStats.r ?? ''}</div>
              </div>
              <div className="stats-row">
                <div>AST</div><div>{currentStats.ast ?? currentStats.assists ?? currentStats.a ?? ''}</div>
              </div>
              <div className="stats-row">
                <div>MPG</div><div>{currentStats.mpg ?? currentStats.minutesPerGame ?? currentStats.m ?? ''}</div>
              </div>
            </div>
          ) : (
            <div style={{marginTop:8, color:'var(--muted)'}}>No season stats available.</div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
