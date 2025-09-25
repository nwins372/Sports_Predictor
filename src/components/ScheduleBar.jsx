import { useMemo, useState } from "react";
import nflSchedule from "../assets/nfl25.json";
import nbaSchedule from "../assets/nba25.json";
import mlbSchedule from "../assets/mlb25.json";
import "./ScheduleBar.css";

const ymd = (d) => d.toISOString().slice(0, 10);
const parseUtc = (s) => new Date(s.replace(" ", "T"));
const fmtLocalTime = (isoUtc) =>
  new Date(isoUtc).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function ScheduleBar() {

  const [sport, setSport] = useState("nfl"); 

  const [selected, setSelected] = useState(() => {
    const x = new Date(); x.setHours(0,0,0,0); return x;
  });

  // Choose dataset based on sport
  switch (sport) {
    case "nfl": var scheduleData = nflSchedule; break;
    case "nba": var scheduleData = nbaSchedule; break;
    case "mlb": var scheduleData = mlbSchedule; break;
    default: var scheduleData = []; break;
  }

  // Build { "YYYY-MM-DD": [games...] } for the chosen sport
  const processGames = useMemo(() => {
    const gameCards = {};
    scheduleData.forEach((game, i) => {
      
      const dateStr = game.DateUtc || game.DateUTC || game.dateUtc || game.date; 
      const d = parseUtc(dateStr);
      if (isNaN(d)) return;

      const key = ymd(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
      (gameCards[key] ||= []).push({
        id: game.MatchNumber ?? game.GameId ?? `${key}-${game.AwayTeam}-${game.HomeTeam}-${i}`,
        homeTeam: game.HomeTeam ?? game.homeTeam,
        awayTeam: game.AwayTeam ?? game.awayTeam,
        homeScore: game.HomeTeamScore ?? game.homeScore ?? null,
        awayScore: game.AwayTeamScore ?? game.awayScore ?? null,
        venue: game.Location ?? game.venue ?? null,
        dateUtcISO: d.toISOString(),
      });
    });

    return gameCards;
  }, [scheduleData]);

  const key = ymd(selected);
  const games = processGames[key] || [];

  return (
    <div className="sb-wrap">
      <div className="sb-top">
        <h3>
          {sport.toUpperCase()} Schedule —{" "}
          {selected.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
        </h3>

        <div className="sb-actions" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: .8 }}>Sport</span>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="sb-date-input"
            >
              <option value="nfl">NFL</option>
              <option value="nba">NBA</option>
              <option value="mlb">MLB</option>
            </select>
          </label>

          {/* Date picker */}
          <input
            type="date"
            className="sb-date-input"
            value={key}
            onChange={(e) => {
              const [yy, mm, dd] = e.target.value.split("-").map(Number);
              const chosenDate = new Date(yy, mm - 1, dd);
              chosenDate.setHours(0,0,0,0);     
              setSelected(chosenDate);
            }}
          />
        </div>
      </div>

      <div className="sb-cards">
        {games.length === 0 ? (
          <div className="sb-state">No games on this date.</div>
        ) : (
          games.map((g) => (
            <a key={g.id} href={`/game/${sport}/${g.id}`} className="sb-card">
              <div className="sb-card-top">
                <div className="sb-teams">
                  <div className="sb-team">{g.awayTeam}</div>
                  <div>@</div>
                  <div className="sb-team">{g.homeTeam}</div>
                </div>
                <div className="sb-right">
                  {g.homeScore != null && g.awayScore != null ? (
                    <div className="sb-score">({g.awayScore}–{g.homeScore})</div>
                  ) : (
                    <div className="sb-time">{fmtLocalTime(g.dateUtcISO)}</div>
                  )}
                </div>
              </div>
              {g.venue && <div className="sb-venue">Location: {g.venue}</div>}
            </a>
          ))
        )}
      </div>
    </div>
  );
}
