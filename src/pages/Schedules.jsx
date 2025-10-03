import React, { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import ScheduleBar from "../components/ScheduleBar";
import "./Schedules.css";

// Import schedule data (fallback)
import nflData from '../assets/nfl25.json';
import nbaData from '../assets/nba25.json';
import mlbData from '../assets/mlb25.json';

// Import live API service
import sportsAPI from '../services/sportsAPI';

// Team win percentages and records (mock data for demonstration)
const TEAM_STATS = {
  // NFL Teams
  "Kansas City Chiefs": { wins: 14, losses: 3, winPercentage: 82.4 },
  "Buffalo Bills": { wins: 13, losses: 4, winPercentage: 76.5 },
  "Philadelphia Eagles": { wins: 12, losses: 5, winPercentage: 70.6 },
  "Dallas Cowboys": { wins: 11, losses: 6, winPercentage: 64.7 },
  "Baltimore Ravens": { wins: 13, losses: 4, winPercentage: 76.5 },
  "Cincinnati Bengals": { wins: 10, losses: 7, winPercentage: 58.8 },
  "San Francisco 49ers": { wins: 12, losses: 5, winPercentage: 70.6 },
  "Detroit Lions": { wins: 11, losses: 6, winPercentage: 64.7 },
  "Miami Dolphins": { wins: 9, losses: 8, winPercentage: 52.9 },
  "New England Patriots": { wins: 4, losses: 13, winPercentage: 23.5 },
  
  // NBA Teams
  "Boston Celtics": { wins: 55, losses: 27, winPercentage: 67.1 },
  "Los Angeles Lakers": { wins: 47, losses: 35, winPercentage: 57.3 },
  "Golden State Warriors": { wins: 44, losses: 38, winPercentage: 53.7 },
  "Miami Heat": { wins: 46, losses: 36, winPercentage: 56.1 },
  "Denver Nuggets": { wins: 57, losses: 25, winPercentage: 69.5 },
  "Milwaukee Bucks": { wins: 49, losses: 33, winPercentage: 59.8 },
  
  // MLB Teams
  "Los Angeles Dodgers": { wins: 100, losses: 62, winPercentage: 61.7 },
  "New York Yankees": { wins: 94, losses: 68, winPercentage: 58.0 },
  "Atlanta Braves": { wins: 89, losses: 73, winPercentage: 54.9 },
  "Houston Astros": { wins: 90, losses: 72, winPercentage: 55.6 },
  "Boston Red Sox": { wins: 78, losses: 84, winPercentage: 48.1 },
  "San Francisco Giants": { wins: 80, losses: 82, winPercentage: 49.4 },
  "Philadelphia Phillies": { wins: 87, losses: 75, winPercentage: 53.7 },
  "Chicago Cubs": { wins: 83, losses: 79, winPercentage: 51.2 },
  "Milwaukee Brewers": { wins: 93, losses: 69, winPercentage: 57.4 },
  "Toronto Blue Jays": { wins: 74, losses: 88, winPercentage: 45.7 },
  "Baltimore Orioles": { wins: 91, losses: 71, winPercentage: 56.2 },
  "Cleveland Guardians": { wins: 92, losses: 70, winPercentage: 56.8 },
  "Texas Rangers": { wins: 90, losses: 72, winPercentage: 55.6 },
  "Arizona Diamondbacks": { wins: 84, losses: 78, winPercentage: 51.9 },
  "Miami Marlins": { wins: 84, losses: 78, winPercentage: 51.9 },
  "San Diego Padres": { wins: 82, losses: 80, winPercentage: 50.6 },
  "Minnesota Twins": { wins: 87, losses: 75, winPercentage: 53.7 },
  "Seattle Mariners": { wins: 88, losses: 74, winPercentage: 54.3 },
  "Tampa Bay Rays": { wins: 99, losses: 63, winPercentage: 61.1 },
  "New York Mets": { wins: 75, losses: 87, winPercentage: 46.3 },
  "St. Louis Cardinals": { wins: 71, losses: 91, winPercentage: 43.8 },
  "Cincinnati Reds": { wins: 82, losses: 80, winPercentage: 50.6 },
  "Pittsburgh Pirates": { wins: 76, losses: 86, winPercentage: 46.9 },
  "Washington Nationals": { wins: 71, losses: 91, winPercentage: 43.8 },
  "Colorado Rockies": { wins: 59, losses: 103, winPercentage: 36.4 },
  "Oakland Athletics": { wins: 50, losses: 112, winPercentage: 30.9 },
  "Los Angeles Angels": { wins: 73, losses: 89, winPercentage: 45.1 },
  "Kansas City Royals": { wins: 56, losses: 106, winPercentage: 34.6 },
  "Chicago White Sox": { wins: 61, losses: 101, winPercentage: 37.7 },
  "Detroit Tigers": { wins: 78, losses: 84, winPercentage: 48.1 },
  
  // Additional NFL Teams
  "Green Bay Packers": { wins: 9, losses: 8, winPercentage: 52.9 },
  "Minnesota Vikings": { wins: 7, losses: 10, winPercentage: 41.2 },
  "Chicago Bears": { wins: 7, losses: 10, winPercentage: 41.2 },
  "Tampa Bay Buccaneers": { wins: 8, losses: 9, winPercentage: 47.1 },
  "Atlanta Falcons": { wins: 7, losses: 10, winPercentage: 41.2 },
  "Carolina Panthers": { wins: 2, losses: 15, winPercentage: 11.8 },
  "New Orleans Saints": { wins: 9, losses: 8, winPercentage: 52.9 },
  "Seattle Seahawks": { wins: 9, losses: 8, winPercentage: 52.9 },
  "Los Angeles Rams": { wins: 10, losses: 7, winPercentage: 58.8 },
  "Arizona Cardinals": { wins: 4, losses: 13, winPercentage: 23.5 },
  "Las Vegas Raiders": { wins: 8, losses: 9, winPercentage: 47.1 },
  "Los Angeles Chargers": { wins: 5, losses: 12, winPercentage: 29.4 },
  "Denver Broncos": { wins: 8, losses: 9, winPercentage: 47.1 },
  "Pittsburgh Steelers": { wins: 10, losses: 7, winPercentage: 58.8 },
  "Cleveland Browns": { wins: 11, losses: 6, winPercentage: 64.7 },
  "Indianapolis Colts": { wins: 9, losses: 8, winPercentage: 52.9 },
  "Tennessee Titans": { wins: 6, losses: 11, winPercentage: 35.3 },
  "Jacksonville Jaguars": { wins: 9, losses: 8, winPercentage: 52.9 },
  "Houston Texans": { wins: 10, losses: 7, winPercentage: 58.8 },
  "New York Giants": { wins: 6, losses: 11, winPercentage: 35.3 },
  "Washington Commanders": { wins: 8, losses: 9, winPercentage: 47.1 },
  "New York Jets": { wins: 7, losses: 10, winPercentage: 41.2 }
};

// Function to calculate win probability between two teams
const calculateWinProbability = (homeTeam, awayTeam, liveStats = {}) => {
  // Use live stats if available, otherwise fall back to static stats
  const statsSource = Object.keys(liveStats).length > 0 ? liveStats : TEAM_STATS;
  
  const homeStats = statsSource[homeTeam];
  const awayStats = statsSource[awayTeam];
  
  if (!homeStats || !awayStats) {
    return { homeWinProb: 50, awayWinProb: 50 };
  }
  
  // Simple calculation based on win percentages with home field advantage
  const homeAdvantage = 5; // 5% home field advantage
  const homeWinPercentage = homeStats.winPercentage + homeAdvantage;
  const awayWinPercentage = awayStats.winPercentage;
  
  const total = homeWinPercentage + awayWinPercentage;
  const homeWinProb = Math.round((homeWinPercentage / total) * 100);
  const awayWinProb = 100 - homeWinProb;
  
  return { homeWinProb, awayWinProb };
};

// Helper function to determine game status
const getGameStatus = (game) => {
  const gameDate = new Date(game.DateUtc);
  const now = new Date();
  const hasScores = game.HomeTeamScore !== null && game.AwayTeamScore !== null;
  
  // Check API status first
  if (game.Status === 'in' || game.Status === 'live') {
    return "Live";
  }
  
  if (game.Status === 'final' || game.Status === 'closed' || game.Status === 'completed') {
    return "Final";
  }
  
  if (game.Status === 'scheduled' || game.Status === 'pre') {
    return gameDate > now ? "Scheduled" : "Scheduled";
  }
  
  // Fallback logic for games without clear status
  if (hasScores && gameDate < now) {
    return "Final";
  }
  
  if (gameDate > now) {
    return "Scheduled";
  }
  
  // Default for edge cases
  return "Scheduled";
};

// Function to process real schedule data with smart filtering
const processScheduleData = (data, sport, liveStats = {}) => {
  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Filter games to prioritize: live games, future games, and games within the last month
  const filteredGames = data.filter(game => {
    const gameDate = new Date(game.DateUtc);
    const gameStatus = getGameStatus(game);
    
    // Always include live games
    if (gameStatus === "Live") return true;
    
    // Include future games
    if (gameDate > now) return true;
    
    // Include games from the last month
    if (gameDate >= oneMonthAgo && gameDate <= now) return true;
    
    // Exclude older games
    return false;
  });
  
  // For MLB, show all filtered games; for other sports, limit to avoid performance issues
  const gamesToProcess = sport === 'MLB' ? filteredGames : filteredGames.slice(0, 100);
  
  return gamesToProcess.map((game, index) => {
    const gameDate = new Date(game.DateUtc);
    const homeTeam = game.HomeTeam;
    const awayTeam = game.AwayTeam;
    const { homeWinProb, awayWinProb } = calculateWinProbability(homeTeam, awayTeam, liveStats);
    const gameStatus = getGameStatus(game);
    
    return {
      id: `${sport}-${game.MatchNumber}`,
      name: `${awayTeam} @ ${homeTeam}`,
      date: gameDate.toISOString().split('T')[0],
      time: gameDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      location: game.Location,
      type: gameStatus,
      week: `Round ${game.RoundNumber}`,
      homeTeam,
      awayTeam,
      homeWinProb,
      awayWinProb,
      homeScore: game.HomeTeamScore,
      awayScore: game.AwayTeamScore,
      sport,
      status: game.Status,
      isLive: gameStatus === "Live",
      // Enhanced live game details
      currentInning: game.currentInning,
      inningHalf: game.inningHalf,
      currentQuarter: game.currentQuarter,
      quarterTime: game.quarterTime,
      timeRemaining: game.timeRemaining,
      gameClock: game.gameClock,
      period: game.period,
      isTopInning: game.isTopInning,
      // MLB specific
      outs: game.outs,
      baseRunners: game.baseRunners,
      pitcher: game.pitcher,
      batter: game.batter,
      // NFL specific
      down: game.down,
      distance: game.distance,
      fieldPosition: game.fieldPosition,
      possession: game.possession,
      yardLine: game.yardLine,
      isRedZone: game.isRedZone,
      timeout: game.timeout,
      // NBA specific
      shotClock: game.shotClock,
      lead: game.lead,
      isOvertime: game.isOvertime
    };
  });
};

// Major sporting events with enhanced details
const MAJOR_SPORTING_EVENTS = {
  "Olympics & International": [
    { 
      name: "2024 Paris Olympics", 
      date: "2024-07-26", 
      endDate: "2024-08-11",
      time: "Various", 
      location: "Paris, France", 
      type: "Olympics", 
      week: "Summer Olympics",
      description: "The world's premier sporting event featuring 32 sports"
    },
    { 
      name: "2024 Paralympics", 
      date: "2024-08-28", 
      endDate: "2024-09-08",
      time: "Various", 
      location: "Paris, France", 
      type: "Paralympics", 
      week: "Paralympics",
      description: "Paralympic Games featuring para-athletes from around the world"
    },
    { 
      name: "2026 FIFA World Cup", 
      date: "2026-06-11", 
      endDate: "2026-07-19",
      time: "Various", 
      location: "USA, Canada, Mexico", 
      type: "World Cup", 
      week: "FIFA World Cup",
      description: "The biggest football tournament in the world"
    },
    { 
      name: "2026 Winter Olympics", 
      date: "2026-02-06", 
      endDate: "2026-02-22",
      time: "Various", 
      location: "Milan-Cortina, Italy", 
      type: "Olympics", 
      week: "Winter Olympics",
      description: "Winter Olympic Games featuring ice and snow sports"
    }
  ],
  "Tennis Grand Slams": [
    { 
      name: "Australian Open 2025", 
      date: "2025-01-13", 
      endDate: "2025-01-26",
      time: "Various", 
      location: "Melbourne, Australia", 
      type: "Grand Slam", 
      week: "Australian Open",
      description: "First Grand Slam of the year"
    },
    { 
      name: "French Open 2025", 
      date: "2025-05-26", 
      endDate: "2025-06-08",
      time: "Various", 
      location: "Paris, France", 
      type: "Grand Slam", 
      week: "French Open",
      description: "Clay court championship at Roland Garros"
    },
    { 
      name: "Wimbledon 2025", 
      date: "2025-06-30", 
      endDate: "2025-07-13",
      time: "Various", 
      location: "London, England", 
      type: "Grand Slam", 
      week: "Wimbledon",
      description: "The most prestigious tennis tournament"
    },
    { 
      name: "US Open 2025", 
      date: "2025-08-25", 
      endDate: "2025-09-07",
      time: "Various", 
      location: "New York, USA", 
      type: "Grand Slam", 
      week: "US Open",
      description: "Final Grand Slam of the year"
    }
  ],
  "Golf Majors": [
    { 
      name: "The Masters 2025", 
      date: "2025-04-10", 
      endDate: "2025-04-13",
      time: "Various", 
      location: "Augusta, Georgia", 
      type: "Major", 
      week: "The Masters",
      description: "Golf's most prestigious tournament"
    },
    { 
      name: "PGA Championship 2025", 
      date: "2025-05-15", 
      endDate: "2025-05-18",
      time: "Various", 
      location: "Quail Hollow, North Carolina", 
      type: "Major", 
      week: "PGA Championship",
      description: "Second major championship of the year"
    },
    { 
      name: "U.S. Open 2025", 
      date: "2025-06-12", 
      endDate: "2025-06-15",
      time: "Various", 
      location: "Oakmont, Pennsylvania", 
      type: "Major", 
      week: "U.S. Open",
      description: "America's national championship"
    },
    { 
      name: "The Open Championship 2025", 
      date: "2025-07-17", 
      endDate: "2025-07-20",
      time: "Various", 
      location: "Royal Portrush, Northern Ireland", 
      type: "Major", 
      week: "The Open",
      description: "Golf's oldest major championship"
    }
  ],
  "Formula 1": [
    { 
      name: "Monaco Grand Prix", 
      date: "2025-05-25", 
      time: "9:00 AM ET", 
      location: "Monte Carlo, Monaco", 
      type: "Grand Prix", 
      week: "Monaco GP",
      description: "The most glamorous race on the F1 calendar"
    },
    { 
      name: "British Grand Prix", 
      date: "2025-07-06", 
      time: "10:00 AM ET", 
      location: "Silverstone, England", 
      type: "Grand Prix", 
      week: "British GP",
      description: "Home of British motorsport"
    },
    { 
      name: "Las Vegas Grand Prix", 
      date: "2025-11-22", 
      time: "1:00 AM ET", 
      location: "Las Vegas, Nevada", 
      type: "Grand Prix", 
      week: "Las Vegas GP",
      description: "Night race through the Las Vegas Strip"
    }
  ]
};

// Detailed game/match schedules for each sport
const GAME_SCHEDULES = {
  NFL: [
    // Week 1 Games
    { name: "Lions @ Chiefs", date: "2025-09-04", time: "8:20 PM", location: "Arrowhead Stadium, Kansas City", type: "Regular Season", week: "Week 1" },
    { name: "Packers @ Eagles", date: "2025-09-05", time: "8:15 PM", location: "Lincoln Financial Field, Philadelphia", type: "Regular Season", week: "Week 1" },
    { name: "Steelers @ Falcons", date: "2025-09-07", time: "1:00 PM", location: "Mercedes-Benz Stadium, Atlanta", type: "Regular Season", week: "Week 1" },
    { name: "Titans @ Bears", date: "2025-09-07", time: "1:00 PM", location: "Soldier Field, Chicago", type: "Regular Season", week: "Week 1" },
    { name: "Texans @ Colts", date: "2025-09-07", time: "1:00 PM", location: "Lucas Oil Stadium, Indianapolis", type: "Regular Season", week: "Week 1" },
    { name: "Patriots @ Bengals", date: "2025-09-07", time: "1:00 PM", location: "Paycor Stadium, Cincinnati", type: "Regular Season", week: "Week 1" },
    { name: "Cardinals @ Bills", date: "2025-09-07", time: "1:00 PM", location: "Highmark Stadium, Buffalo", type: "Regular Season", week: "Week 1" },
    { name: "Vikings @ Giants", date: "2025-09-07", time: "1:00 PM", location: "MetLife Stadium, East Rutherford", type: "Regular Season", week: "Week 1" },
    { name: "Jaguars @ Dolphins", date: "2025-09-07", time: "1:00 PM", location: "Hard Rock Stadium, Miami", type: "Regular Season", week: "Week 1" },
    { name: "Panthers @ Saints", date: "2025-09-07", time: "1:00 PM", location: "Caesars Superdome, New Orleans", type: "Regular Season", week: "Week 1" },
    { name: "Browns @ Cowboys", date: "2025-09-07", time: "4:25 PM", location: "AT&T Stadium, Arlington", type: "Regular Season", week: "Week 1" },
    { name: "Seahawks @ Broncos", date: "2025-09-07", time: "4:25 PM", location: "Empower Field at Mile High, Denver", type: "Regular Season", week: "Week 1" },
    { name: "Raiders @ Chargers", date: "2025-09-07", time: "4:25 PM", location: "SoFi Stadium, Los Angeles", type: "Regular Season", week: "Week 1" },
    { name: "Buccaneers @ Commanders", date: "2025-09-07", time: "4:25 PM", location: "FedExField, Landover", type: "Regular Season", week: "Week 1" },
    { name: "Rams @ 49ers", date: "2025-09-07", time: "8:20 PM", location: "Levi's Stadium, Santa Clara", type: "Regular Season", week: "Week 1" },
    { name: "Jets @ Ravens", date: "2025-09-08", time: "8:15 PM", location: "M&T Bank Stadium, Baltimore", type: "Regular Season", week: "Week 1" },
    
    // Week 2 Games
    { name: "Cowboys @ Saints", date: "2025-09-14", time: "1:00 PM", location: "Caesars Superdome, New Orleans", type: "Regular Season", week: "Week 2" },
    { name: "Seahawks @ Patriots", date: "2025-09-14", time: "1:00 PM", location: "Gillette Stadium, Foxborough", type: "Regular Season", week: "Week 2" },
    { name: "Colts @ Packers", date: "2025-09-14", time: "1:00 PM", location: "Lambeau Field, Green Bay", type: "Regular Season", week: "Week 2" },
    { name: "49ers @ Vikings", date: "2025-09-14", time: "1:00 PM", location: "U.S. Bank Stadium, Minneapolis", type: "Regular Season", week: "Week 2" },
    { name: "Chargers @ Panthers", date: "2025-09-14", time: "1:00 PM", location: "Bank of America Stadium, Charlotte", type: "Regular Season", week: "Week 2" },
    { name: "Giants @ Commanders", date: "2025-09-14", time: "1:00 PM", location: "FedExField, Landover", type: "Regular Season", week: "Week 2" },
    { name: "Jets @ Titans", date: "2025-09-14", time: "1:00 PM", location: "Nissan Stadium, Nashville", type: "Regular Season", week: "Week 2" },
    { name: "Raiders @ Ravens", date: "2025-09-14", time: "1:00 PM", location: "M&T Bank Stadium, Baltimore", type: "Regular Season", week: "Week 2" },
    { name: "Bengals @ Chiefs", date: "2025-09-14", time: "4:25 PM", location: "Arrowhead Stadium, Kansas City", type: "Regular Season", week: "Week 2" },
    { name: "Rams @ Cardinals", date: "2025-09-14", time: "4:25 PM", location: "State Farm Stadium, Glendale", type: "Regular Season", week: "Week 2" },
    { name: "Browns @ Jaguars", date: "2025-09-14", time: "4:25 PM", location: "TIAA Bank Field, Jacksonville", type: "Regular Season", week: "Week 2" },
    { name: "Dolphins @ Bills", date: "2025-09-14", time: "8:20 PM", location: "Highmark Stadium, Buffalo", type: "Regular Season", week: "Week 2" },
    { name: "Bears @ Texans", date: "2025-09-14", time: "8:15 PM", location: "NRG Stadium, Houston", type: "Regular Season", week: "Week 2" },
    
    // Week 18 (Final Regular Season)
    { name: "Bills @ Dolphins", date: "2026-01-04", time: "1:00 PM", location: "Hard Rock Stadium, Miami", type: "Regular Season", week: "Week 18" },
    { name: "Ravens @ Steelers", date: "2026-01-04", time: "1:00 PM", location: "Heinz Field, Pittsburgh", type: "Regular Season", week: "Week 18" },
    { name: "Chiefs @ Broncos", date: "2026-01-04", time: "4:25 PM", location: "Empower Field at Mile High, Denver", type: "Regular Season", week: "Week 18" },
    { name: "49ers @ Cardinals", date: "2026-01-04", time: "4:25 PM", location: "State Farm Stadium, Glendale", type: "Regular Season", week: "Week 18" },
    
    // Wild Card Playoffs
    { name: "Wild Card: #7 vs #2 (AFC)", date: "2026-01-10", time: "1:00 PM", location: "TBD", type: "Playoffs", week: "Wild Card" },
    { name: "Wild Card: #6 vs #3 (AFC)", date: "2026-01-10", time: "4:30 PM", location: "TBD", type: "Playoffs", week: "Wild Card" },
    { name: "Wild Card: #7 vs #2 (NFC)", date: "2026-01-10", time: "8:15 PM", location: "TBD", type: "Playoffs", week: "Wild Card" },
    { name: "Wild Card: #5 vs #4 (AFC)", date: "2026-01-11", time: "1:00 PM", location: "TBD", type: "Playoffs", week: "Wild Card" },
    { name: "Wild Card: #6 vs #3 (NFC)", date: "2026-01-11", time: "4:30 PM", location: "TBD", type: "Playoffs", week: "Wild Card" },
    { name: "Wild Card: #5 vs #4 (NFC)", date: "2026-01-11", time: "8:15 PM", location: "TBD", type: "Playoffs", week: "Wild Card" },
    
    // Divisional Playoffs
    { name: "Divisional: AFC Game 1", date: "2026-01-17", time: "1:00 PM", location: "TBD", type: "Playoffs", week: "Divisional" },
    { name: "Divisional: NFC Game 1", date: "2026-01-17", time: "4:30 PM", location: "TBD", type: "Playoffs", week: "Divisional" },
    { name: "Divisional: AFC Game 2", date: "2026-01-18", time: "1:00 PM", location: "TBD", type: "Playoffs", week: "Divisional" },
    { name: "Divisional: NFC Game 2", date: "2026-01-18", time: "4:30 PM", location: "TBD", type: "Playoffs", week: "Divisional" },
    
    // Conference Championships
    { name: "AFC Championship", date: "2026-01-25", time: "3:00 PM", location: "TBD", type: "Playoffs", week: "Conference" },
    { name: "NFC Championship", date: "2026-01-25", time: "6:30 PM", location: "TBD", type: "Playoffs", week: "Conference" },
    
    // Super Bowl
    { name: "Super Bowl LX", date: "2026-02-08", time: "6:30 PM", location: "Levi's Stadium, Santa Clara", type: "Championship", week: "Super Bowl" }
  ],
  NBA: [
    // Opening Night
    { name: "Lakers vs Warriors", date: "2025-10-21", time: "10:00 PM", location: "Crypto.com Arena, Los Angeles", type: "Regular Season", week: "Opening Night" },
    { name: "Celtics vs Heat", date: "2025-10-21", time: "7:30 PM", location: "TD Garden, Boston", type: "Regular Season", week: "Opening Night" },
    
    // Key Matchups
    { name: "Lakers vs Celtics", date: "2025-12-25", time: "5:00 PM", location: "Crypto.com Arena, Los Angeles", type: "Regular Season", week: "Christmas Day" },
    { name: "Warriors vs Lakers", date: "2025-12-25", time: "8:00 PM", location: "Chase Center, San Francisco", type: "Regular Season", week: "Christmas Day" },
    { name: "Nuggets vs Lakers", date: "2025-11-15", time: "10:00 PM", location: "Ball Arena, Denver", type: "Regular Season", week: "Week 3" },
    { name: "Celtics vs Bucks", date: "2025-11-20", time: "7:30 PM", location: "TD Garden, Boston", type: "Regular Season", week: "Week 4" },
    
    // All-Star Weekend
    { name: "NBA All-Star Game", date: "2026-02-15", time: "8:00 PM", location: "Intuit Dome, Los Angeles", type: "All-Star", week: "All-Star Weekend" },
    { name: "3-Point Contest", date: "2026-02-14", time: "8:00 PM", location: "Intuit Dome, Los Angeles", type: "All-Star", week: "All-Star Weekend" },
    { name: "Slam Dunk Contest", date: "2026-02-14", time: "9:00 PM", location: "Intuit Dome, Los Angeles", type: "All-Star", week: "All-Star Weekend" },
    
    // Playoffs
    { name: "Play-In Tournament", date: "2026-04-14", time: "TBD", location: "Various", type: "Playoffs", week: "Play-In" },
    { name: "First Round", date: "2026-04-19", time: "TBD", location: "Various", type: "Playoffs", week: "First Round" },
    { name: "Conference Semifinals", date: "2026-05-05", time: "TBD", location: "Various", type: "Playoffs", week: "Semifinals" },
    { name: "Conference Finals", date: "2026-05-19", time: "TBD", location: "Various", type: "Playoffs", week: "Conference Finals" },
    { name: "NBA Finals", date: "2026-06-04", time: "TBD", location: "TBD", type: "Championship", week: "NBA Finals" }
  ],
  MLB: [
    // Opening Day
    { name: "Yankees vs Red Sox", date: "2025-03-27", time: "1:05 PM", location: "Yankee Stadium, New York", type: "Regular Season", week: "Opening Day" },
    { name: "Dodgers vs Padres", date: "2025-03-27", time: "4:10 PM", location: "Dodger Stadium, Los Angeles", type: "Regular Season", week: "Opening Day" },
    { name: "Braves vs Phillies", date: "2025-03-27", time: "7:20 PM", location: "Truist Park, Atlanta", type: "Regular Season", week: "Opening Day" },
    
    // Key Series
    { name: "Yankees vs Astros", date: "2025-04-15", time: "7:05 PM", location: "Yankee Stadium, New York", type: "Regular Season", week: "Week 3" },
    { name: "Dodgers vs Giants", date: "2025-04-20", time: "7:10 PM", location: "Dodger Stadium, Los Angeles", type: "Regular Season", week: "Week 3" },
    { name: "Red Sox vs Yankees", date: "2025-06-14", time: "7:05 PM", location: "Fenway Park, Boston", type: "Regular Season", week: "Week 12" },
    
    // All-Star Weekend
    { name: "MLB All-Star Game", date: "2025-07-15", time: "8:00 PM", location: "Coors Field, Denver", type: "All-Star", week: "All-Star Weekend" },
    { name: "Home Run Derby", date: "2025-07-14", time: "8:00 PM", location: "Coors Field, Denver", type: "All-Star", week: "All-Star Weekend" },
    
    // Wild Card Series (Best of 3) - 2025 Playoffs
    { name: "AL Wild Card: #6 Detroit Tigers @ #3 Cleveland Guardians - Game 1", date: "2025-09-30", time: "3:08 PM", location: "Progressive Field, Cleveland", type: "Playoffs", week: "Wild Card Series", homeTeam: "Cleveland Guardians", awayTeam: "Detroit Tigers", homeScore: null, awayScore: null },
    { name: "AL Wild Card: #6 Detroit Tigers @ #3 Cleveland Guardians - Game 2", date: "2025-10-01", time: "3:08 PM", location: "Progressive Field, Cleveland", type: "Playoffs", week: "Wild Card Series", homeTeam: "Cleveland Guardians", awayTeam: "Detroit Tigers", homeScore: null, awayScore: null },
    { name: "AL Wild Card: #5 Boston Red Sox @ #4 New York Yankees - Game 1", date: "2025-09-30", time: "8:08 PM", location: "Yankee Stadium, New York", type: "Playoffs", week: "Wild Card Series", homeTeam: "New York Yankees", awayTeam: "Boston Red Sox", homeScore: null, awayScore: null },
    { name: "AL Wild Card: #5 Boston Red Sox @ #4 New York Yankees - Game 2", date: "2025-10-01", time: "8:08 PM", location: "Yankee Stadium, New York", type: "Playoffs", week: "Wild Card Series", homeTeam: "New York Yankees", awayTeam: "Boston Red Sox", homeScore: null, awayScore: null },
    { name: "NL Wild Card: #6 Cincinnati Reds @ #3 Los Angeles Dodgers - Game 1", date: "2025-09-30", time: "5:08 PM", location: "Dodger Stadium, Los Angeles", type: "Playoffs", week: "Wild Card Series", homeTeam: "Los Angeles Dodgers", awayTeam: "Cincinnati Reds", homeScore: null, awayScore: null },
    { name: "NL Wild Card: #6 Cincinnati Reds @ #3 Los Angeles Dodgers - Game 2", date: "2025-10-01", time: "5:08 PM", location: "Dodger Stadium, Los Angeles", type: "Playoffs", week: "Wild Card Series", homeTeam: "Los Angeles Dodgers", awayTeam: "Cincinnati Reds", homeScore: null, awayScore: null },
    { name: "NL Wild Card: #5 San Diego Padres @ #4 Chicago Cubs - Game 1", date: "2025-09-30", time: "5:08 PM", location: "Wrigley Field, Chicago", type: "Playoffs", week: "Wild Card Series", homeTeam: "Chicago Cubs", awayTeam: "San Diego Padres", homeScore: null, awayScore: null },
    { name: "NL Wild Card: #5 San Diego Padres @ #4 Chicago Cubs - Game 2", date: "2025-10-01", time: "5:08 PM", location: "Wrigley Field, Chicago", type: "Playoffs", week: "Wild Card Series", homeTeam: "Chicago Cubs", awayTeam: "San Diego Padres", homeScore: null, awayScore: null },
    
    // Division Series (Best of 5) - 2025 Playoffs
    { name: "ALDS: Toronto Blue Jays vs Wild Card Winner (Yankees/Red Sox) - Game 1", date: "2025-10-04", time: "1:08 PM", location: "Rogers Centre, Toronto", type: "Playoffs", week: "Division Series", homeTeam: "Toronto Blue Jays", awayTeam: "Wild Card Winner", homeScore: null, awayScore: null },
    { name: "ALDS: Toronto Blue Jays vs Wild Card Winner (Yankees/Red Sox) - Game 2", date: "2025-10-05", time: "1:08 PM", location: "Rogers Centre, Toronto", type: "Playoffs", week: "Division Series", homeTeam: "Toronto Blue Jays", awayTeam: "Wild Card Winner", homeScore: null, awayScore: null },
    { name: "ALDS: Seattle Mariners vs Wild Card Winner (Guardians/Tigers) - Game 1", date: "2025-10-04", time: "8:38 PM", location: "T-Mobile Park, Seattle", type: "Playoffs", week: "Division Series", homeTeam: "Seattle Mariners", awayTeam: "Wild Card Winner", homeScore: null, awayScore: null },
    { name: "ALDS: Seattle Mariners vs Wild Card Winner (Guardians/Tigers) - Game 2", date: "2025-10-05", time: "5:03 PM", location: "T-Mobile Park, Seattle", type: "Playoffs", week: "Division Series", homeTeam: "Seattle Mariners", awayTeam: "Wild Card Winner", homeScore: null, awayScore: null },
    { name: "NLDS: Milwaukee Brewers vs Wild Card Winner (Cubs/Padres) - Game 1", date: "2025-10-04", time: "9:08 PM", location: "American Family Field, Milwaukee", type: "Playoffs", week: "Division Series", homeTeam: "Milwaukee Brewers", awayTeam: "Wild Card Winner", homeScore: null, awayScore: null },
    { name: "NLDS: Milwaukee Brewers vs Wild Card Winner (Cubs/Padres) - Game 2", date: "2025-10-06", time: "9:08 PM", location: "American Family Field, Milwaukee", type: "Playoffs", week: "Division Series", homeTeam: "Milwaukee Brewers", awayTeam: "Wild Card Winner", homeScore: null, awayScore: null },
    { name: "NLDS: Philadelphia Phillies vs Los Angeles Dodgers - Game 1", date: "2025-10-04", time: "6:38 PM", location: "Citizens Bank Park, Philadelphia", type: "Playoffs", week: "Division Series", homeTeam: "Philadelphia Phillies", awayTeam: "Los Angeles Dodgers", homeScore: null, awayScore: null },
    { name: "NLDS: Philadelphia Phillies vs Los Angeles Dodgers - Game 2", date: "2025-10-06", time: "6:38 PM", location: "Citizens Bank Park, Philadelphia", type: "Playoffs", week: "Division Series", homeTeam: "Philadelphia Phillies", awayTeam: "Los Angeles Dodgers", homeScore: null, awayScore: null },
    
    // Championship Series (Best of 7)
    { name: "NLCS: Game 1", date: "2025-10-15", time: "8:07 PM", location: "TBD", type: "Playoffs", week: "Championship Series" },
    { name: "NLCS: Game 2", date: "2025-10-16", time: "8:07 PM", location: "TBD", type: "Playoffs", week: "Championship Series" },
    { name: "NLCS: Game 3", date: "2025-10-18", time: "5:07 PM", location: "TBD", type: "Playoffs", week: "Championship Series" },
    { name: "NLCS: Game 4", date: "2025-10-19", time: "8:07 PM", location: "TBD", type: "Playoffs", week: "Championship Series" },
    { name: "NLCS: Game 5 (if necessary)", date: "2025-10-20", time: "8:07 PM", location: "TBD", type: "Playoffs", week: "Championship Series" },
    { name: "ALCS: Game 1", date: "2025-10-15", time: "4:07 PM", location: "TBD", type: "Playoffs", week: "Championship Series" },
    { name: "ALCS: Game 2", date: "2025-10-16", time: "4:07 PM", location: "TBD", type: "Playoffs", week: "Championship Series" },
    { name: "ALCS: Game 3", date: "2025-10-18", time: "1:07 PM", location: "TBD", type: "Playoffs", week: "Championship Series" },
    { name: "ALCS: Game 4", date: "2025-10-19", time: "4:07 PM", location: "TBD", type: "Playoffs", week: "Championship Series" },
    { name: "ALCS: Game 5 (if necessary)", date: "2025-10-20", time: "4:07 PM", location: "TBD", type: "Playoffs", week: "Championship Series" },
    
    // World Series (Best of 7)
    { name: "World Series: Game 1", date: "2025-10-25", time: "8:03 PM", location: "TBD", type: "Championship", week: "World Series" },
    { name: "World Series: Game 2", date: "2025-10-26", time: "8:03 PM", location: "TBD", type: "Championship", week: "World Series" },
    { name: "World Series: Game 3", date: "2025-10-28", time: "8:03 PM", location: "TBD", type: "Championship", week: "World Series" },
    { name: "World Series: Game 4", date: "2025-10-29", time: "8:03 PM", location: "TBD", type: "Championship", week: "World Series" },
    { name: "World Series: Game 5 (if necessary)", date: "2025-10-30", time: "8:03 PM", location: "TBD", type: "Championship", week: "World Series" },
    { name: "World Series: Game 6 (if necessary)", date: "2025-11-01", time: "8:03 PM", location: "TBD", type: "Championship", week: "World Series" },
    { name: "World Series: Game 7 (if necessary)", date: "2025-11-02", time: "8:03 PM", location: "TBD", type: "Championship", week: "World Series" }
  ],
  "College Sports": [
    // College Football
    { name: "Alabama vs Georgia", date: "2024-09-07", time: "7:30 PM", location: "Bryant-Denny Stadium, Tuscaloosa", type: "Regular Season", week: "Week 1" },
    { name: "Ohio State vs Michigan", date: "2024-11-30", time: "12:00 PM", location: "Ohio Stadium, Columbus", type: "Regular Season", week: "Rivalry Week" },
    { name: "USC vs Notre Dame", date: "2024-10-12", time: "7:30 PM", location: "Los Angeles Memorial Coliseum", type: "Regular Season", week: "Week 7" },
    { name: "Auburn vs Alabama", date: "2024-11-30", time: "3:30 PM", location: "Jordan-Hare Stadium, Auburn", type: "Regular Season", week: "Iron Bowl" },
    
    // March Madness
    { name: "First Round", date: "2024-03-21", time: "TBD", location: "Various", type: "Tournament", week: "First Round" },
    { name: "Sweet 16", date: "2024-03-28", time: "TBD", location: "Various", type: "Tournament", week: "Sweet 16" },
    { name: "Elite 8", date: "2024-03-30", time: "TBD", location: "Various", type: "Tournament", week: "Elite 8" },
    { name: "Final Four", date: "2024-04-06", time: "TBD", location: "State Farm Stadium, Glendale", type: "Tournament", week: "Final Four" },
    { name: "National Championship", date: "2024-04-08", time: "9:00 PM", location: "State Farm Stadium, Glendale", type: "Championship", week: "National Championship" },
    
    // College Basketball
    { name: "Duke vs North Carolina", date: "2024-12-07", time: "7:00 PM", location: "Cameron Indoor Stadium, Durham", type: "Regular Season", week: "Week 3" },
    { name: "Kentucky vs Louisville", date: "2024-12-21", time: "2:00 PM", location: "Rupp Arena, Lexington", type: "Regular Season", week: "Week 6" },
    { name: "UCLA vs USC", date: "2024-12-14", time: "8:00 PM", location: "Pauley Pavilion, Los Angeles", type: "Regular Season", week: "Week 5" }
  ],
  Olympics: [
    { name: "Summer Olympics", date: "2024-07-26", location: "Paris, France", type: "Olympics" },
    { name: "Winter Olympics", date: "2026-02-06", location: "Milan-Cortina, Italy", type: "Olympics" },
    { name: "Paralympic Games", date: "2024-08-28", location: "Paris, France", type: "Paralympics" }
  ],
  Soccer: [
    // Premier League
    { name: "Manchester City vs Arsenal", date: "2024-08-17", time: "12:30 PM", location: "Etihad Stadium, Manchester", type: "Regular Season", week: "Matchday 1" },
    { name: "Liverpool vs Chelsea", date: "2024-08-18", time: "4:30 PM", location: "Anfield, Liverpool", type: "Regular Season", week: "Matchday 1" },
    { name: "Manchester United vs Tottenham", date: "2024-08-24", time: "3:00 PM", location: "Old Trafford, Manchester", type: "Regular Season", week: "Matchday 2" },
    
    // La Liga
    { name: "Real Madrid vs Barcelona", date: "2024-10-27", time: "4:00 PM", location: "Santiago Bernabéu, Madrid", type: "Regular Season", week: "El Clásico" },
    { name: "Barcelona vs Atletico Madrid", date: "2024-09-15", time: "3:00 PM", location: "Camp Nou, Barcelona", type: "Regular Season", week: "Matchday 4" },
    
    // Champions League
    { name: "Real Madrid vs PSG", date: "2024-09-17", time: "9:00 PM", location: "Santiago Bernabéu, Madrid", type: "Regular Season", week: "Group Stage" },
    { name: "Manchester City vs Bayern Munich", date: "2024-09-18", time: "9:00 PM", location: "Etihad Stadium, Manchester", type: "Regular Season", week: "Group Stage" },
    { name: "Champions League Final", date: "2025-05-31", time: "9:00 PM", location: "Wembley Stadium, London", type: "Championship", week: "Final" },
    
    // World Cup
    { name: "USA vs Mexico", date: "2026-06-11", time: "8:00 PM", location: "MetLife Stadium, New York", type: "World Cup", week: "Group Stage" },
    { name: "Brazil vs Argentina", date: "2026-06-15", time: "3:00 PM", location: "Rose Bowl, Pasadena", type: "World Cup", week: "Group Stage" }
  ],
  NHL: [
    // Opening Night
    { name: "Maple Leafs vs Canadiens", date: "2024-10-10", time: "7:00 PM", location: "Scotiabank Arena, Toronto", type: "Regular Season", week: "Opening Night" },
    { name: "Rangers vs Islanders", date: "2024-10-10", time: "7:30 PM", location: "Madison Square Garden, New York", type: "Regular Season", week: "Opening Night" },
    
    // Key Matchups
    { name: "Bruins vs Maple Leafs", date: "2024-11-15", time: "7:00 PM", location: "TD Garden, Boston", type: "Regular Season", week: "Week 6" },
    { name: "Oilers vs Flames", date: "2024-10-26", time: "10:00 PM", location: "Rogers Place, Edmonton", type: "Regular Season", week: "Battle of Alberta" },
    { name: "Penguins vs Capitals", date: "2024-12-07", time: "7:00 PM", location: "PPG Paints Arena, Pittsburgh", type: "Regular Season", week: "Week 10" },
    
    // All-Star Weekend
    { name: "NHL All-Star Game", date: "2025-02-01", time: "3:00 PM", location: "SAP Center, San Jose", type: "All-Star", week: "All-Star Weekend" },
    { name: "Skills Competition", date: "2025-01-31", time: "7:00 PM", location: "SAP Center, San Jose", type: "All-Star", week: "All-Star Weekend" },
    
    // Playoffs
    { name: "First Round", date: "2025-04-15", time: "TBD", location: "Various", type: "Playoffs", week: "First Round" },
    { name: "Second Round", date: "2025-05-01", time: "TBD", location: "Various", type: "Playoffs", week: "Second Round" },
    { name: "Conference Finals", date: "2025-05-15", time: "TBD", location: "Various", type: "Playoffs", week: "Conference Finals" },
    { name: "Stanley Cup Final", date: "2025-06-02", time: "8:00 PM", location: "TBD", type: "Championship", week: "Stanley Cup Final" }
  ],
  Tennis: [
    // Grand Slams
    { name: "Australian Open Final", date: "2024-01-28", time: "3:30 AM", location: "Rod Laver Arena, Melbourne", type: "Grand Slam", week: "Final" },
    { name: "French Open Final", date: "2024-06-09", time: "3:00 PM", location: "Court Philippe-Chatrier, Paris", type: "Grand Slam", week: "Final" },
    { name: "Wimbledon Final", date: "2024-07-14", time: "9:00 AM", location: "Centre Court, London", type: "Grand Slam", week: "Final" },
    { name: "US Open Final", date: "2024-09-08", time: "4:00 PM", location: "Arthur Ashe Stadium, New York", type: "Grand Slam", week: "Final" },
    
    // ATP Masters
    { name: "Indian Wells Final", date: "2024-03-17", time: "4:00 PM", location: "Indian Wells Tennis Garden, California", type: "Masters 1000", week: "Final" },
    { name: "Miami Open Final", date: "2024-03-31", time: "4:00 PM", location: "Hard Rock Stadium, Miami", type: "Masters 1000", week: "Final" },
    { name: "Monte Carlo Masters", date: "2024-04-14", time: "2:00 PM", location: "Monte Carlo Country Club, Monaco", type: "Masters 1000", week: "Final" }
  ],
  Golf: [
    // Major Championships
    { name: "Masters Tournament", date: "2024-04-14", time: "2:00 PM", location: "Augusta National Golf Club, Georgia", type: "Major", week: "Final Round" },
    { name: "PGA Championship", date: "2024-05-19", time: "2:00 PM", location: "Valhalla Golf Club, Kentucky", type: "Major", week: "Final Round" },
    { name: "US Open", date: "2024-06-16", time: "3:00 PM", location: "Pinehurst Resort, North Carolina", type: "Major", week: "Final Round" },
    { name: "British Open", date: "2024-07-21", time: "9:00 AM", location: "Royal Troon Golf Club, Scotland", type: "Major", week: "Final Round" },
    
    // PGA Tour Events
    { name: "Players Championship", date: "2024-03-17", time: "2:00 PM", location: "TPC Sawgrass, Florida", type: "PGA Tour", week: "Final Round" },
    { name: "Memorial Tournament", date: "2024-06-09", time: "2:00 PM", location: "Muirfield Village, Ohio", type: "PGA Tour", week: "Final Round" },
    { name: "FedEx Cup Playoffs", date: "2024-08-25", time: "2:00 PM", location: "East Lake Golf Club, Georgia", type: "PGA Tour", week: "Tour Championship" }
  ]
};

function Schedules() {
  const [selectedSport, setSelectedSport] = useState("All");
  const [selectedDate, setSelectedDate] = useState('2025-01-01');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [realSchedules, setRealSchedules] = useState({});
  const [showPredictions, setShowPredictions] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(50); // Show 50 events per page
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [filterMode, setFilterMode] = useState('from-date'); // 'from-date', 'month', 'date-range'
  
  // Live API state management
  const [isLoadingLiveData, setIsLoadingLiveData] = useState(false);
  const [liveDataEnabled, setLiveDataEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [liveTeamStats, setLiveTeamStats] = useState({});
  const [dataSource, setDataSource] = useState('static'); // 'static' or 'live'
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [liveGamesCount, setLiveGamesCount] = useState(0);
  const [hasLiveGames, setHasLiveGames] = useState(false);
  const [todaysGames, setTodaysGames] = useState([]);
  
  // Past Games state management
  const [showPastGames, setShowPastGames] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedTeamSport, setSelectedTeamSport] = useState('NFL');
  const [pastGames, setPastGames] = useState([]);
  const [isLoadingPastGames, setIsLoadingPastGames] = useState(false);
  const [pastGamesLastUpdated, setPastGamesLastUpdated] = useState(null);

  useEffect(() => {
    // Initialize data loading
    loadScheduleData();
    
    // Set up auto-refresh for live data (weekly refresh)
    if (liveDataEnabled) {
      const interval = setInterval(() => {
        refreshLiveData();
      }, 7 * 24 * 60 * 60 * 1000); // Weekly refresh (7 days)
      
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [liveDataEnabled, hasLiveGames]);

  // Load schedule data (live or static)
  const loadScheduleData = async () => {
    setIsLoadingLiveData(true);
    
    try {
      let schedules = {};
      let teamStats = {};
      
      if (liveDataEnabled) {
        console.log('Attempting to fetch live data...');
        
        // Try to load live data with better error handling
        const [nflLive, nbaLive, mlbLive] = await Promise.allSettled([
          sportsAPI.fetchNFLData(),
          sportsAPI.fetchNBAData(), 
          sportsAPI.fetchMLBData()
        ]);
        
        // Load live team statistics
        const [nflStats, nbaStats, mlbStats] = await Promise.allSettled([
          sportsAPI.fetchTeamStats('NFL'),
          sportsAPI.fetchTeamStats('NBA'),
          sportsAPI.fetchTeamStats('MLB')
        ]);
        
        // Process successful results
        const nflData = nflLive.status === 'fulfilled' ? nflLive.value : [];
        const nbaData = nbaLive.status === 'fulfilled' ? nbaLive.value : [];
        const mlbData = mlbLive.status === 'fulfilled' ? mlbLive.value : [];
        
        const nflStatsData = nflStats.status === 'fulfilled' ? nflStats.value : {};
        const nbaStatsData = nbaStats.status === 'fulfilled' ? nbaStats.value : {};
        const mlbStatsData = mlbStats.status === 'fulfilled' ? mlbStats.value : {};
        
        teamStats = { ...nflStatsData, ...nbaStatsData, ...mlbStatsData };
        
        schedules = {
          NFL: processScheduleData(nflData, 'NFL', teamStats),
          NBA: processScheduleData(nbaData, 'NBA', teamStats),
          MLB: processScheduleData(mlbData, 'MLB', teamStats)
        };
        
        // Check if we got any live data
        const hasLiveData = nflData.length > 0 || nbaData.length > 0 || mlbData.length > 0;
        setDataSource(hasLiveData ? 'live' : 'static');
        setLastUpdated(new Date());
        
        console.log('Live data loaded:', {
          nfl: nflData.length,
          nba: nbaData.length,
          mlb: mlbData.length,
          hasLiveData
        });
        
      } else {
        // Fallback to static data
        schedules = {
          NFL: processScheduleData(nflData, 'NFL'),
          NBA: processScheduleData(nbaData, 'NBA'),
          MLB: processScheduleData(mlbData, 'MLB')
        };
        setDataSource('static');
      }
      
      setRealSchedules(schedules);
      setLiveTeamStats(teamStats);
      
      // Count live games
      const liveGames = Object.values(schedules).flat().filter(game => game.isLive);
      setLiveGamesCount(liveGames.length);
      setHasLiveGames(liveGames.length > 0);
      
      // Extract today's games
      const today = new Date().toISOString().split('T')[0];
      const todaysGamesList = Object.values(schedules).flat().filter(game => {
        const gameDate = game.date;
        return gameDate === today;
      });
      setTodaysGames(todaysGamesList);
      
      console.log('Live games found:', liveGames.length);
      console.log('Today\'s games:', todaysGamesList.length);
      
    } catch (error) {
      console.error('Error loading schedule data:', error);
      // Fallback to static data on error
      const fallbackSchedules = {
        NFL: processScheduleData(nflData, 'NFL'),
        NBA: processScheduleData(nbaData, 'NBA'),
        MLB: processScheduleData(mlbData, 'MLB')
      };
      setRealSchedules(fallbackSchedules);
      setDataSource('static');
      setLiveGamesCount(0);
      setHasLiveGames(false);
    } finally {
      setIsLoadingLiveData(false);
    }
  };

  // Refresh live data
  const refreshLiveData = async () => {
    if (!liveDataEnabled) return;
    
    try {
      // Get live scores for active games
      const [nflLive, nbaLive, mlbLive] = await Promise.all([
        sportsAPI.getLiveScores('NFL'),
        sportsAPI.getLiveScores('NBA'),
        sportsAPI.getLiveScores('MLB')
      ]);
      
      // Update only if there are live games
      if (nflLive.length > 0 || nbaLive.length > 0 || mlbLive.length > 0) {
        await loadScheduleData();
      }
    } catch (error) {
      console.error('Error refreshing live data:', error);
    }
  };

  // Load past games for selected team
  const loadPastGames = async (sport, teamName) => {
    if (!teamName) return;
    
    setIsLoadingPastGames(true);
    try {
      console.log(`Loading past games for ${teamName} (${sport})`);
      const games = await sportsAPI.fetchTeamPastGames(sport, teamName);
      setPastGames(games);
      setPastGamesLastUpdated(new Date());
      console.log(`Loaded ${games.length} past games for ${teamName}`);
    } catch (error) {
      console.error('Error loading past games:', error);
      setPastGames([]);
    } finally {
      setIsLoadingPastGames(false);
    }
  };

  // Get available teams for selected sport
  const getAvailableTeams = (sport) => {
    const teams = {
      NFL: [
        "Kansas City Chiefs", "Buffalo Bills", "Philadelphia Eagles", "Dallas Cowboys",
        "Baltimore Ravens", "Cincinnati Bengals", "San Francisco 49ers", "Detroit Lions",
        "Miami Dolphins", "New England Patriots", "Green Bay Packers", "Minnesota Vikings",
        "Chicago Bears", "Tampa Bay Buccaneers", "Atlanta Falcons", "Carolina Panthers",
        "New Orleans Saints", "Seattle Seahawks", "Los Angeles Rams", "Arizona Cardinals",
        "Las Vegas Raiders", "Los Angeles Chargers", "Denver Broncos", "Pittsburgh Steelers",
        "Cleveland Browns", "Indianapolis Colts", "Tennessee Titans", "Jacksonville Jaguars",
        "Houston Texans", "New York Giants", "Washington Commanders", "New York Jets"
      ],
      NBA: [
        "Boston Celtics", "Los Angeles Lakers", "Golden State Warriors", "Miami Heat",
        "Denver Nuggets", "Milwaukee Bucks", "Phoenix Suns", "Dallas Mavericks",
        "Philadelphia 76ers", "Brooklyn Nets", "New York Knicks", "Chicago Bulls",
        "Cleveland Cavaliers", "Detroit Pistons", "Indiana Pacers", "Atlanta Hawks",
        "Charlotte Hornets", "Orlando Magic", "Washington Wizards", "Toronto Raptors",
        "Portland Trail Blazers", "Utah Jazz", "Oklahoma City Thunder", "Minnesota Timberwolves",
        "Sacramento Kings", "Los Angeles Clippers", "San Antonio Spurs", "Houston Rockets",
        "Memphis Grizzlies", "New Orleans Pelicans"
      ],
      MLB: [
        "New York Yankees", "Boston Red Sox", "Los Angeles Dodgers", "San Francisco Giants",
        "Atlanta Braves", "Houston Astros", "Philadelphia Phillies", "Chicago Cubs",
        "Milwaukee Brewers", "Toronto Blue Jays", "Baltimore Orioles", "Cleveland Guardians",
        "Texas Rangers", "Arizona Diamondbacks", "Miami Marlins", "San Diego Padres",
        "Minnesota Twins", "Seattle Mariners", "Tampa Bay Rays", "New York Mets",
        "St. Louis Cardinals", "Cincinnati Reds", "Pittsburgh Pirates", "Washington Nationals",
        "Colorado Rockies", "Oakland Athletics", "Los Angeles Angels", "Kansas City Royals",
        "Chicago White Sox", "Detroit Tigers"
      ]
    };
    
    return teams[sport] || [];
  };

  useEffect(() => {
    filterEvents();
  }, [selectedSport, selectedDate, selectedMonth, dateRangeStart, dateRangeEnd, filterMode, realSchedules, showPredictions]);

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [selectedSport, selectedDate, selectedMonth, dateRangeStart, dateRangeEnd, filterMode]);

  const filterEvents = () => {
    let events = [];
    
    if (selectedSport === "All") {
      // Include real schedules (live data)
      Object.entries(realSchedules).forEach(([sport, sportEvents]) => {
        events = [...events, ...sportEvents];
      });
      // Include major sporting events
      Object.values(MAJOR_SPORTING_EVENTS).forEach(sportEvents => {
        events = [...events, ...sportEvents];
      });
      // Include legacy schedules with win probabilities
      Object.entries(GAME_SCHEDULES).forEach(([sport, sportEvents]) => {
        const processedEvents = sportEvents.map(event => {
          if (event.homeTeam && event.awayTeam) {
            const { homeWinProb, awayWinProb } = calculateWinProbability(event.homeTeam, event.awayTeam, liveTeamStats);
            return { ...event, homeWinProb, awayWinProb, sport };
          }
          return { ...event, sport };
        });
        events = [...events, ...processedEvents];
      });
    } else {
      // Filter by specific sport
      if (realSchedules[selectedSport]) {
        events = realSchedules[selectedSport];
      }
      
      if (MAJOR_SPORTING_EVENTS[selectedSport]) {
        events = [...events, ...MAJOR_SPORTING_EVENTS[selectedSport]];
      }
      
      if (GAME_SCHEDULES[selectedSport]) {
        const sportEvents = GAME_SCHEDULES[selectedSport].map(event => {
          if (event.homeTeam && event.awayTeam) {
            const { homeWinProb, awayWinProb } = calculateWinProbability(event.homeTeam, event.awayTeam, liveTeamStats);
            return { ...event, homeWinProb, awayWinProb, sport: selectedSport };
          }
          return { ...event, sport: selectedSport };
        });
        events = [...events, ...sportEvents];
      }
    }

    // Apply date filtering based on selected mode
    if (filterMode === 'from-date' && selectedDate) {
      events = events.filter(event => {
        const eventDate = new Date(event.date);
        const selectedDateObj = new Date(selectedDate);
        // Normalize dates to compare only the date part (ignore time)
        eventDate.setHours(0, 0, 0, 0);
        selectedDateObj.setHours(0, 0, 0, 0);
        return eventDate >= selectedDateObj;
      });
    } else if (filterMode === 'month' && selectedMonth !== 'all') {
      events = events.filter(event => {
        const eventDate = new Date(event.date);
        const eventMonth = eventDate.getMonth() + 1; // getMonth() returns 0-11
        const eventYear = eventDate.getFullYear();
        const [year, month] = selectedMonth.split('-').map(Number);
        return eventMonth === month && eventYear === year;
      });
    } else if (filterMode === 'date-range' && dateRangeStart && dateRangeEnd) {
      events = events.filter(event => {
        const eventDate = new Date(event.date);
        const startDate = new Date(dateRangeStart);
        const endDate = new Date(dateRangeEnd);
        // Normalize dates to compare only the date part (ignore time)
        eventDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        return eventDate >= startDate && eventDate <= endDate;
      });
    }

    // Sort events with smart prioritization: Live > Future > Recent
    events.sort((a, b) => {
      const now = new Date();
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      // Live games first (highest priority)
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      
      // If both are live, sort by date (most recent first)
      if (a.isLive && b.isLive) {
        return dateB - dateA;
      }
      
      // Future games second (scheduled games)
      const aIsFuture = dateA > now;
      const bIsFuture = dateB > now;
      
      if (aIsFuture && !bIsFuture) return -1;
      if (!aIsFuture && bIsFuture) return 1;
      
      // If both are future games, sort by date (soonest first)
      if (aIsFuture && bIsFuture) {
        return dateA - dateB;
      }
      
      // Recent games third (within last month)
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const aIsRecent = dateA >= oneMonthAgo && dateA <= now;
      const bIsRecent = dateB >= oneMonthAgo && dateB <= now;
      
      if (aIsRecent && !bIsRecent) return -1;
      if (!aIsRecent && bIsRecent) return 1;
      
      // If both are recent, sort by date (most recent first)
      if (aIsRecent && bIsRecent) {
        return dateB - dateA;
      }
      
      // Default: sort by date
      return dateA - dateB;
    });

    setFilteredEvents(events);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEventTypeColor = (type) => {
    const colors = {
      'Championship': '#e63946',
      'Playoffs': '#f77f00',
      'Regular Season': '#3b82f6',
      'All-Star': '#8338ec',
      'Draft': '#06d6a0',
      'Tournament': '#f72585',
      'Olympics': '#ffbe0b',
      'World Cup': '#fb5607',
      'Grand Slam': '#8338ec',
      'Major': '#06d6a0',
      'Awards': '#8ecae6',
      'Paralympics': '#219ebc',
      'Scheduled': '#3b82f6',
      'Live': '#22c55e',
      'Final': '#6b7280'
    };
    return colors[type] || '#6c757d';
  };

  const getSportIcon = (sport) => {
    const icons = {
      'NFL': '🏈',
      'NBA': '🏀',
      'MLB': '⚾',
      'NHL': '🏒',
      'College Sports': '🎓',
      'Olympics': '🥇',
      'Soccer': '⚽',
      'Tennis': '🎾',
      'Golf': '⛳'
    };
    return icons[sport] || '🏆';
  };

  // Component to display live game details
  const LiveGameDetails = ({ event }) => {
    if (!event.isLive || event.type !== "Live") return null;

    const renderMLBDetails = () => {
      if (event.sport !== 'MLB') return null;
      
      return (
        <div className="live-game-details mlb-details">
          <div className="game-period">
            <span className="period-icon">⚾</span>
            <span className="period-text">
              {event.inningHalf === 'top' ? 'Top' : 'Bottom'} of the {event.currentInning || 'TBD'}
            </span>
            {event.outs !== null && (
              <span className="outs-indicator">{event.outs} Outs</span>
            )}
          </div>
          
          {/* Base Runners */}
          {event.baseRunners && (
            <div className="base-runners">
              <span className="runners-label">Runners:</span>
              <div className="base-diamond">
                <div className={`base third ${event.baseRunners.third ? 'occupied' : ''}`}>3</div>
                <div className={`base second ${event.baseRunners.second ? 'occupied' : ''}`}>2</div>
                <div className={`base first ${event.baseRunners.first ? 'occupied' : ''}`}>1</div>
                <div className="home-plate">H</div>
              </div>
            </div>
          )}
          
          {/* Pitcher and Batter */}
          {(event.pitcher || event.batter) && (
            <div className="game-situation">
              {event.pitcher && (
                <div className="pitcher-info">
                  <span className="label">P:</span>
                  <span className="player-name">{event.pitcher}</span>
                </div>
              )}
              {event.batter && (
                <div className="batter-info">
                  <span className="label">B:</span>
                  <span className="player-name">{event.batter}</span>
                </div>
              )}
            </div>
          )}
          
          {event.timeRemaining && (
            <div className="game-clock">
              <span className="clock-icon">⏱️</span>
              <span className="clock-text">{event.timeRemaining}</span>
            </div>
          )}
        </div>
      );
    };

    const renderNFLDetails = () => {
      if (event.sport !== 'NFL') return null;
      
      return (
        <div className="live-game-details nfl-details">
          <div className="game-period">
            <span className="period-icon">🏈</span>
            <span className="period-text">Quarter {event.currentQuarter || 'TBD'}</span>
            {event.quarterTime && (
              <span className="quarter-time">{event.quarterTime}</span>
            )}
          </div>
          
          {/* Down and Distance */}
          {(event.down && event.distance) && (
            <div className="down-distance">
              <span className="down-distance-text">
                {event.down} & {event.distance}
              </span>
              {event.fieldPosition && (
                <span className="field-position">{event.fieldPosition}</span>
              )}
              {event.yardLine && (
                <span className="yard-line">{event.yardLine} yard line</span>
              )}
              {event.isRedZone && (
                <span className="red-zone-indicator">🔴 Red Zone</span>
              )}
            </div>
          )}
          
          {/* Possession */}
          {event.possession && (
            <div className="possession-info">
              <span className="possession-label">Possession:</span>
              <span className="possession-team">{event.possession}</span>
            </div>
          )}
          
          {/* Timeout */}
          {event.timeout && (
            <div className="timeout-info">
              <span className="timeout-label">Timeout</span>
            </div>
          )}
        </div>
      );
    };

    const renderNBADetails = () => {
      if (event.sport !== 'NBA') return null;
      
      return (
        <div className="live-game-details nba-details">
          <div className="game-period">
            <span className="period-icon">🏀</span>
            <span className="period-text">
              {event.isOvertime ? `Overtime ${event.currentQuarter - 4}` : `Quarter ${event.currentQuarter || 'TBD'}`}
            </span>
            {event.quarterTime && (
              <span className="quarter-time">{event.quarterTime}</span>
            )}
          </div>
          
          {/* Shot Clock and Possession */}
          <div className="game-situation">
            {event.shotClock && (
              <div className="shot-clock">
                <span className="shot-clock-text">Shot Clock: {event.shotClock}</span>
              </div>
            )}
            {event.possession && (
              <div className="possession-info">
                <span className="possession-label">Ball:</span>
                <span className="possession-team">{event.possession}</span>
              </div>
            )}
          </div>
          
          {/* Lead Information */}
          {event.lead && (
            <div className="lead-info">
              <span className="lead-text">{event.lead}</span>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="live-game-status">
        {renderMLBDetails()}
        {renderNFLDetails()}
        {renderNBADetails()}
      </div>
    );
  };
  const renderLeagueSection = (league) => (
  <div className="league-section mb-5">
    <h2 style={{ color: "#3b82f6", fontWeight: "bold" }}>
      {getSportIcon(league)} {league} Schedule
    </h2>
    <div className="events-grid">
      {GAME_SCHEDULES[league]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((event, idx) => (
          <div key={idx} className="event-card">
            <div className="event-header">
              <div className="event-type" style={{ backgroundColor: getEventTypeColor(event.type) }}>
                {event.type}
              </div>
              <div className="event-date">
                {formatDate(event.date)}
              </div>
            </div>
            <div className="event-content">
              <h3 className="event-name">{event.name}</h3>
              <div className="event-location">
                <span className="location-icon">📍</span>
                {event.location}
              </div>
              {event.time && (
                <div className="event-time">
                  <span className="time-icon">🕐</span>
                  {event.time}
                </div>
              )}
              {event.week && (
                <div className="event-week">
                  <span className="week-icon">📅</span>
                  {event.week}
                </div>
              )}
            </div>
            <div className="event-footer">
              <div className="countdown">
                {(() => {
                  const eventDate = new Date(event.date);
                  const today = new Date();
                  const diffTime = eventDate - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays < 0) {
                    return <span className="past-event">Past Event</span>;
                  } else if (diffDays === 0) {
                    return <span className="today-event">Today!</span>;
                  } else if (diffDays === 1) {
                    return <span className="tomorrow-event">Tomorrow</span>;
                  } else {
                    return <span className="upcoming-event">{diffDays} days away</span>;
                  }
                })()}
              </div>
            </div>
          </div>
      ))}
    </div>
  </div>
);

  return (
    <>
      <NavBar />
      <ScheduleBar />
      
      <div className="container mt-4">
        <div className="schedules-header">
          <h1 className="text-center mb-4" style={{ color: "#e63946", fontFamily: "Arial Black, sans-serif" }}>
            Detailed Game & Match Schedules
          </h1>
          
          {/* Today's Games Section */}
          {todaysGames.length > 0 && (
            <div className="todays-games-section mb-4">
              <h2 className="text-center mb-3" style={{ color: "#22c55e", fontWeight: "bold" }}>
                🔴 Today's Games ({todaysGames.length})
              </h2>
              <div className="row">
                {todaysGames.map((game, index) => (
                  <div key={`today-${game.id}-${index}`} className="col-md-6 col-lg-4 mb-3">
                    <div className={`game-card ${game.isLive ? 'live-game' : 'scheduled-game'}`}>
                      <div className="game-header">
                        <div className="game-sport">{getSportIcon(game.sport)} {game.sport}</div>
                        <div className={`game-status ${game.isLive ? 'live' : 'scheduled'}`}>
                          {game.isLive ? '🔴 LIVE' : game.type}
                        </div>
                      </div>
                      
                      <div className="game-matchup">
                        <div className="away-team">
                          <span className="team-name">{game.awayTeam}</span>
                          <span className="team-score">{game.awayScore !== null ? game.awayScore : '-'}</span>
                        </div>
                        <div className="vs-divider">@</div>
                        <div className="home-team">
                          <span className="team-name">{game.homeTeam}</span>
                          <span className="team-score">{game.homeScore !== null ? game.homeScore : '-'}</span>
                        </div>
                      </div>
                      
                      <div className="game-details">
                        <div className="game-time">{game.time}</div>
                        <div className="game-location">{game.location}</div>
                        
                        {/* Live Game Details */}
                        {game.isLive && (
                          <div className="live-details">
                            {game.sport === 'MLB' && (
                              <div className="live-info">
                                <span className="detail-label">Inning:</span>
                                <span className="detail-value">
                                  {game.inningHalf === 'top' ? 'Top' : 'Bottom'} {game.currentInning || 'TBD'}
                                </span>
                                {game.outs !== null && (
                                  <span className="detail-value"> • {game.outs} Outs</span>
                                )}
                              </div>
                            )}
                            
                            {game.sport === 'NFL' && (
                              <div className="live-info">
                                <span className="detail-label">Quarter:</span>
                                <span className="detail-value">Q{game.currentQuarter || 'TBD'}</span>
                                {game.quarterTime && (
                                  <span className="detail-value"> • {game.quarterTime}</span>
                                )}
                                {game.down && game.distance && (
                                  <span className="detail-value"> • {game.down} & {game.distance}</span>
                                )}
                              </div>
                            )}
                            
                            {game.sport === 'NBA' && (
                              <div className="live-info">
                                <span className="detail-label">Quarter:</span>
                                <span className="detail-value">
                                  {game.isOvertime ? `OT${game.currentQuarter - 4}` : `Q${game.currentQuarter || 'TBD'}`}
                                </span>
                                {game.quarterTime && (
                                  <span className="detail-value"> • {game.quarterTime}</span>
                                )}
                                {game.shotClock && (
                                  <span className="detail-value"> • Shot Clock: {game.shotClock}</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="filters-section">
            <div className="row">
              <div className="col-md-6">
                <div className="filter-group">
                  <label className="filter-label">Sport:</label>
                  <select 
                    className="filter-select"
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                  >
                    <option value="All">All Sports</option>
                    {Object.keys(realSchedules).map(sport => (
                      <option key={sport} value={sport}>
                        {getSportIcon(sport)} {sport}
                      </option>
                    ))}
                    {Object.keys(MAJOR_SPORTING_EVENTS).map(sport => (
                      <option key={sport} value={sport}>
                        {getSportIcon(sport)} {sport}
                      </option>
                    ))}
                    {Object.keys(GAME_SCHEDULES).map(sport => (
                      <option key={sport} value={sport}>
                        {getSportIcon(sport)} {sport}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="filter-group">
                  <label className="filter-label">Date Filter:</label>
                  <select 
                    className="filter-select"
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value)}
                  >
                    <option value="from-date">From Date</option>
                    <option value="month">Specific Month</option>
                    <option value="date-range">Date Range</option>
                  </select>
                </div>
              </div>
              
              <div className="col-md-2">
                <div className="filter-group">
                  <label className="filter-label">Show Predictions:</label>
                  <div className="prediction-toggle">
                    <input 
                      type="checkbox"
                      id="predictions"
                      checked={showPredictions}
                      onChange={(e) => setShowPredictions(e.target.checked)}
                    />
                    <label htmlFor="predictions" className="toggle-label">Win %</label>
                  </div>
                </div>
              </div>
              
              <div className="col-md-2">
                <div className="filter-group">
                  <label className="filter-label">Past Games:</label>
                  <button 
                    className={`past-games-btn ${showPastGames ? 'active' : ''}`}
                    onClick={() => setShowPastGames(!showPastGames)}
                  >
                    📊 Past Games
                  </button>
                </div>
              </div>
            </div>
            
            {/* Live Data Status Row */}
            <div className="row mt-2">
              <div className="col-md-12">
                  <div className="live-data-status">
                    <div className="status-info">
                      <span className={`status-indicator ${dataSource === 'live' ? 'live' : 'static'}`}>
                        {dataSource === 'live' ? '🟢 Live Data' : '🔴 Static Data'}
                      </span>
                      {liveGamesCount > 0 && (
                        <span className="live-games-indicator">
                          🔴 {liveGamesCount} Live Game{liveGamesCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      {lastUpdated && (
                        <span className="last-updated">
                          Last updated: {lastUpdated.toLocaleTimeString()} (Weekly auto-refresh)
                        </span>
                      )}
                      {isLoadingLiveData && (
                        <span className="loading-indicator">⟳ Updating...</span>
                      )}
                      <button 
                        className="quick-filter-btn debug-btn"
                        onClick={() => {
                          console.log('Current schedules:', realSchedules);
                          console.log('Live games count:', liveGamesCount);
                          console.log('Data source:', dataSource);
                          console.log('Live data enabled:', liveDataEnabled);
                        }}
                      >
                        Debug Info
                      </button>
                    </div>
                  <div className="data-controls">
                    <button 
                      className="quick-filter-btn"
                      onClick={() => setLiveDataEnabled(!liveDataEnabled)}
                    >
                      {liveDataEnabled ? 'Disable Live Data' : 'Enable Live Data'}
                    </button>
                    <button 
                      className="quick-filter-btn"
                      onClick={refreshLiveData}
                      disabled={!liveDataEnabled || isLoadingLiveData}
                    >
                      Manual Refresh
                    </button>
                    <button 
                      className="quick-filter-btn"
                      onClick={() => sportsAPI.clearCache()}
                    >
                      Clear Cache
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Dynamic Date Filter Row */}
            <div className="row mt-3">
              {filterMode === 'from-date' && (
                <div className="col-md-6">
                  <div className="filter-group">
                    <label className="filter-label">From Date:</label>
                    <input 
                      type="date"
                      className="filter-date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              {filterMode === 'month' && (
                <div className="col-md-6">
                  <div className="filter-group">
                    <label className="filter-label">Select Month:</label>
                    <select 
                      className="filter-select"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                      <option value="all">All Months</option>
                      <option value="2025-1">January 2025</option>
                      <option value="2025-2">February 2025</option>
                      <option value="2025-3">March 2025</option>
                      <option value="2025-4">April 2025</option>
                      <option value="2025-5">May 2025</option>
                      <option value="2025-6">June 2025</option>
                      <option value="2025-7">July 2025</option>
                      <option value="2025-8">August 2025</option>
                      <option value="2025-9">September 2025</option>
                      <option value="2025-10">October 2025</option>
                      <option value="2025-11">November 2025</option>
                      <option value="2025-12">December 2025</option>
                      <option value="2026-1">January 2026</option>
                      <option value="2026-2">February 2026</option>
                      <option value="2026-3">March 2026</option>
                      <option value="2026-4">April 2026</option>
                      <option value="2026-5">May 2026</option>
                      <option value="2026-6">June 2026</option>
                    </select>
                  </div>
                </div>
              )}
              
              {filterMode === 'date-range' && (
                <>
                  <div className="col-md-3">
                    <div className="filter-group">
                      <label className="filter-label">Start Date:</label>
                      <input 
                        type="date"
                        className="filter-date"
                        value={dateRangeStart}
                        onChange={(e) => setDateRangeStart(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="filter-group">
                      <label className="filter-label">End Date:</label>
                      <input 
                        type="date"
                        className="filter-date"
                        value={dateRangeEnd}
                        onChange={(e) => setDateRangeEnd(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
              
              {/* Quick Filter Buttons */}
              <div className="col-md-6">
                <div className="filter-group">
                  <label className="filter-label">Quick Filters:</label>
                  <div className="quick-filters">
                    <button 
                      className="quick-filter-btn"
                      onClick={() => {
                        setFilterMode('from-date');
                        setSelectedDate(new Date().toISOString().split('T')[0]);
                      }}
                    >
                      Today
                    </button>
                    <button 
                      className="quick-filter-btn"
                      onClick={() => {
                        setFilterMode('date-range');
                        const today = new Date();
                        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                        setDateRangeStart(today.toISOString().split('T')[0]);
                        setDateRangeEnd(nextWeek.toISOString().split('T')[0]);
                      }}
                    >
                      This Week
                    </button>
                    <button 
                      className="quick-filter-btn"
                      onClick={() => {
                        setFilterMode('month');
                        const today = new Date();
                        const year = today.getFullYear();
                        const month = today.getMonth() + 1;
                        setSelectedMonth(`${year}-${month}`);
                      }}
                    >
                      This Month
                    </button>
                    <button 
                      className="quick-filter-btn clear-btn"
                      onClick={() => {
                        setFilterMode('from-date');
                        setSelectedDate('2025-01-01');
                        setSelectedMonth('all');
                        setDateRangeStart('');
                        setDateRangeEnd('');
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Past Games Section */}
        {showPastGames && (
          <div className="past-games-section mb-5">
            <div className="past-games-header">
              <h2 className="text-center mb-4" style={{ color: "#f77f00", fontWeight: "bold" }}>
                📊 Team Past Games (Last 20 Games)
              </h2>
              
              <div className="past-games-controls">
                <div className="row">
                  <div className="col-md-4">
                    <div className="filter-group">
                      <label className="filter-label">Sport:</label>
                      <select 
                        className="filter-select"
                        value={selectedTeamSport}
                        onChange={(e) => {
                          setSelectedTeamSport(e.target.value);
                          setSelectedTeam(''); // Reset team selection
                          setPastGames([]); // Clear past games
                        }}
                      >
                        <option value="NFL">🏈 NFL</option>
                        <option value="NBA">🏀 NBA</option>
                        <option value="MLB">⚾ MLB</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="filter-group">
                      <label className="filter-label">Team:</label>
                      <select 
                        className="filter-select"
                        value={selectedTeam}
                        onChange={(e) => {
                          setSelectedTeam(e.target.value);
                          if (e.target.value) {
                            loadPastGames(selectedTeamSport, e.target.value);
                          } else {
                            setPastGames([]);
                          }
                        }}
                        disabled={!selectedTeamSport}
                      >
                        <option value="">Select a team...</option>
                        {getAvailableTeams(selectedTeamSport).map(team => (
                          <option key={team} value={team}>
                            {team}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="filter-group">
                      <label className="filter-label">Actions:</label>
                      <div className="past-games-actions">
                        <button 
                          className="quick-filter-btn"
                          onClick={() => {
                            if (selectedTeam) {
                              loadPastGames(selectedTeamSport, selectedTeam);
                            }
                          }}
                          disabled={!selectedTeam || isLoadingPastGames}
                        >
                          {isLoadingPastGames ? '⟳ Loading...' : '🔄 Refresh'}
                        </button>
                        <button 
                          className="quick-filter-btn clear-btn"
                          onClick={() => {
                            setSelectedTeam('');
                            setPastGames([]);
                            setPastGamesLastUpdated(null);
                          }}
                        >
                          Clear
                        </button>
                        <button 
                          className="quick-filter-btn debug-btn"
                          onClick={async () => {
                            if (selectedTeam) {
                              console.log('Testing fallback data...');
                              const fallbackGames = await sportsAPI.getPastGamesWithFallback(selectedTeamSport, selectedTeam);
                              setPastGames(fallbackGames);
                              setPastGamesLastUpdated(new Date());
                            }
                          }}
                          disabled={!selectedTeam}
                        >
                          Test Data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Past Games Status */}
                {pastGamesLastUpdated && (
                  <div className="past-games-status mt-3">
                    <div className="status-info">
                      <span className="status-indicator static">
                        📊 {pastGames.length} Past Games Loaded
                      </span>
                      <span className="last-updated">
                        Last updated: {pastGamesLastUpdated.toLocaleTimeString()} (Weekly auto-refresh)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Past Games Display */}
            {selectedTeam && (
              <div className="past-games-display">
                {isLoadingPastGames ? (
                  <div className="loading-past-games">
                    <div className="loading-spinner">⟳</div>
                    <p>Loading past games for {selectedTeam}...</p>
                  </div>
                ) : pastGames.length > 0 ? (
                  <div className="past-games-grid">
                    <h3 className="team-past-games-title">
                      {getSportIcon(selectedTeamSport)} {selectedTeam} - Last 20 Games
                    </h3>
                    <div className="past-games-stats mb-3">
                      {(() => {
                        const wins = pastGames.filter(game => {
                          const isHome = game.homeTeam === selectedTeam;
                          const homeScore = parseInt(game.homeScore) || 0;
                          const awayScore = parseInt(game.awayScore) || 0;
                          return isHome ? homeScore > awayScore : awayScore > homeScore;
                        }).length;
                        const losses = pastGames.length - wins;
                        const winPercentage = pastGames.length > 0 ? Math.round((wins / pastGames.length) * 100) : 0;
                        
                        return (
                          <div className="team-record">
                            <span className="record-item">
                              <strong>Record:</strong> {wins}-{losses}
                            </span>
                            <span className="record-item">
                              <strong>Win %:</strong> {winPercentage}%
                            </span>
                            <span className="record-item">
                              <strong>Games:</strong> {pastGames.length}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    
                    <div className="past-games-list">
                      {pastGames.map((game, index) => {
                        const gameDate = new Date(game.date);
                        const isHome = game.homeTeam === selectedTeam;
                        const teamScore = isHome ? game.homeScore : game.awayScore;
                        const opponentScore = isHome ? game.awayScore : game.homeScore;
                        const opponent = isHome ? game.awayTeam : game.homeTeam;
                        const won = parseInt(teamScore) > parseInt(opponentScore);
                        
                        return (
                          <div key={game.id} className={`past-game-card ${won ? 'win' : 'loss'}`}>
                            <div className="past-game-header">
                              <div className="game-result">
                                <span className={`result-badge ${won ? 'win' : 'loss'}`}>
                                  {won ? 'W' : 'L'}
                                </span>
                                <span className="game-number">#{index + 1}</span>
                              </div>
                              <div className="game-date">
                                {gameDate.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                            
                            <div className="past-game-content">
                              <div className="game-matchup">
                                <div className="team-score">
                                  <span className="team-name">{selectedTeam}</span>
                                  <span className="score">{teamScore}</span>
                                </div>
                                <div className="vs-divider">vs</div>
                                <div className="team-score">
                                  <span className="team-name">{opponent}</span>
                                  <span className="score">{opponentScore}</span>
                                </div>
                              </div>
                              
                              <div className="game-details">
                                <div className="game-location">
                                  <span className="location-icon">📍</span>
                                  {game.location}
                                </div>
                                {game.week && (
                                  <div className="game-week">
                                    <span className="week-icon">📅</span>
                                    {selectedTeamSport === 'NFL' ? `Week ${game.week}` : `Game ${game.week}`}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="no-past-games">
                    <h3>No past games found for {selectedTeam}</h3>
                    <p>Try selecting a different team or sport.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="events-grid">
          {filteredEvents.length === 0 ? (
            <div className="no-events">
              <h3>No events found for the selected criteria</h3>
              <p>Try adjusting your filters or selecting a different date range.</p>
            </div>
          ) : (
            (() => {
              // Calculate pagination
              const indexOfLastEvent = currentPage * eventsPerPage;
              const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
              const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
              
              return currentEvents.map((event, index) => (
              <div key={index} className="event-card">
                <div className="event-header">
                  <div className={`event-type ${event.type === 'Live' ? 'live' : ''}`} 
                       style={{ backgroundColor: getEventTypeColor(event.type) }}>
                    {event.type === 'Live' ? '🔴 LIVE' : event.type}
                  </div>
                  <div className="event-date">
                    {formatDate(event.date)}
                  </div>
                </div>
                
                <div className="event-content">
                  <h3 className="event-name">{event.name}</h3>
                  
                  {/* Win Probability Display - Only for scheduled games */}
                  {showPredictions && event.homeWinProb && event.awayWinProb && 
                   event.type === "Scheduled" && (
                    <div className="win-probability">
                      <div className="probability-header">Win Probability Prediction</div>
                      <div className="probability-bars">
                        <div className="team-probability">
                          <span className="team-name">{event.homeTeam}</span>
                          <div className="probability-bar">
                            <div 
                              className="probability-fill home-team"
                              style={{ width: `${event.homeWinProb}%` }}
                            ></div>
                          </div>
                          <span className="probability-percent">{event.homeWinProb}%</span>
                        </div>
                        <div className="team-probability">
                          <span className="team-name">{event.awayTeam}</span>
                          <div className="probability-bar">
                            <div 
                              className="probability-fill away-team"
                              style={{ width: `${event.awayWinProb}%` }}
                            ></div>
                          </div>
                          <span className="probability-percent">{event.awayWinProb}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Live Game Details */}
                  <LiveGameDetails event={event} />
                  
                  {/* Game Score (if completed or live) */}
                  {event.homeScore !== null && event.awayScore !== null && 
                   (event.type === "Final" || event.type === "Live") && (
                    <div className="game-score">
                      <div className="score-header">
                        {event.type === "Live" ? "Current Score" : "Final Score"}
                        {event.type === "Final" && (
                          <span className="winner-indicator">
                            {parseInt(event.homeScore) > parseInt(event.awayScore) 
                              ? `🏆 ${event.homeTeam} Wins` 
                              : parseInt(event.awayScore) > parseInt(event.homeScore)
                              ? `🏆 ${event.awayTeam} Wins`
                              : "🤝 Tie Game"}
                          </span>
                        )}
                      </div>
                      <div className="score-display">
                        <span className={`team-score ${
                          event.type === "Final" && parseInt(event.awayScore) > parseInt(event.homeScore) ? 'winner' : 
                          event.type === "Final" && parseInt(event.awayScore) < parseInt(event.homeScore) ? 'loser' : ''
                        }`}>
                          {event.awayTeam}: {event.awayScore}
                        </span>
                        <span className="score-separator">-</span>
                        <span className={`team-score ${
                          event.type === "Final" && parseInt(event.homeScore) > parseInt(event.awayScore) ? 'winner' : 
                          event.type === "Final" && parseInt(event.homeScore) < parseInt(event.awayScore) ? 'loser' : ''
                        }`}>
                          {event.homeTeam}: {event.homeScore}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="event-location">
                    <span className="location-icon">📍</span>
                    {event.location}
                  </div>
                  {event.time && (
                    <div className="event-time">
                      <span className="time-icon">🕐</span>
                      {event.time}
                    </div>
                  )}
                  {event.week && (
                    <div className="event-week">
                      <span className="week-icon">📅</span>
                      {event.week}
                    </div>
                  )}
                  {event.endDate && (
                    <div className="event-duration">
                      <span className="duration-icon">📅</span>
                      {formatDate(event.date)} - {formatDate(event.endDate)}
                    </div>
                  )}
                  {event.description && (
                    <div className="event-description">
                      <span className="description-icon">ℹ️</span>
                      {event.description}
                    </div>
                  )}
                </div>
                
                <div className="event-footer">
                  <div className="countdown">
                    {(() => {
                      const eventDate = new Date(event.date);
                      const today = new Date();
                      const diffTime = eventDate - today;
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (diffDays < 0) {
                        return <span className="past-event">Past Event</span>;
                      } else if (diffDays === 0) {
                        return <span className="today-event">Today!</span>;
                      } else if (diffDays === 1) {
                        return <span className="tomorrow-event">Tomorrow</span>;
                      } else {
                        return <span className="upcoming-event">{diffDays} days away</span>;
                      }
                    })()}
                  </div>
                </div>
              </div>
              ));
            })()
          )}
        </div>

        {/* Pagination Controls */}
        {filteredEvents.length > eventsPerPage && (
          <div className="pagination-section">
            <div className="pagination-info">
              <span>
                Showing {((currentPage - 1) * eventsPerPage) + 1} to {Math.min(currentPage * eventsPerPage, filteredEvents.length)} of {filteredEvents.length} events
              </span>
            </div>
            <div className="pagination-controls">
              <button 
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              <div className="page-numbers">
                {(() => {
                  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
                  const pages = [];
                  const startPage = Math.max(1, currentPage - 2);
                  const endPage = Math.min(totalPages, currentPage + 2);
                  
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        className={`page-number ${currentPage === i ? 'active' : ''}`}
                        onClick={() => setCurrentPage(i)}
                      >
                        {i}
                      </button>
                    );
                  }
                  return pages;
                })()}
              </div>
              
              <button 
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredEvents.length / eventsPerPage)))}
                disabled={currentPage === Math.ceil(filteredEvents.length / eventsPerPage)}
              >
                Next
              </button>
            </div>
          </div>
        )}

        <div className="stats-section mt-5">
          <div className="row">
            <div className="col-md-4">
              <div className="stat-card">
                <h4>Total Events</h4>
                <div className="stat-number">{filteredEvents.length}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card">
                <h4>Upcoming Events</h4>
                <div className="stat-number">
                  {filteredEvents.filter(event => new Date(event.date) >= new Date()).length}
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card">
                <h4>This Month</h4>
                <div className="stat-number">
                  {filteredEvents.filter(event => {
                    const eventDate = new Date(event.date);
                    const now = new Date();
                    return eventDate.getMonth() === now.getMonth() && 
                           eventDate.getFullYear() === now.getFullYear();
                  }).length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Schedules;
