// src/scripts/update-song-prices.js
// Update all song prices to 99 cents ($0.99)

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCoXc1YonnH1uW3P4OlAO6eAi911DdyHgs",
  authDomain: "beatflowmedia.firebaseapp.com",
  projectId: "beatflowmedia",
  storageBucket: "beatflowmedia.appspot.com",
  messagingSenderId: "770153949772",
  appId: "1:770153949772:web:0034a30777827ae7dce2e9",
  measurementId: "G-11SMJF5YQR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updatePrices() {
  try {
    console.log('Starting price update...');

    const songsRef = collection(db, 'songs');
    const snapshot = await getDocs(songsRef);

    console.log(`Found ${snapshot.size} songs total`);

    let updated = 0;
    let skipped = 0;

    for (const songDoc of snapshot.docs) {
      const data = songDoc.data();
      const currentPrice = data.price;

      // Update if price is not 99
      if (currentPrice !== 99) {
        await updateDoc(doc(db, 'songs', songDoc.id), {
          price: 99
        });
        console.log(`✓ Updated ${songDoc.id} - "${data.title}" from ${currentPrice} to 99`);
        updated++;
      } else {
        skipped++;
      }
    }

    console.log('\n✅ Migration complete!');
    console.log(`   Updated: ${updated} songs`);
    console.log(`   Skipped: ${skipped} songs (already 99 cents)`);
    console.log(`   Total: ${snapshot.size} songs`);

  } catch (error) {
    console.error('❌ Error updating prices:', error);
  }
}

updatePrices();
