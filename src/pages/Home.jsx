import React, { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import ScheduleBar from "../components/ScheduleBar";
import { supabase } from "../supabaseClient";
import { calculateWinPercentage, formatWinPercentage } from "../utils/winPercentageCalculator";
import './Home.css';

// Team data for each league - All 32 NFL teams, 30 NBA teams, 30 MLB teams
const TEAM_DATA = {
  NFL: [
    // AFC East
    { name: "Buffalo Bills", winRate: 0.70, conference: "AFC East" },
    { name: "Miami Dolphins", winRate: 0.60, conference: "AFC East" },
    { name: "New York Jets", winRate: 0.45, conference: "AFC East" },
    { name: "New England Patriots", winRate: 0.40, conference: "AFC East" },
    
    // AFC North
    { name: "Baltimore Ravens", winRate: 0.68, conference: "AFC North" },
    { name: "Cincinnati Bengals", winRate: 0.65, conference: "AFC North" },
    { name: "Pittsburgh Steelers", winRate: 0.55, conference: "AFC North" },
    { name: "Cleveland Browns", winRate: 0.50, conference: "AFC North" },
    
    // AFC South
    { name: "Jacksonville Jaguars", winRate: 0.58, conference: "AFC South" },
    { name: "Tennessee Titans", winRate: 0.52, conference: "AFC South" },
    { name: "Indianapolis Colts", winRate: 0.48, conference: "AFC South" },
    { name: "Houston Texans", winRate: 0.45, conference: "AFC South" },
    
    // AFC West
    { name: "Kansas City Chiefs", winRate: 0.75, conference: "AFC West" },
    { name: "Las Vegas Raiders", winRate: 0.55, conference: "AFC West" },
    { name: "Los Angeles Chargers", winRate: 0.50, conference: "AFC West" },
    { name: "Denver Broncos", winRate: 0.42, conference: "AFC West" },
    
    // NFC East
    { name: "Philadelphia Eagles", winRate: 0.72, conference: "NFC East" },
    { name: "Dallas Cowboys", winRate: 0.70, conference: "NFC East" },
    { name: "New York Giants", winRate: 0.45, conference: "NFC East" },
    { name: "Washington Commanders", winRate: 0.38, conference: "NFC East" },
    
    // NFC North
    { name: "Detroit Lions", winRate: 0.65, conference: "NFC North" },
    { name: "Green Bay Packers", winRate: 0.62, conference: "NFC North" },
    { name: "Minnesota Vikings", winRate: 0.55, conference: "NFC North" },
    { name: "Chicago Bears", winRate: 0.35, conference: "NFC North" },
    
    // NFC South
    { name: "Tampa Bay Buccaneers", winRate: 0.58, conference: "NFC South" },
    { name: "New Orleans Saints", winRate: 0.52, conference: "NFC South" },
    { name: "Atlanta Falcons", winRate: 0.48, conference: "NFC South" },
    { name: "Carolina Panthers", winRate: 0.30, conference: "NFC South" },
    
    // NFC West
    { name: "San Francisco 49ers", winRate: 0.68, conference: "NFC West" },
    { name: "Seattle Seahawks", winRate: 0.55, conference: "NFC West" },
    { name: "Los Angeles Rams", winRate: 0.50, conference: "NFC West" },
    { name: "Arizona Cardinals", winRate: 0.35, conference: "NFC West" }
  ],
  
  NBA: [
    // Eastern Conference
    { name: "Boston Celtics", winRate: 0.78, conference: "Eastern" },
    { name: "Miami Heat", winRate: 0.70, conference: "Eastern" },
    { name: "Milwaukee Bucks", winRate: 0.72, conference: "Eastern" },
    { name: "Philadelphia 76ers", winRate: 0.68, conference: "Eastern" },
    { name: "New York Knicks", winRate: 0.65, conference: "Eastern" },
    { name: "Cleveland Cavaliers", winRate: 0.60, conference: "Eastern" },
    { name: "Orlando Magic", winRate: 0.55, conference: "Eastern" },
    { name: "Indiana Pacers", winRate: 0.58, conference: "Eastern" },
    { name: "Chicago Bulls", winRate: 0.45, conference: "Eastern" },
    { name: "Atlanta Hawks", winRate: 0.48, conference: "Eastern" },
    { name: "Brooklyn Nets", winRate: 0.42, conference: "Eastern" },
    { name: "Toronto Raptors", winRate: 0.40, conference: "Eastern" },
    { name: "Charlotte Hornets", winRate: 0.35, conference: "Eastern" },
    { name: "Washington Wizards", winRate: 0.32, conference: "Eastern" },
    { name: "Detroit Pistons", winRate: 0.25, conference: "Eastern" },
    
    // Western Conference
    { name: "Denver Nuggets", winRate: 0.75, conference: "Western" },
    { name: "Los Angeles Lakers", winRate: 0.68, conference: "Western" },
    { name: "Phoenix Suns", winRate: 0.65, conference: "Western" },
    { name: "Golden State Warriors", winRate: 0.60, conference: "Western" },
    { name: "Dallas Mavericks", winRate: 0.62, conference: "Western" },
    { name: "Los Angeles Clippers", winRate: 0.58, conference: "Western" },
    { name: "Sacramento Kings", winRate: 0.55, conference: "Western" },
    { name: "Memphis Grizzlies", winRate: 0.52, conference: "Western" },
    { name: "New Orleans Pelicans", winRate: 0.50, conference: "Western" },
    { name: "Minnesota Timberwolves", winRate: 0.48, conference: "Western" },
    { name: "Oklahoma City Thunder", winRate: 0.45, conference: "Western" },
    { name: "Utah Jazz", winRate: 0.42, conference: "Western" },
    { name: "Portland Trail Blazers", winRate: 0.38, conference: "Western" },
    { name: "San Antonio Spurs", winRate: 0.35, conference: "Western" },
    { name: "Houston Rockets", winRate: 0.30, conference: "Western" }
  ],
  
  MLB: [
    // American League East
    { name: "Tampa Bay Rays", winRate: 0.72, conference: "AL East" },
    { name: "New York Yankees", winRate: 0.60, conference: "AL East" },
    { name: "Toronto Blue Jays", winRate: 0.55, conference: "AL East" },
    { name: "Boston Red Sox", winRate: 0.45, conference: "AL East" },
    { name: "Baltimore Orioles", winRate: 0.65, conference: "AL East" },
    
    // American League Central
    { name: "Minnesota Twins", winRate: 0.58, conference: "AL Central" },
    { name: "Cleveland Guardians", winRate: 0.55, conference: "AL Central" },
    { name: "Detroit Tigers", winRate: 0.48, conference: "AL Central" },
    { name: "Chicago White Sox", winRate: 0.42, conference: "AL Central" },
    { name: "Kansas City Royals", winRate: 0.35, conference: "AL Central" },
    
    // American League West
    { name: "Houston Astros", winRate: 0.65, conference: "AL West" },
    { name: "Seattle Mariners", winRate: 0.52, conference: "AL West" },
    { name: "Los Angeles Angels", winRate: 0.45, conference: "AL West" },
    { name: "Texas Rangers", winRate: 0.50, conference: "AL West" },
    { name: "Oakland Athletics", winRate: 0.30, conference: "AL West" },
    
    // National League East
    { name: "Atlanta Braves", winRate: 0.68, conference: "NL East" },
    { name: "Philadelphia Phillies", winRate: 0.62, conference: "NL East" },
    { name: "New York Mets", winRate: 0.48, conference: "NL East" },
    { name: "Miami Marlins", winRate: 0.52, conference: "NL East" },
    { name: "Washington Nationals", winRate: 0.40, conference: "NL East" },
    
    // National League Central
    { name: "Milwaukee Brewers", winRate: 0.58, conference: "NL Central" },
    { name: "Chicago Cubs", winRate: 0.50, conference: "NL Central" },
    { name: "Cincinnati Reds", winRate: 0.48, conference: "NL Central" },
    { name: "St. Louis Cardinals", winRate: 0.45, conference: "NL Central" },
    { name: "Pittsburgh Pirates", winRate: 0.42, conference: "NL Central" },
    
    // National League West
    { name: "Los Angeles Dodgers", winRate: 0.70, conference: "NL West" },
    { name: "San Diego Padres", winRate: 0.58, conference: "NL West" },
    { name: "San Francisco Giants", winRate: 0.52, conference: "NL West" },
    { name: "Arizona Diamondbacks", winRate: 0.48, conference: "NL West" },
    { name: "Colorado Rockies", winRate: 0.35, conference: "NL West" }
  ]
};

function Home() {
  const [session, setSession] = useState(null);
  const [selectedSport, setSelectedSport] = useState("NFL");
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [userFavoriteTeams, setUserFavoriteTeams] = useState({});
  const [loading, setLoading] = useState(false);

  // Set up session management
  useEffect(() => {
    // Check sessions
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Listener checks for whether user logs in or out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Load user's favorite teams from database
  useEffect(() => {
    if (!session?.user?.id) return;

    const loadFavoriteTeams = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("favorite_teams")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error("Error loading favorite teams:", error);
        } else {
          setUserFavoriteTeams(data?.favorite_teams || {});
        }
      } catch (err) {
        console.error("Error loading favorite teams:", err);
      } finally {
        setLoading(false);
      }
    };

    loadFavoriteTeams();
  }, [session]);

  // Auto-select favorite teams when sport changes
  useEffect(() => {
    const favoriteTeams = userFavoriteTeams[selectedSport] || [];
    if (favoriteTeams.length >= 2) {
      setTeam1(favoriteTeams[0]);
      setTeam2(favoriteTeams[1]);
    } else if (favoriteTeams.length === 1) {
      setTeam1(favoriteTeams[0]);
      setTeam2("");
    } else {
      setTeam1("");
      setTeam2("");
    }
  }, [selectedSport, userFavoriteTeams]);

  // Get teams for the selected sport, with favorites first
  const getAvailableTeams = () => {
    const allTeams = TEAM_DATA[selectedSport] || [];
    const favoriteTeams = userFavoriteTeams[selectedSport] || [];
    
    // Sort teams to show favorites first
    const sortedTeams = [
      ...favoriteTeams.filter(team => allTeams.some(t => t.name === team)),
      ...allTeams.filter(team => !favoriteTeams.includes(team.name))
    ];
    
    return sortedTeams;
  };

  const handleSimulate = () => {
    if (!team1 || !team2 || team1 === team2) {
      alert("Please select two different teams!");
      return;
    }

    setIsSimulating(true);
    
    // Simulate loading time
    setTimeout(() => {
      const teams = TEAM_DATA[selectedSport];
      const team1Data = teams.find(t => t.name === team1);
      const team2Data = teams.find(t => t.name === team2);
      
      if (!team1Data || !team2Data) {
        alert("Team data not found!");
        setIsSimulating(false);
        return;
      }

      // DIMERS.COM STYLE WIN PERCENTAGE CALCULATION:
      // Uses Monte Carlo simulation with 10,000+ game simulations
      // Includes offense, defense, recent form, home advantage, and real-time adjustments
      // Based on Dimers.com's predictive analytics approach
      
      try {
        // Use the new advanced win percentage calculator - Dimers.com style
        const result = calculateWinPercentage(team1, team2, {
          algorithm: 'monteCarlo', // Use Monte Carlo simulation like Dimers.com
          isHomeTeam1: true,
          includeRecentForm: true,
          includeHeadToHead: false
        });

        const formattedResult = formatWinPercentage(result);
      
      // Determine winner
        const winner = formattedResult.team1Percentage > formattedResult.team2Percentage ? team1 : team2;
      
      setPrediction({
        team1: team1,
        team2: team2,
          team1Probability: formattedResult.team1Percentage / 100,
          team2Probability: formattedResult.team2Percentage / 100,
        winner: winner,
          confidence: result.confidence,
          algorithm: formattedResult.algorithm,
          confidenceLevel: formattedResult.confidence,
          details: result.details
        });
        
      } catch (error) {
        console.error('Error calculating win percentage:', error);
        alert("Error calculating predictions. Please try again.");
        setIsSimulating(false);
        return;
      }
      
      setIsSimulating(false);
    }, 1500);
  };

  const resetPrediction = () => {
    setPrediction(null);
    setTeam1("");
    setTeam2("");
  };

  return (
    <>
      <div id="app-container">
        <NavBar />
        <ScheduleBar />
        
        <div className="container mt-4">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="prediction-calculator">
                <h2 className="text-center mb-4" style={{ color: "#e63946", fontFamily: "Arial Black, sans-serif" }}>
                  Win Percentage Calculator
                </h2>
                
                <div className="calculation-info mb-4">
                  <h5 style={{ color: "#60a5fa", marginBottom: "1rem" }}>How We Calculate Win Percentages:</h5>
                  <div className="info-grid">
                    <div className="info-item">
                      <strong>📊 Base Performance Calculation:</strong> alculate each team's base performance using: Win% (40%) + Offense (30%) + Defense (20%) + Recent Form (10%) + Home Advantage (5%)
                    </div>
                    <div className="info-item">
                      <strong>⚖️ Randomness & Volatility:</strong> Add realistic randomness (±15% standard deviation) to account for game unpredictability and sport volatility
                    </div>
                    <div className="info-item">
                      <strong>🎲 Game Simulation:</strong> Simulate each game by calculating final scores based on performance and time remaining
                    </div>
                    <div className="info-item">
                      <strong>🏆 Final Result:</strong> Count wins for each team across all simulations and convert to percentages
                    </div>
                  </div>
                </div>
                
                <div className="calculator-form">
                  {/* Sport Selection */}
                  <div className="form-group mb-4">
                    <label className="form-label">Select Sport:</label>
                    <div className="sport-buttons">
                      {["NFL", "NBA", "MLB"].map(sport => (
                        <button
                          key={sport}
                          className={`sport-btn ${selectedSport === sport ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedSport(sport);
                            resetPrediction();
                          }}
                        >
                          {sport}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Team Selection */}
                  {session && userFavoriteTeams[selectedSport]?.length > 0 && (
                    <div className="alert alert-info mb-3">
                      <small>⭐ Your favorite {selectedSport} teams are shown first and auto-selected</small>
                    </div>
                  )}
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Team 1:</label>
                        <select 
                          className="form-select"
                          value={team1}
                          onChange={(e) => setTeam1(e.target.value)}
                          disabled={loading}
                        >
                          <option value="">Select Team 1</option>
                          {getAvailableTeams().map(team => {
                            const isFavorite = userFavoriteTeams[selectedSport]?.includes(team.name);
                            return (
                            <option key={team.name} value={team.name}>
                                {isFavorite ? "⭐ " : ""}{team.name}
                            </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Team 2:</label>
                        <select 
                          className="form-select"
                          value={team2}
                          onChange={(e) => setTeam2(e.target.value)}
                          disabled={loading}
                        >
                          <option value="">Select Team 2</option>
                          {getAvailableTeams().map(team => {
                            const isFavorite = userFavoriteTeams[selectedSport]?.includes(team.name);
                            return (
                            <option key={team.name} value={team.name}>
                                {isFavorite ? "⭐ " : ""}{team.name}
                            </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Simulate Button */}
                  <div className="text-center mt-4">
                    <button 
                      className="btn btn-primary btn-lg simulate-btn"
                      onClick={handleSimulate}
                      disabled={isSimulating || !team1 || !team2}
                    >
                      {isSimulating ? "Running Simulations..." : "Simulate Matchup"}
                    </button>
                    <div className="simulation-info mt-2">
                      <small className="text-muted">
                         Running 10,000+ Monte Carlo simulations 
                      </small>
                    </div>
                  </div>

                  {/* Prediction Results */}
                  {prediction && (
                    <div className="prediction-results mt-4">
                      <h4 className="text-center mb-3">Prediction Results</h4>
                      <div className="results-card">
                        <div className="team-comparison">
                          <div className="team-result">
                            <h5>{prediction.team1}</h5>
                            <div className="probability-bar">
                              <div 
                                className="probability-fill"
                                style={{ width: `${prediction.team1Probability * 100}%` }}
                              ></div>
                            </div>
                            <span className="probability-text">
                              {(prediction.team1Probability * 100).toFixed(1)}%
                            </span>
                          </div>
                          
                          <div className="vs-divider">VS</div>
                          
                          <div className="team-result">
                            <h5>{prediction.team2}</h5>
                            <div className="probability-bar">
                              <div 
                                className="probability-fill"
                                style={{ width: `${prediction.team2Probability * 100}%` }}
                              ></div>
                            </div>
                            <span className="probability-text">
                              {(prediction.team2Probability * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="winner-announcement">
                          <h3 className="winner-text">
                            🏆 {prediction.winner} Wins!
                          </h3>
                          <div className="prediction-details">
                          <p className="confidence-text">
                              <span 
                                className="confidence-badge" 
                                style={{ backgroundColor: prediction.confidenceLevel?.color }}
                              >
                                {prediction.confidenceLevel?.level} Confidence
                              </span>
                              <span className="confidence-percentage">
                                {(prediction.confidence * 100).toFixed(1)}%
                              </span>
                            </p>
                            <p className="algorithm-info">
                              Algorithm: <strong>{prediction.algorithm}</strong>
                              <small className="algorithm-description">
                                {prediction.confidenceLevel?.description}
                              </small>
                            </p>
                          </div>
                        </div>

                        {/* How We Calculate Win Percentage */}
                        <div className="calculation-breakdown">
                          <h5 className="breakdown-title">📊 How We Calculate Win Percentage</h5>
                          <div className="breakdown-content">
                            <div className="calculation-method">
                              <h6>🎲 Monte Carlo Simulation Method</h6>
                              <p>We run <strong>{prediction.details?.simulations || 10000} simulations</strong> of this matchup to determine win probabilities using advanced statistical modeling.</p>
                              
                              <div className="simulation-steps">
                                <div className="step">
                                  <span className="step-number">1</span>
                                  <div className="step-content">
                                    <strong>Base Performance Calculation</strong>
                                    <p>Calculate each team's base performance using: Win% (40%) + Offense (30%) + Defense (20%) + Recent Form (10%) + Home Advantage (5%)</p>
                                  </div>
                                </div>
                                
                                <div className="step">
                                  <span className="step-number">2</span>
                                  <div className="step-content">
                                    <strong>Randomness & Volatility</strong>
                                    <p>Add realistic randomness (±15% standard deviation) to account for game unpredictability and sport volatility</p>
                                  </div>
                                </div>
                                
                                <div className="step">
                                  <span className="step-number">3</span>
                                  <div className="step-content">
                                    <strong>Game Simulation</strong>
                                    <p>Simulate each game by calculating final scores based on performance and time remaining</p>
                                  </div>
                                </div>
                                
                                <div className="step">
                                  <span className="step-number">4</span>
                                  <div className="step-content">
                                    <strong>Win Probability</strong>
                                    <p>Count wins for each team across all simulations and convert to percentages</p>
                                  </div>
                                </div>
                              </div>

                              {prediction.details && (
                                <>
                                  <div className="team-factors">
                                    <h6>📈 Performance Calculation Formula</h6>
                                    <div className="factors-grid">
                                      <div className="factor-item">
                                        <span className="factor-name">Win Percentage</span>
                                        <span className="factor-weight">40%</span>
                                      </div>
                                      <div className="factor-item">
                                        <span className="factor-name">Offense Rating</span>
                                        <span className="factor-weight">30%</span>
                                      </div>
                                      <div className="factor-item">
                                        <span className="factor-name">Defense Rating</span>
                                        <span className="factor-weight">20%</span>
                                      </div>
                                      <div className="factor-item">
                                        <span className="factor-name">Recent Form</span>
                                        <span className="factor-weight">10%</span>
                                      </div>
                                      <div className="factor-item">
                                        <span className="factor-name">Home Advantage</span>
                                        <span className="factor-weight">+5%</span>
                                      </div>
                                      <div className="factor-item">
                                        <span className="factor-name">Randomness</span>
                                        <span className="factor-weight">±15%</span>
                                      </div>
                                    </div>
                                    <div className="formula-explanation">
                                      <p><strong>Formula:</strong> Base Performance = (Win% × 0.4) + (Offense × 0.3) + (Defense × 0.2) + (Recent Form × 0.1) + Home Advantage</p>
                                      <p><strong>Final Performance:</strong> Base Performance + Random Factor (±15% volatility)</p>
                                    </div>
                                  </div>

                                  <div className="team-stats-breakdown">
                                    <h6>🏈 Team Statistics Used</h6>
                                    <div className="stats-comparison">
                                      <div className="team-stats">
                                        <h7>{team1}</h7>
                                        <div className="stat-item">
                                          <span>Win %:</span>
                                          <span>{prediction.details.team1Stats?.winPercentage || 'N/A'}%</span>
                                        </div>
                                        <div className="stat-item">
                                          <span>Offense:</span>
                                          <span>{prediction.details.team1Stats?.offense || 'N/A'}/100</span>
                                        </div>
                                        <div className="stat-item">
                                          <span>Defense:</span>
                                          <span>{prediction.details.team1Stats?.defense || 'N/A'}/100</span>
                                        </div>
                                        <div className="stat-item">
                                          <span>Recent Form:</span>
                                          <span>{((prediction.details.team1Stats?.recentForm || 0) * 100).toFixed(0)}%</span>
                                        </div>
                                      </div>
                                      
                                      <div className="vs-stats">VS</div>
                                      
                                      <div className="team-stats">
                                        <h7>{team2}</h7>
                                        <div className="stat-item">
                                          <span>Win %:</span>
                                          <span>{prediction.details.team2Stats?.winPercentage || 'N/A'}%</span>
                                        </div>
                                        <div className="stat-item">
                                          <span>Offense:</span>
                                          <span>{prediction.details.team2Stats?.offense || 'N/A'}/100</span>
                                        </div>
                                        <div className="stat-item">
                                          <span>Defense:</span>
                                          <span>{prediction.details.team2Stats?.defense || 'N/A'}/100</span>
                                        </div>
                                        <div className="stat-item">
                                          <span>Recent Form:</span>
                                          <span>{((prediction.details.team2Stats?.recentForm || 0) * 100).toFixed(0)}%</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}

                              <div className="confidence-explanation">
                                <h6>🎯 Confidence Level</h6>
                                <p>Confidence is calculated as the difference between team probabilities. Higher differences mean more confident predictions:</p>
                                <ul>
                                  <li><strong>High (0.7+)</strong>: Very reliable prediction (70%+ confidence)</li>
                                  <li><strong>Medium (0.4-0.7)</strong>: Moderately reliable (40-70% confidence)</li>
                                  <li><strong>Low (&lt;0.4)</strong>: Uncertain prediction (less than 40% confidence)</li>
                                </ul>
                                <p><strong>Formula:</strong> Confidence = |Team1% - Team2%| (absolute difference between probabilities)</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;