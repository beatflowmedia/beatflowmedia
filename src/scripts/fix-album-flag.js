const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyCoXc1YonnH1uW3P4OlAO6eAi911DdyHgs',
  authDomain: 'beatflowmedia.firebaseapp.com',
  projectId: 'beatflowmedia',
  storageBucket: 'beatflowmedia.firebasestorage.app',
  messagingSenderId: '770153949772',
  appId: '1:770153949772:web:0034a30777827ae7dce2e9'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

(async () => {
  console.log('🔧 Fixing album isAlbum flags...\n');

  const snapshot = await getDocs(collection(db, 'albums'));

  let updated = 0;
  for (const albumDoc of snapshot.docs) {
    const data = albumDoc.data();

    if (data.isAlbum !== true) {
      console.log(`Updating: ${data.title || 'Untitled'}`);
      await updateDoc(doc(db, 'albums', albumDoc.id), {
        isAlbum: true,
        isVisible: true
      });
      updated++;
      console.log(`  ✅ Set isAlbum: true\n`);
    }
  }

  console.log(`✅ Updated ${updated} album(s)`);
  console.log('\n💡 All albums will now appear on /projects page');

  process.exit(0);
})();
