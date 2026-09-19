// netlify/functions/create-checkout.js
// Create Stripe checkout session for song/album purchases

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

// Firebase Admin — needed to read AUTHORITATIVE prices/subscriptions from Firestore.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}
const db = admin.firestore();

// Require the canonical price rather than mirroring it. src/utils/pricing.js is
// CommonJS precisely so non-bundler consumers can read it, and "mirrors" is how a
// copy drifts: this constant said 2900 while pricing.js said 199 on main.
//
// Only a FALLBACK. resolveServerPrice prefers item.price from Firestore, so the
// authoritative number for a seeded record is whatever the catalogue holds.
const { SONG_PRICE: DEFAULT_SONG_PRICE, calculateAlbumPrice } = require('../../src/utils/pricing');
const { isCurrentAgreementVersion, DOWNLOAD_LICENSE, currentAgreementVersion } = require('../../src/utils/agreements');
const DISCOUNT_RATES = { none: 0, student: 0.20, creator: 0.30, pro: 0.40, agency: 0.50 };

/* A record is not licensable unless we can actually deliver the master.
 *
 * The station seeds this catalogue and, to make 134 otherwise-silent records
 * playable, points `audioUrl` at a 30-second preview in Cloud Storage. It marks
 * those `previewOnly: true`. Selling one takes real money for a clip.
 *
 * Albums need this derived rather than read: `albums` documents carry no
 * previewOnly field, and the album is the EXPENSIVE path ($195-$413 against $29
 * for a song), so a song-only check leaves the larger exposure open. One extra
 * query on the payment path is the right trade for that.
 *
 * This is a delivery check, not a pricing one, so it lives beside the price
 * resolution rather than inside it: the price is correct either way, the product
 * is what is missing.
 */
async function assertDeliverable(itemType, itemId, item) {
  const refuse = () => {
    const e = new Error(
      'This release is preview-only and cannot be licensed yet. ' +
      'Full-length masters are not available for purchase on this title.'
    );
    e.statusCode = 409;
    throw e;
  };

  if (itemType !== 'album') {
    if (item.previewOnly === true) refuse();
    return;
  }

  const tracks = await db.collection('songs').where('albumId', '==', itemId).get();
  // An album with no tracks is not a deliverable product either.
  if (tracks.empty) refuse();
  if (tracks.docs.some(d => d.data().previewOnly === true)) refuse();
}

// Resolve the authoritative price from Firestore — NEVER trust a client price.
// Reads the item's real price + the user's active subscription tier and applies
// the same discount math as src/data/discountTiers.js. Returns cents to charge.
async function resolveServerPrice(itemType, itemId, userId) {
  const coll = itemType === 'album' ? 'albums' : 'songs';
  const snap = await db.collection(coll).doc(itemId).get();
  if (!snap.exists) {
    // 400 (not 404): Netlify's redirect engine treats a function 404 as "unhandled"
    // and falls through to the SPA catch-all, so 404 never reaches the client.
    const e = new Error(`${itemType} not found`); e.statusCode = 400; throw e;
  }
  const item = snap.data();

  // Artists can't buy their own content.
  const artistUserId = item.artistId || item.uploadedBy;
  if (artistUserId && userId && userId === artistUserId) {
    const e = new Error('You cannot purchase your own music'); e.statusCode = 403; throw e;
  }

  // Refuse before a Stripe session exists — a charge for an undeliverable
  // product is worse than a failed checkout.
  await assertDeliverable(itemType, itemId, item);

  // Fall back to the price this item SHOULD cost, not to the song price.
  //
  // This previously fell back to DEFAULT_SONG_PRICE for albums too, so a 12-track
  // album with no stored price would have sold for the price of one track. Latent
  // today only because every album happens to carry a price -- and that is exactly
  // the field we are considering asking the station to stop writing.
  //
  // Both branches derive from src/utils/pricing.js, so the fallback tracks the
  // canonical rule instead of freezing whatever it was when this was written.
  const fallbackPrice = itemType === 'album'
    ? calculateAlbumPrice(Number(item.trackCount) || 0)
    : DEFAULT_SONG_PRICE;

  const basePrice = Number.isFinite(item.price) ? item.price : fallbackPrice;

  // Active subscriber discount (users/{userId}.subscription).
  let tier = 'none';
  if (userId) {
    try {
      const userSnap = await db.collection('users').doc(userId).get();
      const sub = userSnap.exists ? userSnap.data().subscription : null;
      const notExpired = !sub?.currentPeriodEnd || sub.currentPeriodEnd.toDate() > new Date();
      if (sub && sub.status === 'active' && notExpired && sub.tier) {
        tier = String(sub.tier).toLowerCase();
      }
    } catch (_) { /* no user/sub -> no discount */ }
  }
  const rate = DISCOUNT_RATES[tier] || 0;
  const discountedPrice = basePrice - Math.round(basePrice * rate);

  return { basePrice, discountedPrice, tier, itemName: item.title, artistName: item.artistName || item.artist };
}

