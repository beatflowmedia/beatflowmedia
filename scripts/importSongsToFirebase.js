/**
 * Script to import songs from musicData.json into Firebase Firestore
 *
 * Usage: node scripts/importSongsToFirebase.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// Make sure you have FIREBASE_SERVICE_ACCOUNT_KEY environment variable set
// or a serviceAccountKey.json file in the project root
let serviceAccount;

try {
  // Try to load from environment variable first
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    // Fall back to local file
    serviceAccount = require('../serviceAccountKey.json');
  }
} catch (error) {
  console.error('Error loading service account key:', error.message);
  console.log('\nPlease set FIREBASE_SERVICE_ACCOUNT_KEY environment variable or create serviceAccountKey.json');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Load musicData.json
const musicDataPath = path.join(__dirname, '..', 'src', 'musicData.json');
const musicData = JSON.parse(fs.readFileSync(musicDataPath, 'utf8'));

console.log(`Found ${musicData.length} songs in musicData.json`);

async function importSongs() {
  const batch = db.batch();
  let count = 0;
  const batchSize = 500; // Firestore batch limit

  for (let i = 0; i < musicData.length; i++) {
    const song = musicData[i];

    // Create a document ID from the song's unique properties
    let docId = song.id;
    if (!docId || typeof docId !== 'string' || docId.trim() === '') {
      // Generate ID from artist and title
      const artist = (song.artist || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
      const title = (song.title || 'Untitled').replace(/[^a-zA-Z0-9]/g, '_');
      docId = `${artist}_${title}_${i}`;
    }
    const songRef = db.collection('songs').doc(docId);

    // Prepare song data with proper field names for Firebase
    const songData = {
      title: song.title || 'Untitled',
      artist: song.artist || 'Unknown Artist',
      artistName: song.artist || 'Unknown Artist', // For querying by name
      album: song.album || '',
      category: song.category || 'Uncategorized',
      cover: song.cover || '/images/Logo.png',
      coverUrl: song.cover || '/images/Logo.png',
      fileName: song.fileName || '',
      audioUrl: song.audioUrl || `/music/${song.fileName}`, // Path to audio file
      duration: song.duration || 0,
      playCount: song.playCount || 0,
      likes: song.likes || 0,
      releaseDate: song.releaseDate ? admin.firestore.Timestamp.fromDate(new Date(song.releaseDate)) : admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      // Additional metadata
      biography: song.biography || '',
      credits: song.credits || [],
      searchTerms: [
        song.title?.toLowerCase(),
        song.artist?.toLowerCase(),
        song.album?.toLowerCase()
      ].filter(Boolean)
    };

    batch.set(songRef, songData, { merge: true });
    count++;

    // Commit batch every 500 documents (Firestore limit)
    if (count % batchSize === 0) {
      console.log(`Committing batch of ${batchSize} songs...`);
      await batch.commit();
      console.log(`✓ Imported ${count} / ${musicData.length} songs`);
    }
  }

  // Commit remaining documents
  if (count % batchSize !== 0) {
    await batch.commit();
  }

  console.log(`\n✓ Successfully imported ${count} songs to Firebase!`);
}

async function importArtists() {
  console.log('\nCreating artist documents...');

  // Extract unique artists from songs
  const artistSet = new Set();
  const artistsData = {};

  musicData.forEach(song => {
    if (song.artist && !artistSet.has(song.artist)) {
      artistSet.add(song.artist);
      artistsData[song.artist] = {
        name: song.artist,
        bio: song.biography || 'No biography available.',
        profileImage: song.cover || '/images/Logo.png',
        cover: song.cover || '/images/Logo.png',
        genre: song.category || 'Uncategorized',
        followers: 0,
        monthlyListeners: 0,
        featured: false,
        createdAt: admin.firestore.Timestamp.now(),
        searchTerms: [song.artist.toLowerCase()]
      };
    }
  });

  const batch = db.batch();
  let count = 0;

  for (const [artistName, artistData] of Object.entries(artistsData)) {
    const docId = artistName.replace(/[^a-zA-Z0-9]/g, '_');
    const artistRef = db.collection('artists').doc(docId);
    batch.set(artistRef, artistData, { merge: true });
    count++;
  }

  await batch.commit();
  console.log(`✓ Created ${count} artist documents`);
}

// Run the import
(async () => {
  try {
    console.log('Starting Firebase import...\n');

    await importSongs();
    await importArtists();

    console.log('\n✓ Import completed successfully!');
    console.log('\nYou can now refresh your app to see the songs.');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Import failed:', error);
    process.exit(1);
  }
})();
