const fs = require('fs');
const path = require('path');

// NFL 2025 Season Standings (Week 10 - November 4, 2025)
const NFL_RECORDS = {
  "Philadelphia": { wins: 6, losses: 2, ties: 0 },
  "Dallas": { wins: 3, losses: 5, ties: 0 },
  "Washington": { wins: 3, losses: 6, ties: 0 },
  "New_York": { wins: 2, losses: 7, ties: 0 },  // Giants
  "Tampa_Bay": { wins: 6, losses: 2, ties: 0 },
  "Carolina": { wins: 5, losses: 4, ties: 0 },
  "Atlanta": { wins: 3, losses: 5, ties: 0 },
  "New_Orleans": { wins: 1, losses: 8, ties: 0 },
  "Seattle": { wins: 6, losses: 2, ties: 0 },
  "Los_Angeles": { wins: 6, losses: 2, ties: 0 },  // Rams
  "San_Francisco": { wins: 6, losses: 3, ties: 0 },
  "Arizona": { wins: 3, losses: 5, ties: 0 },
  "Green_Bay": { wins: 5, losses: 2, ties: 0 },
  "Detroit": { wins: 5, losses: 3, ties: 0 },
  "Chicago": { wins: 5, losses: 3, ties: 0 },
  "Minnesota": { wins: 4, losses: 4, ties: 0 },
  "Denver": { wins: 7, losses: 2, ties: 0 },
  "Kansas_City": { wins: 5, losses: 4, ties: 0 },
  "Las_Vegas": { wins: 2, losses: 6, ties: 0 },
  "New_England": { wins: 7, losses: 2, ties: 0 },
  "Buffalo": { wins: 6, losses: 2, ties: 0 },
  "Miami": { wins: 2, losses: 7, ties: 0 },
  "Indianapolis": { wins: 7, losses: 2, ties: 0 },
  "Jacksonville": { wins: 5, losses: 3, ties: 0 },
  "Houston": { wins: 3, losses: 5, ties: 0 },
  "Tennessee": { wins: 1, losses: 8, ties: 0 },
  "Pittsburgh": { wins: 5, losses: 3, ties: 0 },
  "Baltimore": { wins: 3, losses: 5, ties: 0 },
  "Cincinnati": { wins: 3, losses: 6, ties: 0 },
  "Cleveland": { wins: 2, losses: 6, ties: 0 },
};

// NBA 2025-26 Season Standings (November 4, 2025)
const NBA_RECORDS = {
  "Philadelphia": { wins: 5, losses: 1, ties: 0 },  // 76ers
  "Chicago": { wins: 5, losses: 1, ties: 0 },
  "Milwaukee": { wins: 5, losses: 2, ties: 0 },
  "Detroit": { wins: 5, losses: 2, ties: 0 },
  "Miami": { wins: 4, losses: 3, ties: 0 },
  "New_York": { wins: 4, losses: 3, ties: 0 },  // Knicks
  "Cleveland": { wins: 4, losses: 3, ties: 0 },
  "Toronto": { wins: 3, losses: 4, ties: 0 },
  "Atlanta": { wins: 3, losses: 4, ties: 0 },
  "Orlando": { wins: 3, losses: 4, ties: 0 },
  "Charlotte": { wins: 3, losses: 4, ties: 0 },
  "Boston": { wins: 3, losses: 5, ties: 0 },
  "Indiana": { wins: 1, losses: 6, ties: 0 },
  "Washington": { wins: 1, losses: 6, ties: 0 },
  "Brooklyn": { wins: 0, losses: 7, ties: 0 },
  "Oklahoma_City": { wins: 7, losses: 0, ties: 0 },
  "San_Antonio": { wins: 5, losses: 1, ties: 0 },
  "Los_Angeles": { wins: 6, losses: 2, ties: 0 },  // Lakers
  "Denver": { wins: 4, losses: 2, ties: 0 },
  "Houston": { wins: 4, losses: 2, ties: 0 },
  "Minnesota": { wins: 4, losses: 3, ties: 0 },
  "Portland": { wins: 4, losses: 3, ties: 0 },
  "Golden_State": { wins: 4, losses: 3, ties: 0 },
  "LA": { wins: 3, losses: 3, ties: 0 },  // Clippers
  "Phoenix": { wins: 3, losses: 4, ties: 0 },
  "Utah": { wins: 3, losses: 4, ties: 0 },
  "Memphis": { wins: 3, losses: 5, ties: 0 },
  "Sacramento": { wins: 2, losses: 5, ties: 0 },
  "Dallas": { wins: 2, losses: 5, ties: 0 },
  "New_Orleans": { wins: 0, losses: 6, ties: 0 },
};

