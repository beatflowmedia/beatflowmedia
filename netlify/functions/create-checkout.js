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

const DEFAULT_SONG_PRICE = 2900; // cents — mirrors utils/pricing SONG_PRICE
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

  const basePrice = Number.isFinite(item.price) ? item.price : DEFAULT_SONG_PRICE;

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
      userId,
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
      licenseType
    } = JSON.parse(event.body);

    console.log('✅ Request data:', { userId, itemId, itemType, price, priceId, userEmail });

    // Auth (defense-in-depth): if a Firebase ID token is sent, verify it and treat the
    // verified uid as authoritative. Falls back to the body userId when absent (non-breaking).
    let effectiveUserId = userId;
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = await admin.auth().verifyIdToken(authHeader.slice(7));
        effectiveUserId = decoded.uid;
      } catch (e) {
        console.warn('⚠️ ID token verification failed:', e.message);
      }
    }

    // Validate required fields - allow priceId OR (userId + itemId + itemType)
    if (priceId) {
      // Using Stripe Price ID (for studio samples, subscriptions, etc.)
      console.log('Using Stripe Price ID:', priceId);
    } else if (!userId || !itemId || !itemType) {
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
          userId: userId || 'guest',
          itemId: sampleId || itemId,
          itemType: 'studio_sample',
          sampleTitle: sampleTitle || itemName,
          licenseType: licenseType || 'personal',
          ...metadata
        },
        automatic_tax: { enabled: false }
      };
    } else if (itemType === 'artist_membership') {
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
                  userId
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
          userId,
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
                  userId,
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
          userId,
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
