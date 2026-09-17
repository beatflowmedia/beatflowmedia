// Migration script: Move tracks from artistSubmissions to songs collection
// Using Firebase Client SDK
// Run with: node src/scripts/migrate-artist-submissions-client.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase config (from your firebaseConfig.js)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDtnxbpdH4vYaFRvLZZQRkzTJqO-7G2HKU",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "beatflowmedia.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "beatflowmedia",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "beatflowmedia.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "677720262738",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:677720262738:web:4c8a21db60f97b45cb6b48",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-H60TG6XY2G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function migrateArtistSubmissions() {
  console.log('🚀 Starting migration from artistSubmissions to songs...\n');

  try {
    // Authenticate as admin
    console.log('🔐 Authenticating as admin...');

    // Check for credentials in environment
    const adminEmail = process.env.ADMIN_EMAIL || 'perriceconsulting@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('❌ Admin password not provided');
      console.error('Set ADMIN_PASSWORD environment variable or pass it as an argument');
      console.error('Usage: ADMIN_PASSWORD=your_password node src/scripts/migrate-artist-submissions-client.js');
      process.exit(1);
    }

    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log(`✅ Authenticated as ${adminEmail}\n`);

    // Fetch all pending submissions
    const submissionsRef = collection(db, 'artistSubmissions');
    const snapshot = await getDocs(submissionsRef);

    if (snapshot.empty) {
      console.log('✅ No submissions found. Migration complete!');
      return;
    }

    console.log(`📊 Found ${snapshot.size} submission(s) to migrate\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each submission
    for (const docSnap of snapshot.docs) {
      const submission = docSnap.data();
      const submissionId = docSnap.id;

      try {
        console.log(`\n📝 Processing: "${submission.title || submission.fileName}" by ${submission.artist || 'Unknown'}`);
        console.log(`   Submission ID: ${submissionId}`);
        console.log(`   Status: ${submission.status || 'pending'}`);

        // Transform submission data to song schema
        const songData = {
          // Basic metadata
          title: submission.title || submission.fileName?.replace(/\.[^/.]+$/, '') || 'Untitled',
          artist: submission.artist || 'Unknown Artist',

          // Audio file
          src: submission.fileUrl || '',
          fileName: submission.fileName || '',
          fileSize: submission.fileSize || 0,
          fileType: submission.fileType || 'audio/mpeg',
          storagePath: submission.storagePath || '',

          // Cover art (use placeholder if not provided)
          // Store no sentinel path. Writing '/default-cover.jpg' here is how
          // unresolvable cover values got into Firestore in the first place: the
          // file does not exist, so every reader renders alt text. Placeholders are
          // a RENDER concern (src/utils/placeholders.js), never stored data.
          cover: submission.cover || submission.fileUrl || '',

          // Category/Genre
          category: submission.genre || submission.category || 'Other',
          genre: submission.genre || submission.category || 'Other',

          // Additional metadata
          album: submission.album || null,
          releaseDate: submission.releaseDate || null,
          isrc: submission.isrc || null,
          territorialRights: submission.territorialRights || 'worldwide',
          label: submission.label || 'BeatFlow Media Group',
          copyrightOwner: submission.copyrightOwner || null,
          description: submission.description || null,
          tags: submission.tags || [],
          explicitContent: submission.explicitContent || false,

          // Upload info
          uploadedBy: submission.uploadedBy || null,
          uploadedByEmail: submission.uploadedByEmail || null,

          // Publishing status
          approved: true, // Auto-approve migrated tracks
          published: true,

          // Pricing
          price: 2.99, // Default price

          // Stats
          plays: 0,
          likes: 0,
          downloads: 0,

          // Timestamps
          createdAt: submission.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),

          // Migration metadata
          migratedFrom: 'artistSubmissions',
          originalSubmissionId: submissionId,
          migratedAt: serverTimestamp()
        };

        // Add to songs collection
        const songsRef = collection(db, 'songs');
        const songDocRef = await addDoc(songsRef, songData);
        console.log(`   ✅ Created song: ${songDocRef.id}`);

        // Update original submission with migration info
        const submissionDocRef = doc(db, 'artistSubmissions', submissionId);
        await updateDoc(submissionDocRef, {
          status: 'migrated',
          migratedToSongId: songDocRef.id,
          migratedAt: serverTimestamp()
        });
        console.log(`   ✅ Updated submission status to 'migrated'`);

        successCount++;

      } catch (error) {
        console.error(`   ❌ Error migrating submission ${submissionId}:`, error.message);
        errorCount++;
        errors.push({
          submissionId,
          title: submission.title || submission.fileName,
          error: error.message
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📝 Total processed: ${snapshot.size}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(err => {
        console.log(`   - ${err.title} (${err.submissionId}): ${err.error}`);
      });
    }

    console.log('\n✅ Migration complete!\n');

  } catch (error) {
    console.error('❌ Fatal error during migration:', error);
    if (error.code === 'permission-denied') {
      console.error('\n⚠️  Permission denied. Please update your Firestore rules to allow:');
      console.error('   - Read access to artistSubmissions collection');
      console.error('   - Write access to songs collection');
      console.error('   - Write access to artistSubmissions collection (for updating status)');
    }
    process.exit(1);
  }
}

// Run migration
migrateArtistSubmissions()
  .then(() => {
    console.log('👋 Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
