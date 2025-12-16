// netlify/functions/process-revenue-split.js
// Automatically split revenue and transfer to artist Stripe Connect accounts

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
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

// Revenue split percentages (can be customized per artist)
const DEFAULT_ARTIST_SHARE = 0.70; // 70% to artist
const PLATFORM_SHARE = 0.30;       // 30% to platform

/**
 * Process revenue split for a completed purchase
 * Called from the webhook after purchase is recorded
 */
exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { purchaseId, userId, itemId, itemType, amount } = JSON.parse(event.body);

    console.log(`🎯 Processing revenue split for purchase: ${purchaseId}`);
    console.log(`Item: ${itemType} ${itemId}, Amount: $${amount}`);

    // Get item details to find artist
    let artistId, artistStripeAccountId, customSplit;

    if (itemType === 'song') {
      const songDoc = await db.collection('songs').doc(itemId).get();
      if (!songDoc.exists()) {
        throw new Error('Song not found');
      }
      const songData = songDoc.data();
      artistId = songData.artistId || songData.uploadedBy;
      customSplit = songData.revenueSplit; // Optional custom split
    } else if (itemType === 'album') {
      const albumDoc = await db.collection('albums').doc(itemId).get();
      if (!albumDoc.exists()) {
        throw new Error('Album not found');
      }
      const albumData = albumDoc.data();
      artistId = albumData.artistId || albumData.uploadedBy;
      customSplit = albumData.revenueSplit;
    }

    if (!artistId) {
      throw new Error('Artist ID not found for item');
    }

    // Get artist's Stripe Connect account ID
    const artistDoc = await db.collection('users').doc(artistId).get();
    if (!artistDoc.exists()) {
      throw new Error('Artist not found');
    }

    const artistData = artistDoc.data();
    artistStripeAccountId = artistData.stripeConnectAccountId;

    if (!artistStripeAccountId) {
      console.warn(`⚠️ Artist ${artistId} doesn't have Stripe Connect account. Holding funds.`);

      // Record pending payout
      await db.collection('pendingPayouts').add({
        artistId,
        purchaseId,
        itemId,
        itemType,
        amount,
        reason: 'no_stripe_account',
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Funds held - artist needs to connect Stripe account'
        })
      };
    }

    // Calculate split
    const artistShare = customSplit?.artistPercent || DEFAULT_ARTIST_SHARE;
    const amountInCents = Math.round(amount * 100); // Convert to cents
    const artistAmount = Math.round(amountInCents * artistShare);
    const platformAmount = amountInCents - artistAmount;

    console.log(`💰 Split: Artist earns $${(artistAmount / 100).toFixed(2)}, Platform keeps $${(platformAmount / 100).toFixed(2)}`);

    // Record the revenue allocation (NOT transferred yet - held until artist requests payout)
    await db.collection('revenueAllocations').add({
      purchaseId,
      artistId,
      artistStripeAccountId: artistStripeAccountId || null,
      itemId,
      itemType,
      totalAmount: amount,
      artistAmount: artistAmount / 100,
      platformAmount: platformAmount / 100,
      artistShare: artistShare * 100, // Store as percentage
      status: 'pending', // Pending until payout requested
      allocatedAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        userId
      }
    });

    console.log(`✅ Revenue allocated (held for payout request)`);

    // Update artist's available balance (not yet paid out)
    const artistBalanceRef = db.collection('artistBalances').doc(artistId);
    const balanceDoc = await artistBalanceRef.get();

    if (balanceDoc.exists()) {
      await artistBalanceRef.update({
        availableBalance: admin.firestore.FieldValue.increment(artistAmount / 100),
        totalEarnings: admin.firestore.FieldValue.increment(artistAmount / 100),
        pendingAllocations: admin.firestore.FieldValue.increment(1),
        lastEarningAt: admin.firestore.FieldValue.serverTimestamp(),
        lastEarningAmount: artistAmount / 100
      });
    } else {
      await artistBalanceRef.set({
        artistId,
        availableBalance: artistAmount / 100,
        totalEarnings: artistAmount / 100,
        totalPaidOut: 0,
        pendingAllocations: 1,
        completedPayouts: 0,
        lastEarningAt: admin.firestore.FieldValue.serverTimestamp(),
        lastEarningAmount: artistAmount / 100,
        stripeConnectAccountId: artistStripeAccountId || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    console.log(`✅ Artist balance updated. New available: $${(artistAmount / 100).toFixed(2)}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        artistAmount: artistAmount / 100,
        platformAmount: platformAmount / 100,
        status: 'allocated' // Held until payout requested
      })
    };

  } catch (error) {
    console.error('❌ Error processing revenue split:', error);

    // Record failed transfer
    try {
      await db.collection('failedTransfers').add({
        error: error.message,
        stack: error.stack,
        requestBody: JSON.parse(event.body),
        failedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (dbError) {
      console.error('Failed to record error:', dbError);
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
