#!/usr/bin/env node
//
// scripts/verify-masters.js
//
// Reconcile every song's `previewOnly` flag against whether its master actually
// exists in R2.
//
//   npm run verify:masters                  # dry run — reports, writes nothing
//   npm run verify:masters -- --apply       # write the corrections
//   npm run verify:masters -- --project=beatflowmedia --apply
//
// WHY A RECONCILER RATHER THAN A MIGRATION
// `previewOnly` is currently a blanket `true` the station stamped on every seeded
// song. A one-off "unlock the catalogue" migration would replace one un-rederivable
// assertion with another, and the next time a master is added or removed the flag
// would be wrong again with nobody the wiser. This recomputes the flag from the
// thing it is supposed to describe, so it can be run any time and after any change.
//
// IT PROBES, IT DOES NOT LIST.
// The obvious implementation is ListObjectsV2 over `masters/`. That is the wrong
// call here: the R2 token for this bucket is deliberately GetObject-only, so a list
// would be denied — and a denied list is indistinguishable from an empty bucket
// unless you are careful, which would silently block the entire catalogue. Instead
// this sends one presigned HEAD per master key, which is exactly the permission the
// delivery path already needs and nothing more.
//
// UNKNOWN IS NOT ABSENT. A probe that errors (timeout, DNS, 500) is recorded as
// unknown and reported as a problem. Only an explicit 404/403 counts as absent.
// Treating a network blip as "no master" would block records that are fine.

const path = require('path');
const fs = require('fs');
const https = require('https');

const { ROOT, loadEnv, initAdmin, assertProject, args, BATCH_SIZE } = require('./lib/admin');

const { has, value: valueOf } = args();

const APPLY = has('--apply');
const EXPECT_PROJECT = valueOf('project', null);
const CONCURRENCY = Number(valueOf('concurrency', '8')) || 8;
const PROBE_TTL = 120; // seconds a probe URL stays valid; short, they are used at once




// r2Config now lives in netlify/functions/lib/r2-presign.js — see the note there
// on why three copies of it existed and what that cost.
/**
 * HEAD one presigned URL.
 * @returns {Promise<true|false|null>} true = exists, false = confirmed absent,
 *          null = could not determine (and must not be read as absent).
 */
function headExists(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 15000 }, (res) => {
      res.resume();
      if (res.statusCode === 200) return resolve(true);
      if (res.statusCode === 404 || res.statusCode === 403) return resolve(false);
      resolve(null); // 5xx, redirects, anything unexpected: unknown, not absent
    });
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.on('error', () => resolve(null));
    req.end();
  });
}

/** Bounded-concurrency map. 138 sequential HTTPS round trips is slow; unbounded is
 *  rude to the endpoint and makes throttling look like absence. */
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}


async function writeFlags(db, changes, value) {
  let written = 0;
  for (let i = 0; i < changes.length; i += BATCH_SIZE) {
    const slice = changes.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    slice.forEach((c) => batch.update(db.collection('songs').doc(c.id), { previewOnly: value }));
    await batch.commit();
    written += slice.length;
    process.stdout.write(`    committed ${written}/${changes.length}\n`);
  }
  return written;
}

async function verifyFlags(db, changes, expected) {
  const bad = [];
  for (let i = 0; i < changes.length; i += BATCH_SIZE) {
    const slice = changes.slice(i, i + BATCH_SIZE);
    const snaps = await db.getAll(...slice.map((c) => db.collection('songs').doc(c.id)));
    snaps.forEach((snap, idx) => {
      const got = snap.exists ? snap.data().previewOnly : undefined;
      if (got !== expected) bad.push({ label: slice[idx].label, id: slice[idx].id, want: expected, got });
    });
  }
  return bad;
}

