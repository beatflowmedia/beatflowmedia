#!/usr/bin/env node
//
// scripts/migrate-masters-to-r2.js
//
//   npm run migrate:masters                      # dry run, shows the plan
//   npm run migrate:masters -- --limit 1 --apply # trial on one record
//   npm run migrate:masters -- --apply           # the whole catalogue
//
// Moves every master out of Firebase Storage and into Cloudflare R2, so the catalogue
// has ONE store instead of two.
//
// WHY, decided 2026-10-01
// Two backends is what let scripts/verify-masters.js and netlify/functions/
// download-master.js disagree about where a file lives. The verifier knew only R2,
// judged 120 Firebase-backed records undeliverable, and -- because it writes -- turned
// whole albums into "Preview only" on the storefront. The shared resolver fixed the
// disagreement; this removes the thing they could disagree about.
//
// R2 over Firebase Storage, for reasons that outlast today:
//
//   - EGRESS. R2 charges none; GCS charges around $0.12/GB. Per download that is
//     fractions of a cent at 7.6MB average, and the subscription tiers promise
//     "unlimited downloads while active" -- metered egress under an unmetered promise
//     is the one pricing shape that can invert a margin without anyone noticing.
//   - KEYS. R2 keys here are derived from the ISRC or the document id. The Firebase
//     paths are built from titles, which is how "What We Don't Say" became
//     `audio/What We Don&apos;t Say.mp3` -- an HTML entity encoded into a storage key,
//     pointing at nothing. A key derived from a display string inherits every quoting
//     bug that string ever passes through.
//   - It is finishing a migration, not starting one: 72 records are already on R2 and
//     the presign path is written and in use.
//
// Done now because there are no clients yet. The cost of this decision only rises.
//
// SAFETY
//   - Dry run by default. --apply is required to write anything.
//   - Nothing is deleted. The Firebase object stays exactly where it is, so a record
//     can be pointed back by reverting masterPath/masterBackend alone. Deleting the
//     old copies is a separate, later step, and only once verify:masters reports zero
//     absent.
//   - Every upload is verified with a HEAD against R2 BEFORE the record is updated. A
//     record is never repointed at an object that has not been confirmed to exist --
//     that failure mode is a paying customer receiving nothing.
//   - Size is compared after upload. A truncated transfer that still returns 200 would
//     otherwise pass a HEAD and sell a broken file.
//   - Already-R2 records are skipped, so re-running is safe and resumes.

const path = require('path');
const https = require('https');

const { ROOT, initAdmin, assertProject, args } = require('./lib/admin');

const { has, value: valueOf } = args();
const APPLY = has('--apply');
const LIMIT = Number(valueOf('limit', '0')) || 0;
const EXPECT_PROJECT = valueOf('project', null);
const CONCURRENCY = Number(valueOf('concurrency', '4')) || 4;

const {
  resolveMasterSource,
  masterKeyFor,
  firebaseMasterBucket
} = require(path.join(ROOT, 'netlify', 'functions', 'lib', 'masters.js'));
const { presignGetObject, r2Config } = require(path.join(ROOT, 'netlify', 'functions', 'lib', 'r2-presign.js'));

/** HEAD a presigned url. Returns {ok, size} — size is null when not reported. */
function headObject(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
      res.resume();
      resolve({
        ok: res.statusCode >= 200 && res.statusCode < 300,
        status: res.statusCode,
        size: res.headers['content-length'] ? Number(res.headers['content-length']) : null
      });
    });
    req.on('error', () => resolve({ ok: false, status: 0, size: null }));
    req.end();
  });
}

/** Stream a Firebase file straight into a presigned R2 PUT. Never buffers the whole
 *  object: at 834 files this would otherwise hold gigabytes in memory for no reason. */
function uploadStream(url, readStream, contentType, contentLength) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': contentType || 'application/octet-stream' };
    if (contentLength) headers['Content-Length'] = contentLength;

    const req = https.request(url, { method: 'PUT', headers }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c.toString().slice(0, 400); });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve();
        else reject(new Error('PUT ' + res.statusCode + ' ' + body.slice(0, 200)));
      });
    });
    req.on('error', reject);
    readStream.on('error', reject);
    readStream.pipe(req);
  });
}

async function mapLimit(items, limit, fn) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

