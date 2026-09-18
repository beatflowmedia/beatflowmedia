// Clear all songs from Firestore
// Run with: ADMIN_PASSWORD=your_password node src/scripts/clear-songs.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, writeBatch, doc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDtnxbpdH4vYaFRvLZZQRkzTJqO-7G2HKU",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "beatflowmedia.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "beatflowmedia",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "beatflowmedia.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "677720262738",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:677720262738:web:4c8a21db60f97b45cb6b48",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-H60TG6XY2G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function clearSongs() {
  console.log('🔥 Starting to clear songs collection...\n');

  try {
    // Authenticate as admin
    const adminEmail = process.env.ADMIN_EMAIL || 'perriceconsulting@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('❌ Admin password required');
      console.error('Usage: ADMIN_PASSWORD=your_password node src/scripts/clear-songs.js');
      process.exit(1);
    }

    console.log('🔐 Authenticating as admin...');
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log(`✅ Authenticated as ${adminEmail}\n`);

    // Fetch all songs
    const songsRef = collection(db, 'songs');
    const snapshot = await getDocs(songsRef);

    if (snapshot.empty) {
      console.log('✅ No songs found. Collection is already empty.');
      return;
    }

    console.log(`📊 Found ${snapshot.size} song(s) to delete\n`);

    // Firestore batch limit is 500 operations
    const batchSize = 500;
    let deletedCount = 0;
    let batch = writeBatch(db);
    let batchCount = 0;

    for (const docSnap of snapshot.docs) {
      const songData = docSnap.data();
      console.log(`🗑️  Deleting: ${songData.title || songData.fileName || docSnap.id}`);

      batch.delete(doc(db, 'songs', docSnap.id));
      batchCount++;

      // Commit batch when it reaches the limit
      if (batchCount === batchSize) {
        await batch.commit();
        deletedCount += batchCount;
        console.log(`✅ Batch committed: ${deletedCount} songs deleted so far\n`);

        // Start new batch
        batch = writeBatch(db);
        batchCount = 0;
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
      deletedCount += batchCount;
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ SUCCESS');
    console.log('='.repeat(60));
    console.log(`Total songs deleted: ${deletedCount}`);
    console.log('Songs collection is now empty\n');

  } catch (error) {
    console.error('❌ Error clearing songs:', error);
    if (error.code === 'permission-denied') {
      console.error('\n⚠️  Permission denied. Make sure your Firestore rules allow deleting songs.');
      console.error('You may need to temporarily update your rules or use Firebase Admin SDK.');
    }
    process.exit(1);
  }
}

// Run the script
clearSongs()
  .then(() => {
    console.log('👋 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
