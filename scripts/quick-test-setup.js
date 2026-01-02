// Quick test setup for Percy Rice
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const artistId = 'qOeXglBQj8NMyqk3XI1i9T6fIKK2';

async function setup() {
  console.log('Creating test balance for Percy Rice...');

  await db.collection('artistBalances').doc(artistId).set({
    artistId: artistId,
    availableBalance: 50.00,
    totalEarnings: 50.00,
    totalPaidOut: 0,
    pendingAllocations: 5,
    completedPayouts: 0,
    lastEarningAt: admin.firestore.Timestamp.now(),
    lastEarningAmount: 5.00,
    stripeConnectAccountId: null,
    createdAt: admin.firestore.Timestamp.now()
  });

  console.log('✅ Done! Balance: $50.00');
  process.exit(0);
}

setup().catch(err => {
  console.error(err);
  process.exit(1);
});
