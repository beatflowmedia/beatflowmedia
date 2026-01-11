// One-time cleanup utility to remove duplicate songs from playlists
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

/**
 * Removes duplicate songs from all playlists
 * Run this once from browser console: window.cleanupPlaylistDuplicates()
 */
export async function cleanupPlaylistDuplicates() {
  console.log('🧹 Starting playlist duplicate cleanup...');

  let totalCleaned = 0;
  let totalPlaylists = 0;

  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // Get user's private playlists
      const privatePlaylistsRef = collection(db, 'users', userId, 'playlists');
      const privatePlaylistsSnap = await getDocs(privatePlaylistsRef);

      for (const playlistDoc of privatePlaylistsSnap.docs) {
        totalPlaylists++;
        const playlistData = playlistDoc.data();
        const songs = playlistData.songs || [];

        if (songs.length === 0) continue;

        // Remove duplicates while preserving order (keep first occurrence)
        const seen = new Set();
        const uniqueSongs = songs.filter(entry => {
          const songId = entry.songId || entry.id;
          if (!songId || seen.has(songId)) {
            return false;
          }
          seen.add(songId);
          return true;
        });

        // Update if duplicates were found
        if (uniqueSongs.length < songs.length) {
          const duplicatesRemoved = songs.length - uniqueSongs.length;
          console.log(`  ✅ Cleaned "${playlistData.name}" (private): removed ${duplicatesRemoved} duplicate(s)`);

          await updateDoc(doc(db, 'users', userId, 'playlists', playlistDoc.id), {
            songs: uniqueSongs
          });

          totalCleaned += duplicatesRemoved;
        }
      }
    }

    // Get all public playlists
    const publicPlaylistsRef = collection(db, 'playlists');
    const publicPlaylistsSnap = await getDocs(publicPlaylistsRef);

    for (const playlistDoc of publicPlaylistsSnap.docs) {
      totalPlaylists++;
      const playlistData = playlistDoc.data();
      const songs = playlistData.songs || [];

      if (songs.length === 0) continue;

      // Remove duplicates while preserving order (keep first occurrence)
      const seen = new Set();
      const uniqueSongs = songs.filter(entry => {
        const songId = entry.songId || entry.id;
        if (!songId || seen.has(songId)) {
          return false;
        }
        seen.add(songId);
        return true;
      });

      // Update if duplicates were found
      if (uniqueSongs.length < songs.length) {
        const duplicatesRemoved = songs.length - uniqueSongs.length;
        console.log(`  ✅ Cleaned "${playlistData.name}" (public): removed ${duplicatesRemoved} duplicate(s)`);

        await updateDoc(doc(db, 'playlists', playlistDoc.id), {
          songs: uniqueSongs
        });

        totalCleaned += duplicatesRemoved;
      }
    }

    console.log(`✅ Cleanup complete!`);
    console.log(`   📊 Total playlists scanned: ${totalPlaylists}`);
    console.log(`   🗑️  Total duplicates removed: ${totalCleaned}`);

    return { totalPlaylists, totalCleaned };

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Immediately attach to window when this module loads
(function() {
  if (typeof window !== 'undefined') {
    window.cleanupPlaylistDuplicates = cleanupPlaylistDuplicates;
    console.log('✅ cleanupPlaylistDuplicates() is now available in the console');
  }
})();
