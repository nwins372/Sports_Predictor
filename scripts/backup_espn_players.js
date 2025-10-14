#!/usr/bin/env node
// Safe backup script for per-team/player JSONs
// Usage:
//  node scripts/backup_espn_players.js --dry-run
//  node scripts/backup_espn_players.js --run

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run') || argv.length === 0;
const RUN = argv.includes('--run');

const repoRoot = path.resolve(__dirname, '..');
const srcDir = path.join(repoRoot, 'db', 'espn', 'nba');
const publicDir = path.join(repoRoot, 'public', 'db', 'espn', 'nba');
const backupRoot = path.join(repoRoot, 'scripts', 'backup');

function listJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.json'));
}

function shouldBackup(filename) {
  // Keep index and teams.json in public; backup per-team files under db/espn/nba
  const keep = ['player_index.json', 'teams.json'];
  if (keep.includes(filename)) return false;
  // also skip files that look like meta manifests
  if (filename.startsWith('index') || filename.startsWith('.')) return false;
  return true;
}

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

function run() {
  const srcFiles = listJsonFiles(srcDir);
  const publicFiles = listJsonFiles(publicDir);

  // prefer public copy if exists, otherwise use repo copy
  const candidates = new Set();
  srcFiles.forEach(f => { if (shouldBackup(f)) candidates.add(path.join(srcDir, f)); });
  publicFiles.forEach(f => { if (shouldBackup(f)) candidates.add(path.join(publicDir, f)); });

  if (candidates.size === 0) {
    console.log('No candidate files found to backup.');
    return;
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(backupRoot, `espn_nba_backup_${ts}`);
  ensureDir(outDir);

  console.log(DRY ? 'DRY RUN - files that would be moved:' : 'RUNNING - moving files:');
  for (const filePath of Array.from(candidates).sort()) {
    const fname = path.basename(filePath);
    const dest = path.join(outDir, fname);
    console.log(' -', filePath, '=>', dest);
    if (RUN) {
      try {
        fs.copyFileSync(filePath, dest);
        // do not delete original; user asked for backup only
      } catch (e) {
        console.error('Failed to copy', filePath, e.message);
      }
    }
  }

  if (RUN) console.log('\nBackup completed to', outDir);
  else console.log('\nDry run complete. To perform the backup run: node scripts/backup_espn_players.js --run');
}

run();
