#!/usr/bin/env node
//
// scripts/upload-local-masters.js
//
// Upload masters that exist on disk but were never pushed to a store.
//
//   npm run upload:masters                 # dry run
//   npm run upload:masters -- --apply
//   npm run upload:masters -- --from="C:/path/to/audio" --apply
//
// WHY THIS EXISTS
// Thirty tracks were unsellable because no store held their audio -- and 28 of them
// were sitting in the radio station's local audio folder the whole time. They had
// simply never been uploaded. Three albums were incomplete for want of a copy step.
//
// IT UPLOADS UNDER THE SONG'S OWN TITLE, deliberately. The local files are CamelCase
// with the spaces removed ("WildFireHeart.mp3"), which is why the linker could not
// match them: normalising strips punctuation but cannot re-insert word breaks. Naming
// the uploaded object after the catalogue title means link-masters.js matches it with
// no override and no fuzzy threshold -- the ambiguity is removed at the source rather
// than guessed at later.
//
// DESTINATION admin-uploads/station-recovered/ is chosen because storage.rules
// restricts admin-uploads/** to isPlatformAdmin(). That is what makes it safe for a
// world-readable song record to carry the path: the path is inert, and only
// download-master.js -- after checking the buyer paid -- can mint a signed URL.
//
// It does NOT link anything. Upload and link are separate so each can be checked on
// its own; run npm run link:masters afterwards.

const fs = require('fs');
const path = require('path');

const { loadEnv, initAdmin, assertProject, args } = require('./lib/admin');

const { has, value } = args();
const APPLY = has('--apply');
const FROM = value('from', 'C:/Users/percy/RadioStation/radio/audio');
const EXPECT_PROJECT = value('project', null);
const BUCKET = value('bucket', 'beatflowmedia.firebasestorage.app');
const DEST_PREFIX = 'admin-uploads/station-recovered/';

const AUDIO = new Set(['.mp3', '.wav', '.flac', '.m4a', '.aiff']);

