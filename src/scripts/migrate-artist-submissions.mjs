// Migration script: Move tracks from artistSubmissions to songs collection
// Run with: node src/scripts/migrate-artist-submissions.mjs

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
let serviceAccount;
try {
  serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '../../serviceAccountKey.json'), 'utf8')
  );
} catch (error) {
  console.error('❌ Error loading serviceAccountKey.json');
  console.error('Make sure serviceAccountKey.json exists in the project root');
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function migrateArtistSubmissions() {
  console.log('🚀 Starting migration from artistSubmissions to songs...\n');

  try {
    // Fetch all pending submissions
    const submissionsRef = db.collection('artistSubmissions');
    const snapshot = await submissionsRef.get();

    if (snapshot.empty) {
      console.log('✅ No submissions found. Migration complete!');
      return;
    }

    console.log(`📊 Found ${snapshot.size} submission(s) to migrate\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each submission
    for (const doc of snapshot.docs) {
      const submission = doc.data();
      const submissionId = doc.id;

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
          cover: submission.cover || submission.fileUrl || '/default-cover.jpg',

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
          createdAt: submission.createdAt || FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),

          // Migration metadata
          migratedFrom: 'artistSubmissions',
          originalSubmissionId: submissionId,
          migratedAt: FieldValue.serverTimestamp()
        };

        // Add to songs collection
        const songRef = await db.collection('songs').add(songData);
        console.log(`   ✅ Created song: ${songRef.id}`);

        // Update original submission with migration info
        await submissionsRef.doc(submissionId).update({
          status: 'migrated',
          migratedToSongId: songRef.id,
          migratedAt: FieldValue.serverTimestamp()
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
