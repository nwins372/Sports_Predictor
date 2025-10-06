/**
 * Advanced Win Percentage Calculator
 * Implements multiple algorithms for more accurate predictions
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
 * Advanced Win Percentage Calculator Class
 */
export class WinPercentageCalculator {
  constructor() {
    this.teamStats = ENHANCED_TEAM_STATS;
    this.algorithms = {
      basic: this.calculateBasic.bind(this),
      advanced: this.calculateAdvanced.bind(this),
      elo: this.calculateElo.bind(this),
      composite: this.calculateComposite.bind(this)
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

    if (!homeStats || !awayStats) {
      return { team1Probability: 0.5, team2Probability: 0.5, confidence: 0.1 };
    }

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

    if (!homeStats || !awayStats) {
      return { team1Probability: 0.5, team2Probability: 0.5, confidence: 0.1 };
    }

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

    if (!homeStats || !awayStats) {
      return { team1Probability: 0.5, team2Probability: 0.5, confidence: 0.1 };
    }

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
   * Composite algorithm combining multiple methods
   */
  calculateComposite(team1, team2, options = {}) {
    const basicResult = this.calculateBasic(team1, team2, options);
    const advancedResult = this.calculateAdvanced(team1, team2, options);
    const eloResult = this.calculateElo(team1, team2, options);

    // Weight the different algorithms
    const weights = {
      basic: 0.2,
      advanced: 0.5,
      elo: 0.3
    };

    const team1Prob = 
      basicResult.team1Probability * weights.basic +
      advancedResult.team1Probability * weights.advanced +
      eloResult.team1Probability * weights.elo;

    const team2Prob = 1 - team1Prob;

    // Use the highest confidence from the algorithms
    const confidence = Math.max(
      basicResult.confidence,
      advancedResult.confidence,
      eloResult.confidence
    );

    return {
      team1Probability: team1Prob,
      team2Probability: team2Prob,
      confidence: confidence,
      algorithm: 'composite',
      subResults: {
        basic: basicResult,
        advanced: advancedResult,
        elo: eloResult
      }
    };
  }

  /**
   * Get team statistics with fallback for partial matches
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

    return null;
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