function norm(s) {
  return String(s || '')
    .replace(/&apos;|&#39;|&rsquo;/g, "'")
    .replace(/&amp;/g, '&')
    .toLowerCase()
    .replace(/[\u2018\u2019\u201B\u02BC]/g, "'")
    .replace(/\(feat\.?[^)]*\)/g, ' ')
    .replace(/\bfeat\.?\s.*$/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
/** Local names drop the spaces, so compare a space-free form too. */
const squash = (s) => norm(s).split(' ').join('');

/**
 * Songs whose local file is named something no normalisation reaches, mapped by hand.
 *
 * Found by asking the right question rather than by tuning a matcher: if a track has
 * a 30-second preview and a measured duration, the full audio MUST have existed when
 * that preview was cut. playlist.json records the source each preview was made from,
 * and it named both of these directly.
 *
 *   "Sunday at the Corner Store"       -> SundayattheCornerStoreBonusTrack.mp3
 *   "The Emotion Code (Love Language)" -> TheEmotionCode.mp3
 *
 * One gained a word, the other lost two. A matcher loose enough to bridge either
 * would also pair tracks that merely share a phrase, and mispairing means a buyer
 * receives a recording they did not license. So the exception is declared: a human
 * stating these are the same recording, which is the judgement a threshold would only
 * be imitating.
 *
 * Keyed by the normalised SONG title; the value is the exact local filename.
 */
const SOURCE_OVERRIDES = {
  'sunday at the corner store': 'SundayattheCornerStoreBonusTrack.mp3',
  'the emotion code love language': 'TheEmotionCode.mp3'
};

/** Storage object names: keep it readable, lose anything awkward in a URL path. */
function safeName(title, ext) {
  return String(title).replace(/[\\/:*?"<>|]/g, '-').trim() + ext;
}

const CONTENT_TYPE = {
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.flac': 'audio/flac',
  '.m4a': 'audio/mp4', '.aiff': 'audio/aiff'
};

async function main() {
  loadEnv();
  const { admin, projectId } = initAdmin({ storageBucket: BUCKET });
  assertProject(projectId, EXPECT_PROJECT);

  console.log('');
  console.log(APPLY ? 'UPLOADING' : 'DRY RUN - nothing will be uploaded');
  console.log('  project : ' + projectId);
  console.log('  bucket  : ' + BUCKET);
  console.log('  source  : ' + FROM);
  console.log('  dest    : ' + DEST_PREFIX);

  if (!fs.existsSync(FROM)) throw new Error('source folder not found: ' + FROM);

  const local = fs.readdirSync(FROM)
    .filter((f) => AUDIO.has(path.extname(f).toLowerCase()))
    .map((f) => {
      const base = f.replace(/\.[^.]+$/, '');
      return { file: f, full: path.join(FROM, f), key: norm(base), squash: squash(base) };
    });

  const byKey = new Map();
  const bySquash = new Map();
  local.forEach((f) => {
    if (!byKey.has(f.key)) byKey.set(f.key, f);
    if (!bySquash.has(f.squash)) bySquash.set(f.squash, f);
  });

  const db = admin.firestore();
  const snap = await db.collection('songs').get();
  const blocked = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => s.previewOnly === true);

  const plan = [];
  const noSource = [];
  blocked.forEach((s) => {
    // Declared override first; see SOURCE_OVERRIDES.
    const forced = SOURCE_OVERRIDES[norm(s.title)];
    const hit = forced
      ? local.find((f) => f.file === forced)
      : (byKey.get(norm(s.title)) || bySquash.get(squash(s.title)));
    if (!hit) { noSource.push(s); return; }
    const ext = path.extname(hit.file).toLowerCase();
    plan.push({ song: s, src: hit, dest: DEST_PREFIX + safeName(s.title, ext), bytes: fs.statSync(hit.full).size, ext });
  });

  const mb = (b) => (b / 1048576).toFixed(1) + ' MB';
  console.log('');
  console.log('  blocked songs     : ' + blocked.length);
  console.log('  found on disk     : ' + plan.length);
  console.log('  no source anywhere: ' + noSource.length);
  console.log('  total to upload   : ' + mb(plan.reduce((a, p) => a + p.bytes, 0)));

  if (noSource.length) {
    console.log('');
    console.log('  NO SOURCE (stay blocked):');
    noSource.forEach((s) => console.log('    - ' + s.title));
  }

  if (!plan.length) return 0;

  if (!APPLY) {
    console.log('');
    console.log('  WOULD UPLOAD:');
    plan.slice(0, 40).forEach((p) => console.log('    ' + mb(p.bytes).padStart(9) + '  ' + p.src.file.padEnd(34) + ' -> ' + p.dest));
    console.log('');
    console.log('  Re-run with --apply. Then: npm run link:masters -- --apply');
    return 0;
  }

  const bucket = admin.storage().bucket();
  let done = 0;
  const failures = [];
  for (const p of plan) {
    try {
      await bucket.upload(p.src.full, {
        destination: p.dest,
        metadata: { contentType: CONTENT_TYPE[p.ext] || 'application/octet-stream' },
        resumable: false
      });
      done += 1;
      process.stdout.write('    ' + String(done).padStart(3) + '/' + plan.length + '  ' + p.dest.replace(DEST_PREFIX, '') + '\n');
    } catch (err) {
      failures.push({ dest: p.dest, msg: err.message });
    }
  }

  console.log('');
  console.log('  verifying by re-reading the bucket...');
  let verified = 0;
  for (const p of plan) {
    const [exists] = await bucket.file(p.dest).exists();
    if (exists) verified += 1; else failures.push({ dest: p.dest, msg: 'not present after upload' });
  }

  console.log('  uploaded and verified: ' + verified + ' of ' + plan.length);
  if (failures.length) {
    console.error('  FAILURES:');
    failures.slice(0, 10).forEach((f) => console.error('    ' + f.dest + ': ' + f.msg));
    return 1;
  }

  console.log('');
  console.log('  Next: npm run link:masters -- --apply');
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('');
    console.error('  FAILED: ' + err.message);
    process.exit(1);
  });
