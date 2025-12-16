// netlify/functions/create-checkout-session.js
// Create Stripe checkout session for premium subscriptions
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  console.log('🔔 create-checkout-session invoked');
  console.log('Event body:', event.body);

  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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

  try {
    const baseUrl = process.env.URL || 'https://beatflowmediagroup.com';

    const sessionConfig = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/explore-premium`,
    };

    // Add customer email and metadata if user info provided
    if (userEmail) {
      sessionConfig.customer_email = userEmail;
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
