import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import NavBar from '../components/NavBar';
import espnApi from '../utils/espnApi';
import './Player.css';

export default function Player() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // use unified getPlayer which tries local index, player endpoint, then search
        const p = await espnApi.getPlayer('nba', id);
        if (p && mounted) { setPlayer(p); return; }
        // last-resort: try searchSite
        const res = await espnApi.searchSite(id, 20);
        const found = (res?.results || []).find(r => String(r.id) === String(id) || String(r.object?.id) === String(id));
        if (found && mounted) setPlayer(found.object || found);
      } catch (e) { }
    })();
    return () => { mounted = false; };
  }, [id]);

  if (!player) return (
    <>
      <NavBar />
      <div className="player-page">Loading player {id}…</div>
    </>
  );
  const name = player?.name || player?.displayName || player?.fullName || player?.headline;
  const head = player?.head || player?.headshot?.href || player?.photo?.href || player?.images?.[0]?.url || null;
  const team = player?.team || (player?.team && player.team.displayName) || player?.teamName || null;
  const position = player?.position || player?.position?.abbreviation || player?.positionName || null;
  const height = player?.height || player?.bio?.height || null;
  const weight = player?.weight || player?.bio?.weight || null;

  return (
    <>
      <NavBar />
      <div className="player-page">
      <div className="player-hero">
        {head ? <img src={head} alt={name} className="player-headshot" /> : <div className="player-headshot placeholder" />}
        <div>
          <div className="player-name">{name}</div>
          <div className="player-meta">{team || ''} {position ? `• ${position}` : ''} • Player ID: {player?.id || id}</div>
        </div>
      </div>

      <div className="player-bio">
        <strong>About</strong>
        <div style={{marginTop:8}}>{player?.bio || player?.shortBio || player?.headline || 'No biography available.'}</div>
        {(height || weight) && <div style={{marginTop:8, color:'var(--muted)'}}>Physical: {height ? height + (weight ? ` • ${weight}` : '') : weight}</div>}
      </div>
      </div>
    </>
  );
}