async function main() {
  loadEnv();

  const { presignGetObject, r2Config } = require(path.join(ROOT, 'netlify', 'functions', 'lib', 'r2-presign.js'));
  const { masterObjectKey, resolveMasterSource, firebaseMasterBucket } =
    require(path.join(ROOT, 'netlify', 'functions', 'lib', 'masters.js'));
  const { planMasterAvailability, describeMasterPlan } =
    require(path.join(ROOT, 'netlify', 'functions', 'lib', 'master-availability.js'));

  console.log('');
  console.log(APPLY ? 'APPLYING previewOnly corrections' : 'DRY RUN - nothing will be written');

  // The storage bucket is needed for the Firebase half of the master check below.
  // Derived from the project id rather than read from an env var, because no env var
  // holds it -- and a check that silently skips when a variable is unset would be the
  // same class of fault this whole block exists to correct.
  // loadEnv() runs inside initAdmin, so the bucket cannot be computed from
  // process.env in this argument -- it would be read before .env exists. Hence the
  // plain init here and firebaseMasterBucket() at the point of use, after env is up.
  const { admin, projectId, via } = initAdmin();
  console.log(`  firebase    : ${via}`);
  console.log(`  project     : ${projectId}`);
  assertProject(projectId, EXPECT_PROJECT);

  const r2 = r2Config();
  console.log(`  r2 bucket   : ${r2.bucket}`);
  console.log(`  probe       : presigned HEAD per key, ${CONCURRENCY} at a time`);

  const db = admin.firestore();
  const snap = await db.collection('songs').get();
  const songs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  console.log(`  songs       : ${songs.length}`);
  console.log('');
  console.log('  probing masters...');

  // WHERE TO LOOK comes from resolveMasterSource, not from this file.
  //
  // This used to probe R2 at masters/<ISRC>.wav and nothing else, which is only one of
  // the two places a master can live. Every Firebase-backed record was therefore judged
  // absent, and since this script WRITES, it set previewOnly on 62 deliverable tracks
  // and turned whole albums into "Preview only" on the storefront.
  //
  // The rule now has one home, shared with download-master.js. If the verifier and the
  // delivery path can disagree about where a file is, the verifier will eventually
  // punish records for the disagreement.
  const resolved = songs
    .map((song) => ({ song, source: resolveMasterSource(song) }))
    .filter((r) => r.source);

  const byBackend = resolved.reduce((acc, r) => {
    acc[r.source.backend] = (acc[r.source.backend] || 0) + 1;
    return acc;
  }, {});
  console.log(`  resolvable  : ${resolved.length}  (` +
    Object.entries(byBackend).map(([k, v]) => `${k} ${v}`).join(', ') + ')');

  const fbBucket = admin.storage().bucket(firebaseMasterBucket());
  console.log(`  fb bucket   : ${fbBucket.name}`);

  const results = await mapLimit(resolved, CONCURRENCY, async ({ song, source }) => {
    if (source.backend === 'firebase') {
      try {
        const [exists] = await fbBucket.file(source.key).exists();
        return { id: song.id, present: exists };
      } catch {
        // Undetermined, never "absent". Reading an error as absence is precisely the
        // mistake that caused this correction.
        return { id: song.id, present: null };
      }
    }

    const url = presignGetObject({
      accessKeyId: r2.accessKeyId,
      secretAccessKey: r2.secretAccessKey,
      endpoint: r2.endpoint,
      bucket: r2.bucket,
      key: source.key,
      expiresIn: PROBE_TTL,
      method: 'HEAD'
    });
    return { id: song.id, present: await headExists(url) };
  });

  const masterPresence = {};
  let found = 0, absent = 0, unknown = 0;
  results.forEach((r) => {
    masterPresence[r.id] = r.present;
    if (r.present === true) found += 1;
    else if (r.present === false) absent += 1;
    else unknown += 1;
  });

  console.log(`  masters found: ${found}   absent: ${absent}   undetermined: ${unknown}`);

  if (unknown > 0 && found === 0) {
    throw new Error(
      `every probe was undetermined (${unknown}). That is a connectivity or credentials\n` +
      '      problem, not an empty bucket. Refusing to treat it as "no masters exist".'
    );
  }

  // HTML ENTITIES IN A STORAGE KEY. Reported because they have happened, and because
  // the code that wrote them has not been found.
  //
  // 14 records carried `audio/What We Don&apos;t Say.mp3` and
  // `audio/Maps &amp; Moments (feat. SYNNE).mp3`. The objects existed under their real
  // names the whole time; only the stored paths were escaped, so every one looked
  // permanently undeliverable. An apostrophe in a title became an entity in a key.
  //
  // The repair was a one-off. This is not: whatever escaped them is still upstream of
  // masterPath, in whatever UI or importer writes it, and will do it to the next
  // upload. A check that costs nothing beats remembering.
  const ENTITY = /&(apos|amp|quot|lt|gt|#39|#x27);/i;
  const escaped = songs.filter(
    (s) => typeof s.masterPath === 'string' && ENTITY.test(s.masterPath)
  );
  if (escaped.length) {
    console.log('');
    console.log('  WARN  ' + escaped.length + ' record(s) have an HTML entity in masterPath:');
    escaped.slice(0, 8).forEach((s) => console.log('          ' + (s.title || s.id) + '  ->  ' + s.masterPath));
    console.log('        The object almost certainly exists under the UNESCAPED name.');
    console.log('        Fix the record, and find what wrote the entity.');
  }

  const plan = planMasterAvailability({ songs, masterPresence });
  const lines = describeMasterPlan(plan);

  console.log('');
  if (!lines.length) console.log('  nothing to change - previewOnly already matches the masters on disk');
  else lines.forEach((l) => console.log(l));

  const s = plan.summary;
  console.log('');
  console.log(`  to UNLOCK (master exists, currently blocked) : ${s.toClear}`);
  console.log(`  to BLOCK  (sellable but NO master)           : ${s.toSet}`);
  console.log(`  skipped                                      : ${s.problems}`);

  if (s.toSet > 0) {
    console.log('');
    console.log('  NOTE: the BLOCK rows are the urgent ones. Those records are currently');
    console.log('        purchasable and would deliver a 30-second preview to a paying');
    console.log('        customer, because the purchase path falls through to audioUrl.');
  }

  if (!APPLY) {
    if (s.toClear || s.toSet) {
      console.log('');
      console.log('  Re-run with --apply to write these.');
    }
    return 0;
  }

  if (!s.toClear && !s.toSet) return 0;

  console.log('');
  console.log('  writing...');
  // Blocks first. If the run dies halfway, the catalogue is left over-cautious
  // rather than selling something it cannot deliver.
  if (plan.set.length) {
    console.log('   blocking undeliverable records:');
    await writeFlags(db, plan.set, true);
  }
  if (plan.clear.length) {
    console.log('   unlocking deliverable records:');
    await writeFlags(db, plan.clear, false);
  }

  console.log('');
  console.log('  verifying by re-reading...');
  const bad = [
    ...(await verifyFlags(db, plan.set, true)),
    ...(await verifyFlags(db, plan.clear, false))
  ];
  if (bad.length) {
    console.error(`  VERIFICATION FAILED for ${bad.length} record(s):`);
    bad.forEach((m) => console.error(`    ${m.label} (${m.id}): wanted ${m.want}, found ${m.got}`));
    return 1;
  }

  console.log(`  verified ${plan.set.length + plan.clear.length} record(s).`);
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('');
    console.error(`  FAILED: ${err.message}`);
    if (/UNAUTHENTICATED|invalid_grant|Invalid PEM/i.test(err.message)) {
      console.error('');
      console.error('  Credentials problem, not a data problem. Reissue the Firebase service');
      console.error('  account key and replace FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL');
      console.error('  together - they are a set.');
    }
    process.exit(1);
  });
