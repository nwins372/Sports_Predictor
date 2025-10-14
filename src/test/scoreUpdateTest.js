// Simple test to verify score update functionality
import schedulerService from '../services/schedulerService';
import sportsAPI from '../services/sportsAPI';

// Test the scheduler service
console.log('Testing Scheduler Service...');
console.log('Initial status:', schedulerService.getStatus());

// Test registering a sport
const testCallback = () => {
  console.log('Test callback executed for NFL');
};

schedulerService.registerSport('NFL', testCallback);
console.log('After registering NFL:', schedulerService.getStatus());

// Test the sports API
console.log('\nTesting Sports API...');
sportsAPI.fetchNFLData()
  .then(data => {
    console.log('NFL data fetched:', data.length, 'games');
    if (data.length > 0) {
      console.log('Sample game:', data[0]);
    }
  })
  .catch(error => {
    console.error('Error fetching NFL data:', error);
  });

// Test win percentage calculation
console.log('\nTesting Win Percentage Calculation...');
const calculateWinProbability = (homeTeam, awayTeam) => {
  const TEAM_STATS = {
    "Kansas City Chiefs": { wins: 14, losses: 3, winPercentage: 82.4 },
    "Buffalo Bills": { wins: 13, losses: 4, winPercentage: 76.5 },
    "Philadelphia Eagles": { wins: 12, losses: 5, winPercentage: 70.6 }
  };
  
  const homeStats = TEAM_STATS[homeTeam];
  const awayStats = TEAM_STATS[awayTeam];
  
  if (!homeStats || !awayStats) {
    return { homeWinProb: 50, awayWinProb: 50 };
  }
  
  const homeAdvantage = 5;
  const homeWinPercentage = homeStats.winPercentage + homeAdvantage;
  const awayWinPercentage = awayStats.winPercentage;
  
  const total = homeWinPercentage + awayWinPercentage;
  const homeWinProb = Math.round((homeWinPercentage / total) * 100);
  const awayWinProb = 100 - homeWinProb;
  
  return { homeWinProb, awayWinProb };
};

const testPrediction = calculateWinProbability("Kansas City Chiefs", "Buffalo Bills");
console.log('Win probability test:', testPrediction);

console.log('\nAll tests completed!');
