const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixMissingCuratorProfile() {
  const userId = 'qOeXglBQj8NMyqk3XI1i9T6fIKK2';
  const email = 'percyricemusic@gmail.com';
  const name = 'Trending Songs (Music Production)';

  console.log('Creating missing curator profile...');
  console.log(`User ID: ${userId}`);
  console.log(`Email: ${email}`);
  console.log(`Name: ${name}\n`);

  // Get the application to get genres
  const appSnapshot = await db.collection('curatorApplications')
    .where('userId', '==', userId)
    .where('status', '==', 'approved')
    .limit(1)
    .get();

  if (appSnapshot.empty) {
    console.error('No approved application found for this user!');
    process.exit(1);
  }

  const app = appSnapshot.docs[0].data();

  // Create curator profile
  await db.collection('curators').doc(userId).set({
    userId: userId,
    name: name,
    email: email,
    genres: app.genres || [],
    approvedAt: admin.firestore.FieldValue.serverTimestamp(),
    walletBalance: 0,
    thisWeekEarnings: 0,
    totalEarnings: 0,
    status: 'active'
  });

  console.log('✅ Curator profile created successfully!');

  // Verify
  const curatorDoc = await db.collection('curators').doc(userId).get();
  if (curatorDoc.exists) {
    console.log('\nCurator profile data:');
    console.log(curatorDoc.data());
  }
}

fixMissingCuratorProfile().then(() => {
  console.log('\nDone!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
