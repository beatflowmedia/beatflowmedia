const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkCuratorApprovals() {
  console.log('Checking curator applications and user roles...\n');

  // Get all approved curator applications
  const applicationsSnapshot = await db.collection('curatorApplications')
    .where('status', '==', 'approved')
    .get();

  console.log(`Found ${applicationsSnapshot.size} approved curator applications\n`);

  for (const appDoc of applicationsSnapshot.docs) {
    const app = appDoc.data();
    console.log('─'.repeat(60));
    console.log(`Application ID: ${appDoc.id}`);
    console.log(`User ID: ${app.userId}`);
    console.log(`Email: ${app.email}`);
    console.log(`Name: ${app.name}`);
    console.log(`Approved At: ${app.reviewedAt ? app.reviewedAt.toDate() : 'N/A'}`);

    // Check user document
    const userDoc = await db.collection('users').doc(app.userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`User Role: ${userData.role || 'NOT SET'}`);
    } else {
      console.log('User Role: USER DOC NOT FOUND');
    }

    // Check curator document
    const curatorDoc = await db.collection('curators').doc(app.userId).get();
    if (curatorDoc.exists) {
      const curatorData = curatorDoc.data();
      console.log(`Curator Profile: EXISTS (created ${curatorData.approvedAt ? curatorData.approvedAt.toDate() : 'N/A'})`);
    } else {
      console.log('Curator Profile: NOT FOUND');
    }
    console.log();
  }
}

checkCuratorApprovals().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
