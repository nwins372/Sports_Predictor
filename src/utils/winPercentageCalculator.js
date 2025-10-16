/**
 * Advanced Win Percentage Calculator - Dimers.com Style
 * Implements real-time win probabilities with Monte Carlo simulations
 * Based on Dimers.com's predictive analytics approach
 */

// Enhanced team statistics with more data points
export const ENHANCED_TEAM_STATS = {
  // NFL Teams with comprehensive stats
  "Buffalo Bills": { 
    wins: 13, losses: 4, winPercentage: 76.5, 
    offense: 85, defense: 82, specialTeams: 78, 
    recentForm: 0.8, homeRecord: 0.75, awayRecord: 0.78,
    conference: "AFC East", division: "East"
  },
  "Miami Dolphins": { 
    wins: 9, losses: 8, winPercentage: 52.9, 
    offense: 88, defense: 75, specialTeams: 82, 
    recentForm: 0.6, homeRecord: 0.62, awayRecord: 0.44,
    conference: "AFC East", division: "East"
  },
  "New York Jets": { 
    wins: 7, losses: 10, winPercentage: 41.2, 
    offense: 65, defense: 85, specialTeams: 70, 
    recentForm: 0.4, homeRecord: 0.38, awayRecord: 0.44,
    conference: "AFC East", division: "East"
  },
  "New England Patriots": { 
    wins: 4, losses: 13, winPercentage: 23.5, 
    offense: 60, defense: 72, specialTeams: 68, 
    recentForm: 0.2, homeRecord: 0.25, awayRecord: 0.22,
    conference: "AFC East", division: "East"
  },
  "Baltimore Ravens": { 
    wins: 13, losses: 4, winPercentage: 76.5, 
    offense: 82, defense: 88, specialTeams: 75, 
    recentForm: 0.8, homeRecord: 0.81, awayRecord: 0.72,
    conference: "AFC North", division: "North"
  },
  "Cincinnati Bengals": { 
    wins: 10, losses: 7, winPercentage: 58.8, 
    offense: 85, defense: 78, specialTeams: 72, 
    recentForm: 0.6, homeRecord: 0.69, awayRecord: 0.50,
    conference: "AFC North", division: "North"
  },
  "Pittsburgh Steelers": { 
    wins: 9, losses: 8, winPercentage: 52.9, 
    offense: 72, defense: 85, specialTeams: 78, 
    recentForm: 0.5, homeRecord: 0.56, awayRecord: 0.50,
    conference: "AFC North", division: "North"
  },
  "Cleveland Browns": { 
    wins: 8, losses: 9, winPercentage: 47.1, 
    offense: 68, defense: 82, specialTeams: 75, 
    recentForm: 0.45, homeRecord: 0.50, awayRecord: 0.44,
    conference: "AFC North", division: "North"
  },
  "Jacksonville Jaguars": { 
    wins: 9, losses: 8, winPercentage: 52.9, 
    offense: 78, defense: 75, specialTeams: 70, 
    recentForm: 0.55, homeRecord: 0.62, awayRecord: 0.44,
    conference: "AFC South", division: "South"
  },
  "Tennessee Titans": { 
    wins: 8, losses: 9, winPercentage: 47.1, 
    offense: 72, defense: 78, specialTeams: 68, 
    recentForm: 0.4, homeRecord: 0.50, awayRecord: 0.44,
    conference: "AFC South", division: "South"
  },
  "Indianapolis Colts": { 
    wins: 7, losses: 10, winPercentage: 41.2, 
    offense: 75, defense: 72, specialTeams: 65, 
    recentForm: 0.35, homeRecord: 0.44, awayRecord: 0.38,
    conference: "AFC South", division: "South"
  },
  "Houston Texans": { 
    wins: 7, losses: 10, winPercentage: 41.2, 
    offense: 78, defense: 70, specialTeams: 62, 
    recentForm: 0.4, homeRecord: 0.44, awayRecord: 0.38,
    conference: "AFC South", division: "South"
  },
  "Kansas City Chiefs": { 
    wins: 14, losses: 3, winPercentage: 82.4, 
    offense: 88, defense: 85, specialTeams: 82, 
    recentForm: 0.85, homeRecord: 0.88, awayRecord: 0.78,
    conference: "AFC West", division: "West"
  },
  "Las Vegas Raiders": { 
    wins: 8, losses: 9, winPercentage: 47.1, 
    offense: 72, defense: 78, specialTeams: 75, 
    recentForm: 0.5, homeRecord: 0.56, awayRecord: 0.38,
    conference: "AFC West", division: "West"
  },
  "Los Angeles Chargers": { 
    wins: 8, losses: 9, winPercentage: 47.1, 
    offense: 82, defense: 72, specialTeams: 68, 
    recentForm: 0.45, homeRecord: 0.50, awayRecord: 0.44,
    conference: "AFC West", division: "West"
  },
  "Denver Broncos": { 
    wins: 7, losses: 10, winPercentage: 41.2, 
    offense: 68, defense: 75, specialTeams: 70, 
    recentForm: 0.4, homeRecord: 0.44, awayRecord: 0.38,
    conference: "AFC West", division: "West"
  },
  "Philadelphia Eagles": { 
    wins: 12, losses: 5, winPercentage: 70.6, 
    offense: 85, defense: 82, specialTeams: 78, 
    recentForm: 0.75, homeRecord: 0.81, awayRecord: 0.61,
    conference: "NFC East", division: "East"
  },
  "Dallas Cowboys": { 
    wins: 11, losses: 6, winPercentage: 64.7, 
    offense: 88, defense: 78, specialTeams: 75, 
    recentForm: 0.7, homeRecord: 0.75, awayRecord: 0.56,
    conference: "NFC East", division: "East"
  },
  "New York Giants": { 
    wins: 6, losses: 11, winPercentage: 35.3, 
    offense: 65, defense: 72, specialTeams: 68, 
    recentForm: 0.3, homeRecord: 0.38, awayRecord: 0.33,
    conference: "NFC East", division: "East"
  },
  "Washington Commanders": { 
    wins: 5, losses: 12, winPercentage: 29.4, 
    offense: 62, defense: 68, specialTeams: 65, 
    recentForm: 0.25, homeRecord: 0.31, awayRecord: 0.28,
    conference: "NFC East", division: "East"
  },
  "Detroit Lions": { 
    wins: 11, losses: 6, winPercentage: 64.7, 
    offense: 82, defense: 75, specialTeams: 78, 
    recentForm: 0.7, homeRecord: 0.75, awayRecord: 0.56,
    conference: "NFC North", division: "North"
  },
  "Green Bay Packers": { 
    wins: 10, losses: 7, winPercentage: 58.8, 
    offense: 78, defense: 72, specialTeams: 75, 
    recentForm: 0.65, homeRecord: 0.69, awayRecord: 0.50,
    conference: "NFC North", division: "North"
  },
  "Minnesota Vikings": { 
    wins: 8, losses: 9, winPercentage: 47.1, 
    offense: 75, defense: 78, specialTeams: 72, 
    recentForm: 0.45, homeRecord: 0.56, awayRecord: 0.38,
    conference: "NFC North", division: "North"
  },
  "Chicago Bears": { 
    wins: 6, losses: 11, winPercentage: 35.3, 
    offense: 68, defense: 75, specialTeams: 70, 
    recentForm: 0.35, homeRecord: 0.44, awayRecord: 0.28,
    conference: "NFC North", division: "North"
  },
  "Tampa Bay Buccaneers": { 
    wins: 9, losses: 8, winPercentage: 52.9, 
    offense: 72, defense: 82, specialTeams: 75, 
    recentForm: 0.55, homeRecord: 0.62, awayRecord: 0.44,
    conference: "NFC South", division: "South"
  },
  "New Orleans Saints": { 
    wins: 8, losses: 9, winPercentage: 47.1, 
    offense: 75, defense: 78, specialTeams: 68, 
    recentForm: 0.45, homeRecord: 0.56, awayRecord: 0.38,
    conference: "NFC South", division: "South"
  },
  "Atlanta Falcons": { 
    wins: 7, losses: 10, winPercentage: 41.2, 
    offense: 70, defense: 75, specialTeams: 65, 
    recentForm: 0.4, homeRecord: 0.44, awayRecord: 0.38,
    conference: "NFC South", division: "South"
  },
  "Carolina Panthers": { 
    wins: 5, losses: 12, winPercentage: 29.4, 
    offense: 58, defense: 72, specialTeams: 62, 
    recentForm: 0.25, homeRecord: 0.31, awayRecord: 0.28,
    conference: "NFC South", division: "South"
  },
  "San Francisco 49ers": { 
    wins: 12, losses: 5, winPercentage: 70.6, 
    offense: 85, defense: 88, specialTeams: 82, 
    recentForm: 0.8, homeRecord: 0.81, awayRecord: 0.61,
    conference: "NFC West", division: "West"
  },
  "Seattle Seahawks": { 
    wins: 9, losses: 8, winPercentage: 52.9, 
    offense: 78, defense: 75, specialTeams: 72, 
    recentForm: 0.55, homeRecord: 0.69, awayRecord: 0.38,
    conference: "NFC West", division: "West"
  },
  "Los Angeles Rams": { 
    wins: 8, losses: 9, winPercentage: 47.1, 
    offense: 82, defense: 72, specialTeams: 68, 
    recentForm: 0.45, homeRecord: 0.56, awayRecord: 0.38,
    conference: "NFC West", division: "West"
  },
  "Arizona Cardinals": { 
    wins: 6, losses: 11, winPercentage: 35.3, 
    offense: 72, defense: 68, specialTeams: 65, 
    recentForm: 0.3, homeRecord: 0.38, awayRecord: 0.33,
    conference: "NFC West", division: "West"
  },

  // NBA Teams
  "Boston Celtics": { 
    wins: 55, losses: 27, winPercentage: 67.1, 
    offense: 88, defense: 85, specialTeams: 75, 
    recentForm: 0.75, homeRecord: 0.78, awayRecord: 0.56,
    conference: "Eastern", division: "Atlantic"
  },
  "Los Angeles Lakers": { 
    wins: 47, losses: 35, winPercentage: 57.3, 
    offense: 82, defense: 78, specialTeams: 72, 
    recentForm: 0.65, homeRecord: 0.72, awayRecord: 0.44,
    conference: "Western", division: "Pacific"
  },
  "Golden State Warriors": { 
    wins: 44, losses: 38, winPercentage: 53.7, 
    offense: 85, defense: 72, specialTeams: 78, 
    recentForm: 0.6, homeRecord: 0.69, awayRecord: 0.39,
    conference: "Western", division: "Pacific"
  },
  "Miami Heat": { 
    wins: 46, losses: 36, winPercentage: 56.1, 
    offense: 78, defense: 82, specialTeams: 75, 
    recentForm: 0.65, homeRecord: 0.72, awayRecord: 0.42,
    conference: "Eastern", division: "Southeast"
  },
  "Denver Nuggets": { 
    wins: 57, losses: 25, winPercentage: 69.5, 
    offense: 85, defense: 88, specialTeams: 78, 
    recentForm: 0.8, homeRecord: 0.85, awayRecord: 0.56,
    conference: "Western", division: "Northwest"
  },
  "Milwaukee Bucks": { 
    wins: 49, losses: 33, winPercentage: 59.8, 
    offense: 88, defense: 82, specialTeams: 75, 
    recentForm: 0.7, homeRecord: 0.78, awayRecord: 0.44,
    conference: "Eastern", division: "Central"
  },

  // MLB Teams
  "Los Angeles Dodgers": { 
    wins: 100, losses: 62, winPercentage: 61.7, 
    offense: 88, defense: 85, specialTeams: 82, 
    recentForm: 0.75, homeRecord: 0.78, awayRecord: 0.47,
    conference: "National", division: "West"
  },
  "New York Yankees": { 
    wins: 94, losses: 68, winPercentage: 58.0, 
    offense: 85, defense: 82, specialTeams: 78, 
    recentForm: 0.7, homeRecord: 0.72, awayRecord: 0.45,
    conference: "American", division: "East"
  },
  "Atlanta Braves": { 
    wins: 89, losses: 73, winPercentage: 54.9, 
    offense: 82, defense: 78, specialTeams: 75, 
    recentForm: 0.65, homeRecord: 0.69, awayRecord: 0.42,
    conference: "National", division: "East"
  },
  "Houston Astros": { 
    wins: 90, losses: 72, winPercentage: 55.6, 
    offense: 85, defense: 82, specialTeams: 78, 
    recentForm: 0.68, homeRecord: 0.72, awayRecord: 0.42,
    conference: "American", division: "West"
  },
  "Boston Red Sox": { 
    wins: 78, losses: 84, winPercentage: 48.1, 
    offense: 78, defense: 72, specialTeams: 68, 
    recentForm: 0.5, homeRecord: 0.56, awayRecord: 0.42,
    conference: "American", division: "East"
  },
  "San Francisco Giants": { 
    wins: 80, losses: 82, winPercentage: 49.4, 
    offense: 75, defense: 78, specialTeams: 72, 
    recentForm: 0.52, homeRecord: 0.58, awayRecord: 0.42,
    conference: "National", division: "West"
  },
  "Philadelphia Phillies": { 
    wins: 87, losses: 75, winPercentage: 53.7, 
    offense: 82, defense: 78, specialTeams: 75, 
    recentForm: 0.62, homeRecord: 0.67, awayRecord: 0.42,
    conference: "National", division: "East"
  },
  "Chicago Cubs": { 
    wins: 83, losses: 79, winPercentage: 51.2, 
    offense: 78, defense: 75, specialTeams: 72, 
    recentForm: 0.55, homeRecord: 0.61, awayRecord: 0.42,
    conference: "National", division: "Central"
  },
  "Milwaukee Brewers": { 
    wins: 93, losses: 69, winPercentage: 57.4, 
    offense: 82, defense: 85, specialTeams: 78, 
    recentForm: 0.68, homeRecord: 0.72, awayRecord: 0.44,
    conference: "National", division: "Central"
  },
  "Toronto Blue Jays": { 
    wins: 74, losses: 88, winPercentage: 45.7, 
    offense: 75, defense: 72, specialTeams: 68, 
    recentForm: 0.42, homeRecord: 0.50, awayRecord: 0.39,
    conference: "American", division: "East"
  },
  "Baltimore Orioles": { 
    wins: 91, losses: 71, winPercentage: 56.2, 
    offense: 85, defense: 78, specialTeams: 75, 
    recentForm: 0.68, homeRecord: 0.72, awayRecord: 0.42,
    conference: "American", division: "East"
  },
  "Cleveland Guardians": { 
    wins: 92, losses: 70, winPercentage: 56.8, 
    offense: 78, defense: 88, specialTeams: 75, 
    recentForm: 0.7, homeRecord: 0.75, awayRecord: 0.42,
    conference: "American", division: "Central"
  },
  "Texas Rangers": { 
    wins: 90, losses: 72, winPercentage: 55.6, 
    offense: 85, defense: 78, specialTeams: 72, 
    recentForm: 0.65, homeRecord: 0.69, awayRecord: 0.44,
    conference: "American", division: "West"
  }
};

