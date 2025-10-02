// Sports API Service for live data integration
class SportsAPIService {
  constructor() {
    // Multiple API sources for redundancy and better coverage
    this.apis = {
      primary: {
        name: 'ESPN',
        baseURL: 'https://site.api.espn.com/apis/site/v2/sports',
        endpoints: {
          nfl: '/football/nfl',
          mlb: '/baseball/mlb', 
          nba: '/basketball/nba'
        }
      },
      secondary: {
        name: 'SportsData',
        baseURL: 'https://api.sportsdata.io/v3',
        // Note: Requires API key for production use
        endpoints: {
          nfl: '/nfl/scores/json',
          mlb: '/mlb/scores/json', 
          nba: '/nba/scores/json'
        }
      }
    };

    // Cache configuration
    this.cache = new Map();
    this.cacheConfig = {
      schedules: 6 * 60 * 60 * 1000,    // 6 hours
      scores: 5 * 60 * 1000,            // 5 minutes during games
      standings: 24 * 60 * 60 * 1000,   // 24 hours
      teamStats: 12 * 60 * 60 * 1000    // 12 hours
    };
  }

  // Generic cache management
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const { data, timestamp, ttl } = cached;
    if (Date.now() - timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }
    return data;
  }

  setCachedData(key, data, ttl) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Fetch MLB data from ESPN API
  async fetchMLBData() {
    const cacheKey = 'mlb_schedules';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Get current season games
      const response = await fetch(`${this.apis.primary.baseURL}${this.apis.primary.endpoints.mlb}/scoreboard`);
      const data = await response.json();
      
      const games = data.events?.map(event => ({
        MatchNumber: event.id,
        RoundNumber: 1, // ESPN doesn't provide round numbers for MLB
        DateUtc: event.date,
        Location: event.competitions[0]?.venue?.fullName || 'TBD',
        HomeTeam: event.competitions[0]?.competitors?.find(c => c.homeAway === 'home')?.team?.displayName || 'TBD',
        AwayTeam: event.competitions[0]?.competitors?.find(c => c.homeAway === 'away')?.team?.displayName || 'TBD',
        Group: null,
        HomeTeamScore: event.competitions[0]?.competitors?.find(c => c.homeAway === 'home')?.score || null,
        AwayTeamScore: event.competitions[0]?.competitors?.find(c => c.homeAway === 'away')?.score || null,
        Status: event.status?.type?.name || 'scheduled',
        IsLive: event.status?.type?.state === 'in'
      })) || [];

      // Get additional games from season schedule
      const seasonResponse = await fetch(`${this.apis.primary.baseURL}${this.apis.primary.endpoints.mlb}/teams`);
      const seasonData = await seasonResponse.json();
      
      this.setCachedData(cacheKey, games, this.cacheConfig.schedules);
      return games;
    } catch (error) {
      console.error('Error fetching MLB data:', error);
      // Fallback to static data if API fails
      return this.getFallbackMLBData();
    }
  }

  // Fetch NFL data from ESPN API
  async fetchNFLData() {
    const cacheKey = 'nfl_schedules';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.apis.primary.baseURL}${this.apis.primary.endpoints.nfl}/scoreboard`);
      const data = await response.json();
      
      const games = data.events?.map(event => ({
        MatchNumber: event.id,
        RoundNumber: event.week?.number || 1,
        DateUtc: event.date,
        Location: event.competitions[0]?.venue?.fullName || 'TBD',
        HomeTeam: event.competitions[0]?.competitors?.find(c => c.homeAway === 'home')?.team?.displayName || 'TBD',
        AwayTeam: event.competitions[0]?.competitors?.find(c => c.homeAway === 'away')?.team?.displayName || 'TBD',
        Group: null,
        HomeTeamScore: event.competitions[0]?.competitors?.find(c => c.homeAway === 'home')?.score || null,
        AwayTeamScore: event.competitions[0]?.competitors?.find(c => c.homeAway === 'away')?.score || null,
        Status: event.status?.type?.name || 'scheduled',
        IsLive: event.status?.type?.state === 'in'
      })) || [];

      this.setCachedData(cacheKey, games, this.cacheConfig.schedules);
      return games;
    } catch (error) {
      console.error('Error fetching NFL data:', error);
      return this.getFallbackNFLData();
    }
  }

  // Fetch NBA data from ESPN API
  async fetchNBAData() {
    const cacheKey = 'nba_schedules';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.apis.primary.baseURL}${this.apis.primary.endpoints.nba}/scoreboard`);
      const data = await response.json();
      
      const games = data.events?.map(event => ({
        MatchNumber: event.id,
        RoundNumber: 1,
        DateUtc: event.date,
        Location: event.competitions[0]?.venue?.fullName || 'TBD',
        HomeTeam: event.competitions[0]?.competitors?.find(c => c.homeAway === 'home')?.team?.displayName || 'TBD',
        AwayTeam: event.competitions[0]?.competitors?.find(c => c.homeAway === 'away')?.team?.displayName || 'TBD',
        Group: null,
        HomeTeamScore: event.competitions[0]?.competitors?.find(c => c.homeAway === 'home')?.score || null,
        AwayTeamScore: event.competitions[0]?.competitors?.find(c => c.homeAway === 'away')?.score || null,
        Status: event.status?.type?.name || 'scheduled',
        IsLive: event.status?.type?.state === 'in'
      })) || [];

      this.setCachedData(cacheKey, games, this.cacheConfig.schedules);
      return games;
    } catch (error) {
      console.error('Error fetching NBA data:', error);
      return this.getFallbackNBAData();
    }
  }

  // Fetch team statistics for win percentage calculations
  async fetchTeamStats(sport) {
    const cacheKey = `${sport}_team_stats`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      let endpoint = '';
      switch (sport.toLowerCase()) {
        case 'mlb':
          endpoint = `${this.apis.primary.baseURL}${this.apis.primary.endpoints.mlb}/standings`;
          break;
        case 'nfl':
          endpoint = `${this.apis.primary.baseURL}${this.apis.primary.endpoints.nfl}/standings`;
          break;
        case 'nba':
          endpoint = `${this.apis.primary.baseURL}${this.apis.primary.endpoints.nba}/standings`;
          break;
        default:
          return {};
      }

      const response = await fetch(endpoint);
      const data = await response.json();
      
      const teamStats = {};
      
      // Process standings data to extract win percentages
      if (data.children) {
        data.children.forEach(conference => {
          if (conference.standings?.entries) {
            conference.standings.entries.forEach(team => {
              const teamName = team.team?.displayName;
              const stats = team.stats;
              if (teamName && stats) {
                const wins = parseInt(stats.find(s => s.name === 'wins')?.value || 0);
                const losses = parseInt(stats.find(s => s.name === 'losses')?.value || 0);
                const winPercentage = parseFloat(stats.find(s => s.name === 'winPercent')?.value || 0) * 100;
                
                teamStats[teamName] = {
                  wins,
                  losses,
                  winPercentage: Math.round(winPercentage * 10) / 10
                };
              }
            });
          }
        });
      }

      this.setCachedData(cacheKey, teamStats, this.cacheConfig.teamStats);
      return teamStats;
    } catch (error) {
      console.error(`Error fetching ${sport} team stats:`, error);
      return this.getFallbackTeamStats(sport);
    }
  }

  // Get live scores for active games
  async getLiveScores(sport) {
    const cacheKey = `${sport}_live_scores`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      let games = [];
      switch (sport.toLowerCase()) {
        case 'mlb':
          games = await this.fetchMLBData();
          break;
        case 'nfl':
          games = await this.fetchNFLData();
          break;
        case 'nba':
          games = await this.fetchNBAData();
          break;
      }

      // Filter only live games
      const liveGames = games.filter(game => game.IsLive);
      
      this.setCachedData(cacheKey, liveGames, this.cacheConfig.scores);
      return liveGames;
    } catch (error) {
      console.error(`Error fetching live ${sport} scores:`, error);
      return [];
    }
  }

  // Fallback data methods (using existing static data)
  getFallbackMLBData() {
    // Return a subset of static data as fallback
    return [
      {
        MatchNumber: 1,
        RoundNumber: 1,
        DateUtc: new Date().toISOString(),
        Location: "Yankee Stadium",
        HomeTeam: "New York Yankees",
        AwayTeam: "Boston Red Sox",
        Group: null,
        HomeTeamScore: null,
        AwayTeamScore: null,
        Status: "scheduled"
      }
    ];
  }

  getFallbackNFLData() {
    return [
      {
        MatchNumber: 1,
        RoundNumber: 1,
        DateUtc: new Date().toISOString(),
        Location: "Arrowhead Stadium",
        HomeTeam: "Kansas City Chiefs",
        AwayTeam: "Buffalo Bills",
        Group: null,
        HomeTeamScore: null,
        AwayTeamScore: null,
        Status: "scheduled"
      }
    ];
  }

  getFallbackNBAData() {
    return [
      {
        MatchNumber: 1,
        RoundNumber: 1,
        DateUtc: new Date().toISOString(),
        Location: "Crypto.com Arena",
        HomeTeam: "Los Angeles Lakers",
        AwayTeam: "Boston Celtics",
        Group: null,
        HomeTeamScore: null,
        AwayTeamScore: null,
        Status: "scheduled"
      }
    ];
  }

  getFallbackTeamStats(sport) {
    // Return current static team stats as fallback
    const fallbackStats = {
      mlb: {
        "Los Angeles Dodgers": { wins: 100, losses: 62, winPercentage: 61.7 },
        "New York Yankees": { wins: 94, losses: 68, winPercentage: 58.0 },
        "Atlanta Braves": { wins: 89, losses: 73, winPercentage: 54.9 }
      },
      nfl: {
        "Kansas City Chiefs": { wins: 14, losses: 3, winPercentage: 82.4 },
        "Buffalo Bills": { wins: 13, losses: 4, winPercentage: 76.5 },
        "Philadelphia Eagles": { wins: 12, losses: 5, winPercentage: 70.6 }
      },
      nba: {
        "Boston Celtics": { wins: 55, losses: 27, winPercentage: 67.1 },
        "Los Angeles Lakers": { wins: 47, losses: 35, winPercentage: 57.3 },
        "Golden State Warriors": { wins: 44, losses: 38, winPercentage: 53.7 }
      }
    };
    
    return fallbackStats[sport.toLowerCase()] || {};
  }

  // Clear all cached data
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      lastUpdated: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const sportsAPI = new SportsAPIService();
export default sportsAPI;