// MLB 2025 Final Season Standings (World Series: Dodgers def. Blue Jays 4-3)
const MLB_RECORDS = {
  "Los_Angeles": { wins: 101, losses: 61, ties: 0 },  // Dodgers - NL Champions
  "Toronto": { wins: 97, losses: 65, ties: 0 },  // Blue Jays - AL Champions (World Series Runner-up)
  "Milwaukee": { wins: 95, losses: 67, ties: 0 },  // Brewers - NL Central Champions
  "Seattle": { wins: 93, losses: 69, ties: 0 },  // Mariners - AL West Champions
  "New_York": { wins: 91, losses: 71, ties: 0 },  // Yankees
  "Philadelphia": { wins: 89, losses: 73, ties: 0 },  // Phillies
  "Atlanta": { wins: 92, losses: 70, ties: 0 },  // Braves
  "Detroit": { wins: 88, losses: 74, ties: 0 },  // Tigers - AL Wild Card
  "Chicago": { wins: 87, losses: 75, ties: 0 },  // Cubs
  "Cleveland": { wins: 85, losses: 77, ties: 0 },  // Guardians
  "Baltimore": { wins: 84, losses: 78, ties: 0 },  // Orioles
  "Houston": { wins: 86, losses: 76, ties: 0 },  // Astros
  "San_Diego": { wins: 89, losses: 73, ties: 0 },  // Padres
  "Boston": { wins: 82, losses: 80, ties: 0 },  // Red Sox
  "Arizona": { wins: 85, losses: 77, ties: 0 },  // Diamondbacks
  "Tampa_Bay": { wins: 79, losses: 83, ties: 0 },  // Rays
  "San_Francisco": { wins: 78, losses: 84, ties: 0 },  // Giants
  "St__Louis": { wins: 76, losses: 86, ties: 0 },  // Cardinals
  "Minnesota": { wins: 81, losses: 81, ties: 0 },  // Twins
  "Kansas_City": { wins: 77, losses: 85, ties: 0 },  // Royals
  "Texas": { wins: 75, losses: 87, ties: 0 },  // Rangers
  "Cincinnati": { wins: 74, losses: 88, ties: 0 },  // Reds
  "Pittsburgh": { wins: 71, losses: 91, ties: 0 },  // Pirates
  "Miami": { wins: 68, losses: 94, ties: 0 },  // Marlins
  "Washington": { wins: 67, losses: 95, ties: 0 },  // Nationals
  "Angels": { wins: 65, losses: 97, ties: 0 },  // Angels
  "Athletics": { wins: 62, losses: 100, ties: 0 },  // Athletics
  "Colorado": { wins: 48, losses: 114, ties: 0 },  // Rockies - Worst record in modern era
};

function updateTeamRecord(filePath, wins, losses, ties = 0) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const gamesPlayed = wins + losses + ties;
    const winPercent = gamesPlayed > 0 ? wins / gamesPlayed : 0;
    
    // Find the record section
    let recordPath = null;
    if (data.detail?.team?.record) {
      recordPath = data.detail.team.record;
    } else if (data.team?.record) {
      recordPath = data.team.record;
    }
    
    if (recordPath?.items?.[0]) {
      const totalRecord = recordPath.items[0];
      
      // Update summary
      totalRecord.summary = ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
      
      // Add/update wins, losses, ties at the record level (for Statistics page to read)
      totalRecord.wins = wins;
      totalRecord.losses = losses;
      totalRecord.ties = ties;
      
      // Update stats array
      if (totalRecord.stats) {
        totalRecord.stats.forEach(stat => {
          if (stat.name === 'wins') stat.value = wins;
          if (stat.name === 'losses') stat.value = losses;
          if (stat.name === 'ties') stat.value = ties;
          if (stat.name === 'gamesPlayed') stat.value = gamesPlayed;
          if (stat.name === 'winPercent') stat.value = winPercent;
        });
      }
    }
    
    // Write updated data
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
    return false;
  }
}

function updateAllTeams() {
  const basePath = path.join(__dirname, '..', 'public', 'db', 'espn');
  let successCount = 0;
  let failCount = 0;
  
  // Update NFL teams
  console.log('Updating NFL teams...');
  Object.entries(NFL_RECORDS).forEach(([filename, record]) => {
    const filePath = path.join(basePath, 'nfl', `${filename}.json`);
    if (fs.existsSync(filePath)) {
      if (updateTeamRecord(filePath, record.wins, record.losses, record.ties)) {
        console.log(`✓ Updated ${filename}: ${record.wins}-${record.losses}`);
        successCount++;
      } else {
        console.log(`✗ Failed to update ${filename}`);
        failCount++;
      }
    } else {
      console.log(`⚠ File not found: ${filename}.json`);
    }
  });
  
  // Update NBA teams
  console.log('\nUpdating NBA teams...');
  Object.entries(NBA_RECORDS).forEach(([filename, record]) => {
    const filePath = path.join(basePath, 'nba', `${filename}.json`);
    if (fs.existsSync(filePath)) {
      if (updateTeamRecord(filePath, record.wins, record.losses, record.ties)) {
        console.log(`✓ Updated ${filename}: ${record.wins}-${record.losses}`);
        successCount++;
      } else {
        console.log(`✗ Failed to update ${filename}`);
        failCount++;
      }
    } else {
      console.log(`⚠ File not found: ${filename}.json`);
    }
  });
  
  // Update MLB teams
  console.log('\nUpdating MLB teams...');
  Object.entries(MLB_RECORDS).forEach(([filename, record]) => {
    const filePath = path.join(basePath, 'mlb', `${filename}.json`);
    if (fs.existsSync(filePath)) {
      if (updateTeamRecord(filePath, record.wins, record.losses, record.ties)) {
        console.log(`✓ Updated ${filename}: ${record.wins}-${record.losses}`);
        successCount++;
      } else {
        console.log(`✗ Failed to update ${filename}`);
        failCount++;
      }
    } else {
      console.log(`⚠ File not found: ${filename}.json`);
    }
  });
  
  console.log(`\n✅ Complete! Updated ${successCount} teams successfully, ${failCount} failed.`);
}

updateAllTeams();

