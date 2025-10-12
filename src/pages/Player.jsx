import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import NavBar from '../components/NavBar';
import espnApi from '../utils/espnApi';
import './Player.css';
import FollowButton from '../components/FollowButton';

export default function Player() {
  const params = useParams();
  // support /player/:league/:id and /player/:id
  const id = params.id || Object.values(params).slice(-1)[0];
  const leagueParam = params.league || null;
  const [player, setPlayer] = useState(null);
  const location = useLocation();
  const loadingName = location?.state?.name || null;
  const loadingShortId = location?.state?.shortId || null;

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
      <div className="player-page">Loading {loadingName ? (`${loadingName}`) : (`player ${id}`)}…</div>
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
      // prefer an explicit isCurrent flag
      const current = seasons.find(s => s.isCurrent || String(s.season).toLowerCase() === 'current');
      if (current && (current.stats || Object.keys(current).length)) return { stats: current.stats || current, seasonLabel: current.season || (current.raw && (current.raw.season || current.raw.seasonYear)) || 'current' };
      // else pick the season with the highest numeric year (parse values like '2024-25' or '2024')
      try {
        const parseYear = (val) => {
          if (!val && val !== 0) return 0;
          const s = String(val);
          const m = s.match(/(\d{4})/); // grab first 4-digit year
          if (m) return parseInt(m[1], 10);
          const n = parseInt(s, 10);
          return isNaN(n) ? 0 : n;
        };
        const mapped = seasons.map(s => ({ s, year: parseYear(s.season || s.seasonYear || (s.raw && (s.raw.season || s.raw.seasonYear)) || 0) }));
        mapped.sort((a,b) => b.year - a.year);
        const top = mapped[0];
        if (top) return { stats: top.s.stats || top.s, seasonLabel: top.s.season || top.s.seasonYear || String(top.year) };
      } catch (e) { /* fallthrough */ }
      // last resort: first season entry
      const first = seasons[0];
      return { stats: first.stats || first, seasonLabel: first.season || first.seasonYear || 'last' };
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
          {/* Follow button placed next to player meta */}
          <div style={{marginTop:8}}>
            <FollowButton entityType="player" entityId={player?.id || id} />
          </div>
        </div>
      </div>

      <div className="player-bio">
        <strong>About</strong>
        <div style={{marginTop:8}}>{player?.bio || player?.shortBio || player?.headline || 'No biography available.'}</div>

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
    </>
  );
}
