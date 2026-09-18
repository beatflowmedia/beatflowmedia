const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');

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
  const snapshot = await getDocs(query(collection(db, 'songs'), limit(20)));
  console.log('🎵 Total songs found:', snapshot.size);
  console.log('');

  const grouped = {};
  snapshot.forEach(doc => {
    const data = doc.data();
    const album = data.album || data.albumTitle || 'No Album';
    if (!grouped[album]) {
      grouped[album] = [];
    }
    grouped[album].push({
      id: doc.id,
      title: data.title,
      artist: data.artist || data.artistName,
      albumId: data.albumId,
      cover: data.cover
    });
  });

  console.log('📁 Songs grouped by album:');
  Object.keys(grouped).forEach(album => {
    console.log('');
    console.log('Album:', album);
    console.log('  Songs:', grouped[album].length);
    grouped[album].slice(0, 5).forEach(song => {
      console.log('    -', song.title, 'by', song.artist);
      console.log('      albumId:', song.albumId || 'MISSING ❌');
      console.log('      cover:', song.cover ? 'Yes' : 'No');
    });
  });

  process.exit(0);
})();
