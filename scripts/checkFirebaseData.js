/**
 * Quick diagnostic script to check what's in Firebase Firestore
 * Usage: node scripts/checkFirebaseData.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    serviceAccount = require('../serviceAccountKey.json');
  }
} catch (error) {
  console.error('❌ Could not load service account key');
  console.log('Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable or create serviceAccountKey.json');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'beatflowmedia.firebasestorage.app'
});

const db = admin.firestore();
const storage = admin.storage();

async function checkFirestore() {
  console.log('\n📊 Checking Firestore Collections...\n');

  // Check songs collection
  const songsSnapshot = await db.collection('songs').limit(5).get();
  console.log(`✓ Songs collection: ${songsSnapshot.size} documents (showing first 5)`);
  if (!songsSnapshot.empty) {
    songsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.title} by ${data.artist || data.artistName}`);
    });
  }

  // Check artists collection
  const artistsSnapshot = await db.collection('artists').limit(5).get();
  console.log(`\n✓ Artists collection: ${artistsSnapshot.size} documents (showing first 5)`);
  if (!artistsSnapshot.empty) {
    artistsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.name}`);
    });
  }

  // Get total counts
  const allSongs = await db.collection('songs').count().get();
  const allArtists = await db.collection('artists').count().get();

  console.log(`\n📈 Total counts:`);
  console.log(`  - Songs: ${allSongs.data().count}`);
  console.log(`  - Artists: ${allArtists.data().count}`);
}

async function checkStorage() {
  console.log('\n📦 Checking Firebase Storage...\n');

  const bucket = storage.bucket();

  // Check audio folder
  const [audioFiles] = await bucket.getFiles({ prefix: 'audio/', maxResults: 10 });
  console.log(`✓ Audio files: ${audioFiles.length} (showing first 10)`);
  audioFiles.forEach(file => {
    console.log(`  - ${file.name}`);
  });

  // Check artist-uploads
  const [uploads] = await bucket.getFiles({ prefix: 'artist-uploads/', maxResults: 10 });
  console.log(`\n✓ Artist uploads: ${uploads.length} (showing first 10)`);
  uploads.forEach(file => {
    console.log(`  - ${file.name}`);
  });
}

(async () => {
  try {
    await checkFirestore();
    await checkStorage();

    console.log('\n✅ Diagnostic complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
})();
