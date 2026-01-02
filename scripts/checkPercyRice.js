/**
 * Check Percy Rice songs in Firestore
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
    console.log('\n🔍 Searching for Percy Rice songs...\n');

    // Query by artist name
    const percyQuery = await db.collection('songs')
      .where('artist', '==', 'Percy Rice')
      .get();

    console.log(`Found ${percyQuery.size} songs by artist name "Percy Rice":\n`);
    percyQuery.forEach(doc => {
      const data = doc.data();
      console.log(`  ID: ${doc.id}`);
      console.log(`  Title: ${data.title}`);
      console.log(`  Artist: ${data.artist}`);
      console.log(`  Album (name): ${data.album || 'NOT SET'}`);
      console.log(`  AlbumId (ref): ${data.albumId || 'NOT SET'}`);
      console.log(`  UploadedBy: ${data.uploadedBy || 'NOT SET'}`);
      console.log(`  isVisible: ${data.isVisible !== undefined ? data.isVisible : 'NOT SET (defaults to true)'}`);
      console.log('');
    });

    // Also check artistName field
    const percyQuery2 = await db.collection('songs')
      .where('artistName', '==', 'Percy Rice')
      .get();

    console.log(`Found ${percyQuery2.size} songs by artistName field "Percy Rice":\n`);
    percyQuery2.forEach(doc => {
      const data = doc.data();
      console.log(`  ID: ${doc.id}`);
      console.log(`  Title: ${data.title}`);
      console.log(`  UploadedBy: ${data.uploadedBy || 'NOT SET'}`);
      console.log('');
    });

    // Check for user with percyricemusic@gmail.com
    const usersQuery = await db.collection('users')
      .where('email', '==', 'percyricemusic@gmail.com')
      .get();

    console.log(`\nFound ${usersQuery.size} user(s) with email percyricemusic@gmail.com:\n`);
    usersQuery.forEach(doc => {
      console.log(`  UID: ${doc.id}`);
      console.log(`  Email: ${doc.data().email}`);
      console.log(`  Display Name: ${doc.data().displayName}`);
    });

    console.log('\n✅ Done!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
})();
