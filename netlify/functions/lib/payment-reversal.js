// netlify/functions/lib/payment-reversal.js
//
// When the money goes back, the license goes with it.
//
// THE ATTACK THIS CLOSES
// Pay $1.99 -> download the master -> ask the bank to reverse the charge -> keep the
// file. The purchase stays `status: 'completed'` forever, the entitlement check sees a
// completed purchase, and /downloads keeps serving the master to someone who paid
// nothing. Repeat per track. This is "friendly fraud": a real customer using a real
// payment mechanism in bad faith, and it is the main fraud vector for digital goods
// precisely because delivery cannot be undone and payment can.
//
// WHAT THIS DOES AND DOES NOT DO
// It stops FUTURE access and ends the right to use the recording. It cannot un-download
// a file -- see the same warning in src/utils/licenseRevocation.js. The bytes are gone
// the moment they are served. What this buys is that continued use becomes infringement
// rather than licensed use, the buyer cannot come back for the file again, and the
// revocation is on the record with a reason and a timestamp if it ever reaches a lawyer.
//
// WHY THE MACHINERY WAS ALREADY HERE
// src/utils/licenseRevocation.js already defined CHARGEBACK and REFUND as reasons, and
// lib/entitlement.js already refuses a revoked purchase -- deliberately BEFORE the
// subscription fallback, so a subscriber cannot be handed back what was just withdrawn.
// Only the WRITER was missing: nothing but the manual scripts/revoke-license.js CLI ever
// set the flag. So this is not new policy, it is the automatic trigger for policy that
// was already written and already enforced.
//
// THE JOIN
// A charge/dispute event carries a payment_intent; the purchase row stores it as
// `stripePaymentIntent`. That is the only link between the two, which is worth stating
// because Firestore EXCLUDES a document from any query naming a field it lacks -- a
// purchase written without that field is unreachable here and would silently survive a
// chargeback. assertReversalJoinable() below exists to make that loud instead of silent.

const {
  REVOCATION_REASONS,
  revocationFields,
  isRevoked
} = require('../../../src/utils/licenseRevocation');

/** Who the audit trail credits for an automatic revocation. `by` is required by
 *  revocationFields() and "the webhook did it" is a real, defensible answer -- far
 *  better than attributing a machine action to a person who was asleep. */
const SYSTEM_ACTOR = 'system:stripe-webhook';

/**
 * Revoke every license bought with a payment that has been reversed.
 *
 * Idempotent, because Stripe redelivers. A purchase already revoked for the same
 * reason is left completely alone rather than re-stamped -- re-stamping would move
 * `licenseRevokedAt` forward on every redelivery and destroy the one timestamp a
 * dispute actually turns on.
 *
 * An ESCALATION is allowed and is not a no-op: a refund that later becomes a
 * chargeback should end up recorded as a chargeback, because that is the more serious
 * fact and the one that matters to a pattern. The reverse is not allowed -- a
 * chargeback is never downgraded to a refund.
 *
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {object} input
 * @param {string} input.paymentIntentId - from charge.payment_intent / dispute.payment_intent
 * @param {string} input.reason          - REVOCATION_REASONS.REFUND or .CHARGEBACK
 * @param {string} [input.note]          - free text for the record
 * @param {*} input.at                   - server timestamp value
 * @returns {Promise<{revoked: number, skipped: number, licensesEnded: number, purchases: Array}>}
 */
