// Debug: Check if songs have playable audio URLs
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, limit, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCoXc1YonnH1uW3P4OlAO6eAi911DdyHgs",
  authDomain: "beatflowmedia.firebaseapp.com",
  projectId: "beatflowmedia",
  storageBucket: "beatflowmedia.firebasestorage.app",
  messagingSenderId: "770153949772",
  appId: "1:770153949772:web:0034a30777827ae7dce2e9",
  measurementId: "G-11SMJF5YQR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugAudio() {
  try {
    const songsRef = collection(db, 'songs');
    const q = query(songsRef, limit(3));
    const snapshot = await getDocs(q);

    console.log(`\n=== AUDIO DEBUG ===\n`);

    snapshot.forEach(doc => {
      const song = doc.data();
      const audioUrl = song.url || song.audioUrl || song.streamUrl || song.src;

      console.log(`Song: ${song.title}`);
      console.log(`  ID: ${doc.id}`);
      console.log(`  Has url: ${!!song.url}`);
      console.log(`  Has audioUrl: ${!!song.audioUrl}`);
      console.log(`  Has streamUrl: ${!!song.streamUrl}`);
      console.log(`  Has src: ${!!song.src}`);
      console.log(`  Final audio URL: ${audioUrl ? audioUrl.substring(0, 100) + '...' : 'NONE'}`);
      console.log(`  Should show play button: ${!!(song.url || song.audioUrl || song.src)}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugAudio();
