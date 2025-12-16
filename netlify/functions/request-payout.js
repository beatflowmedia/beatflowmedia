// netlify/functions/request-payout.js
// Artist requests payout of their available balance

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

// Minimum payout amount (in dollars)
const MINIMUM_PAYOUT = 10.00; // $10 minimum

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { artistId, requestedAmount } = JSON.parse(event.body);

    if (!artistId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing artistId' })
      };
    }

    console.log(`🎯 Payout request from artist: ${artistId}`);

    // Get artist's balance
    const balanceDoc = await db.collection('artistBalances').doc(artistId).get();

    if (!balanceDoc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Artist balance not found' })
      };
    }

    const balance = balanceDoc.data();
    const availableBalance = balance.availableBalance || 0;
    const stripeConnectAccountId = balance.stripeConnectAccountId;

    console.log(`💰 Available balance: $${availableBalance.toFixed(2)}`);

    // Check if artist has Stripe Connect account
    if (!stripeConnectAccountId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Please connect your Stripe account first',
          requiresStripeConnect: true
        })
      };
    }

    // Determine payout amount (requested or full balance)
    const payoutAmount = requestedAmount || availableBalance;

    // Check minimum payout
    if (payoutAmount < MINIMUM_PAYOUT) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Minimum payout is $${MINIMUM_PAYOUT.toFixed(2)}`,
          availableBalance,
          minimumPayout: MINIMUM_PAYOUT
        })
      };
    }

    // Check if enough balance
    if (payoutAmount > availableBalance) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Insufficient balance',
          requestedAmount: payoutAmount,
          availableBalance
        })
      };
    }

    console.log(`✅ Payout request valid. Processing $${payoutAmount.toFixed(2)}`);

    // Create Stripe transfer
    const amountInCents = Math.round(payoutAmount * 100);
    const transfer = await stripe.transfers.create({
      amount: amountInCents,
      currency: 'usd',
      destination: stripeConnectAccountId,
      description: `Payout to artist ${artistId}`,
      metadata: {
        artistId,
        payoutType: 'manual_request',
        requestedAt: new Date().toISOString()
      }
    });

    console.log(`✅ Transfer created: ${transfer.id}`);

    // Record the payout
    const payoutRef = await db.collection('payoutRequests').add({
      artistId,
      stripeTransferId: transfer.id,
      stripeConnectAccountId,
      amount: payoutAmount,
      status: 'completed',
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        stripeTransferObject: transfer
      }
    });

    // Update artist balance
    await db.collection('artistBalances').doc(artistId).update({
      availableBalance: admin.firestore.FieldValue.increment(-payoutAmount),
      totalPaidOut: admin.firestore.FieldValue.increment(payoutAmount),
      completedPayouts: admin.firestore.FieldValue.increment(1),
      lastPayoutAt: admin.firestore.FieldValue.serverTimestamp(),
      lastPayoutAmount: payoutAmount
    });

    // Update all pending revenue allocations to paid
    const allocationsQuery = db.collection('revenueAllocations')
      .where('artistId', '==', artistId)
      .where('status', '==', 'pending')
      .limit(100); // Process in batches if needed

    const allocationsSnapshot = await allocationsQuery.get();
    const batch = db.batch();

    allocationsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'paid',
        payoutRequestId: payoutRef.id,
        paidAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    console.log(`✅ Updated ${allocationsSnapshot.size} revenue allocations to paid`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        payoutId: payoutRef.id,
        transferId: transfer.id,
        amount: payoutAmount,
        newBalance: availableBalance - payoutAmount,
        expectedArrival: '2 business days',
        message: 'Payout initiated successfully'
      })
    };

  } catch (error) {
    console.error('❌ Error processing payout request:', error);

    // Record failed payout
    try {
      await db.collection('failedPayouts').add({
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
        error: error.message,
        details: error.type || 'unknown_error'
      })
    };
  }
};
