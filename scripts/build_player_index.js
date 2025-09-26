#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const league = process.argv[2] || 'nba';
// Source directory: the checked-in db/espn/<league> contains the full ESPN JSONs.
const srcDir = path.join(__dirname, '..', 'db', 'espn', league);
// Output into public so the client can fetch it at runtime
const outDir = path.join(__dirname, '..', 'public', 'db', 'espn', league);
const outFile = path.join(outDir, 'player_index.json');

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return null; }
}

function extractPlayersFromTeam(teamJson, teamSlug) {
  if (!teamJson) return [];
  const players = [];
  // common locations for roster
  const roster = teamJson.roster || teamJson.detail?.roster || teamJson.detail?.team?.roster || teamJson.athletes || teamJson.detail?.athletes || teamJson.detail?.team?.players || null;
  // roster can be an array of player objects, or an object with groups (e.g., roster.athletes -> [{ position, items: [...] }])
  let entries = [];
  if (!roster) entries = [];
  else if (Array.isArray(roster)) entries = roster;
  else if (Array.isArray(roster.athletes)) entries = roster.athletes;
  else if (Array.isArray(roster.entries)) entries = roster.entries;
  else entries = roster;

  if (!Array.isArray(entries)) return [];

  for (const ent of entries) {
    // NFL files often have groups with an `items` array that contain athlete objects
    const groupItems = ent?.items || ent?.players || null;
    if (Array.isArray(groupItems)) {
      for (const a of groupItems) {
        const athlete = a?.athlete || a?.person || a || {};
        const id = athlete?.id || athlete?.personId || athlete?.uid || athlete?.athleteId || athlete?.teamId || null;
        const name = athlete?.displayName || athlete?.fullName || athlete?.fullName || athlete?.name || (athlete?.firstName && athlete?.lastName ? `${athlete.firstName} ${athlete.lastName}` : null);
        const head = athlete?.headshot?.href || athlete?.photo?.href || athlete?.images?.[0]?.url || athlete?.image?.url || null;
        if (!id || !name) continue;
        players.push({ id: String(id), name, head, teamSlug });
      }
      continue;
    }

    // Otherwise ent may be a player object directly
    const athlete = ent?.athlete || ent?.person || ent || {};
    const id = athlete?.id || athlete?.personId || athlete?.uid || athlete?.athleteId || athlete?.teamId || null;
    const name = athlete?.displayName || athlete?.fullName || athlete?.name || (athlete?.firstName && athlete?.lastName ? `${athlete.firstName} ${athlete.lastName}` : null);
    const head = athlete?.headshot?.href || athlete?.photo?.href || athlete?.images?.[0]?.url || athlete?.image?.url || null;
    if (!id || !name) continue;
    players.push({ id: String(id), name, head, teamSlug });
  }
  return players;
}

function main() {
  if (!fs.existsSync(srcDir)) {
    console.error('Source directory not found:', srcDir);
    process.exit(1);
  }
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.json'));
  const index = { byId: {}, list: [] };
  for (const f of files) {
    if (f === 'teams.json' || f === 'player_index.json') continue;
    const filePath = path.join(srcDir, f);
    const j = readJson(filePath);
    const slug = path.basename(f, '.json');
    const players = extractPlayersFromTeam(j, slug);
    for (const p of players) {
      if (!index.byId[p.id]) {
        // attach league metadata
        const entry = Object.assign({}, p, { _league: league });
        index.byId[p.id] = entry;
        index.list.push(entry);
      }
    }
  }
  try {
    fs.writeFileSync(outFile, JSON.stringify(index, null, 2), 'utf8');
    console.log('Wrote player_index:', outFile);
    console.log('Players indexed:', index.list.length);
  } catch (e) {
    console.error('Failed to write index:', e);
    process.exit(2);
  }
}

main();

