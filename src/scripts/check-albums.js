const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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
  const snapshot = await getDocs(collection(db, 'albums'));
  console.log(`📚 Total albums found: ${snapshot.size}\n`);

  snapshot.forEach(doc => {
    const data = doc.data();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Album: ${data.title || 'Untitled'}`);
    console.log(`ID: ${doc.id}`);
    console.log(`Artist: ${data.artist || data.artistName || 'Unknown'}`);
    console.log(`Track Count: ${data.trackCount || 0}`);
    console.log(`isAlbum: ${data.isAlbum === true ? '✅ YES' : '❌ NO'}`);
    console.log(`isVisible: ${data.isVisible !== false ? '✅ Visible' : '❌ Hidden'}`);
    console.log(`Cover: ${data.cover || data.coverUrl || 'No cover'}`);
    console.log('');
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n💡 Albums with isAlbum: true will show on /projects page');
  console.log('💡 Albums without isAlbum: true will only show on home page');

  process.exit(0);
})();
