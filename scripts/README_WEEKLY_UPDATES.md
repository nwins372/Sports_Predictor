# Weekly Team Statistics Updates

This document explains how to keep team statistics up-to-date in the Sports Predictor application.

## Overview

Team statistics are stored in JSON files in `public/db/espn/{league}/` directories. To keep the data current, you should run the update script weekly.

## Update Script

The script `scripts/fetch_espn_teams.js` fetches current team data from ESPN API for NBA, NFL, and MLB teams.

### Running the Script

#### One-Time Update
```bash
# Update all leagues
npm run update-nba
npm run update-nfl
npm run update-mlb
```

This will:
- Fetch current team data for all teams in the specified league
- Save data to both `db/espn/{league}/` and `public/db/espn/{league}/`
- Include team records, rosters, and statistics
- Automatically copy to public directory for frontend access

#### Automated Weekly Updates

##### Option 1: Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger to "Weekly" on Sunday at midnight
4. Set action to "Start a program"
5. Program: `node`
6. Arguments: `scripts/fetch_team_stats.js`
7. Start in: `C:\Users\nickz\OneDrive\Documents\GitHub\Sports_Predictor`

##### Option 2: Linux/Mac Cron
Add this to your crontab (`crontab -e`):
```
0 0 * * 0 cd /path/to/Sports_Predictor && node scripts/fetch_team_stats.js
```

This runs every Sunday at midnight.

##### Option 3: GitHub Actions (Recommended for Production)
Create `.github/workflows/weekly-update.yml`:

```yaml
name: Weekly Team Stats Update

on:
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday at midnight UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  update-stats:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Fetch Team Stats
        run: node scripts/fetch_team_stats.js
      
      - name: Commit and Push Changes
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add public/db/espn/
          git commit -m "chore: update team statistics [skip ci]" || exit 0
          git push
```

## What Gets Updated

### NBA Teams
- Team records (wins, losses, win percentage)
- Current roster with player statistics
- Team statistics (points per game, rebounds, assists, etc.)
- Injury reports

### MLB Teams
- Team records (wins, losses, win percentage)
- Current roster with player statistics
- Team statistics (runs, hits, ERA, etc.)
- Injury reports

## Data Structure

Each team JSON file contains:
```json
{
  "fetchedAt": "2024-01-15T00:00:00.000Z",
  "detail": {
    "team": {
      "id": "1",
      "displayName": "Boston Celtics",
      "record": {
        "items": [{
          "stats": [...]
        }]
      },
      "logos": [...]
    }
  },
  "roster": {
    "entries": [...]
  },
  "injuries": [...]
}
```

## Troubleshooting

### Rate Limiting
If you encounter rate limiting errors:
- The script includes a 500ms delay between requests
- Run the script during off-peak hours
- Consider splitting NBA and MLB into separate runs

### Missing Teams
If a team shows "Data not available":
1. Check if the team name mapping exists in `Statistics.jsx`
2. Verify the JSON file exists in `public/db/espn/{league}/`
3. Run the fetch script to update the data

### Node Version
The script requires Node.js 18+ for native fetch support. If using an older version:
```bash
npm install node-fetch
```

## Manual Updates

To update a specific league only, you can modify the script temporarily:

```javascript
// In scripts/fetch_team_stats.js, change line 252:
const leagues = ['nba']; // Only NBA
// or
const leagues = ['mlb']; // Only MLB
```

## Verification

After running the script, verify the updates:
1. Check the file modification dates in `public/db/espn/`
2. View the Statistics page in your app
3. Click on a team to verify it expands with current data

## Notes

- The script fetches data from ESPN's public API
- Data is cached in the browser for 5 minutes
- The script is polite with delays to avoid rate limiting
- All data is stored locally in your repository

