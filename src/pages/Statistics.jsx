import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import NavBar from "../components/NavBar";
import "./Statistics.css";

// Mapping from full team names to their JSON filenames and leagues
const TEAM_FILE_MAP = {
  // NFL Teams
  "Buffalo Bills": { filename: "Buffalo", league: "nfl" },
  "Miami Dolphins": { filename: "Miami", league: "nfl" },
  "New York Jets": { filename: "New_York", league: "nfl" },
  "New England Patriots": { filename: "New_England", league: "nfl" },
  "Baltimore Ravens": { filename: "Baltimore", league: "nfl" },
  "Cincinnati Bengals": { filename: "Cincinnati", league: "nfl" },
  "Pittsburgh Steelers": { filename: "Pittsburgh", league: "nfl" },
  "Cleveland Browns": { filename: "Cleveland", league: "nfl" },
  "Jacksonville Jaguars": { filename: "Jacksonville", league: "nfl" },
  "Tennessee Titans": { filename: "Tennessee", league: "nfl" },
  "Indianapolis Colts": { filename: "Indianapolis", league: "nfl" },
  "Houston Texans": { filename: "Houston", league: "nfl" },
  "Kansas City Chiefs": { filename: "Kansas_City", league: "nfl" },
  "Las Vegas Raiders": { filename: "Las_Vegas", league: "nfl" },
  "Los Angeles Chargers": { filename: "Los_Angeles", league: "nfl" },
  "Denver Broncos": { filename: "Denver", league: "nfl" },
  "Philadelphia Eagles": { filename: "Philadelphia", league: "nfl" },
  "Dallas Cowboys": { filename: "Dallas", league: "nfl" },
  "New York Giants": { filename: "New_York", league: "nfl" },
  "Washington Commanders": { filename: "Washington", league: "nfl" },
  "Detroit Lions": { filename: "Detroit", league: "nfl" },
  "Green Bay Packers": { filename: "Green_Bay", league: "nfl" },
  "Minnesota Vikings": { filename: "Minnesota", league: "nfl" },
  "Chicago Bears": { filename: "Chicago", league: "nfl" },
  "Tampa Bay Buccaneers": { filename: "Tampa_Bay", league: "nfl" },
  "New Orleans Saints": { filename: "New_Orleans", league: "nfl" },
  "Atlanta Falcons": { filename: "Atlanta", league: "nfl" },
  "Carolina Panthers": { filename: "Carolina", league: "nfl" },
  "Los Angeles Rams": { filename: "Los_Angeles", league: "nfl" },
  "Seattle Seahawks": { filename: "Seattle", league: "nfl" },
  "San Francisco 49ers": { filename: "San_Francisco", league: "nfl" },
  "Arizona Cardinals": { filename: "Arizona", league: "nfl" },
  // NBA Teams
  "Boston Celtics": { filename: "Boston", league: "nba" },
  "Miami Heat": { filename: "Miami", league: "nba" },
  "Milwaukee Bucks": { filename: "Milwaukee", league: "nba" },
  "Philadelphia 76ers": { filename: "Philadelphia", league: "nba" },
  "Brooklyn Nets": { filename: "Brooklyn", league: "nba" },
  "New York Knicks": { filename: "New_York", league: "nba" },
  "Toronto Raptors": { filename: "Toronto", league: "nba" },
  "Chicago Bulls": { filename: "Chicago", league: "nba" },
  "Cleveland Cavaliers": { filename: "Cleveland", league: "nba" },
  "Detroit Pistons": { filename: "Detroit", league: "nba" },
  "Indiana Pacers": { filename: "Indiana", league: "nba" },
  "Atlanta Hawks": { filename: "Atlanta", league: "nba" },
  "Charlotte Hornets": { filename: "Charlotte", league: "nba" },
  "Orlando Magic": { filename: "Orlando", league: "nba" },
  "Washington Wizards": { filename: "Washington", league: "nba" },
  "Denver Nuggets": { filename: "Denver", league: "nba" },
  "Minnesota Timberwolves": { filename: "Minnesota", league: "nba" },
  "Oklahoma City Thunder": { filename: "Oklahoma_City", league: "nba" },
  "Portland Trail Blazers": { filename: "Portland", league: "nba" },
  "Utah Jazz": { filename: "Utah", league: "nba" },
  "Golden State Warriors": { filename: "Golden_State", league: "nba" },
  "Los Angeles Clippers": { filename: "LA", league: "nba" },
  "Los Angeles Lakers": { filename: "Los_Angeles", league: "nba" },
  "Phoenix Suns": { filename: "Phoenix", league: "nba" },
  "Sacramento Kings": { filename: "Sacramento", league: "nba" },
  "Dallas Mavericks": { filename: "Dallas", league: "nba" },
  "Houston Rockets": { filename: "Houston", league: "nba" },
  "Memphis Grizzlies": { filename: "Memphis", league: "nba" },
  "New Orleans Pelicans": { filename: "New_Orleans", league: "nba" },
  "San Antonio Spurs": { filename: "San_Antonio", league: "nba" },
  // MLB Teams
  "Boston Red Sox": { filename: "Boston", league: "mlb" },
  "New York Yankees": { filename: "New_York", league: "mlb" },
  "Tampa Bay Rays": { filename: "Tampa_Bay", league: "mlb" },
  "Toronto Blue Jays": { filename: "Toronto", league: "mlb" },
  "Baltimore Orioles": { filename: "Baltimore", league: "mlb" },
  "Chicago White Sox": { filename: "Chicago", league: "mlb" },
  "Cleveland Guardians": { filename: "Cleveland", league: "mlb" },
  "Detroit Tigers": { filename: "Detroit", league: "mlb" },
  "Kansas City Royals": { filename: "Kansas_City", league: "mlb" },
  "Minnesota Twins": { filename: "Minnesota", league: "mlb" },
  "Houston Astros": { filename: "Houston", league: "mlb" },
  "Los Angeles Angels": { filename: "Los_Angeles", league: "mlb" },
  "Oakland Athletics": { filename: "Athletics", league: "mlb" },
  "Seattle Mariners": { filename: "Seattle", league: "mlb" },
  "Texas Rangers": { filename: "Texas", league: "mlb" },
  "Atlanta Braves": { filename: "Atlanta", league: "mlb" },
  "Miami Marlins": { filename: "Miami", league: "mlb" },
  "New York Mets": { filename: "New_York", league: "mlb" },
  "Philadelphia Phillies": { filename: "Philadelphia", league: "mlb" },
  "Washington Nationals": { filename: "Washington", league: "mlb" },
  "Chicago Cubs": { filename: "Chicago", league: "mlb" },
  "Cincinnati Reds": { filename: "Cincinnati", league: "mlb" },
  "Milwaukee Brewers": { filename: "Milwaukee", league: "mlb" },
  "Pittsburgh Pirates": { filename: "Pittsburgh", league: "mlb" },
  "St. Louis Cardinals": { filename: "St__Louis", league: "mlb" },
  "Arizona Diamondbacks": { filename: "Arizona", league: "mlb" },
  "Colorado Rockies": { filename: "Colorado", league: "mlb" },
  "Los Angeles Dodgers": { filename: "Los_Angeles", league: "mlb" },
  "San Diego Padres": { filename: "San_Diego", league: "mlb" },
  "San Francisco Giants": { filename: "San_Francisco", league: "mlb" },
};

