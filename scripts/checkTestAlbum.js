/**
 * Check test album visibility status
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
    console.log('\n🔍 Checking "test" album visibility...\n');

    const albumDoc = await db.collection('albums').doc('MZaOE2XQ9TGTRzJzrIB7').get();

    if (!albumDoc.exists) {
      console.log('❌ Album not found!');
      process.exit(1);
    }

    const albumData = albumDoc.data();
    console.log('Album:', albumData.title);
    console.log('isVisible:', albumData.isVisible !== undefined ? albumData.isVisible : 'NOT SET (defaults to true)');
    console.log('');

    // Check its songs
    const songsQuery = await db.collection('songs')
      .where('albumId', '==', 'MZaOE2XQ9TGTRzJzrIB7')
      .get();

    console.log(`\nFound ${songsQuery.size} songs in this album:\n`);
    songsQuery.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.title}`);
      console.log(`    isVisible: ${data.isVisible !== undefined ? data.isVisible : 'NOT SET (defaults to true)'}`);
    });

    console.log('\n✅ Done!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
})();
