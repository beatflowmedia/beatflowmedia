// scripts/recalculate-artist-balances.js
// Migration script to recalculate artist balances using NET revenue formula
// Run with: node scripts/recalculate-artist-balances.js

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

// Stripe fee calculation (same as webhook)
function calculateStripeFee(grossAmount) {
  return (grossAmount * 0.029) + 0.30;
}

// Calculate NET artist payout
function calculateArtistPayout(grossAmount) {
  const stripeFee = calculateStripeFee(grossAmount);
  const netAmount = grossAmount - stripeFee;
  return netAmount * 0.70; // 70% of NET
}

async function recalculateArtistBalances() {
  console.log('🚀 Starting artist balance recalculation...\n');

  try {
    // Get all completed purchases
    const purchasesSnapshot = await db.collection('purchases')
      .where('status', '==', 'completed')
      .get();

    console.log(`📊 Found ${purchasesSnapshot.size} completed purchases\n`);

    // Group purchases by artist
    const artistPurchases = {};

    purchasesSnapshot.docs.forEach(doc => {
      const purchase = doc.data();
      const artistId = purchase.artistId;

      if (!artistId) {
        console.log(`⚠️  Purchase ${doc.id} has no artistId, skipping...`);
        return;
      }

      if (!artistPurchases[artistId]) {
        artistPurchases[artistId] = [];
      }

      artistPurchases[artistId].push({
        id: doc.id,
        ...purchase
      });
    });

    console.log(`👥 Found ${Object.keys(artistPurchases).length} artists with purchases\n`);

    // Recalculate balance for each artist
    for (const [artistId, purchases] of Object.entries(artistPurchases)) {
      console.log(`\n💰 Processing artist: ${artistId}`);
      console.log(`   ${purchases.length} purchase(s)`);

      let totalEarnings = 0;
      let recalculatedCount = 0;

      // Calculate earnings for each purchase
      for (const purchase of purchases) {
        const grossAmount = purchase.price || 0;

        // Check if this purchase already has correct NET calculation
        if (purchase.netAmount && purchase.artistPayout) {
          // Already has new calculation
          totalEarnings += purchase.artistPayout;
          console.log(`   ✓ Purchase ${purchase.id.substring(0, 8)}: $${purchase.artistPayout.toFixed(2)} (already migrated)`);
        } else {
          // Old purchase - recalculate with NET formula
          const newPayout = calculateArtistPayout(grossAmount);
          totalEarnings += newPayout;
          recalculatedCount++;

          const stripeFee = calculateStripeFee(grossAmount);
          const netAmount = grossAmount - stripeFee;

          console.log(`   🔄 Purchase ${purchase.id.substring(0, 8)}: $${grossAmount.toFixed(2)} → $${newPayout.toFixed(2)} (recalculated)`);
          console.log(`      Gross: $${grossAmount.toFixed(2)} - Stripe: $${stripeFee.toFixed(2)} = Net: $${netAmount.toFixed(2)}`);

          // Update the purchase document with new fields
          await db.collection('purchases').doc(purchase.id).update({
            stripeFee: stripeFee,
            netAmount: netAmount,
            platformFee: netAmount * 0.30,
            artistPayout: newPayout,
            migratedAt: admin.firestore.FieldValue.serverTimestamp(),
            migrationNote: 'Recalculated with NET revenue formula (Option A: 70% of net after Stripe fees)'
          });
        }
      }

      // Get existing balance to preserve paidOut amount
      const balanceDoc = await db.collection('artistBalances').doc(artistId).get();
      let totalPaidOut = 0;
      let completedPayouts = 0;

      if (balanceDoc.exists) {
        const existingBalance = balanceDoc.data();
        totalPaidOut = existingBalance.totalPaidOut || 0;
        completedPayouts = existingBalance.completedPayouts || 0;
      }

      const availableBalance = Math.max(0, totalEarnings - totalPaidOut);

      // Update artist balance
      await db.collection('artistBalances').doc(artistId).set({
        availableBalance: availableBalance,
        totalEarnings: totalEarnings,
        totalPaidOut: totalPaidOut,
        completedPayouts: completedPayouts,
        lastRecalculatedAt: admin.firestore.FieldValue.serverTimestamp(),
        recalculationNote: 'Migrated to NET revenue formula (Option A)',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log(`   ✅ Balance updated:`);
      console.log(`      Total Earnings: $${totalEarnings.toFixed(2)}`);
      console.log(`      Total Paid Out: $${totalPaidOut.toFixed(2)}`);
      console.log(`      Available: $${availableBalance.toFixed(2)}`);
      console.log(`      Recalculated: ${recalculatedCount} purchase(s)`);
    }

    console.log('\n✅ Migration complete!');
    console.log(`\nSummary:`);
    console.log(`- Artists processed: ${Object.keys(artistPurchases).length}`);
    console.log(`- Total purchases: ${purchasesSnapshot.size}`);
    console.log('\n💡 All artist balances now use NET revenue formula (70% after Stripe fees)\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
recalculateArtistBalances()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
