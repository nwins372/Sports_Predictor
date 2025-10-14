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
import { getBroadcastInfo } from "../utils/broadcasts";
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

// Build a best-effort broadcast URL from a name or code
function buildBroadcastUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const name = raw.trim().toLowerCase();
  // Known mappings
  const map = {
    espn: 'https://www.espn.com',
    'espn+': 'https://www.espn.com/watch',
    fox: 'https://www.foxsports.com',
    foxsports: 'https://www.foxsports.com',
    nbc: 'https://www.nbcsports.com',
    nbcsports: 'https://www.nbcsports.com',
    cbs: 'https://www.cbssports.com',
    cbssports: 'https://www.cbssports.com',
    abc: 'https://abc.com',
    tnt: 'https://www.tntsports.com',
    tbs: 'https://www.tntsports.com',
    amazon: 'https://www.primevideo.com',
    'prime video': 'https://www.primevideo.com',
    paramount: 'https://www.paramountplus.com',
    'paramount+': 'https://www.paramountplus.com',
    peacock: 'https://www.peacocktv.com',
    apple: 'https://tv.apple.com',
    'apple tv': 'https://tv.apple.com',
    youtube: 'https://www.youtube.com',
    'youtube tv': 'https://tv.youtube.com'
  };

  if (map[name]) return map[name];

  // If it already looks like a URL, return as-is
  if (name.startsWith('http://') || name.startsWith('https://')) {
    return raw;
  }

  // Generic heuristic: try {name}.com; if it contains 'sports' already, keep it
  const slug = name.replace(/[^a-z0-9]+/g, '');
  if (!slug) return null;

  // Prefer {slug}sports.com for names that are generic broadcasters (e.g., "nbc" -> nbcsports.com)
  if ([ 'nbc', 'cbs', 'fox', 'tnt', 'tbs' ].includes(slug)) {
    return `https://www.${slug}sports.com`;
  }

  return `https://www.${slug}.com`;
}

