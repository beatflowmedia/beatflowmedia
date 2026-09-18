// fix-song-prices.js
// Script to update all song prices to $29.00 (2900 cents)

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const SONG_PRICE = 2900; // $29.00 in cents

async function fixSongPrices() {
  try {
    console.log('🔍 Fetching all songs...');

    const songsSnapshot = await db.collection('songs').get();
    console.log(`📊 Found ${songsSnapshot.size} songs`);

    let updatedCount = 0;
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of songsSnapshot.docs) {
      const song = doc.data();
      const currentPrice = song.price;

      // Check if price needs updating
      if (!currentPrice || currentPrice !== SONG_PRICE) {
        console.log(`Updating ${doc.id}: ${song.title || 'Untitled'}`);
        console.log(`  Old price: ${currentPrice || 'not set'} cents`);
        console.log(`  New price: ${SONG_PRICE} cents ($29.00)`);

        batch.update(doc.ref, { price: SONG_PRICE });
        updatedCount++;
        batchCount++;

        // Commit batch every 500 operations (Firestore limit)
        if (batchCount >= 500) {
          await batch.commit();
          console.log(`✅ Committed batch of ${batchCount} updates`);
          batch = db.batch();
          batchCount = 0;
        }
      }
    }

    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Committed final batch of ${batchCount} updates`);
    }

    console.log(`\n✅ Successfully updated ${updatedCount} songs to $29.00`);
    console.log(`ℹ️  ${songsSnapshot.size - updatedCount} songs already had correct price`);

  } catch (error) {
    console.error('❌ Error fixing song prices:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
fixSongPrices();
