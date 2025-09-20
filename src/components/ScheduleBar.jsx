import { useMemo, useState } from "react";
import seasonRaw from "../assets/nfl25.json";
import "./ScheduleBar.css";

// helpers
const ymd = (d) => d.toISOString().slice(0, 10);
const parseUtc = (s) => new Date(s.replace(" ", "T"));
const fmtLocalTime = (isoUtc) =>
  new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" })
    .format(new Date(isoUtc));

export default function ScheduleBar() {
  const [selected, setSelected] = useState(() => {
    const x = new Date();
    x.setHours(0,0,0,0);
    return x;
  });
  const [showPicker, setShowPicker] = useState(true);

  const byDate = useMemo(() => {
    const idx = {};
    seasonRaw.forEach((g, i) => {
      const d = parseUtc(g.DateUtc); // UTC Date
      if (isNaN(d)) return; // skip bad rows
      // normalize to UTC day key
      const key = ymd(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
      (idx[key] ||= []).push({
        id: g.MatchNumber ?? `${key}-${g.AwayTeam}-${g.HomeTeam}-${i}`,
        homeTeam: g.HomeTeam,
        awayTeam: g.AwayTeam,
        homeScore: g.HomeTeamScore ?? null,
        awayScore: g.AwayTeamScore ?? null,
        venue: g.Location ?? null,
        dateUtcISO: d.toISOString(),
      });
    });
  
    Object.values(idx).forEach(list => list.sort((a,b) => a.dateUtcISO.localeCompare(b.dateUtcISO)));
    return idx;
  }, []);

  const key = ymd(selected);
  const games = byDate[key] || [];

  return (
    <section className="sb-wrap">
      <div className="sb-top">
        <h2 className="sb-title">
        Schedule — {selected.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
        </h2>

        <div className="sb-actions">
          <button className="sb-btn" onClick={() => setShowPicker(v => !v)}>📅 Pick date</button>
          {showPicker && (
            <input
              type="date"
              className="sb-date-input"
              value={key}
              onChange={(e) => {
                const [yy, mm, dd] = e.target.value.split("-").map(Number);
                const next = new Date(yy, mm - 1, dd);
                next.setHours(0,0,0,0);
                setSelected(next);
                setShowPicker(true);
              }}
            />
          )}
        </div>
      </div>

      <div className="sb-cards" aria-live="polite">
        {games.length === 0 ? (
          <div className="sb-state">No games on this date.</div>
        ) : (
          games.map(g => (
            <a key={g.id} href={`/game/${g.id}`} className="sb-card">
              <div className="sb-card-top">
                <div className="sb-teams">
                  <div className="sb-team"><strong>{g.awayTeam}</strong></div>
                  <div className="sb-at">@</div>
                  <div className="sb-team"><strong>{g.homeTeam}</strong></div>
                </div>
                <div className="sb-right">
                  {g.homeScore != null && g.awayScore != null ? (
                    <div className="sb-score">{g.awayScore}–{g.homeScore}</div>
                  ) : (
                    <div className="sb-time">{fmtLocalTime(g.dateUtcISO)}</div>
                  )}
                </div>
              </div>
              {g.venue && <div className="sb-venue">{g.venue}</div>}
            </a>
          ))
        )}
      </div>
    </section>
  );
}
