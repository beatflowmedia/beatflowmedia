// netlify/functions/create-checkout-session.js
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  console.log('🔔 create-checkout-session invoked');
  console.log('Event body:', event.body);

  if (event.httpMethod !== 'POST') {
    console.log('⚠️ Wrong method:', event.httpMethod);
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body);
    console.log('Parsed data:', data);
  } catch (err) {
    console.error('❌ JSON parse error:', err);
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { priceId } = data;
  if (!priceId) {
    console.error('❌ Missing priceId');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing priceId' }),
    };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    });
    console.log('✅ Created session:', session.id);
    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id }),
    };
  } catch (err) {
    console.error('💥 Stripe error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create session' }),
    };
  }
};
