// One-time script to set uploadedBy field for testing email notifications
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setUploadedBy() {
  try {
    // First, find the user ID for percyricemusic@gmail.com
    const usersSnapshot = await db.collection('users')
      .where('email', '==', 'percyricemusic@gmail.com')
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.log('❌ User percyricemusic@gmail.com not found in users collection');
      process.exit(1);
    }

    const userId = usersSnapshot.docs[0].id;
    console.log('✅ Found user ID:', userId);

    // Get all songs
    const songsSnapshot = await db.collection('songs').get();
    console.log(`Found ${songsSnapshot.size} songs`);

    // Update all songs to have uploadedBy field
    let updated = 0;
    const batch = db.batch();

    songsSnapshot.docs.forEach(doc => {
      const songRef = db.collection('songs').doc(doc.id);
      batch.update(songRef, {
        uploadedBy: userId
      });
      updated++;
    });

    await batch.commit();
    console.log(`✅ Updated ${updated} songs with uploadedBy: ${userId}`);
    console.log('✅ Now when you unpublish a song, an email will be sent to percyricemusic@gmail.com');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setUploadedBy();
