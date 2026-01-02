// scripts/setup-test-payout.js
// Creates test data for payout system testing

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setupTestPayout() {
  try {
    // Replace with your actual user ID (or use a test user)
    const testArtistId = process.argv[2] || 'TEST_ARTIST_ID';

    if (testArtistId === 'TEST_ARTIST_ID') {
      console.log('❌ Please provide an artist user ID:');
      console.log('   node scripts/setup-test-payout.js YOUR_USER_ID');
      process.exit(1);
    }

    console.log(`🎯 Setting up test payout for artist: ${testArtistId}`);

    // 1. Create test artist balance with $50
    await db.collection('artistBalances').doc(testArtistId).set({
      artistId: testArtistId,
      availableBalance: 50.00,
      totalEarnings: 50.00,
      totalPaidOut: 0,
      pendingAllocations: 10,
      completedPayouts: 0,
      lastEarningAt: admin.firestore.FieldValue.serverTimestamp(),
      lastEarningAmount: 5.00,
      stripeConnectAccountId: null, // Set this if artist has connected Stripe
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Created artist balance: $50.00');

    // 2. Create some test revenue allocations
    const allocations = [
      { itemType: 'song', artistAmount: 1.39, totalAmount: 1.99 },
      { itemType: 'song', artistAmount: 1.39, totalAmount: 1.99 },
      { itemType: 'album', artistAmount: 10.49, totalAmount: 14.99 },
      { itemType: 'song', artistAmount: 1.39, totalAmount: 1.99 },
      { itemType: 'song', artistAmount: 1.39, totalAmount: 1.99 }
    ];

    for (const allocation of allocations) {
      await db.collection('revenueAllocations').add({
        artistId: testArtistId,
        itemId: `test_item_${Date.now()}_${Math.random()}`,
        itemType: allocation.itemType,
        purchaseId: `test_purchase_${Date.now()}_${Math.random()}`,
        totalAmount: allocation.totalAmount,
        artistAmount: allocation.artistAmount,
        platformAmount: allocation.totalAmount - allocation.artistAmount,
        artistShare: 70,
        status: 'pending',
        allocatedAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          userId: 'test_buyer'
        }
      });
    }

    console.log('✅ Created 5 test revenue allocations');

    // 3. Show summary
    console.log('\n📊 Test Data Summary:');
    console.log('   Artist ID:', testArtistId);
    console.log('   Available Balance: $50.00');
    console.log('   Pending Allocations: 5 sales');
    console.log('   Status: Ready for payout (meets $10 minimum)');
    console.log('\n🎯 Next Steps:');
    console.log('   1. Sign in as this artist');
    console.log('   2. Connect Stripe account (or add test Stripe ID)');
    console.log('   3. Go to artist dashboard');
    console.log('   4. Click "Request Payout"');
    console.log('\n   Or test the API directly:');
    console.log(`   curl -X POST http://localhost:8888/.netlify/functions/request-payout \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"artistId":"${testArtistId}","requestedAmount":50}'`);

  } catch (error) {
    console.error('❌ Error setting up test:', error);
  } finally {
    process.exit(0);
  }
}

setupTestPayout();
