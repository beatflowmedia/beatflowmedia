// Check song audio URLs in Firestore
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, limit, getDocs } = require('firebase/firestore');

// Use your existing Firebase config
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

async function checkSongs() {
  try {
    const songsRef = collection(db, 'songs');
    const q = query(songsRef, limit(15));
    const snapshot = await getDocs(q);

    console.log(`\nChecking ${snapshot.size} songs for audio URLs:\n`);

    let withAudio = 0;
    let missingAudio = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      const hasAudio = !!(data.url || data.audioUrl || data.streamUrl || data.src);

      if (hasAudio) withAudio++;
      else missingAudio++;

      console.log(`\n=== ${data.title} by ${data.artist} ===`);
      console.log(`Has Audio: ${hasAudio ? '✓ YES' : '✗ NO'}`);
      console.log(`url: ${data.url ? '✓' : '✗'}`);
      console.log(`audioUrl: ${data.audioUrl ? '✓' : '✗'}`);
      console.log(`streamUrl: ${data.streamUrl ? '✓' : '✗'}`);
      console.log(`src: ${data.src ? '✓' : '✗'}`);
      if (hasAudio) {
        console.log(`Audio path: ${data.url || data.audioUrl || data.streamUrl || data.src}`);
      }
    });

    console.log(`\n\nSummary:`);
    console.log(`With Audio: ${withAudio}`);
    console.log(`Missing Audio: ${missingAudio}`);

    process.exit(0);
  } catch (error) {
    console.error('Error checking songs:', error);
    process.exit(1);
  }
}

checkSongs();