/**
 * Monte Carlo Simulation Engine - Dimers.com Style
 * Runs thousands of game simulations for accurate win probabilities
 */
export class MonteCarloSimulator {
  constructor(simulations = 10000) {
    this.simulations = simulations;
    this.gameStates = new Map();
  }

  /**
   * Simulate a game between two teams
   */
  simulateGame(team1, team2, team1Stats, team2Stats, options = {}) {
    const {
      isHomeTeam1 = true,
      currentScore = { team1: 0, team2: 0 },
      timeRemaining = 1.0, // 1.0 = full game, 0.5 = halftime, etc.
      momentum = { team1: 0, team2: 0 }
    } = options;

    let team1Wins = 0;
    let team2Wins = 0;

    for (let i = 0; i < this.simulations; i++) {
      const result = this.runSingleSimulation(team1Stats, team2Stats, {
        isHomeTeam1,
        currentScore,
        timeRemaining,
        momentum
      });

      if (result.team1Score > result.team2Score) {
        team1Wins++;
      } else {
        team2Wins++;
      }
    }

    return {
      team1WinProbability: team1Wins / this.simulations,
      team2WinProbability: team2Wins / this.simulations,
      simulations: this.simulations
    };
  }

  /**
   * Run a single game simulation
   */
  runSingleSimulation(team1Stats, team2Stats, options) {
    const { isHomeTeam1, currentScore, timeRemaining, momentum } = options;
    
    // Base performance with home advantage
    const team1BasePerformance = this.calculateBasePerformance(team1Stats, isHomeTeam1);
    const team2BasePerformance = this.calculateBasePerformance(team2Stats, !isHomeTeam1);

    // Add momentum and randomness
    const team1Performance = this.addRandomness(team1BasePerformance + momentum.team1);
    const team2Performance = this.addRandomness(team2BasePerformance + momentum.team2);

    // Calculate score based on sport type
    const team1Score = currentScore.team1 + this.calculateScore(team1Performance, timeRemaining);
    const team2Score = currentScore.team2 + this.calculateScore(team2Performance, timeRemaining);

    return {
      team1Score,
      team2Score,
      team1Performance,
      team2Performance
    };
  }

