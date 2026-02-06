// netlify/functions/get-session.js
// Retrieve Stripe session metadata

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const sessionId = event.queryStringParameters?.session_id;

    if (!sessionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing session_id parameter' })
      };
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        id: session.id,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_email,
        metadata: session.metadata,
        mode: session.mode
      })
    };
  } catch (error) {
    console.error('Error retrieving session:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: error.message || 'Failed to retrieve session'
      })
    };
  }
};
