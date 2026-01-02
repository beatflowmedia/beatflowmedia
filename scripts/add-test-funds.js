// scripts/add-test-funds.js
// Add test funds to platform balance by creating a test charge
// This allows testing real Stripe transfers
// Run with: node scripts/add-test-funds.js

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function addTestFunds() {
  console.log('💰 Adding test funds to platform balance...\n');

  try {
    // Amount to add (in cents)
    const amount = 300000; // $3000.00

    // Create a charge using the special test card for adding to available balance
    const charge = await stripe.charges.create({
      amount: amount,
      currency: 'usd',
      source: 'tok_bypassPending', // Special token that bypasses pending balance
      description: 'Test funds for artist payouts',
      metadata: {
        purpose: 'test_balance',
        note: 'Adding funds to test artist payout system'
      }
    });

    console.log('✅ Test charge created successfully!');
    console.log(`   Charge ID: ${charge.id}`);
    console.log(`   Amount: $${(charge.amount / 100).toFixed(2)}`);
    console.log(`   Status: ${charge.status}`);
    console.log();

    // Check balance
    const balance = await stripe.balance.retrieve();
    console.log('📊 Platform balance:');
    console.log(`   Available: $${(balance.available[0].amount / 100).toFixed(2)} ${balance.available[0].currency.toUpperCase()}`);
    console.log(`   Pending: $${(balance.pending[0].amount / 100).toFixed(2)} ${balance.pending[0].currency.toUpperCase()}`);
    console.log();
    console.log('✅ Funds added! You can now test real Stripe transfers.');

  } catch (error) {
    console.error('❌ Error adding test funds:', error.message);
    console.log();
    console.log('💡 Alternative: Use Stripe Dashboard');
    console.log('   1. Go to: https://dashboard.stripe.com/test/balance/overview');
    console.log('   2. Click "Add funds"');
    console.log('   3. Enter $3000.00');
    console.log('   4. Use test card: 4000000000000077');
    throw error;
  }
}

addTestFunds()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch(error => {
    process.exit(1);
  });
