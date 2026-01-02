// Create a test Stripe Connect account for Percy Rice (testing only)
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const artistId = 'qOeXglBQj8NMyqk3XI1i9T6fIKK2';

async function setup() {
  console.log('⚠️  WARNING: This is for TESTING ONLY');
  console.log('Creating mock Stripe Connect account for Percy Rice...\n');

  // For testing, we'll use a placeholder account ID
  // In production, this would come from actual Stripe API
  const mockStripeAccountId = 'acct_test_percy_rice_' + Date.now();

  // Update artistBalances with mock Stripe account
  await db.collection('artistBalances').doc(artistId).update({
    stripeConnectAccountId: mockStripeAccountId,
    stripeConnectStatus: 'test_mode',
    stripeConnectCreatedAt: admin.firestore.Timestamp.now()
  });

  // Also update users collection
  await db.collection('users').doc(artistId).set({
    email: 'percyricemusic@gmail.com',
    stripeConnectAccountId: mockStripeAccountId,
    stripeConnectStatus: 'test_mode',
    stripeConnectCreatedAt: admin.firestore.Timestamp.now()
  }, { merge: true });

  console.log('✅ Test Stripe account created!');
  console.log(`   Account ID: ${mockStripeAccountId}`);
  console.log(`   Artist: Percy Rice (${artistId})`);
  console.log('\n⚠️  NOTE: This is a MOCK account for UI testing only.');
  console.log('   Real payouts will NOT work with this account.');
  console.log('   To test real payouts, you must complete actual Stripe onboarding.\n');

  process.exit(0);
}

setup().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
