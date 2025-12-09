// Netlify Function: api/stripe/payouts.js
// Fetches payout history, wallet balance, and ledger for a curator/artist from Stripe

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  try {
    const { userId, stripeAccountId } = event.queryStringParameters || {};
    if (!stripeAccountId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing stripeAccountId' })
      };
    }

    // Fetch balance
    const balance = await stripe.balance.retrieve({ stripeAccount: stripeAccountId });

    // Fetch payouts
    const payouts = await stripe.payouts.list({ stripeAccount: stripeAccountId, limit: 20 });

    // Fetch transactions (ledger)
    const transactions = await stripe.balanceTransactions.list({ stripeAccount: stripeAccountId, limit: 50 });

    return {
      statusCode: 200,
      body: JSON.stringify({
        balance,
        payouts: payouts.data,
        ledger: transactions.data
      })
    };
  } catch (error) {
    console.error('Stripe payout API error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
