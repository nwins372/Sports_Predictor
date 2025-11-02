const fs = require('fs');
const path = require('path');

function normalizePosition(pos) {
  if (!pos) return null;
  const p = String(pos).toLowerCase();
  const out = new Set();
  if (/point|\bpg\b/.test(p)) out.add('PG');
  if (/shooting|\bsg\b/.test(p)) out.add('SG');
  if (/small|wing|\bsf\b/.test(p)) out.add('SF');
  if (/power|\bpf\b/.test(p)) out.add('PF');
  if (/center|\bc\b|centre/.test(p)) out.add('C');
  // combos like G/F
  const m = p.match(/\b([pgsfc])[\s\/-]?([pgsfc])?\b/);
  if (m) {
    out.add(m[1].toUpperCase());
    if (m[2]) out.add(m[2].toUpperCase());
  }
  if (out.size === 0) return null;
  // Only keep canonical codes
  const allowed = ['PG','SG','SF','PF','C'];
  const filtered = Array.from(out).map(x => x.toUpperCase()).filter(x => allowed.includes(x));
  if (filtered.length === 0) return null;
  // dedupe preserving order
  return Array.from(new Set(filtered));
}

function cleanSchoolField(s, name) {
  if (!s) return { school: null, leftover: null };
  let out = String(s).replace(/[\u2013\u2014]/g, '-').trim();
  // if contains dash split and take left part as school
  if (out.includes(' - ')) out = out.split(' - ')[0].trim();
  if (out.includes(' – ')) out = out.split(' – ')[0].trim();
  if (out.includes(' — ')) out = out.split(' — ')[0].trim();
  // remove trailing single tokens that match last name
  const nameParts = (name || '').split(' ');
  const lastName = nameParts.length ? nameParts[nameParts.length - 1].replace(/[,\.]/g, '') : null;
  if (lastName && out.endsWith(' ' + lastName)) out = out.slice(0, out.length - lastName.length).trim();
  // remove trailing artifacts like 'Jr' or 'Sr' appended
  out = out.replace(/\b(Jr|Sr|II|III|IV)\b\.?$/i, '').trim();
  // final cleanup
  out = out.replace(/[\.:;,-]+$/g, '').trim();
  if (!out) return { school: null, leftover: s };
  // leftover = original minus cleaned prefix
  const idx = s.indexOf(out);
  const leftover = idx >= 0 ? s.slice(idx + out.length).trim() : null;
  return { school: out || null, leftover: leftover || null };
}

function extractPositionFromNotes(notes) {
  if (!notes) return null;
  // look for explicit position words and common phrasing like 'wing' or 'power wing'
  const m = notes.match(/\b(PG|SG|SF|PF|C|Point Guard|Shooting Guard|Small Forward|Power Forward|Center|wing|power wing)\b/gi);
  if (!m) return null;
  const joined = m.map(x => {
    const u = x.toUpperCase();
    if (/POWER\s+WING/i.test(x)) return 'SF,PF';
    if (/\bWING\b/i.test(x)) return 'SF';
    return u.replace('POINT GUARD','PG').replace('SHOOTING GUARD','SG').replace('SMALL FORWARD','SF').replace('POWER FORWARD','PF').replace('CENTER','C');
  }).join(',');
  return normalizePosition(joined);
}

(async function main() {
  const file = path.resolve(__dirname, '../src/assets/nba2026_prospects.json');
  if (!fs.existsSync(file)) { console.error('prospects file not found:', file); process.exit(1); }
  const raw = fs.readFileSync(file, 'utf8');
  let arr = JSON.parse(raw);
  for (const p of arr) {
    // ensure notes exists
    p.notes = p.notes || '';
    // if school contains em-dash style, try to split
    const schoolField = p.school || '';
    const { school, leftover } = cleanSchoolField(schoolField, p.name);
    if (school && (!p.school || p.school !== school)) {
      // set cleaned school
      p.school = school;
      if (leftover) p.notes = ((p.notes || '') + ' | ' + leftover).replace(/^\s*\|\s*/, '').trim();
    } else if (!school) {
      // try to extract school from notes (pattern: '— School' or 'School –')
      const n = p.notes || '';
      const m = n.match(/(?:–|—|-)\s*([A-Z][A-Za-z\s\.\-&']{2,30})/);
      if (m) p.school = m[1].trim();
    }

    // remove odd trailing single-name artifacts from school
    if (p.school && p.name) {
      const lastName = p.name.split(' ').slice(-1)[0];
      if (p.school.trim().toLowerCase().endsWith(lastName.toLowerCase())) {
        p.school = p.school.trim().replace(new RegExp(lastName + '$', 'i'), '').trim();
      }
    }

    // ensure position
    if (!p.position) {
      const posFromNotes = extractPositionFromNotes(p.notes) || extractPositionFromNotes(p.school);
      let pos = posFromNotes || null;
      // height-based fallback if still missing
      if (!pos && p.height) {
        const m = String(p.height).match(/(\d)\s*[-']\s*(\d{1,2})/);
        if (m) {
          const feet = parseInt(m[1],10);
          const inches = parseInt(m[2],10);
          const total = feet * 12 + inches;
          // heuristics
          if (total >= 83) pos = 'C'; // 6-11+
          else if (total >= 81) pos = 'PF,C'; // 6-9 to 6-11
          else if (total >= 78) pos = 'PF,SF'; // 6-6 to 6-8
          else if (total >= 75) pos = 'SF,SG'; // 6-3 to 6-5
          else pos = 'PG,SG';
        }
      }
      p.position = pos || null;
    } else {
      // If notes explicitly mention a position/wing, prefer that over a noisy existing position
      const posFromNotes = extractPositionFromNotes(p.notes);
      if (posFromNotes) {
        p.position = Array.isArray(posFromNotes) ? posFromNotes.join(',') : posFromNotes;
      } else {
        const norm = normalizePosition(p.position) || p.position;
        // ensure string form
        p.position = Array.isArray(norm) ? norm.join(',') : norm;
      }
    }

    // final cleanup: trim fields
    if (p.school) p.school = p.school.trim();
    if (p.notes) p.notes = p.notes.trim();
  }
  fs.writeFileSync(file, JSON.stringify(arr, null, 2), 'utf8');
  console.log('Normalized prospects written to', file);
})();
