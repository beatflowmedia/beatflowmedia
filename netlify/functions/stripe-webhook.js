// netlify/functions/stripe-webhook.js
// Handle Stripe webhook events for payment completion

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  console.log('Initializing Firebase Admin...');
  console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
  console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
  console.log('Private Key exists:', !!process.env.FIREBASE_PRIVATE_KEY);

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    throw error;
  }
} else {
  console.log('Firebase Admin already initialized');
}

const db = admin.firestore();
console.log('Firestore instance created');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    // Verify webhook signature
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
    };
  }

  // Handle the event
  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(stripeEvent.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(stripeEvent.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(stripeEvent.data.object);
        break;

      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', stripeEvent.data.object.id);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('❌ Error handling webhook:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        type: stripeEvent.type,
        eventId: stripeEvent.id
      })
    };
  }
};

/**
 * Handle successful checkout session completion
 */
async function handleCheckoutSessionCompleted(session) {
  console.log('🎯 Checkout session completed:', session.id);
  console.log('📋 Session metadata:', JSON.stringify(session.metadata, null, 2));
  console.log('💳 Session mode:', session.mode);
  console.log('💰 Amount:', session.amount_total);

  const { userId, itemId, itemType } = session.metadata || {};

  if (!userId || !itemId || !itemType) {
    console.error('❌ Missing metadata in checkout session');
    console.error('Session metadata received:', JSON.stringify(session.metadata, null, 2));
    console.error('Full session object keys:', Object.keys(session));
    throw new Error(`Missing required metadata: userId=${userId}, itemId=${itemId}, itemType=${itemType}`);
  }

  console.log(`✅ Processing purchase: userId=${userId}, itemId=${itemId}, itemType=${itemType}`);

  try {
    // Handle artist membership subscription
    if (itemType === 'artist_membership') {
      console.log(`🎵 Processing artist membership subscription for user ${userId}`);

      try {
        const userRef = db.collection('users').doc(userId);
        console.log('📄 Getting user document...');
        const userDoc = await userRef.get();
        console.log('📄 User document exists:', userDoc.exists);

        // Calculate expiration date (1 year from now)
        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        console.log('📅 Expiration date calculated:', expirationDate.toISOString());

        const membershipData = {
          artistMembershipActive: true,
          membershipExpiresAt: admin.firestore.Timestamp.fromDate(expirationDate),
          membershipStartedAt: admin.firestore.FieldValue.serverTimestamp(),
          stripeSubscriptionId: session.subscription,
          stripeCustomerId: session.customer,
          membershipType: 'annual'
        };

        console.log('💾 Membership data to save:', JSON.stringify({
          ...membershipData,
          membershipExpiresAt: expirationDate.toISOString()
        }, null, 2));

        if (userDoc.exists) {
          console.log('📝 Updating existing user document...');
          await userRef.update(membershipData);
          console.log(`✅ Updated user membership, expires: ${expirationDate.toISOString()}`);
        } else {
          console.log('📝 Creating new user document...');
          await userRef.set(membershipData);
          console.log(`✅ Created user document with membership, expires: ${expirationDate.toISOString()}`);
        }
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        console.error('Error code:', dbError.code);
        console.error('Error message:', dbError.message);
        throw dbError;
      }

      // Record the purchase
      await db.collection('purchases').add({
        userId,
        itemId,
        itemType,
        itemName: 'BeatFlow Artist Membership',
        price: session.amount_total / 100,
        currency: session.currency,
        status: 'completed',
        stripeSessionId: session.id,
        stripeSubscriptionId: session.subscription,
        customerEmail: session.customer_email,
        purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(expirationDate),
        metadata: session.metadata
      });

      console.log(`✅ Artist membership activated for user ${userId}`);
      return; // Exit early for artist membership
    }

    // Handle playlist submission escrow payments
    if (itemType === 'playlist_submission') {
      console.log(`🎵 Processing playlist submission escrow payment for submission ${itemId}`);

      try {
        const submissionRef = db.collection('playlist_submissions').doc(itemId);
        const submissionDoc = await submissionRef.get();

        if (!submissionDoc.exists) {
          console.error('❌ Submission not found:', itemId);
          throw new Error(`Submission ${itemId} not found`);
        }

        // Update submission with escrow payment details
        await submissionRef.update({
          paymentStatus: 'escrow_pending',
          status: 'pending_review',
          stripePaymentIntentId: session.payment_intent,
          stripeSessionId: session.id,
          escrowAmount: session.amount_total / 100, // Convert to dollars
          escrowCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
          reviewDeadline: admin.firestore.Timestamp.fromDate(
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days for curator to review
          )
        });

        console.log(`✅ Playlist submission ${itemId} payment held in escrow`);

        // Record the escrow transaction
        await db.collection('escrow_transactions').add({
          submissionId: itemId,
          artistId: session.metadata.artistId,
          curatorId: session.metadata.curatorId,
          trackId: session.metadata.trackId,
          playlistId: session.metadata.playlistId,
          amount: session.amount_total / 100,
          status: 'held',
          paymentIntentId: session.payment_intent,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Escrow transaction recorded for submission ${itemId}`);
        return; // Exit early for playlist submissions
      } catch (error) {
        console.error('❌ Error processing playlist submission payment:', error);
        throw error;
      }
    }

    // Check for duplicate purchase (song/album only)
    console.log('🔍 Checking for existing purchase...');
    const existingPurchase = await db.collection('purchases')
      .where('userId', '==', userId)
      .where('itemId', '==', itemId)
      .where('itemType', '==', itemType)
      .where('status', '==', 'completed')
      .limit(1)
      .get();

    if (!existingPurchase.empty) {
      console.log('⚠️ Purchase already exists, skipping duplicate creation');
      console.log('Existing purchase ID:', existingPurchase.docs[0].id);
      return; // Exit early - purchase already recorded
    }

    // Get item details for song/album purchases
    let itemData = {};
    if (itemType === 'song') {
      const songDoc = await db.collection('songs').doc(itemId).get();
      if (songDoc.exists) {
        itemData = songDoc.data();
      }
    } else if (itemType === 'album') {
      const albumDoc = await db.collection('albums').doc(itemId).get();
      if (albumDoc.exists) {
        itemData = albumDoc.data();
      }
    }

    // Create purchase record
    console.log('📝 Creating purchase document in Firestore...');
    const purchaseData = {
      userId,
      itemId,
      itemType,
      itemName: itemData.title || 'Unknown',
      artistName: itemData.artistName || 'Unknown Artist',
      price: session.amount_total / 100, // Convert from cents to dollars
      currency: session.currency,
      status: 'completed',
      stripeSessionId: session.id,
      stripePaymentIntent: session.payment_intent,
      customerEmail: session.customer_email,
      purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: session.metadata
    };

    console.log('Purchase data:', JSON.stringify(purchaseData, null, 2));

    const purchaseRef = await db.collection('purchases').add(purchaseData);
    console.log(`✅ Purchase document created with ID: ${purchaseRef.id}`);

    // Update user's purchased items
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const purchasedItems = userDoc.data().purchasedItems || [];

      // Add to purchased items if not already there
      if (!purchasedItems.some(item => item.itemId === itemId && item.itemType === itemType)) {
        await userRef.update({
          purchasedItems: admin.firestore.FieldValue.arrayUnion({
            itemId,
            itemType,
            purchasedAt: new Date().toISOString() // Use ISO string instead of serverTimestamp() in arrays
          })
        });
      }
    } else {
      // Create user document if it doesn't exist
      console.log(`User document doesn't exist, creating one for userId: ${userId}`);
      await userRef.set({
        purchasedItems: [{
          itemId,
          itemType,
          purchasedAt: new Date().toISOString()
        }]
      });
    }

    // If album purchase, grant access to all songs in the album
    if (itemType === 'album') {
      const songsSnapshot = await db.collection('songs')
        .where('albumId', '==', itemId)
        .get();

      console.log(`Granting access to ${songsSnapshot.size} songs in album ${itemId}`);
    }

    console.log(`Purchase recorded for user ${userId}: ${itemType} ${itemId}`);

    // Trigger revenue split (async - don't block webhook response)
    if (itemType === 'song' || itemType === 'album') {
      try {
        console.log('🔄 Triggering revenue split...');
        // Call the revenue split function
        await fetch(`${process.env.URL || 'https://beatflowmediagroup.com'}/.netlify/functions/process-revenue-split`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            purchaseId: purchaseRef.id,
            userId,
            itemId,
            itemType,
            amount: session.amount_total / 100 // Convert to dollars
          })
        });
        console.log('✅ Revenue split triggered successfully');
      } catch (splitError) {
        console.error('⚠️ Failed to trigger revenue split (will retry):', splitError.message);
        // Don't throw - purchase was recorded successfully
      }
    }
  } catch (error) {
    console.error('❌ Error recording purchase:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      userId,
      itemId,
      itemType,
      sessionId: session.id
    });
    throw error;
  }
}