  /**
   * Calculate base team performance
   */
  calculateBasePerformance(stats, isHome) {
    const homeAdvantage = isHome ? 0.05 : 0;
    return (
      (stats.winPercentage / 100) * 0.4 +
      (stats.offense / 100) * 0.3 +
      (stats.defense / 100) * 0.2 +
      (stats.recentForm) * 0.1 +
      homeAdvantage
    );
  }

  /**
   * Add realistic randomness to performance
   */
  addRandomness(basePerformance) {
    // Normal distribution with standard deviation based on sport volatility
    const volatility = 0.15; // 15% standard deviation
    const randomFactor = (Math.random() - 0.5) * 2 * volatility;
    return Math.max(0, Math.min(1, basePerformance + randomFactor));
  }

  /**
   * Calculate score based on performance and time remaining
   */
  calculateScore(performance, timeRemaining) {
    // Sport-specific scoring (can be customized per sport)
    const baseScore = performance * 30; // Base points per game
    return Math.round(baseScore * timeRemaining);
  }
}

/**
 * Advanced Win Percentage Calculator Class - Dimers.com Style
 */
export class WinPercentageCalculator {
  constructor() {
    this.teamStats = ENHANCED_TEAM_STATS;
    this.simulator = new MonteCarloSimulator(10000);
    this.algorithms = {
      basic: this.calculateBasic.bind(this),
      advanced: this.calculateAdvanced.bind(this),
      elo: this.calculateElo.bind(this),
      composite: this.calculateComposite.bind(this),
      monteCarlo: this.calculateMonteCarlo.bind(this),
      live: this.calculateLive.bind(this)
    };
  }

  /**
   * Main calculation method that uses the best algorithm
   */
  calculateWinPercentage(team1, team2, options = {}) {
    const {
      algorithm = 'composite',
      isHomeTeam1 = true,
      includeRecentForm = true,
      includeHeadToHead = false,
      confidenceThreshold = 0.7
    } = options;

    const calculator = this.algorithms[algorithm] || this.algorithms.composite;
    
    return calculator(team1, team2, {
      isHomeTeam1,
      includeRecentForm,
      includeHeadToHead,
      confidenceThreshold
    });
  }

  /**
   * Basic algorithm - similar to current implementation but improved
   */
  calculateBasic(team1, team2, options = {}) {
    const { isHomeTeam1 = true } = options;
    const homeTeam = isHomeTeam1 ? team1 : team2;
    const awayTeam = isHomeTeam1 ? team2 : team1;

    const homeStats = this.getTeamStats(homeTeam);
    const awayStats = this.getTeamStats(awayTeam);

    // Note: getTeamStats now returns default stats instead of null

    // Basic calculation with home advantage
    const homeAdvantage = 0.05; // 5% home advantage
    const homeStrength = homeStats.winPercentage / 100;
    const awayStrength = awayStats.winPercentage / 100;

    const homeWinPercentage = homeStrength + homeAdvantage;
    const awayWinPercentage = awayStrength;

    // Normalize to ensure they add up to 1
    const total = homeWinPercentage + awayWinPercentage;
    const team1Prob = isHomeTeam1 ? homeWinPercentage / total : awayWinPercentage / total;
    const team2Prob = 1 - team1Prob;

    const confidence = Math.abs(team1Prob - team2Prob);

    return {
      team1Probability: team1Prob,
      team2Probability: team2Prob,
      confidence: confidence,
      algorithm: 'basic'
    };
  }

