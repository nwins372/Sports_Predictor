// src/utils/broadcasts.js

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
  const dayOfWeek = gameDate.getUTCDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

  switch (sport) {
    case "nfl":
      // NFL Logic
      if (dayOfWeek === 4) return "Amazon Prime Video"; // Thursday
      if (dayOfWeek === 1) return "ESPN / ABC"; // Monday
      if (dayOfWeek === 0) { // Sunday
        const gameHourUTC = gameDate.getUTCHours();
        // Sunday Night Football is typically around 00:20 UTC on Monday morning, which is 8:20 PM ET on Sunday night.
        if (gameHourUTC >= 0 && gameHourUTC < 4) {
          return "NBC";
        }
        // Afternoon games
        const awayConference = nflConferenceMap[game.awayTeam];
        if (awayConference === "AFC") return "CBS";
        if (awayConference === "NFC") return "FOX";
        return "CBS / FOX"; // Fallback for interconference
      }
      return "NFL.com";

    case "nba":
      // NBA Logic
      if (dayOfWeek === 3) return "ESPN"; // Wednesday
      if (dayOfWeek === 4) return "TNT"; // Thursday
      if (dayOfWeek === 5) return "ESPN"; // Friday
      if (dayOfWeek === 0) return "ABC"; // Sunday
      return "Local RSN / NBA League Pass";

    case "mlb":
      // MLB Logic
      if (dayOfWeek === 5) return "Apple TV+"; // Friday
      if (dayOfWeek === 6) return "FOX / FS1";   // Saturday
      if (dayOfWeek === 0) return "ESPN / TBS / Peacock"; // Sunday
      return "Local RSN / MLB.TV";

    default:
      return "N/A";
  }
};