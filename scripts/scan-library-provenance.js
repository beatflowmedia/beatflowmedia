#!/usr/bin/env node
//
// scripts/scan-library-provenance.js
//
//   npm run scan:provenance
//
// Reads embedded metadata from every file in the production library and reports what
// can be PROVEN about where each one came from.
//
// WHY
// The ingest currently infers everything from folder and file names. Percy asked
// whether the files themselves say they came from Suno. Some do: the mp3s carry
//
//   comment = made with suno; created=<iso8601>; id=<uuid>
//
// which is a creation date and the Suno track id -- the first solves the missing
// releaseDate on most of the catalogue, the second is the key to the style prompt.
//
// WHAT AN ABSENT TAG DOES AND DOES NOT MEAN
// WAV does not carry this tag at all, so silence is not evidence of a different
// origin. Only a positive tag proves anything. Where a track exists as both wav and
// mp3, the mp3's tag settles the wav beside it -- same track, same origin -- and that
// inference is reported separately from a direct read so the two are never confused.
//
// This writes nothing and changes nothing.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { args } = require('./lib/admin');

const { value } = args();
const FROM = value('from', 'C:/Users/percy/Downloads/Music');
const OUT = value('out', 'LIBRARY-PROVENANCE.json');

const AUDIO_EXT = new Set(['.mp3', '.wav', '.flac', '.m4a', '.aiff', '.aif']);

const normTitle = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const slug = (s) =>
  String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (AUDIO_EXT.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

/** All format+stream tags as a flat object, or {} if unreadable. */
function tagsOf(file) {
  try {
    const raw = execFileSync(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'format_tags:stream_tags', '-of', 'json', file],
      { encoding: 'utf8', timeout: 20000, maxBuffer: 1024 * 1024 }
    );
    const parsed = JSON.parse(raw);
    const out = {};
    if (parsed.format && parsed.format.tags) Object.assign(out, parsed.format.tags);
    (parsed.streams || []).forEach((s) => s.tags && Object.assign(out, s.tags));
    return out;
  } catch {
    return {};
  }
}

const files = walk(FROM);
console.log('Scanning ' + files.length + ' files. This takes a few minutes.');
console.log('');

const records = [];
let done = 0;

for (const file of files) {
  const tags = tagsOf(file);
  const blob = Object.values(tags).join(' ');

  const suno = /made with suno/i.test(blob);
  const created = (blob.match(/created=([0-9T:\-Z.]+)/i) || [])[1] || null;
  const sunoId = (blob.match(/id=([0-9a-f-]{16,})/i) || [])[1] || null;

  records.push({
    file,
    collection: path.basename(path.dirname(file)),
    title: path.basename(file, path.extname(file)),
    ext: path.extname(file).toLowerCase(),
    suno,
    created,
    sunoId,
    // Anything that is NOT the Suno comment or an encoder string is worth a human
    // look: it would mean the file came from somewhere else.
    otherTags: Object.entries(tags)
      .filter(([k, v]) => !/^encoder$/i.test(k) && !/made with suno/i.test(String(v)))
      .map(([k, v]) => k + '=' + String(v).slice(0, 80))
  });

  done += 1;
  if (done % 100 === 0) console.log('  ' + done + '/' + files.length);
}

// A wav sitting beside a Suno-tagged mp3 of the same track is the same track.
const sunoByKey = new Set(
  records.filter((r) => r.suno).map((r) => slug(r.collection) + '|' + normTitle(r.title))
);
records.forEach((r) => {
  r.sunoBySibling =
    !r.suno && sunoByKey.has(slug(r.collection) + '|' + normTitle(r.title));
});

const direct = records.filter((r) => r.suno).length;
const sibling = records.filter((r) => r.sunoBySibling).length;
const unknown = records.filter((r) => !r.suno && !r.sunoBySibling);
const withOther = records.filter((r) => r.otherTags.length > 0);

console.log('');
console.log('PROVENANCE');
console.log('  ' + String(direct).padStart(5) + '  tagged "made with suno" directly');
console.log('  ' + String(sibling).padStart(5) + '  untagged, but a tagged copy of the same track sits beside it');
console.log('  ' + String(unknown.length).padStart(5) + '  no evidence either way (mostly wav, which carries no tag)');
console.log('');
console.log('  ' + records.filter((r) => r.created).length + ' carry a creation date');
console.log('  ' + records.filter((r) => r.sunoId).length + ' carry a Suno track id');

console.log('');
console.log('BY FORMAT');
const byExt = {};
records.forEach((r) => {
  byExt[r.ext] = byExt[r.ext] || { n: 0, tagged: 0 };
  byExt[r.ext].n += 1;
  if (r.suno) byExt[r.ext].tagged += 1;
});
Object.entries(byExt).sort((a, b) => b[1].n - a[1].n).forEach(([ext, s]) =>
  console.log('  ' + ext.padEnd(7) + String(s.n).padStart(5) + ' files, ' + s.tagged + ' tagged')
);

if (withOther.length) {
  console.log('');
  console.log('FILES CARRYING TAGS THAT ARE NOT SUNO OR AN ENCODER — worth a look:');
  withOther.slice(0, 25).forEach((r) =>
    console.log('  ' + r.collection + ' / ' + r.title + '\n      ' + r.otherTags.join(' | '))
  );
  if (withOther.length > 25) console.log('  ... and ' + (withOther.length - 25) + ' more');
}

console.log('');
console.log('COLLECTIONS WITH NO PROVEN SUNO ORIGIN AT ALL:');
const byCollection = {};
records.forEach((r) => {
  byCollection[r.collection] = byCollection[r.collection] || { n: 0, proven: 0 };
  byCollection[r.collection].n += 1;
  if (r.suno || r.sunoBySibling) byCollection[r.collection].proven += 1;
});
const none = Object.entries(byCollection).filter(([, s]) => s.proven === 0);
if (none.length === 0) console.log('  (none - every collection has at least one proven file)');
none.forEach(([c, s]) => console.log('  ' + String(s.n).padStart(4) + '  ' + c));

fs.writeFileSync(OUT, JSON.stringify(records, null, 2), 'utf8');
console.log('');
console.log('Full per-file detail written to ' + OUT);
