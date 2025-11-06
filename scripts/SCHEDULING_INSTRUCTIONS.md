# Weekly Team Stats Update - Scheduling Instructions

This guide will help you set up automatic weekly updates for team statistics.

## Option 1: Windows Task Scheduler (Recommended for Windows)

### Setup Steps:

1. **Open Task Scheduler**
   - Press `Win + R`, type `taskschd.msc`, and press Enter
   - Or search for "Task Scheduler" in the Start menu

2. **Create a New Task**
   - Click "Create Basic Task" in the right panel
   - Name: `Sports Predictor - Weekly Stats Update`
   - Description: `Updates team statistics from ESPN API every week`
   - Click "Next"

3. **Set the Trigger**
   - Select "Weekly"
   - Click "Next"
   - Choose your preferred day (e.g., Sunday at midnight)
   - Set time: `00:00:00` (or your preferred time)
   - Recur every: `1 weeks`
   - Click "Next"

4. **Set the Action**
   - Select "Start a program"
   - Click "Next"
   - **For Batch Script:**
     - Program/script: `C:\Windows\System32\cmd.exe`
     - Add arguments: `/c "C:\Users\nickz\OneDrive\Documents\GitHub\Sports_Predictor\scripts\update_teams_weekly.bat"`
   - **OR For PowerShell Script:**
     - Program/script: `powershell.exe`
     - Add arguments: `-ExecutionPolicy Bypass -File "C:\Users\nickz\OneDrive\Documents\GitHub\Sports_Predictor\scripts\update_teams_weekly.ps1"`
   - Click "Next"

5. **Finish Setup**
   - Check "Open the Properties dialog"
   - Click "Finish"

6. **Configure Additional Settings**
   - In the Properties dialog:
     - General tab: Check "Run whether user is logged on or not"
     - Settings tab: Check "Allow task to be run on demand"
     - Click "OK"

### Test the Task

- Right-click your task in Task Scheduler
- Select "Run"
- Check the "Last Run Result" should show "The operation completed successfully (0x0)"

---

## Option 2: Node.js Cron Job (Cross-platform)

If you want the updates to run automatically when your app is running:

1. **Install node-cron:**
   ```bash
   npm install node-cron
   ```

2. **Create a scheduler file** (`scripts/scheduler.js`):
   ```javascript
   const cron = require('node-cron');
   const { exec } = require('child_process');
   const path = require('path');

   // Run every Sunday at midnight
   cron.schedule('0 0 * * 0', () => {
     console.log('Running weekly team stats update...');
     
     const scriptPath = path.join(__dirname, 'fetch_team_stats.js');
     exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
       if (error) {
         console.error(`Error: ${error.message}`);
         return;
       }
       if (stderr) {
         console.error(`stderr: ${stderr}`);
         return;
       }
       console.log(stdout);
       console.log('Weekly update completed successfully!');
     });
   });

   console.log('Team stats scheduler initialized. Will run every Sunday at midnight.');
   ```

3. **Run the scheduler:**
   ```bash
   node scripts/scheduler.js
   ```

---

## Option 3: Manual Updates

If you prefer to run updates manually:

### Windows (PowerShell):
```powershell
cd C:\Users\nickz\OneDrive\Documents\GitHub\Sports_Predictor
.\scripts\update_teams_weekly.ps1
```

### Windows (Command Prompt):
```cmd
cd C:\Users\nickz\OneDrive\Documents\GitHub\Sports_Predictor
scripts\update_teams_weekly.bat
```

### Cross-platform (Node.js):
```bash
cd C:\Users\nickz\OneDrive\Documents\GitHub\Sports_Predictor
node scripts/fetch_team_stats.js
```

---

## Schedule Timeline by Sport

Consider scheduling around when stats are most likely to be updated:

- **NFL**: Sunday nights or Monday mornings (season: September - February)
- **NBA**: Any day (season: October - June)
- **MLB**: Any day (season: April - October)

**Recommended**: Sunday at 1:00 AM (after most NFL games conclude)

---

## Monitoring Updates

The scripts automatically log updates to `scripts/update_log.txt`. Check this file to verify updates are running successfully.

---

## Stopping Updates After Season

When the sports season ends, you can:

1. **Disable the Task Scheduler task** (don't delete it, just disable)
2. **Stop the Node.js scheduler** (if using Option 2)
3. **Re-enable** when the next season starts

---

## Troubleshooting

### Task doesn't run:
- Check Task Scheduler history is enabled (Actions > Enable All Tasks History)
- Verify the path to the script is correct
- Ensure Node.js is in your system PATH

### Script errors:
- Check `scripts/update_log.txt` for error messages
- Verify internet connection
- Check ESPN API availability

### Need help?
Run the script manually first to ensure it works before scheduling it.

