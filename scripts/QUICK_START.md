# Quick Start - Update Team Statistics

## Initial Setup (Run Once)

To populate your database with current NBA, NFL, and MLB team statistics:

```bash
# Update all leagues
npm run update-nba
npm run update-nfl
npm run update-mlb
```

## What This Does

1. Fetches current team data from ESPN API
2. Saves to both `db/espn/{league}/` and `public/db/espn/{league}/`
3. Includes:
   - Team records (wins/losses)
   - Current rosters
   - Player statistics
   - Injury reports
4. Automatically copies to public directory for frontend access

## Weekly Updates

### Option 1: GitHub Actions (Recommended)
The `.github/workflows/weekly-team-stats-update.yml` file is already configured to run automatically every Sunday at midnight UTC.

To manually trigger:
1. Go to your GitHub repository
2. Click "Actions" tab
3. Select "Weekly Team Stats Update"
4. Click "Run workflow"

### Option 2: Local Script
Run this command weekly:
```bash
npm run update-stats
```

### Option 3: Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task → "Update Sports Stats"
3. Trigger: Weekly, Sunday, 12:00 AM
4. Action: Start a program
   - Program: `node`
   - Arguments: `scripts/fetch_team_stats.js`
   - Start in: `C:\Users\nickz\OneDrive\Documents\GitHub\Sports_Predictor`

## Verification

After running the script:
1. Check that files exist in `public/db/espn/nba/` and `public/db/espn/mlb/`
2. Open your app and go to Statistics page
3. Click on a team to verify it expands with current data

## Troubleshooting

**Error: "fetch is not defined"**
- Make sure you're using Node.js 18 or higher
- Run: `node --version` to check

**Rate limiting errors**
- The script includes delays between requests
- Try running during off-peak hours
- Wait 10-15 minutes and try again

**No data showing**
- Make sure the JSON files were created in `public/db/espn/`
- Check browser console for any fetch errors
- Verify team names match exactly in Profile preferences

## Next Steps

1. Run the initial update: `npm run update-stats`
2. Test the Statistics page in your app
3. Set up automated weekly updates (GitHub Actions is easiest)
4. Enjoy current team statistics! 🎉

