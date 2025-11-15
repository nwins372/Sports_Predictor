import React, { useEffect, useState, useRef } from 'react';
import espnApi from '../utils/espnApi';
import './TradeMachine.css';

export default function TradeMachine() {
  const [teams, setTeams] = useState([]);
  const [leftTeam, setLeftTeam] = useState(null);
  const [rightTeam, setRightTeam] = useState(null);
  const [leftRoster, setLeftRoster] = useState([]);
  const [rightRoster, setRightRoster] = useState([]);
  const [leftSelected, setLeftSelected] = useState({});
  const [rightSelected, setRightSelected] = useState({});
  const [leftCash, setLeftCash] = useState(0);
  const [rightCash, setRightCash] = useState(0);
  const [errors, setErrors] = useState([]);
  const [teamPayrolls, setTeamPayrolls] = useState({});
  const [salariesIndex, setSalariesIndex] = useState(null);
  const salariesLoaded = useRef(false);
  const [capRules, setCapRules] = useState({ salaryCap: null, luxuryTax: null, taxApron: null });

  const normalizeName = (raw) => {
    if (!raw) return '';
    let t = String(raw).replace(/,\s*(G|F|C|PG|SG|SF|PF)\b/i, '');
    t = t.replace(/\b(I{2,3}|Jr\.?|Sr\.?|II|III)\b/gi, '');
    t = t.replace(/[^a-zA-Z0-9\s'']/g, '');
    return t.trim().toLowerCase();
  };

  const formatHeight = (h) => {
    if (!h && h !== 0) return '';
    if (typeof h === 'string') {
      const s = h.replace(/ft|in|\"|'/gi, ' ').replace(/[^0-9\s-]/g, ' ').trim();
      const parts = s.split(/\s+|\-/).filter(Boolean);
      if (parts.length >= 2) {
        const f = parseInt(parts[0], 10);
        const i = parseInt(parts[1], 10);
        if (!isNaN(f) && !isNaN(i)) return `${f}'${i}"`;
      }
      const n = Number(s);
      if (!isNaN(n)) {
        const ft = Math.floor(n / 12);
        const inch = n % 12;
        return `${ft}'${inch}"`;
      }
      return h;
    }
    if (typeof h === 'number') {
      const ft = Math.floor(h / 12);
      const inch = h % 12;
      return `${ft}'${inch}"`;
    }
    return '';
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/cap_rules.json').then(r => r.ok ? r.json() : null).catch(() => null);
        (async () => {
          try {
            const year = new Date().getFullYear();
            const pathsToTry = ['/db/espn/nba_salaries.json', `/db/espn/nba_salaries_${year}.json`];
            let sres = null;
            for (const p of pathsToTry) {
              try { sres = await fetch(p).then(r => r.ok ? r.json() : null).catch(() => null); if (sres) break; } catch (e) { sres = null; }
            }
            const entries = sres && Array.isArray(sres) ? sres : (sres && Array.isArray(sres.list) ? sres.list : null);
            if (entries && Array.isArray(entries) && mounted) {
              const idx = {};
              const normalizeNameForIndex = (raw) => { if (!raw) return ''; let t = String(raw).replace(/,\s*[A-Z]{1,3}\b/, ''); t = t.replace(/[^a-zA-Z0-9\s'']/g, ''); return t.trim().toLowerCase(); };
              for (const item of entries) {
                if (!item) continue;
                const rawName = (item.name || item.player || item.fullName || '').trim();
                const rawTeam = (item.team || item.club || '').trim();
                const amt = item.salary || item.amount || item.value || item.s || item.salaryRaw;
                const n = amt ? Number(String(amt).replace(/[^0-9.-]+/g, '')) : null;
                if (rawName && n) {
                  const nk = normalizeNameForIndex(rawName);
                  const tk = rawTeam ? normalizeNameForIndex(rawTeam) : '';
                  if (tk) idx[`${tk}|${nk}`] = n;
                  if (!idx[nk]) idx[nk] = n;
                }
              }
              if (Object.keys(idx).length) { setSalariesIndex(idx); salariesLoaded.current = true; }
            }
          } catch (e) {}
        })();
        if (!mounted) return;
        if (res && typeof res === 'object') setCapRules(prev => Object.assign({}, prev, res));
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, []);

  const estimatePayroll = async (teamId, roster) => {
    if (!roster || !Array.isArray(roster) || roster.length === 0) return 0;
    if (teamPayrolls[teamId]) return teamPayrolls[teamId];
    const results = await Promise.all(roster.map(async (p) => {
      try {
        if (p && p.salary && typeof p.salary === 'number') return p.salary;
        if (salariesIndex && Object.keys(salariesIndex).length) {
          const normalizeNameLocal = (raw) => { if (!raw) return ''; let t = String(raw).replace(/,\s*[A-Z]{1,3}\b/, ''); t = t.replace(/[^a-zA-Z0-9\s'']/g, ''); return t.trim().toLowerCase(); };
          const possibleNames = [p.name, p.displayName, p.fullName, p.raw && (p.raw.fullName || p.raw.personName || p.raw.personFullName)].filter(Boolean).map(x => String(x).trim());
          for (const nm of possibleNames) {
            const k = normalizeNameLocal(nm);
            const teamName = (p.team || p.teamName || p.raw && (p.raw.team || p.raw.club || p.raw.teamName) || '').trim();
            const tk = normalizeNameLocal(teamName);
            if (tk && k && salariesIndex[`${tk}|${k}`]) return salariesIndex[`${tk}|${k}`];
            if (k && salariesIndex[k]) return salariesIndex[k];
          }
          const last = ((p.name || '').split(' ').slice(-1)[0] || '').toLowerCase();
          if (last) for (const k of Object.keys(salariesIndex)) if (k.includes(`|${last}`) || k.includes(last)) return salariesIndex[k];
        }
        const pid = p?.id || p?.raw?.id || p?.raw?.personId || p?.name;
        const c = await espnApi.getPlayerContracts('nba', pid || p.name);
        if (Array.isArray(c) && c.length) {
          const amt = c[0]?.amount || c[0]?.salary || c[0]?.value || null;
          if (amt !== null && amt !== undefined) return Number(String(amt).replace(/[^0-9.-]+/g, '')) || 0;
        }
      } catch (e) {}
      return 0;
    }));
    const total = results.reduce((a,b) => a + (Number(b) || 0), 0);
    setTeamPayrolls(tp => ({ ...tp, [teamId]: total }));
    return total;
  };

  useEffect(() => { let mounted = true; (async () => { try { const t = await espnApi.listTeams('nba'); if (!mounted) return; setTeams(Array.isArray(t) ? t : []); } catch (e) { setTeams([]); } })(); return () => { mounted = false; }; }, []);

  useEffect(() => {
    if (!leftTeam) return setLeftRoster([]);
    let mounted = true;
    (async () => {
      try {
        const roster = await espnApi.getTeamRoster('nba', leftTeam.slug || leftTeam.abbreviation || leftTeam.id || leftTeam.displayName || leftTeam.name);
        if (!mounted) return;
        const augmented = (roster || []).map(p => {
          const normalized = { ...p };
          normalized._height = formatHeight(p.height || p.raw?.height || p.raw?.athlete?.height);
          let found = null;
          try {
            if (salariesIndex && Object.keys(salariesIndex).length) {
              const teamName = (leftTeam.displayName || leftTeam.name || leftTeam.abbreviation || '').trim();
              const tk = normalizeName(teamName);
              const pn = normalizeName(p.name || p.displayName || p.raw && (p.raw.fullName || p.raw.personName));
              if (tk && pn && salariesIndex[`${tk}|${pn}`]) found = salariesIndex[`${tk}|${pn}`];
              if (!found && pn && salariesIndex[pn]) found = salariesIndex[pn];
            }
          } catch (e) {}
          normalized.salary = found !== null ? found : null;
          return normalized;
        });
        setLeftRoster(augmented); setLeftSelected({}); try { estimatePayroll(leftTeam.id || leftTeam.slug || leftTeam.abbreviation, augmented); } catch(e) {}
      } catch (e) { setLeftRoster([]); }
    })();
    return () => { mounted = false; };
  }, [leftTeam]);

  useEffect(() => {
    if (!rightTeam) return setRightRoster([]);
    let mounted = true;
    (async () => {
      try {
        const roster = await espnApi.getTeamRoster('nba', rightTeam.slug || rightTeam.abbreviation || rightTeam.id || rightTeam.displayName || rightTeam.name);
        if (!mounted) return;
        const augmented = (roster || []).map(p => {
          const normalized = { ...p };
          normalized._height = formatHeight(p.height || p.raw?.height || p.raw?.athlete?.height);
          let found = null;
          try {
            if (salariesIndex && Object.keys(salariesIndex).length) {
              const teamName = (rightTeam.displayName || rightTeam.name || rightTeam.abbreviation || '').trim();
              const tk = normalizeName(teamName);
              const pn = normalizeName(p.name || p.displayName || p.raw && (p.raw.fullName || p.raw.personName));
              if (tk && pn && salariesIndex[`${tk}|${pn}`]) found = salariesIndex[`${tk}|${pn}`];
              if (!found && pn && salariesIndex[pn]) found = salariesIndex[pn];
            }
          } catch (e) {}
          normalized.salary = found !== null ? found : null;
          return normalized;
        });
        setRightRoster(augmented); setRightSelected({}); try { estimatePayroll(rightTeam.id || rightTeam.slug || rightTeam.abbreviation, augmented); } catch(e) {}
      } catch (e) { setRightRoster([]); }
    })();
    return () => { mounted = false; };
  }, [rightTeam]);

  const toggleSelect = async (side, player) => {
    const id = player?.id || player?.raw?.id || player?.raw?.personId || player?.raw?.athlete?.id;
    const key = id || player.name;
    if (side === 'left') {
      const next = { ...leftSelected };
      if (next[key]) { delete next[key]; setLeftSelected(next); return; }
      if (player && typeof player.salary === 'number') { next[key] = { player, amount: player.salary }; setLeftSelected(next); return; }
      next[key] = { player, amount: 'loading' };
      setLeftSelected(next);
      try {
        const c = await espnApi.getPlayerContracts('nba', id || player.name);
        let amount = null;
        if (Array.isArray(c) && c.length) amount = c[0]?.amount || c[0]?.salary || c[0]?.value || null;
        if (amount !== null && amount !== undefined) next[key] = { player, amount: Number(String(amount).replace(/[^0-9.-]+/g, '')) || 0 };
        else next[key] = { player, amount: 'notfound' };
      } catch (e) { next[key] = { player, amount: 'notfound' }; }
      setLeftSelected(next);
    } else {
      const next = { ...rightSelected };
      if (next[key]) { delete next[key]; setRightSelected(next); return; }
      if (player && typeof player.salary === 'number') { next[key] = { player, amount: player.salary }; setRightSelected(next); return; }
      next[key] = { player, amount: 'loading' };
      setRightSelected(next);
      try {
        const c = await espnApi.getPlayerContracts('nba', id || player.name);
        let amount = null;
        if (Array.isArray(c) && c.length) amount = c[0]?.amount || c[0]?.salary || c[0]?.value || null;
        if (amount !== null && amount !== undefined) next[key] = { player, amount: Number(String(amount).replace(/[^0-9.-]+/g, '')) || 0 };
        else next[key] = { player, amount: 'notfound' };
      } catch (e) { next[key] = { player, amount: 'notfound' }; }
      setRightSelected(next);
    }
  };

  const sumSelected = (sels) => {
    let total = 0; const missing = [];
    for (const k of Object.keys(sels || {})) {
      const s = sels[k]; const amt = s?.amount;
      if (amt === 'notfound' || amt === undefined || amt === null) missing.push(s.player?.name || s.player?.displayName || 'Unknown');
      else if (amt === 'loading') missing.push(s.player?.name || s.player?.displayName || 'Unknown');
      else if (typeof amt === 'number') total += amt || 0;
      else { const n = Number(String(amt).replace(/[^0-9.-]+/g, '')); if (!isNaN(n)) total += n; else missing.push(s.player?.name || s.player?.displayName || 'Unknown'); }
    }
    return { total, missing };
  };

  const evaluate = () => {
    const errs = [];
    if (!leftTeam || !rightTeam) errs.push('Please select both teams');
    if (leftTeam && rightTeam && leftTeam.id === rightTeam.id) errs.push('Select two different teams');
    const left = sumSelected(leftSelected); const right = sumSelected(rightSelected);
    const leftSelectedTotal = left.total + Number(leftCash || 0); const rightSelectedTotal = right.total + Number(rightCash || 0);
    if (left.missing.length) errs.push(`Left side missing contract data for: ${left.missing.join(', ')}`);
    if (right.missing.length) errs.push(`Right side missing contract data for: ${right.missing.join(', ')}`);
    const matchingAllowed = (outbound, inbound) => inbound <= (outbound * 1.25 + 100000);
    const leftPayroll = teamPayrolls[leftTeam?.id] || null; const rightPayroll = teamPayrolls[rightTeam?.id] || null;
    const checkSide = (team, payrollBefore, outbound, inbound, sideLabel) => {
      const cap = capRules.salaryCap;
      if (outbound >= inbound) return { ok: true };
      if (cap && payrollBefore !== null && payrollBefore !== undefined) {
        const capRoom = cap - payrollBefore; if (capRoom >= (inbound - outbound)) return { ok: true };
        if (payrollBefore >= cap) { if (matchingAllowed(outbound, inbound)) return { ok: true }; return { ok: false, reason: `${sideLabel} is over the salary cap and incoming salaries must be matched (125%+100k).` }; }
        if (matchingAllowed(outbound, inbound)) return { ok: true };
        return { ok: false, reason: `${sideLabel} does not have sufficient cap room and salaries are not matched under 125%+100k rule.` };
      }
      if (matchingAllowed(outbound, inbound)) return { ok: true };
      return { ok: false, reason: `${sideLabel} requires salaries to be matched (125%+100k) or sufficient cap space.` };
    };
    const leftCheck = checkSide(leftTeam, leftPayroll, left.total + Number(leftCash || 0), right.total + Number(rightCash || 0), 'Left');
    const rightCheck = checkSide(rightTeam, rightPayroll, right.total + Number(rightCash || 0), left.total + Number(leftCash || 0), 'Right');
    if (!leftCheck.ok) errs.push(leftCheck.reason || 'Left side fails cap/match rules');
    if (!rightCheck.ok) errs.push(rightCheck.reason || 'Right side fails cap/match rules');
    const checkNoTrade = (sels, sideName) => { for (const k of Object.keys(sels)) { const p = sels[k].player; const raw = p?.raw || p; if (!raw) continue; const flags = []; if (raw.noTrade || raw.noTradeClause || raw.no_trade || raw.noTradeClause === true) flags.push('no-trade clause'); if (raw.isNotTradeable || raw.notTradeable) flags.push('not-tradeable'); if (flags.length) errs.push(`${sideName} player ${p.name || p.displayName} may be non-tradeable (${flags.join(', ')})`); } };
    checkNoTrade(leftSelected, 'Left'); checkNoTrade(rightSelected, 'Right');
    setErrors(errs);
    return { allowed: errs.length === 0, reasons: errs };
  };

  const [verdict, setVerdict] = useState({ allowed: false, reasons: [] });
  useEffect(() => { try { const result = evaluate(); setVerdict(result); } catch (e) { const msg = e && e.message ? e.message : String(e); setErrors(prev => [...(prev || []), `Runtime evaluation error: ${msg}`]); setVerdict({ allowed: false, reasons: [`Runtime error: ${msg}`] }); } }, [leftSelected, rightSelected, leftCash, rightCash, leftTeam, rightTeam, teamPayrolls, capRules]);

  useEffect(() => {
    const onError = (ev) => { try { const msg = ev && ev.message ? ev.message : (ev && ev.error && ev.error.message) || String(ev); const stack = ev && ev.error && ev.error.stack ? ev.error.stack : null; setErrors(prev => [...(prev || []), `Global error: ${msg}${stack ? '\n' + stack : ''}`]); } catch (e) {} };
    const onRejection = (ev) => { try { const reason = ev && ev.reason ? ev.reason : ev; const msg = (reason && reason.message) ? reason.message : String(reason); const stack = reason && reason.stack ? reason.stack : null; setErrors(prev => [...(prev || []), `Unhandled rejection: ${msg}${stack ? '\n' + stack : ''}`]); } catch (e) {} };
    window.addEventListener('error', onError); window.addEventListener('unhandledrejection', onRejection);
    return () => { window.removeEventListener('error', onError); window.removeEventListener('unhandledrejection', onRejection); };
  }, []);

  return (
    <div className="trade-container">
      <h2>NBA Trade Machine</h2>
      <div className="trade-grid">
        <div className="team-panel">
          <label>Team A</label>
          <select value={leftTeam?.id || ''} onChange={(e) => {
            const t = teams.find(tt => String(tt.id) === String(e.target.value));
            if (t && rightTeam && String(t.id) === String(rightTeam.id)) { setErrors(prev => [...(prev||[]), 'Cannot select the same team on both sides']); return; }
            setLeftTeam(t || null);
          }}>
            <option value="">Select a team</option>
            {teams.map(t => <option key={t.id} value={t.id} disabled={rightTeam && String(rightTeam.id) === String(t.id)}>{t.displayName || t.name}</option>)}
          </select>
          <div className="roster">
            <h4>Roster</h4>
            <ul className="roster-list">
              {leftRoster && leftRoster.length ? (
                <table className="roster-table">
                  <thead>
                    <tr><th>Name</th><th>Pos / Ht</th><th style={{textAlign:'right'}}>Salary</th><th></th></tr>
                  </thead>
                  <tbody>
                  {leftRoster.map(p => {
                    const id = p.id || p.raw?.id || p.raw?.personId || p.name; const key = id || p.name;
                    const sel = leftSelected[key]; const selected = !!sel;
                    const displayAmount = sel?.amount !== undefined ? sel.amount : (typeof p.salary === 'number' ? p.salary : null);
                    return (
                      <tr key={key} className={selected ? 'selected' : ''}>
                        <td className="player-left"><div className="player-name">{p.name}</div><div className="player-meta">{p.position || ''} {p._height ? `• ${p._height}` : ''}</div></td>
                        <td>{p.position || ''} {p._height ? `• ${p._height}` : ''}</td>
                        <td className="player-salary">{displayAmount === 'loading' ? 'Fetching…' : displayAmount === 'notfound' ? 'Unknown' : (typeof displayAmount === 'number' ? `$${Number(displayAmount).toLocaleString()}` : (selected ? 'Fetching…' : (displayAmount === null ? 'Unknown' : '')))}</td>
                        <td style={{whiteSpace:'nowrap'}}><button onClick={() => toggleSelect('left', p)}>{selected ? 'Remove' : 'Add'}</button></td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              ) : <div className="sb-state">No roster available</div>}
            </ul>
          </div>
          <div className="trade-summary">
            <label>Cash to include ($): <input type="number" value={leftCash} onChange={(e) => setLeftCash(Number(e.target.value||0))} /></label>
            <div>Selected total: ${sumSelected(leftSelected).total.toLocaleString()}</div>
          </div>
        </div>

        <div className="team-panel">
          <label>Team B</label>
          <select value={rightTeam?.id || ''} onChange={(e) => {
            const t = teams.find(tt => String(tt.id) === String(e.target.value));
            if (t && leftTeam && String(t.id) === String(leftTeam.id)) { setErrors(prev => [...(prev||[]), 'Cannot select the same team on both sides']); return; }
            setRightTeam(t || null);
          }}>
            <option value="">Select a team</option>
            {teams.map(t => <option key={t.id} value={t.id} disabled={leftTeam && String(leftTeam.id) === String(t.id)}>{t.displayName || t.name}</option>)}
          </select>
          <div className="roster">
            <h4>Roster</h4>
            <ul className="roster-list">
              {rightRoster && rightRoster.length ? (
                <table className="roster-table">
                  <thead>
                    <tr><th>Name</th><th>Pos / Ht</th><th style={{textAlign:'right'}}>Salary</th><th></th></tr>
                  </thead>
                  <tbody>
                  {rightRoster.map(p => {
                    const id = p.id || p.raw?.id || p.raw?.personId || p.name; const key = id || p.name;
                    const sel = rightSelected[key]; const selected = !!sel;
                    const displayAmount = sel?.amount !== undefined ? sel.amount : (typeof p.salary === 'number' ? p.salary : null);
                    return (
                      <tr key={key} className={selected ? 'selected' : ''}>
                        <td className="player-left"><div className="player-name">{p.name}</div><div className="player-meta">{p.position || ''} {p._height ? `• ${p._height}` : ''}</div></td>
                        <td>{p.position || ''} {p._height ? `• ${p._height}` : ''}</td>
                        <td className="player-salary">{displayAmount === 'loading' ? 'Fetching…' : displayAmount === 'notfound' ? 'Unknown' : (typeof displayAmount === 'number' ? `$${Number(displayAmount).toLocaleString()}` : (selected ? 'Fetching…' : (displayAmount === null ? 'Unknown' : '')))}</td>
                        <td style={{whiteSpace:'nowrap'}}><button onClick={() => toggleSelect('right', p)}>{selected ? 'Remove' : 'Add'}</button></td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              ) : <div className="sb-state">No roster available</div>}
            </ul>
          </div>
          <div className="trade-summary">
            <label>Cash to include ($): <input type="number" value={rightCash} onChange={(e) => setRightCash(Number(e.target.value||0))} /></label>
            <div>Selected total: ${sumSelected(rightSelected).total.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="verdict">
        <h3>Verdict</h3>
        {verdict.allowed ? (
          <div className="allowed">Allowed: This trade appears to meet the simplified salary rules.</div>
        ) : (
          <div className="disallowed">Disallowed: {errors.length ? errors.map((e,i) => <div key={i}>{e}</div>) : <div>Trade not allowed.</div>}</div>
        )}
        <div style={{marginTop:12}}><small>Note: This tool uses simplified rules and ESPN contract lookup when available. Missing contract data or complex exceptions (bird rights, cap holds, protected picks, etc.) may make this evaluation incomplete.</small></div>
      </div>
    </div>
  );
}
