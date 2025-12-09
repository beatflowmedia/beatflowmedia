// Netlify Function: api/stripe/requestPayout.js
// Triggers a payout from a curator's Stripe account to their bank/card

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

exports.handler = async (event, context) => {
  try {
    const { userId, amount, method } = JSON.parse(event.body);
    if (!userId || !amount) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing userId or amount' })
      };
    }
    // Get Stripe account ID from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    const stripeAccountId = userDoc.data()?.stripeAccountId;
    if (!stripeAccountId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No Stripe account linked' })
      };
    }
    // Check payout eligibility
    const account = await stripe.accounts.retrieve(stripeAccountId);
    if (!account.payouts_enabled) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Stripe payouts not enabled for this account' })
      };
    }
    // Create payout (method: 'standard' or 'instant')
    const payout = await stripe.payouts.create({
      amount: Math.round(amount * 100), // convert to cents
      currency: 'usd',
      method: method || 'standard'
    }, { stripeAccount: stripeAccountId });
    // Optionally, log payout to Firestore
    await db.collection('payouts').add({
      userId,
      stripeAccountId,
      payoutId: payout.id,
      amount,
      method: method || 'standard',
      status: payout.status,
      createdAt: Date.now()
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ payoutId: payout.id, status: payout.status })
    };
  } catch (error) {
    console.error('Stripe payout error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
