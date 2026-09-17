// Utility to fix missing album covers
import { db } from '../firebaseConfig';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const DEFAULT_COVER = '/images/Logo.png';

export async function fixAlbumCovers() {
  console.log('🔍 Checking albums for missing covers...\n');

  try {
    // Get all albums
    const albumsRef = collection(db, 'albums');
    const snapshot = await getDocs(albumsRef);

    console.log(`📚 Found ${snapshot.size} albums total\n`);

    let updatedCount = 0;
    const albumsToUpdate = [];

    // Check each album
    snapshot.forEach((albumDoc) => {
      const album = albumDoc.data();
      const albumId = albumDoc.id;

      if (!album.cover || album.cover === '' || album.cover === '/default-album-cover.jpg') {
        albumsToUpdate.push({
          id: albumId,
          title: album.title || 'Untitled',
          artist: album.artist || album.artistName || 'Unknown',
          currentCover: album.cover || 'none'
        });
      }
    });

    console.log(`✅ Albums with covers: ${snapshot.size - albumsToUpdate.length}`);
    console.log(`❌ Albums missing covers: ${albumsToUpdate.length}\n`);

    if (albumsToUpdate.length === 0) {
      console.log('🎉 All albums already have covers!');
      return { success: true, updated: 0, total: snapshot.size };
    }

    // Display albums that need updating
    console.log('Albums to update:');
    albumsToUpdate.forEach((album, index) => {
      console.log(`  ${index + 1}. "${album.title}" by ${album.artist} (ID: ${album.id})`);
    });

    console.log(`\n📝 Updating ${albumsToUpdate.length} albums...\n`);

    // Update albums
    for (const album of albumsToUpdate) {
      try {
        const albumRef = doc(db, 'albums', album.id);
        await updateDoc(albumRef, {
          cover: DEFAULT_COVER,
          title: album.title === 'Untitled' ? album.artist : album.title, // Fix title if missing
          updatedAt: new Date()
        });
        updatedCount++;
        console.log(`✓ Updated "${album.title}" by ${album.artist}`);
      } catch (error) {
        console.error(`✗ Failed to update "${album.title}":`, error.message);
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount}/${albumsToUpdate.length} album covers!`);
    console.log(`📍 Default cover set to: ${DEFAULT_COVER}`);

    return {
      success: true,
      updated: updatedCount,
      total: snapshot.size,
      failed: albumsToUpdate.length - updatedCount
    };

  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
}