  /**
   * Advanced algorithm with multiple factors
   */
  calculateAdvanced(team1, team2, options = {}) {
    const { isHomeTeam1 = true, includeRecentForm = true } = options;
    const homeTeam = isHomeTeam1 ? team1 : team2;
    const awayTeam = isHomeTeam1 ? team2 : team1;

    const homeStats = this.getTeamStats(homeTeam);
    const awayStats = this.getTeamStats(awayTeam);

    // Note: getTeamStats now returns default stats instead of null

    // Factor weights
    const weights = {
      overallRecord: 0.3,
      offense: 0.2,
      defense: 0.2,
      homeAdvantage: 0.1,
      recentForm: includeRecentForm ? 0.15 : 0,
      specialTeams: 0.05
    };

    // Calculate home team strength
    let homeStrength = 
      (homeStats.winPercentage / 100) * weights.overallRecord +
      (homeStats.offense / 100) * weights.offense +
      (homeStats.defense / 100) * weights.defense +
      (homeStats.specialTeams / 100) * weights.specialTeams;

    if (includeRecentForm) {
      homeStrength += homeStats.recentForm * weights.recentForm;
    }

    // Add home advantage
    homeStrength += weights.homeAdvantage;

    // Calculate away team strength
    let awayStrength = 
      (awayStats.winPercentage / 100) * weights.overallRecord +
      (awayStats.offense / 100) * weights.offense +
      (awayStats.defense / 100) * weights.defense +
      (awayStats.specialTeams / 100) * weights.specialTeams;

    if (includeRecentForm) {
      awayStrength += awayStats.recentForm * weights.recentForm;
    }

    // Normalize
    const total = homeStrength + awayStrength;
    const team1Prob = isHomeTeam1 ? homeStrength / total : awayStrength / total;
    const team2Prob = 1 - team1Prob;

    const confidence = Math.abs(team1Prob - team2Prob);

    return {
      team1Probability: team1Prob,
      team2Probability: team2Prob,
      confidence: confidence,
      algorithm: 'advanced',
      factors: {
        overallRecord: { home: homeStats.winPercentage, away: awayStats.winPercentage },
        offense: { home: homeStats.offense, away: awayStats.offense },
        defense: { home: homeStats.defense, away: awayStats.defense },
        recentForm: includeRecentForm ? { home: homeStats.recentForm, away: awayStats.recentForm } : null
      }
    };
  }

  /**
   * ELO-based rating system
   */
  calculateElo(team1, team2, options = {}) {
    const { isHomeTeam1 = true } = options;
    const homeTeam = isHomeTeam1 ? team1 : team2;
    const awayTeam = isHomeTeam1 ? team2 : team1;

    const homeStats = this.getTeamStats(homeTeam);
    const awayStats = this.getTeamStats(awayTeam);

    // Note: getTeamStats now returns default stats instead of null

    // Convert win percentage to ELO-like rating (1000 base + performance)
    const homeRating = 1000 + (homeStats.winPercentage - 50) * 15;
    const awayRating = 1000 + (awayStats.winPercentage - 50) * 15;

    // Home advantage (typically 35 ELO points)
    const homeAdvantage = 35;
    const adjustedHomeRating = homeRating + homeAdvantage;

    // ELO win probability calculation
    const ratingDiff = adjustedHomeRating - awayRating;
    const team1Prob = 1 / (1 + Math.pow(10, -ratingDiff / 400));
    const team2Prob = 1 - team1Prob;

    const confidence = Math.abs(team1Prob - team2Prob);

    return {
      team1Probability: isHomeTeam1 ? team1Prob : team2Prob,
      team2Probability: isHomeTeam1 ? team2Prob : team1Prob,
      confidence: confidence,
      algorithm: 'elo',
      ratings: {
        home: adjustedHomeRating,
        away: awayRating,
        difference: ratingDiff
      }
    };
  }

  /**
   * Monte Carlo simulation algorithm - Dimers.com style
   */
  calculateMonteCarlo(team1, team2, options = {}) {
    const { isHomeTeam1 = true } = options;
    
    const team1Stats = this.getTeamStats(team1);
    const team2Stats = this.getTeamStats(team2);

    // Note: getTeamStats now returns default stats instead of null

    const simulationResult = this.simulator.simulateGame(team1, team2, team1Stats, team2Stats, options);
    
    const team1Prob = simulationResult.team1WinProbability;
    const team2Prob = simulationResult.team2WinProbability;
    const confidence = Math.abs(team1Prob - team2Prob);

    return {
      team1Probability: team1Prob,
      team2Probability: team2Prob,
      confidence: confidence,
      algorithm: 'monteCarlo',
      simulations: simulationResult.simulations,
      details: {
        team1Stats,
        team2Stats,
        simulationResult
      }
    };
  }

  /**
   * Live betting algorithm - Dimers.com style with real-time updates
   */
  calculateLive(team1, team2, options = {}) {
    const {
      isHomeTeam1 = true,
      currentScore = { team1: 0, team2: 0 },
      timeRemaining = 1.0,
      momentum = { team1: 0, team2: 0 },
      gameEvents = []
    } = options;

    // Use Monte Carlo with live game state
    const liveResult = this.calculateMonteCarlo(team1, team2, {
      isHomeTeam1,
      currentScore,
      timeRemaining,
      momentum
    });

    // Adjust for game events (injuries, weather, etc.)
    const eventAdjustment = this.calculateEventAdjustment(gameEvents);
    
    let team1Prob = liveResult.team1Probability;
    let team2Prob = liveResult.team2Probability;

    // Apply event adjustments
    team1Prob += eventAdjustment.team1;
    team2Prob += eventAdjustment.team2;

    // Normalize probabilities
    const total = team1Prob + team2Prob;
    team1Prob = team1Prob / total;
    team2Prob = team2Prob / total;

    // Live betting has higher confidence due to current game state
    const confidence = Math.abs(team1Prob - team2Prob) + 0.1; // Boost confidence for live games

    return {
      team1Probability: team1Prob,
      team2Probability: team2Prob,
      confidence: Math.min(confidence, 0.9), // Cap at 90%
      algorithm: 'live',
      isLive: true,
      gameState: {
        currentScore,
        timeRemaining,
        momentum,
        gameEvents
      },
      details: {
        ...liveResult.details,
        eventAdjustment
      }
    };
  }

  /**
   * Calculate event adjustments for live games
   */
  calculateEventAdjustment(gameEvents) {
    let team1Adjustment = 0;
    let team2Adjustment = 0;

    gameEvents.forEach(event => {
      const { type, team, impact } = event;
      
      switch (type) {
        case 'injury':
          if (team === 1) team1Adjustment -= impact;
          if (team === 2) team2Adjustment -= impact;
          break;
        case 'momentum':
          if (team === 1) team1Adjustment += impact;
          if (team === 2) team2Adjustment += impact;
          break;
        case 'weather':
          // Weather affects both teams equally
          team1Adjustment += impact * 0.5;
          team2Adjustment += impact * 0.5;
          break;
      }
    });

    return {
      team1: team1Adjustment,
      team2: team2Adjustment
    };
  }

  /**
   * Composite algorithm combining multiple methods - Enhanced with Monte Carlo
   */
  calculateComposite(team1, team2, options = {}) {
    const basicResult = this.calculateBasic(team1, team2, options);
    const advancedResult = this.calculateAdvanced(team1, team2, options);
    const eloResult = this.calculateElo(team1, team2, options);
    const monteCarloResult = this.calculateMonteCarlo(team1, team2, options);

    // Weight the different algorithms - Monte Carlo gets highest weight
    const weights = {
      basic: 0.1,
      advanced: 0.3,
      elo: 0.2,
      monteCarlo: 0.4
    };

    const team1Prob = 
      basicResult.team1Probability * weights.basic +
      advancedResult.team1Probability * weights.advanced +
      eloResult.team1Probability * weights.elo +
      monteCarloResult.team1Probability * weights.monteCarlo;

    const team2Prob = 1 - team1Prob;

    // Use the highest confidence from the algorithms
    const confidence = Math.max(
      basicResult.confidence,
      advancedResult.confidence,
      eloResult.confidence,
      monteCarloResult.confidence
    );

    return {
      team1Probability: team1Prob,
      team2Probability: team2Prob,
      confidence: confidence,
      algorithm: 'composite',
      subResults: {
        basic: basicResult,
        advanced: advancedResult,
        elo: eloResult,
        monteCarlo: monteCarloResult
      }
    };
  }