(async () => {
  const { admin, projectId, via } = initAdmin();
  assertProject(projectId, EXPECT_PROJECT);

  const r2 = r2Config();
  const bucketName = firebaseMasterBucket();
  const bucket = admin.storage().bucket(bucketName);
  const db = admin.firestore();

  console.log(APPLY ? 'APPLYING — copying masters to R2' : 'DRY RUN — nothing will be written');
  console.log('  firebase    : ' + via);
  console.log('  project     : ' + projectId);
  console.log('  fb bucket   : ' + bucketName);
  console.log('  r2 bucket   : ' + r2.bucket);
  console.log('');

  const snap = await db.collection('songs').get();
  const songs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const plan = [];
  const skipped = { alreadyR2: 0, noMaster: 0 };

  songs.forEach((song) => {
    const source = resolveMasterSource(song);
    if (!source) { skipped.noMaster += 1; return; }
    if (source.backend === 'r2') { skipped.alreadyR2 += 1; return; }

    const ext = (source.key.split('.').pop() || 'mp3').toLowerCase();
    plan.push({ song, from: source.key, to: masterKeyFor(song, ext) });
  });

  console.log('  songs            : ' + songs.length);
  console.log('  already on R2    : ' + skipped.alreadyR2);
  console.log('  no master at all : ' + skipped.noMaster);
  console.log('  TO MIGRATE       : ' + plan.length);
  console.log('');

  const work = LIMIT ? plan.slice(0, LIMIT) : plan;
  if (LIMIT) console.log('  --limit ' + LIMIT + ' — doing ' + work.length + ' of ' + plan.length);

  work.slice(0, 5).forEach((p) => console.log('    ' + p.from + '\n      -> ' + p.to));
  if (work.length > 5) console.log('    ... and ' + (work.length - 5) + ' more');
  console.log('');

  if (!APPLY) {
    console.log('Dry run. Re-run with --apply to copy and repoint.');
    console.log('Nothing is deleted from Firebase by this script, in either mode.');
    process.exit(0);
  }

  let copied = 0, repointed = 0, failed = 0;
  const failures = [];

  await mapLimit(work, CONCURRENCY, async ({ song, from, to }) => {
    const label = (song.title || song.id);
    try {
      const file = bucket.file(from);
      const [meta] = await file.getMetadata();
      const size = Number(meta.size || 0);
      if (!size) throw new Error('source reports zero bytes');

      const cfg = r2Config();
      const putUrl = presignGetObject({ ...cfg, key: to, expiresIn: 900, method: 'PUT' });
      await uploadStream(putUrl, file.createReadStream(), meta.contentType, size);
      copied += 1;

      // Confirm it is really there, and really whole, BEFORE repointing the record.
      // A HEAD alone would accept a truncated upload that returned 200.
      const headUrl = presignGetObject({ ...cfg, key: to, expiresIn: 120, method: 'HEAD' });
      const head = await headObject(headUrl);
      if (!head.ok) throw new Error('verify failed: HEAD ' + head.status);
      if (head.size !== null && head.size !== size) {
        throw new Error('size mismatch: source ' + size + ', r2 ' + head.size);
      }

      await db.collection('songs').doc(song.id).update({
        masterPath: to,
        masterBackend: 'r2',
        // Kept so a revert needs no archaeology. The Firebase object is not deleted,
        // so this plus masterBackend:'firebase' restores the previous state exactly.
        previousMasterPath: from,
        previousMasterBackend: 'firebase'
      });
      repointed += 1;
      console.log('  OK    ' + label + '  (' + (size / 1048576).toFixed(1) + 'MB)');
    } catch (err) {
      failed += 1;
      failures.push({ label, from, to, error: err.message });
      console.log('  FAIL  ' + label + '  ' + err.message.slice(0, 120));
    }
  });

  console.log('');
  console.log('  copied    : ' + copied);
  console.log('  repointed : ' + repointed);
  console.log('  failed    : ' + failed);

  if (failures.length) {
    console.log('');
    console.log('  Failures leave the record pointing at Firebase, untouched and still');
    console.log('  deliverable. Re-run to retry only those.');
    failures.slice(0, 10).forEach((f) => console.log('    ' + f.label + ': ' + f.error.slice(0, 100)));
  }

  console.log('');
  console.log('  Next: npm run verify:masters   — it must report 0 absent before any');
  console.log('        Firebase object is deleted.');
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error('FAILED: ' + err.message);
  process.exit(1);
});
