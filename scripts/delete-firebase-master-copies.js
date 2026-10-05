#!/usr/bin/env node
//
// scripts/delete-firebase-master-copies.js
//
//   npm run cleanup:firebase-masters            # dry run
//   npm run cleanup:firebase-masters -- --apply
//
// Removes the Firebase Storage copies of masters that now live in R2.
//
// WHY THIS IS NOT "delete everything in previousMasterPath"
// 906 records carry a previousMasterPath, and they are not all Firebase:
//
//     admin-uploads/    826   Firebase Storage      -> safe to delete
//     artist-uploads/     8   Firebase Storage      -> safe to delete
//     audio/             72   R2 beatflow-assets    -> THE RADIO'S PLAYLIST
//
// The 72 are the ones that nearly took BeatFlow Radio off the air once already.
// radio/playlist.json references all 72 by name, because the same object was serving
// two jobs -- a paid master and a broadcast source. The migration made them
// independent copies; the R2 originals stay, forever, until the radio stops pointing
// at them.
//
// So the filter is previousMasterBackend === 'firebase', not "has a previous path".
// The difference is 72 files and a silent outage.
//
// RADIO ALSO WRITES TO THIS BUCKET. radio/catalog.js uploads previews to
// songs/previews/<ISRC>.mp3 via the GCS upload API. Zero of the paths deleted here
// begin with that prefix, and the script refuses any that do rather than trusting the
// filter.
//
// SAFETY
//   - Dry run by default.
//   - Every object is confirmed PRESENT IN R2, at the key the record now points to,
//     with a matching byte size, immediately before its Firebase copy is deleted.
//     A record whose R2 object cannot be verified is skipped, not deleted.
//   - Nothing in Firestore is modified. previousMasterPath stays on the record as a
//     record of where the file used to be; it just stops being a live fallback.

const path = require('path');
const https = require('https');

const { ROOT, initAdmin, assertProject, args } = require('./lib/admin');
const { has, value: valueOf } = args();

const APPLY = has('--apply');
const LIMIT = Number(valueOf('limit', '0')) || 0;
const EXPECT_PROJECT = valueOf('project', null);

const {
  resolveMasterSource,
  firebaseMasterBucket
} = require(path.join(ROOT, 'netlify', 'functions', 'lib', 'masters.js'));
const { presignGetObject, r2Config } = require(path.join(ROOT, 'netlify', 'functions', 'lib', 'r2-presign.js'));

/** Prefixes that belong to something else and must never be deleted by this script. */
const FORBIDDEN_PREFIXES = [
  'songs/previews/'  // BeatFlow Radio uploads previews here
];

function head(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
      res.resume();
      resolve({
        ok: res.statusCode >= 200 && res.statusCode < 300,
        size: res.headers['content-length'] ? Number(res.headers['content-length']) : null
      });
    });
    req.on('error', () => resolve({ ok: false, size: null }));
    req.end();
  });
}

(async () => {
  const { admin, projectId, via } = initAdmin();
  assertProject(projectId, EXPECT_PROJECT);

  const bucketName = firebaseMasterBucket();
  const bucket = admin.storage().bucket(bucketName);
  const db = admin.firestore();
  const cfg = r2Config();

  console.log(APPLY ? 'APPLYING — deleting Firebase copies' : 'DRY RUN — nothing will be deleted');
  console.log('  firebase   : ' + via);
  console.log('  fb bucket  : ' + bucketName);
  console.log('  r2 bucket  : ' + cfg.bucket);
  console.log('');

  const snap = await db.collection('songs').get();
  const songs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const skipped = { notMigrated: 0, notFirebase: 0, forbidden: 0 };
  const candidates = [];

  songs.forEach((song) => {
    const prev = typeof song.previousMasterPath === 'string' ? song.previousMasterPath.trim() : '';
    if (!prev) { skipped.notMigrated += 1; return; }

    // THE WHOLE POINT OF THIS SCRIPT. 'r2' here means beatflow-assets, which the
    // radio station plays from.
    if (song.previousMasterBackend !== 'firebase') { skipped.notFirebase += 1; return; }

    if (FORBIDDEN_PREFIXES.some((p) => prev.startsWith(p))) { skipped.forbidden += 1; return; }

    candidates.push({ song, firebasePath: prev });
  });

  console.log('  songs                      : ' + songs.length);
  console.log('  never migrated             : ' + skipped.notMigrated);
  console.log('  previous copy is in R2     : ' + skipped.notFirebase + '   <- radio bucket, left alone');
  console.log('  on a forbidden prefix      : ' + skipped.forbidden);
  console.log('  FIREBASE COPIES TO DELETE  : ' + candidates.length);
  console.log('');

  const work = LIMIT ? candidates.slice(0, LIMIT) : candidates;
  let deleted = 0, skippedUnverified = 0, missing = 0, bytes = 0;

  for (const { song, firebasePath } of work) {
    const label = song.title || song.id;

    // The record must currently resolve to R2, and that object must exist and match.
    const now = resolveMasterSource(song);
    if (!now || now.backend !== 'r2') {
      console.log('  SKIP  ' + label + ' — no longer resolves to R2');
      skippedUnverified += 1;
      continue;
    }

    const r2 = await head(presignGetObject({ ...cfg, key: now.key, expiresIn: 120, method: 'HEAD' }));
    if (!r2.ok) {
      console.log('  SKIP  ' + label + ' — R2 object missing at ' + now.key);
      skippedUnverified += 1;
      continue;
    }

    const file = bucket.file(firebasePath);
    let fbSize = null;
    try {
      const [meta] = await file.getMetadata();
      fbSize = Number(meta.size || 0);
    } catch {
      missing += 1;
      continue; // already gone; nothing to do
    }

    if (r2.size !== null && fbSize && r2.size !== fbSize) {
      console.log('  SKIP  ' + label + ' — size mismatch, fb ' + fbSize + ' vs r2 ' + r2.size);
      skippedUnverified += 1;
      continue;
    }

    if (!APPLY) { deleted += 1; bytes += fbSize || 0; continue; }

    await file.delete();
    deleted += 1;
    bytes += fbSize || 0;
    if (deleted % 100 === 0) console.log('  deleted ' + deleted + '/' + work.length);
  }

  console.log('');
  console.log((APPLY ? '  deleted            : ' : '  would delete       : ') + deleted);
  console.log('  freed              : ' + (bytes / 1073741824).toFixed(2) + ' GB');
  console.log('  skipped unverified : ' + skippedUnverified + '   (R2 copy not confirmed)');
  console.log('  already absent     : ' + missing);

  if (!APPLY) {
    console.log('');
    console.log('Dry run. Re-run with --apply.');
    console.log('Firestore is never modified by this script.');
  }
  process.exit(skippedUnverified ? 1 : 0);
})().catch((err) => {
  console.error('FAILED: ' + err.message);
  process.exit(1);
});
