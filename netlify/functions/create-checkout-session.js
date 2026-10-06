// netlify/functions/create-checkout-session.js
// Create Stripe checkout session for premium subscriptions
const Stripe = require('stripe');
const admin = require('firebase-admin');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const { requireSelf } = require('./lib/require-auth');

// require-auth verifies the caller's ID token through firebase-admin, so the SDK has to
// be initialised here. This function never needed it before, because it never checked
// who was calling.
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY_BASE64
    ? Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf8')
    : process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey
    })
  });
}

exports.handler = async (event) => {
  console.log('🔔 create-checkout-session invoked');
  console.log('Event body:', event.body);

  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod !== 'POST') {
    console.log('⚠️ Wrong method:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  let data;
  try {
    data = JSON.parse(event.body);
    console.log('Parsed data:', data);
  } catch (err) {
    console.error('❌ JSON parse error:', err);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON' })
    };
  }

  const { priceId, userId, userEmail } = data;
  if (!priceId) {
    console.error('❌ Missing priceId');
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing priceId' }),
    };
  }

  // This endpoint took `userId` and `userEmail` straight from the body and verified
  // nothing, so a caller could open a subscription against someone else's account.
  //
  // It also used to accept a request with NO userId at all -- StripeButton omitted it
  // when signed out. That is worse than it sounds: the subscription webhook activates
  // premium against a userId, so a signed-out checkout took the money and had no account
  // to attach it to. Requiring identity fixes the impersonation and that at once.
  const auth = await requireSelf(event, userId);
  if (!auth.ok) {
    return { ...auth.response, headers: { ...headers, ...(auth.response.headers || {}) } };
  }

  try {
    const baseUrl = process.env.URL || 'https://beatflowmediagroup.com';

    const sessionConfig = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/explore-premium`,
    };

    // For Stripe Accounts V2 test mode: must create or retrieve customer first
    if (userEmail) {
      console.log('🔍 Looking for existing customer with email:', userEmail);

      // Search for existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1
      });

      let customer;
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        console.log('✅ Found existing customer:', customer.id);
      } else {
        // Create new customer
        console.log('➕ Creating new customer for:', userEmail);
        customer = await stripe.customers.create({
          email: userEmail,
          metadata: userId ? { userId } : {}
        });
        console.log('✅ Created new customer:', customer.id);
      }

      // Use customer ID instead of customer_email for Accounts V2 compatibility
      sessionConfig.customer = customer.id;
    }

    if (userId) {
      sessionConfig.metadata = {
        userId,
        itemType: 'premium_subscription',
        priceId
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log('✅ Created session:', session.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sessionId: session.id }),
    };
  } catch (err) {
    console.error('💥 Stripe error:', err);
    console.error('Error details:', {
      message: err.message,
      type: err.type,
      code: err.code
    });
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: err.message || 'Failed to create session',
        type: err.type,
        code: err.code
      }),
    };
  }
};
