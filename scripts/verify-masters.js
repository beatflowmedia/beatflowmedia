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

const ROOT = path.join(__dirname, '..');

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valueOf = (name, dflt) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : dflt;
};

const APPLY = has('--apply');
const EXPECT_PROJECT = valueOf('project', null);
const CONCURRENCY = Number(valueOf('concurrency', '8')) || 8;
const PROBE_TTL = 120; // seconds a probe URL stays valid; short, they are used at once

function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    const file = path.join(ROOT, name);
    if (!fs.existsSync(file)) continue;
    try {
      require(path.join(ROOT, 'node_modules', 'dotenv')).config({ path: file });
    } catch { /* already exported is fine */ }
  }
}

/** See scripts/fix-catalog-prices.js — a RegExp here silently matches nothing. */
function unescapePem(value) {
  const ESCAPED_NEWLINE = String.fromCharCode(92) + 'n';
  return String(value || '').split(ESCAPED_NEWLINE).join('\n');
}

function initAdmin() {
  const admin = require(path.join(ROOT, 'node_modules', 'firebase-admin'));

  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyFile && fs.existsSync(keyFile)) {
    const sa = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    return { admin, projectId: sa.project_id, via: `GOOGLE_APPLICATION_CREDENTIALS (${path.basename(keyFile)})` };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = unescapePem(process.env.FIREBASE_PRIVATE_KEY);
  const missing = [
    !projectId && 'FIREBASE_PROJECT_ID',
    !clientEmail && 'FIREBASE_CLIENT_EMAIL',
    !privateKey && 'FIREBASE_PRIVATE_KEY'
  ].filter(Boolean);
  if (missing.length) throw new Error(`missing Firebase credentials: ${missing.join(', ')}`);

  admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
  return { admin, projectId, via: '.env (FIREBASE_* vars)' };
}

function r2Config() {
  const cfg = {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    endpoint: process.env.R2_MASTERS_ENDPOINT,
    bucket: process.env.R2_MASTERS_BUCKET
  };
  const missing = Object.entries(cfg).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    const names = {
      accessKeyId: 'R2_ACCESS_KEY_ID',
      secretAccessKey: 'R2_SECRET_ACCESS_KEY',
      endpoint: 'R2_MASTERS_ENDPOINT',
      bucket: 'R2_MASTERS_BUCKET'
    };
    throw new Error(
      'R2 is not configured: missing ' + missing.map((m) => names[m]).join(', ') + '\n' +
      '      Create the private masters bucket and a GetObject-only token, then set\n' +
      '      these four. Until then this script cannot tell a missing master from an\n' +
      '      unreachable one, and refuses to guess.'
    );
  }
  return cfg;
}

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

const BATCH_SIZE = 400;

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

  const { presignGetObject } = require(path.join(ROOT, 'netlify', 'functions', 'lib', 'r2-presign.js'));
  const { masterObjectKey } = require(path.join(ROOT, 'netlify', 'functions', 'lib', 'masters.js'));
  const { planMasterAvailability, describeMasterPlan } =
    require(path.join(ROOT, 'netlify', 'functions', 'lib', 'master-availability.js'));

  console.log('');
  console.log(APPLY ? 'APPLYING previewOnly corrections' : 'DRY RUN - nothing will be written');

  const { admin, projectId, via } = initAdmin();
  console.log(`  firebase    : ${via}`);
  console.log(`  project     : ${projectId}`);
  if (EXPECT_PROJECT && projectId !== EXPECT_PROJECT) {
    throw new Error(`REFUSING: --project=${EXPECT_PROJECT} but credentials are for "${projectId}"`);
  }

  const r2 = r2Config();
  console.log(`  r2 bucket   : ${r2.bucket}`);
  console.log(`  probe       : presigned HEAD per key, ${CONCURRENCY} at a time`);

  const db = admin.firestore();
  const snap = await db.collection('songs').get();
  const songs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  console.log(`  songs       : ${songs.length}`);
  console.log('');
  console.log('  probing masters...');

  const probeable = songs.filter((s) => {
    try { return !!masterObjectKey(s.isrc); } catch { return false; }
  });

  const results = await mapLimit(probeable, CONCURRENCY, async (song) => {
    const url = presignGetObject({
      accessKeyId: r2.accessKeyId,
      secretAccessKey: r2.secretAccessKey,
      endpoint: r2.endpoint,
      bucket: r2.bucket,
      key: masterObjectKey(song.isrc),
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
