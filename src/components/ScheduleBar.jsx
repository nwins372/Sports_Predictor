import { useMemo, useState, useEffect } from "react";
import nflSchedule from "../assets/nfl25.json";
import nbaSchedule from "../assets/nba25.json";
import mlbSchedule from "../assets/mlb25.json";
import { useTodaysGames } from "../hooks/useScoreUpdates";
import "./ScheduleBar.css";

const ymd = (d) => d.toISOString().slice(0, 10);
const parseUtc = (s) => new Date(s.replace(" ", "T"));
const fmtLocalTime = (isoUtc) =>
  new Date(isoUtc).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function ScheduleBar() {
  const [sport, setSport] = useState(() => {
    return localStorage.getItem("selectedSport") || "nfl";
  });

  // Use the score update hook for the current sport
  const { todaysGames: liveGames, lastUpdate } = useTodaysGames(sport);

  useEffect(() => {
    const updateSport = (e) => {
      if (e.detail) {
        setSport(e.detail); 
      } else {
        const saved = localStorage.getItem("selectedSport") || "nfl";
        setSport(saved);
      }
    };

    window.addEventListener("sportChanged", updateSport);
    return () => window.removeEventListener("sportChanged", updateSport);
  }, []);

  const [selected, setSelected] = useState(() => {
    const x = new Date();
    x.setHours(0, 0, 0, 0);
    return x;
  });

  let scheduleData;
  switch (sport) {
    case "nfl":
      scheduleData = nflSchedule;
      break;
    case "nba":
      scheduleData = nbaSchedule;
      break;
    case "mlb":
      scheduleData = mlbSchedule;
      break;
    default:
      scheduleData = [];
      break;
  }

  const processGames = useMemo(() => {
    const gameCards = {};
    
    // Process static schedule data
    scheduleData.forEach((game, i) => {
      const dateStr = game.DateUtc || game.DateUTC || game.dateUtc || game.date;
      const d = parseUtc(dateStr);
      if (isNaN(d)) return;

      const key = ymd(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
      (gameCards[key] ||= []).push({
        id:
          game.MatchNumber ??
          game.GameId ??
          `${key}-${game.AwayTeam ?? game.awayPlayer}-${game.HomeTeam ?? game.homePlayer}-${i}`,
        homeTeam: game.HomeTeam ?? game.homeTeam ?? game.homePlayer ?? "Home",
        awayTeam: game.AwayTeam ?? game.awayTeam ?? game.awayPlayer ?? "Away",
        homeScore: game.HomeTeamScore ?? game.homeScore ?? game.homeSets ?? null,
        awayScore: game.AwayTeamScore ?? game.awayScore ?? game.awaySets ?? null,
        venue: game.Location ?? game.venue ?? game.tournament ?? null,
        dateUtcISO: d.toISOString(),
        isLive: game.IsLive || game.Status === 'in' || game.Status === 'live',
        status: game.Status || 'scheduled'
      });
    });

    // Merge with live games data
    if (liveGames && liveGames.length > 0) {
      liveGames.forEach((game) => {
        const gameDate = new Date(game.DateUtc);
        const key = ymd(gameDate);
        
        // Find existing game or create new one
        const existingGameIndex = (gameCards[key] || []).findIndex(
          g => g.homeTeam === game.HomeTeam && g.awayTeam === game.AwayTeam
        );
        
        if (existingGameIndex >= 0) {
          // Update existing game with live data
          gameCards[key][existingGameIndex] = {
            ...gameCards[key][existingGameIndex],
            homeScore: game.HomeTeamScore,
            awayScore: game.AwayTeamScore,
            isLive: game.IsLive || game.Status === 'in' || game.Status === 'live',
            status: game.Status || 'scheduled'
          };
        } else {
          // Add new live game
          (gameCards[key] ||= []).push({
            id: game.MatchNumber || game.id,
            homeTeam: game.HomeTeam,
            awayTeam: game.AwayTeam,
            homeScore: game.HomeTeamScore,
            awayScore: game.AwayTeamScore,
            venue: game.Location || 'TBD',
            dateUtcISO: gameDate.toISOString(),
            isLive: game.IsLive || game.Status === 'in' || game.Status === 'live',
            status: game.Status || 'scheduled'
          });
        }
      });
    }
    
    return gameCards;
  }, [scheduleData, liveGames]);

  const key = ymd(selected);
  const games = processGames[key] || [];

  return (
    <div className="sb-wrap">
      <div className="sb-top">
        <h3>
          {sport.toUpperCase()} Schedule
        </h3>

        <div className="sb-actions" style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Sport</span>
            <select
              value={sport}
              onChange={(e) => {
                const newSport = e.target.value;
                setSport(newSport);
                localStorage.setItem("selectedSport", newSport);
                window.dispatchEvent(new CustomEvent("sportChanged", { detail: newSport }));
              }}
              className="sb-date-input"
            >
              <option value="nfl">NFL</option>
              <option value="nba">NBA</option>
              <option value="mlb">MLB</option>
            </select>
          </label>

          <div className="sb-date-picker-container">
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.8 }}>Date</span>
              <div className="sb-date-display" onClick={() => document.getElementById('date-picker').showPicker()}>
                {selected.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
                <span className="sb-calendar-icon">📅</span>
              </div>
              <input
                id="date-picker"
                type="date"
                className="sb-date-input sb-date-hidden"
                value={key}
                onChange={(e) => {
                  const [yy, mm, dd] = e.target.value.split("-").map(Number);
                  const chosenDate = new Date(yy, mm - 1, dd);
                  chosenDate.setHours(0, 0, 0, 0);
                  setSelected(chosenDate);
                }}
              />
            </label>
          </div>
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
              <div className="sb-venue">Where to Watch:</div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