  /**
   * Get team statistics with fallback for partial matches and missing teams
   */
  getTeamStats(teamName) {
    // Direct match
    if (this.teamStats[teamName]) {
      return this.teamStats[teamName];
    }

    // Partial match
    const partialMatch = Object.keys(this.teamStats).find(team => 
      team.toLowerCase().includes(teamName.toLowerCase()) || 
      teamName.toLowerCase().includes(team.toLowerCase())
    );

    if (partialMatch) {
      return this.teamStats[partialMatch];
    }

    // Return default stats for unknown teams instead of null
    return this.getDefaultTeamStats(teamName);
  }

  /**
   * Get default team statistics for unknown teams based on league averages
   */
  getDefaultTeamStats(teamName) {
    // Determine league based on team name patterns or default to NFL
    const league = this.detectLeagueFromTeamName(teamName);
    
    // Default stats based on league averages
    const defaultStats = {
      NFL: {
        wins: 8, losses: 9, winPercentage: 47.1,
        offense: 72, defense: 75, specialTeams: 70,
        recentForm: 0.45, homeRecord: 0.5, awayRecord: 0.44,
        conference: "Unknown", division: "Unknown"
      },
      NBA: {
        wins: 41, losses: 41, winPercentage: 50.0,
        offense: 75, defense: 75, specialTeams: 70,
        recentForm: 0.5, homeRecord: 0.55, awayRecord: 0.45,
        conference: "Unknown", division: "Unknown"
      },
      MLB: {
        wins: 81, losses: 81, winPercentage: 50.0,
        offense: 75, defense: 75, specialTeams: 70,
        recentForm: 0.5, homeRecord: 0.52, awayRecord: 0.48,
        conference: "Unknown", division: "Unknown"
      }
    };

    return defaultStats[league] || defaultStats.NFL;
  }

  /**
   * Detect league from team name patterns
   */
  detectLeagueFromTeamName(teamName) {
    const name = teamName.toLowerCase();
    
    // NBA team indicators
    if (name.includes('lakers') || name.includes('warriors') || name.includes('celtics') || 
        name.includes('heat') || name.includes('nuggets') || name.includes('bucks') ||
        name.includes('knicks') || name.includes('nets') || name.includes('bulls') ||
        name.includes('pistons') || name.includes('pacers') || name.includes('cavaliers') ||
        name.includes('raptors') || name.includes('hawks') || name.includes('hornets') ||
        name.includes('magic') || name.includes('wizards') || name.includes('thunder') ||
        name.includes('blazers') || name.includes('jazz') || name.includes('kings') ||
        name.includes('suns') || name.includes('clippers') || name.includes('timberwolves') ||
        name.includes('mavericks') || name.includes('rockets') || name.includes('grizzlies') ||
        name.includes('pelicans') || name.includes('spurs')) {
      return 'NBA';
    }
    
    // MLB team indicators
    if (name.includes('dodgers') || name.includes('yankees') || name.includes('braves') ||
        name.includes('astros') || name.includes('red sox') || name.includes('giants') ||
        name.includes('phillies') || name.includes('cubs') || name.includes('brewers') ||
        name.includes('blue jays') || name.includes('orioles') || name.includes('guardians') ||
        name.includes('rangers') || name.includes('angels') || name.includes('athletics') ||
        name.includes('mariners') || name.includes('tigers') || name.includes('twins') ||
        name.includes('white sox') || name.includes('royals') || name.includes('indians') ||
        name.includes('rays') || name.includes('marlins') || name.includes('nationals') ||
        name.includes('mets') || name.includes('padres') || name.includes('diamondbacks') ||
        name.includes('rockies') || name.includes('cardinals') || name.includes('pirates') ||
        name.includes('reds')) {
      return 'MLB';
    }
    
    // Default to NFL for American football teams
    return 'NFL';
  }

  /**
   * Calculate prediction confidence level
   */
  getConfidenceLevel(confidence) {
    if (confidence >= 0.3) return { level: 'High', color: '#22c55e', description: 'Very confident prediction' };
    if (confidence >= 0.15) return { level: 'Medium', color: '#f59e0b', description: 'Moderately confident' };
    return { level: 'Low', color: '#ef4444', description: 'Uncertain prediction' };
  }

  /**
   * Format results for display
   */
  formatResults(result) {
    const team1Percentage = Math.round(result.team1Probability * 100);
    const team2Percentage = Math.round(result.team2Probability * 100);
    const confidence = this.getConfidenceLevel(result.confidence);

    return {
      team1Percentage,
      team2Percentage,
      confidence,
      algorithm: result.algorithm,
      details: result
    };
  }

  /**
   * Predict league champion using enhanced high-confidence algorithm
   */
  predictChampion(league) {
    // Get all teams for the specified league
    const teams = Object.entries(this.teamStats)
      .filter(([name, stats]) => {
        const detectedLeague = this.detectLeagueFromTeamName(name);
        return detectedLeague === league;
      })
      .map(([name, stats]) => ({ name, ...stats }));

    if (teams.length === 0) {
      throw new Error(`No teams found for league: ${league}`);
    }

    // Run multiple prediction algorithms for higher confidence
    const results = this.runMultiplePredictionAlgorithms(teams, league);
    
    // Calculate detailed team statistics for analysis
    const teamCalculations = teams.map(team => ({
      name: team.name,
      enhancedStrength: this.calculateEnhancedTeamStrength(team),
      playoffMultiplier: this.calculatePlayoffMultiplier(team),
      consistencyFactor: this.calculateConsistencyFactor(team),
      eloRating: this.calculateEloRating(team),
      playoffSeed: this.calculatePlayoffSeed(team),
      stats: this.teamStats[team.name] || team
    }));
    
    // Combine results using weighted ensemble
    const finalRankings = this.combinePredictionResults(results, teams);
    
    // Calculate enhanced confidence metrics
    const enhancedRankings = finalRankings.map((team, index) => {
      const teamCalculation = teamCalculations.find(tc => tc.name === team.name);
      const confidence = this.calculateEnhancedConfidence(team, finalRankings, index);
      return {
        team: team.name,
        championshipProbability: team.probability,
        confidence: confidence,
        stats: this.teamStats[team.name] || {},
        analysis: this.getEnhancedTeamAnalysis(team.name, team.probability, confidence),
        calculation: teamCalculation
      };
    });

    return {
      league,
      champion: enhancedRankings[0],
      topContenders: enhancedRankings.slice(0, 5),
      allTeams: enhancedRankings,
      algorithmDetails: {
        algorithms: results.map(result => ({
          name: result.algorithm,
          weight: result.weight,
          simulations: result.simulations || 'N/A',
          description: this.getAlgorithmDescription(result.algorithm)
        })),
        teamCalculations: teamCalculations,
        ensembleWeights: results.map(r => ({ name: r.algorithm, weight: r.weight }))
      },
      simulationDetails: {
        totalSimulations: 50000,
        algorithmsUsed: results.length,
        averageConfidence: enhancedRankings.reduce((sum, team) => sum + (team.confidence.level === 'High' ? 1 : team.confidence.level === 'Medium' ? 0.5 : 0), 0) / enhancedRankings.length,
        predictionReliability: this.calculatePredictionReliability(enhancedRankings)
      }
    };
  }

