// Script to check database contents
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, limit } = require('firebase/firestore');

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

console.log('🔧 Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkDatabase() {
  console.log('\n📊 Checking Firestore collections...\n');

  const collections = ['albums', 'songs', 'playlists', 'users'];

  for (const collectionName of collections) {
    try {
      const q = query(collection(db, collectionName), limit(5));
      const snapshot = await getDocs(q);

      console.log(`\n📁 ${collectionName.toUpperCase()}: ${snapshot.size} documents (showing max 5)`);

      if (snapshot.size > 0) {
        snapshot.forEach((doc, index) => {
          const data = doc.data();
          console.log(`\n  ${index + 1}. ID: ${doc.id}`);
          console.log(`     Title/Name: ${data.title || data.name || data.displayName || 'N/A'}`);
          if (collectionName === 'albums') {
            console.log(`     Cover: ${data.cover || 'MISSING ❌'}`);
            console.log(`     Artist: ${data.artist || data.artistName || 'N/A'}`);
            console.log(`     Track Count: ${data.trackCount || 0}`);
          }
        });
      } else {
        console.log('     (empty)');
      }
    } catch (error) {
      console.error(`❌ Error reading ${collectionName}:`, error.message);
    }
  }

  process.exit(0);
}

checkDatabase();