function Statistics() {
  const [session, setSession] = useState(null);
  const [favoriteTeams, setFavoriteTeams] = useState({});
  const [teamData, setTeamData] = useState({});
  const [expandedTeams, setExpandedTeams] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (!session) {
        setError("Please log in to view your team statistics");
        setLoading(false);
        return;
      }
      setSession(session);
      await fetchFavoriteTeams(session.user.id);
    };
    fetchSession();
  }, []);

  const fetchFavoriteTeams = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("favorite_teams")
        .eq("user_id", userId)
        .maybeSingle();

      if (error && error.message.includes('favorite_teams')) {
        setError("Favorite teams feature not available. Please update your profile preferences.");
        setLoading(false);
        return;
      }

      if (data && data.favorite_teams) {
        setFavoriteTeams(data.favorite_teams);
        await fetchTeamData(data.favorite_teams);
      } else {
        setError("No favorite teams selected. Go to your Profile to add teams.");
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching favorite teams:", err);
      setError("Failed to load favorite teams");
      setLoading(false);
    }
  };

  const fetchTeamData = async (teamsBySport) => {
    const data = {};
    
    for (const [sport, teams] of Object.entries(teamsBySport)) {
      if (!teams || teams.length === 0) continue;
      
      for (const teamName of teams) {
        const teamInfo = TEAM_FILE_MAP[teamName];
        if (!teamInfo) {
          console.warn(`No mapping found for team: ${teamName}`);
          continue;
        }

        const { filename, league } = teamInfo;

        try {
          // Fetch team data from local JSON files
          const response = await fetch(`/db/espn/${league}/${filename}.json`);
          if (response.ok) {
            const teamJson = await response.json();
            data[teamName] = {
              ...teamJson,
              league,
              sport,
            };
          } else {
            console.warn(`Failed to fetch data for ${teamName}: ${response.status}`);
          }
        } catch (err) {
          console.error(`Error fetching data for ${teamName}:`, err);
        }
      }
    }
    
    setTeamData(data);
  };

  const toggleTeamExpansion = (teamName) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [teamName]: !prev[teamName],
    }));
  };

  const getTeamLogo = (team) => {
    // Try multiple paths to find the logo
    const logos = team?.detail?.team?.logos || team?.team?.logos || team?.logos || [];
    if (logos.length > 0) {
      // Prefer the first logo, or try to find a specific size
      const logo = logos.find(l => l.rel?.includes('full')) || logos[0];
      return logo?.href || null;
    }
    return null;
  };

  const getTeamStats = (team) => {
    // Extract team statistics from the team data
    const stats = team?.detail?.team?.record?.items?.[0]?.stats || team?.team?.record?.items?.[0]?.stats || [];
    const record = team?.detail?.team?.record?.items?.[0] || team?.team?.record?.items?.[0] || {};
    
    return {
      wins: record.wins || 0,
      losses: record.losses || 0,
      ties: record.ties || 0,
      stats: stats,
    };
  };

  const getRoster = (team) => {
    const roster = team?.detail?.roster?.entries || team?.detail?.roster || team?.athletes || team?.roster || [];
    
    // Flatten roster if it's grouped
    if (Array.isArray(roster)) {
      const hasGroups = roster.some(r => r && (Array.isArray(r.items) || Array.isArray(r.athletes)));
      if (hasGroups) {
        const flat = [];
        for (const r of roster) {
          if (r && Array.isArray(r.items)) flat.push(...r.items);
          else if (r && Array.isArray(r.athletes)) flat.push(...r.athletes);
          else flat.push(r);
        }
        return flat;
      }
    }
    
    return Array.isArray(roster) ? roster : [];
  };

  const getPlayerStats = (player) => {
    const athlete = player?.athlete || player?.person || player || {};
    const stats = athlete?.stats || athlete?.statistics || [];
    
    // Format stats for display
    const formattedStats = {};
    if (Array.isArray(stats)) {
      stats.forEach(stat => {
        const name = stat.name || stat.displayName || stat.label;
        const value = stat.value || stat.displayValue;
        if (name && value !== undefined) {
          formattedStats[name] = value;
        }
      });
    }
    
    return formattedStats;
  };

  const renderTeamCard = (teamName, team) => {
    const isExpanded = expandedTeams[teamName];
    const logo = getTeamLogo(team);
    const teamStats = getTeamStats(team);
    const roster = getRoster(team);

    return (
      <div key={teamName} className="team-card">
        <div 
          className="team-header" 
          onClick={() => toggleTeamExpansion(teamName)}
        >
          <div className="team-logo-name">
            {logo ? (
              <img 
                src={logo} 
                alt={teamName} 
                className="team-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className="team-logo-fallback" style={{ display: logo ? 'none' : 'flex' }}>
              {teamName.split(' ').map(word => word[0]).join('')}
            </div>
            <h3 className="team-name">{teamName}</h3>
          </div>
          <div className="team-record">
            <span className="record-stat">
              W: {teamStats.wins} | L: {teamStats.losses}
              {teamStats.ties > 0 && ` | T: ${teamStats.ties}`}
            </span>
            <span className="expand-icon">{isExpanded ? "▼" : "▶"}</span>
          </div>
        </div>

        {isExpanded && (
          <div className="team-content">
            <div className="roster-section">
              <h4>Roster ({roster?.length || 0} players)</h4>
              <div className="players-list">
                {roster && roster.length > 0 ? (
                  roster.slice(0, 25).map((player, idx) => {
                    const athlete = player?.athlete || player?.person || player || {};
                    const position = athlete?.position?.abbreviation || athlete?.position?.name || athlete?.position || "N/A";
                    const jersey = athlete?.jersey || athlete?.displayJersey || "N/A";
                    const name = athlete?.displayName || athlete?.fullName || athlete?.name || "Unknown Player";
                    const headshot = athlete?.headshot?.href || athlete?.photo?.href || athlete?.images?.[0]?.url || null;

                    return (
                      <div key={idx} className="player-row">
                        {headshot ? (
                          <img src={headshot} alt={name} className="player-headshot" />
                        ) : (
                          <div className="player-headshot placeholder">
                            <span>#{jersey}</span>
                          </div>
                        )}
                        <div className="player-details">
                          <span className="player-name">{name}</span>
                          <span className="player-meta">#{jersey} • {position}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="no-roster">No roster data available</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="statistics-container">
          <div className="loading">Loading your team statistics...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <NavBar />
        <div className="statistics-container">
          <div className="error-message">{error}</div>
        </div>
      </>
    );
  }

  if (Object.keys(favoriteTeams).length === 0) {
    return (
      <>
        <NavBar />
        <div className="statistics-container">
          <div className="no-teams">
            <h2>No Favorite Teams</h2>
            <p>Go to your Profile to select your favorite teams and view their statistics here.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="statistics-container">
        <h1>Your Team Statistics</h1>
        
        {Object.entries(favoriteTeams).map(([sport, teams]) => (
          <div key={sport} className="sport-section">
            <h2 className="sport-title">{sport}</h2>
            <div className="teams-container">
              {teams && teams.length > 0 ? (
                teams.map((teamName) => {
                  const team = teamData[teamName];
                  if (!team) {
                    return (
                      <div key={teamName} className="team-card error">
                        <h3>{teamName}</h3>
                        <p>Data not available</p>
                      </div>
                    );
                  }
                  return renderTeamCard(teamName, team);
                })
              ) : (
                <p>No teams selected for {sport}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default Statistics;

