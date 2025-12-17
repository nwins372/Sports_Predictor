import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import espnApi from '../utils/espnApi';
import { supabase } from '../supabaseClient';
import './Following.css';
import { TranslatedText } from '../components/TranslatedText';

export default function Following() {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user || null;
        console.log('Following: user', user?.id);
        if (!user) {
          if (mounted) { setLoading(false); }
          return;
        }

        const { data: userRow, error: userError } = await supabase
          .from('users')
          .select('followed_players, followed_teams')
          .eq('id', user.id)
          .single();

        console.log('Following: userRow', userRow, 'error', userError);

        if (userError) {
          console.error('Following: Error fetching user data:', userError);
          if (mounted) setLoading(false);
          return;
        }

        const teamIds = userRow?.followed_teams || [];
        const playerIds = userRow?.followed_players || [];
        console.log('Following: RAW teamIds', JSON.stringify(teamIds));
        console.log('Following: RAW playerIds', JSON.stringify(playerIds));
        console.log('Following: teamIds type', typeof teamIds, Array.isArray(teamIds));
        console.log('Following: playerIds type', typeof playerIds, Array.isArray(playerIds));

        // Deduplicate IDs (in case there are duplicates in the database)
        const uniqueTeamIds = [...new Set(teamIds.map(t => String(t)))];
        const uniquePlayerIds = [...new Set(playerIds.map(p => String(p)))];
        console.log('Following: unique teamIds', uniqueTeamIds);
        console.log('Following: unique playerIds', uniquePlayerIds);

        // Fetch team details
        const teamData = [];
        for (const tid of uniqueTeamIds) {
          console.log('Following: fetching team', tid);
          try {
            const parts = String(tid).split(':');
            let league = parts.length === 2 ? parts[0] : null;
            const slug = parts.length === 2 ? parts[1] : parts[0];
            
            // If no league specified, try to detect from slug (NBA teams often have city names)
            if (!league) {
              // Try NBA first, then NFL
              league = 'nba';
            }
            
            let team = await espnApi.getTeam(league, slug);
            
            // If not found in first league, try the other
            if (!team && league === 'nba') {
              console.log('Following: team not found in NBA, trying NFL');
              league = 'nfl';
              team = await espnApi.getTeam(league, slug);
            } else if (!team && league === 'nfl') {
              console.log('Following: team not found in NFL, trying NBA');
              league = 'nba';
              team = await espnApi.getTeam(league, slug);
            }
            
            console.log('Following: fetched team', tid, 'result:', team);
            if (team) {
              const roster = await espnApi.getTeamRoster(league, slug);
              const record = team.detail?.team?.record?.items?.[0]?.summary || team.raw?.detail?.team?.record?.items?.[0]?.summary || null;
              teamData.push({ id: tid, league, slug, team, roster, record });
            }
          } catch (e) { console.warn('Following:team', tid, e); }
        }

        // Fetch player details
        const playerData = [];
        for (const pid of playerIds) {
          console.log('Following: fetching player', pid);
          try {
            const parts = String(pid).split(':');
            let league = parts.length === 2 ? parts[0] : 'nba';
            const id = parts.length === 2 ? parts[1] : parts[0];
            
            let player = await espnApi.getPlayer(league, id);
            
            // If not found in first league, try the other
            if (!player && league === 'nba') {
              console.log('Following: player not found in NBA, trying NFL');
              league = 'nfl';
              player = await espnApi.getPlayer(league, id);
            } else if (!player && league === 'nfl') {
              console.log('Following: player not found in NFL, trying NBA');
              league = 'nba';
              player = await espnApi.getPlayer(league, id);
            }
            
            console.log('Following: fetched player', pid, 'result:', player);
            if (player) {
              const stats = player.currentSeasonStats || (player.seasons && player.seasons[0] && player.seasons[0].stats) || null;
              // Store player data directly at top level, not nested
              playerData.push({ 
                id: pid, 
                league, 
                playerId: id, 
                ...player,  // spread player data to top level
                stats 
              });
            } else {
              // Add placeholder for failed player fetch
              console.warn('Following: player fetch returned null for', pid);
              playerData.push({
                id: pid,
                league,
                playerId: id,
                name: `Player ${id} (failed to load)`,
                displayName: `Player ${id}`,
                headshot: null,
                stats: null
              });
            }
          } catch (e) { console.warn('Following:player', e); }
        }

        if (mounted) {
          console.log('Following: setting state - teams:', teamData.length, 'players:', playerData.length);
          console.log('Following: teamData', teamData);
          console.log('Following: playerData', playerData);
          setTeams(teamData);
          setPlayers(playerData);
          setLoading(false);
        }
      } catch (e) {
        console.warn('Following:load', e);
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="following-page"><TranslatedText>Loading...</TranslatedText></div>;

  return (
    <div className="following-page">
      <h2><TranslatedText>Following</TranslatedText></h2>
      
      {teams.length > 0 && (
        <section className="following-section">
          <h3><TranslatedText>Teams</TranslatedText></h3>
          <div className="following-grid">
            {teams.map(t => (
              <Link key={t.id} to={`/team/${t.league}/${t.slug}`} className="following-card team-card">
                <div className="card-header">
                  {t.team?.logos?.[0]?.href && <img src={t.team.logos[0].href} alt="" className="entity-logo" />}
                  <div className="entity-name">{t.team?.displayName || t.team?.name || t.slug}</div>
                </div>
                <div className="card-stats-hover">
                  {t.record && <div className="stat-row"><span>Record:</span><span>{t.record}</span></div>}
                  {t.roster && <div className="stat-row"><span>Roster:</span><span>{t.roster.length} players</span></div>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {players.length > 0 && (
        <section className="following-section">
          <h3><TranslatedText>Players</TranslatedText></h3>
          <div className="following-grid">
            {players.map(p => {
              const stats = p.stats || {};
              const isNFL = p.league === 'nfl';
              return (
                <Link key={p.id} to={`/player/${p.league}/${p.playerId}`} className="following-card player-card">
                  <div className="card-header">
                    {(p.headshot || p.head) && <img src={p.headshot || p.head} alt="" className="entity-headshot" />}
                    <div className="entity-name">{p.name || p.displayName || p.playerId}</div>
                  </div>
                  <div className="card-stats-hover">
                    {p.position && <div className="stat-row"><span>Position:</span><span>{p.position}</span></div>}
                    {p.team?.displayName && <div className="stat-row"><span>Team:</span><span>{p.team.displayName}</span></div>}
                    {isNFL ? (
                      <>
                        {stats.passYds && <div className="stat-row"><span>Pass YDS:</span><span>{stats.passYds}</span></div>}
                        {stats.rushYds && <div className="stat-row"><span>Rush YDS:</span><span>{stats.rushYds}</span></div>}
                        {stats.rec && <div className="stat-row"><span>REC:</span><span>{stats.rec}</span></div>}
                      </>
                    ) : (
                      <>
                        {stats.pts && <div className="stat-row"><span>PTS:</span><span>{stats.pts}</span></div>}
                        {stats.reb && <div className="stat-row"><span>REB:</span><span>{stats.reb}</span></div>}
                        {stats.ast && <div className="stat-row"><span>AST:</span><span>{stats.ast}</span></div>}
                      </>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {teams.length === 0 && players.length === 0 && (
        <div className="empty-state">
          <TranslatedText>No followed players or teams yet. Visit player and team pages to follow them!</TranslatedText>
        </div>
      )}
    </div>
  );
}
