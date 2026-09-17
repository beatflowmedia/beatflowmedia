// Script to fix missing album covers
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCoXc1YonnH1uW3P4OlAO6eAi911DdyHgs",
  authDomain: "beatflowmedia.firebaseapp.com",
  projectId: "beatflowmedia",
  storageBucket: "beatflowmedia.firebasestorage.app",
  messagingSenderId: "770153949772",
  appId: "1:770153949772:web:0034a30777827ae7dce2e9",
  measurementId: "G-11SMJF5YQR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DEFAULT_COVER = '/images/Logo.png';

async function fixAlbumCovers() {
  console.log('🔍 Checking albums for missing covers...\n');

  try {
    // Get all albums
    const albumsRef = collection(db, 'albums');
    const snapshot = await getDocs(albumsRef);

    console.log(`📚 Found ${snapshot.size} albums total\n`);

    let updatedCount = 0;
    let alreadyHasCover = 0;
    const albumsToUpdate = [];

    // Check each album
    snapshot.forEach((albumDoc) => {
      const album = albumDoc.data();
      const albumId = albumDoc.id;

      if (!album.cover || album.cover === '' || album.cover === '/default-album-cover.jpg') {
        albumsToUpdate.push({
          id: albumId,
          title: album.title || 'Untitled',
          currentCover: album.cover || 'none'
        });
      } else {
        alreadyHasCover++;
      }
    });

    console.log(`✅ Albums with covers: ${alreadyHasCover}`);
    console.log(`❌ Albums missing covers: ${albumsToUpdate.length}\n`);

    if (albumsToUpdate.length === 0) {
      console.log('🎉 All albums already have covers!');
      process.exit(0);
    }

    // Display albums that need updating
    console.log('Albums to update:');
    albumsToUpdate.forEach((album, index) => {
      console.log(`  ${index + 1}. "${album.title}" (ID: ${album.id}) - Current: ${album.currentCover}`);
    });

    console.log(`\n📝 Updating ${albumsToUpdate.length} albums...\n`);

    // Update albums
    for (const album of albumsToUpdate) {
      try {
        const albumRef = doc(db, 'albums', album.id);
        await updateDoc(albumRef, {
          cover: DEFAULT_COVER,
          updatedAt: new Date()
        });
        updatedCount++;
        console.log(`✓ Updated "${album.title}"`);
      } catch (error) {
        console.error(`✗ Failed to update "${album.title}":`, error.message);
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} album covers!`);
    console.log(`📍 Default cover set to: ${DEFAULT_COVER}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
fixAlbumCovers();
