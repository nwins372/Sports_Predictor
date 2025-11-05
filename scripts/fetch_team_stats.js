// Script to fetch team statistics from ESPN API and save to public/db/espn/
// Run this script weekly to update team data

const fs = require('fs');
const path = require('path');

const BASES = {
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl',
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb'
};

const TEAMS = {
  nfl: [
    { name: "Buffalo Bills", slug: "buf" },
    { name: "Miami Dolphins", slug: "mia" },
    { name: "New York Jets", slug: "nyj" },
    { name: "New England Patriots", slug: "ne" },
    { name: "Baltimore Ravens", slug: "bal" },
    { name: "Cincinnati Bengals", slug: "cin" },
    { name: "Pittsburgh Steelers", slug: "pit" },
    { name: "Cleveland Browns", slug: "cle" },
    { name: "Jacksonville Jaguars", slug: "jax" },
    { name: "Tennessee Titans", slug: "ten" },
    { name: "Indianapolis Colts", slug: "ind" },
    { name: "Houston Texans", slug: "hou" },
    { name: "Kansas City Chiefs", slug: "kc" },
    { name: "Las Vegas Raiders", slug: "lv" },
    { name: "Los Angeles Chargers", slug: "lac" },
    { name: "Denver Broncos", slug: "den" },
    { name: "Philadelphia Eagles", slug: "phi" },
    { name: "Dallas Cowboys", slug: "dal" },
    { name: "New York Giants", slug: "nyg" },
    { name: "Washington Commanders", slug: "wsh" },
    { name: "Detroit Lions", slug: "det" },
    { name: "Green Bay Packers", slug: "gb" },
    { name: "Minnesota Vikings", slug: "min" },
    { name: "Chicago Bears", slug: "chi" },
    { name: "Tampa Bay Buccaneers", slug: "tb" },
    { name: "New Orleans Saints", slug: "no" },
    { name: "Atlanta Falcons", slug: "atl" },
    { name: "Carolina Panthers", slug: "car" },
    { name: "Los Angeles Rams", slug: "lar" },
    { name: "Seattle Seahawks", slug: "sea" },
    { name: "San Francisco 49ers", slug: "sf" },
    { name: "Arizona Cardinals", slug: "ari" }
  ],
  nba: [
    { name: "Boston Celtics", slug: "bos" },
    { name: "Miami Heat", slug: "mia" },
    { name: "Milwaukee Bucks", slug: "mil" },
    { name: "Philadelphia 76ers", slug: "phi" },
    { name: "Brooklyn Nets", slug: "bkn" },
    { name: "New York Knicks", slug: "ny" },
    { name: "Toronto Raptors", slug: "tor" },
    { name: "Chicago Bulls", slug: "chi" },
    { name: "Cleveland Cavaliers", slug: "cle" },
    { name: "Detroit Pistons", slug: "det" },
    { name: "Indiana Pacers", slug: "ind" },
    { name: "Atlanta Hawks", slug: "atl" },
    { name: "Charlotte Hornets", slug: "cha" },
    { name: "Orlando Magic", slug: "orl" },
    { name: "Washington Wizards", slug: "wsh" },
    { name: "Denver Nuggets", slug: "den" },
    { name: "Minnesota Timberwolves", slug: "min" },
    { name: "Oklahoma City Thunder", slug: "okc" },
    { name: "Portland Trail Blazers", slug: "por" },
    { name: "Utah Jazz", slug: "uth" },
    { name: "Golden State Warriors", slug: "gs" },
    { name: "Los Angeles Clippers", slug: "lac" },
    { name: "Los Angeles Lakers", slug: "lal" },
    { name: "Phoenix Suns", slug: "phx" },
    { name: "Sacramento Kings", slug: "sac" },
    { name: "Dallas Mavericks", slug: "dal" },
    { name: "Houston Rockets", slug: "hou" },
    { name: "Memphis Grizzlies", slug: "mem" },
    { name: "New Orleans Pelicans", slug: "no" },
    { name: "San Antonio Spurs", slug: "sa" }
  ],
  mlb: [
    { name: "Boston Red Sox", slug: "bos" },
    { name: "New York Yankees", slug: "nyy" },
    { name: "Tampa Bay Rays", slug: "tb" },
    { name: "Toronto Blue Jays", slug: "tor" },
    { name: "Baltimore Orioles", slug: "bal" },
    { name: "Chicago White Sox", slug: "cws" },
    { name: "Cleveland Guardians", slug: "cle" },
    { name: "Detroit Tigers", slug: "det" },
    { name: "Kansas City Royals", slug: "kc" },
    { name: "Minnesota Twins", slug: "min" },
    { name: "Houston Astros", slug: "hou" },
    { name: "Los Angeles Angels", slug: "laa" },
    { name: "Oakland Athletics", slug: "oak" },
    { name: "Seattle Mariners", slug: "sea" },
    { name: "Texas Rangers", slug: "tex" },
    { name: "Atlanta Braves", slug: "atl" },
    { name: "Miami Marlins", slug: "mia" },
    { name: "New York Mets", slug: "nym" },
    { name: "Philadelphia Phillies", slug: "phi" },
    { name: "Washington Nationals", slug: "wsh" },
    { name: "Chicago Cubs", slug: "chc" },
    { name: "Cincinnati Reds", slug: "cin" },
    { name: "Milwaukee Brewers", slug: "mil" },
    { name: "Pittsburgh Pirates", slug: "pit" },
    { name: "St. Louis Cardinals", slug: "stl" },
    { name: "Arizona Diamondbacks", slug: "ari" },
    { name: "Colorado Rockies", slug: "col" },
    { name: "Los Angeles Dodgers", slug: "lad" },
    { name: "San Diego Padres", slug: "sd" },
    { name: "San Francisco Giants", slug: "sf" }
  ]
};