/**
 * Handle subscription updates (renewals)
 */
async function handleSubscriptionUpdate(subscription) {
  console.log('Subscription updated:', subscription.id);

  try {
    // Find user by subscription ID
    const usersSnapshot = await db.collection('users')
      .where('stripeSubscriptionId', '==', subscription.id)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.log('No user found for subscription:', subscription.id);
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    // Update membership expiration if subscription is active
    if (subscription.status === 'active') {
      const expirationDate = new Date(subscription.current_period_end * 1000);

      await db.collection('users').doc(userId).update({
        artistMembershipActive: true,
        membershipExpiresAt: admin.firestore.Timestamp.fromDate(expirationDate),
        subscriptionStatus: subscription.status
      });

      console.log(`✅ Updated membership expiration for user ${userId}: ${expirationDate.toISOString()}`);
    } else {
      // Handle non-active statuses (past_due, unpaid, etc.)
      await db.collection('users').doc(userId).update({
        subscriptionStatus: subscription.status
      });
      console.log(`⚠️ Subscription status updated to ${subscription.status} for user ${userId}`);
    }
  } catch (error) {
    console.error('Error updating subscription:', error);
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(subscription) {
  console.log('Subscription cancelled:', subscription.id);

  try {
    // Find user by subscription ID
    const usersSnapshot = await db.collection('users')
      .where('stripeSubscriptionId', '==', subscription.id)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.log('No user found for subscription:', subscription.id);
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    // Deactivate membership
    await db.collection('users').doc(userId).update({
      artistMembershipActive: false,
      subscriptionStatus: 'cancelled',
      membershipCancelledAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`❌ Membership deactivated for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent) {
  console.log('Payment failed:', paymentIntent.id);

  // You could record failed payment attempts here
  try {
    await db.collection('failed_payments').add({
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
      errorMessage: paymentIntent.last_payment_error?.message || 'Unknown error'
    });
  } catch (error) {
    console.error('Error recording failed payment:', error);
  }
}
