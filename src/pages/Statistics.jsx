import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
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
  // "Los Angeles Chargers": { filename: "Los_Angeles_Chargers", league: "nfl" }, // Data file not available yet
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
    const statsArray = team?.detail?.team?.record?.items?.[0]?.stats || team?.team?.record?.items?.[0]?.stats || [];
    const record = team?.detail?.team?.record?.items?.[0] || team?.team?.record?.items?.[0] || {};
    
    // Convert stats array to object for easier access
    const statsObj = {};
    statsArray.forEach(stat => {
      if (stat.name && stat.value !== undefined) {
        statsObj[stat.name] = stat.value;
      }
    });
    
    return {
      wins: record.wins || 0,
      losses: record.losses || 0,
      ties: record.ties || 0,
      stats: statsArray,
      statsObj: statsObj,
      // Main stats
      pointsFor: statsObj.pointsFor || 0,
      pointsAgainst: statsObj.pointsAgainst || 0,
      avgPointsFor: statsObj.avgPointsFor || 0,
      avgPointsAgainst: statsObj.avgPointsAgainst || 0,
      pointDifferential: statsObj.pointDifferential || 0,
      winPercent: statsObj.winPercent ? (statsObj.winPercent * 100).toFixed(1) : '0.0',
      streak: statsObj.streak || 0,
      divisionWinPercent: statsObj.divisionWinPercent ? (statsObj.divisionWinPercent * 100).toFixed(1) : '0.0',
    };
  };

  const getRoster = (team) => {
    // Note: Current JSON files don't include roster data
    // Roster data would need to be fetched separately from ESPN API
    // For now, return empty array to prevent errors
    console.log('Roster data not available in current team JSON files');
    return [];
    
    /* Original code - keeping for reference when roster data is added
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
    */
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

  const getKeyStats = (team, league) => {
    const teamStats = getTeamStats(team);
    
    // Define key stats based on league
    const keyStatsConfig = {
      nfl: [
        { label: 'Win %', value: `${teamStats.winPercent}%`, icon: '📊' },
        { label: 'Point Diff', value: teamStats.pointDifferential > 0 ? `+${teamStats.pointDifferential}` : teamStats.pointDifferential, icon: '➕' },
        { label: 'Avg Points/Game', value: teamStats.avgPointsFor.toFixed(1), icon: '🎯' },
        { label: 'Avg Allowed/Game', value: teamStats.avgPointsAgainst.toFixed(1), icon: '🛡️' },
        { label: 'Current Streak', value: teamStats.streak > 0 ? `W${teamStats.streak}` : `L${Math.abs(teamStats.streak)}`, icon: '🔥' },
      ],
      nba: [
        { label: 'Win %', value: `${teamStats.winPercent}%`, icon: '📊' },
        { label: 'Point Diff', value: teamStats.pointDifferential > 0 ? `+${teamStats.pointDifferential}` : teamStats.pointDifferential, icon: '➕' },
        { label: 'Avg Points/Game', value: teamStats.avgPointsFor.toFixed(1), icon: '🎯' },
        { label: 'Avg Allowed/Game', value: teamStats.avgPointsAgainst.toFixed(1), icon: '🛡️' },
        { label: 'Current Streak', value: teamStats.streak > 0 ? `W${teamStats.streak}` : `L${Math.abs(teamStats.streak)}`, icon: '🔥' },
      ],
      mlb: [
        { label: 'Win %', value: `${teamStats.winPercent}%`, icon: '📊' },
        { label: 'Run Diff', value: teamStats.pointDifferential > 0 ? `+${teamStats.pointDifferential}` : teamStats.pointDifferential, icon: '➕' },
        { label: 'Avg Runs/Game', value: teamStats.avgPointsFor.toFixed(2), icon: '🎯' },
        { label: 'Avg Allowed/Game', value: teamStats.avgPointsAgainst.toFixed(2), icon: '🛡️' },
        { label: 'Current Streak', value: teamStats.streak > 0 ? `W${teamStats.streak}` : `L${Math.abs(teamStats.streak)}`, icon: '🔥' },
      ],
    };
    
    return keyStatsConfig[league] || keyStatsConfig.nfl;
  };

  const renderTeamCard = (teamName, team) => {
    const isExpanded = expandedTeams[teamName];
    const logo = getTeamLogo(team);
    const teamStats = getTeamStats(team);
    const roster = getRoster(team);
    const keyStats = getKeyStats(team, team.league);
    
    // Determine the appropriate label for points based on league
    const pointsLabel = team.league === 'mlb' ? 'Runs' : 'Points';

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
            <div className="team-info-section">
              {/* Scoring Stats */}
              <div className="scoring-stats">
                <div className="stat-card scored">
                  <div className="stat-icon">⚡</div>
                  <div className="stat-content">
                    <div className="stat-label">{pointsLabel} Scored</div>
                    <div className="stat-value">{teamStats.pointsFor}</div>
                    <div className="stat-avg">Avg: {teamStats.avgPointsFor.toFixed(1)} per game</div>
                  </div>
                </div>
                <div className="stat-card allowed">
                  <div className="stat-icon">🛡️</div>
                  <div className="stat-content">
                    <div className="stat-label">{pointsLabel} Allowed</div>
                    <div className="stat-value">{teamStats.pointsAgainst}</div>
                    <div className="stat-avg">Avg: {teamStats.avgPointsAgainst.toFixed(1)} per game</div>
                  </div>
                </div>
              </div>

              {/* Key Stats Grid */}
              <h4>Key Statistics</h4>
              <div className="key-stats-grid">
                {keyStats.map((stat, idx) => (
                  <div key={idx} className="key-stat-item">
                    <span className="key-stat-icon">{stat.icon}</span>
                    <div className="key-stat-info">
                      <div className="key-stat-label">{stat.label}</div>
                      <div className="key-stat-value">{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Team Details */}
              <h4>Team Information</h4>
              <div className="team-details">
                <div className="detail-row">
                  <span className="detail-icon">🏆</span>
                  <div className="detail-content">
                    <span className="detail-label">League & Sport</span>
                    <span className="detail-value">{team.league?.toUpperCase()} • {team.sport}</span>
                  </div>
                </div>
                
                <div className="detail-row">
                  <span className="detail-icon">📋</span>
                  <div className="detail-content">
                    <span className="detail-label">Overall Record</span>
                    <span className="detail-value">{teamStats.wins}-{teamStats.losses}{teamStats.ties > 0 ? `-${teamStats.ties}` : ''} ({teamStats.winPercent}% Win Rate)</span>
                  </div>
                </div>

                {team.detail?.team?.standingSummary && (
                  <div className="detail-row">
                    <span className="detail-icon">📊</span>
                    <div className="detail-content">
                      <span className="detail-label">Standings</span>
                      <span className="detail-value">{team.detail.team.standingSummary}</span>
                    </div>
                  </div>
                )}

                <div className="detail-row">
                  <span className="detail-icon">📍</span>
                  <div className="detail-content">
                    <span className="detail-label">Location</span>
                    <span className="detail-value">{team.detail?.team?.location || 'N/A'}</span>
                  </div>
                </div>

                {team.detail?.team?.nickname && (
                  <div className="detail-row">
                    <span className="detail-icon">✨</span>
                    <div className="detail-content">
                      <span className="detail-label">Nickname</span>
                      <span className="detail-value">{team.detail.team.nickname}</span>
                    </div>
                  </div>
                )}

                {team.detail?.nextEvent?.[0] && (
                  <div className="detail-row highlight">
                    <span className="detail-icon">🗓️</span>
                    <div className="detail-content">
                      <span className="detail-label">Next Game</span>
                      <span className="detail-value">
                        {team.detail.nextEvent[0].shortName} • {new Date(team.detail.nextEvent[0].date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {team.detail?.nextEvent?.[0]?.competitions?.[0]?.venue && (
                  <div className="detail-row">
                    <span className="detail-icon">🏟️</span>
                    <div className="detail-content">
                      <span className="detail-label">Next Game Venue</span>
                      <span className="detail-value">
                        {team.detail.nextEvent[0].competitions[0].venue.fullName}
                        {team.detail.nextEvent[0].competitions[0].venue.address?.city && 
                          ` • ${team.detail.nextEvent[0].competitions[0].venue.address.city}, ${team.detail.nextEvent[0].competitions[0].venue.address.state}`
                        }
                      </span>
                    </div>
                  </div>
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
      <div className="statistics-container">
        <div className="loading">Loading your team statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="statistics-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (Object.keys(favoriteTeams).length === 0) {
    return (
      <div className="statistics-container">
        <div className="no-teams">
          <h2>No Favorite Teams</h2>
          <p>Go to your Profile to select your favorite teams and view their statistics here.</p>
        </div>
      </div>
    );
  }

  return (
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
  );
}

export default Statistics;

