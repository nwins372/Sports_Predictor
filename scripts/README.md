fetch_espn_teams.js
====================

Simple Node script to fetch ESPN team lists and per-team JSON (detail/roster/injuries) and save to `db/espn/{league}`.

Requirements
- Node 18+ (global fetch available) OR install `node-fetch` in the workspace.
- `minimist` module (for command-line args). Install with `npm i -D minimist` in the repo root.

Usage

Install minimist if needed:

```powershell
npm install --save-dev minimist
```

Run the script:

```powershell
# fetch NFL teams (default delay 300ms)
node scripts/fetch_espn_teams.js --league=nfl --delay=300

# fetch NBA teams
node scripts/fetch_espn_teams.js --league=nba --delay=300
```

Notes
- The script is intentionally cautious: it adds delays between requests to reduce the chance of rate limiting.
- Run this on a server or locally; it's designed to create static JSON files you can import into Supabase.
- The script saves `teams.json` and per-team `{ABBR}.json` files under `db/espn/{league}`.
