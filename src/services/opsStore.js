// src/services/opsStore.js
//
// Reading and writing ops items. The only module that touches the `opsItems` collection.
//
// THE MERGE RULE, which is the whole design:
//
//   TEXT comes from the repository   (src/data/opsBacklog.js)
//   STATE comes from Firestore       (opsItems/<id>)
//
// A seed in the repository is reviewable in a pull request, survives the database being
// reset, and carries its reasoning in a comment beside it. What CHANGES -- done,
// declined, still open, and who said so when -- belongs in the database, because an
// editor is not going to edit a source file to tick something off.
//
// THE CONSEQUENCE WORTH STATING: deleting a line from opsBacklog.js does NOT resurrect
// it, and resolving one does NOT delete it. A resolved seed stays resolved because its
// Firestore record says so; a removed seed simply stops being offered. Those are the two
// directions that would otherwise produce a to-do list that argues with itself.
//
// WHY FIRESTORE AND NOT A GIT BRANCH. The station keeps incidents as JSON on an `ops`
// branch, and its reasoning is sound for the station: it has no app and no auth, so git
// was the only thing already hosted, and a branch gives free history. BFMG has an app
// and an admin gate already, so a branch would mean building a GitHub reader to
// re-solve a solved problem. The trade is real -- git history is free and this is not --
// so `history` is kept ON each item rather than relying on the store to remember.

