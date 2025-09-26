#!/usr/bin/env node
/*
  upload_espn_to_supabase.js

  Reads JSON files produced by fetch_espn_teams.js under db/espn/{league}
  and upserts them into a Supabase table named `espn_teams` with columns:
    - league (text)
    - team_id (text)
    - abbreviation (text)
    - data (jsonb)

  Usage:
    SUPABASE_URL=https://xyz.supabase.co SUPABASE_KEY=xxx node scripts/upload_espn_to_supabase.js --league=nfl

  The script will check for SUPABASE_URL and SUPABASE_KEY in env and exit if missing.
*/

const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const league = (argv.league || 'nfl').toLowerCase();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in environment. Aborting.');
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function main() {
  const dir = path.join(__dirname, '..', 'db', 'espn', league);
  if (!fs.existsSync(dir)) {
    console.error('Directory not found:', dir);
    process.exit(2);
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'teams.json');
  console.log(`Found ${files.length} team files in ${dir}`);

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const json = JSON.parse(raw);
      // try to extract id/abbr
      const detail = json.detail || json;
      const id = detail?.id || detail?.team?.id || detail?.id || file.replace(/\.json$/, '');
      const abbr = (detail?.abbreviation || detail?.team?.abbreviation || detail?.team?.abbr || '').toString();

      const payload = {
        league,
        team_id: id?.toString?.() || file.replace(/\.json$/, ''),
        abbreviation: abbr || null,
        data: json
      };

      console.log('Upserting', payload.team_id, payload.abbreviation);
      const { error } = await supabase.from('espn_teams').upsert({ league: payload.league, team_id: payload.team_id, abbreviation: payload.abbreviation, data: payload.data }, { onConflict: 'team_id' });
      if (error) {
        console.error('Upsert error for', payload.team_id, error.message);
      }
    } catch (e) {
      console.error('Skipping', file, e.message || e);
    }
  }

  console.log('Upload finished.');
}

main().catch((err) => { console.error(err); process.exit(1); });
