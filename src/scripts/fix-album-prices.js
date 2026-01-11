// Script to update album prices with .99 rounding
// Run with: node src/scripts/fix-album-prices.js

const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Calculate album price with .99 rounding
 * Formula: (trackCount × $1.99 × 0.75) rounded up to nearest .99
 */
function calculateAlbumPrice(trackCount) {
  if (!trackCount || trackCount < 1) {
    return 199; // Default to single song price
  }

  const SONG_PRICE = 199; // $1.99 in cents
  const ALBUM_DISCOUNT = 0.75; // 25% off

  // Calculate base price with album discount
  const basePrice = trackCount * SONG_PRICE * ALBUM_DISCOUNT;

  // Round up to nearest .99
  const dollars = Math.floor(basePrice / 100);
  return dollars * 100 + 99;
}

async function fixAlbumPrices() {
  try {
    console.log('🔍 Updating all album prices to .99 rounding...\n');

    const albumsSnapshot = await db.collection('albums').get();
    let updated = 0;
    let unchanged = 0;

    for (const doc of albumsSnapshot.docs) {
      const album = doc.data();
      const trackCount = album.trackCount || 10;
      const newPrice = calculateAlbumPrice(trackCount);
      const oldPrice = album.price || 0;

      if (oldPrice !== newPrice) {
        await doc.ref.update({ price: newPrice });
        console.log(`✅ Updated "${album.title}" (${trackCount} tracks)`);
        console.log(`   Old: $${(oldPrice / 100).toFixed(2)} → New: $${(newPrice / 100).toFixed(2)}`);
        updated++;
      } else {
        console.log(`⏭️  Unchanged "${album.title}" - already $${(newPrice / 100).toFixed(2)}`);
        unchanged++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Updated: ${updated} albums`);
    console.log(`   Unchanged: ${unchanged} albums`);
    console.log(`   Total: ${updated + unchanged} albums`);
    console.log('✅ Done!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAlbumPrices();
