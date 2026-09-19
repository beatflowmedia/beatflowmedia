#!/usr/bin/env node
//
// scripts/backfill-ai-disclosure.js
//
// Record the AI provenance of existing catalogue records.
//
//   npm run backfill:ai                                   # dry run, reports current state
//   npm run backfill:ai -- --disclosure=ai-assisted --contributions=lyrics --apply
//   npm run backfill:ai -- --disclosure=synthetic --apply --only=<songId>
//
// WHY THIS CANNOT PICK A VALUE FOR YOU
// The disclosure is a statement of fact about who made the recording. It feeds two
// things that punish a wrong answer differently:
//
//   - Luminate chart reporting, where a wrong tag is bad metadata
//   - a U.S. Copyright Office registration, where a wrong claim is a false statement
//     on a federal application
//
// src/utils/aiDisclosure.js therefore returns null for an unclassified record rather
// than defaulting, and this script will not --apply without an explicit
// --disclosure. Convenient as it would be to stamp "synthetic" across a catalogue
// known to be AI-generated, that is a legal declaration and it has to be made by a
// person who knows whether a human wrote the lyrics.
//
// THE DISTINCTION THAT MATTERS MOST
//   synthetic    -> no copyright anywhere. Nothing registrable.
//   ai-assisted  -> if a human wrote the lyrics or melody, the COMPOSITION is
//                   registrable even though the master is not.
// Those are very different assets, and only one of them can be registered,
// licensed on its own, or collected on through a PRO.

const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valueOf = (name, dflt) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : dflt;
};

const APPLY = has('--apply');
const DISCLOSURE = valueOf('disclosure', null);
const CONTRIBUTIONS = (valueOf('contributions', '') || '')
  .split(',').map((s) => s.trim()).filter(Boolean);
const ONLY_ID = valueOf('only', null);
const EXPECT_PROJECT = valueOf('project', null);
const OVERWRITE = has('--overwrite');

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
    return { admin, projectId: sa.project_id, via: 'GOOGLE_APPLICATION_CREDENTIALS' };
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = unescapePem(process.env.FIREBASE_PRIVATE_KEY);
  if (!projectId || !clientEmail || !privateKey) throw new Error('missing Firebase credentials');
  admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
  return { admin, projectId, via: '.env' };
}

const BATCH_SIZE = 400;

