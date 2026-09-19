// netlify/functions/lib/master-availability.js
//
// Reconcile `previewOnly` against whether a master actually exists. Pure decision.
//
// WHAT previewOnly ACTUALLY MEANS
// It is an INVENTORY flag, not a permission. It does not say "this user may not buy
// this"; it says "we cannot deliver this". An authorised admin hits it exactly as an
// anonymous visitor does, which is correct and is why it looks confusing in the UI.
//
// Why it has to exist at all: BFMG's purchase path resolves audio as
// `downloadUrl || fullTrackUrl || audioUrl`, and the station deliberately writes the
// master's location NOWHERE, because the `songs` collection is world-readable and a
// downloadUrl field holding the R2 address would publish the product for free. So a
// completed checkout on a record with no server-side master resolution would hand
// the buyer the 30-second preview sitting in audioUrl. previewOnly is the only thing
// standing between a paying customer and a 30-second file.
//
// WHY IT IS NOW WRONG
// The station sets `previewOnly: true` UNCONDITIONALLY on every seeded song -- it is
// not derived per record from whether a master exists. Its own comment says
// "Clearing this flag is the last step of building master resolution, not a
// tidy-up." Master resolution now exists (netlify/functions/lib/masters.js and
// download-master.js), so the flag is a blanket assertion that has outlived the
// condition it was asserting, and it will stay wrong until something derives it.
//
// This module is that derivation. A flag nobody can recompute is a promise; this
// makes it a reconciler you can run.
//
// BOTH DIRECTIONS ARE CHECKED, and the second one is the dangerous one:
//
//   master exists  + previewOnly true   -> CLEAR. Sellable and deliverable, held
//                                          back by a stale blanket flag.
//   master missing + previewOnly true   -> correct. Leave it alone.
//   master exists  + previewOnly false  -> correct. Leave it alone.
//   master missing + previewOnly false  -> SET. Sellable and UNDELIVERABLE: a
//                                          purchase would fall through to audioUrl
//                                          and deliver the 30-second preview. This
//                                          is the exact harm the flag exists to
//                                          prevent, and a one-directional "unlock
//                                          the catalogue" script would never look
//                                          for it.
//
// A missing `previewOnly` field counts as SELLABLE, matching the station's own
// reader (`const sellable = song.previewOnly !== true`). That makes an absent field
// dangerous rather than neutral, which is why it is spelled out rather than assumed.
//
// It lives HERE rather than in src/utils because it requires the master key
// contract from ./masters, and CRA's ModuleScopePlugin forbids anything under src/
// from importing outside it. Nothing in the browser needs this -- previewOnly is
// READ by the UI, but deriving it is tooling.

const { masterObjectKey, isValidIsrc } = require('./masters');

/** The station's rule, stated once. A missing field means sellable. */
function isSellable(song) {
  return !song || song.previewOnly !== true;
}

/** Outcome kinds, so callers match on a constant rather than a string literal. */
const CLEAR = 'clear';   // previewOnly: true -> remove the block, it is deliverable
const SET = 'set';       // previewOnly: absent/false -> block it, it is NOT deliverable

/**
 * Build the reconciliation plan.
 *
 * @param {object} input
 * @param {Array<object>} input.songs - `{ id, title, isrc, previewOnly }`
 * @param {object|Map} input.masterPresence - song id -> true (master found),
 *        false (confirmed absent), or undefined/null (could not be checked).
 *        Undefined is NOT treated as absent: an unreachable bucket must never look
 *        like an empty one, or a network blip would block the whole catalogue.
 * @returns {{clear: Array, set: Array, problems: Array, summary: object}}
 */
function planMasterAvailability(input) {
  const songs = (input && input.songs) || [];
  const presenceInput = (input && input.masterPresence) || {};
  const lookup = (id) =>
    presenceInput instanceof Map ? presenceInput.get(id) : presenceInput[id];

  const plan = { clear: [], set: [], problems: [] };

  songs.forEach((song) => {
    const label = song.title || song.id;

    if (!isValidIsrc(song.isrc)) {
      plan.problems.push({
        id: song.id,
        label,
        reason: song.isrc
          ? `ISRC "${song.isrc}" is not well formed, cannot locate a master`
          : 'no ISRC, cannot locate a master'
      });
      return;
    }

    const present = lookup(song.id);

    if (present !== true && present !== false) {
      plan.problems.push({
        id: song.id,
        label,
        reason: 'master presence could not be determined (not checked, or the probe failed)'
      });
      return;
    }

    const sellable = isSellable(song);

    if (present && !sellable) {
      plan.clear.push({
        id: song.id,
        label,
        isrc: song.isrc,
        key: masterObjectKey(song.isrc),
        action: CLEAR,
        reason: 'master exists; the blanket previewOnly flag is holding back a deliverable record'
      });
      return;
    }

    if (!present && sellable) {
      plan.set.push({
        id: song.id,
        label,
        isrc: song.isrc,
        key: masterObjectKey(song.isrc),
        action: SET,
        reason: 'SELLABLE BUT UNDELIVERABLE — a purchase would deliver the 30-second preview'
      });
    }
  });

  plan.summary = {
    checked: songs.length,
    toClear: plan.clear.length,
    toSet: plan.set.length,
    problems: plan.problems.length
  };

  return plan;
}

/** Render a plan the same way wherever it is run, so what a person approves in one
 *  place is what they see in another. */
function describeMasterPlan(plan) {
  const lines = [];

  plan.clear.forEach((c) => {
    lines.push(`  UNLOCK  ${c.label}  (${c.isrc})  master found at ${c.key}`);
  });

  plan.set.forEach((c) => {
    lines.push(`  BLOCK   ${c.label}  (${c.isrc})  NO master at ${c.key} — ${c.reason}`);
  });

  plan.problems.forEach((p) => {
    lines.push(`  SKIP    ${p.label}: ${p.reason}`);
  });

  return lines;
}

module.exports = {
  CLEAR,
  SET,
  isSellable,
  planMasterAvailability,
  describeMasterPlan
};
