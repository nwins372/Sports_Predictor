import React, { useEffect, useState } from 'react';
import espnApi from '../utils/espnApi';
import { supabase } from '../supabaseClient';
import './Following.css';
import { TranslatedText } from '../components/TranslatedText';

export default function Following() {
  const [followedTeams, setFollowedTeams] = useState([]);
  const [followedPlayers, setFollowedPlayers] = useState([]);
  const [teamDetails, setTeamDetails] = useState({});
  const [playerDetails, setPlayerDetails] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // read followed lists from several possible storage shapes
        const parseFollowed = (raw) => {
          if (!raw) return [];
          try {
            const parsed = JSON.parse(raw);
            // if it's an object like {teams:[], players:[]}
            if (parsed && typeof parsed === 'object') {
              if (Array.isArray(parsed)) return parsed;
              if (Array.isArray(parsed.teams) || Array.isArray(parsed.players)) {
                const teams = Array.isArray(parsed.teams) ? parsed.teams : [];
                const players = Array.isArray(parsed.players) ? parsed.players : [];
                // store teams and players in combined arrays as strings
                return { teams, players };
              }
              // if parsed is an object with keys of followed slugs
              if (Object.keys(parsed).every(k => typeof parsed[k] === 'boolean')) return Object.keys(parsed);
            }
            return Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            return [];
          }
        };

        let ftRaw = window.localStorage.getItem('followedTeams');
        let fpRaw = window.localStorage.getItem('followedPlayers');
        let ftParsed = parseFollowed(ftRaw);
        let fpParsed = parseFollowed(fpRaw);

        // If storage contained combined object, extract appropriately
        let ft = [];
        let fp = [];
        if (ftParsed && Array.isArray(ftParsed)) ft = ftParsed;
        else if (ftParsed && typeof ftParsed === 'object' && Array.isArray(ftParsed.teams)) ft = ftParsed.teams;
        if (fpParsed && Array.isArray(fpParsed)) fp = fpParsed;
        else if (fpParsed && typeof fpParsed === 'object' && Array.isArray(fpParsed.players)) fp = fpParsed.players;

        // If neither found, try to check a combined storage key 'following' or Supabase user metadata
        if ((!ft || ft.length === 0) && (!fp || fp.length === 0)) {
          try {
            const combinedRaw = window.localStorage.getItem('following') || window.localStorage.getItem('follow');
            if (combinedRaw) {
              const comb = JSON.parse(combinedRaw);
              if (comb) {
                if (Array.isArray(comb.teams)) ft = comb.teams;
                if (Array.isArray(comb.players)) fp = comb.players;
                if (Array.isArray(comb)) { ft = comb.filter(x => String(x).toLowerCase().includes(':') || String(x).length < 6); }
              }
            }
          } catch (e) {}
        }

        // Supabase fallback: check user metadata for followed lists
        if ((!ft || ft.length === 0) && (!fp || fp.length === 0)) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            const meta = user?.user_metadata || user?.app_metadata || null;
            if (meta) {
              if (Array.isArray(meta.followedTeams)) ft = meta.followedTeams;
              if (Array.isArray(meta.followedPlayers)) fp = meta.followedPlayers;
            }
          } catch (e) {}
        }

        if (!mounted) return;
        setFollowedTeams(ft || []);
        setFollowedPlayers(fp || []);

        const td = {};
        for (const t of (ft || [])) {
          try {
            // allow storing with optional league prefix like "nfl:patriots" or just slug
            const parts = String(t).split(':');
            const league = parts.length === 2 ? parts[0] : 'nfl';
            const slug = parts.length === 2 ? parts[1] : parts[0];
            const team = await espnApi.getTeam(league, slug);
            const nextGame = await espnApi.getTeamNextGame(league, slug);
            td[t] = { team, nextGame, league, slug };
          } catch (e) { td[t] = { team: null, nextGame: null }; }
        }
        const pd = {};
        for (const p of (fp || [])) {
          try {
            // player stored as either numeric id or 'league:id'
            const parts = String(p).split(':');
            const league = parts.length === 2 ? parts[0] : null;
            const pid = parts.length === 2 ? parts[1] : parts[0];
            const pl = await espnApi.getPlayer(league || 'nfl', pid);
            pd[p] = pl;
          } catch (e) { pd[p] = null; }
        }
        if (!mounted) return;
        setTeamDetails(td);
        setPlayerDetails(pd);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const unfollowTeam = (t) => {
    const next = (followedTeams || []).filter(x => x !== t);
    setFollowedTeams(next);
    try { window.localStorage.setItem('followedTeams', JSON.stringify(next)); } catch (e) {}
  };
  const unfollowPlayer = (p) => {
    const next = (followedPlayers || []).filter(x => x !== p);
    setFollowedPlayers(next);
    try { window.localStorage.setItem('followedPlayers', JSON.stringify(next)); } catch (e) {}
  };

  return (
    <div className="following-page">
      <h2><TranslatedText>Following</TranslatedText></h2>
      {loading ? <div className="muted"><TranslatedText>Loading followed teams & players…</TranslatedText></div> : (
        <div className="following-grid">
          <div className="follow-col">
            <h3><TranslatedText>Teams</TranslatedText></h3>
            {(!followedTeams || followedTeams.length === 0) ? <div className="muted"><TranslatedText>You are not following any teams.</TranslatedText></div> : (
              <div className="team-list">
                {followedTeams.map((t, i) => {
                  const info = teamDetails[t] || {};
                  const team = info.team;
                  const next = info.nextGame;
                  return (
                    <div key={`ft-${i}`} className="team-card">
                      <div className="team-card-left">
                        {team && (team.logos && team.logos[0] && team.logos[0].href) ? <img src={team.logos[0].href} alt={team.displayName || team.name} className="team-logo" /> : <div className="team-logo placeholder" />}
                      </div>
                      <div className="team-card-body">
                        <div className="team-name">{team ? (team.displayName || team.name) : t}</div>
                        <div className="team-meta">League: {info.league || 'nfl'}</div>
                        <div className="team-nextgame muted">{next ? `Next: ${new Date(next.start).toLocaleString()} vs ${next.opponent || ''}` : 'Next game: N/A'}</div>
                      </div>
                      <div className="team-card-actions">
                        <button className="unfollow" onClick={() => unfollowTeam(t)}><TranslatedText>Unfollow</TranslatedText></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="follow-col">
            <h3><TranslatedText>Players</TranslatedText></h3>
            {(!followedPlayers || followedPlayers.length === 0) ? <div className="muted"><TranslatedText>You are not following any players.</TranslatedText></div> : (
              <div className="player-list">
                {followedPlayers.map((p, i) => {
                  const pl = playerDetails[p] || null;
                  return (
                    <div key={`fp-${i}`} className="player-card">
                      <div className="player-left">
                        {pl && pl.headshot ? <img src={pl.headshot} alt={pl.name || p} className="player-headshot" /> : <div className="player-headshot placeholder" />}
                      </div>
                      <div className="player-body">
                        <div className="player-name">{pl ? (pl.name || pl.displayName) : p}</div>
                        <div className="player-meta muted">{pl ? `${pl.position || ''} ${pl.team ? `• ${pl.team.displayName || pl.team.name}` : ''}` : ''}</div>
                      </div>
                      <div className="player-actions">
                        <button className="unfollow" onClick={() => unfollowPlayer(p)}><TranslatedText>Unfollow</TranslatedText></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
