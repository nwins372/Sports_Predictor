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
      // Use a CORS proxy to access ESPN API
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const targetUrl = `${this.apis.primary.baseURL}${this.apis.primary.endpoints.mlb}/scoreboard`;
      
      console.log('Fetching MLB data from:', targetUrl);
      const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('MLB API response:', data);
      
      const games = data.events?.map(event => {
        const competition = event.competitions?.[0];
        const homeTeam = competition?.competitors?.find(c => c.homeAway === 'home');
        const awayTeam = competition?.competitors?.find(c => c.homeAway === 'away');
        
        // Extract live game details
        const gameDetails = this.extractMLBGameDetails(event, competition);
        
        return {
          MatchNumber: event.id,
          RoundNumber: 1, // ESPN doesn't provide round numbers for MLB
          DateUtc: event.date,
          Location: competition?.venue?.fullName || 'TBD',
          HomeTeam: homeTeam?.team?.displayName || 'TBD',
          AwayTeam: awayTeam?.team?.displayName || 'TBD',
          Group: null,
          HomeTeamScore: homeTeam?.score || null,
          AwayTeamScore: awayTeam?.score || null,
          Status: event.status?.type?.name || 'scheduled',
          IsLive: event.status?.type?.state === 'in',
          ...gameDetails
        };
      }) || [];

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
      // Use a CORS proxy to access ESPN API
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const targetUrl = `${this.apis.primary.baseURL}${this.apis.primary.endpoints.nfl}/scoreboard`;
      
      console.log('Fetching NFL data from:', targetUrl);
      const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('NFL API response:', data);
      
      const games = data.events?.map(event => {
        const competition = event.competitions?.[0];
        const homeTeam = competition?.competitors?.find(c => c.homeAway === 'home');
        const awayTeam = competition?.competitors?.find(c => c.homeAway === 'away');
        
        // Extract live game details
        const gameDetails = this.extractNFLGameDetails(event, competition);
        
        return {
          MatchNumber: event.id,
          RoundNumber: event.week?.number || 1,
          DateUtc: event.date,
          Location: competition?.venue?.fullName || 'TBD',
          HomeTeam: homeTeam?.team?.displayName || 'TBD',
          AwayTeam: awayTeam?.team?.displayName || 'TBD',
          Group: null,
          HomeTeamScore: homeTeam?.score || null,
          AwayTeamScore: awayTeam?.score || null,
          Status: event.status?.type?.name || 'scheduled',
          IsLive: event.status?.type?.state === 'in',
          ...gameDetails
        };
      }) || [];

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
      // Use a CORS proxy to access ESPN API
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const targetUrl = `${this.apis.primary.baseURL}${this.apis.primary.endpoints.nba}/scoreboard`;
      
      console.log('Fetching NBA data from:', targetUrl);
      const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('NBA API response:', data);
      
      const games = data.events?.map(event => {
        const competition = event.competitions?.[0];
        const homeTeam = competition?.competitors?.find(c => c.homeAway === 'home');
        const awayTeam = competition?.competitors?.find(c => c.homeAway === 'away');
        
        // Extract live game details
        const gameDetails = this.extractNBAGameDetails(event, competition);
        
        return {
          MatchNumber: event.id,
          RoundNumber: 1,
          DateUtc: event.date,
          Location: competition?.venue?.fullName || 'TBD',
          HomeTeam: homeTeam?.team?.displayName || 'TBD',
          AwayTeam: awayTeam?.team?.displayName || 'TBD',
          Group: null,
          HomeTeamScore: homeTeam?.score || null,
          AwayTeamScore: awayTeam?.score || null,
          Status: event.status?.type?.name || 'scheduled',
          IsLive: event.status?.type?.state === 'in',
          ...gameDetails
        };
      }) || [];

      this.setCachedData(cacheKey, games, this.cacheConfig.schedules);
      return games;
    } catch (error) {
      console.error('Error fetching NBA data:', error);
      return this.getFallbackNBAData();
    }
  }

  // Extract MLB game details (innings, scores, etc.)
  extractMLBGameDetails(event, competition) {
    const details = {
      currentInning: null,
      inningHalf: null,
      timeRemaining: null,
      gameClock: null,
      period: null,
      isTopInning: null,
      outs: null,
      baseRunners: {
        first: false,
        second: false,
        third: false
      },
      pitcher: null,
      batter: null,
      score: null
    };

    if (competition?.status?.type?.state === 'in') {
      // Extract inning information
      const situation = competition.situation;
      if (situation) {
        details.currentInning = situation.inning || null;
        details.inningHalf = situation.halfInning || null;
        details.isTopInning = situation.halfInning === 'top';
        details.outs = situation.outs || null;
        
        // Extract base runners
        if (situation.onFirst) details.baseRunners.first = true;
        if (situation.onSecond) details.baseRunners.second = true;
        if (situation.onThird) details.baseRunners.third = true;
        
        // Extract pitcher and batter if available
        details.pitcher = situation.pitcher?.displayName || null;
        details.batter = situation.batter?.displayName || null;
      }

      // Extract time information if available
      details.timeRemaining = competition.clock || null;
      details.gameClock = competition.clock || null;
      details.period = `Inning ${details.currentInning || 'TBD'}`;
      
      // Get current score if available
      const homeTeam = competition.competitors?.find(c => c.homeAway === 'home');
      const awayTeam = competition.competitors?.find(c => c.homeAway === 'away');
      if (homeTeam && awayTeam) {
        details.score = `${awayTeam.score}-${homeTeam.score}`;
      }
    }

    return details;
  }

  // Extract NFL game details (quarters, time remaining, etc.)
  extractNFLGameDetails(event, competition) {
    const details = {
      currentQuarter: null,
      quarterTime: null,
      timeRemaining: null,
      gameClock: null,
      period: null,
      down: null,
      distance: null,
      fieldPosition: null,
      possession: null,
      yardLine: null,
      isRedZone: false,
      timeout: null,
      score: null
    };

    if (competition?.status?.type?.state === 'in' || competition?.status?.type?.state === 'final') {
      // Extract quarter and time information
      const situation = competition.situation;
      if (situation) {
        details.currentQuarter = situation.period || null;
        details.quarterTime = situation.displayClock || null;
        details.timeRemaining = situation.displayClock || null;
        details.gameClock = situation.displayClock || null;
        details.period = `Q${details.currentQuarter || 'TBD'}`;
        
        // Extract down and distance information
        details.down = situation.down || null;
        details.distance = situation.distance || null;
        details.fieldPosition = situation.team?.abbreviation || null;
        details.possession = situation.team?.abbreviation || null;
        details.yardLine = situation.yardLine || null;
        
        // Check if in red zone (inside 20 yard line)
        if (details.yardLine && parseInt(details.yardLine) <= 20) {
          details.isRedZone = true;
        }
        
        // Extract timeout information if available
        details.timeout = situation.timeout || null;
      }
      
      // Get current score
      const homeTeam = competition.competitors?.find(c => c.homeAway === 'home');
      const awayTeam = competition.competitors?.find(c => c.homeAway === 'away');
      if (homeTeam && awayTeam) {
        details.score = `${awayTeam.score}-${homeTeam.score}`;
      }
    }

    return details;
  }

  // Extract NBA game details (quarters, time remaining, etc.)
  extractNBAGameDetails(event, competition) {
    const details = {
      currentQuarter: null,
      quarterTime: null,
      timeRemaining: null,
      gameClock: null,
      period: null,
      shotClock: null,
      possession: null,
      score: null,
      lead: null,
      isOvertime: false
    };

    if (competition?.status?.type?.state === 'in' || competition?.status?.type?.state === 'final') {
      // Extract quarter and time information
      const situation = competition.situation;
      if (situation) {
        details.currentQuarter = situation.period || null;
        details.quarterTime = situation.displayClock || null;
        details.timeRemaining = situation.displayClock || null;
        details.gameClock = situation.displayClock || null;
        
        // Determine if it's overtime
        if (details.currentQuarter && details.currentQuarter > 4) {
          details.isOvertime = true;
          details.period = `OT${details.currentQuarter - 4}`;
        } else {
          details.period = `Q${details.currentQuarter || 'TBD'}`;
        }
        
        details.shotClock = situation.shotClock || null;
        details.possession = situation.team?.abbreviation || null;
      }
      
      // Get current score and calculate lead
      const homeTeam = competition.competitors?.find(c => c.homeAway === 'home');
      const awayTeam = competition.competitors?.find(c => c.homeAway === 'away');
      if (homeTeam && awayTeam) {
        details.score = `${awayTeam.score}-${homeTeam.score}`;
        
        const homeScore = parseInt(homeTeam.score) || 0;
        const awayScore = parseInt(awayTeam.score) || 0;
        const lead = Math.abs(homeScore - awayScore);
        
        if (lead > 0) {
          const leadingTeam = homeScore > awayScore ? homeTeam.team?.abbreviation : awayTeam.team?.abbreviation;
          details.lead = `${leadingTeam} by ${lead}`;
        }
      }
    }

    return details;
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

      // Use a CORS proxy to access ESPN API
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      console.log(`Fetching ${sport} team stats from:`, endpoint);
      const response = await fetch(proxyUrl + encodeURIComponent(endpoint));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
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
    // Return realistic live data as fallback
    const now = new Date();
    return [
      {
        MatchNumber: 1,
        RoundNumber: 1,
        DateUtc: now.toISOString(),
        Location: "Yankee Stadium",
        HomeTeam: "New York Yankees",
        AwayTeam: "Boston Red Sox",
        Group: null,
        HomeTeamScore: 3,
        AwayTeamScore: 1,
        Status: "in",
        currentInning: 7,
        inningHalf: "bottom",
        timeRemaining: null,
        gameClock: null,
        period: "Inning 7",
        isTopInning: false,
        outs: 2,
        baseRunners: {
          first: true,
          second: false,
          third: true
        },
        pitcher: "Gerrit Cole",
        batter: "Rafael Devers",
        score: "1-3"
      },
      {
        MatchNumber: 2,
        RoundNumber: 1,
        DateUtc: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        Location: "Dodger Stadium",
        HomeTeam: "Los Angeles Dodgers",
        AwayTeam: "San Francisco Giants",
        Group: null,
        HomeTeamScore: null,
        AwayTeamScore: null,
        Status: "scheduled"
      }
    ];
  }

  getFallbackNFLData() {
    const now = new Date();
    return [
      {
        MatchNumber: 1,
        RoundNumber: 5,
        DateUtc: now.toISOString(),
        Location: "SoFi Stadium",
        HomeTeam: "Los Angeles Rams",
        AwayTeam: "San Francisco 49ers",
        Group: null,
        HomeTeamScore: 0,
        AwayTeamScore: 7,
        Status: "final",
        currentQuarter: 4,
        quarterTime: "0:00",
        timeRemaining: "0:00",
        gameClock: "0:00",
        period: "Q4",
        down: null,
        distance: null,
        fieldPosition: null,
        possession: null,
        yardLine: null,
        isRedZone: false,
        timeout: null,
        score: "7-0"
      },
      {
        MatchNumber: 2,
        RoundNumber: 5,
        DateUtc: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
        Location: "Arrowhead Stadium",
        HomeTeam: "Kansas City Chiefs",
        AwayTeam: "Buffalo Bills",
        Group: null,
        HomeTeamScore: 14,
        AwayTeamScore: 10,
        Status: "in",
        currentQuarter: 3,
        quarterTime: "12:45",
        timeRemaining: "12:45",
        gameClock: "12:45",
        period: "Q3",
        down: 2,
        distance: 7,
        fieldPosition: "KC",
        possession: "KC",
        yardLine: 15,
        isRedZone: true,
        timeout: null,
        score: "10-14"
      }
    ];
  }

  getFallbackNBAData() {
    const now = new Date();
    return [
      {
        MatchNumber: 1,
        RoundNumber: 1,
        DateUtc: now.toISOString(),
        Location: "Crypto.com Arena",
        HomeTeam: "Los Angeles Lakers",
        AwayTeam: "Boston Celtics",
        Group: null,
        HomeTeamScore: 89,
        AwayTeamScore: 92,
        Status: "in",
        currentQuarter: 4,
        quarterTime: "2:34",
        timeRemaining: "2:34",
        gameClock: "2:34",
        period: "Q4",
        shotClock: "14",
        possession: "BOS",
        score: "92-89",
        lead: "BOS by 3",
        isOvertime: false
      },
      {
        MatchNumber: 2,
        RoundNumber: 1,
        DateUtc: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        Location: "Chase Center",
        HomeTeam: "Golden State Warriors",
        AwayTeam: "Phoenix Suns",
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

  // Clear past games cache for a specific team
  clearPastGamesCache(sport, teamName) {
    const cacheKey = `${sport}_${teamName}_past_games`;
    this.cache.delete(cacheKey);
  }

  // Force fallback data for testing
  async getPastGamesWithFallback(sport, teamName) {
    console.log(`Forcing fallback data for ${teamName} (${sport})`);
    return this.getFallbackPastGames(sport, teamName);
  }

  // Fetch past games for a specific team (last 20 games)
  async fetchTeamPastGames(sport, teamName) {
    const cacheKey = `${sport}_${teamName}_past_games`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      let endpoint = '';
      switch (sport.toLowerCase()) {
        case 'mlb':
          endpoint = `${this.apis.primary.baseURL}${this.apis.primary.endpoints.mlb}/teams/${this.getTeamId(sport, teamName)}/schedule`;
          break;
        case 'nfl':
          endpoint = `${this.apis.primary.baseURL}${this.apis.primary.endpoints.nfl}/teams/${this.getTeamId(sport, teamName)}/schedule`;
          break;
        case 'nba':
          endpoint = `${this.apis.primary.baseURL}${this.apis.primary.endpoints.nba}/teams/${this.getTeamId(sport, teamName)}/schedule`;
          break;
        default:
          return [];
      }

      // Use a CORS proxy to access ESPN API
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      console.log(`Fetching ${sport} past games for ${teamName} from:`, endpoint);
      const response = await fetch(proxyUrl + encodeURIComponent(endpoint));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process past games (last 20 completed games)
      const pastGames = data.events
        ?.filter(event => {
          const gameDate = new Date(event.date);
          const now = new Date();
          return gameDate < now && event.status?.type?.state === 'post';
        })
        ?.slice(0, 20) // Get last 20 games
        ?.map(event => {
          const competition = event.competitions?.[0];
          const homeTeam = competition?.competitors?.find(c => c.homeAway === 'home');
          const awayTeam = competition?.competitors?.find(c => c.homeAway === 'away');
          
          return {
            id: event.id,
            date: event.date,
            homeTeam: homeTeam?.team?.displayName || 'TBD',
            awayTeam: awayTeam?.team?.displayName || 'TBD',
            homeScore: homeTeam?.score || null,
            awayScore: awayTeam?.score || null,
            location: competition?.venue?.fullName || 'TBD',
            status: event.status?.type?.name || 'final',
            sport: sport.toUpperCase(),
            week: event.week?.number || null,
            season: event.season?.year || new Date().getFullYear()
          };
        }) || [];

      // If no past games found from API, use fallback data
      if (pastGames.length === 0) {
        console.log(`No past games found from API for ${teamName}, using fallback data`);
        const fallbackGames = this.getFallbackPastGames(sport, teamName);
        this.setCachedData(cacheKey, fallbackGames, 7 * 24 * 60 * 60 * 1000);
        return fallbackGames;
      }

      // Cache for 7 days (weekly updates)
      this.setCachedData(cacheKey, pastGames, 7 * 24 * 60 * 60 * 1000);
      return pastGames;
    } catch (error) {
      console.error(`Error fetching ${sport} past games for ${teamName}:`, error);
      return this.getFallbackPastGames(sport, teamName);
    }
  }

  // Get team ID mapping (simplified - in production, you'd have a proper team ID mapping)
  getTeamId(sport, teamName) {
    // This is a simplified mapping - in production, you'd have a comprehensive team ID database
    const teamIds = {
      mlb: {
        "New York Yankees": "nyy",
        "Boston Red Sox": "bos",
        "Los Angeles Dodgers": "lad",
        "San Francisco Giants": "sf",
        "Atlanta Braves": "atl",
        "Houston Astros": "hou",
        "Philadelphia Phillies": "phi",
        "Chicago Cubs": "chc",
        "Milwaukee Brewers": "mil",
        "Toronto Blue Jays": "tor",
        "Baltimore Orioles": "bal",
        "Cleveland Guardians": "cle",
        "Texas Rangers": "tex",
        "Arizona Diamondbacks": "ari",
        "Miami Marlins": "mia",
        "San Diego Padres": "sd",
        "Minnesota Twins": "min",
        "Seattle Mariners": "sea",
        "Tampa Bay Rays": "tb",
        "New York Mets": "nym",
        "St. Louis Cardinals": "stl",
        "Cincinnati Reds": "cin",
        "Pittsburgh Pirates": "pit",
        "Washington Nationals": "was",
        "Colorado Rockies": "col",
        "Oakland Athletics": "oak",
        "Los Angeles Angels": "laa",
        "Kansas City Royals": "kc",
        "Chicago White Sox": "cws",
        "Detroit Tigers": "det"
      },
      nfl: {
        "Kansas City Chiefs": "kc",
        "Buffalo Bills": "buf",
        "Philadelphia Eagles": "phi",
        "Dallas Cowboys": "dal",
        "Baltimore Ravens": "bal",
        "Cincinnati Bengals": "cin",
        "San Francisco 49ers": "sf",
        "Detroit Lions": "det",
        "Miami Dolphins": "mia",
        "New England Patriots": "ne",
        "Green Bay Packers": "gb",
        "Minnesota Vikings": "min",
        "Chicago Bears": "chi",
        "Tampa Bay Buccaneers": "tb",
        "Atlanta Falcons": "atl",
        "Carolina Panthers": "car",
        "New Orleans Saints": "no",
        "Seattle Seahawks": "sea",
        "Los Angeles Rams": "lar",
        "Arizona Cardinals": "ari",
        "Las Vegas Raiders": "lv",
        "Los Angeles Chargers": "lac",
        "Denver Broncos": "den",
        "Pittsburgh Steelers": "pit",
        "Cleveland Browns": "cle",
        "Indianapolis Colts": "ind",
        "Tennessee Titans": "ten",
        "Jacksonville Jaguars": "jax",
        "Houston Texans": "hou",
        "New York Giants": "nyg",
        "Washington Commanders": "was",
        "New York Jets": "nyj"
      },
      nba: {
        "Boston Celtics": "bos",
        "Los Angeles Lakers": "lal",
        "Golden State Warriors": "gs",
        "Miami Heat": "mia",
        "Denver Nuggets": "den",
        "Milwaukee Bucks": "mil",
        "Phoenix Suns": "phx",
        "Dallas Mavericks": "dal",
        "Philadelphia 76ers": "phi",
        "Brooklyn Nets": "bkn",
        "New York Knicks": "ny",
        "Chicago Bulls": "chi",
        "Cleveland Cavaliers": "cle",
        "Detroit Pistons": "det",
        "Indiana Pacers": "ind",
        "Atlanta Hawks": "atl",
        "Charlotte Hornets": "cha",
        "Orlando Magic": "orl",
        "Washington Wizards": "was",
        "Toronto Raptors": "tor",
        "Portland Trail Blazers": "por",
        "Utah Jazz": "utah",
        "Oklahoma City Thunder": "okc",
        "Minnesota Timberwolves": "min",
        "Sacramento Kings": "sac",
        "Los Angeles Clippers": "lac",
        "San Antonio Spurs": "sa",
        "Houston Rockets": "hou",
        "Memphis Grizzlies": "mem",
        "New Orleans Pelicans": "no"
      }
    };
    
    return teamIds[sport.toLowerCase()]?.[teamName] || teamName.toLowerCase().replace(/\s+/g, '-');
  }

  // Fallback past games data
  getFallbackPastGames(sport, teamName) {
    const now = new Date();
    const pastGames = [];
    
    // Generate 20 past games with realistic data
    for (let i = 0; i < 20; i++) {
      const gameDate = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
      const opponents = this.getRandomOpponents(sport, teamName);
      const opponent = opponents[Math.floor(Math.random() * opponents.length)];
      const isHome = Math.random() > 0.5;
      
      const homeTeam = isHome ? teamName : opponent;
      const awayTeam = isHome ? opponent : teamName;
      
      // Generate realistic scores based on sport
      const scores = this.generateRealisticScores(sport);
      const homeScore = isHome ? scores.home : scores.away;
      const awayScore = isHome ? scores.away : scores.home;
      
      pastGames.push({
        id: `past-${sport}-${teamName}-${i}`,
        date: gameDate.toISOString(),
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        location: this.getRandomVenue(sport, homeTeam),
        status: 'final',
        sport: sport.toUpperCase(),
        week: Math.floor(i / 2) + 1,
        season: new Date().getFullYear()
      });
    }
    
    return pastGames;
  }

  // Get random opponents for a team
  getRandomOpponents(sport, teamName) {
    const allTeams = {
      mlb: [
        "New York Yankees", "Boston Red Sox", "Los Angeles Dodgers", "San Francisco Giants",
        "Atlanta Braves", "Houston Astros", "Philadelphia Phillies", "Chicago Cubs",
        "Milwaukee Brewers", "Toronto Blue Jays", "Baltimore Orioles", "Cleveland Guardians",
        "Texas Rangers", "Arizona Diamondbacks", "Miami Marlins", "San Diego Padres",
        "Minnesota Twins", "Seattle Mariners", "Tampa Bay Rays", "New York Mets",
        "St. Louis Cardinals", "Cincinnati Reds", "Pittsburgh Pirates", "Washington Nationals",
        "Colorado Rockies", "Oakland Athletics", "Los Angeles Angels", "Kansas City Royals",
        "Chicago White Sox", "Detroit Tigers"
      ],
      nfl: [
        "Kansas City Chiefs", "Buffalo Bills", "Philadelphia Eagles", "Dallas Cowboys",
        "Baltimore Ravens", "Cincinnati Bengals", "San Francisco 49ers", "Detroit Lions",
        "Miami Dolphins", "New England Patriots", "Green Bay Packers", "Minnesota Vikings",
        "Chicago Bears", "Tampa Bay Buccaneers", "Atlanta Falcons", "Carolina Panthers",
        "New Orleans Saints", "Seattle Seahawks", "Los Angeles Rams", "Arizona Cardinals",
        "Las Vegas Raiders", "Los Angeles Chargers", "Denver Broncos", "Pittsburgh Steelers",
        "Cleveland Browns", "Indianapolis Colts", "Tennessee Titans", "Jacksonville Jaguars",
        "Houston Texans", "New York Giants", "Washington Commanders", "New York Jets"
      ],
      nba: [
        "Boston Celtics", "Los Angeles Lakers", "Golden State Warriors", "Miami Heat",
        "Denver Nuggets", "Milwaukee Bucks", "Phoenix Suns", "Dallas Mavericks",
        "Philadelphia 76ers", "Brooklyn Nets", "New York Knicks", "Chicago Bulls",
        "Cleveland Cavaliers", "Detroit Pistons", "Indiana Pacers", "Atlanta Hawks",
        "Charlotte Hornets", "Orlando Magic", "Washington Wizards", "Toronto Raptors",
        "Portland Trail Blazers", "Utah Jazz", "Oklahoma City Thunder", "Minnesota Timberwolves",
        "Sacramento Kings", "Los Angeles Clippers", "San Antonio Spurs", "Houston Rockets",
        "Memphis Grizzlies", "New Orleans Pelicans"
      ]
    };
    
    return allTeams[sport.toLowerCase()]?.filter(team => team !== teamName) || [];
  }

  // Generate realistic scores based on sport
  generateRealisticScores(sport) {
    switch (sport.toLowerCase()) {
      case 'mlb':
        return {
          home: Math.floor(Math.random() * 8) + 1,
          away: Math.floor(Math.random() * 8) + 1
        };
      case 'nfl':
        return {
          home: Math.floor(Math.random() * 35) + 7,
          away: Math.floor(Math.random() * 35) + 7
        };
      case 'nba':
        return {
          home: Math.floor(Math.random() * 40) + 80,
          away: Math.floor(Math.random() * 40) + 80
        };
      default:
        return { home: 0, away: 0 };
    }
  }

  // Get random venue for a team
  getRandomVenue(sport, teamName) {
    const venues = {
      mlb: {
        "New York Yankees": "Yankee Stadium",
        "Boston Red Sox": "Fenway Park",
        "Los Angeles Dodgers": "Dodger Stadium",
        "San Francisco Giants": "Oracle Park"
      },
      nfl: {
        "Kansas City Chiefs": "Arrowhead Stadium",
        "Buffalo Bills": "Highmark Stadium",
        "Philadelphia Eagles": "Lincoln Financial Field",
        "Dallas Cowboys": "AT&T Stadium"
      },
      nba: {
        "Boston Celtics": "TD Garden",
        "Los Angeles Lakers": "Crypto.com Arena",
        "Golden State Warriors": "Chase Center",
        "Miami Heat": "FTX Arena"
      }
    };
    
    return venues[sport.toLowerCase()]?.[teamName] || `${teamName} Stadium`;
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
