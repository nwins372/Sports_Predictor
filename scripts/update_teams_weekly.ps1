# Weekly Team Stats Update Script (PowerShell)
# This script updates all team statistics from ESPN API

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Weekly Team Stats Update" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Started at: $(Get-Date)" -ForegroundColor Yellow
Write-Host ""

# Change to script directory
Set-Location -Path $PSScriptRoot
Set-Location -Path ..

Write-Host "Fetching latest team statistics from ESPN..." -ForegroundColor Green
node scripts/fetch_team_stats.js

Write-Host ""
Write-Host "Update completed at: $(Get-Date)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Optional: Append to log file
Add-Content -Path "scripts/update_log.txt" -Value "Update completed: $(Get-Date)"