import {
  collection, doc, getDocs, setDoc, serverTimestamp, query, where, getCountFromServer
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { BACKLOG } from '../data/opsBacklog';
import { checkItems } from '../utils/opsChecks';
import { sort, transition, problems, referenceFor } from '../utils/ops';
import { WORK_SOURCES } from '../utils/opsWork';

const COLLECTION = 'opsItems';

/** Shape a repository seed into a full ops item. One place decides the defaults. */
function seedToItem(seed) {
  return {
    ...seed,
    kind: 'incident',
    owner: 'percy',
    by: 'claude',
    created: seed.created || '2026-10-18T00:00:00Z',
    status: 'open',
    verified: true,
    // An agent must be able to recognise this as "already known" and not file it again
    // as code. Same fingerprint discipline the station runs.
    fingerprint: seed.fingerprint || `${seed.area}:backlog:${seed.id}`,
    source: 'seed'
  };
}

/**
 * Everything on the desk: seeded to-dos merged with their stored state, plus anything
 * agents have filed, plus the reconcilers.
 *
 * READS BEFORE IT MERGES and never writes. A dashboard that writes on load creates
 * records for things nobody has decided, and then "open" stops meaning "undecided".
 */
export async function loadOpsItems() {
  let stored = {};
  let storeError = null;

  try {
    const snap = await getDocs(collection(db, COLLECTION));
    stored = Object.fromEntries(snap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
  } catch (err) {
    // A desk that renders nothing because the database is unreachable is worse than one
    // that renders the seeds and says so. The seeds are the part Percy most needs, and
    // they do not depend on Firestore being up.
    console.error('opsStore: could not read stored state —', err.code, err.message);
    storeError = err.message || 'Could not read saved status.';
  }

  const seeded = BACKLOG.map((seed) => {
    const base = seedToItem(seed);
    const saved = stored[seed.id];
    if (!saved) return base;
    // Stored state wins over the seed's defaults; seed text wins over stored text, so
    // editing the wording in the repo updates what is shown without losing the status.
    return {
      ...base,
      status: saved.status || base.status,
      history: saved.history || [],
      decidedAt: saved.decidedAt || null,
      claudeRequest: saved.claudeRequest || null
    };
  });

  // Anything an agent filed. Keyed out of the seeds so a seed cannot be duplicated by a
  // record carrying the same id.
  const seedIds = new Set(BACKLOG.map((s) => s.id));
  const filed = Object.values(stored)
    .filter((s) => !seedIds.has(s.id) && s.kind !== 'check');

  // Reconciler states, if anything has recorded them.
  const checkStates = stored.__checks?.states || {};

  return {
    items: sort([...seeded, ...filed]),
    checks: checkItems(checkStates),
    checksLastRun: stored.__checks?.lastRun || null,
    storeError
  };
}

/**
 * How much work is waiting on a person, per queue.
 *
 * COUNTED WITH AGGREGATION QUERIES, which is the whole reason this is not a `getDocs`
 * and a `.length`. `getCountFromServer` bills ONE read per query regardless of how many
 * documents match; fetching the documents to count them bills one per document. Five
 * queues at a few hundred rows each, on every visit to the desk, is a bill for data
 * nobody renders. This project is on Blaze and reads are billed — that is the measured
 * reason, not a preference.
 *
 * EACH SOURCE FAILS ALONE. One collection the rules do not permit must not blank the
 * whole desk, so a rejected query becomes an error on that row and the others still
 * report. The desk's job is to tell Percy what is waiting; "I could not check sponsors"
 * is useful, "something went wrong" is not.
 */
export async function countWaitingWork() {
  const entries = await Promise.all(WORK_SOURCES.map(async (source) => {
    try {
      const base = collection(db, source.collection);
      const q = source.waitingWhere ? query(base, where(...source.waitingWhere)) : base;
      const snap = await getCountFromServer(q);
      return [source.key, { count: snap.data().count }];
    } catch (err) {
      console.error(`opsStore: could not count ${source.collection} —`, err.code, err.message);
      return [source.key, { count: 0, error: err.code || 'unavailable' }];
    }
  }));
  return Object.fromEntries(entries);
}

/**
 * Record a decision. Validates the move through the same state machine an agent uses,
 * so the dashboard cannot perform a transition an agent would be refused.
 *
 * @param {object} item
 * @param {string} to      the new status
 * @param {string} [note]  Percy's reason, which is the brief if it goes back to a fixer
 */
export async function decide(item, to, note) {
  // `percy` because only an admin reaches this code: /admin/ops is behind
  // ProtectedRoute's isPlatformAdmin check. The actor is not taken from the caller,
  // because a parameter is a thing a future caller can get wrong.
  const next = transition(item, to, 'percy', note);

  const invalid = problems(next);
  if (invalid.length) {
    // Refuse rather than write a record the rest of the system would reject. A desk
    // that can create items an agent cannot read is a desk that silently diverges.
    throw new Error(`Refusing to save an invalid item: ${invalid.join('; ')}`);
  }

  await setDoc(
    doc(db, COLLECTION, item.id),
    {
      id: item.id,
      kind: next.kind,
      area: next.area,
      owner: next.owner || null,
      status: next.status,
      history: next.history,
      decidedAt: serverTimestamp()
    },
    { merge: true }
  );

  return next;
}

/**
 * Ask Claude to look at an item.
 *
 * THE STATION DOES THIS WITH AN HTTP CALL to its own serve.js, which queues the request
 * for an open Claude session running on the same machine. BFMG has no such server --
 * this is a deployed web app, and the admin page may be open on a phone a long way from
 * any terminal -- so the queue is the one place both sides can already reach: Firestore.
 *
 * WRITTEN ONTO THE ITEM, not into a separate collection. A request is always ABOUT an
 * item, the item is already admin-gated by the rule that covers opsItems, and keeping it
 * here means no second security rule that has to agree with the first. It also makes the
 * natural limit the right one: one outstanding request per item, because a second "look
 * at this" before the first was read is not a second job.
 *
 * IT APPROVES NOTHING, and the dialog says so. Same rule the station runs: asking Claude
 * to investigate is not approving a fix, and merging or deploying still needs Percy's
 * words. A button that quietly granted permission would make the approval gate theatre.
 */
export async function askClaude(item, message) {
  const request = {
    at: new Date().toISOString(),
    message: (message || '').trim() || null,
    status: 'queued',
    // The reference is stored, not derived on read, so the queue is readable by a script
    // that has no reason to import the UI's vocabulary.
    reference: referenceFor(item.id)
  };

  await setDoc(
    doc(db, COLLECTION, item.id),
    {
      id: item.id,
      kind: item.kind || 'incident',
      area: item.area || null,
      owner: item.owner || null,
      // The item's own status is DELIBERATELY not touched. Asking a question about
      // something does not move it through the state machine, and a request that
      // silently flipped `open` to `fixing` would lose the fact that nobody has decided.
      title: item.title,
      claudeRequest: request
    },
    { merge: true }
  );

  return request;
}

/** Record a run of the reconcilers. Written by scripts/ops-run-checks.js, not the page. */
export async function recordCheckRun(states) {
  await setDoc(
    doc(db, COLLECTION, '__checks'),
    { kind: 'check-run', states, lastRun: new Date().toISOString() },
    { merge: true }
  );
}