async function fetchTeamData(league, teamSlug) {
  const baseUrl = BASES[league];
  const url = `${baseUrl}/teams/${teamSlug}`;
  
  try {
    console.log(`Fetching ${league} team: ${teamSlug}...`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching ${league}/${teamSlug}:`, error.message);
    return null;
  }
}

function getFilenameFromTeamName(teamName, league) {
  // Convert team name to filename format
  // e.g., "Boston Celtics" -> "Boston" for NBA
  // "Boston Red Sox" -> "Boston" for MLB
  
  const nameMap = {
    nfl: {
      "Buffalo Bills": "Buffalo",
      "Miami Dolphins": "Miami",
      "New York Jets": "New_York",
      "New England Patriots": "New_England",
      "Baltimore Ravens": "Baltimore",
      "Cincinnati Bengals": "Cincinnati",
      "Pittsburgh Steelers": "Pittsburgh",
      "Cleveland Browns": "Cleveland",
      "Jacksonville Jaguars": "Jacksonville",
      "Tennessee Titans": "Tennessee",
      "Indianapolis Colts": "Indianapolis",
      "Houston Texans": "Houston",
      "Kansas City Chiefs": "Kansas_City",
      "Las Vegas Raiders": "Las_Vegas",
      "Los Angeles Chargers": "Los_Angeles",
      "Denver Broncos": "Denver",
      "Philadelphia Eagles": "Philadelphia",
      "Dallas Cowboys": "Dallas",
      "New York Giants": "New_York",
      "Washington Commanders": "Washington",
      "Detroit Lions": "Detroit",
      "Green Bay Packers": "Green_Bay",
      "Minnesota Vikings": "Minnesota",
      "Chicago Bears": "Chicago",
      "Tampa Bay Buccaneers": "Tampa_Bay",
      "New Orleans Saints": "New_Orleans",
      "Atlanta Falcons": "Atlanta",
      "Carolina Panthers": "Carolina",
      "Los Angeles Rams": "Los_Angeles",
      "Seattle Seahawks": "Seattle",
      "San Francisco 49ers": "San_Francisco",
      "Arizona Cardinals": "Arizona"
    },
    nba: {
      "Boston Celtics": "Boston",
      "Miami Heat": "Miami",
      "Milwaukee Bucks": "Milwaukee",
      "Philadelphia 76ers": "Philadelphia",
      "Brooklyn Nets": "Brooklyn",
      "New York Knicks": "New_York",
      "Toronto Raptors": "Toronto",
      "Chicago Bulls": "Chicago",
      "Cleveland Cavaliers": "Cleveland",
      "Detroit Pistons": "Detroit",
      "Indiana Pacers": "Indiana",
      "Atlanta Hawks": "Atlanta",
      "Charlotte Hornets": "Charlotte",
      "Orlando Magic": "Orlando",
      "Washington Wizards": "Washington",
      "Denver Nuggets": "Denver",
      "Minnesota Timberwolves": "Minnesota",
      "Oklahoma City Thunder": "Oklahoma_City",
      "Portland Trail Blazers": "Portland",
      "Utah Jazz": "Utah",
      "Golden State Warriors": "Golden_State",
      "Los Angeles Clippers": "LA",
      "Los Angeles Lakers": "Los_Angeles",
      "Phoenix Suns": "Phoenix",
      "Sacramento Kings": "Sacramento",
      "Dallas Mavericks": "Dallas",
      "Houston Rockets": "Houston",
      "Memphis Grizzlies": "Memphis",
      "New Orleans Pelicans": "New_Orleans",
      "San Antonio Spurs": "San_Antonio"
    },
    mlb: {
      "Boston Red Sox": "Boston",
      "New York Yankees": "New_York",
      "Tampa Bay Rays": "Tampa_Bay",
      "Toronto Blue Jays": "Toronto",
      "Baltimore Orioles": "Baltimore",
      "Chicago White Sox": "Chicago",
      "Cleveland Guardians": "Cleveland",
      "Detroit Tigers": "Detroit",
      "Kansas City Royals": "Kansas_City",
      "Minnesota Twins": "Minnesota",
      "Houston Astros": "Houston",
      "Los Angeles Angels": "Angels",
      "Oakland Athletics": "Athletics",
      "Seattle Mariners": "Seattle",
      "Texas Rangers": "Texas",
      "Atlanta Braves": "Atlanta",
      "Miami Marlins": "Miami",
      "New York Mets": "New_York",
      "Philadelphia Phillies": "Philadelphia",
      "Washington Nationals": "Washington",
      "Chicago Cubs": "Chicago",
      "Cincinnati Reds": "Cincinnati",
      "Milwaukee Brewers": "Milwaukee",
      "Pittsburgh Pirates": "Pittsburgh",
      "St. Louis Cardinals": "St_Louis",
      "Arizona Diamondbacks": "Arizona",
      "Colorado Rockies": "Colorado",
      "Los Angeles Dodgers": "Los_Angeles",
      "San Diego Padres": "San_Diego",
      "San Francisco Giants": "San_Francisco"
    }
  };
  
  return nameMap[league]?.[teamName] || teamName.replace(/\s+/g, '_');
}

async function main() {
  const leagues = ['nba', 'mlb']; // Focus on NBA and MLB as requested
  
  for (const league of leagues) {
    console.log(`\n=== Fetching ${league.toUpperCase()} teams ===`);
    
    const leagueDir = path.join(__dirname, '..', 'public', 'db', 'espn', league);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(leagueDir)) {
      fs.mkdirSync(leagueDir, { recursive: true });
      console.log(`Created directory: ${leagueDir}`);
    }
    
    const teams = TEAMS[league];
    
    for (const team of teams) {
      const data = await fetchTeamData(league, team.slug);
      
      if (data) {
        const filename = getFilenameFromTeamName(team.name, league);
        const filePath = path.join(leagueDir, `${filename}.json`);
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`✓ Saved ${team.name} to ${filename}.json`);
      } else {
        console.log(`✗ Failed to fetch ${team.name}`);
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n=== Completed ${league.toUpperCase()} ===`);
  }
  
  console.log('\n✓ All team data fetched successfully!');
  console.log('\nTo run this weekly, add this to your crontab or task scheduler:');
  console.log('0 0 * * 0 cd /path/to/project && node scripts/fetch_team_stats.js');
}

main().catch(console.error);

