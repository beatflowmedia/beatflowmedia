// netlify/functions/lib/dispute-evidence.js
//
// Assemble the evidence for a chargeback, at the moment the chargeback arrives.
//
// WHY THIS IS WORTH BUILDING AT ALL
// A dispute on a $1.99 track costs $1.99 plus a ~$15 dispute fee -- the fee is roughly
// 30x the platform's share of the sale, so one chargeback erases the platform margin on
// about thirty tracks. Winning a dispute is therefore worth far more than the sale, and
// the cost of losing one by default (submitting nothing) is the same as losing one on
// the merits. Most digital-goods disputes are lost by default because the merchant has
// no delivery evidence. This platform does have it, which is unusual.
//
// WHAT CARD NETWORKS ACTUALLY WANT for "product not received" / "unauthorized" on a
// digital good is proof that THIS person took THIS file at THIS time, plus proof they
// agreed to the terms. BFMG records all of it:
//   purchases          -> who, what, when, how much, which license
//   licenseAcceptance  -> the clickwrap version they accepted at checkout
//   downloads          -> that the master was actually served, per file, timestamped
//
// SHAPED TO STRIPE'S API ON PURPOSE
// The keys below are Stripe's own `dispute.evidence` parameter names, so the bundle can
// be submitted with no translation step. A translation layer here would be a second
// place for the field names to drift, and the names are Stripe's to define, not ours.
//
// SNAPSHOT, NOT A VIEW
// This is written to a `disputes` document when the dispute opens rather than computed
// when someone opens an admin screen. Evidence assembled from live collections is
// evidence that changes after the fact, which is exactly what a disputed record must
// not do. The snapshot is the artefact; the collections carry on.

const MAX_ACCESS_LOG_ROWS = 50;

/** Firestore Timestamp | Date | null -> ISO string | null, without throwing on any of them. */
function toIso(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') {
    try { return value.toDate().toISOString(); } catch (err) { return null; }
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return null;
}

/**
 * Build the evidence bundle for a disputed payment.
 *
 * Returns BOTH the Stripe-shaped `evidence` object and a `diagnostics` block saying
 * what was found and what was missing. The diagnostics matter: a bundle with an empty
 * access log looks the same as a bundle nobody built, and the difference is whether the
 * dispute is winnable. Better to state "no download was ever recorded" plainly than to
 * submit a confident-looking bundle that proves nothing.
 *
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {object} input
 * @param {string} input.paymentIntentId
 * @returns {Promise<{evidence: object, diagnostics: object}>}
 */
