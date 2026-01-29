/**
 * Initialize Platform Stats Collection
 *
 * Creates aggregated statistics to avoid expensive count queries.
 * Run once to initialize, then update via Cloud Functions.
 *
 * Usage in browser console:
 * 1. Refresh browser
 * 2. Run: initializePlatformStats()
 */

import { db } from '../firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  Timestamp,
  query,
  where
} from 'firebase/firestore';

async function initializePlatformStats() {
  console.log('🔄 Initializing platform statistics...\n');

  try {
    // Count all collections
    console.log('📊 Counting documents...');

    const [
      songsSnapshot,
      albumsSnapshot,
      artistsSnapshot,
      usersSnapshot,
      playlistsSnapshot,
      submissionsSnapshot
    ] = await Promise.all([
      getDocs(collection(db, 'songs')),
      getDocs(collection(db, 'albums')),
      getDocs(collection(db, 'artists')),
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'playlists')),
      getDocs(query(
        collection(db, 'artistSubmissions'),
        where('status', 'in', ['approved', 'published'])
      ))
    ]);

    const stats = {
      // Content counts
      totalSongs: songsSnapshot.size,
      totalAlbums: albumsSnapshot.size,
      totalArtists: artistsSnapshot.size,
      totalPlaylists: playlistsSnapshot.size,

      // User counts
      totalUsers: usersSnapshot.size,
      totalSubmissions: submissionsSnapshot.size,

      // Calculated metrics
      songsPerArtist: artistsSnapshot.size > 0
        ? Math.round(songsSnapshot.size / artistsSnapshot.size)
        : 0,
      albumsPerArtist: artistsSnapshot.size > 0
        ? Math.round(albumsSnapshot.size / artistsSnapshot.size)
        : 0,

      // Metadata
      lastUpdated: Timestamp.now(),
      initializedAt: Timestamp.now()
    };

    // Write to Firestore
    await setDoc(doc(db, 'platformStats', 'global'), stats);

    console.log('✅ Platform stats initialized!\n');
    console.log('📊 Statistics:');
    console.log(`   Songs: ${stats.totalSongs}`);
    console.log(`   Albums: ${stats.totalAlbums}`);
    console.log(`   Artists: ${stats.totalArtists}`);
    console.log(`   Playlists: ${stats.totalPlaylists}`);
    console.log(`   Users: ${stats.totalUsers}`);
    console.log(`   Submissions: ${stats.totalSubmissions}`);
    console.log(`   Songs per Artist: ${stats.songsPerArtist}`);
    console.log(`   Albums per Artist: ${stats.albumsPerArtist}\n`);

    alert(`Platform stats initialized!\n\n` +
      `Songs: ${stats.totalSongs}\n` +
      `Albums: ${stats.totalAlbums}\n` +
      `Artists: ${stats.totalArtists}\n` +
      `Users: ${stats.totalUsers}`
    );

    return stats;

  } catch (error) {
    console.error('❌ Error initializing stats:', error);
    alert(`Error: ${error.message}`);
    throw error;
  }
}

// Make available globally
window.initializePlatformStats = initializePlatformStats;

export { initializePlatformStats };
