#!/usr/bin/env node
/*
  fetch_espn_teams.js

  Fetch team lists and per-team JSON from ESPN endpoints (based on nntrn gist).
  Saves output to db/espn/{league}/teams.json and per-team files {TEAM_ABBR}.json

  Usage:
    node scripts/fetch_espn_teams.js --league=nfl --delay=250
    node scripts/fetch_espn_teams.js --league=nba --delay=250

  Notes:
  - Uses global fetch (Node 18+). If running older Node, install node-fetch and set GLOBAL_FETCH env.
  - Adds a delay between requests (ms) to be polite and avoid rate limits.
  - This script is best run server-side (locally or in a worker) and the JSONs imported into Supabase.
*/

const fs = require('fs');
const path = require('path');

const argv = require('minimist')(process.argv.slice(2));
const league = (argv.league || 'nfl').toLowerCase();
const delayMs = Number(argv.delay || 300);

const outDir = path.join(__dirname, '..', 'db', 'espn', league);
const publicDir = path.join(__dirname, '..', 'public', 'db', 'espn', league);
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

  const endpoints = {
  nfl: {
    teams: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
    team: (idOrAbbr) => `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${idOrAbbr}`,
    roster: (id) => `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${id}/roster`,
    injuries: (abbr) => `https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries?team=${abbr}`
  },
  nba: {
    teams: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams',
    team: (idOrAbbr) => `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${idOrAbbr}`,
    roster: (id) => `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${id}/roster`,
    injuries: (abbr) => `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/injuries?team=${abbr}`
  },
  mlb: {
    teams: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams',
    team: (idOrAbbr) => `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/${idOrAbbr}`,
    roster: (id) => `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/${id}/roster`,
    injuries: (abbr) => `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/injuries?team=${abbr}`
  }
};

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchJson(url) {
  if (typeof fetch === 'undefined') {
    // try to require node-fetch
    try {
      global.fetch = require('node-fetch');
    } catch (e) {
      throw new Error('Global fetch not available. Run on Node 18+ or install node-fetch.');
    }
  }
  const res = await fetch(url, { headers: { 'User-Agent': 'Sports_Predictor_Script/1.0' } });
  if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  return res.json();
}

async function main() {
  if (!['nfl', 'nba', 'mlb'].includes(league)) {
    console.error('Unsupported league. Use --league=nfl|nba|mlb');
    process.exit(2);
  }

  console.log(`Fetching ${league.toUpperCase()} teams...`);

  const cfg = endpoints[league];
  const teamsRes = await fetchJson(cfg.teams);

  // teamsRes has an array structure; try to extract team objects
  const teams = (teamsRes?.sports?.[0]?.leagues?.[0]?.teams) || teamsRes?.teams || [];

  const simplified = teams.map((t) => {
    // t may be nested with team or id
    const teamObj = t.team || t;
    return {
      id: teamObj.id || (teamObj?.team && teamObj.team.id) || null,
      name: teamObj.displayName || teamObj.name || teamObj.shortDisplayName || teamObj.fullName || null,
      abbreviation: (teamObj.abbr || teamObj.shortName || teamObj.location || '').toString(),
      location: teamObj.location || null,
      logo: teamObj.logo || teamObj.logo?.href || null,
      links: teamObj.links || null,
      raw: teamObj
    };
  });

  const teamsFile = path.join(outDir, 'teams.json');
  fs.writeFileSync(teamsFile, JSON.stringify(simplified, null, 2));
  console.log(`Saved ${simplified.length} teams to ${teamsFile}`);
  
  // Also copy to public directory
  const publicTeamsFile = path.join(publicDir, 'teams.json');
  fs.writeFileSync(publicTeamsFile, JSON.stringify(simplified, null, 2));
  console.log(`Also saved to ${publicTeamsFile}`);

  for (let idx = 0; idx < simplified.length; idx++) {
    const t = simplified[idx];
    try {
      // use abbreviation for filename when possible
      const fileNameSafe = (t.abbreviation || t.id || `team${idx}`).replace(/[^a-z0-9_-]/gi, '_');
      const teamOut = path.join(outDir, `${fileNameSafe}.json`);
      console.log(`Fetching details for ${t.name} (${t.id || t.abbreviation}) -> ${teamOut}`);

      const detail = await fetchJson(cfg.team(t.id || t.abbreviation));
      await wait(100);
      const roster = await (async () => {
        try { return await fetchJson(cfg.roster(t.id || t.abbreviation)); } catch (e) { return null; }
      })();
      await wait(100 + delayMs);
      const injuries = await (async () => {
        try { return await fetchJson(cfg.injuries(t.abbreviation || t.id)); } catch (e) { return null; }
      })();

      const out = { fetchedAt: new Date().toISOString(), detail, roster, injuries };
      fs.writeFileSync(teamOut, JSON.stringify(out, null, 2));
      
      // Also copy to public directory for frontend access
      const publicTeamOut = path.join(publicDir, `${fileNameSafe}.json`);
      fs.writeFileSync(publicTeamOut, JSON.stringify(out, null, 2));
      
      // polite delay
      await wait(delayMs);
    } catch (e) {
      console.error('Failed for team', t.name, e.message || e);
      // continue
      await wait(delayMs);
    }
  }

  console.log('Done.');
}

main().catch((err) => { console.error(err); process.exit(1); });
