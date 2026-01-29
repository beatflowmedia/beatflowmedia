/**
 * Browser console helper to fix album-song relationships
 *
 * Usage in browser console:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire file
 * 3. Run: fixAlbumSongs()
 */

async function fixAlbumSongs() {
  // Get Firestore from window (React app should expose it)
  const { db } = await import('/src/firebaseConfig.js');
  const { collection, getDocs, doc, getDoc, updateDoc, query, where } = await import('firebase/firestore');

  console.log('🔧 Starting album-song relationship fix...\n');

  try {
    // Get all albums
    const albumsSnapshot = await getDocs(collection(db, 'albums'));
    console.log(`Found ${albumsSnapshot.size} albums\n`);

    for (const albumDoc of albumsSnapshot.docs) {
      const album = albumDoc.data();
      const albumId = albumDoc.id;

      console.log(`📀 Album: "${album.title}" (${albumId})`);
      console.log(`   Track count: ${album.trackCount || 0}`);

      // Check current songs with this albumId
      const currentSongsQuery = query(
        collection(db, 'songs'),
        where('albumId', '==', albumId)
      );
      const currentSongs = await getDocs(currentSongsQuery);
      console.log(`   Currently linked songs: ${currentSongs.size}`);

      // If album has songs array but they're not linked properly
      if (album.songs && Array.isArray(album.songs) && album.songs.length > 0) {
        console.log(`   Songs array has ${album.songs.length} IDs`);

        let updated = 0;
        for (const songId of album.songs) {
          try {
            const songRef = doc(db, 'songs', songId);
            const songDoc = await getDoc(songRef);

            if (songDoc.exists()) {
              const songData = songDoc.data();

              if (songData.albumId !== albumId) {
                await updateDoc(songRef, {
                  albumId: albumId,
                  albumTitle: album.title
                });
                console.log(`   ✅ Fixed: "${songData.title}"`);
                updated++;
              }
            }
          } catch (err) {
            console.error(`   ❌ Error with song ${songId}:`, err.message);
          }
        }

        if (updated > 0) {
          console.log(`   ✅ Updated ${updated} songs`);
        } else {
          console.log(`   ✓ All songs already correct`);
        }
      } else {
        console.log(`   ⚠️ No songs array found`);
      }

      console.log('');
    }

    console.log('✅ Fix complete! Refresh the page to see changes.\n');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Make it globally available
window.fixAlbumSongs = fixAlbumSongs;
console.log('✅ Helper loaded! Run: fixAlbumSongs()');