  /**
   * Run multiple prediction algorithms for ensemble approach
   */
  runMultiplePredictionAlgorithms(teams, league) {
    const results = [];
    
    // Algorithm 1: Enhanced Monte Carlo with reduced randomness
    results.push(this.runEnhancedMonteCarlo(teams, league, 15000, 0.15));
    
    // Algorithm 2: Statistical ranking-based prediction
    results.push(this.runStatisticalPrediction(teams, league));
    
    // Algorithm 3: Elo-based playoff simulation
    results.push(this.runEloBasedPrediction(teams, league, 10000));
    
    // Algorithm 4: Strength-weighted bracket simulation
    results.push(this.runStrengthWeightedSimulation(teams, league, 20000));
    
    return results;
  }

  /**
   * Enhanced Monte Carlo with reduced randomness
   */
  runEnhancedMonteCarlo(teams, league, numSimulations, randomnessFactor = 0.15) {
    const simulationResults = {};
    
    teams.forEach(team => {
      simulationResults[team.name] = { championships: 0, appearances: 0 };
    });

    for (let sim = 0; sim < numSimulations; sim++) {
      const champion = this.runSingleEnhancedPlayoffSimulation(teams, league, randomnessFactor);
      if (champion) {
        simulationResults[champion.name].championships++;
      }
    }

    return {
      algorithm: 'Enhanced Monte Carlo',
      results: simulationResults,
      simulations: numSimulations,
      weight: 0.4 // Higher weight for this reliable method
    };
  }

  /**
   * Single enhanced playoff simulation with better seeding
   */
  runSingleEnhancedPlayoffSimulation(teams, league, randomnessFactor = 0.15) {
    // Enhanced team strength calculation
    const enhancedTeams = teams.map(team => {
      const baseStrength = this.calculateEnhancedTeamStrength(team);
      const playoffMultiplier = this.calculatePlayoffMultiplier(team);
      const consistencyFactor = this.calculateConsistencyFactor(team);
      
      return {
        ...team,
        simulationStrength: baseStrength * playoffMultiplier * consistencyFactor + 
                           (Math.random() - 0.5) * randomnessFactor
      };
    });

    // Proper playoff seeding based on regular season performance
    enhancedTeams.sort((a, b) => {
      const aSeed = this.calculatePlayoffSeed(a);
      const bSeed = this.calculatePlayoffSeed(b);
      return aSeed - bSeed;
    });

    return this.simulatePlayoffBracket(enhancedTeams, league);
  }

  /**
   * Run statistical prediction based on team metrics
   */
  runStatisticalPrediction(teams, league) {
    const results = {};
    
    teams.forEach(team => {
      const strengthScore = this.calculateEnhancedTeamStrength(team);
      const playoffProbability = this.calculatePlayoffProbability(strengthScore, teams.length);
      const championshipFactor = this.getChampionshipFactor(league);
      
      results[team.name] = {
        championships: Math.round(strengthScore * playoffProbability * championshipFactor * 10000),
        appearances: Math.round(playoffProbability * 10000)
      };
    });

    return {
      algorithm: 'Statistical Prediction',
      results: results,
      simulations: 'Analytical',
      weight: 0.3
    };
  }

  /**
   * Elo-based prediction system
   */
  runEloBasedPrediction(teams, league, numSimulations) {
    const results = {};
    
    teams.forEach(team => {
      results[team.name] = { championships: 0, appearances: 0 };
    });

    for (let sim = 0; sim < numSimulations; sim++) {
      const champion = this.runEloSimulation(teams, league);
      if (champion) {
        results[champion.name].championships++;
      }
    }

    return {
      algorithm: 'Elo-based Simulation',
      results: results,
      simulations: numSimulations,
      weight: 0.2
    };
  }

  /**
   * Strength-weighted bracket simulation
   */
  runStrengthWeightedSimulation(teams, league, numSimulations) {
    const results = {};
    
    teams.forEach(team => {
      results[team.name] = { championships: 0, appearances: 0 };
    });

    for (let sim = 0; sim < numSimulations; sim++) {
      const champion = this.runSingleStrengthWeightedSimulation(teams, league);
      if (champion) {
        results[champion.name].championships++;
      }
    }

    return {
      algorithm: 'Strength-weighted Bracket',
      results: results,
      simulations: numSimulations,
      weight: 0.1
    };
  }

  /**
   * Run single strength-weighted simulation
   */
  runSingleStrengthWeightedSimulation(teams, league) {
    const weightedTeams = teams.map(team => ({
      ...team,
      weight: this.calculateEnhancedTeamStrength(team) + (Math.random() - 0.5) * 0.1
    }));

    return this.simulatePlayoffBracket(weightedTeams, league);
  }

  /**
   * Get playoff structure based on league
   */
  getPlayoffStructure(league, teams) {
    if (league === 'NFL') {
      // NFL: 14 teams (7 per conference)
      return {
        wildCard: { participants: 6, perConference: 3 },
        divisional: { participants: 8, perConference: 4 },
        championship: { participants: 4, perConference: 2 },
        superBowl: { participants: 2 }
      };
    } else if (league === 'NBA') {
      // NBA: 16 teams (8 per conference)
      return {
        firstRound: { participants: 16, perConference: 8 },
        secondRound: { participants: 8, perConference: 4 },
        conferenceFinals: { participants: 4, perConference: 2 },
        finals: { participants: 2 }
      };
    } else if (league === 'MLB') {
      // MLB: 12 teams
      return {
        wildCard: { participants: 8 },
        divisional: { participants: 8 },
        championship: { participants: 4 },
        worldSeries: { participants: 2 }
      };
    }
    return {};
  }

  /**
   * Simulate playoffs using Monte Carlo method
   */
  simulatePlayoffs(playoffStructure, league) {
    const simulationResults = {};
    const numSimulations = 10000;

    // Get league teams
    const teams = Object.entries(this.teamStats)
      .filter(([name, stats]) => {
        const detectedLeague = this.detectLeagueFromTeamName(name);
        return detectedLeague === league;
      })
      .map(([name, stats]) => ({ name, ...stats }));

    // Initialize results
    teams.forEach(team => {
      simulationResults[team.name] = {
        championships: 0,
        appearances: 0
      };
    });

    // Run simulations
    for (let sim = 0; sim < numSimulations; sim++) {
      const champion = this.runSinglePlayoffSimulation(teams, league);
      if (champion) {
        simulationResults[champion.name].championships++;
      }
    }

    return simulationResults;
  }

