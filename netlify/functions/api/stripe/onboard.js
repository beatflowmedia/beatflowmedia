// Netlify Function: api/stripe/onboard.js
// Creates a Stripe connected account and returns onboarding link

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

exports.handler = async (event, context) => {
  try {
    const { userId, email, role } = JSON.parse(event.body);
    if (!userId || !email || !role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing userId, email, or role' })
      };
    }

    // Create Stripe connected account
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      business_type: 'individual',
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      metadata: { userId, role }
    });

    // Save Stripe account ID to Firestore
    await db.collection('users').doc(userId).set({
      stripeAccountId: account.id,
      stripeOnboarded: false
    }, { merge: true });

    // Create account onboarding link
    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: process.env.STRIPE_ONBOARD_REFRESH_URL,
      return_url: process.env.STRIPE_ONBOARD_RETURN_URL,
      type: 'account_onboarding'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ accountId: account.id, onboardingUrl: link.url })
    };
  } catch (error) {
    console.error('Stripe onboarding error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
