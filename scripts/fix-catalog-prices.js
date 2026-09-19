#!/usr/bin/env node
//
// scripts/fix-catalog-prices.js
//
// Repair stored catalogue prices from a terminal, using a service account.
//
//   node scripts/fix-catalog-prices.js                 # dry run, writes nothing
//   node scripts/fix-catalog-prices.js --apply         # write it
//   node scripts/fix-catalog-prices.js --only=albums   # songs | albums | both
//
// WHY THIS EXISTS ALONGSIDE src/utils/fixCatalogPrices.js
// That one runs in the browser as a signed-in platform admin, which is fine for a
// one-off and impossible to automate or run from CI. This one needs no browser.
//
// It is NOT a second copy of the repair rule. Both call planCatalogPrices() in
// src/utils/catalogPricePlan.js; this file is only the I/O and the guardrails.
//
// WHY THE GUARDRAILS ARE HEAVY
// Every album in the catalogue currently holds a price the checkout will charge, so
// a careless run here either overcharges customers or zeroes the catalogue. The
// rules this follows are the ones that survive a bad day:
//
//   - dry run by DEFAULT; --apply is the only way to write
//   - the full plan prints before anything is written, every time
//   - the project id is ASSERTED, not assumed; a key that "works" only proves some
//     project accepted it, and test and production keys differ by a few characters
//   - writes are batched and then READ BACK, because a write you cannot see the
//     result of is a write you have not verified
//   - a non-zero exit on any failure, so CI cannot report a partial repair as green

const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const has = (flag) => argv.includes(flag);
const valueOf = (name, dflt) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : dflt;
};

const APPLY = has('--apply');
const ONLY = valueOf('only', 'both'); // songs | albums | both
const EXPECT_PROJECT = valueOf('project', null);

