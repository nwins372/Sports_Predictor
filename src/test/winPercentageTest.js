// Test win percentage calculation for past games
const TEAM_STATS = {
  "Kansas City Chiefs": { wins: 14, losses: 3, winPercentage: 82.4 },
  "Buffalo Bills": { wins: 13, losses: 4, winPercentage: 76.5 },
  "Philadelphia Eagles": { wins: 12, losses: 5, winPercentage: 70.6 },
  "Dallas Cowboys": { wins: 11, losses: 6, winPercentage: 64.7 }
};

// Function to calculate win probability between two teams (same as in Schedules.jsx)
const calculateWinProbability = (homeTeam, awayTeam, liveStats = {}) => {
  const statsSource = Object.keys(liveStats).length > 0 ? liveStats : TEAM_STATS;
  
  const homeStats = statsSource[homeTeam];
  const awayStats = statsSource[awayTeam];
  
  if (!homeStats || !awayStats) {
    // Try to find partial matches
    const homePartialMatch = Object.keys(statsSource).find(team => 
      team.toLowerCase().includes(homeTeam.toLowerCase()) || 
      homeTeam.toLowerCase().includes(team.toLowerCase())
    );
    const awayPartialMatch = Object.keys(statsSource).find(team => 
      team.toLowerCase().includes(awayTeam.toLowerCase()) || 
      awayTeam.toLowerCase().includes(team.toLowerCase())
    );
    
    if (homePartialMatch && awayPartialMatch) {
      const homePartialStats = statsSource[homePartialMatch];
      const awayPartialStats = statsSource[awayPartialMatch];
      
      const homeAdvantage = 5;
      const homeWinPercentage = homePartialStats.winPercentage + homeAdvantage;
      const awayWinPercentage = awayPartialStats.winPercentage;
      
      const total = homeWinPercentage + awayWinPercentage;
      const homeWinProb = Math.round((homeWinPercentage / total) * 100);
      const awayWinProb = 100 - homeWinProb;
      
      return { homeWinProb, awayWinProb };
    }
    
    return { homeWinProb: 50, awayWinProb: 50 };
  }
  
  const homeAdvantage = 5;
  const homeStrength = homeStats.wins / (homeStats.wins + homeStats.losses);
  const awayStrength = awayStats.wins / (awayStats.wins + awayStats.losses);
  
  const homeWinPercentage = (homeStrength * 100) + homeAdvantage;
  const awayWinPercentage = awayStrength * 100;
  
  const total = homeWinPercentage + awayWinPercentage;
  const homeWinProb = Math.round((homeWinPercentage / total) * 100);
  const awayWinProb = 100 - homeWinProb;
  
  return { homeWinProb, awayWinProb };
};

// Test cases
console.log('Testing Win Percentage Calculations for Past Games:');
console.log('================================================');

// Test 1: Chiefs vs Bills (Chiefs home)
const test1 = calculateWinProbability("Kansas City Chiefs", "Buffalo Bills");
console.log('Test 1 - Chiefs (home) vs Bills:');
console.log(`  Chiefs: ${test1.homeWinProb}%`);
console.log(`  Bills: ${test1.awayWinProb}%`);
console.log(`  Total: ${test1.homeWinProb + test1.awayWinProb}%`);
console.log('');

// Test 2: Bills vs Chiefs (Bills home)
const test2 = calculateWinProbability("Buffalo Bills", "Kansas City Chiefs");
console.log('Test 2 - Bills (home) vs Chiefs:');
console.log(`  Bills: ${test2.homeWinProb}%`);
console.log(`  Chiefs: ${test2.awayWinProb}%`);
console.log(`  Total: ${test2.homeWinProb + test2.awayWinProb}%`);
console.log('');

// Test 3: Eagles vs Cowboys (Eagles home)
const test3 = calculateWinProbability("Philadelphia Eagles", "Dallas Cowboys");
console.log('Test 3 - Eagles (home) vs Cowboys:');
console.log(`  Eagles: ${test3.homeWinProb}%`);
console.log(`  Cowboys: ${test3.awayWinProb}%`);
console.log(`  Total: ${test3.homeWinProb + test3.awayWinProb}%`);
console.log('');

// Test 4: Partial match test
const test4 = calculateWinProbability("Chiefs", "Bills");
console.log('Test 4 - Partial match (Chiefs vs Bills):');
console.log(`  Chiefs: ${test4.homeWinProb}%`);
console.log(`  Bills: ${test4.awayWinProb}%`);
console.log(`  Total: ${test4.homeWinProb + test4.awayWinProb}%`);
console.log('');

// Test 5: Unknown teams (should default to 50/50)
const test5 = calculateWinProbability("Unknown Team", "Another Unknown Team");
console.log('Test 5 - Unknown teams:');
console.log(`  Unknown Team: ${test5.homeWinProb}%`);
console.log(`  Another Unknown Team: ${test5.awayWinProb}%`);
console.log(`  Total: ${test5.homeWinProb + test5.awayWinProb}%`);
console.log('');

// Test confidence calculation
const getPredictionConfidence = (homeWinProb, awayWinProb) => {
  const maxProb = Math.max(homeWinProb, awayWinProb);
  const minProb = Math.min(homeWinProb, awayWinProb);
  const confidence = maxProb - minProb;
  
  if (confidence >= 30) return { level: 'High', color: '#22c55e' };
  if (confidence >= 15) return { level: 'Medium', color: '#f59e0b' };
  return { level: 'Low', color: '#ef4444' };
};

console.log('Confidence Analysis:');
console.log('===================');
console.log(`Test 1 Confidence: ${getPredictionConfidence(test1.homeWinProb, test1.awayWinProb).level}`);
console.log(`Test 2 Confidence: ${getPredictionConfidence(test2.homeWinProb, test2.awayWinProb).level}`);
console.log(`Test 3 Confidence: ${getPredictionConfidence(test3.homeWinProb, test3.awayWinProb).level}`);
console.log(`Test 4 Confidence: ${getPredictionConfidence(test4.homeWinProb, test4.awayWinProb).level}`);
console.log(`Test 5 Confidence: ${getPredictionConfidence(test5.homeWinProb, test5.awayWinProb).level}`);

console.log('\nAll tests completed successfully!');
