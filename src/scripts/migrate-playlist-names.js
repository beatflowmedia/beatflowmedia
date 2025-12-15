// Migration script to convert all playlist names to Title Case
const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Helper function to capitalize playlist names
const toTitleCase = (str) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

async function migratePlaylistNames() {
  console.log('🔄 Starting playlist name migration...\n');

  let totalUpdated = 0;
  let totalSkipped = 0;

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`📁 Found ${usersSnapshot.size} users\n`);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`👤 Processing user: ${userId}`);

      // Get all playlists for this user
      const playlistsSnapshot = await db.collection('users').doc(userId).collection('playlists').get();

      console.log(`   Found ${playlistsSnapshot.size} playlists`);

      for (const playlistDoc of playlistsSnapshot.docs) {
        const playlistData = playlistDoc.data();
        const currentName = playlistData.name;
        const titleCaseName = toTitleCase(currentName);

        if (currentName !== titleCaseName) {
          // Update playlist name
          await db.collection('users').doc(userId).collection('playlists').doc(playlistDoc.id).update({
            name: titleCaseName
          });
          console.log(`   ✅ Updated: "${currentName}" → "${titleCaseName}"`);
          totalUpdated++;
        } else {
          console.log(`   ⏭️  Skipped: "${currentName}" (already Title Case)`);
          totalSkipped++;
        }
      }

      console.log('');
    }

    console.log('\n✨ Migration complete!');
    console.log(`   Updated: ${totalUpdated} playlists`);
    console.log(`   Skipped: ${totalSkipped} playlists`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run migration
migratePlaylistNames();
