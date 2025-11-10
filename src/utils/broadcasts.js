const nflConferenceMap = {
  // AFC Teams
  "Baltimore Ravens": "AFC", "Buffalo Bills": "AFC", "Cincinnati Bengals": "AFC",
  "Cleveland Browns": "AFC", "Denver Broncos": "AFC", "Houston Texans": "AFC",
  "Indianapolis Colts": "AFC", "Jacksonville Jaguars": "AFC", "Kansas City Chiefs": "AFC",
  "Las Vegas Raiders": "AFC", "Los Angeles Chargers": "AFC", "Miami Dolphins": "AFC",
  "New England Patriots": "AFC", "New York Jets": "AFC", "Pittsburgh Steelers": "AFC",
  "Tennessee Titans": "AFC",
  // NFC Teams
  "Arizona Cardinals": "NFC", "Atlanta Falcons": "NFC", "Carolina Panthers": "NFC",
  "Chicago Bears": "NFC", "Dallas Cowboys": "NFC", "Detroit Lions": "NFC",
  "Green Bay Packers": "NFC", "Los Angeles Rams": "NFC", "Minnesota Vikings": "NFC",
  "New Orleans Saints": "NFC", "New York Giants": "NFC", "Philadelphia Eagles": "NFC",
  "San Francisco 49ers": "NFC", "Seattle Seahawks": "NFC", "Tampa Bay Buccaneers": "NFC",
  "Washington Commanders": "NFC",
};

export const getBroadcastInfo = (game, sport) => {
  const gameDate = new Date(game.dateUtcISO);
  const dayOfWeek = gameDate.getUTCDay(); // Sunday = 0, Saturday = 6

  switch (sport) {
    case "nfl":
      if (dayOfWeek === 4) return ['prime_video'];
      // Monday Night Football is often on both ESPN and ABC
      if (dayOfWeek === 1) return ['espn', 'abc']; 
      if (dayOfWeek === 0) {
        const gameHourUTC = gameDate.getUTCHours();
        if (gameHourUTC >= 0 && gameHourUTC < 4) {
          return ['nbc'];
        }
        const awayConference = nflConferenceMap[game.awayTeam];
        if (awayConference === "AFC") return ['cbs'];
        if (awayConference === "NFC") return ['fox'];
        return ['cbs', 'fox'];
      }
      return ["nfl"]; 

    case "nba":
      // National games are often also on local RSNs
      if (dayOfWeek === 3) return ['espn', 'rsn']; 
      if (dayOfWeek === 4) return ['tnt', 'rsn']; 
      if (dayOfWeek === 5) return ['espn', 'rsn'];
      if (dayOfWeek === 0) return ['abc', 'rsn'];
      // For non-national games, it's either RSN or League Pass
      return ["NBA"]; 

    case "mlb":
      if (dayOfWeek === 5) return ['apple_tv'];
      // Saturday games on FOX are often exclusive, but we can add RSN as a possibility
      if (dayOfWeek === 6) return ['fox', 'rsn']; 
      if (dayOfWeek === 0) return ['espn', 'rsn']; 
      return ['mlb']; 

    default:
      return "N/A";
  }
};