import { useMemo, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import nflSchedule from "../assets/nfl25.json";
import nbaSchedule from "../assets/nba25.json";
import mlbSchedule from "../assets/mlb25.json";
import { useTodaysGames } from "../hooks/useScoreUpdates";
import { getBroadcastInfo } from "../utils/broadcasts";
import "./ScheduleBar.css";

const ymd = (d) => d.toISOString().slice(0, 10);
const parseUtc = (s) => new Date(s.replace(" ", "T"));
const fmtLocalTime = (isoUtc) =>
  new Date(isoUtc).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function ScheduleBar({ session }) {
  // Sport selection: all | nfl | nba | mlb
  const [sport, setSport] = useState(() => {
    return localStorage.getItem("selectedSport") || 'all';
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
  const [userPrefs, setUserPrefs] = useState({ sports_prefs: [], favorite_teams: {} });
  const [prefsLoading, setPrefsLoading] = useState(true);

  // Persist sport to localStorage when it changes
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
  useEffect(() => {
    if (!session || !session.user?.id) {
      setUserPrefs({ sports_prefs: [], favorite_teams: {} });
      setPrefsLoading(false);
      return;
    }
    const uid = session.user.id;
    (async () => {
      setPrefsLoading(true);
      let { data, error } = await supabase
        .from("user_preferences")
        .select("sports_prefs, favorite_teams")
        .eq("user_id", uid)
        .maybeSingle();

      // Fallback if favorite_teams column doesn't exist
      if (error && error.message.includes('favorite_teams')) {
        const fallbackResult = await supabase
          .from("user_preferences")
          .select("sports_prefs")
          .eq("user_id", uid)
          .maybeSingle();
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) {
        setUserPrefs({ sports_prefs: [], favorite_teams: {} });
      } else {
        setUserPrefs({
          sports_prefs: Array.isArray(data?.sports_prefs) ? data.sports_prefs : [],
          favorite_teams: typeof data?.favorite_teams === 'object' && data.favorite_teams !== null ? data.favorite_teams : {}
        });
      }
      setPrefsLoading(false);
    })();
  }, [session]);

  // Set filterState to 'Favorites' by default if user has favorites for selected sport
  useEffect(() => {
    if (prefsLoading) return;
    // Only set if filterState is still at initial value
    if (filterState === 'none') {
      const favTeams = userPrefs.favorite_teams?.[sport.toUpperCase()] || userPrefs.favorite_teams?.[sport] || [];
      if (favTeams && favTeams.length > 0) {
        setFilterState('favorites');
      }
    }
  }, [prefsLoading, userPrefs, sport, filterState]);

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

  function getGameDateKey(game) {
    const dateStr = game.DateUtc || game.DateUTC || game.dateUtc || game.date;
    const d = parseUtc(dateStr);
    if (isNaN(d)) return null;
    return ymd(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
  }

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
          if (isNaN(gameDate)) return;
          const key = ymd(new Date(Date.UTC(gameDate.getUTCFullYear(), gameDate.getUTCMonth(), gameDate.getUTCDate())));

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
          if (isNaN(gameDate)) return;
          const key = ymd(new Date(Date.UTC(gameDate.getUTCFullYear(), gameDate.getUTCMonth(), gameDate.getUTCDate())));

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
        <div className="sb-venue">Where to Watch: <strong>{broadcast}</strong></div>
      </a>
    );
  }

  if (prefsLoading) {
    return <div className="sb-wrap"><div className="sb-state">Loading preferences…</div></div>;
  } else {
    return (
      <div className="sb-wrap">
        <div className="sb-top">
          <h3>
            {sport.toUpperCase()} Schedule
          </h3>

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
                // keep sport selectable regardless of filter state
                disabled={false}
              >
                <option value="all">All Sports</option>
                {userPrefs.sports_prefs?.map((s) => (
                  <option key={s.toLowerCase()} value={s.toLowerCase()}>{s}</option>
                ))}
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
}