  /**
   * Run a single playoff simulation
   */
  runSinglePlayoffSimulation(teams, league) {
    // Create a copy of teams with random seeding factors
    const shuffledTeams = teams.map(team => ({
      ...team,
      simulationStrength: this.calculateTeamStrength(team) + (Math.random() - 0.5) * 0.3
    }));

    // Sort by simulation strength for seeding
    shuffledTeams.sort((a, b) => b.simulationStrength - a.simulationStrength);

    // Simulate playoff rounds
    let remainingTeams = [...shuffledTeams];

    while (remainingTeams.length > 1) {
      const nextRound = [];
      
      // Pair teams for current round
      for (let i = 0; i < remainingTeams.length; i += 2) {
        if (i + 1 < remainingTeams.length) {
          const team1 = remainingTeams[i];
          const team2 = remainingTeams[i + 1];
          
          // Determine winner based on strength and randomness
          const team1WinProbability = this.calculateMatchupProbability(
            team1.simulationStrength, 
            team2.simulationStrength
          );
          
          const winner = Math.random() < team1WinProbability ? team1 : team2;
          nextRound.push(winner);
        } else {
          // Odd number of teams, last team advances
          nextRound.push(remainingTeams[i]);
        }
      }
      
      remainingTeams = nextRound;
    }

    return remainingTeams[0] || null;
  }

  /**
   * Calculate team strength for simulation
   */
  calculateTeamStrength(team) {
    const baseStrength = (
      (team.winPercentage || 50) / 100 * 0.4 +
      ((team.offense || 50) / 100) * 0.3 +
      ((team.defense || 50) / 100) * 0.2 +
      (team.recentForm || 0.5) * 0.1
    );

    return Math.max(0.1, Math.min(1.0, baseStrength));
  }

  /**
   * Calculate matchup probability between two team strengths
   */
  calculateMatchupProbability(strength1, strength2) {
    const total = strength1 + strength2;
    return total > 0 ? strength1 / total : 0.5;
  }

  /**
   * Calculate championship odds from simulation results
   */
  calculateChampionshipOdds(simulationResults, teams) {
    const totalSimulations = Object.values(simulationResults).reduce(
      (sum, result) => sum + result.championships, 
      0
    ) || 1;

    return teams.map(team => ({
      name: team.name,
      probability: simulationResults[team.name]?.championships / 10000 || 0
    }));
  }

  /**
   * Get team analysis for champion prediction
   */
  getTeamAnalysis(teamName, probability) {
    const stats = this.teamStats[teamName];
    if (!stats) return { analysis: 'Insufficient data', strengths: [], weaknesses: [] };

    const strengths = [];
    const weaknesses = [];

    // Analyze strengths
    if ((stats.winPercentage || 0) > 65) strengths.push('Strong regular season record');
    if ((stats.offense || 0) > 80) strengths.push('Elite offense');
    if ((stats.defense || 0) > 80) strengths.push('Elite defense');
    if ((stats.recentForm || 0) > 0.7) strengths.push('Hot recent form');
    if ((stats.homeRecord || 0) > 0.7) strengths.push('Strong home record');

    // Analyze weaknesses
    if ((stats.winPercentage || 100) < 45) weaknesses.push('Poor regular season record');
    if ((stats.offense || 100) < 60) weaknesses.push('Offensive struggles');
    if ((stats.defense || 100) < 60) weaknesses.push('Defensive issues');
    if ((stats.recentForm || 1) < 0.4) weaknesses.push('Cold recent form');
    if ((stats.awayRecord || 1) < 0.4) weaknesses.push('Poor away record');

    let analysis = '';
    if (probability > 0.15) {
      analysis = 'Elite championship contender with strong probability to win';
    } else if (probability > 0.08) {
      analysis = 'Strong playoff contender with legitimate championship chances';
    } else if (probability > 0.03) {
      analysis = 'Solid playoff team with outside championship shot';
    } else {
      analysis = 'Long shot to win championship but could surprise';
    }

    return { analysis, strengths, weaknesses };
  }

  /**
   * Enhanced team strength calculation with more factors
   */
  calculateEnhancedTeamStrength(team) {
    const winPct = (team.winPercentage || 50) / 100;
    const offense = (team.offense || 50) / 100;
    const defense = (team.defense || 50) / 100;
    const recentForm = team.recentForm || 0.5;
    const homeRecord = team.homeRecord || 0.5;
    const awayRecord = team.awayRecord || 0.5;
    
    // Enhanced formula with more weight to win percentage and consistency
    const baseStrength = (
      winPct * 0.45 +           // Higher weight for actual win percentage
      offense * 0.25 +          // Offense importance
      defense * 0.20 +          // Defense importance
      recentForm * 0.15 +       // Recent form factor
      ((homeRecord + awayRecord) / 2) * 0.10  // Overall record consistency
    );

    return Math.max(0.05, Math.min(1.0, baseStrength));
  }

  /**
   * Calculate playoff performance multiplier
   */
  calculatePlayoffMultiplier(team) {
    const stats = this.teamStats[team.name] || team;
    
    // Teams with better records typically perform better in playoffs
    const winPct = (stats.winPercentage || 50) / 100;
    
    // Elite teams get a slight boost, mediocre teams get a penalty
    if (winPct > 0.7) return 1.15;  // Elite teams
    if (winPct > 0.6) return 1.05;  // Good teams
    if (winPct > 0.5) return 1.0;   // Average teams
    if (winPct > 0.4) return 0.95;  // Below average
    return 0.85; // Poor teams
  }

  /**
   * Calculate consistency factor based on record variance
   */
  calculateConsistencyFactor(team) {
    const stats = this.teamStats[team.name] || team;
    const homeRecord = stats.homeRecord || 0.5;
    const awayRecord = stats.awayRecord || 0.5;
    
    // Teams with consistent home/away records are more reliable
    const consistency = 1 - Math.abs(homeRecord - awayRecord);
    return Math.max(0.8, Math.min(1.2, consistency));
  }

  /**
   * Calculate proper playoff seed based on performance
   */
  calculatePlayoffSeed(team) {
    const strength = this.calculateEnhancedTeamStrength(team);
    const multiplier = this.calculatePlayoffMultiplier(team);
    const consistency = this.calculateConsistencyFactor(team);
    
    // Lower seed number = better position
    return Math.round((1 - (strength * multiplier * consistency)) * 1000);
  }

  /**
   * Calculate playoff probability based on strength
   */
  calculatePlayoffProbability(strengthScore, totalTeams) {
    // Normalize strength score to probability based on league size
    const averageStrength = 0.5;
    const normalizedScore = Math.max(0.01, Math.min(0.99, strengthScore));
    
    // Higher strength = higher playoff probability
    return normalizedScore * 1.2; // Boost to account for playoff variance
  }

  /**
   * Get championship factor based on league type
   */
  getChampionshipFactor(league) {
    // Different leagues have different championship difficulty
    switch (league) {
      case 'NFL': return 0.95; // Harder due to single elimination
      case 'NBA': return 1.05; // Best of 7 series favor better teams
      case 'MLB': return 0.90; // Higher variance due to best of 5/7
      default: return 1.0;
    }
  }

  /**
   * Run Elo-based simulation
   */
  runEloSimulation(teams, league) {
    const eloTeams = teams.map(team => ({
      ...team,
      eloRating: this.calculateEloRating(team)
    }));

    // Sort by Elo rating and run bracket simulation
    eloTeams.sort((a, b) => b.eloRating - a.eloRating);
    return this.simulatePlayoffBracket(eloTeams, league);
  }