async function revokeForPaymentReversal(db, input) {
  const { paymentIntentId, reason, note, at } = input || {};

  if (!paymentIntentId) {
    throw new Error('revokeForPaymentReversal: paymentIntentId is required — without it there is nothing to join on');
  }
  if (reason !== REVOCATION_REASONS.REFUND && reason !== REVOCATION_REASONS.CHARGEBACK) {
    throw new Error(
      'revokeForPaymentReversal: reason must be ' + REVOCATION_REASONS.REFUND +
      ' or ' + REVOCATION_REASONS.CHARGEBACK + ', got "' + reason + '"'
    );
  }

  const matches = await db
    .collection('purchases')
    .where('stripePaymentIntent', '==', paymentIntentId)
    .limit(25)
    .get();

  const result = { revoked: 0, skipped: 0, licensesEnded: 0, purchases: [] };

  if (matches.empty) {
    // Not an error. A refund on a subscription invoice, a sponsorship, or a payment
    // that never produced a purchase row all land here legitimately.
    console.log('[payment-reversal] no purchase matches ' + paymentIntentId + ' — nothing to revoke');
    return result;
  }

  for (const doc of matches.docs) {
    const purchase = doc.data();
    const already = isRevoked(purchase);
    const alreadyChargeback = purchase.licenseRevokedReason === REVOCATION_REASONS.CHARGEBACK;

    // Same-or-lesser reason on an already-revoked purchase: leave the record untouched.
    if (already && (purchase.licenseRevokedReason === reason || alreadyChargeback)) {
      result.skipped++;
      result.purchases.push({ id: doc.id, action: 'already-revoked', reason: purchase.licenseRevokedReason });
      continue;
    }

    const fields = revocationFields({
      reason,
      by: SYSTEM_ACTOR,
      note: note || null,
      at
    });

    await doc.ref.update(fields);
    result.revoked++;
    result.purchases.push({
      id: doc.id,
      action: already ? 'escalated-to-' + reason : 'revoked',
      licenseId: purchase.licenseId || null,
      itemName: purchase.itemName || null,
      userId: purchase.userId || null
    });

    // --- the OTHER store -------------------------------------------------------
    // `purchases` is what the entitlement check reads, so the write above is what
    // actually closes the download. The `licenses` collection is the buyer-facing
    // record of the grant, and leaving it `active` next to a revoked purchase would
    // show the buyer a live license for a file they can no longer fetch. Two stores
    // for one concept is the Single Source problem already flagged in
    // lib/entitlement.js; this reconciles them rather than pretending it is solved.
    if (purchase.licenseId) {
      const licenses = await db
        .collection('licenses')
        .where('purchaseLicenseId', '==', purchase.licenseId)
        .limit(50)
        .get();

      for (const lic of licenses.docs) {
        if (lic.data().status === 'revoked') continue;
        await lic.ref.update({
          status: 'revoked',
          revokedReason: reason,
          revokedBy: SYSTEM_ACTOR,
          revokedAt: at,
          validWhileSubscribed: false
        });
        result.licensesEnded++;
      }
    }
  }

  console.log(
    '[payment-reversal] ' + reason + ' on ' + paymentIntentId + ': ' +
    result.revoked + ' revoked, ' + result.skipped + ' already revoked, ' +
    result.licensesEnded + ' license rows ended'
  );
  return result;
}

/**
 * Should a `charge.refunded` event revoke at all?
 *
 * Three cases this deliberately refuses to treat as "revoke everything":
 *
 * 1. PARTIAL REFUND. `charge.refunded` fires for a partial refund too. Giving back
 *    $2 of a $12 album is a price adjustment or a goodwill gesture, not the end of
 *    the license, and ending it would punish a customer being made whole.
 *
 * 2. AN EXPLICIT KEEP. src/utils/licenseRevocation.js documents four independent
 *    states, one of which is "refunded + licensed — a refund given while leaving the
 *    license intact". /terms promises a full refund where WE failed to deliver, and
 *    in some of those cases the right answer is to refund and let them keep it. Set
 *    `keep_license: 'true'` in the refund's metadata to take that route.
 *
 * 3. A REFUND ISSUED TO SETTLE A DISPUTE. Already handled as a chargeback; the
 *    reason must not be downgraded, which revokeForPaymentReversal() enforces.
 */
function shouldRevokeOnRefund(charge) {
  if (!charge) return { revoke: false, why: 'no charge object' };

  const fullyRefunded =
    charge.refunded === true &&
    typeof charge.amount_refunded === 'number' &&
    typeof charge.amount === 'number' &&
    charge.amount_refunded >= charge.amount;

  if (!fullyRefunded) {
    return {
      revoke: false,
      why: 'partial refund (' + charge.amount_refunded + ' of ' + charge.amount + ') — license stands'
    };
  }

  const refunds = (charge.refunds && charge.refunds.data) || [];
  const keep = refunds.some((r) => r && r.metadata && String(r.metadata.keep_license) === 'true');
  if (keep) {
    return { revoke: false, why: 'refund metadata keep_license=true — deliberate refund-with-license-intact' };
  }

  return { revoke: true, why: 'full refund' };
}

/**
 * Is a purchase row reachable by the reversal join at all?
 *
 * Firestore excludes a document from any query naming a field it lacks, so a purchase
 * written without `stripePaymentIntent` cannot be found by a chargeback and would keep
 * its license forever with nobody noticing. This is the check that makes that
 * condition visible; scripts/verify-reversal.js runs it across the collection.
 */
function assertReversalJoinable(purchase) {
  if (!purchase) return { joinable: false, why: 'no purchase' };
  if (!purchase.stripePaymentIntent) {
    return { joinable: false, why: 'no stripePaymentIntent — a refund or chargeback can never find this row' };
  }
  return { joinable: true, why: null };
}

module.exports = {
  revokeForPaymentReversal,
  shouldRevokeOnRefund,
  assertReversalJoinable,
  SYSTEM_ACTOR
};