exports.handler = async (event, context) => {
  console.log('🔔 create-checkout function invoked');
  console.log('Environment check:', {
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7)
  });

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('❌ Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('📦 Parsing request body...');
    const {
        userId, // body value: NOT trusted. effectiveUserId below is the verified uid.
      itemId,
      itemType, // 'song', 'album', 'submission_credits', or 'studio_sample'
      itemName,
      artistName,
      price, // in cents (discounted price if subscriber)
      originalPrice, // Original price before subscriber discount
      priceId, // Stripe Price ID for fixed products
      userEmail,
      email,
      credits,
      recurring,
      metadata,
      sampleId,
      sampleTitle,
      licenseType,
      acceptedAgreement // licence version the buyer ticked; verified below, never trusted
    } = JSON.parse(event.body);

    console.log('✅ Request data:', { userId, itemId, itemType, price, priceId, userEmail });

    // A purchase REQUIRES a verified identity. No token, or a token that does not
    // verify, is refused -- neither falls back to the body.
    //
    // This previously verified the token only when one was present and otherwise
    // trusted `userId` from the request body. Worse, a token that FAILED
    // verification was caught, logged, and then fell through to that same
    // unverified body value -- so a forged or expired token was treated exactly
    // like presenting none at all.
    //
    // That unverified id is not cosmetic. It selects whose subscription tier is
    // read for the discount (up to 50% off in resolveServerPrice), and it is
    // written into the Stripe session metadata that stripe-webhook.js trusts when
    // it creates the purchase record and grants the entitlement.
    //
    // The client has always sent the token -- checkoutHeaders() in
    // stripeService.js attaches it on every checkout call -- so requiring it
    // breaks no legitimate path. It closes one that was never meant to be open.
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Checkout refused: no Authorization header');
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Sign in to complete a purchase.' })
      };
    }

    let effectiveUserId;
    try {
      const decoded = await admin.auth().verifyIdToken(authHeader.slice(7));
      effectiveUserId = decoded.uid;
    } catch (e) {
      console.warn('Checkout refused: ID token did not verify:', e.message);
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Your session has expired. Sign in again.' })
      };
    }

    // A download sale REQUIRES a recorded acceptance of the licence in force.
    //
    // The client sends which version it showed; this refuses anything that is not
    // the CURRENT one. Accepting a stale-but-known version would record assent to
    // text the buyer was never shown -- if the terms changed while their tab sat
    // open, the honest outcome is "reload and read the new terms", not binding them
    // to whichever version happens to be convenient.
    //
    // Scoped to song and album on purpose. Subscriptions, submission credits and
    // studio samples are governed by agreements that have not been written yet
    // (see CONTRIBUTOR_UPLOAD and SYNC_LICENSE in src/utils/agreements.js), and
    // making them accept a DOWNLOAD licence would record the wrong contract --
    // worse than recording none, because it looks like diligence.
    const requiresLicenceAcceptance = itemType === 'song' || itemType === 'album';
    if (requiresLicenceAcceptance) {
      if (!isCurrentAgreementVersion(acceptedAgreement)) {
        console.warn('Checkout refused: licence acceptance missing or stale:', acceptedAgreement);
        return {
          statusCode: 409,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Please review and accept the current licence terms to continue.',
            currentAgreement: currentAgreementVersion(DOWNLOAD_LICENSE)
          })
        };
      }
    }

    // Stamped SERVER-SIDE, from the request that carried the acceptance -- which is
    // the click. A client-supplied timestamp is a value the buyer controls, and the
    // one thing this record has to survive is the buyer later disputing it.
    const acceptedAt = new Date().toISOString();

    // Validate required fields - allow priceId OR (userId + itemId + itemType)
    if (priceId) {
      // Using Stripe Price ID (for studio samples, subscriptions, etc.)
      console.log('Using Stripe Price ID:', priceId);
    // userId is no longer validated from the body: the request is refused above
    // unless a token verified, so effectiveUserId always exists by this point.
    } else if (!itemId || !itemType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Determine pricing and mode based on item type
    let checkoutConfig;

    if (priceId) {
      // Using fixed Stripe Price ID (for studio samples, products, etc.)
      checkoutConfig = {
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.URL || 'http://localhost:8888'}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.URL || 'http://localhost:8888'}/purchase/cancelled`,
        customer_email: userEmail || email,
        metadata: {
          // No guest fallback: an unauthenticated caller cannot reach this line any
          // more, so a guest attribution would only ever mask a real verified uid.
          userId: effectiveUserId,
          itemId: sampleId || itemId,
          itemType: 'studio_sample',
          sampleTitle: sampleTitle || itemName,
          licenseType: licenseType || 'personal',
          ...metadata
        },
        automatic_tax: { enabled: false }
      };
    } else if (itemType === 'artist_membership') {
      // NOTE: every branch below writes effectiveUserId, the VERIFIED uid, into
      // Stripe metadata. stripe-webhook.js trusts that metadata to decide whose
      // account is credited, so a body-supplied id here would let a caller choose
      // who receives what they bought.
      // Annual artist membership - $25/year for unlimited uploads
      checkoutConfig = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'BeatFlow Artist Membership',
                description: 'Unlimited track uploads for 1 year',
                metadata: {
                  itemType,
                  userId: effectiveUserId
                }
              },
              unit_amount: 2500, // $25/year — fixed server-side (ignore client price)
              recurring: { interval: 'year' }
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.URL || 'http://localhost:8888'}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.URL || 'http://localhost:8888'}/purchase/cancelled`,
        customer_email: email || userEmail,
        metadata: {
          userId: effectiveUserId,
          itemType,
          itemId,
          membershipType: 'annual'
        }
      };
    } else if (itemType === 'playlist_submission') {
      // Curator playlist placement payment (escrow)
      checkoutConfig = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: itemName,
                description: artistName, // Track title
                metadata: {
                  itemType,
                  itemId,
                  userId: effectiveUserId,
                  paymentType: 'escrow'
                }
              },
              unit_amount: price, // Price in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        payment_intent_data: {
          capture_method: 'manual', // Hold funds in escrow
          metadata: {
            ...metadata,
            paymentType: 'escrow',
            itemType
          }
        },
        success_url: `${process.env.URL || 'http://localhost:8888'}/artist-profile?submission=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.URL || 'http://localhost:8888'}/artist-profile?submission=cancelled`,
        customer_email: userEmail,
        metadata: {
          userId: effectiveUserId,
          itemId,
          itemType,
          ...metadata
        },
        automatic_tax: { enabled: false }
      };
    } else {
      // Regular song/album purchase — price is computed SERVER-SIDE from Firestore.
      // The client-supplied `price` is intentionally ignored (never trust it).
      const resolved = await resolveServerPrice(itemType, itemId, effectiveUserId);
      const hasDiscount = resolved.discountedPrice < resolved.basePrice;
      const name = resolved.itemName || itemName || (itemType === 'song' ? 'Song' : 'Album');
      const artist = resolved.artistName || artistName || 'Unknown Artist';
      const description = hasDiscount
        ? `${itemType === 'song' ? 'Song' : 'Album'} by ${artist} (Subscriber discount applied)`
        : `${itemType === 'song' ? 'Song' : 'Album'} by ${artist}`;

      checkoutConfig = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name,
                description,
                metadata: {
                  itemType,
                  itemId,
                  userId: effectiveUserId,
                  originalPrice: resolved.basePrice.toString(),
                  discountApplied: hasDiscount.toString()
                }
              },
              unit_amount: resolved.discountedPrice, // server-authoritative price (cents)
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.URL || 'http://localhost:8888'}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.URL || 'http://localhost:8888'}/purchase/cancelled`,
        customer_email: userEmail,
        metadata: {
          ...metadata,               // client extras first...
          userId: effectiveUserId,   // ...authoritative fields win (webhook trusts these)
          itemId,
          itemType,
          // The contract half of the record. stripe-webhook copies these onto the
          // purchase document, so a purchase answers "which terms, accepted when"
          // without a join to anything that could be edited afterwards.
          acceptedAgreement,
          acceptedAt,
          originalPrice: resolved.basePrice.toString(),
          discountedPrice: resolved.discountedPrice.toString(),
          subscriberTier: resolved.tier
        },
        automatic_tax: { enabled: false }
      };
    }

    // Create the checkout session
    console.log('💳 Creating Stripe checkout session...');
    const session = await stripe.checkout.sessions.create(checkoutConfig);
    console.log('✅ Session created successfully:', session.id);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url
      })
    };
  } catch (error) {
    console.error('💥 Error creating checkout session:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode
    });
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: error.message || 'Failed to create checkout session',
        type: error.type,
        code: error.code
      })
    };
  }
};