  /**
   * Calculate Elo rating for team
   */
  calculateEloRating(team) {
    const baseElo = 1500;
    const winPct = (team.winPercentage || 50) / 100;
    const offense = (team.offense || 50) / 100;
    const defense = (team.defense || 50) / 100;
    const recentForm = team.recentForm || 0.5;
    
    // Convert win percentage and other factors to Elo rating
    const eloAdjustment = (winPct - 0.5) * 800; // +/- 400 points based on win%
    const offenseAdjustment = (offense - 0.5) * 200; // +/- 100 for offense
    const defenseAdjustment = (defense - 0.5) * 200; // +/- 100 for defense
    const formAdjustment = (recentForm - 0.5) * 300; // +/- 150 for recent form
    
    return Math.round(baseElo + eloAdjustment + offenseAdjustment + defenseAdjustment + formAdjustment);
  }

  /**
   * Simulate playoff bracket with proper seeding
   */
  simulatePlayoffBracket(teams, league) {
    let remainingTeams = [...teams];
    
    while (remainingTeams.length > 1) {
      const nextRound = [];
      
      // Proper bracket simulation
      for (let i = 0; i < remainingTeams.length; i += 2) {
        if (i + 1 < remainingTeams.length) {
          const team1 = remainingTeams[i];
          const team2 = remainingTeams[i + 1];
          
          const winner = this.determineWinner(team1, team2);
          nextRound.push(winner);
        } else {
          nextRound.push(remainingTeams[i]);
        }
      }
      
      remainingTeams = nextRound;
    }

    return remainingTeams[0] || null;
  }

  /**
   * Determine winner between two teams with enhanced probability
   */
  determineWinner(team1, team2) {
    let strength1, strength2;
    
    if (team1.simulationStrength !== undefined) {
      strength1 = team1.simulationStrength;
    } else if (team1.eloRating !== undefined) {
      strength1 = team1.eloRating / 2000; // Normalize Elo to 0-1
    } else if (team1.weight !== undefined) {
      strength1 = team1.weight;
    } else {
      strength1 = this.calculateEnhancedTeamStrength(team1);
    }
    
    if (team2.simulationStrength !== undefined) {
      strength2 = team2.simulationStrength;
    } else if (team2.eloRating !== undefined) {
      strength2 = team2.eloRating / 2000;
    } else if (team2.weight !== undefined) {
      strength2 = team2.weight;
    } else {
      strength2 = this.calculateEnhancedTeamStrength(team2);
    }

    // Enhanced probability calculation with reduced randomness
    const prob = this.calculateEnhancedMatchupProbability(strength1, strength2);
    return Math.random() < prob ? team1 : team2;
  }

  /**
   * Enhanced matchup probability calculation
   */
  calculateEnhancedMatchupProbability(strength1, strength2) {
    // Use sigmoid function for more realistic probability curves
    const diff = strength1 - strength2;
    const sigmoid = 1 / (1 + Math.exp(-diff * 6)); // Amplify differences
    return Math.max(0.1, Math.min(0.9, sigmoid)); // Clamp to realistic range
  }

  /**
   * Combine results from multiple algorithms
   */
  combinePredictionResults(algorithmResults, teams) {
    const combinedResults = {};
    
    teams.forEach(team => {
      let weightedChampionships = 0;
      let totalWeight = 0;
      
      algorithmResults.forEach(result => {
        const weight = result.weight;
        const championships = result.results[team.name]?.championships || 0;
        weightedChampionships += championships * weight;
        totalWeight += weight;
      });
      
      combinedResults[team.name] = {
        championships: weightedChampionships / totalWeight,
        probability: weightedChampionships / (totalWeight * 50000) // Normalize to total sims
      };
    });

    return Object.entries(combinedResults)
      .map(([name, data]) => ({ name, probability: data.probability }))
      .sort((a, b) => b.probability - a.probability);
  }

  /**
   * Calculate enhanced confidence level
   */
  calculateEnhancedConfidence(team, allTeams, rankIndex) {
    const probability = team.probability;
    const nextTeamProbability = allTeams[rankIndex + 1]?.probability || 0;
    const probabilityGap = probability - nextTeamProbability;
    
    // Enhanced confidence calculation considers rank position and probability gap
    let confidenceScore = probability;
    
    // Boost confidence for clear leaders
    if (rankIndex === 0 && probabilityGap > 0.05) {
      confidenceScore += 0.2;
    }
    
    // Higher confidence thresholds for better predictions
    if (confidenceScore >= 0.25) return { level: 'High', color: '#22c55e', description: 'Very confident prediction' };
    if (confidenceScore >= 0.12) return { level: 'Medium', color: '#f59e0b', description: 'Moderately confident' };
    return { level: 'Low', color: '#ef4444', description: 'Uncertain prediction' };
  }

  /**
   * Get enhanced team analysis
   */
  getEnhancedTeamAnalysis(teamName, probability, confidence) {
    const analysis = this.getTeamAnalysis(teamName, probability);
    
    // Add confidence-based insights
    if (confidence.level === 'High') {
      analysis.reliability = 'High confidence - Strong statistical backing';
    } else if (confidence.level === 'Medium') {
      analysis.reliability = 'Medium confidence - Multiple factors favor this team';
    } else {
      analysis.reliability = 'Low confidence - Wide range of possible outcomes';
    }
    
    return analysis;
  }

  /**
   * Calculate overall prediction reliability
   */
  calculatePredictionReliability(rankings) {
    const top5Probabilities = rankings.slice(0, 5).map(team => team.championshipProbability);
    const topTeamProbability = top5Probabilities[0] || 0;
    const othersAverage = top5Probabilities.slice(1).reduce((sum, prob) => sum + prob, 0) / 4;
    
    // Higher reliability when top team is clearly ahead
    return topTeamProbability > othersAverage * 1.5 ? 'High' : 
           topTeamProbability > othersAverage * 1.2 ? 'Medium' : 'Low';
  }

  /**
   * Get algorithm description for UI display
   */
  getAlgorithmDescription(algorithmName) {
    const descriptions = {
      'Enhanced Monte Carlo': 'Uses advanced team strength calculations with playoff multipliers and consistency factors. Runs 15,000 simulations with reduced randomness for more reliable results.',
      'Statistical Prediction': 'Analyzes team performance metrics using weighted formulas including win percentage (45%), offense (25%), defense (20%), recent form (15%), and consistency (10%).',
      'Elo-based Simulation': 'Converts team statistics to Elo ratings and simulates playoff brackets using chess-inspired rating system. Runs 10,000 simulations with proper bracket seeding.',
      'Strength-weighted Bracket': 'Uses enhanced team strength calculations with minimal randomness variance. Runs 20,000 simulations focusing on consistency and reliability.'
    };
    
    return descriptions[algorithmName] || 'Advanced prediction algorithm using multiple statistical methods.';
  }
}

// Create singleton instance
export const winPercentageCalculator = new WinPercentageCalculator();

// Export convenience functions
export const calculateWinPercentage = (team1, team2, options = {}) => {
  return winPercentageCalculator.calculateWinPercentage(team1, team2, options);
};

export const formatWinPercentage = (result) => {
  return winPercentageCalculator.formatResults(result);
};

export const predictChampion = (league) => {
  return winPercentageCalculator.predictChampion(league);
};
