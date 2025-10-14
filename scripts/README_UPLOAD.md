Uploading fetched ESPN JSON to Supabase
=====================================

1) Create the table in Supabase (SQL editor):

```sql
create table espn_teams (
  id serial primary key,
  league text,
  team_id text unique,
  abbreviation text,
  data jsonb
);
```

2) Install dependencies (if not already):

```powershell
npm install --save-dev minimist
npm install @supabase/supabase-js
```

3) Run the upload script (set environment variables first). Example (PowerShell):

```powershell
$env:SUPABASE_URL = 'https://your.supabase.url'
$env:SUPABASE_KEY = 'your-service-role-key-or-anon-key'
node scripts/upload_espn_to_supabase.js --league=nfl
```

Notes:
- The upload script will upsert per-team JSON into `espn_teams.data`.
- Prefer using a service-role key or an admin key for upserts if you run this from a CI environment. Use caution with secrets.
