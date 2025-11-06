@echo off
REM Weekly Team Stats Update Script
REM This script updates all team statistics from ESPN API

echo ========================================
echo    Weekly Team Stats Update
echo ========================================
echo.
echo Started at: %date% %time%
echo.

cd /d "%~dp0"
cd ..

echo Fetching latest team statistics from ESPN...
node scripts/fetch_team_stats.js

echo.
echo Update completed at: %date% %time%
echo ========================================
echo.

REM Optional: Append to log file
echo Update completed: %date% %time% >> scripts/update_log.txt

pause

