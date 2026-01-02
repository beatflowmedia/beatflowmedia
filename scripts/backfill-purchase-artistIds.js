// scripts/backfill-purchase-artistIds.js
// Backfill missing artistId field in purchase records
// Run with: node scripts/backfill-purchase-artistIds.js

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

async function backfillArtistIds() {
  console.log('🚀 Starting artistId backfill for purchases...\n');

  try {
    // Get all purchases without artistId
    const purchasesSnapshot = await db.collection('purchases')
      .where('status', '==', 'completed')
      .get();

    console.log(`📊 Found ${purchasesSnapshot.size} completed purchases\n`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const purchaseDoc of purchasesSnapshot.docs) {
      const purchase = purchaseDoc.data();
      const purchaseId = purchaseDoc.id;

      // Skip if already has artistId
      if (purchase.artistId) {
        skipped++;
        continue;
      }

      const itemId = purchase.itemId;
      const itemType = purchase.itemType;

      console.log(`🔍 Purchase ${purchaseId.substring(0, 8)}: ${itemType} "${purchase.itemName}"`);

      try {
        let artistId = null;

        // Lookup artist from the item (song or album)
        if (itemType === 'song') {
          const songDoc = await db.collection('songs').doc(itemId).get();
          if (songDoc.exists) {
            const songData = songDoc.data();
            artistId = songData.uploadedBy || songData.artistId;

            if (!artistId) {
              // Try to find artist by name
              const artistName = songData.artist || songData.artistName;
              if (artistName) {
                console.log(`   Looking up artist by name: "${artistName}"`);
                const artistsSnapshot = await db.collection('artists')
                  .where('name', '==', artistName)
                  .limit(1)
                  .get();

                if (!artistsSnapshot.empty) {
                  artistId = artistsSnapshot.docs[0].id;
                  console.log(`   Found artist: ${artistId}`);
                }
              }
            }
          }
        } else if (itemType === 'album') {
          const albumDoc = await db.collection('albums').doc(itemId).get();
          if (albumDoc.exists) {
            const albumData = albumDoc.data();
            artistId = albumData.uploadedBy || albumData.artistId;

            if (!artistId) {
              // Try to find artist by name
              const artistName = albumData.artistName || albumData.artist;
              if (artistName) {
                console.log(`   Looking up artist by name: "${artistName}"`);
                const artistsSnapshot = await db.collection('artists')
                  .where('name', '==', artistName)
                  .limit(1)
                  .get();

                if (!artistsSnapshot.empty) {
                  artistId = artistsSnapshot.docs[0].id;
                  console.log(`   Found artist: ${artistId}`);
                }
              }
            }
          }
        }

        if (artistId) {
          // Update purchase with artistId
          await db.collection('purchases').doc(purchaseId).update({
            artistId: artistId,
            backfilledAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`   ✅ Updated with artistId: ${artistId}\n`);
          updated++;
        } else {
          console.log(`   ⚠️  Could not find artistId for this purchase\n`);
          failed++;
        }
      } catch (error) {
        console.error(`   ❌ Error processing purchase ${purchaseId}:`, error.message);
        failed++;
      }
    }

    console.log('\n✅ Backfill complete!');
    console.log(`\nSummary:`);
    console.log(`- Total purchases: ${purchasesSnapshot.size}`);
    console.log(`- Updated: ${updated}`);
    console.log(`- Already had artistId: ${skipped}`);
    console.log(`- Failed to find artistId: ${failed}`);
    console.log('\n💡 Now run: node scripts/recalculate-artist-balances.js\n');

  } catch (error) {
    console.error('❌ Backfill failed:', error);
    throw error;
  }
}

// Run the backfill
backfillArtistIds()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
