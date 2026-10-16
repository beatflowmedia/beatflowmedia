// src/data/platformChanges.js
//
// What changed on the platform, in terms a buyer can act on.
//
// TWO SOURCES, DELIBERATELY ASYMMETRIC
//
//   DERIVED  — every version of an agreement, from AGREEMENT_HISTORY in utils/agreements.
//              These generate themselves. Publishing a new license version is what
//              creates the entry, so the entry cannot be forgotten, and it cannot drift
//              from what the checkout actually enforces.
//
//   AUTHORED — features, pricing, anything else worth telling someone. Someone has to
//              write these. If nobody does, nothing appears, and nothing is WRONG.
//
// That asymmetry is the whole design. An authored changelog rots: the first forgotten
// entry makes the page untrustworthy, and an untrustworthy page is worse than no page,
// because people stop reading it and then miss the one entry that mattered. The entries
// with legal weight are the ones that generate themselves; the nice-to-have ones degrade
// to silence rather than to a stale list.
//
// WHAT DOES NOT BELONG HERE
// Bug fixes, refactors, deploys, infrastructure. "Fixed a redirect rule" is true and
// useless, and a link that usually leads to it teaches people the link is worthless --
// so when the terms genuinely change, nobody clicks. If a reader would not do anything
// differently, it is not an entry.

// ESM named imports here, CommonJS in utils/agreements.js. That direction is fine and
// is what the rest of src/ already does (Terms.js imports from it the same way).
//
// This file was briefly CommonJS itself, and the build then failed with
// "Attempted import error: 'hasUnseenChanges' is not exported" -- webpack could not
// statically resolve named imports out of a `module.exports = {...}` object here, and
// CRA reported it as a type error rather than a compile failure, so the build exited 0
// having written no index.html at all. Nothing in src/ needs this to be CommonJS: only
// the page and the update prompt consume it, both of them bundled.
import {
  AGREEMENT_HISTORY,
  AGREEMENT_LABELS,
  ALL_AGREEMENTS
} from '../utils/agreements';

/**
 * Hand-written entries. Newest first. Empty is a perfectly good state.
 *
 * Shape: { date: 'YYYY-MM-DD', kind: 'feature'|'pricing'|'notice',
 *          headline: string, points: string[] }
 *
 * Write `headline` as what it means for the reader, not what was built. "You can now
 * re-download a track you bought" rather than "added download history endpoint".
 */
export const AUTHORED_CHANGES = [
  // Intentionally empty. The download-license entries below are derived and already
  // cover the only user-facing change so far. Add here when something a buyer would
  // act on actually ships.
];

/** 'YYYY-MM-DD' -> a date a reader recognises. Avoids locale surprises in tests. */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export function formatChangeDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return String(iso || '');
  const day = Number(m[3]);
  return day + ' ' + MONTHS[Number(m[2]) - 1] + ' ' + m[1];
}

/**
 * Every agreement version, as a change entry.
 *
 * The OLDEST version of an agreement is still included, with its own wording, because
 * a buyer may hold a license under it and has to be able to read what they agreed to.
 * That is the gap this module was built to close: /terms previously said "ask us and we
 * will send you your version", which does not scale and makes people ask.
 */
export function agreementChanges() {
  const entries = [];

  ALL_AGREEMENTS.forEach((agreement) => {
    const history = AGREEMENT_HISTORY[agreement] || [];
    history.forEach((entry, index) => {
      entries.push({
        date: entry.version,
        kind: 'terms',
        agreement,
        agreementLabel: AGREEMENT_LABELS[agreement] || agreement,
        identifier: agreement + '@' + entry.version,
        // The newest entry for an agreement is the one in force now. Older ones are
        // still binding on the purchases that accepted them -- "superseded" is not
        // "void", and saying so is the point of showing them at all.
        inForce: index === 0,
        headline: entry.headline,
        points: entry.whatChanged || [],
        summary: entry.summary || null
      });
    });
  });

  return entries;
}

/**
 * Everything, newest first.
 *
 * Ties break toward terms entries, because on a day when both a feature and a license
 * version shipped, the license version is the one with consequences.
 */
export function allChanges() {
  const merged = [...agreementChanges(), ...AUTHORED_CHANGES.map((c) => ({ ...c, points: c.points || [] }))];

  return merged.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    if (a.kind === b.kind) return 0;
    return a.kind === 'terms' ? -1 : 1;
  });
}

/** The date of the most recent entry, or null when there are none. */
export function latestChangeDate() {
  const all = allChanges();
  return all.length ? all[0].date : null;
}

/**
 * Should the update prompt offer a link to /changes?
 *
 * Only when there is an entry the reader has not already seen. The update modal itself
 * fires on EVERY deploy -- its job is getting new code onto the device, which is worth a
 * prompt whether or not there is a story. The LINK is the part that must stay rare, or
 * it trains people to ignore it.
 *
 * @param {string|null} lastSeenDate - 'YYYY-MM-DD' the reader has acknowledged
 */
export function hasUnseenChanges(lastSeenDate) {
  const latest = latestChangeDate();
  if (!latest) return false;
  if (!lastSeenDate) return true;
  return latest > lastSeenDate;
}


// --- "has this reader seen it" -------------------------------------------------------
//
// Kept here, beside the entries, so one module owns both what changed and whether it has
// been read. Splitting them puts the key name in one file and the comparison in another,
// and they drift.
//
// localStorage is per-browser and can throw outright (private mode, blocked site data),
// so every access is guarded and every failure degrades to "not seen". Failing that way
// round shows the link to someone who has already read it, which is a mild annoyance;
// failing the other way hides a license change from someone who has not, which is the
// outcome this page exists to prevent.

export const SEEN_KEY = 'bfmg:changes-seen';

export function getLastSeenChangeDate() {
  try {
    return window.localStorage.getItem(SEEN_KEY) || null;
  } catch (err) {
    return null;
  }
}

/**
 * Marked when the reader actually OPENS /changes, not when they dismiss the prompt.
 * Dismissing a modal is not reading, and treating it as read would quietly consume the
 * one notice a license change gets.
 */
export function markChangesSeen(date) {
  try {
    const value = date || latestChangeDate();
    if (value) window.localStorage.setItem(SEEN_KEY, value);
  } catch (err) {
    // Nothing to do. The link shows again next time, which is the safe direction.
  }
}

