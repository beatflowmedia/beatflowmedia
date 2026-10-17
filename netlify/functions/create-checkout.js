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
const {
  SONG_PRICE: DEFAULT_SONG_PRICE,
  calculateAlbumPrice,
  calculateCommercialPrice,
  calculateCollectionPrice,
  commercialRateForPool
} = require('../../src/utils/pricing');
const { currentAgreementVersion } = require('../../src/utils/agreements');

// What is being sold, and which agreement governs it. Required rather than restated:
// the gate below has to demand the agreement for THIS product, and a copy of that
// mapping here is a second source of truth about what a buyer agreed to.
const {
  productForSale,
  agreementForProduct,
  licenseFields
} = require('../../src/utils/licenseTerms');
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

  if (itemType === 'collection') {
    // A collection is deliverable when its tracks are. Checked by query rather than
    // trusting the stored trackCount: that field is written by an importer, and selling
    // a 56-track licence over 3 deliverable tracks is the failure this exists to stop.
    const tracks = await db.collection('songs').where('collectionId', '==', itemId).get();
    const deliverable = tracks.docs.filter((d) => d.data().previewOnly !== true);
    if (!deliverable.length) refuse();
    return { deliverableCount: deliverable.length };
  }

  if (itemType !== 'album') {
    if (item.previewOnly === true) refuse();
    return { deliverableCount: 1 };
  }

  const tracks = await db.collection('songs').where('albumId', '==', itemId).get();
  // An album with no tracks is not a deliverable product either.
  if (tracks.empty) refuse();
  if (tracks.docs.some(d => d.data().previewOnly === true)) refuse();
  return { deliverableCount: tracks.size };
}

// Resolve the authoritative price from Firestore — NEVER trust a client price.
// Reads the item's real price + the user's active subscription tier and applies
// the same discount math as src/data/discountTiers.js. Returns cents to charge.
async function resolveServerPrice(itemType, itemId, userId, licenseType = 'personal') {
  const coll = itemType === 'album' ? 'albums'
    : itemType === 'collection' ? 'collections'
      : 'songs';
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
  const { deliverableCount } = await assertDeliverable(itemType, itemId, item);

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

  // A COMMERCIAL licence is a different product at a different price, so it is COMPUTED
  // and never read from the stored `price` field. That field is the consumer download
  // price -- the station writes it, every record carries 199 -- and honouring it for a
  // commercial licence would sell sync rights to a 56-track collection for $1.99.
  //
  // This is the one place where ignoring the stored price is correct. Everywhere else
  // the stored value wins, because create-checkout charging something the catalogue does
  // not show is how a storefront advertises one price and bills another.
  //
  // AND IT IS PRICED FROM THE COUNT WE WILL ACTUALLY DELIVER, not from the stored
  // `trackCount`. That field is a derived copy written by an importer, and it is already
  // wrong: `npm run verify:collections` reports game-show-walk-on holding trackCount 27
  // while 30 songs carry its id. Pricing off the stale copy would charge the 27-track
  // price and hand over 30 tracks -- and the same drift in the other direction would
  // charge for tracks that are not there, which is the version a buyer notices.
  //
  // assertDeliverable has already run the query, so this costs nothing extra. The page
  // still shows the trackCount figure, and the server's number wins; verify:collections
  // is the reconciler that closes the gap between them.
  let basePrice;
  if (licenseType === 'commercial') {
    const pool = item.assetPool || null;
    basePrice = itemType === 'collection' || itemType === 'album'
      ? calculateCollectionPrice(deliverableCount || Number(item.trackCount) || 1, pool)
      : calculateCommercialPrice(1, commercialRateForPool(pool));
  } else if (itemType === 'collection') {
    // There is no consumer price for a collection. It is a commercial product; a
    // personal licence covers a track or an album, not a production library.
    const e = new Error('A collection is licensed for commercial use, not as a personal download.');
    e.statusCode = 400;
    throw e;
  } else {
    basePrice = Number.isFinite(item.price) ? item.price : fallbackPrice;
  }

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
      acceptedAgreement // license version the buyer ticked; verified below, never trusted
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

    // A download sale REQUIRES a recorded acceptance of the license in force.
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
    // making them accept a DOWNLOAD license would record the wrong contract --
    // worse than recording none, because it looks like diligence.
    // DERIVED, not listed. The old version of this check hard-coded song|album and then
    // asked isCurrentAgreementVersion(acceptedAgreement) -- "is this SOME current
    // agreement". With one product that was the same question; with two it is a hole, and
    // the wrong half of it passes: a client could present `download-license@...` for a
    // $319 commercial collection and be waved through, producing a record of the buyer
    // agreeing NOT to sync the music they just bought a sync licence for.
    //
    // Now the server works out which product this is and demands THAT product's
    // agreement. A null product means "not a licensed sale" -- subscriptions, submission
    // credits, studio samples -- and those are untouched, for the reason below.
    const product = productForSale(itemType, licenseType);
    const requiredAgreement = product ? agreementForProduct(product) : null;

    if (product) {
      const expected = currentAgreementVersion(requiredAgreement);
      if (!expected) {
        // The agreement has no published text. Refusing the SALE is the only honest
        // outcome: charging for a grant no document describes is the position the
        // subscription tiers were in for months.
        console.error('Checkout refused: no published text for', requiredAgreement);
        const e = new Error('This license is not available for purchase yet.');
        e.statusCode = 503;
        throw e;
      }
      if (acceptedAgreement !== expected) {
        console.warn('Checkout refused: license acceptance missing, stale or for the ' +
          'wrong agreement. got:', acceptedAgreement, 'want:', expected);
        return {
          statusCode: 409,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Please review and accept the current license terms to continue.',
            currentAgreement: expected
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
      const resolved = await resolveServerPrice(itemType, itemId, effectiveUserId, licenseType);
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
          // WHAT was sold, in the three axes, so the webhook records the licence it
          // actually sold rather than assuming a personal download. Written here because
          // this is where the product is decided; the webhook reads it back with
          // productFromMetadata. Client `...metadata` is spread above these, so a client
          // cannot upgrade its own licence by posting licenseGrant: 'sync'.
          ...licenseFields(product),
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
