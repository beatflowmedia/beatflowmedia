// netlify/functions/lib/entitlement.js
//
// ONE reader for "may this user have the master of this record".
//
// It exists because there were already two answers and one of them is broken:
// functions/index.js checkSongPurchase() queries
//   purchases.where('songId','==',songId)
// and NOTHING in the codebase writes `songId`. Every purchase writer in
// stripe-webhook.js writes `itemId`. That check can only ever return false, which
// is invisible today because getSignedAudioUrl grants streaming to any
// authenticated user regardless and only logs the result. Reused for a paywall it
// would deny every legitimate buyer -- or, inverted by someone "fixing" it in the
// wrong direction, admit everyone.
//
// The canonical purchase record is written by netlify/functions/stripe-webhook.js:
//   { userId, itemId, itemType: 'song' | 'album', status: 'completed', licenseId }
//
// Known duplication, deliberately not collapsed here: stripe-webhook.js also
// writes a `licenses` collection keyed by `trackId` for the perpetual-licence
// model. Two stores for one concept is a Single Source problem, but collapsing
// them changes purchase fulfilment, which is not this module's job. This reads
// `purchases`, because that is what every path writes.

/**
 * @returns {Promise<{entitled: boolean, via: string|null, licenseId: string|null}>}
 */
async function resolveMasterEntitlement(db, userId, songId, songData) {
  if (!userId || !songId) return { entitled: false, via: null, licenseId: null };

  // 1. Bought this record outright.
  const direct = await db
    .collection('purchases')
    .where('userId', '==', userId)
    .where('itemId', '==', songId)
    .limit(10)
    .get();

  const completed = (snap) =>
    snap.docs.map((d) => d.data()).find((p) => p.status === 'completed');

  const directHit = completed(direct);
  if (directHit) {
    return { entitled: true, via: 'purchase', licenseId: directHit.licenseId || null };
  }

  // 2. Bought the album it belongs to. An album purchase is a purchase of its
  //    contents; a buyer who paid album price should not be refused a track.
  const albumId = songData && songData.albumId;
  if (albumId) {
    const viaAlbum = await db
      .collection('purchases')
      .where('userId', '==', userId)
      .where('itemId', '==', albumId)
      .limit(10)
      .get();
    const albumHit = completed(viaAlbum);
    if (albumHit) {
      return { entitled: true, via: 'album', licenseId: albumHit.licenseId || null };
    }
  }

  // 3. Active subscription. Every tier in src/data/pricingPlans.js advertises
  //    "Unlimited downloads while active", so an active subscriber is entitled.
  //    Expiry is checked the same way create-checkout.js checks it.
  try {
    const userSnap = await db.collection('users').doc(userId).get();
    const sub = userSnap.exists ? userSnap.data().subscription : null;
    const notExpired =
      !sub || !sub.currentPeriodEnd || sub.currentPeriodEnd.toDate() > new Date();
    if (sub && sub.status === 'active' && notExpired && sub.tier) {
      return { entitled: true, via: 'subscription:' + String(sub.tier).toLowerCase(), licenseId: null };
    }
  } catch (err) {
    // No user doc or an unreadable subscription is "not entitled", never "entitled".
    // A read failure must not open the gate.
  }

  return { entitled: false, via: null, licenseId: null };
}

module.exports = { resolveMasterEntitlement };
