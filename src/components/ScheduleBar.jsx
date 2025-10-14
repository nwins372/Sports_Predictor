import { useMemo, useState, useEffect } from "react";
import nflSchedule from "../assets/nfl25.json";
import nbaSchedule from "../assets/nba25.json";
import mlbSchedule from "../assets/mlb25.json";
import espnLogo from "../assets/ESPN_logo.png";
import foxLogo from "../assets/fox_logo.png";
import nbcLogo from "../assets/nbc_logo.png";
import tntLogo from "../assets/TNT_Logo.png";
import abcLogo from "../assets/ABC_logo.png";
import amazonPrimeLogo from "../assets/amazonprime_logo.png";
import nflLogo from "../assets/NFL_logo.png";
import nbaLogo from "../assets/NBA_logo.png";
import appletvLogo from "../assets/appletv_logo.png";
import cbsLogo from "../assets/CBS_logo.png";
import { getBroadcastInfo } from "../utils/broadcasts";
import "./ScheduleBar.css";

const logoMap = {
  fox: foxLogo,
  espn: espnLogo,
  nbc: nbcLogo,
  tnt: tntLogo,
  nba: nbaLogo,
  abc: abcLogo,
  prime_video: amazonPrimeLogo,
  nfl: nflLogo,
  cbs: cbsLogo,
  apple_tv: appletvLogo,
  
};

const ymd = (d) => d.toISOString().slice(0, 10);
const parseUtc = (s) => new Date(s.replace(" ", "T"));
const fmtLocalTime = (isoUtc) =>
  new Date(isoUtc).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function ScheduleBar() {
  const [sport, setSport] = useState(() => {
    return localStorage.getItem("selectedSport") || "nfl";
  });

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
      });
    });
    return gameCards;
  }, [scheduleData]);

  const key = ymd(selected);
  const games = processGames[key] || [];
return (
    <div className="sb-wrap">
      <div className="sb-top">
        <div className="sb-title-container">
          <h3>{sport.toUpperCase()} Schedule</h3>
          {/* Links to official schedules for NFL and NBA, -- Winston */}
          {sport === 'nfl' && (
            <a
              href="https://www.nfl.com/ways-to-watch/by-week/"
              target="_blank"
              rel="noopener noreferrer"
              className="sb-nfl-link"
            >
              Official Ways to Watch 
            </a>
          )}
          {sport === 'nba' && (
            <a
              href="https://www.nba.com/schedule"
              target="_blank"
              rel="noopener noreferrer"
              className="sb-nfl-link"
            >
              Official Schedule
            </a>
          )}
        </div>


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
                <span className="sb-calendar-icon"></span>
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
          games.map((g) => {
            const broadcastInfo = getBroadcastInfo(g, sport);

            return (
              <a key={g.id} href={`/game/${sport}/${g.id}`} className="sb-card">
                <div className="sb-teams">
                  <div className="sb-team">
                    <div className="sb-team-name sb-away">{g.awayTeam} @</div>
                    {g.awayScore !== null && <div className="sb-team-score">{g.awayScore}</div>}
                  </div>
                  <div className="sb-team">
                    <div className="sb-team-name sb-home">{g.homeTeam}</div>
                    {g.homeScore !== null && <div className="sb-team-score">{g.homeScore}</div>}
                  </div>
                </div>

                <div className="sb-time">
                  {g.homeScore === null && g.awayScore === null
                    ? fmtLocalTime(g.dateUtcISO)
                    : "Final"}
                </div>
                    
                {g.venue && <div className="sb-venue">Location: {g.venue}</div>}

                <div className="sb-watch-section">
                  <div className="sb-watch-title">Where to Watch:</div>
                  <div className="sb-broadcasters">
                    {/* Maps logo to name of broadcaster */}
                    {Array.isArray(broadcastInfo) ? (
                      broadcastInfo.map(key => (
                        logoMap[key] ? (
                          <img
                            key={key}
                            src={logoMap[key]}
                            alt={`${key} logo`}
                            className="sb-logo"
                          />
                        ) : null
                      ))
                    ) : (
                      <span className="sb-broadcast-text">{broadcastInfo}</span>
                    )}
                  </div>
                </div>
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}