export default function ScheduleBar({ session }) {
  // Sport selection: all | nfl | nba | mlb
  const [sport, setSport] = useState(() => {
    const saved = localStorage.getItem("selectedSport");
    const normalized = typeof saved === 'string' ? saved.toLowerCase() : 'all';
    return normalized || 'all';
  });

  // Filter state: none | sports | favorites
  const [filterState, setFilterState] = useState(() => {
    // default to 'sports' so sport selection is enabled by default
    return localStorage.getItem("filterState") || "sports";
  });

  // Use the score update hook for the current sport
  // Avoid passing 'all' into the hook; pick a valid sport or skip
  const sportForLive = sport === 'all' ? 'nfl' : sport;
  const { todaysGames: liveGames, lastUpdate } = useTodaysGames(sportForLive);

  // User preferences state
  const [userPrefs, setUserPrefs] = useState({});
  const [loading, setLoading] = useState(true);

  // Persist sport to localStorage when it changes
  useEffect(() => {
    const updateSport = (e) => {
      if (e.detail) {
        const val = String(e.detail).toLowerCase();
        setSport(val);
      } else {
        const saved = localStorage.getItem("selectedSport") || "nfl";
        setSport(String(saved).toLowerCase());
      }
    };

    window.addEventListener("sportChanged", updateSport);
    return () => window.removeEventListener("sportChanged", updateSport);
  }, []);

  // Persist filterState to localStorage when it changes
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

  // Fetch user preferences from Supabase
  // useEffect(() => {
  //   if (!session) return;
  //   const uid = session.user.id;

  //   console.log('Fetching user preferences for user ID:', uid);
  //   console.log('Session object:', session);
  //   (async () => {
  //     setLoading(true);
  //     try {
  //       let { data, error } = await supabase
  //         .from("user_preferences")
  //         .select("sports_prefs, favorite_teams")
  //         .eq("user_id", uid)
  //         .maybeSingle();

  //       let prefsData = data;
  //       let prefsError = error;

  //       // Fallback if favorite_teams column doesn't exist
  //       if (prefsError && prefsError.message && prefsError.message.includes('favorite_teams')) {
  //         const fallbackResult = await supabase
  //           .from("user_preferences")
  //           .select("sports_prefs")
  //           .eq("user_id", uid)
  //           .maybeSingle();
  //         prefsData = fallbackResult.data;
  //         prefsError = fallbackResult.error;
  //       }

  //       if (prefsError) {
  //         console.warn('Failed to load user preferences:', prefsError.message);
  //         setUserPrefs({ sports_prefs: [], favorite_teams: {} });
  //       } else {
  //         const sportsPrefs = Array.isArray(prefsData?.sports_prefs) ? prefsData.sports_prefs : [];
  //         const favoriteTeams = typeof prefsData?.favorite_teams === 'object' && prefsData.favorite_teams !== null ? prefsData.favorite_teams : {};
  //         setUserPrefs({ sports_prefs: sportsPrefs, favorite_teams: favoriteTeams });
  //       }
  //     } catch (e) {
  //       console.error('Unexpected error loading user preferences:', e);
  //       setUserPrefs({ sports_prefs: [], favorite_teams: {} });
  //     } finally {
  //       setLoading(false);
  //     }
  //   })();
  // }, [session]);

  // Set filterState to 'Favorites' by default if user has favorites for selected sport
  useEffect(() => {
    if (loading) return;
    // Only set if filterState is still at initial value
    if (filterState === 'none') {
      const favTeams = userPrefs.favorite_teams?.[sport.toUpperCase()] || userPrefs.favorite_teams?.[sport] || [];
      if (favTeams && favTeams.length > 0) {
        setFilterState('favorites');
      }
    }
  }, [loading, userPrefs, sport, filterState]);

  const [selected, setSelected] = useState(() => {
    const x = new Date();
    x.setHours(0, 0, 0, 0);
    return x;
  });

  // Build schedule data based on filterState and selected sport
  let scheduleData;
  if (sport === "all" || filterState === "none") {
    scheduleData = [
      ...nflSchedule.map(g => ({ ...g, sport: "nfl" })),
      ...nbaSchedule.map(g => ({ ...g, sport: "nba" })),
      ...mlbSchedule.map(g => ({ ...g, sport: "mlb" })),
    ];
  } else {
    // Filter by selected sport
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
        scheduleData = nflSchedule.concat(nbaSchedule, mlbSchedule);
        break;
    }
  }

  // Filter scheduleData based on user preferences
  let filteredScheduleData = scheduleData;
  // Try both uppercase and lowercase keys for favorite_teams
  const favTeams = userPrefs.favorite_teams?.[sport.toUpperCase()] || userPrefs.favorite_teams?.[sport] || [];
  if (filterState === 'favorites' && favTeams && favTeams.length > 0) {
    filteredScheduleData = scheduleData.filter(
      game => favTeams.includes(game.HomeTeam) || favTeams.includes(game.AwayTeam)
    );
  }

  // Helper function to extract a date key (YYYY-MM-DD) from a game object
  function getGameDateKey(game, dateBuilt = null) {
    let d;
    if (!dateBuilt) {
      const dateStr = game.DateUtc || game.DateUTC || game.dateUtc || game.date;
      d = parseUtc(dateStr);
    } else {
      d = dateBuilt;
    }
    if (isNaN(d)) return null;
    return ymd(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
  }

  // Builds a normalized game card object
  function buildGameCard(game, key, i = null, sportOverride = null) {
    return {
      id:
        game.MatchNumber ??
        game.GameId ??
        `${key}-${game.AwayTeam ?? game.awayPlayer}-${game.HomeTeam ?? game.homePlayer}${i !== null ? '-' + i : ''}`,
      homeTeam: game.HomeTeam ?? game.homeTeam ?? game.homePlayer ?? "Home",
      awayTeam: game.AwayTeam ?? game.awayTeam ?? game.awayPlayer ?? "Away",
      homeScore: game.HomeTeamScore ?? game.homeScore ?? game.homeSets ?? null,
      awayScore: game.AwayTeamScore ?? game.awayScore ?? game.awaySets ?? null,
      venue: game.Location ?? game.venue ?? game.tournament ?? null,
      dateUtcISO: (parseUtc(game.DateUtc || game.DateUTC || game.dateUtc || game.date) || new Date()).toISOString(),
      isLive: game.IsLive || game.Status === 'in' || game.Status === 'live',
      status: game.Status || 'scheduled',
      sport: sportOverride || game.sport
    };
  }

  // Merge live game data into existing game cards, or adds it as a new entry if not present
  function mergeLiveGame(gameCards, key, liveGame, sportOverride = null) {
    const existingGameIndex = (gameCards[key] || []).findIndex(
      g => g.homeTeam === liveGame.HomeTeam && g.awayTeam === liveGame.AwayTeam
    );
    if (existingGameIndex >= 0) {
      gameCards[key][existingGameIndex] = {
        ...gameCards[key][existingGameIndex],
        homeScore: liveGame.HomeTeamScore,
        awayScore: liveGame.AwayTeamScore,
        isLive: liveGame.IsLive || liveGame.Status === 'in' || liveGame.Status === 'live',
        status: liveGame.Status || 'scheduled'
      };
    } else {
      (gameCards[key] ||= []).push(buildGameCard(liveGame, key, null, sportOverride));
    }
  }

  const processGames = useMemo(() => {
    const gameCards = {};

    if (sport === "all" || filterState === "none") {
      // Simple grouping by date for all sports or no filter
      filteredScheduleData.forEach((game) => {
        const key = getGameDateKey(game);
        if (!key) return;
        (gameCards[key] ||= []).push(buildGameCard(game, key));
      });

      // Merge with live games data
      if (liveGames && liveGames.length > 0) {
        liveGames.forEach((game) => {
          const gameDate = new Date(game.DateUtc);
          const key = getGameDateKey(game, gameDate);

          mergeLiveGame(gameCards, key, game, sportForLive);
        });
      }
    } else {
      // Filtered by selected sport and possibly favorites
      filteredScheduleData.forEach((game, i) => {
        const key = getGameDateKey(game);
        if (!key) return;
        (gameCards[key] ||= []).push(buildGameCard(game, key, i));
      });

      // Merge with live games data
      if (liveGames && liveGames.length > 0) {
        liveGames.forEach((game) => {
          const gameDate = new Date(game.DateUtc);
          const key = getGameDateKey(game, gameDate);

          mergeLiveGame(gameCards, key, game, sportForLive);
        });
      }
    }

    return gameCards;
  }, [filteredScheduleData, liveGames, favTeams, sport, filterState]);

  const key = ymd(selected);
  const games = processGames[key] || [];
  function renderGameCard(g, sportKey, fmtLocalTime, getBroadcastInfo) {
    const broadcast = getBroadcastInfo(g, sportKey);
    const broadcastUrl = buildBroadcastUrl(broadcast);
    const isBroadcastUrl = typeof broadcastUrl === 'string';
    const linkHref = isBroadcastUrl ? broadcastUrl : `/game/${sportKey}/${g.id}`;
    const linkProps = isBroadcastUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {};
    return (
      <a key={g.id} href={linkHref} className="sb-card" {...linkProps}>
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
        <div className="sb-venue">Where to Watch: <strong>{broadcast || 'TBD'}</strong></div>
      </a>
    );
  }

  // Temporary hardcoded prefs until session is fixed
  userPrefs.sports_prefs = ["nfl", "nba", "mlb"];
  // if (!session) return <p className="prefs-note">Log in to manage preferences.</p>;
  // if (loading)    return <p className="prefs-note">Loading preferences…</p>;
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
            <span style={{ fontSize: 12, opacity: 0.8 }}>Filter</span>
            <select
              value={filterState}
              onChange={
                (e) => {
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
                disabled={false}
              >
                <option value="all">All Sports</option>
                {userPrefs.sports_prefs?.map((s) => (
                  <option key={s.toLowerCase()} value={s.toLowerCase()}>{s}</option>
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
          (sport === "all" || filterState === "none")
            ? Object.entries(
                games.reduce((acc, g) => {
                  (acc[g.sport] ||= []).push(g);
                  return acc;
                }, {})
              ).flatMap(([sportKey, sportGames]) => [
                // Sport header
                <h4 key={sportKey + "-header"} className="sb-sport-header">{sportKey.toUpperCase()}</h4>,
                // All cards for this sport
                ...sportGames.map((g) => renderGameCard(g, sportKey, fmtLocalTime, getBroadcastInfo))
              ])
            : (
              // Single sport, flat list
              games.map((g) => renderGameCard(g, sport, fmtLocalTime, getBroadcastInfo))
            )
        )}
      </div>
    </div>
  );
}