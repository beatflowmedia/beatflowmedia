// migrate-storage-files.js
// Backend script to migrate Firebase Storage files to standardized paths
// Run with: node migrate-storage-files.js
//
// This script:
// 1. Reads all song documents from Firestore
// 2. Copies audio files to standardized location (songs/audio/{songId}.{ext})
// 3. Updates Firestore documents with new URLs
// 4. Keeps original files for rollback (can delete after verification)

const admin = require('firebase-admin');

// Try to use service account key or application default credentials
let credential;
try {
  const serviceAccount = require('./serviceAccountKey.json');
  credential = admin.credential.cert(serviceAccount);
  console.log('✅ Using service account credentials');
} catch (error) {
  console.log('⚠️  Service account key not found, using Application Default Credentials');
  console.log('   Set GOOGLE_APPLICATION_CREDENTIALS if this fails\n');
  credential = admin.credential.applicationDefault();
}

admin.initializeApp({
  credential: credential,
  storageBucket: 'beatflowmedia.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Configuration
const DRY_RUN = true; // Set to false to actually perform migration
const BATCH_SIZE = 10; // Process files in batches to avoid rate limits
const KEEP_ORIGINALS = true; // Keep original files for rollback

/**
 * Copy a file to new location in Storage
 */
async function copyFile(sourcePath, destPath) {
  try {
    const sourceFile = bucket.file(sourcePath);
    const destFile = bucket.file(destPath);

    // Check if source exists
    const [sourceExists] = await sourceFile.exists();
    if (!sourceExists) {
      return { success: false, error: 'Source file does not exist' };
    }

    // Check if destination already exists
    const [destExists] = await destFile.exists();
    if (destExists) {
      console.log(`  ⏭️  Destination already exists: ${destPath}`);
      return { success: true, skipped: true };
    }

    if (!DRY_RUN) {
      // Copy the file
      await sourceFile.copy(destFile);

      // Make it publicly readable (same as originals)
      await destFile.makePublic();

      console.log(`  ✅ Copied: ${sourcePath} -> ${destPath}`);
    } else {
      console.log(`  [DRY RUN] Would copy: ${sourcePath} -> ${destPath}`);
    }

    return { success: true };
  } catch (error) {
    console.error(`  ❌ Error copying file: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Get new download URL after file is copied
 */
async function getNewDownloadUrl(filePath) {
  const file = bucket.file(filePath);
  const [url] = await file.getDownloadURL();
  return url;
}

/**
 * Main migration function
 */
async function migrateStorageFiles() {
  console.log('🚀 FIREBASE STORAGE MIGRATION');
  console.log('==============================\n');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE (will make changes)'}`);
  console.log(`Keep originals: ${KEEP_ORIGINALS ? 'Yes' : 'No'}\n`);

  const stats = {
    total: 0,
    successful: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  try {
    // Get all songs
    const songsSnapshot = await db.collection('songs').get();
    stats.total = songsSnapshot.size;

    console.log(`Found ${stats.total} songs to process\n`);
    console.log('Processing...\n');

    let processed = 0;

    for (const docSnap of songsSnapshot.docs) {
      const song = docSnap.data();
      const songId = docSnap.id;

      processed++;
      console.log(`[${processed}/${stats.total}] ${song.title || 'Untitled'} (${songId})`);

      // Get current audio URL
      const audioUrl = song.audioUrl || song.streamUrl || song.url || song.src;

      if (!audioUrl) {
        console.log(`  ⏭️  No audio URL found`);
        stats.skipped++;
        continue;
      }

      // Extract current path
      const match = audioUrl.match(/\/o\/([^?]+)/);
      if (!match) {
        console.log(`  ⚠️  Invalid URL format: ${audioUrl}`);
        stats.failed++;
        stats.errors.push({ songId, error: 'Invalid URL format' });
        continue;
      }

      const currentPath = decodeURIComponent(match[1]);
      const extension = currentPath.split('.').pop();
      const standardPath = `songs/audio/${songId}.${extension}`;

      // Skip if already in standard location
      if (currentPath === standardPath) {
        console.log(`  ✅ Already in standard location`);
        stats.skipped++;
        continue;
      }

      // Copy file to new location
      const copyResult = await copyFile(currentPath, standardPath);

      if (!copyResult.success) {
        stats.failed++;
        stats.errors.push({ songId, error: copyResult.error });
        continue;
      }

      if (copyResult.skipped) {
        stats.skipped++;
      } else {
        stats.successful++;
      }

      // Update Firestore document with new URL
      if (!DRY_RUN) {
        const newUrl = await getNewDownloadUrl(standardPath);

        await db.collection('songs').doc(songId).update({
          audioUrl: newUrl,
          audioPath: standardPath,
          _previousAudioUrl: audioUrl,
          _previousAudioPath: currentPath,
          _migratedAt: admin.firestore.FieldValue.serverTimestamp(),
          _migrationStatus: 'completed'
        });

        console.log(`  ✅ Updated Firestore document`);
      } else {
        console.log(`  [DRY RUN] Would update Firestore with new URL`);
      }

      // Rate limiting - pause between batches
      if (processed % BATCH_SIZE === 0) {
        console.log(`\n  ⏸️  Batch complete, pausing 2 seconds...\n`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Summary
    console.log('\n==============================');
    console.log('📊 MIGRATION SUMMARY');
    console.log('==============================\n');
    console.log(`Total songs: ${stats.total}`);
    console.log(`✅ Successfully migrated: ${stats.successful}`);
    console.log(`⏭️  Skipped (already standard): ${stats.skipped}`);
    console.log(`❌ Failed: ${stats.failed}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      stats.errors.forEach(({ songId, error }) => {
        console.log(`  ${songId}: ${error}`);
      });
    }

    if (DRY_RUN) {
      console.log('\n⚠️  This was a DRY RUN. No changes were made.');
      console.log('   To apply changes, edit this file and set: DRY_RUN = false');
    } else {
      console.log('\n✅ Migration complete!');

      if (KEEP_ORIGINALS) {
        console.log('\n⚠️  Original files were kept for rollback.');
        console.log('   Review results, then run cleanup script to remove duplicates.');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
  }
}

// Run migration
migrateStorageFiles();
