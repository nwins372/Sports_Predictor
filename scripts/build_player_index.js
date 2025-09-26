#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const league = process.argv[2] || 'nba';
const dbDir = path.join(__dirname, '..', 'public', 'db', 'espn', league);
const outFile = path.join(dbDir, 'player_index.json');

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return null; }
}

function extractPlayersFromTeam(teamJson, teamSlug) {
  if (!teamJson) return [];
  const players = [];
  // common locations for roster
  const roster = teamJson.roster || teamJson.detail?.roster || teamJson.detail?.team?.roster || teamJson.athletes || teamJson.detail?.athletes || teamJson.detail?.team?.players || null;
  const entries = roster?.athletes || roster?.entries || roster || [];
  if (!Array.isArray(entries)) return [];
  for (const ent of entries) {
    const athlete = ent?.athlete || ent?.person || ent || {};
    const id = athlete?.id || athlete?.personId || athlete?.uid || athlete?.athleteId || athlete?.teamId || null;
    const name = athlete?.displayName || athlete?.fullName || athlete?.name || null;
    const head = athlete?.headshot?.href || athlete?.photo?.href || athlete?.images?.[0]?.url || athlete?.image?.url || null;
    if (!id || !name) continue;
    players.push({ id: String(id), name, head, teamSlug });
  }
  return players;
}

function main() {
  if (!fs.existsSync(dbDir)) {
    console.error('Directory not found:', dbDir);
    process.exit(1);
  }
  const files = fs.readdirSync(dbDir).filter(f => f.endsWith('.json'));
  const index = { byId: {}, list: [] };
  for (const f of files) {
    if (f === 'teams.json' || f === 'player_index.json') continue;
    const filePath = path.join(dbDir, f);
    const j = readJson(filePath);
    const slug = path.basename(f, '.json');
    const players = extractPlayersFromTeam(j, slug);
    for (const p of players) {
      if (!index.byId[p.id]) {
        index.byId[p.id] = p;
        index.list.push(p);
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
