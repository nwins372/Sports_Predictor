import { useEffect, useMemo, useState } from "react";
import "./ScheduleBar.css";

// --- helpers ---
const startOfWeek = (d, weekStartsOnMonday = false) => {
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = weekStartsOnMonday ? (day === 0 ? -6 : 1 - day) : -day;
  const s = new Date(d);
  s.setHours(0,0,0,0);
  s.setDate(s.getDate() + diff);
  return s;
};
const fmtISO = (d) => d.toISOString().slice(0,10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };

export default function ScheduleBar({
  weekStartsOnMonday = false,     // set true if you want Mon–Sun
  compact = true                  // tiny visual style
}) {
  const today = useMemo(() => { const x = new Date(); x.setHours(0,0,0,0); return x; }, []);
  const weekStart = useMemo(() => startOfWeek(today, weekStartsOnMonday), [today, weekStartsOnMonday]);
  const weekDays = useMemo(() => Array.from({length: 7}, (_,i) => addDays(weekStart, i)), [weekStart]);

  // selected day can only be within this week
  const [selected, setSelected] = useState(today);
  useEffect(() => {
    // clamp if someone tries to set outside week (just in case)
    if (selected < weekStart || selected > addDays(weekStart, 6)) setSelected(today);
  }, [selected, today, weekStart]);

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // fetch when selected changes
  useEffect(() => {
    setLoading(true);
    fetch(`/api/nfl/schedule?date=${fmtISO(selected)}`)
      .then(r => r.json())
      .then(d => setGames(d.games ?? []))
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <section className={`sb-wrap ${compact ? "sb-compact" : ""}`} aria-label="NFL Schedule (This Week)">
      {/* Tiny day pills — only this week, no infinite arrows */}
      <div className="sb-days" role="tablist" aria-label="Select date this week">
        {weekDays.map((d) => {
          const active = fmtISO(d) === fmtISO(selected);
          const label = d.toLocaleDateString(undefined, { weekday: "short" }); // Mon, Tue…
          const dayNum = d.getDate(); // 3, 4, …
          return (
            <button
              key={fmtISO(d)}
              role="tab"
              aria-selected={active}
              onClick={() => setSelected(d)}
              className={`sb-pill ${active ? "active" : ""}`}
              title={d.toLocaleDateString()}
            >
              <span className="sb-wd">{label}</span>
              <span className="sb-dn">{dayNum}</span>
            </button>
          );
        })}
      </div>

      <div className="sb-list" aria-live="polite">
        {loading ? (
          <div className="sb-empty">Loading…</div>
        ) : games.length === 0 ? (
          <div className="sb-empty">No NFL games.</div>
        ) : (
          games.map((g) => (
            <a key={g.id} href={`/game/${g.id}`} className="sb-row">
              <span className="sb-teams">{g.awayTeam} @ {g.homeTeam}</span>
              <span className="sb-time">
                {g.kickoff
                  ? new Date(g.kickoff).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                  : "TBD"}
              </span>
            </a>
          ))
        )}
      </div>
    </section>
  );
}
