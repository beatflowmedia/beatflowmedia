// Debug script to check Firebase songs
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

async function debugFirebaseSongs() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const songsSnapshot = await getDocs(collection(db, 'songs'));

    console.log('Total songs in Firebase:', songsSnapshot.size);
    console.log('\n=== All songs ===');

    songsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n${index + 1}. ID: ${doc.id}`);
      console.log('   Artist field:', data.artist);
      console.log('   ArtistName field:', data.artistName);
      console.log('   Title:', data.title);
      console.log('   All fields:', Object.keys(data));
    });

    // Find SYNNE specifically
    const synneSongs = songsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.artist === 'SYNNE' || data.artistName === 'SYNNE' ||
             data.artist?.toLowerCase() === 'synne' || data.artistName?.toLowerCase() === 'synne';
    });

    console.log('\n\n=== SYNNE songs ===');
    console.log('Found', synneSongs.length, 'songs for SYNNE');
    synneSongs.forEach(doc => {
      console.log(doc.data());
    });

  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

debugFirebaseSongs();
