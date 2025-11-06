# Team Stats Update Scripts

This directory contains scripts to automatically fetch and update team statistics from ESPN API.

## 📋 Quick Start

### Test Manual Update (Run Once)
```bash
npm run update-stats
```

### Set Up Automatic Weekly Updates

**Choose one method:**

#### Method 1: Windows Task Scheduler (Recommended for Windows)
- Follow the detailed instructions in [`SCHEDULING_INSTRUCTIONS.md`](./SCHEDULING_INSTRUCTIONS.md)
- Best for: Running updates even when your computer is on but app is not running
- Setup time: 5 minutes

#### Method 2: Node.js Scheduler (Cross-platform)
```bash
# Install the scheduler dependency
npm run schedule:install

# Start the scheduler (keeps running)
npm run schedule:start
```
- Best for: When you want updates to run while your dev server is running
- The scheduler will run every Sunday at 1:00 AM

#### Method 3: Manual Updates
Just run `npm run update-stats` whenever you want to update team data.

---

## 📁 Files in This Directory

### Main Scripts
- **`fetch_team_stats.js`** - Core script that fetches all team data from ESPN API
- **`scheduler.js`** - Node.js cron job for automatic weekly updates

### Windows Scripts
- **`update_teams_weekly.bat`** - Batch file for Windows Command Prompt
- **`update_teams_weekly.ps1`** - PowerShell script for Windows

### Documentation
- **`SCHEDULING_INSTRUCTIONS.md`** - Detailed setup instructions for all platforms
- **`README.md`** - This file

### Generated Files
- **`update_log.txt`** - Log of all automatic updates (created automatically)

---

## 🏈 What Gets Updated?

The script fetches fresh data for:
- **NFL Teams** (32 teams)
- **NBA Teams** (30 teams)
- **MLB Teams** (30 teams)

### Data Includes:
- Current wins/losses/ties
- Win percentage
- Points scored/allowed
- Point differential
- Current streak
- Team logos
- Next game information
- And much more!

---

## ⏰ Recommended Update Schedule

### During Active Seasons:
- **NFL**: Sunday nights or Monday mornings (season: September - February)
- **NBA**: Any day (season: October - June)
- **MLB**: Any day (season: April - October)

**Default Schedule**: Every Sunday at 1:00 AM

### After Season Ends:
- Disable (but don't delete) your scheduled task
- Re-enable when the next season starts

---

## 🔧 Customizing the Schedule

### Using Node.js Scheduler (`scheduler.js`):

Change this line in `scheduler.js`:
```javascript
const SCHEDULE = '0 1 * * 0'; // Minute Hour Day Month Weekday
```

Common schedules:
- `'0 1 * * 0'` - Every Sunday at 1:00 AM (default)
- `'0 0 * * 1'` - Every Monday at midnight
- `'0 3 * * *'` - Every day at 3:00 AM
- `'0 12 * * 0,3'` - Every Sunday and Wednesday at noon

### Using Windows Task Scheduler:
- Open Task Scheduler
- Right-click your task → Properties
- Go to Triggers tab
- Click Edit to modify the schedule

---

## 📊 Monitoring Updates

Check the log file to see when updates ran:
```bash
type scripts\update_log.txt    # Windows CMD
cat scripts/update_log.txt     # PowerShell/Mac/Linux
```

Each entry shows:
- Date and time of update
- Success/failure status
- Any errors encountered

---

## 🐛 Troubleshooting

### Script doesn't run automatically
1. Check that Task Scheduler task is enabled
2. Verify Node.js is installed and in PATH
3. Check `update_log.txt` for error messages

### "Cannot find module 'node-cron'" error
```bash
npm run schedule:install
```

### Updates are slow
This is normal! The script fetches data for 90+ teams (NBA, NFL, MLB) and includes a delay between requests to avoid rate limiting. A full update takes about 10-15 minutes.

### Some teams fail to fetch
- A few teams (like Oakland Athletics, Chicago White Sox) may have moved or have API issues
- These are noted in the console output
- Other teams will still update successfully

### Want to update only one league?
```bash
npm run update-nba   # NBA only
npm run update-nfl   # NFL only
npm run update-mlb   # MLB only
```

---

## 🚀 Advanced Usage

### Run update immediately for testing
Edit `scheduler.js` and uncomment this line:
```javascript
// runUpdate();
```

### Change timezone
Edit `scheduler.js`:
```javascript
timezone: "America/New_York"  // Change to your timezone
```

Common timezones:
- `"America/New_York"` (Eastern)
- `"America/Chicago"` (Central)
- `"America/Denver"` (Mountain)
- `"America/Los_Angeles"` (Pacific)

### Stop the scheduler
Press `Ctrl + C` in the terminal running the scheduler

---

## 📝 Notes

- The first update may take 10-15 minutes due to API rate limiting
- Updates are non-destructive (they overwrite existing files with fresh data)
- Old data is not backed up (consider git commits if needed)
- ESPN API is free but may have rate limits
- Data is cached locally in `public/db/espn/`

---

## 🆘 Need Help?

1. Read [`SCHEDULING_INSTRUCTIONS.md`](./SCHEDULING_INSTRUCTIONS.md) for detailed setup
2. Check `update_log.txt` for error messages
3. Try running `npm run update-stats` manually first
4. Ensure you have an active internet connection

---

## 📅 Season End Dates (Approximate)

Remember to disable updates when seasons end:

- **MLB**: Early October (playoffs through October)
- **NFL**: Early February (Super Bowl)
- **NBA**: Mid-June (Finals)

Re-enable when new seasons start:
- **MLB**: Early April
- **NFL**: Early September  
- **NBA**: Late October

---

**Happy coding! 🏀 🏈 ⚾**
