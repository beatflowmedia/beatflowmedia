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
    let stripeConnectAccountId = balance.stripeConnectAccountId;

    console.log(`💰 Available balance: $${availableBalance.toFixed(2)}`);

    // If no Stripe account in balance, check users collection
    if (!stripeConnectAccountId) {
      console.log('⚠️  No Stripe account in artistBalances, checking users collection...');
      const userDoc = await db.collection('users').doc(artistId).get();
      if (userDoc.exists) {
        stripeConnectAccountId = userDoc.data().stripeConnectAccountId;

        // Update artistBalances with the Stripe account ID for future use
        if (stripeConnectAccountId) {
          await db.collection('artistBalances').doc(artistId).update({
            stripeConnectAccountId: stripeConnectAccountId
          });
          console.log(`✅ Updated artistBalances with Stripe account ID: ${stripeConnectAccountId}`);
        }
      }
    }

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

    const isTestMode = process.env.STRIPE_TEST_MODE === 'true' || process.env.NODE_ENV === 'development';
    const amountInCents = Math.round(payoutAmount * 100);
    let transfer = null;

    // In test mode, simulate the transfer instead of calling Stripe API
    if (isTestMode) {
      console.log('⚠️  TEST MODE: Simulating Stripe transfer (not actually calling Stripe API)');

      // Create a fake transfer object that matches Stripe's structure
      transfer = {
        id: `test_tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        object: 'transfer',
        amount: amountInCents,
        currency: 'usd',
        destination: stripeConnectAccountId,
        created: Math.floor(Date.now() / 1000),
        description: `TEST PAYOUT to artist ${artistId}`,
        metadata: {
          artistId,
          payoutType: 'manual_request',
          requestedAt: new Date().toISOString(),
          testMode: true
        }
      };

      console.log(`✅ Simulated transfer created: ${transfer.id}`);
    } else {
      // Production mode - actually call Stripe
      try {
        const account = await stripe.accounts.retrieve(stripeConnectAccountId);

        console.log('📋 Stripe account status:', {
          id: account.id,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          capabilities: account.capabilities
        });

        const transfersStatus = account.capabilities?.transfers || 'not_requested';

        if (!account.capabilities?.transfers || account.capabilities.transfers !== 'active') {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: `Stripe account setup incomplete. Transfers capability status: ${transfersStatus}`,
              requiresOnboarding: !account.details_submitted,
              detailsSubmitted: account.details_submitted,
              transfersStatus: transfersStatus,
              capabilities: account.capabilities,
              message: account.details_submitted
                ? 'Your Stripe account is under review. This usually takes 1-2 business days.'
                : 'Please complete the Stripe onboarding process to enable payouts.'
            })
          };
        }
      } catch (err) {
        console.error('Error checking Stripe account:', err);
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Invalid Stripe Connect account',
            requiresStripeConnect: true
          })
        };
      }

      // Create real Stripe transfer
      transfer = await stripe.transfers.create({
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
    }

    // Record the payout
    const payoutRef = await db.collection('payoutRequests').add({
      artistId,
      stripeTransferId: transfer.id,
      stripeConnectAccountId,
      amount: payoutAmount,
      status: 'completed',
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      testMode: isTestMode,
      metadata: {
        stripeTransferObject: transfer,
        testMode: isTestMode
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
        expectedArrival: isTestMode ? 'Test Mode - Simulated' : '2 business days',
        message: isTestMode
          ? 'TEST PAYOUT: Simulated successfully (no actual transfer made)'
          : 'Payout initiated successfully',
        testMode: isTestMode
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
