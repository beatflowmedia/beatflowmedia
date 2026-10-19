#!/usr/bin/env node
//
// scripts/ops-file.js
//
//   node scripts/ops-file.js <file.json>        # file one incident
//   node scripts/ops-file.js <file.json> --dry  # validate and print, write nothing
//
// FILING AN INCIDENT. The write half of the ops desk.
//
// The desk can show incidents and Percy can decide them; until now nothing could PUT
// one there. This is what an agent — or Claude in a chat — uses to record a finding so
// it survives the conversation that produced it.
//
// VALIDATES BEFORE IT WRITES, using the same src/utils/ops.js the desk reads with. A
// record that the page cannot render is worse than no record: it occupies a slot in a
// queue Percy trusts and shows him nothing.
//
// REFUSES DUPLICATES BY FINGERPRINT, which is the rule that keeps the desk usable. An
// agent that re-files the same root cause on every run turns the queue into noise, and
// a noisy queue gets ignored exactly like a permanently-red check. If a matching
// fingerprint exists and is not resolved or merged, this stops. If Percy DECLINED it,
// it stops harder — he has decided, and re-asking is not a new finding.
//
// IT CANNOT APPROVE. Everything is filed as `open`. The approval gate lives in
// transition(), and a filer that could write `approved` directly would walk straight
// past it.

const fs = require('fs');
const path = require('path');

const { loadEnv, initAdmin, assertProject, args } = require('./lib/admin');
const { problems, referenceFor, idFor } = require('../src/utils/ops');

const COLLECTION = 'opsItems';

(async () => {
  loadEnv();
  const flags = args();
  const file = process.argv.slice(2).find((a) => !a.startsWith('--'));

  if (!file) {
    console.error('\n  usage: node scripts/ops-file.js <file.json> [--dry]\n');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  const records = Array.isArray(raw) ? raw : [raw];

  const prepared = records.map((r) => ({
    kind: r.owner ? 'task' : 'incident',
    created: r.created || new Date().toISOString(),
    by: r.by || 'claude',
    status: 'open',
    verified: r.verified !== undefined ? r.verified : true,
    ...r,
    // Derived last so a hand-written file does not have to get the id format right,
    // and so the id always matches the area and title it claims.
    id: r.id || idFor(r.created || new Date().toISOString(), r.area, r.title),
    fingerprint: r.fingerprint || `${r.area}:${(r.where && r.where[0]) || 'general'}:${r.title}`
  }));

  // --- validate everything BEFORE writing anything -----------------------------
  let bad = 0;
  prepared.forEach((item) => {
    const issues = problems(item);
    if (issues.length) {
      bad += 1;
      console.error(`\n  INVALID  ${item.id || '(no id)'}`);
      issues.forEach((i) => console.error(`     ${i}`));
    }
  });
  if (bad) {
    console.error(`\n  ${bad} record(s) refused. Nothing written.\n`);
    process.exit(1);
  }

  if (flags.has('--dry')) {
    console.log('\nops:file — DRY RUN, nothing written\n');
    prepared.forEach((i) => {
      console.log(`  ${referenceFor(i.id)}  [${i.severity}] ${i.area}  ${i.title}`);
      console.log(`     id: ${i.id}`);
      console.log(`     fingerprint: ${i.fingerprint}\n`);
    });
    process.exit(0);
  }

  const { admin, projectId } = initAdmin();
  assertProject(projectId, 'beatflowmedia');
  const db = admin.firestore();

  // --- duplicate check ---------------------------------------------------------
  const existing = (await db.collection(COLLECTION).get()).docs.map((d) => ({ id: d.id, ...d.data() }));

  console.log('\nops:file\n');
  let written = 0;

  for (const item of prepared) {
    const clash = existing.find((e) => e.fingerprint === item.fingerprint);
    if (clash && !['resolved', 'merged'].includes(clash.status)) {
      const declined = clash.status === 'declined';
      console.log(`  SKIP  ${referenceFor(clash.id)}  same fingerprint, status ${clash.status}`);
      console.log(`        ${declined
        ? 'Percy declined this. Re-filing it is not a new finding.'
        : 'Already open. Add to it rather than filing again.'}\n`);
      continue;
    }

    await db.collection(COLLECTION).doc(item.id).set(item, { merge: true });
    written += 1;
    console.log(`  FILED ${referenceFor(item.id)}  [${item.severity}] ${item.area}`);
    console.log(`        ${item.title}\n`);
  }

  console.log(`  ${written} filed, ${prepared.length - written} skipped.`);
  console.log('  All filed as `open`. Only Percy can approve or decline, on the desk.\n');
  process.exit(0);
})().catch((err) => {
  console.error('\nops:file FAILED:', err.message, '\n');
  process.exit(1);
});