async function main() {
  loadEnv();

  const ai = require(path.join(ROOT, 'src', 'utils', 'aiDisclosure.js'));
  const { ALL_DISCLOSURES, HUMAN_CONTRIBUTIONS, aiDisclosureOf, disclosureLabel, registrationClaim } = ai;

  console.log('');
  console.log(APPLY ? 'APPLYING AI disclosure' : 'DRY RUN - nothing will be written');

  if (DISCLOSURE && !ALL_DISCLOSURES.includes(DISCLOSURE)) {
    throw new Error(
      `--disclosure=${DISCLOSURE} is not a known value.\n` +
      '      Valid: ' + ALL_DISCLOSURES.join(', ')
    );
  }

  const validContributions = Object.values(HUMAN_CONTRIBUTIONS);
  const badContribution = CONTRIBUTIONS.find((c) => !validContributions.includes(c));
  if (badContribution) {
    throw new Error(
      `--contributions includes "${badContribution}", which is not recognised.\n` +
      '      Valid: ' + validContributions.join(', ')
    );
  }

  const { admin, projectId, via } = initAdmin();
  console.log(`  credentials : ${via}`);
  console.log(`  project     : ${projectId}`);
  if (EXPECT_PROJECT && projectId !== EXPECT_PROJECT) {
    throw new Error(`REFUSING: --project=${EXPECT_PROJECT} but credentials are for "${projectId}"`);
  }

  const db = admin.firestore();
  const snap = await db.collection('songs').get();
  const songs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const scoped = ONLY_ID ? songs.filter((s) => s.id === ONLY_ID) : songs;

  const already = scoped.filter((s) => aiDisclosureOf(s) !== null);
  const missing = scoped.filter((s) => aiDisclosureOf(s) === null);

  console.log('');
  console.log(`  songs in scope      : ${scoped.length}`);
  console.log(`  already disclosed   : ${already.length}`);
  console.log(`  MISSING a disclosure: ${missing.length}`);

  if (already.length) {
    const byValue = {};
    already.forEach((s) => {
      const v = aiDisclosureOf(s);
      byValue[v] = (byValue[v] || 0) + 1;
    });
    console.log('');
    console.log('  existing disclosures:');
    Object.entries(byValue).forEach(([v, n]) => console.log(`    ${String(n).padStart(4)}  ${disclosureLabel(v)}`));
  }

  if (!DISCLOSURE) {
    console.log('');
    console.log('  No --disclosure given, so nothing can be written.');
    console.log('  This is deliberate: the tag is a legal declaration, not a default.');
    console.log('');
    console.log('  Choose one:');
    ALL_DISCLOSURES.forEach((d) => console.log(`    --disclosure=${d.padEnd(22)} ${disclosureLabel(d)}`));
    console.log('');
    console.log('  If a human wrote the lyrics or melody, this is ai-assisted, NOT synthetic,');
    console.log('  and the COMPOSITION is registrable even though the master is not. Add');
    console.log('  --contributions=lyrics,melody to record what that human actually wrote.');
    return 0;
  }

  // Preview the legal consequence of the choice before writing it.
  const sample = { aiDisclosure: DISCLOSURE, humanContributions: CONTRIBUTIONS };
  const claim = registrationClaim(sample);
  console.log('');
  console.log(`  choice      : ${disclosureLabel(DISCLOSURE)}`);
  console.log(`  contributions: ${CONTRIBUTIONS.length ? CONTRIBUTIONS.join(', ') : '(none recorded)'}`);
  console.log('  consequence :');
  console.log(`    composition registrable   : ${claim.composition.registrable}  (${claim.composition.reason})`);
  console.log(`    sound recording registrable: ${claim.soundRecording.registrable}  (${claim.soundRecording.reason})`);
  console.log(`    must disclaim AI material  : ${claim.mustDisclaim}`);

  const targets = OVERWRITE ? scoped : missing;
  console.log('');
  console.log(`  would write to ${targets.length} record(s)${OVERWRITE ? ' (--overwrite: including already-disclosed)' : ''}`);

  if (!APPLY) {
    console.log('');
    console.log('  Re-run with --apply to write.');
    return 0;
  }
  if (!targets.length) return 0;

  const payload = { aiDisclosure: DISCLOSURE };
  if (CONTRIBUTIONS.length) payload.humanContributions = CONTRIBUTIONS;

  console.log('');
  console.log('  writing...');
  let written = 0;
  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const slice = targets.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    slice.forEach((s) => batch.update(db.collection('songs').doc(s.id), payload));
    await batch.commit();
    written += slice.length;
    process.stdout.write(`    committed ${written}/${targets.length}\n`);
  }

  console.log('');
  console.log('  verifying by re-reading...');
  const bad = [];
  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const slice = targets.slice(i, i + BATCH_SIZE);
    const snaps = await db.getAll(...slice.map((s) => db.collection('songs').doc(s.id)));
    snaps.forEach((d, idx) => {
      const got = d.exists ? d.data().aiDisclosure : undefined;
      if (got !== DISCLOSURE) bad.push({ id: slice[idx].id, title: slice[idx].title, got });
    });
  }
  if (bad.length) {
    console.error(`  VERIFICATION FAILED for ${bad.length} record(s):`);
    bad.slice(0, 10).forEach((b) => console.error(`    ${b.title || b.id}: found ${b.got}`));
    return 1;
  }

  console.log(`  verified ${targets.length} record(s).`);
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('');
    console.error(`  FAILED: ${err.message}`);
    process.exit(1);
  });
