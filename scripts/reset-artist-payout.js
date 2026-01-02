// scripts/reset-artist-payout.js
// Reset payout data for a specific artist to test payout flow again
// Run with: node scripts/reset-artist-payout.js

const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

async function resetArtistPayout(artistId) {
  console.log(`🔄 Resetting payout data for artist: ${artistId}\n`);

  try {
    // Get the artist balance
    const balanceDoc = await db.collection('artistBalances').doc(artistId).get();

    if (!balanceDoc.exists) {
      console.log('❌ Artist balance not found');
      return;
    }

    const balance = balanceDoc.data();
    console.log('📊 Current balance:');
    console.log(`   Available: $${(balance.availableBalance || 0).toFixed(2)}`);
    console.log(`   Total Earnings: $${(balance.totalEarnings || 0).toFixed(2)}`);
    console.log(`   Total Paid Out: $${(balance.totalPaidOut || 0).toFixed(2)}`);
    console.log();

    // Reset the balance - put paid out amount back into available
    const totalEarnings = balance.totalEarnings || 0;
    await db.collection('artistBalances').doc(artistId).update({
      availableBalance: totalEarnings,
      totalPaidOut: 0,
      completedPayouts: 0,
      lastPayoutAt: admin.firestore.FieldValue.delete(),
      lastPayoutAmount: admin.firestore.FieldValue.delete()
    });

    console.log('✅ Balance reset:');
    console.log(`   Available: $${totalEarnings.toFixed(2)}`);
    console.log(`   Total Paid Out: $0.00`);
    console.log();

    // Delete payout requests
    const payoutsQuery = await db.collection('payoutRequests')
      .where('artistId', '==', artistId)
      .get();

    if (payoutsQuery.size > 0) {
      console.log(`🗑️  Deleting ${payoutsQuery.size} payout request(s)...`);
      const batch = db.batch();
      payoutsQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log('✅ Payout requests deleted');
    } else {
      console.log('ℹ️  No payout requests found');
    }

    console.log('\n✅ Reset complete! Artist can now request payout again.');

  } catch (error) {
    console.error('❌ Error resetting payout:', error);
    throw error;
  }
}

// Get artist ID from command line or use default
const artistId = process.argv[2] || 'qOeXglBQj8NMyqk3XI1i9T6fIKK2'; // percyricemusic@gmail.com

resetArtistPayout(artistId)
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
