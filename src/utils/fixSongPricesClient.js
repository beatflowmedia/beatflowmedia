// src/utils/fixSongPricesClient.js
// Client-side script to update song prices
// Run this from browser console while logged in as admin

import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { SONG_PRICE } from './pricing';

export async function fixAllSongPrices() {
  console.log('🔍 Starting song price fix...');
  console.log(`Target price: ${SONG_PRICE} cents ($${(SONG_PRICE / 100).toFixed(2)})`);

  try {
    // Fetch all songs
    const songsSnapshot = await getDocs(collection(db, 'songs'));
    console.log(`📊 Found ${songsSnapshot.size} songs`);

    let updatedCount = 0;
    let correctCount = 0;
    let errors = [];

    for (const songDoc of songsSnapshot.docs) {
      const song = songDoc.data();
      const currentPrice = song.price;

      try {
        // Check if price needs updating
        if (!currentPrice || currentPrice !== SONG_PRICE) {
          console.log(`Updating: "${song.title || 'Untitled'}" (ID: ${songDoc.id})`);
          console.log(`  Old: ${currentPrice || 'not set'} cents → New: ${SONG_PRICE} cents`);

          await updateDoc(doc(db, 'songs', songDoc.id), {
            price: SONG_PRICE
          });

          updatedCount++;
        } else {
          correctCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating song ${songDoc.id}:`, error);
        errors.push({ id: songDoc.id, title: song.title, error: error.message });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 UPDATE SUMMARY:');
    console.log(`✅ Updated: ${updatedCount} songs`);
    console.log(`✓  Already correct: ${correctCount} songs`);
    console.log(`❌ Errors: ${errors.length} songs`);
    console.log('='.repeat(50));

    if (errors.length > 0) {
      console.log('\nErrors encountered:');
      errors.forEach(err => {
        console.log(`- ${err.title || err.id}: ${err.error}`);
      });
    }

    return {
      total: songsSnapshot.size,
      updated: updatedCount,
      correct: correctCount,
      errors: errors
    };

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

// Auto-run if imported in console
if (typeof window !== 'undefined') {
  window.fixAllSongPrices = fixAllSongPrices;
  console.log('💡 Run fixAllSongPrices() to update all song prices to $29.00');
}
