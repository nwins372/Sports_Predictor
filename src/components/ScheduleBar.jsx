import { useMemo, useState, useEffect } from "react";
// import { supabase } from "../supabaseClient";
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
import { useTodaysGames } from "../hooks/useScoreUpdates";
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

export default function ScheduleBar({ session }) {
  const [sport, setSport] = useState(() => {
    const saved = localStorage.getItem("selectedSport");
    return saved ? saved.toLowerCase() : 'all';
  });

  const [filterState, setFilterState] = useState(() => {
    return localStorage.getItem("filterState") || "sports";
  });

  const sportForLive = sport === 'all' ? 'nfl' : sport;
  const { todaysGames: liveGames } = useTodaysGames(sportForLive);
  const [userPrefs, setUserPrefs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateSport = (e) => {
      if (e.detail) {
        setSport(String(e.detail).toLowerCase());
      } else {
        const saved = localStorage.getItem("selectedSport") || "nfl";
        setSport(String(saved).toLowerCase());
      }
    };
    window.addEventListener("sportChanged", updateSport);
    return () => window.removeEventListener("sportChanged", updateSport);
  }, []);

  useEffect(() => {
    const updateFilterState = (e) => {
      if (e.detail) {
        setFilterState(e.detail);
      } else {
        const saved = localStorage.getItem("filterState") || "none";
        setFilterState(saved);
      }
    };
    window.addEventListener("filterChanged", updateFilterState);
    return () => window.removeEventListener("filterChanged", updateFilterState);
  }, []);

  // Your Supabase logic for user prefs would go here
  // ...

  const [selected, setSelected] = useState(() => {
    const x = new Date();
    x.setHours(0, 0, 0, 0);
    return x;
  });

  let scheduleData;
  if (sport === "all" || filterState === "none") {
    scheduleData = [
      ...nflSchedule.map(g => ({ ...g, sport: "nfl" })),
      ...nbaSchedule.map(g => ({ ...g, sport: "nba" })),
      ...mlbSchedule.map(g => ({ ...g, sport: "mlb" })),
    ];
  } else {
    switch (sport) {
      case "nfl": scheduleData = nflSchedule; break;
      case "nba": scheduleData = nbaSchedule; break;
      case "mlb": scheduleData = mlbSchedule; break;
      default: scheduleData = []; break;
    }
  }

  const favTeams = userPrefs.favorite_teams?.[sport.toUpperCase()] || userPrefs.favorite_teams?.[sport] || [];
  let filteredScheduleData = scheduleData;
  if (filterState === 'favorites' && favTeams.length > 0) {
    filteredScheduleData = scheduleData.filter(
      game => favTeams.includes(game.HomeTeam) || favTeams.includes(game.AwayTeam)
    );
  }

  function getGameDateKey(game, dateBuilt = null) {
    let d = dateBuilt || parseUtc(game.DateUtc || game.DateUTC || game.dateUtc || game.date);
    if (isNaN(d)) return null;
    return ymd(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
  }

  function buildGameCard(game, key, i = null, sportOverride = null) {
    return {
      id: game.MatchNumber ?? game.GameId ?? `${key}-${game.AwayTeam}-${game.HomeTeam}-${i}`,
      homeTeam: game.HomeTeam ?? "Home",
      awayTeam: game.AwayTeam ?? "Away",
      homeScore: game.HomeTeamScore ?? null,
      awayScore: game.AwayTeamScore ?? null,
      venue: game.Location ?? null,
      dateUtcISO: (parseUtc(game.DateUtc || game.DateUTC || game.dateUtc || game.date) || new Date()).toISOString(),
      sport: sportOverride || game.sport,
    };
  }

  const processGames = useMemo(() => {
    const gameCards = {};
    filteredScheduleData.forEach((game, i) => {
      const key = getGameDateKey(game);
      if (!key) return;
      (gameCards[key] ||= []).push(buildGameCard(game, key, i));
    });
    return gameCards;
  }, [filteredScheduleData]);

  const key = ymd(selected);
  const games = processGames[key] || [];

  function renderGameCard(g, sportKey) {
    const broadcastInfo = getBroadcastInfo(g, sportKey);

    return (
      <a key={g.id} href={`/game/${sportKey}/${g.id}`} className="sb-card">
        <div className="sb-card-top">
          <div className="sb-teams">
            <div className="sb-team">{g.awayTeam}</div>
            <div>@</div>
            <div className="sb-team">{g.homeTeam}</div>
          </div>
          <div className="sb-right">
            {g.homeScore != null && g.awayScore != null ? (
              <div className="sb-score">({g.awayScore}-{g.homeScore})</div>
            ) : (
              <div className="sb-time">{fmtLocalTime(g.dateUtcISO)}</div>
            )}
          </div>
        </div>
        
        {g.venue && <div className="sb-venue">Location: {g.venue}</div>}
        
        <div className="sb-watch-section">
          <span className="sb-watch-title">Where to Watch:</span>
          <div className="sb-broadcasters">
            {Array.isArray(broadcastInfo) ? (
              broadcastInfo.map(key => 
                logoMap[key] ? (
                  <img
                    key={key}
                    src={logoMap[key]}
                    alt={`${key} logo`}
                    className="sb-logo"
                  />
                ) : (
                  <span key={key} className="sb-broadcast-text">{key.toUpperCase()}</span>
                )
              )
            ) : (
              <span className="sb-broadcast-text">{broadcastInfo || 'TBD'}</span>
            )}
          </div>
        </div>
      </a>
    );
  }

  // Temporary hardcoded prefs until session is fixed
  userPrefs.sports_prefs = ["nfl", "nba", "mlb"];

  return (
    <div className="sb-wrap">
      <div className="sb-top">
        <div className="sb-title-container">
          <h3>{sport.toUpperCase()} Schedule</h3>
          {sport === 'nfl' && (
            <a href="https://www.nfl.com/ways-to-watch/by-week/" target="_blank" rel="noopener noreferrer" className="sb-nfl-link">
              Official Ways to Watch
            </a>
          )}
          {sport === 'nba' && (
            <a href="https://www.nba.com/schedule" target="_blank" rel="noopener noreferrer" className="sb-nfl-link">
              Official Schedule
            </a>
          )}
        </div>

        <div className="sb-actions" style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Filter</span>
            <select
              value={filterState}
              onChange={(e) => {
                const newFilter = e.target.value;
                setFilterState(newFilter);
                localStorage.setItem("filterState", newFilter);
                window.dispatchEvent(new CustomEvent("filterChanged", { detail: newFilter }));
              }}
              className="sb-date-input"
            >
              <option value="none">Off (All Sports)</option>
              <option value="sports">By Selected Sport</option>
              <option value="favorites">Favorites Only</option>
            </select>
          </label>

          {filterState !== 'none' && (
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.8 }}>Sport</span>
              <select
                value={sport}
                onChange={(e) => {
                  const newSport = String(e.target.value).toLowerCase();
                  setSport(newSport);
                  localStorage.setItem("selectedSport", newSport);
                  window.dispatchEvent(new CustomEvent("sportChanged", { detail: newSport }));
                }}
                className="sb-date-input"
              >
                <option value="all">All Sports</option>
                {userPrefs.sports_prefs?.map((s) => (
                  <option key={s.toLowerCase()} value={s.toLowerCase()}>{s.toUpperCase()}</option>
                ))}
              </select>
            </label>
          )}

          <div className="sb-date-picker-container">
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.8 }}>Date</span>
              <div className="sb-date-display" onClick={() => document.getElementById('date-picker').showPicker()}>
                {selected.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <input
                id="date-picker"
                type="date"
                className="sb-date-input sb-date-hidden"
                value={key}
                onChange={(e) => {
                  const [yy, mm, dd] = e.target.value.split("-").map(Number);
                  setSelected(new Date(yy, mm - 1, dd));
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
          (sport === "all" || filterState === "none") ? (
            Object.entries(
              games.reduce((acc, g) => {
                (acc[g.sport] ||= []).push(g);
                return acc;
              }, {})
            ).flatMap(([sportKey, sportGames]) => [
              <h4 key={sportKey + "-header"} className="sb-sport-header">{sportKey.toUpperCase()}</h4>,
              ...sportGames.map((g) => renderGameCard(g, sportKey))
            ])
          ) : (
            games.map((g) => renderGameCard(g, sport))
          )
        )}
      </div>
    </div>
  );
}