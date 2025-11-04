import { useMemo, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import nflSchedule from "../assets/nfl25.json";
import nbaSchedule from "../assets/nba25.json";
import mlbSchedule from "../assets/mlb25.json";
import { useTodaysGames } from "../hooks/useScoreUpdates";
import { getBroadcastInfo } from "../utils/broadcasts";
import useScheduleFilters from "../hooks/useScheduleFilters";
import { useSessionForSchedulesPage } from "../pages/Schedules";
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
  NBA: nbaLogo,
  rsn: nbaLogo
};

const ymd = (d) => d.toISOString().slice(0, 10);
const parseUtc = (s) => {
  const t = s.replace(" ", "T");
  // If no timezone info, assume UTC by appending Z
  return new Date(/[zZ]|[+\-]\d\d:?\d\d$/.test(t) ? t : t + "Z");
};

const ymdLocal = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

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
    nba: 'https://www.nba.com/watch',
    nfl: 'https://www.nfl.com/',
    rsn: 'https://www.nba.com/schedule'
  };
  return map[name] || null;
}

export default function ScheduleBar() {
  const { sport, setSport, filterState, setFilterState, selected, setSelected } = useScheduleFilters();
  const sportForLive = sport === 'all' ? 'nfl' : sport;
  const { todaysGames: liveGames, lastUpdate } = useTodaysGames(sportForLive);

  // User preferences state
  const [userPrefs, setUserPrefs] = useState({});
  const [loading, setLoading] = useState(true);
  const { session } = useSessionForSchedulesPage();

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

  // If the filter is not 'sports', reset sport to 'all' so we don't keep a sport-specific
  // selection when the sport selector is hidden. This prevents the app from appearing to
  // 'lock' into a sport when the user switches to favorites or 'none'. We only update
  // local state and localStorage when needed.
  useEffect(() => {
    if (filterState !== 'sports' && sport !== 'all') {
      setSport('all');
      try {
        localStorage.setItem('selectedSport', 'all');
      } catch (e) {
        // ignore localStorage errors
      }
      window.dispatchEvent(new CustomEvent('sportChanged', { detail: 'all' }));
    }
  }, [filterState]);

  // Fetch user preferences from Supabase
  useEffect(() => {
    if (!session) return;
    const uid = session.user.id;

    console.log('Fetching user preferences for user ID:', uid);
    console.log('Session object:', session);
    (async () => {
      setLoading(true);
      try {
        let { data, error } = await supabase
          .from("user_preferences")
          .select("sports_prefs, favorite_teams")
          .eq("user_id", uid)
          .maybeSingle();

        let prefsData = data;
        let prefsError = error;

        // Fallback if favorite_teams column doesn't exist
        if (prefsError && prefsError.message && prefsError.message.includes('favorite_teams')) {
          const fallbackResult = await supabase
            .from("user_preferences")
            .select("sports_prefs")
            .eq("user_id", uid)
            .maybeSingle();
          prefsData = fallbackResult.data;
          prefsError = fallbackResult.error;
        }

        if (prefsError) {
          console.warn('Failed to load user preferences:', prefsError.message);
          setUserPrefs({ sports_prefs: [], favorite_teams: {} });
        } else {
          const sportsPrefs = Array.isArray(prefsData?.sports_prefs) ? prefsData.sports_prefs : [];
          const favoriteTeams = typeof prefsData?.favorite_teams === 'object' && prefsData.favorite_teams !== null ? prefsData.favorite_teams : {};
          setUserPrefs({ sports_prefs: sportsPrefs, favorite_teams: favoriteTeams });
        }
      } catch (e) {
        console.error('Unexpected error loading user preferences:', e);
        setUserPrefs({ sports_prefs: [], favorite_teams: {} });
      } finally {
        setLoading(false);
      }
    })();
  }, [session]);

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

  // Build schedule data based on filterState and selected sport
  let scheduleData;
  if (sport === "all" || filterState !== "sports") {
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
  // Compute favorite teams depending on filterState.
  // When the filter is 'favorites' and the sport selector is hidden, prefer matching against
  // all favorite teams across sports so the favorites view isn't accidentally limited by the
  // last-selected sport. When a specific sport is selected, use that sport's favorites.
  let favTeams = [];
  if (filterState === 'favorites') {
    if (sport === 'all') {
      // Flatten all favorites from every sport key (try both uppercase/lowercase keys handled upstream)
      const allFavsObj = userPrefs.favorite_teams || {};
      favTeams = Object.values(allFavsObj).flat().filter(Boolean);
    } else {
      favTeams = userPrefs.favorite_teams?.[sport.toUpperCase()] || userPrefs.favorite_teams?.[sport] || [];
    }

    if (favTeams && favTeams.length > 0) {
      const favSet = new Set(favTeams);
      filteredScheduleData = scheduleData.filter(
        (game) => favSet.has(game.HomeTeam) || favSet.has(game.AwayTeam)
      );
    } else {
      // No favorites available — result should be empty (no favorite games)
      filteredScheduleData = [];
    }
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
    return ymdLocal(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
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

    if (sport === "all" || filterState !== "sports") {
      // Simple grouping by date for all sports or no filter
      filteredScheduleData.forEach((game) => {
        const key = getGameDateKey(game);
        if (!key) return;
        (gameCards[key] ||= []).push(buildGameCard(game, key));
      });

      // Merge with live games data
      if (liveGames && liveGames.length > 0) {
        liveGames.forEach((game) => {
          const gameDate = parseUtc(game.DateUtc || game.DateUTC || game.dateUtc || game.date);
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
          const gameDate = parseUtc(game.DateUtc || game.DateUTC || game.dateUtc || game.date);
          const key = getGameDateKey(game, gameDate);

          mergeLiveGame(gameCards, key, game, sportForLive);
        });
      }
    }

    return gameCards;
  }, [sport, filterState, userPrefs.favorite_teams]);

  const key = ymdLocal(selected); // adjust for local timezone
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

  if (loading)    return <p className="prefs-note">Loading preferences…</p>;
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

          {filterState === 'sports' && (
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