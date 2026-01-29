// Migration script to add artistImage field to all songs
// This syncs each song with its artist's profileImage

import { db } from '../firebaseConfig';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';

export async function migrateArtistImages() {
  console.log('🔄 Starting artist image migration...');

  try {
    // Get all songs
    const songsSnapshot = await getDocs(collection(db, 'songs'));
    console.log(`Found ${songsSnapshot.size} songs to process`);

    // Get all artists
    const artistsSnapshot = await getDocs(collection(db, 'artists'));
    const artistsMap = new Map();

    artistsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.name && data.profileImage) {
        artistsMap.set(data.name, data.profileImage);
      }
    });

    console.log(`Found ${artistsMap.size} artists with profile images`);

    // Update songs
    const updates = [];
    let matched = 0;
    let skipped = 0;

    songsSnapshot.forEach(songDoc => {
      const song = songDoc.data();
      const artistName = song.artist || song.artistName;

      if (artistName && artistsMap.has(artistName)) {
        const artistImage = artistsMap.get(artistName);
        updates.push(
          updateDoc(doc(db, 'songs', songDoc.id), {
            artistImage: artistImage,
            updatedAt: new Date()
          })
        );
        matched++;
      } else {
        skipped++;
      }
    });

    console.log(`Matched: ${matched}, Skipped: ${skipped}`);
    console.log('Executing updates...');

    // Execute in batches of 50
    const batchSize = 50;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      await Promise.all(batch);
      console.log(`✅ Updated ${Math.min(i + batchSize, updates.length)} / ${updates.length} songs`);
    }

    console.log('✅ Migration complete!');
    return {
      total: songsSnapshot.size,
      matched,
      skipped,
      updated: matched
    };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Make available in console
window.migrateArtistImages = migrateArtistImages;
