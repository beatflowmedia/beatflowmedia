#!/usr/bin/env node
//
// scripts/ops-requests.js
//
//   npm run ops:requests            # what Percy has sent to Claude
//   npm run ops:requests -- --all   # including ones already picked up
//   npm run ops:requests -- --ack OPS-X96P6
//
// THE OTHER HALF OF "SEND TO CLAUDE".
//
// The desk's button writes a request onto an ops item in Firestore. Nothing reads it
// unless something looks, and that is this. Percy clicks Send to Claude on his phone,
// says "check ops" in the chat, and this is what answers the question "what did he send?"
//
// WHY NOT A WEBHOOK OR A POLL. The station posts to its own serve.js because Claude runs
// on the same machine as that server, so an open session can watch a local queue. BFMG's
// admin page is a deployed web app that may be open on a phone a long way from any
// terminal, and this repository has no always-on process to receive a call. A pull,
// asked for in the chat, is the honest shape: it needs nothing running, and it cannot
// fire while nobody is listening.
//
// IT ACKNOWLEDGES, IT DOES NOT ACT. Reading a request and marking it picked up is all
// this does. Whether the thing gets fixed is a conversation, and a script that moved an
// item through the state machine would be approving work Percy only asked about.

const { loadEnv, initAdmin, assertProject, args } = require('./lib/admin');
const { referenceFor, findByReference } = require('../src/utils/ops');

const COLLECTION = 'opsItems';

function ageOf(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return '';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

(async () => {
  loadEnv();
  const flags = args();
  const { admin, projectId } = initAdmin();
  const db = admin.firestore();

  // Same discipline as every other admin script here: credentials that "work" only
  // prove SOME project accepted them. Reading one project's ops queue while believing
  // it is another's is the quiet version of that mistake.
  assertProject(projectId, 'beatflowmedia');

  const snap = await db.collection(COLLECTION).get();
  const items = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((i) => i.claudeRequest);

  // --ack marks one as picked up, so the same request is not worked twice. Takes the
  // reference rather than the id, because the reference is what is on screen and what
  // Percy would quote.
  const ack = flags.value('ack', null);
  if (ack) {
    const target = findByReference(items, ack);
    if (!target) {
      console.error(`\n  No queued request for ${ack}.\n`);
      process.exit(1);
    }
    await db.collection(COLLECTION).doc(target.id).set({
      claudeRequest: {
        ...target.claudeRequest,
        status: 'picked-up',
        pickedUpAt: new Date().toISOString()
      }
    }, { merge: true });
    console.log(`\n  ${referenceFor(target.id)} marked picked up.\n`);
    process.exit(0);
  }

  const showAll = flags.has('--all');
  const queued = items.filter((i) => showAll || i.claudeRequest.status === 'queued');

  console.log('\nops:requests — what Percy has sent to Claude\n');

  if (!queued.length) {
    console.log('  Nothing queued.');
    console.log(items.length
      ? `  (${items.length} request(s) already picked up — re-run with --all to see them.)\n`
      : '\n');
    process.exit(0);
  }

  queued
    .sort((a, b) => String(a.claudeRequest.at).localeCompare(String(b.claudeRequest.at)))
    .forEach((item) => {
      const r = item.claudeRequest;
      console.log(`  ${referenceFor(item.id)}  [${r.status}]  ${ageOf(r.at)}`);
      console.log(`     ${item.title || item.id}`);
      if (item.area) console.log(`     area: ${item.area}`);
      // The note is the whole reason the button has a prompt. Printed in full, never
      // truncated: a request shortened to fit a column is a request half read.
      if (r.message) console.log(`     asked: ${r.message}`);
      console.log(`     ack:   npm run ops:requests -- --ack ${referenceFor(item.id)}`);
      console.log('');
    });

  console.log(`  ${queued.length} request(s). Acknowledging is not acting — the fix is`);
  console.log('  still a conversation, and merging or deploying still needs Percy.\n');
  process.exit(0);
})().catch((err) => {
  console.error('\nops:requests FAILED:', err.message);
  console.error('  If this is a credentials error, the service account in .env is the');
  console.error('  thing to check — see scripts/lib/admin.js.\n');
  process.exit(1);
});
