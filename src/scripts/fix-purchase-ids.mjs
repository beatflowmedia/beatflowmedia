// src/scripts/fix-purchase-ids.mjs
// Fix purchase itemIds to match Firestore song document IDs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import * as readline from 'readline';

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
const auth = getAuth(app);

// Prompt for credentials
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function authenticate() {
  console.log('🔐 Authentication required\n');
  const email = await question('Enter your email (perriceconsulting@gmail.com): ');
  const password = await question('Enter your password: ');

  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Authenticated successfully!\n');
    rl.close();
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    rl.close();
    process.exit(1);
  }
}

async function fixPurchaseIds() {
  try {
    console.log('🔧 Starting purchase ID fix...\n');

    // 1. Get all purchases
    const purchasesSnapshot = await getDocs(collection(db, 'purchases'));
    console.log(`📦 Found ${purchasesSnapshot.size} purchases\n`);

    // 2. Get all songs to create a mapping
    const songsSnapshot = await getDocs(collection(db, 'songs'));
    const songsByTitle = new Map();

    songsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const title = data.title;
      const artist = data.artistName || data.artist;
      const key = `${artist}_${title}`.toLowerCase().trim();
      songsByTitle.set(key, {
        firestoreId: doc.id,
        title: data.title,
        artist: artist,
        oldId: data.id // In case the song has an old id field
      });
    });

    console.log(`🎵 Loaded ${songsByTitle.size} songs from database\n`);

    let updated = 0;
    let skipped = 0;
    let notFound = 0;

    // 3. Update each purchase
    for (const purchaseDoc of purchasesSnapshot.docs) {
      const purchase = purchaseDoc.data();
      const itemName = purchase.itemName;
      const artistName = purchase.artistName;
      const oldItemId = purchase.itemId;

      console.log(`\n📝 Processing: "${itemName}" by ${artistName}`);
      console.log(`   Current itemId: ${oldItemId}`);

      // Try to find matching song
      const searchKey = `${artistName}_${itemName}`.toLowerCase().trim();
      const matchingSong = songsByTitle.get(searchKey);

      if (matchingSong) {
        const newItemId = matchingSong.firestoreId;

        if (oldItemId === newItemId) {
          console.log(`   ✓ Already correct`);
          skipped++;
        } else {
          // Update the purchase
          await updateDoc(doc(db, 'purchases', purchaseDoc.id), {
            itemId: newItemId,
            oldItemId: oldItemId, // Keep old ID for reference
            songId: newItemId // Also update songId field
          });
          console.log(`   ✅ Updated: ${oldItemId} → ${newItemId}`);
          updated++;
        }
      } else {
        console.log(`   ❌ No matching song found in database`);
        notFound++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped (already correct): ${skipped}`);
    console.log(`   ❌ Not found: ${notFound}`);
    console.log('='.repeat(60));

    if (updated > 0) {
      console.log('\n✨ Purchase IDs have been fixed! Purchased songs should now show as downloaded.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
(async () => {
  await authenticate();
  await fixPurchaseIds();
})();
