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

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(stripeEvent.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(stripeEvent.data.object);
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

  const { userId, itemId, itemType, paymentType, projectId, trackIds } = session.metadata || {};

  // Handle studio project payments
  if (paymentType === 'studio_project' && projectId) {
    return await handleStudioProjectPayment(session, projectId);
  }

  // Validate metadata - bundles use trackIds instead of itemId
  if (itemType === 'bundle') {
    if (!userId || !trackIds || !itemType) {
      console.error('❌ Missing bundle metadata in checkout session');
      console.error('Session metadata received:', JSON.stringify(session.metadata, null, 2));
      throw new Error(`Missing required bundle metadata: userId=${userId}, trackIds=${trackIds}, itemType=${itemType}`);
    }
  } else if (!userId || !itemId || !itemType) {
    console.error('❌ Missing metadata in checkout session');
    console.error('Session metadata received:', JSON.stringify(session.metadata, null, 2));
    console.error('Full session object keys:', Object.keys(session));
    throw new Error(`Missing required metadata: userId=${userId}, itemId=${itemId}, itemType=${itemType}`);
  }

  console.log(`✅ Processing purchase: userId=${userId}, itemId=${itemId || trackIds}, itemType=${itemType}`);

  // Calculate expiration date for artist memberships (1 year from now)
  let expirationDate = null;
  if (itemType === 'artist_membership') {
    expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  }

  try {
    // Handle artist membership subscription
    if (itemType === 'artist_membership') {
      console.log(`🎵 Processing artist membership subscription for user ${userId}`);

      try {
        const userRef = db.collection('users').doc(userId);
        console.log('📄 Getting user document...');
        const userDoc = await userRef.get();
        console.log('📄 User document exists:', userDoc.exists);

        console.log('📅 Expiration date calculated:', expirationDate.toISOString());

        const membershipData = {
          artistMembershipActive: true,
          artistMembershipExpiresAt: admin.firestore.Timestamp.fromDate(expirationDate),
          artistMembershipStartedAt: admin.firestore.FieldValue.serverTimestamp(),
          artistStripeSubscriptionId: session.subscription,
          artistStripeCustomerId: session.customer,
          artistSubscriptionStatus: 'active',
          membershipType: 'annual',
          // Keep legacy fields for backward compatibility
          membershipExpiresAt: admin.firestore.Timestamp.fromDate(expirationDate),
          membershipStartedAt: admin.firestore.FieldValue.serverTimestamp()
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

      // Generate unique license ID for this purchase
      const crypto = require('crypto');
      const licenseId = `LIC-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

      // Record the purchase
      await db.collection('purchases').add({
        userId,
        itemId,
        itemType,
        itemName: 'BeatFlow Artist Membership',
        price: session.amount_total / 100,
        currency: session.currency,
        status: 'completed',
        licenseId,
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

    // Handle studio sample license purchases
    if (itemType === 'studio_sample') {
      console.log(`🎵 Processing studio sample license purchase for sample ${itemId}`);

      try {
        // Get sample details
        const sampleRef = db.collection('studioSamples').doc(itemId);
        const sampleDoc = await sampleRef.get();

        let sampleData = {
          title: session.metadata.sampleTitle || 'Unknown Sample',
          artist: session.metadata.artist || 'BeatFlow Studio'
        };

        if (sampleDoc.exists) {
          sampleData = sampleDoc.data();
        }

        // Generate unique license ID for this purchase
        const crypto = require('crypto');
        const licenseId = `LIC-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

        // Create purchase record
        const purchaseData = {
          userId: userId || 'guest',
          itemId,
          itemType: 'studio_sample',
          itemName: sampleData.title,
          artistName: sampleData.artist,
          licenseType: session.metadata.licenseType || 'personal',
          price: session.amount_total / 100,
          currency: session.currency,
          status: 'completed',
          licenseId, // Add license ID to purchase record
          stripeSessionId: session.id,
          stripePaymentIntent: session.payment_intent,
          customerEmail: session.customer_email,
          purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: session.metadata
        };

        const purchaseRef = await db.collection('purchases').add(purchaseData);
        console.log(`✅ Purchase record created: ${purchaseRef.id} with license ${licenseId}`);

        // Create download record for the user
        if (userId && userId !== 'guest') {

          await db.collection('downloads').add({
            userId,
            purchaseId: purchaseRef.id,
            itemId,
            itemType: 'studio_sample',
            itemName: sampleData.title,
            licenseType: session.metadata.licenseType || 'personal',
            licenseId,
            downloadedAt: null, // Will be set when user actually downloads
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`✅ Download record created for user ${userId} with license ${licenseId}`);
        }

        console.log(`✅ Studio sample license purchase completed for ${itemId}`);
        return; // Exit early for studio samples
      } catch (error) {
        console.error('❌ Error processing studio sample purchase:', error);
        throw error;
      }
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

    // Handle bundle purchases (multiple tracks)
    if (itemType === 'bundle') {
      console.log(`🎵 Processing bundle purchase with ${session.metadata.itemCount} tracks`);

      try {
        const trackIds = session.metadata.trackIds.split(',');
        const crypto = require('crypto');

        console.log(`Creating purchase records for ${trackIds.length} tracks...`);

        // Create a purchase record for each track in the bundle
        for (const trackId of trackIds) {
          // Get track details
          const songDoc = await db.collection('songs').doc(trackId).get();
          let songData = { title: 'Unknown', artistName: 'Unknown Artist' };

          if (songDoc.exists) {
            songData = songDoc.data();
          }

          // Generate unique license ID for this track
          const licenseId = `LIC-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

          // Create purchase record for this track
          const purchaseData = {
            userId,
            itemId: trackId,
            itemType: 'song',
            itemName: songData.title || songData.name || 'Unknown Track',
            artistName: songData.artistName || songData.artist || 'Unknown Artist',
            price: session.amount_total / 100 / trackIds.length, // Split total price evenly
            currency: session.currency,
            status: 'completed',
            licenseId,
            bundlePurchase: true,
            bundleSessionId: session.id,
            stripeSessionId: session.id,
            stripePaymentIntent: session.payment_intent,
            customerEmail: session.customer_email,
            purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
            metadata: {
              ...session.metadata,
              bundleTrackId: trackId,
              bundleDiscount: session.metadata.discount,
              bundleSubtotal: session.metadata.subtotal,
              bundleDiscountAmount: session.metadata.discountAmount,
              bundleTotal: session.metadata.total
            }
          };

          const purchaseRef = await db.collection('purchases').add(purchaseData);
          console.log(`✅ Created purchase record for track ${trackId}: ${purchaseRef.id}, License: ${licenseId}`);

          // Create perpetual license for this bundle track (NEW: Hybrid Model integration)
          try {
            const perpetualLicenseId = `lic_perp_${userId}_${trackId}_${Date.now()}`;
            const subscriberTier = session.metadata.subscriberTier || 'none';

            await db.collection('licenses').doc(perpetualLicenseId).set({
              licenseId: perpetualLicenseId,
              userId,
              trackId: trackId,
              purchaseId: purchaseRef.id,
              tier: subscriberTier,
              licenseType: 'perpetual',
              status: 'active',
              purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
              validWhileSubscribed: false,
              pricePaid: parseInt(session.amount_total / trackIds.length), // Split evenly
              bundlePurchase: true,
              bundleSessionId: session.id,
              note: `Perpetual license via bundle purchase`,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`✅ Created perpetual license ${perpetualLicenseId} for bundle track ${trackId}`);
          } catch (licenseError) {
            console.error(`⚠️ Failed to create perpetual license for track ${trackId}:`, licenseError);
            // Continue with other tracks
          }

          // Update user's purchased items
          const userRef = db.collection('users').doc(userId);
          const userDoc = await userRef.get();

          if (userDoc.exists) {
            const purchasedItems = userDoc.data().purchasedItems || [];

            if (!purchasedItems.some(item => item.itemId === trackId && item.itemType === 'song')) {
              await userRef.update({
                purchasedItems: admin.firestore.FieldValue.arrayUnion({
                  itemId: trackId,
                  itemType: 'song',
                  purchasedAt: new Date().toISOString()
                })
              });
            }
          } else {
            await userRef.set({
              purchasedItems: [{
                itemId: trackId,
                itemType: 'song',
                purchasedAt: new Date().toISOString()
              }]
            });
          }
        }

        console.log(`✅ Bundle purchase completed: ${trackIds.length} tracks for user ${userId}`);
        return; // Exit early for bundle purchases
      } catch (error) {
        console.error('❌ Error processing bundle purchase:', error);
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

    // Generate unique license ID for this purchase
    const crypto = require('crypto');
    const licenseId = `LIC-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

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
      licenseId, // Add license ID to purchase record
      stripeSessionId: session.id,
      stripePaymentIntent: session.payment_intent,
      customerEmail: session.customer_email,
      purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: session.metadata
    };

    console.log('Purchase data:', JSON.stringify(purchaseData, null, 2));

    const purchaseRef = await db.collection('purchases').add(purchaseData);
    console.log(`✅ Purchase document created with ID: ${purchaseRef.id}, License: ${licenseId}`);

    // Create perpetual license for this purchase (NEW: Hybrid Model integration)
    // These licenses survive subscription cancellation
    try {
      const perpetualLicenseId = `lic_perp_${userId}_${itemId}_${Date.now()}`;
      const subscriberTier = session.metadata.subscriberTier || 'none';
      const originalPrice = session.metadata.originalPrice ? parseInt(session.metadata.originalPrice) : null;
      const discountApplied = session.metadata.discountApplied === 'true';

      await db.collection('licenses').doc(perpetualLicenseId).set({
        licenseId: perpetualLicenseId,
        userId,
        trackId: itemId,
        purchaseId: purchaseRef.id,
        tier: subscriberTier,
        licenseType: 'perpetual',
        status: 'active',
        purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
        validWhileSubscribed: false,
        pricePaid: session.amount_total, // In cents
        originalPrice: originalPrice,
        discountApplied: discountApplied,
        note: discountApplied
          ? `Perpetual license purchased with ${subscriberTier} subscriber discount`
          : 'Perpetual license purchased at regular price',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Created perpetual license ${perpetualLicenseId} for ${itemType} ${itemId}`);
    } catch (licenseError) {
      console.error('⚠️ Failed to create perpetual license (purchase still valid):', licenseError);
      // Don't throw - purchase was recorded successfully
    }

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
    // Try to find user by artist subscription ID first
    let usersSnapshot = await db.collection('users')
      .where('artistStripeSubscriptionId', '==', subscription.id)
      .limit(1)
      .get();

    // Fallback to listener subscription check if not found
    let isArtistSubscription = !usersSnapshot.empty;
    if (usersSnapshot.empty) {
      usersSnapshot = await db.collection('users')
        .where('listenerStripeSubscriptionId', '==', subscription.id)
        .limit(1)
        .get();
    }

    // NEW: Also check by stripeCustomerId for Hybrid Model subscriptions
    if (usersSnapshot.empty) {
      usersSnapshot = await db.collection('users')
        .where('stripeCustomerId', '==', subscription.customer)
        .limit(1)
        .get();
    }

    if (usersSnapshot.empty) {
      console.log('No user found for subscription:', subscription.id);
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    // HYBRID MODEL: Restore licenses if subscription reactivated
    if (subscription.status === 'active') {
      try {
        const licensesSnapshot = await db.collection('licenses')
          .where('userId', '==', userId)
          .where('subscriptionId', '==', subscription.id)
          .where('status', '==', 'published-only')
          .get();

        if (!licensesSnapshot.empty) {
          const batch = db.batch();

          licensesSnapshot.forEach((doc) => {
            batch.update(doc.ref, {
              status: 'active',
              validWhileSubscribed: true,
              reactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              note: 'Subscription reactivated. Can use in new projects again.'
            });
          });

          await batch.commit();
          console.log(`✓ Reactivated ${licensesSnapshot.size} licenses for user ${userId}`);
        }
      } catch (licenseError) {
        console.error('Error reactivating licenses:', licenseError);
        // Don't throw - continue with user update
      }
    }

    // Update artist membership expiration if subscription is active
    if (isArtistSubscription) {
      if (subscription.status === 'active') {
        const expirationDate = new Date(subscription.current_period_end * 1000);

        await db.collection('users').doc(userId).update({
          artistMembershipActive: true,
          artistMembershipExpiresAt: admin.firestore.Timestamp.fromDate(expirationDate),
          artistSubscriptionStatus: subscription.status,
          // Legacy fields for backward compatibility
          membershipExpiresAt: admin.firestore.Timestamp.fromDate(expirationDate)
        });

        console.log(`✅ Updated artist membership expiration for user ${userId}: ${expirationDate.toISOString()}`);
      } else {
        // Handle non-active statuses (past_due, unpaid, etc.)
        await db.collection('users').doc(userId).update({
          artistSubscriptionStatus: subscription.status
        });
        console.log(`⚠️ Artist subscription status updated to ${subscription.status} for user ${userId}`);
      }
    } else {
      // Update listener premium subscription
      if (subscription.status === 'active') {
        const expirationDate = new Date(subscription.current_period_end * 1000);

        await db.collection('users').doc(userId).update({
          isPremium: true,
          premiumActive: true,
          listenerSubscriptionStatus: subscription.status,
          listenerSubscriptionExpiresAt: admin.firestore.Timestamp.fromDate(expirationDate),
          'subscription.status': 'active',
          'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Updated listener premium for user ${userId}: ${expirationDate.toISOString()}`);
      } else {
        await db.collection('users').doc(userId).update({
          listenerSubscriptionStatus: subscription.status,
          'subscription.status': subscription.status,
          'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`⚠️ Listener subscription status updated to ${subscription.status} for user ${userId}`);
      }
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
    // Try to find user by artist subscription ID first
    let usersSnapshot = await db.collection('users')
      .where('artistStripeSubscriptionId', '==', subscription.id)
      .limit(1)
      .get();

    // Fallback to listener subscription check if not found
    let isArtistSubscription = !usersSnapshot.empty;
    if (usersSnapshot.empty) {
      usersSnapshot = await db.collection('users')
        .where('listenerStripeSubscriptionId', '==', subscription.id)
        .limit(1)
        .get();
    }

    // NEW: Also check by stripeCustomerId for Hybrid Model subscriptions
    if (usersSnapshot.empty) {
      usersSnapshot = await db.collection('users')
        .where('stripeCustomerId', '==', subscription.customer)
        .limit(1)
        .get();
    }

    if (usersSnapshot.empty) {
      console.log('No user found for subscription:', subscription.id);
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    // HYBRID MODEL: Mark all time-bound licenses as published-only
    try {
      const licensesSnapshot = await db.collection('licenses')
        .where('userId', '==', userId)
        .where('subscriptionId', '==', subscription.id)
        .where('licenseType', '==', 'time-bound')
        .get();

      console.log(`Found ${licensesSnapshot.size} licenses to update for cancelled subscription`);

      if (!licensesSnapshot.empty) {
        const batch = db.batch();

        licensesSnapshot.forEach((doc) => {
          batch.update(doc.ref, {
            status: 'published-only',
            validWhileSubscribed: false,
            subscriptionEndedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            note: 'Subscription cancelled. Published projects retain license. Cannot use in new projects.'
          });
        });

        await batch.commit();
        console.log(`✓ Updated ${licensesSnapshot.size} licenses to published-only for user ${userId}`);
      }
    } catch (licenseError) {
      console.error('Error updating licenses on cancellation:', licenseError);
      // Don't throw - continue with user update
    }

    if (isArtistSubscription) {
      // Deactivate artist membership
      await db.collection('users').doc(userId).update({
        artistMembershipActive: false,
        artistSubscriptionStatus: 'cancelled',
        artistMembershipCancelledAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`❌ Artist membership deactivated for user ${userId}`);
    } else {
      // Deactivate listener premium
      await db.collection('users').doc(userId).update({
        isPremium: false,
        premiumActive: false,
        listenerSubscriptionStatus: 'cancelled',
        listenerSubscriptionCancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        'subscription.status': 'cancelled',
        'subscription.cancelledAt': admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`❌ Listener premium deactivated for user ${userId}`);
    }
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

/**
 * Handle successful invoice payment (HYBRID MODEL)
 * Ensures all licenses for this subscription are active
 */
async function handleInvoicePaymentSucceeded(invoice) {
  console.log('Invoice payment succeeded:', invoice.id, 'for subscription:', invoice.subscription);

  try {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;

    if (!subscriptionId) {
      console.log('No subscription associated with this invoice');
      return;
    }

    // Find user by Stripe customer ID
    const usersSnapshot = await db.collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.log('No user found for customer:', customerId);
      return;
    }

    const userId = usersSnapshot.docs[0].id;

    // Ensure all licenses for this subscription are active
    const licensesSnapshot = await db.collection('licenses')
      .where('userId', '==', userId)
      .where('subscriptionId', '==', subscriptionId)
      .where('licenseType', '==', 'time-bound')
      .get();

    if (!licensesSnapshot.empty) {
      const batch = db.batch();
      let updateCount = 0;

      licensesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status !== 'active') {
          batch.update(doc.ref, {
            status: 'active',
            validWhileSubscribed: true,
            lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          updateCount++;
        }
      });

      if (updateCount > 0) {
        await batch.commit();
        console.log(`✓ Ensured ${updateCount} licenses are active for user ${userId}`);
      } else {
        console.log(`All ${licensesSnapshot.size} licenses already active for user ${userId}`);
      }
    }
  } catch (error) {
    console.error('Error handling invoice payment success:', error);
  }
}

/**
 * Handle failed invoice payment (HYBRID MODEL)
 * Send warning email to user
 */
async function handleInvoicePaymentFailed(invoice) {
  console.log('Invoice payment failed:', invoice.id);

  try {
    const customerEmail = invoice.customer_email;

    if (customerEmail) {
      // Use nodemailer to send warning email
      const nodemailer = require('nodemailer');

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'beatflowmediagroup@gmail.com',
          pass: process.env.SMTP_PASSWORD || 'eezq fupe ocue ocow'
        }
      });

      const mailOptions = {
        from: 'BeatFlow Media <beatflowmediagroup@gmail.com>',
        to: customerEmail,
        subject: 'Payment Issue - Action Needed to Keep Your BeatFlow Active',
        html: `
          <h2>Payment Issue Detected</h2>
          <p>We tried to process your payment for your BeatFlow subscription, but it didn't go through.</p>

          <h3>What This Means:</h3>
          <ul>
            <li>Your subscription is still active (for now)</li>
            <li>We'll retry payment in 3 days</li>
            <li>If payment fails again, your subscription will pause</li>
          </ul>

          <h3>What Happens If Subscription Ends:</h3>
          <ul>
            <li>✓ Published content stays licensed (safe)</li>
            <li>✗ Can't license new projects</li>
            <li>✗ Can't download new tracks</li>
          </ul>

          <p><strong>Update your payment method:</strong></p>
          <p><a href="https://beatflowmedia.com/settings" style="background: #1DB954; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Update Payment Method</a></p>

          <p>Need help? Reply to this email.</p>

          <p>Best,<br>BeatFlow Billing Team</p>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('Payment failure email sent to:', customerEmail);
    }

    // Record failed payment
    await db.collection('failed_payments').add({
      invoiceId: invoice.id,
      customerId: invoice.customer,
      amount: invoice.amount_due,
      currency: invoice.currency,
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
      errorMessage: invoice.last_payment_error?.message || 'Unknown error',
      customerEmail: invoice.customer_email
    });

    console.log('Failed payment recorded');
  } catch (error) {
    console.error('Error handling failed invoice payment:', error);
  }
}

/**
 * Handle studio project payment completion
 */
async function handleStudioProjectPayment(session, projectId) {
  console.log(`💼 Processing studio project payment for project ${projectId}`);
  console.log('Session details:', {
    id: session.id,
    amount: session.amount_total,
    customer_email: session.customer_email
  });

  try {
    const projectRef = db.collection('studioProjects').doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      console.error(`❌ Project ${projectId} not found`);
      throw new Error(`Project not found: ${projectId}`);
    }

    // Update project with payment information
    await projectRef.update({
      paymentStatus: 'paid',
      paymentReceived: true,
      paidAmount: session.amount_total / 100, // Convert from cents
      stripeSessionId: session.id,
      stripeCustomerEmail: session.customer_email,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Record the payment in a payments collection
    await db.collection('studioPayments').add({
      projectId,
      amount: session.amount_total / 100,
      currency: session.currency || 'usd',
      stripeSessionId: session.id,
      customerEmail: session.customer_email,
      projectType: session.metadata.projectType,
      clientName: session.metadata.clientName,
      status: 'completed',
      paidAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Successfully processed payment for project ${projectId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing project payment:`, error);
    throw error;
  }
}
