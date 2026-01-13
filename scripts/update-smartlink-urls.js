const admin = require('firebase-admin');
require('dotenv').config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

async function updateSmartLinks() {
  console.log('🔗 Updating smart link URLs...\n');

  try {
    const smartLinksSnapshot = await db.collection('smartLinks').get();

    if (smartLinksSnapshot.empty) {
      console.log('No smart links found.');
      return;
    }

    console.log(`Found ${smartLinksSnapshot.size} smart link(s)\n`);

    let updatedCount = 0;
    const batch = db.batch();

    smartLinksSnapshot.forEach(doc => {
      const data = doc.data();
      const oldUrl = data.url;

      // Check if URL contains old domain
      if (oldUrl && oldUrl.includes('beatflowmedia.com')) {
        const newUrl = oldUrl.replace('beatflowmedia.com', 'beatflowmediagroup.com');

        console.log(`📝 Updating: ${doc.id}`);
        console.log(`   Old: ${oldUrl}`);
        console.log(`   New: ${newUrl}\n`);

        batch.update(doc.ref, {
          url: newUrl,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      console.log(`✅ Successfully updated ${updatedCount} smart link(s)`);
    } else {
      console.log('ℹ️  No smart links needed updating');
    }

  } catch (error) {
    console.error('❌ Error updating smart links:', error);
    throw error;
  }
}

updateSmartLinks()
  .then(() => {
    console.log('\n🎉 Complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
