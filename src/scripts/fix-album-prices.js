// Script to add price field to albums that don't have it
// Run with: node src/scripts/fix-album-prices.js

const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixAlbumPrices() {
  try {
    console.log('🔍 Finding albums without price field...');

    const albumsSnapshot = await db.collection('albums').get();
    let fixed = 0;
    let skipped = 0;

    for (const doc of albumsSnapshot.docs) {
      const album = doc.data();

      if (!album.price) {
        const trackCount = album.trackCount || 10;
        const albumPrice = Math.round(trackCount * 199 * 0.75); // trackCount × $1.99 × 0.75

        await doc.ref.update({ price: albumPrice });
        console.log(`✅ Updated album "${album.title}" (${trackCount} tracks) - Price: $${(albumPrice / 100).toFixed(2)}`);
        fixed++;
      } else {
        console.log(`⏭️  Skipped album "${album.title}" - already has price: $${(album.price / 100).toFixed(2)}`);
        skipped++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Fixed: ${fixed} albums`);
    console.log(`   Skipped: ${skipped} albums`);
    console.log('✅ Done!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAlbumPrices();
