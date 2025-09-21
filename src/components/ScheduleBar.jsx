import { useMemo, useState } from "react";
import sportSchedule from "../assets/nfl25.json";
import "./ScheduleBar.css";

 // converts date into form YYYY-MM-DD
const ymd = (d) => d.toISOString().slice(0, 10);

// Adds T so date follows the YYYY-MMDDTHH:MM:SSZ format
const parseUtc = (s) => new Date(s.replace(" ", "T"));

// Formats ISO date string into local time
const fmtLocalTime = (isoUtc) => new Date(isoUtc).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function ScheduleBar() {

  // Intializes date picker to beginning of current day
  const [selected, setSelected] = useState(() => {
    const x = new Date();
    x.setHours(0,0,0,0);
    return x;
  });

  const processGames = useMemo(() => {
    const gameCards = {};
    sportSchedule.forEach((game, i) => {
      const d = parseUtc(game.DateUtc); 
      if (isNaN(d)) return; // skip bad rows
      // Converts date to usable YYYY-MM-DD format
      const key = ymd(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
      // add each game to the gameCards object as a key-value pair
      (gameCards[key] ||= []).push({
        id: game.MatchNumber ?? `${key}-${game.AwayTeam}-${game.HomeTeam}-${i}`,
        homeTeam: game.HomeTeam,
        awayTeam: game.AwayTeam,
        homeScore: game.HomeTeamScore ?? null,
        awayScore: game.AwayTeamScore ?? null,
        venue: game.Location ?? null,
        dateUtcISO: d.toISOString(),
      });
    });
    return gameCards;
  }, []);

  const key = ymd(selected);
  const games = processGames[key] || [];

  return (
    <div className="sb-wrap">
      <div className="sb-top">
        <h3 >
        {/*Schedule Day, Month, Day of Month (Number) */}
        Schedule — {selected.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
        </h3>

        <div className="sb-actions">
            <input
              type="date"
              className="sb-date-input"
              value={key}
              onChange={(e) => {
                const [yy, mm, dd] = e.target.value.split("-").map(Number);
                const chosenDate = new Date(yy, mm - 1, dd);
                // change calendar date to selected date
                setSelected(chosenDate);
              }}
            />
        </div>
      </div>
        {/*Prints out each game on the selected date*/}
      <div className="sb-cards">
        {games.length === 0 ? (
          <div>No games on this date.</div>
        ) : (
          games.map(g => (
            <a key={g.id} href={`/game/${g.id}`} className="sb-card">
              <div className="sb-card-top">
                <div className="sb-teams">
                  <div className="sb-team">{g.awayTeam}</div>
                  <div>@</div>
                  <div className="sb-team">{g.homeTeam}</div>
                </div>
                <div className="sb-right">
                 {/* If scores are available, show them; otherwise, show the game time */}
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
