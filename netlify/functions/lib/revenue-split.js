// netlify/functions/lib/revenue-split.js
//
// ONE place that credits an artist for a sale.
//
// This was netlify/functions/process-revenue-split.js: a public, unauthenticated POST
// endpoint that stripe-webhook.js called over HTTP against its own site. Two things
// were wrong with that, and the second is the expensive one.
//
//   1. It was a network hop and a second cold start to run code that already had the
//      data in memory.
//   2. It took `amount` from the request body and credited the artist 70% of it. A
//      caller could POST {itemId: <any real song>, itemType: 'song', amount: 100000}
//      and add $70,000 to that artist's availableBalance -- which request-payout then
//      turns into a real Stripe transfer. The money path started at an open endpoint.
//
// Guarding it with a shared secret would have meant a new credential to set, rotate
// and get wrong. Calling it in-process means the only caller is the webhook, which
// gets `amount` from the verified Stripe session, so there is no caller to trust.
//
// Follows the lib/entitlement.js convention: takes `db`, never initialises
// firebase-admin, and is called by functions that already did.

const admin = require('firebase-admin');

// Revenue split percentages (can be customized per artist)
const DEFAULT_ARTIST_SHARE = 0.70; // 70% to artist
const PLATFORM_SHARE = 0.30;       // 30% to platform

/**
 * Resolve which artist owns the item that was sold.
 *
 * Read-only reference data, so it sits outside the allocation transaction.
 */
async function resolveArtistForItem(db, itemId, itemType) {
  const collection = itemType === 'album' ? 'albums' : 'songs';
  const itemDoc = await db.collection(collection).doc(itemId).get();
  if (!itemDoc.exists) {
    throw new Error(`${itemType} not found: ${itemId}`);
  }
  const data = itemDoc.data();
  return {
    artistId: data.artistId || data.uploadedBy,
    customSplit: data.revenueSplit
  };
}

/**
 * Credit an artist for one completed purchase.
 *
 * IDEMPOTENT. The allocation document id IS the purchase id, and the balance is
 * incremented in the same transaction that creates it. The previous version used
 * `.add()` plus a bare `FieldValue.increment()`, so replaying one purchase -- which a
 * Stripe webhook retry does by design -- credited the artist again every time. A
 * balance that grows on retry is a data-integrity bug, not a rendering one, which is
 * why it is enforced here with a transaction rather than checked in a browser test.
 *
 * @param {object} db Firestore instance from an initialised firebase-admin
 * @param {object} purchase
 * @param {string} purchase.purchaseId Canonical purchase doc id -- the idempotency key
 * @param {string} purchase.userId Buyer, recorded as metadata only
 * @param {string} purchase.itemId
 * @param {'song'|'album'} purchase.itemType
 * @param {number} purchase.amount Gross sale in DOLLARS, from the Stripe session
 * @returns {Promise<{status: 'allocated'|'already_allocated'|'held',
 *                    artistId?: string, artistAmount?: number, platformAmount?: number}>}
 */
async function allocateRevenueForPurchase(db, { purchaseId, userId, itemId, itemType, amount }) {
  if (!purchaseId) throw new Error('purchaseId is required as the idempotency key');
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
    throw new Error(`amount must be a non-negative number, got ${amount}`);
  }

  const { artistId, customSplit } = await resolveArtistForItem(db, itemId, itemType);
  if (!artistId) {
    throw new Error(`Artist ID not found for ${itemType} ${itemId}`);
  }

  const artistDoc = await db.collection('users').doc(artistId).get();
  if (!artistDoc.exists) {
    throw new Error(`Artist not found: ${artistId}`);
  }
  const artistStripeAccountId = artistDoc.data().stripeConnectAccountId || null;

  // Money is held as a balance either way; a missing Connect account only changes
  // where the record goes. Kept keyed on purchaseId so a retry cannot double-record.
  if (!artistStripeAccountId) {
    console.warn(`Artist ${artistId} has no Stripe Connect account. Holding funds.`);
    await db.collection('pendingPayouts').doc(purchaseId).set({
      artistId,
      purchaseId,
      itemId,
      itemType,
      amount,
      reason: 'no_stripe_account',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return { status: 'held', artistId };
  }

  const artistShare = customSplit?.artistPercent || DEFAULT_ARTIST_SHARE;

  // Split in integer cents so the two shares always sum back to the sale exactly.
  // Splitting in dollars and rounding each side independently loses or invents a cent.
  const amountInCents = Math.round(amount * 100);
  const artistCents = Math.round(amountInCents * artistShare);
  const platformCents = amountInCents - artistCents;

  const allocationRef = db.collection('revenueAllocations').doc(purchaseId);
  const balanceRef = db.collection('artistBalances').doc(artistId);

  const result = await db.runTransaction(async (tx) => {
    // Firestore requires every read before any write in a transaction.
    const existing = await tx.get(allocationRef);
    if (existing.exists) {
      return { status: 'already_allocated', artistId };
    }
    const balanceSnap = await tx.get(balanceRef);

    tx.set(allocationRef, {
      purchaseId,
      artistId,
      artistStripeAccountId,
      itemId,
      itemType,
      totalAmount: amount,
      artistAmount: artistCents / 100,
      platformAmount: platformCents / 100,
      artistShare: artistShare * 100, // Store as percentage
      status: 'pending',              // Pending until payout requested
      allocatedAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: { userId }
    });

    if (balanceSnap.exists) {
      tx.update(balanceRef, {
        availableBalance: admin.firestore.FieldValue.increment(artistCents / 100),
        totalEarnings: admin.firestore.FieldValue.increment(artistCents / 100),
        pendingAllocations: admin.firestore.FieldValue.increment(1),
        lastEarningAt: admin.firestore.FieldValue.serverTimestamp(),
        lastEarningAmount: artistCents / 100
      });
    } else {
      tx.set(balanceRef, {
        artistId,
        availableBalance: artistCents / 100,
        totalEarnings: artistCents / 100,
        totalPaidOut: 0,
        pendingAllocations: 1,
        completedPayouts: 0,
        lastEarningAt: admin.firestore.FieldValue.serverTimestamp(),
        lastEarningAmount: artistCents / 100,
        stripeConnectAccountId: artistStripeAccountId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return {
      status: 'allocated',
      artistId,
      artistAmount: artistCents / 100,
      platformAmount: platformCents / 100
    };
  });

  return result;
}

module.exports = {
  allocateRevenueForPurchase,
  DEFAULT_ARTIST_SHARE,
  PLATFORM_SHARE
};
