// src/components/ScheduleBar.jsx
import { useEffect, useState } from "react";
import "./ScheduleBar.css";

function fmt(d) { return d.toISOString().slice(0,10); }
function addDays(d, n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }

export default function ScheduleBar({ defaultDate = new Date() }) {
  const [date, setDate] = useState(defaultDate);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // fetch one day at a time
  useEffect(() => {
    setLoading(true);
    fetch(`/api/nfl/schedule?date=${fmt(date)}`)
      .then(r => r.json())
      .then(d => setGames(d.games || []))
      .finally(() => setLoading(false));
  }, [date]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(defaultDate, i - 3)); // 3 back/3 forward

  return (
    <section className="schedule-wrap" aria-label="NFL Schedule">
      {/* Day scroller */}
      <div className="schedule-days" role="tablist" aria-label="Select date">
        <button className="nav-btn" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">◀︎</button>

        <div className="days-scroll">
          {days.map((d) => {
            const active = fmt(d) === fmt(date);
            const label = d.toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric" });
            return (
              <button
                key={fmt(d)}
                role="tab"
                aria-selected={active}
                onClick={() => setDate(d)}
                className={`day-pill ${active ? "active" : ""}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="days-actions">
          <button className="pill" onClick={() => setDate(new Date())}>Today</button>
          <button className="nav-btn" onClick={() => setDate(addDays(date, 1))} aria-label="Next day">▶︎</button>
        </div>
      </div>

      {/* Games list */}
      <div className="schedule-list" aria-live="polite">
        {loading ? (
          <div className="skeleton">Loading schedule…</div>
        ) : games.length === 0 ? (
          <div className="empty">No NFL games on {fmt(date)}.</div>
        ) : (
          games.map((g) => (
            <a key={g.id} href={`/game/${g.id}`} className="game-row">
              <span className="teams">{g.awayTeam} @ {g.homeTeam}</span>
              <span className="kick">{g.kickoff ? new Date(g.kickoff).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "TBD"}</span>
            </a>
          ))
        )}
      </div>
    </section>
  );
}
