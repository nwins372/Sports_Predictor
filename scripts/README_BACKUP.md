Backup helper for ESPN per-team/player JSON files

What it does
- Scans db/espn/nba and public/db/espn/nba for JSON files that look like per-team or per-player JSONs.
- Copies (backs up) those files into a timestamped folder under scripts/backup/ (does not delete originals).

Usage
- Dry-run (default):
  node scripts/backup_espn_players.js --dry-run

- Perform backup:
  node scripts/backup_espn_players.js --run

Notes
- By default the script will skip `player_index.json` and `teams.json` (these are useful to keep in public/).
- The script is conservative: it copies files into scripts/backup/espn_nba_backup_<timestamp> and does not delete or move original files.
