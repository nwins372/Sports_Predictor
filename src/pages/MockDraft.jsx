import React, { useEffect, useState } from 'react';
import './MockDraft.css';
import prospects from '../assets/nba2026_prospects.json';
import { TranslatedText } from '../components/TranslatedText';

// Spotrac picks will be optionally loaded at runtime (if present in assets)

// Simple weighted pick: sample index from weights array
function weightedSampleIndex(weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < weights.length; i++) {
    if (r < weights[i]) return i;
    r -= weights[i];
  }
  return weights.length - 1;
}

// Weighted selection without replacement for k winners
function weightedWinners(items, weights, k) {
  const winners = [];
  const remainingItems = items.slice();
  const remainingWeights = weights.slice();
  for (let i = 0; i < k && remainingItems.length > 0; i++) {
    const idx = weightedSampleIndex(remainingWeights);
    winners.push(remainingItems[idx]);
    remainingItems.splice(idx, 1);
    remainingWeights.splice(idx, 1);
  }
  return winners;
}

export default function MockDraft() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  // removed manual pick owner overrides in favor of Spotrac mapping
  const [result, setResult] = useState(null);
  const [spotracPicks, setSpotracPicks] = useState([]);

  useEffect(() => {
    // Fetch current NBA standings to derive draft order
    async function fetchStandings() {
      setLoading(true);
      try {
        const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/standings');
        if (!res.ok) throw new Error('Standings fetch failed');
        const json = await res.json();
        // Flatten teams with records. The structure contains groups -> teamRecords
        const groups = (json?.children?.length ? json.children : (json?.records || []));
        let all = [];
        if (Array.isArray(groups) && groups.length) {
          for (const g of groups) {
            const recs = g.teamRecords || g.records || g.teams || [];
            const items = Array.isArray(recs) ? recs : [];
            for (const t of items) {
                  // normalize typical shapes
                  const team = t.team || t;
                  const wins = (t.wins !== undefined && t.wins !== null) ? Number(t.wins) : (t.playoffRank ? 0 : 0);
                  const losses = (t.losses !== undefined && t.losses !== null) ? Number(t.losses) : 0;
                  all.push({
                    id: team?.id || team?.teamId || (team?.uid ? team.uid.split('~').pop() : null),
                    name: team?.displayName || team?.name || team?.abbreviation || 'Unknown',
                    abbreviation: team?.abbreviation || (team?.shortName || '').toUpperCase(),
                    wins,
                    losses,
                    raw: t
                  });
                }
          }
        }
        // Deduplicate by id
        const byId = {};
        for (const a of all) { if (a.id) byId[a.id] = a; }
        const cropped = Object.values(byId);
        // Sort ascending by wins (worst first). If tied, break ties by conference standing (worse conference rank -> earlier pick), then by point differential (worse diff -> earlier pick).
        function getConferenceRank(raw) {
          if (!raw) return null;
          // common places ESPN stores rank info
          const candidates = [raw.team, raw.team?.team, raw];
          for (const c of candidates) {
            if (!c) continue;
            if (c.conferenceRank !== undefined && c.conferenceRank !== null) return Number(c.conferenceRank);
            if (c.conference?.rank !== undefined && c.conference?.rank !== null) return Number(c.conference.rank);
            if (c.team?.conferenceRank !== undefined && c.team?.conferenceRank !== null) return Number(c.team.conferenceRank);
          }
          // try to parse from raw.records array
          if (Array.isArray(raw.records)) {
            for (const r of raw.records) {
              if (r.group && /conference/i.test(r.group)) {
                if (r.summary && r.summary.match(/(\d+)/)) return Number(r.summary.match(/(\d+)/)[1]);
              }
            }
          }
          return null;
        }

        function getPointDiff(raw) {
          if (!raw) return null;
          // try common stat fields
          const statPaths = [raw.stats, raw.team?.stats, raw.team?.team?.stats, raw.statEntries, raw.team?.statEntries];
          for (const s of statPaths) {
            if (!Array.isArray(s)) continue;
            for (const it of s) {
              // look for typical names
              const name = (it.name || it.stat || it.displayName || '').toString().toLowerCase();
              const val = it.value || it.total || it.displayValue || it.statValue;
              if (!name) continue;
              if (/point|plus|minus|pd|\+\-/.test(name) || /plusminus|pointdifferential|point differential|pd/.test(name)) {
                const n = Number((val || it.displayValue || it.value || 0).toString().replace(/[+,]/g, ''));
                if (!Number.isNaN(n)) return n;
              }
            }
          }
          // fallback fields
          if (raw.pointDifferential !== undefined) return Number(raw.pointDifferential);
          if (raw.pointsDiff !== undefined) return Number(raw.pointsDiff);
          return null;
        }

        cropped.sort((a,b) => {
          if (a.wins !== b.wins) return a.wins - b.wins;
          // tie: conference rank (higher/worse rank => earlier pick)
          const aConf = getConferenceRank(a.raw);
          const bConf = getConferenceRank(b.raw);
          if (aConf !== null && bConf !== null && aConf !== bConf) return (bConf - aConf);
          // tie: point differential (worse diff => earlier pick)
          const aPD = getPointDiff(a.raw);
          const bPD = getPointDiff(b.raw);
          if (aPD !== null && bPD !== null && aPD !== bPD) return aPD - bPD;
          // final fallback to losses
          return (b.losses - a.losses);
        });
        // If we don't have 30 teams from the ESPN shape, fall back to a static team list to avoid blocking the page
          if (cropped.length < 30) {
          // Provide fallback 30-team placeholder (abbreviations only) — use canonical list (CHO for Charlotte)
            const fallbackAbbr = ['ATL','BOS','BKN','CHO','CHI','CLE','DAL','DEN','DET','GSW','HOU','IND','LAC','LAL','MEM','MIA','MIL','MIN','NOP','NYK','OKC','ORL','PHI','PHX','POR','SAC','SAS','TOR','UTA','WAS'];
          const fallback = fallbackAbbr.map((a,i)=>({ id: `fb${i+1}`, name: a, abbreviation: a, wins: i+10, losses: 72-(i+10) }));
          setTeams(fallback);
        } else {
          setTeams(cropped.slice(0,30));
        }
      } catch (e) {
        // fallback placeholder teams
  const fallbackAbbr = ['ATL','BOS','BKN','CHO','CHI','CLE','DAL','DEN','DET','GSW','HOU','IND','LAC','LAL','MEM','MIA','MIL','MIN','NOP','NYK','OKC','ORL','PHI','PHX','POR','SAC','SAS','TOR','UTA','WAS'];
  const fallback = fallbackAbbr.map((a,i)=>({ id: `fb${i+1}`, name: a, abbreviation: a, wins: i+10, losses: 72-(i+10) }));
        setTeams(fallback);
      }
      setLoading(false);
    }
    fetchStandings();
  }, []);

  // Try to load Spotrac 2026 picks JSON from public root if present (optional).
  // Put a file named `spotrac_2026_picks.json` in the project's `public/` folder
  // if you want the app to pick it up at runtime (this avoids bundling-time errors).
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/spotrac_2026_picks.json');
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setSpotracPicks(Array.isArray(data) ? data : (data.default || data));
      } catch (e) {
        // optional; ignore if not present or if fetch fails
      }
    })();
    return () => { mounted = false; };
  }, []);

  const simulate = () => {
    if (!teams || teams.length < 30) return;
    // teams expected in ascending order by record (worst first)
    const top14 = teams.slice(0,14);
    const rest = teams.slice(14,30);

    // Build weights decreasing with rank (worst has highest weight)
    const weights = top14.map((t, i) => (15 - (i+1)) ** 2 + 1); // simple quadratic weights
    // pick 4 lottery winners without replacement for top 4 picks
    const winners = weightedWinners(top14, weights, 4);

    // winners are assigned picks 1..4 in the order selected; remaining teams (top14 minus winners) get picks 5..14 in their natural order
    const winnersIds = new Set(winners.map(w => w.id));
    const remainingTop14 = top14.filter(t => !winnersIds.has(t.id));
    // remainingTop14 are in worst-to-best order; they will fill 5..14 in that order

    // Build full draft order teams
    const draftOrderTeams = [...winners, ...remainingTop14, ...rest];

    // Now assign picks 1..30 and select prospects
    const available = [...prospects].sort((a,b)=>b.talent - a.talent); // best-first
    const picks = [];
    for (let i=0;i<30;i++) {
      const pickNum = i+1;
      const team = draftOrderTeams[i];
      // apply Spotrac mapping if available: if the original team's pick is owned by another team in 2026
      let pickTeam = team;
      if (spotracPicks && spotracPicks.length > 0) {
        const origKey = (team.abbreviation || team.name || '').toLowerCase();
        const mapEntry = spotracPicks.find(s => {
          const from = (s.from || s.raw || '').toLowerCase();
          const owner = (s.owner || '').toLowerCase();
          return from.includes(origKey) || (owner && owner.includes(origKey));
        });
        if (mapEntry && mapEntry.owner) {
          // find owner team in loaded teams by abbreviation or name
          const ownerKey = mapEntry.owner;
          const ownerTeam = teams.find(t => ((t.abbreviation||t.name||'').toLowerCase() === ownerKey.toLowerCase()) || ((t.name||'').toLowerCase().includes(ownerKey.toLowerCase())) ) || null;
          if (ownerTeam) pickTeam = ownerTeam;
        }
      }

      // pick selection logic: early picks favor best talent strictly, later picks allow fit/randomness
      if (available.length === 0) break;
      let chosen = null;
      if (pickNum <= 10) {
        // sample among top N remaining with a bias toward higher talent; earlier picks are more biased
        const N = Math.min(8, available.length);
        const topN = available.slice(0, N);
        // bias factor: earlier picks have larger exponent to favor top talents
        const bias = 1 + (11 - pickNum) / 6; // pick1 ~2.83, pick10 ~1.17
        const rawWeights = topN.map(p => Math.pow((p.talent || 50) + 1, bias) * (1 + Math.random() * 0.45));
        const idx = weightedSampleIndex(rawWeights);
        chosen = topN[idx];
        // remove chosen from available
        const remIndex = available.findIndex(a => a.id === chosen.id);
        if (remIndex >= 0) available.splice(remIndex,1);
      } else {
        // sample among top N (e.g., top 6 remaining) with weights influenced by talent and a randomness factor
        const N = Math.min(6, available.length);
        const topN = available.slice(0,N);
        const temperature = 0.8 + (pickNum-11)/20; // slightly more random later
        const rawWeights = topN.map(p => Math.pow(p.talent, 1/temperature) * (1 + Math.random()*0.5));
        const idx = weightedSampleIndex(rawWeights);
        chosen = topN[idx];
        // remove chosen from available
        const remIndex = available.findIndex(a => a.id === chosen.id);
        if (remIndex >= 0) available.splice(remIndex,1);
      }

      picks.push({ pick: pickNum, team: pickTeam, prospect: chosen });
    }

    setResult({ picks, draftOrderTeams });
  };

  // pick ownership is derived from Spotrac mapping (if available) — manual overrides removed

  return (
    <div className="prediction-calculator">
      <h1>NBA <TranslatedText>Mock Draft Simulator (1st Round)</TranslatedText></h1>
      <p className="muted"><TranslatedText>Uses current NBA standings (when available) to build draft order; lottery randomized from worst 14 teams. Prospects are a static top-45 class (enriched).</TranslatedText></p>

      <div className="controls">
        <button className="simulate-btn" onClick={simulate} disabled={loading || teams.length<30}><TranslatedText>Simulate Draft</TranslatedText></button>
        <span className="hint">{loading ? <TranslatedText>Loading standings...</TranslatedText> : <><TranslatedText>Teams loaded:</TranslatedText> {teams.length}</>}</span>
    </div>

      {/* manual pick owner selector removed: ownership is derived from Spotrac 2026 data when available */}

      <div className="champion-results">
        {result ? (
          <table className="result-table">
            <thead><tr><th><TranslatedText>Pick</TranslatedText></th><th><TranslatedText>Team</TranslatedText></th><th><TranslatedText>Prospect</TranslatedText></th><th><TranslatedText>Position</TranslatedText></th><th><TranslatedText>School</TranslatedText></th><th><TranslatedText>Talent</TranslatedText></th></tr></thead>
            <tbody>
              {result.picks.map(p => (
                <tr key={p.pick}>
                  <td>{p.pick}</td>
                  <td>{p.team ? (p.team.abbreviation || p.team.name) : 'TBD'}</td>
                  <td>{p.prospect ? p.prospect.name : '—'}</td>
                  <td>{p.prospect ? p.prospect.position : '—'}</td>
                  <td>{p.prospect ? p.prospect.school : '—'}</td>
                  <td>{p.prospect ? p.prospect.talent : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted"><TranslatedText>No simulation run yet. Click "Simulate Draft" to generate a draft.</TranslatedText></p>
        )}
      </div>

      <div className="notes">
        <h4><TranslatedText>Notes</TranslatedText></h4>
        <ul>
          <li><TranslatedText>Lottery randomness favors worse records via a quadratic weight. It is a simplified model and not an exact real-world odds table.</TranslatedText></li>
          <li><TranslatedText>Picks 1–10 now have probabilistic variation: teams are likelier to pick the highest-talent players but there is some randomness so results vary across simulations.</TranslatedText></li>
          <li><TranslatedText>Pick ownership overrides are derived from Spotrac's 2026 future picks when available; manual overrides were removed to avoid confusion.</TranslatedText></li>
        </ul>
      </div>
  </div>
  );
}