if (!['songs', 'albums', 'both'].includes(ONLY)) {
  console.error(`--only must be songs, albums or both (got "${ONLY}")`);
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

function loadEnv() {
  // .env.local wins over .env, matching how CRA and Netlify resolve them, so a
  // developer pointing at a scratch project does not get silently overridden.
  for (const name of ['.env.local', '.env']) {
    const file = path.join(ROOT, name);
    if (!fs.existsSync(file)) continue;
    try {
      require(path.join(ROOT, 'node_modules', 'dotenv')).config({ path: file });
    } catch {
      /* dotenv absent is fine when the vars are already exported */
    }
  }
}

/**
 * Turn a .env-encoded PEM back into a real one.
 *
 * Plain split/join rather than a RegExp on purpose: `new RegExp("\\" + "n")`
 * compiles to the NEWLINE escape, not to a literal backslash-n, so it matches
 * nothing in a .env value and hands firebase-admin an unusable key. That mistake
 * surfaces as "Invalid PEM formatted message", which reads like a bad key.
 */
function unescapePem(value) {
  const ESCAPED_NEWLINE = String.fromCharCode(92) + 'n';
  return String(value || '').split(ESCAPED_NEWLINE).join('\n');
}

function initAdmin() {
  const admin = require(path.join(ROOT, 'node_modules', 'firebase-admin'));

  // An explicit service-account JSON beats the split env vars when present: it is
  // the format the Firebase console hands you, so it cannot be mis-transcribed.
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

  if (missing.length) {
    throw new Error(
      `missing credentials: ${missing.join(', ')}\n` +
      `      Set them in .env, or point GOOGLE_APPLICATION_CREDENTIALS at a service-account JSON.`
    );
  }

  admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
  return { admin, projectId, via: '.env (FIREBASE_* vars)' };
}

// ---------------------------------------------------------------------------
// Firestore helpers
// ---------------------------------------------------------------------------

async function readCollection(db, name) {
  const snap = await db.collection(name).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Firestore caps a batch at 500 writes. 400 leaves room and keeps each commit
 *  small enough that a failure is easy to attribute. */
const BATCH_SIZE = 400;

async function applyChanges(db, collectionName, changes) {
  let written = 0;
  for (let i = 0; i < changes.length; i += BATCH_SIZE) {
    const slice = changes.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    slice.forEach((c) => batch.update(db.collection(collectionName).doc(c.id), { price: c.to }));
    await batch.commit();
    written += slice.length;
    process.stdout.write(`    committed ${written}/${changes.length}\n`);
  }
  return written;
}

/**
 * Re-read what was just written and confirm it matches the plan.
 *
 * A batch commit that resolves means the server accepted the writes, not that the
 * documents now hold what you intended -- a rule, a trigger or a concurrent writer
 * can still have the last word. This is the cheap check that turns "committed" into
 * "verified".
 */
async function verifyChanges(db, collectionName, changes) {
  const mismatches = [];
  for (let i = 0; i < changes.length; i += BATCH_SIZE) {
    const slice = changes.slice(i, i + BATCH_SIZE);
    const refs = slice.map((c) => db.collection(collectionName).doc(c.id));
    const snaps = await db.getAll(...refs);
    snaps.forEach((snap, idx) => {
      const want = slice[idx].to;
      const got = snap.exists ? snap.data().price : undefined;
      if (got !== want) {
        mismatches.push({ id: slice[idx].id, label: slice[idx].label, want, got });
      }
    });
  }
  return mismatches;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  loadEnv();

  const { SONG_PRICE, ALBUM_PRICE_FLOOR, ALBUM_PRICE_CAP, formatPrice } =
    require(path.join(ROOT, 'src', 'utils', 'pricing.js'));
  const { planCatalogPrices, describePlan } =
    require(path.join(ROOT, 'src', 'utils', 'catalogPricePlan.js'));

  console.log('');
  console.log(APPLY ? 'APPLYING price corrections' : 'DRY RUN - nothing will be written');
  console.log(`  single        : ${formatPrice(SONG_PRICE)}`);
  console.log(`  album rule    : clamp(trackCount x single, ${formatPrice(ALBUM_PRICE_FLOOR)}, ${formatPrice(ALBUM_PRICE_CAP)})`);
  console.log(`  scope         : ${ONLY}`);

  const { admin, projectId, via } = initAdmin();
  console.log(`  credentials   : ${via}`);
  console.log(`  project       : ${projectId}`);

  // Assert, don't infer. A key that is accepted proves only that SOME project
  // accepted it -- which is exactly how a repair lands in the wrong environment.
  if (EXPECT_PROJECT && projectId !== EXPECT_PROJECT) {
    throw new Error(`REFUSING: --project=${EXPECT_PROJECT} but credentials are for "${projectId}"`);
  }

  const db = admin.firestore();

  const songs = ONLY === 'albums' ? [] : await readCollection(db, 'songs');
  const albums = ONLY === 'songs' ? [] : await readCollection(db, 'albums');

  const plan = planCatalogPrices({ songs, albums });
  const lines = describePlan(plan);

  console.log('');
  if (!lines.length) {
    console.log('  nothing to change - the catalogue already matches pricing.js');
  } else {
    lines.forEach((l) => console.log(l));
  }

  const s = plan.summary;
  console.log('');
  console.log(`  songs  : ${s.songsChecked} checked, ${s.songsWrong} to change`);
  console.log(`  albums : ${s.albumsChecked} checked, ${s.albumsWrong} to change`);
  if (s.problems) console.log(`  skipped: ${s.problems} (listed above)`);

  if (!APPLY) {
    if (s.songsWrong || s.albumsWrong) {
      console.log('');
      console.log('  Re-run with --apply to write these.');
    }
    return 0;
  }

  if (!s.songsWrong && !s.albumsWrong) return 0;

  console.log('');
  console.log('  writing...');

  if (plan.songs.length) {
    console.log('   songs:');
    await applyChanges(db, 'songs', plan.songs);
  }
  if (plan.albums.length) {
    console.log('   albums:');
    await applyChanges(db, 'albums', plan.albums);
  }

  console.log('');
  console.log('  verifying by re-reading...');
  const bad = [
    ...(await verifyChanges(db, 'songs', plan.songs)),
    ...(await verifyChanges(db, 'albums', plan.albums))
  ];

  if (bad.length) {
    console.error(`  VERIFICATION FAILED for ${bad.length} record(s):`);
    bad.forEach((m) => console.error(`    ${m.label} (${m.id}): wanted ${m.want}, found ${m.got}`));
    return 1;
  }

  console.log(`  verified ${plan.songs.length + plan.albums.length} record(s) hold the intended price.`);
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('');
    console.error(`  FAILED: ${err.message}`);
    if (/UNAUTHENTICATED|invalid_grant|Invalid PEM/i.test(err.message)) {
      console.error('');
      console.error('  That is a credentials problem, not a data problem. Most likely the');
      console.error('  service account key has been deleted or disabled in the Firebase');
      console.error('  console. Issue a new key and replace FIREBASE_PRIVATE_KEY and');
      console.error('  FIREBASE_CLIENT_EMAIL together - they are a set, not two values.');
    }
    process.exit(1);
  });
