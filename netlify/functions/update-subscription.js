// netlify/functions/update-subscription.js
// Update user's Stripe subscription to a different plan
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY_BASE64
    ? Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf8')
    : process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
    })
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
  console.log('🔔 update-subscription invoked');

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { userId, newPriceId } = JSON.parse(event.body);
    console.log('📦 Request:', { userId, newPriceId });

    if (!userId || !newPriceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing userId or newPriceId' })
      };
    }

    // Get user document
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    const userData = userDoc.data();
    const subscription = userData.subscription;

    if (!subscription || !subscription.id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No active subscription found' })
      };
    }

    console.log('💳 Current subscription:', subscription.id);

    // Get current Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.id);

    if (!stripeSubscription || stripeSubscription.status !== 'active') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Subscription is not active' })
      };
    }

    console.log('🔄 Updating subscription to new price:', newPriceId);

    // Update subscription with new price
    // Stripe will automatically prorate the charges
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [{
        id: stripeSubscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'always_invoice', // Immediate proration
    });

    console.log('✅ Subscription updated successfully');

    // Update user document with new tier info
    // The webhook will handle full subscription sync, but we update tier immediately
    const tierMap = {
      [process.env.REACT_APP_STRIPE_STUDENT_PRICE_ID]: 'student',
      [process.env.REACT_APP_STRIPE_CREATOR_PRICE_ID]: 'creator',
      [process.env.REACT_APP_STRIPE_PRO_PRICE_ID]: 'pro',
      [process.env.REACT_APP_STRIPE_AGENCY_PRICE_ID]: 'agency'
    };

    const newTier = tierMap[newPriceId] || 'creator';

    await db.collection('users').doc(userId).update({
      'subscription.tier': newTier,
      'subscription.priceId': newPriceId,
      'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          tier: newTier,
          priceId: newPriceId
        }
      })
    };
  } catch (error) {
    console.error('💥 Error updating subscription:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to update subscription'
      })
    };
  }
};
