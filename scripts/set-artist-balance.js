// scripts/set-artist-balance.js
// Set artist balance to a specific amount for testing
// Run with: node scripts/set-artist-balance.js <amount>
// Example: node scripts/set-artist-balance.js 3000

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

async function setArtistBalance(artistId, amount) {
  console.log(`💰 Setting balance for artist: ${artistId}\n`);

  try {
    // Get current balance
    const balanceDoc = await db.collection('artistBalances').doc(artistId).get();

    if (balanceDoc.exists) {
      const currentBalance = balanceDoc.data();
      console.log('📊 Current balance:');
      console.log(`   Available: $${(currentBalance.availableBalance || 0).toFixed(2)}`);
      console.log(`   Total Earnings: $${(currentBalance.totalEarnings || 0).toFixed(2)}`);
      console.log(`   Total Paid Out: $${(currentBalance.totalPaidOut || 0).toFixed(2)}`);
      console.log();
    }

    // Update balance
    await db.collection('artistBalances').doc(artistId).set({
      availableBalance: amount,
      totalEarnings: amount,
      totalPaidOut: 0,
      completedPayouts: 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('✅ Balance updated:');
    console.log(`   Available: $${amount.toFixed(2)}`);
    console.log(`   Total Earnings: $${amount.toFixed(2)}`);
    console.log(`   Total Paid Out: $0.00`);
    console.log();
    console.log('✅ Done! Balance has been set.');

  } catch (error) {
    console.error('❌ Error setting balance:', error);
    throw error;
  }
}

// Get artist ID and amount from command line
const artistId = 'qOeXglBQj8NMyqk3XI1i9T6fIKK2'; // percyricemusic@gmail.com
const amount = parseFloat(process.argv[2]) || 3000.00;

setArtistBalance(artistId, amount)
  .then(() => {
    console.log('🎉 Complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
