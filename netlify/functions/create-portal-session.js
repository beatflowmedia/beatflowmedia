// netlify/functions/create-portal-session.js
// Create Stripe customer portal session for subscription management
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
  console.log('🔔 create-portal-session invoked');

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
    console.log('📦 Event body:', event.body);

    const { userId } = JSON.parse(event.body);
    console.log('👤 User ID:', userId);

    if (!userId) {
      console.log('❌ Missing userId');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing userId' })
      };
    }

    // Get user document to find Stripe customer ID
    console.log('🔍 Fetching user document...');
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      console.log('❌ User not found in database');
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    const userData = userDoc.data();
    console.log('✅ User data retrieved, checking for customerId...');
    let customerId = userData.stripeCustomerId;

    if (!customerId) {
      console.log('❌ No Stripe customer ID found for user');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No Stripe customer ID found. Please subscribe to a plan first.' })
      };
    }

    console.log('💳 Stripe customer ID:', customerId);

    const baseUrl = process.env.URL || 'https://beatflowmediagroup.com';

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/profile`
    });

    console.log('✅ Created portal session:', session.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url })
    };
  } catch (error) {
    console.error('💥 Error creating portal session:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to create portal session'
      })
    };
  }
};
