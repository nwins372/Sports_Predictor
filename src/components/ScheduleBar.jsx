import { useMemo, useState, useEffect } from "react";
// import { supabase } from "../supabaseClient";
import nflSchedule from "../assets/nfl25.json";
import nbaSchedule from "../assets/nba25.json";
import mlbSchedule from "../assets/mlb25.json";
import { useTodaysGames } from "../hooks/useScoreUpdates";
import { getBroadcastInfo } from "../utils/broadcasts";
import "./ScheduleBar.css";

// Logo Imports
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

// Logo Mapping
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


function buildBroadcastUrl(key) {
  if (!key || typeof key !== 'string') return null;
  const name = key.trim().toLowerCase();
  const map = {
    espn: 'https://www.espn.com/watch',
    fox: 'https://www.foxsports.com',
    nbc: 'https://www.peacocktv.com/sports', 
    cbs: 'https://www.paramountplus.com', 
    abc: 'https://abc.com/watch-live',
    tnt: 'https://www.tntdrama.com/watchtnt',
    prime_video: 'https://www.primevideo.com',
    apple_tv: 'https://tv.apple.com',
  };
  return map[name] || null;
}

export default function ScheduleBar({ session }) {
  const [sport, setSport] = useState(() => localStorage.getItem("selectedSport")?.toLowerCase() || 'all');
  const [filterState, setFilterState] = useState(() => localStorage.getItem("filterState") || "sports");
  const { todaysGames: liveGames } = useTodaysGames(sport === 'all' ? 'nfl' : sport);
  const [userPrefs, setUserPrefs] = useState({ sports_prefs: ["nfl", "nba", "mlb"], favorite_teams: {} });
  const [selected, setSelected] = useState(() => {
    const x = new Date();
    x.setHours(0, 0, 0, 0);
    return x;
  });

  // Persist state to localStorage
  useEffect(() => {
    const updateSport = (e) => setSport(String(e.detail || localStorage.getItem("selectedSport") || "nfl").toLowerCase());
    window.addEventListener("sportChanged", updateSport);
    return () => window.removeEventListener("sportChanged", updateSport);
  }, []);

  useEffect(() => {
    const updateFilterState = (e) => setFilterState(e.detail || localStorage.getItem("filterState") || "none");
    window.addEventListener("filterChanged", updateFilterState);
    return () => window.removeEventListener("filterChanged", updateFilterState);
  }, []);
  
  // Logic to process schedule data
  const processGames = useMemo(() => {
    let baseSchedule;
    if (sport === "all" || filterState === "none") {
      baseSchedule = [
        ...nflSchedule.map(g => ({ ...g, sport: "nfl" })),
        ...nbaSchedule.map(g => ({ ...g, sport: "nba" })),
        ...mlbSchedule.map(g => ({ ...g, sport: "mlb" })),
      ];
    } else {
      switch (sport) {
        case "nfl": baseSchedule = nflSchedule.map(g => ({ ...g, sport: "nfl" })); break;
        case "nba": baseSchedule = nbaSchedule.map(g => ({ ...g, sport: "nba" })); break;
        case "mlb": baseSchedule = mlbSchedule.map(g => ({ ...g, sport: "mlb" })); break;
        default: baseSchedule = []; break;
      }
    }
    const favTeams = userPrefs.favorite_teams?.[sport.toUpperCase()] || [];
    const schedule = (filterState === 'favorites' && favTeams.length > 0)
      ? baseSchedule.filter(g => favTeams.includes(g.HomeTeam) || favTeams.includes(g.AwayTeam))
      : baseSchedule;

    const gameCards = {};
    schedule.forEach((g, i) => {
      const d = parseUtc(g.DateUtc || g.DateUTC || g.dateUtc || g.date);
      if (isNaN(d)) return;
      const key = ymd(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
      (gameCards[key] ||= []).push({
        id: g.MatchNumber ?? g.GameId ?? `${key}-${g.AwayTeam}-${g.HomeTeam}-${i}`,
        homeTeam: g.HomeTeam ?? "Home", awayTeam: g.AwayTeam ?? "Away",
        homeScore: g.HomeTeamScore ?? null, awayScore: g.AwayTeamScore ?? null,
        venue: g.Location ?? null, dateUtcISO: d.toISOString(), sport: g.sport,
      });
    });
    return gameCards;
  }, [sport, filterState, userPrefs.favorite_teams]);

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
              broadcastInfo.map(key => {
                const url = buildBroadcastUrl(key);
                const content = logoMap[key] ? (
                  <img src={logoMap[key]} alt={`${key} logo`} className="sb-logo"/>
                ) : (
                  <span className="sb-broadcast-text">{key.toUpperCase()}</span>
                );
                return url ? (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{content}</a>
                ) : (
                  <div key={key}>{content}</div>
                );
              })
            ) : (
              <span className="sb-broadcast-text">{broadcastInfo || 'TBD'}</span>
            )}
          </div>
        </div>
      </a>
    );
  }

  return (
    <div className="sb-wrap">
      <div className="sb-top">
        <div className="sb-title-container">
          <h3>{sport === 'all' || filterState === 'none' ? 'All Sports' : sport.toUpperCase()} Schedule</h3>
          {sport === 'nfl' && <a href="https://www.nfl.com/ways-to-watch/by-week/" target="_blank" rel="noopener noreferrer" className="sb-nfl-link">Official Ways to Watch</a>}
          {sport === 'nba' && <a href="https://www.nba.com/schedule" target="_blank" rel="noopener noreferrer" className="sb-nfl-link">Official Schedule</a>}
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
                  const newSport = e.target.value.toLowerCase();
                  setSport(newSport);
                  localStorage.setItem("selectedSport", newSport);
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
                {selected.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
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
          (filterState === "none") ? (
            Object.entries(games.reduce((acc, g) => { (acc[g.sport] ||= []).push(g); return acc; }, {}))
              .flatMap(([sportKey, sportGames]) => [
                <h4 key={sportKey + "-header"} className="sb-sport-header">{sportKey.toUpperCase()}</h4>,
                ...sportGames.map((g) => renderGameCard(g, sportKey))
              ])
          ) : (
            games.map((g) => renderGameCard(g, g.sport || sport))
          )
        )}
      </div>
    </div>
  );
}