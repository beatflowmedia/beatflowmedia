// src/utils/licenseRevocation.js
//
// Withdrawing a license. SINGLE SOURCE for what revoked means and how it is recorded.
//
// WHY THIS EXISTS
// /terms says "A download license terminates automatically and immediately if you
// breach any restriction above." Until now that sentence had nothing behind it: the
// entitlement path asked only "is there a completed purchase", so a license could be
// terminated on paper while the buyer kept re-downloading from their library forever.
// A clause the system cannot enforce is a clause the other side can ignore.
//
// WHAT REVOCATION CAN AND CANNOT DO
// It stops FUTURE access. It cannot un-download a file that has already been taken,
// and the downloads are deliberately DRM-free, so nothing here is a kill switch.
// What it buys is: the buyer's right to use the recording ends, continued use becomes
// a breach rather than a licensed use, and the platform stops serving them. The
// remedy is legal; this is the part of it the software can carry out.
//
// REVOCATION IS NOT A PAYMENT STATE, and keeping them apart is the point.
// A purchase already has `status: 'completed'`, which describes MONEY. Revocation
// describes the LICENCE. They move independently:
//
//   paid + licensed      normal
//   paid + revoked       abuse; the money stays, the right ends
//   refunded + revoked   chargeback or goodwill refund
//   refunded + licensed  a refund given while leaving the license intact
//
// Overloading `status` would collapse those four into a muddle and silently break
// the entitlement check, which tests for exactly 'completed'. So revocation lives in
// its own fields.
//
// IT IS AUDITED AND REVERSIBLE. Who, when, why, and a free-text note -- because a
// revocation may end up in front of a lawyer, and "we turned it off in March" is not
// an answer. Reinstatement is supported because revoking the wrong account is a
// mistake somebody will make.

/** Why a license was withdrawn. Free text is kept separately in `note`; these are
 *  the categories that a report or a dispute will be grouped by. */
const REVOCATION_REASONS = {
  /** Used outside the granted scope: public performance, DJ set, remix, resale. */
  BREACH_OF_TERMS: 'breach-of-terms',
  /** Buyer disputed the charge with their bank. */
  CHARGEBACK: 'chargeback',
  /** Money returned, license withdrawn with it. */
  REFUND: 'refund',
  /** Fraudulent purchase — stolen card, bot, credential stuffing. */
  FRAUD: 'fraud',
  /** Sold something we could not deliver, or sold it twice. */
  ADMIN_ERROR: 'admin-error',
  /** The recording came down and the sale cannot stand. Note: an ordinary takedown
   *  should NOT revoke — /terms promises licenses already sold survive removal.
   *  This is for the case where the upload was never lawfully ours to sell. */
  RIGHTS_WITHDRAWN: 'rights-withdrawn'
};

const ALL_REASONS = Object.values(REVOCATION_REASONS);

const REASON_LABELS = {
  [REVOCATION_REASONS.BREACH_OF_TERMS]: 'Breach of license terms',
  [REVOCATION_REASONS.CHARGEBACK]: 'Payment charged back',
  [REVOCATION_REASONS.REFUND]: 'Refunded',
  [REVOCATION_REASONS.FRAUD]: 'Fraudulent purchase',
  [REVOCATION_REASONS.ADMIN_ERROR]: 'Administrative error',
  [REVOCATION_REASONS.RIGHTS_WITHDRAWN]: 'Rights withdrawn'
};

/**
 * Is this purchase's license currently withdrawn?
 *
 * Checks an explicit boolean rather than the presence of `revokedAt`, so that a
 * reinstatement which clears the flag but KEEPS the history reads as active. The
 * history is evidence and must not be erased to undo a mistake.
 */
function isRevoked(purchase) {
  return !!(purchase && purchase.licenseRevoked === true);
}

/**
 * The fields to write when withdrawing a license.
 *
 * `at` is passed in rather than generated so the caller can use a server timestamp;
 * a client clock on a record that may be disputed is worth nothing.
 *
 * @param {object} input
 * @param {string} input.reason - one of REVOCATION_REASONS
 * @param {string} input.by     - who did it (uid or email); required, an unattributed
 *                                revocation is not auditable
 * @param {string} [input.note] - free text, shown to nobody but kept for the record
 * @param {*} input.at          - timestamp value to store
 */
function revocationFields(input) {
  const { reason, by, note, at } = input || {};
  if (!ALL_REASONS.includes(reason)) {
    throw new Error('revocationFields: unknown reason "' + reason + '". One of: ' + ALL_REASONS.join(', '));
  }
  if (!by) {
    throw new Error('revocationFields: `by` is required — an unattributed revocation cannot be defended');
  }
  return {
    licenseRevoked: true,
    licenseRevokedReason: reason,
    licenseRevokedBy: by,
    licenseRevokedNote: note || null,
    licenseRevokedAt: at
  };
}

/**
 * The fields to write when putting a license back.
 *
 * Clears the flag and records the reinstatement, but deliberately leaves
 * `licenseRevokedReason`, `...By` and `...At` in place. The record should read "this
 * was revoked on that date and restored on this one", not "nothing ever happened".
 */
function reinstatementFields(input) {
  const { by, note, at } = input || {};
  if (!by) {
    throw new Error('reinstatementFields: `by` is required');
  }
  return {
    licenseRevoked: false,
    licenseReinstatedBy: by,
    licenseReinstatedNote: note || null,
    licenseReinstatedAt: at
  };
}

/** One line describing a purchase's license state, for an admin screen or a log. */
function describeRevocation(purchase) {
  if (!isRevoked(purchase)) return 'active';
  const reason = purchase.licenseRevokedReason;
  return 'REVOKED — ' + (REASON_LABELS[reason] || reason || 'no reason recorded');
}

module.exports = {
  REVOCATION_REASONS,
  ALL_REASONS,
  REASON_LABELS,
  isRevoked,
  revocationFields,
  reinstatementFields,
  describeRevocation
};
