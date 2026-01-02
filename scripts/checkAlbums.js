/**
 * Check album IDs in Firestore
 */
const admin = require('firebase-admin');

let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    serviceAccount = require('../serviceAccountKey.json');
  }
} catch (error) {
  console.error('❌ Could not load service account key');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

(async () => {
  try {
    console.log('\n🔍 Checking Percy Rice albums...\n');

    // Query by uploadedBy
    const albumsQuery = await db.collection('albums')
      .where('uploadedBy', '==', 'qOeXglBQj8NMyqk3XI1i9T6fIKK2')
      .get();

    console.log(`Found ${albumsQuery.size} albums:\n`);
    albumsQuery.forEach(doc => {
      const data = doc.data();
      console.log(`  Album ID: ${doc.id}`);
      console.log(`  Title: ${data.title}`);
      console.log(`  Artist: ${data.artist || data.artistName}`);
      console.log(`  isVisible: ${data.isVisible !== undefined ? data.isVisible : 'NOT SET (defaults to true)'}`);
      console.log(`  trackCount: ${data.trackCount || 0}`);
      console.log('');
    });

    // Now find all songs for these albums
    console.log('\n🔍 Checking songs for each album...\n');

    for (const albumDoc of albumsQuery.docs) {
      const albumData = albumDoc.data();
      console.log(`\n📀 Album: "${albumData.title}" (ID: ${albumDoc.id})`);

      const songsQuery = await db.collection('songs')
        .where('albumId', '==', albumDoc.id)
        .get();

      console.log(`   Found ${songsQuery.size} songs:`);
      songsQuery.forEach(songDoc => {
        const songData = songDoc.data();
        console.log(`   - ${songData.title} (isVisible: ${songData.isVisible !== false})`);
      });
    }

    console.log('\n✅ Done!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
})();
