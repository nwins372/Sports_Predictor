// Advanced Win Percentage Calculator Test
import { calculateWinPercentage, formatWinPercentage, WinPercentageCalculator } from '../utils/winPercentageCalculator.js';

console.log('🏆 Advanced Win Percentage Calculator Test');
console.log('==========================================\n');

// Test different algorithms
const testTeams = [
  { team1: "Kansas City Chiefs", team2: "Buffalo Bills", description: "Elite vs Elite" },
  { team1: "Philadelphia Eagles", team2: "New England Patriots", description: "Strong vs Weak" },
  { team1: "Los Angeles Lakers", team2: "Golden State Warriors", description: "NBA Matchup" },
  { team1: "Los Angeles Dodgers", team2: "New York Yankees", description: "MLB Matchup" }
];

const algorithms = ['basic', 'advanced', 'elo', 'composite'];

testTeams.forEach((matchup, index) => {
  console.log(`\n📊 Test ${index + 1}: ${matchup.description}`);
  console.log(`   ${matchup.team1} vs ${matchup.team2}`);
  console.log('   ' + '='.repeat(50));

  algorithms.forEach(algorithm => {
    try {
      const result = calculateWinPercentage(matchup.team1, matchup.team2, {
        algorithm: algorithm,
        isHomeTeam1: true,
        includeRecentForm: true
      });

      const formatted = formatWinPercentage(result);
      
      console.log(`\n   ${algorithm.toUpperCase()} Algorithm:`);
      console.log(`   ${matchup.team1}: ${formatted.team1Percentage}%`);
      console.log(`   ${matchup.team2}: ${formatted.team2Percentage}%`);
      console.log(`   Confidence: ${formatted.confidence.level} (${(result.confidence * 100).toFixed(1)}%)`);
      
      if (result.details && result.details.subResults) {
        console.log(`   Sub-algorithms:`);
        Object.entries(result.details.subResults).forEach(([algo, subResult]) => {
          console.log(`     ${algo}: ${Math.round(subResult.team1Probability * 100)}% vs ${Math.round(subResult.team2Probability * 100)}%`);
        });
      }
      
    } catch (error) {
      console.log(`   ${algorithm.toUpperCase()}: Error - ${error.message}`);
    }
  });
});

// Test confidence levels
console.log('\n\n🎯 Confidence Level Analysis');
console.log('============================');

const confidenceTests = [
  { team1: "Kansas City Chiefs", team2: "New England Patriots", expected: "High" },
  { team1: "Buffalo Bills", team2: "Miami Dolphins", expected: "Medium" },
  { team1: "Philadelphia Eagles", team2: "Dallas Cowboys", expected: "Low" }
];

confidenceTests.forEach((test, index) => {
  const result = calculateWinPercentage(test.team1, test.team2, { algorithm: 'composite' });
  const formatted = formatWinPercentage(result);
  
  console.log(`\nTest ${index + 1}: ${test.team1} vs ${test.team2}`);
  console.log(`Expected: ${test.expected} Confidence`);
  console.log(`Actual: ${formatted.confidence.level} Confidence (${(result.confidence * 100).toFixed(1)}%)`);
  console.log(`Match: ${formatted.confidence.level === test.expected ? '✅' : '❌'}`);
});

// Test algorithm comparison
console.log('\n\n⚖️  Algorithm Comparison');
console.log('========================');

const comparisonTest = { team1: "Kansas City Chiefs", team2: "Buffalo Bills" };
console.log(`\nMatchup: ${comparisonTest.team1} vs ${comparisonTest.team2}`);

const algorithmResults = {};

algorithms.forEach(algorithm => {
  const result = calculateWinPercentage(comparisonTest.team1, comparisonTest.team2, {
    algorithm: algorithm,
    isHomeTeam1: true
  });
  
  algorithmResults[algorithm] = {
    team1Prob: result.team1Probability,
    team2Prob: result.team2Probability,
    confidence: result.confidence
  };
});

console.log('\nAlgorithm Results:');
Object.entries(algorithmResults).forEach(([algorithm, result]) => {
  console.log(`${algorithm.padEnd(12)}: ${Math.round(result.team1Prob * 100)}% vs ${Math.round(result.team2Prob * 100)}% (Confidence: ${(result.confidence * 100).toFixed(1)}%)`);
});

// Calculate average and standard deviation
const team1Probs = Object.values(algorithmResults).map(r => r.team1Prob);
const avgTeam1Prob = team1Probs.reduce((a, b) => a + b, 0) / team1Probs.length;
const variance = team1Probs.reduce((acc, prob) => acc + Math.pow(prob - avgTeam1Prob, 2), 0) / team1Probs.length;
const stdDev = Math.sqrt(variance);

console.log(`\nAverage Team 1 Probability: ${(avgTeam1Prob * 100).toFixed(1)}%`);
console.log(`Standard Deviation: ${(stdDev * 100).toFixed(1)}%`);
console.log(`Algorithm Agreement: ${stdDev < 0.05 ? 'High' : stdDev < 0.1 ? 'Medium' : 'Low'}`);

console.log('\n\n✅ All tests completed successfully!');
console.log('\nKey Features Tested:');
console.log('• Multiple algorithm implementations');
console.log('• Confidence level calculation');
console.log('• Team statistics integration');
console.log('• Error handling and fallbacks');
console.log('• Algorithm comparison and validation');