async function buildDisputeEvidence(db, input) {
  const { paymentIntentId } = input || {};
  if (!paymentIntentId) throw new Error('buildDisputeEvidence: paymentIntentId is required');

  const diagnostics = {
    paymentIntentId,
    purchasesFound: 0,
    downloadsFound: 0,
    hasClickwrap: false,
    hasDeliveryProof: false,
    missing: []
  };

  const purchaseSnap = await db
    .collection('purchases')
    .where('stripePaymentIntent', '==', paymentIntentId)
    .limit(25)
    .get();

  diagnostics.purchasesFound = purchaseSnap.size;
  if (purchaseSnap.empty) {
    diagnostics.missing.push('no purchase row — cannot evidence a sale that was never recorded');
    return { evidence: {}, diagnostics };
  }

  const purchases = purchaseSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const primary = purchases[0];

  // --- what was sold -----------------------------------------------------------
  const productDescription = purchases
    .map((p) => {
      const kind = p.itemType === 'album' ? 'album' : 'single';
      return [
        (p.itemName || 'Unknown recording') + ' (' + kind + ')',
        p.artistName ? 'by ' + p.artistName : null,
        p.licenseId ? 'license ' + p.licenseId : null
      ].filter(Boolean).join(', ');
    })
    .join('; ');

  // --- proof it was delivered --------------------------------------------------
  // Queried by userId rather than by license, so a buyer who took the file through an
  // album entitlement or a subscription still shows up. Over-inclusive on purpose:
  // every download this account made is relevant to "they never received anything".
  let downloads = [];
  if (primary.userId) {
    const dlSnap = await db
      .collection('downloads')
      .where('userId', '==', primary.userId)
      .limit(MAX_ACCESS_LOG_ROWS)
      .get();
    downloads = dlSnap.docs.map((d) => d.data());
  }
  diagnostics.downloadsFound = downloads.length;

  const accessLines = downloads
    .map((d) => {
      const when = toIso(d.downloadedAt) || toIso(d.createdAt) || 'time not recorded';
      return [
        when,
        'file: ' + (d.itemName || d.objectKey || 'unknown'),
        d.isrc ? 'ISRC ' + d.isrc : null,
        d.ipAddress ? 'IP ' + d.ipAddress : null,
        d.userAgent ? 'agent ' + String(d.userAgent).slice(0, 80) : null,
        d.grantedVia ? 'via ' + d.grantedVia : null
      ].filter(Boolean).join(' | ');
    })
    .sort();

  diagnostics.hasDeliveryProof = accessLines.length > 0;
  if (!diagnostics.hasDeliveryProof) {
    diagnostics.missing.push('no download recorded — delivery cannot be evidenced from our logs');
  }

  // --- proof they accepted the license -----------------------------------------
  // Written at checkout by licenseAcceptanceFields(); the version string is the whole
  // point, because it identifies WHICH text they agreed to on that date.
  const acceptedVersion =
    primary.acceptedAgreement ||
    primary.licenseAcceptedVersion ||
    (primary.licenseAcceptance && primary.licenseAcceptance.version) ||
    null;
  diagnostics.hasClickwrap = Boolean(acceptedVersion);
  if (!diagnostics.hasClickwrap) {
    diagnostics.missing.push('no clickwrap acceptance recorded on the purchase');
  }

  const purchasedAtIso = toIso(primary.purchasedAt);
  if (!purchasedAtIso) diagnostics.missing.push('no purchase timestamp');

  // --- the narrative -----------------------------------------------------------
  // `uncategorized_text` is read by a human reviewer, so it states the case in plain
  // sentences rather than leaving them to infer it from the structured fields.
  const narrative = [
    'This charge is for a digital music license delivered immediately on payment.',
    acceptedVersion
      ? 'The customer accepted the download license terms (version ' + acceptedVersion + ') at checkout before payment was taken; acceptance is recorded against the purchase.'
      : 'No clickwrap acceptance record is available for this purchase.',
    accessLines.length
      ? 'Our server logs record ' + accessLines.length + ' download' + (accessLines.length === 1 ? '' : 's') + ' of the purchased master by this account, listed in the access activity log.'
      : 'Our logs show no download of the purchased file by this account.',
    'Published terms state that a purchase delivers a digital file immediately, that the license cannot be returned, and that all sales are final other than where we fail to deliver.',
    'The license granted by this purchase has been revoked as a result of this dispute; the customer no longer holds any right to use the recording.'
  ].join(' ');

  const evidence = {
    product_description: productDescription.slice(0, 20000),
    customer_email_address: primary.customerEmail || null,
    customer_name: primary.customerName || null,
    customer_purchase_ip: primary.purchaseIp || (downloads[0] && downloads[0].ipAddress) || null,
    service_date: purchasedAtIso,
    access_activity_log: accessLines.join('\n').slice(0, 20000),
    uncategorized_text: narrative.slice(0, 20000)
  };

  // Stripe rejects null for these string fields; omit what we do not have rather than
  // sending empties, which read as "we looked and there is nothing".
  Object.keys(evidence).forEach((k) => {
    if (evidence[k] === null || evidence[k] === '') delete evidence[k];
  });

  return { evidence, diagnostics };
}

/**
 * Persist the bundle against the dispute.
 *
 * Keyed by the Stripe dispute id so a redelivered `charge.dispute.created` overwrites
 * its own snapshot instead of accumulating duplicates. `set` with merge:false is
 * correct here -- a re-run should produce a fresh, complete snapshot, not a blend of
 * two.
 */
async function recordDisputeEvidence(db, input) {
  const { disputeId, paymentIntentId, dispute, evidence, diagnostics, at } = input || {};
  if (!disputeId) throw new Error('recordDisputeEvidence: disputeId is required');

  await db.collection('disputes').doc(disputeId).set({
    disputeId,
    paymentIntentId: paymentIntentId || null,
    chargeId: (dispute && dispute.charge) || null,
    amount: (dispute && dispute.amount) || null,
    currency: (dispute && dispute.currency) || null,
    reason: (dispute && dispute.reason) || null,
    status: (dispute && dispute.status) || null,
    evidenceDueBy: dispute && dispute.evidence_details && dispute.evidence_details.due_by
      ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
      : null,
    evidence: evidence || {},
    diagnostics: diagnostics || {},
    submitted: false,
    openedAt: at
  });

  return disputeId;
}

module.exports = { buildDisputeEvidence, recordDisputeEvidence, toIso };
