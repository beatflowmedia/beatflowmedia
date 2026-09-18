// Create missing album documents from uploaded songs
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

export async function createMissingAlbums() {
  console.log('🔍 Checking for songs without albums...\n');

  try {
    // Get all songs
    const songsSnapshot = await getDocs(collection(db, 'songs'));
    console.log(`📚 Found ${songsSnapshot.size} total songs\n`);

    // Group songs by album name
    const albumGroups = {};
    songsSnapshot.forEach(doc => {
      const song = doc.data();
      const albumName = song.album || song.albumTitle || 'Untitled Album';

      if (!albumGroups[albumName]) {
        albumGroups[albumName] = {
          songs: [],
          artist: song.artist || song.artistName || 'Unknown Artist',
          cover: song.cover || null,
          genre: song.genre || null
        };
      }

      albumGroups[albumName].songs.push({
        id: doc.id,
        ...song
      });
    });

    console.log(`📁 Found ${Object.keys(albumGroups).length} unique albums:\n`);

    for (const [albumName, albumData] of Object.entries(albumGroups)) {
      console.log(`  - "${albumName}" (${albumData.songs.length} songs) by ${albumData.artist}`);
    }

    console.log('\n📝 Creating album documents...\n');

    let created = 0;
    let updated = 0;

    for (const [albumName, albumData] of Object.entries(albumGroups)) {
      try {
        // Create album document
        const albumDoc = await addDoc(collection(db, 'albums'), {
          title: albumName,
          artist: albumData.artist,
          artistName: albumData.artist,
          cover: albumData.cover || '/images/Logo.png',
          genre: albumData.genre,
          trackCount: albumData.songs.length,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isVisible: true,
          releaseDate: new Date().toISOString().split('T')[0]
        });

        console.log(`✓ Created album: "${albumName}" (ID: ${albumDoc.id})`);
        created++;

        // Update all songs with the album ID
        for (const song of albumData.songs) {
          await updateDoc(doc(db, 'songs', song.id), {
            albumId: albumDoc.id,
            album: albumName,
            updatedAt: serverTimestamp()
          });
          updated++;
        }

        console.log(`  ✓ Linked ${albumData.songs.length} songs to album`);

      } catch (error) {
        console.error(`✗ Failed to create album "${albumName}":`, error.message);
      }
    }

    console.log(`\n✅ Summary:`);
    console.log(`   Albums created: ${created}`);
    console.log(`   Songs updated: ${updated}`);

    return {
      success: true,
      albumsCreated: created,
      songsUpdated: updated
    };

  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
}
