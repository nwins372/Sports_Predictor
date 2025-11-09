import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import espnApi from '../utils/espnApi';
import './Transactions.css';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [injuries, setInjuries] = useState({});
  const [loading, setLoading] = useState(true);
  const [league, setLeague] = useState('nfl');
  const [followedTeams, setFollowedTeams] = useState([]);
  const [filterTeamsOnly, setFilterTeamsOnly] = useState(true);

  useEffect(() => {
    // try to read followed teams from localStorage or from supabase user metadata
    try {
      const local = window.localStorage.getItem('followedTeams');
      if (local) setFollowedTeams(JSON.parse(local));
    } catch (e) {}
    // quick load
    (async () => {
      setLoading(true);
      try {
        const tx = await espnApi.getTransactions(league, null, 300);
        setTransactions(tx || []);
        // preload injuries for followed teams if any
        if (Array.isArray(followedTeams) && followedTeams.length) {
          const injMap = {};
          for (const t of followedTeams) {
            try {
              const inj = await espnApi.getTeamInjuries(league, t);
              injMap[t] = inj || [];
            } catch (e) { injMap[t] = []; }
          }
          setInjuries(injMap);
        }
      } catch (e) {
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [league, followedTeams]);

  const toggleFollowTeam = (slug) => {
    const next = Array.isArray(followedTeams) ? [...followedTeams] : [];
    const idx = next.indexOf(slug);
    if (idx === -1) next.push(slug); else next.splice(idx,1);
    setFollowedTeams(next);
    try { window.localStorage.setItem('followedTeams', JSON.stringify(next)); } catch (e) {}
  };

  const filtered = transactions.filter(t => {
    if (!filterTeamsOnly || !followedTeams || followedTeams.length === 0) return true;
    // show if any involved team slug matches followedTeams or any player.team matches
    try {
      if ((t.teams || []).some(team => team && followedTeams.includes(team.slug || String(team.name || '').toLowerCase()))) return true;
      if ((t.players || []).some(p => p && followedTeams.includes(String(p.team || '').toLowerCase()))) return true;
    } catch (e) {}
    return false;
  });

  return (
    <div className="transactions-page">
      <h2>Transactions & Injury Reports</h2>
      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}>
        <label>League: </label>
        <select value={league} onChange={(e) => setLeague(e.target.value)}>
          <option value="nfl">NFL</option>
          <option value="nba">NBA</option>
        </select>
        <label style={{marginLeft:12}}><input type="checkbox" checked={filterTeamsOnly} onChange={(e) => setFilterTeamsOnly(e.target.checked)} /> Show only followed teams</label>
        <div style={{marginLeft:'auto'}}>
          <strong>Followed teams:</strong> {followedTeams && followedTeams.length ? followedTeams.join(', ') : 'None'}
        </div>
      </div>

      {loading ? <div>Loading transactions…</div> : (
        <div className="transactions-list">
          {filtered.length === 0 ? <div style={{color:'#666'}}>No transactions found.</div> : filtered.map((t, idx) => (
            <TransactionRow key={idx} tx={t} onToggleFollow={toggleFollowTeam} followedTeams={followedTeams} />
          ))}
        </div>
      )}

      <div style={{marginTop:20}}>
        <h3>Injury reports (followed teams)</h3>
        {(!followedTeams || followedTeams.length === 0) ? <div style={{color:'#666'}}>No followed teams — injuries for followed teams will appear here.</div> : (
          Object.keys(injuries).map(k => (
            <div key={k} className="injury-card">
              <h4>{k}</h4>
              {(injuries[k] || []).length === 0 ? <div style={{color:'#666'}}>No injuries found.</div> : (
                <ul>
                  {(injuries[k] || []).map((i,ii) => <li key={ii}>{i.name || i.title || JSON.stringify(i)}</li>)}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TransactionRow({ tx, onToggleFollow, followedTeams }) {
  const date = tx.date ? (new Date(tx.date)).toLocaleString() : null;
  const action = tx.action || 'other';
  return (
    <div className="transaction-row">
      <div className="tx-left">
        <div className="tx-date">{date}</div>
        <div className="tx-action">{action.toUpperCase()}</div>
      </div>
      <div className="tx-body">
        {action === 'trade' ? (
          <div className="trade-box">
            {tx.teams && tx.teams.map((team, i) => (
              <div key={`team-${i}`} className="trade-team">
                {team.logo ? <img src={team.logo} alt={team.name} className="team-logo-small" /> : <div className="team-logo-small placeholder" />}
                <div className="team-name">{team.name}</div>
              </div>
            ))}
            <div className="trade-players">
              {tx.players && tx.players.map((p,i) => (
                <div key={`p-${i}`} className="trade-player">
                  {p.headshot ? <img src={p.headshot} alt={p.name} className="player-headshot-small" /> : <div className="player-headshot-small placeholder" />}
                  <div className="player-name">{p.name}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="simple-tx">
            {tx.players && tx.players.map((p,i) => (
              <div key={`s-${i}`} className="simple-player">
                <div style={{position:'relative'}}>
                  {p.headshot ? <img src={p.headshot} alt={p.name} className="player-headshot-small" /> : <div className="player-headshot-small placeholder" />}
                  <span className={`tx-badge ${action === 'add' ? 'add' : (action === 'cut' ? 'cut' : '')}`}>{action === 'add' ? '+' : (action === 'cut' ? '−' : '')}</span>
                </div>
                <div style={{marginLeft:8}}>
                  <div className="player-name">{p.name}</div>
                  <div className="player-team">{p.team}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="tx-right">
        {(tx.teams || []).map((t,i) => (
          <div key={`f-${i}`} style={{display:'flex',alignItems:'center',gap:6}}>
            <button onClick={() => onToggleFollow(t.slug || String(t.name || '').toLowerCase())} className="follow-btn">{followedTeams && followedTeams.includes(t.slug || String(t.name || '').toLowerCase()) ? 'Unfollow' : 'Follow'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
