/**
 * Automated Team Stats Scheduler
 * This script runs the team stats update automatically on a weekly schedule
 * 
 * To use:
 * 1. Install node-cron: npm install node-cron
 * 2. Run this script: node scripts/scheduler.js
 * 3. Keep it running in the background
 */

const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Schedule: Every Sunday at 1:00 AM (after most games conclude)
// Cron format: minute hour day month weekday
// '0 1 * * 0' = At 1:00 AM every Sunday
const SCHEDULE = '0 1 * * 0';

// For testing, you can use: '*/5 * * * *' (every 5 minutes)
// const SCHEDULE = '*/5 * * * *';

function logMessage(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  console.log(logEntry.trim());
  
  // Append to log file
  const logPath = path.join(__dirname, 'update_log.txt');
  fs.appendFileSync(logPath, logEntry);
}

function runUpdate() {
  logMessage('🏈 Starting weekly team stats update...');
  
  const scriptPath = path.join(__dirname, 'fetch_team_stats.js');
  
  exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      logMessage(`❌ Error during update: ${error.message}`);
      return;
    }
    
    if (stderr) {
      logMessage(`⚠️  Warning: ${stderr}`);
    }
    
    // Log the output
    if (stdout) {
      logMessage('Update output:\n' + stdout);
    }
    
    logMessage('✅ Weekly team stats update completed successfully!');
  });
}

// Schedule the task
cron.schedule(SCHEDULE, () => {
  runUpdate();
}, {
  scheduled: true,
  timezone: "America/New_York" // Change to your timezone
});

logMessage('📅 Team stats scheduler initialized');
logMessage(`⏰ Schedule: ${SCHEDULE} (Every Sunday at 1:00 AM)`);
logMessage('🔄 Scheduler is running. Press Ctrl+C to stop.');

// Run update immediately if needed (optional, comment out if not needed)
// runUpdate();

// Keep the process running
process.on('SIGINT', () => {
  logMessage('👋 Scheduler stopped by user');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logMessage(`💥 Uncaught error: ${error.message}`);
});

