// src/utils/migrateStorageBrowser.js
// Browser-based storage migration using Firebase SDK
// Moves files to standardized locations

import { db, storage } from '../firebaseConfig';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, getDownloadURL, uploadBytes, getBlob } from 'firebase/storage';

/**
 * Migrate a single song's audio file to standard location
 */
async function migrateSingleFile(songId, currentPath, targetPath) {
  console.log(`\n📦 Migrating: ${currentPath}`);
  console.log(`   → Target: ${targetPath}`);

  try {
    // Step 1: Download the file from current location
    console.log('   ⬇️  Downloading file...');
    const currentRef = ref(storage, currentPath);
    const blob = await getBlob(currentRef);
    console.log(`   ✅ Downloaded ${(blob.size / 1024 / 1024).toFixed(2)} MB`);

    // Step 2: Upload to new location
    console.log('   ⬆️  Uploading to new location...');
    const targetRef = ref(storage, targetPath);
    await uploadBytes(targetRef, blob);
    console.log('   ✅ Uploaded successfully');

    // Step 3: Get new download URL
    console.log('   🔗 Getting new URL...');
    const newUrl = await getDownloadURL(targetRef);
    console.log('   ✅ New URL obtained');

    // Step 4: Update Firestore document
    console.log('   📝 Updating Firestore...');
    const songRef = doc(db, 'songs', songId);
    await updateDoc(songRef, {
      audioUrl: newUrl,
      audioPath: targetPath,
      _previousUrl: currentPath, // Keep for rollback
      _migratedAt: new Date(),
      _migrationStatus: 'completed'
    });
    console.log('   ✅ Firestore updated');

    console.log(`\n✅ Successfully migrated: ${songId}`);
    return { success: true, newUrl };
  } catch (error) {
    console.error(`\n❌ Failed to migrate ${songId}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Migrate all songs that need standardization
 */
export async function migrateAllSongs(dryRun = true) {
  console.log('🚀 BROWSER-BASED STORAGE MIGRATION');
  console.log('===================================\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will migrate files)'}`);

  const stats = {
    total: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  try {
    const songsSnapshot = await getDocs(collection(db, 'songs'));
    console.log(`\nFound ${songsSnapshot.size} songs to check\n`);

    for (const docSnap of songsSnapshot.docs) {
      const song = docSnap.data();
      const songId = docSnap.id;

      stats.total++;

      // Get current audio URL
      const audioUrl = song.audioUrl || song.streamUrl || song.url || song.src;

      if (!audioUrl) {
        console.log(`⏭️  Skipping ${songId} - no audio URL`);
        stats.skipped++;
        continue;
      }

      // Extract current path
      const match = audioUrl.match(/\/o\/([^?]+)/);
      if (!match) {
        console.log(`⚠️  Skipping ${songId} - invalid URL format`);
        stats.skipped++;
        continue;
      }

      const currentPath = decodeURIComponent(match[1]);
      const extension = currentPath.split('.').pop();
      const targetPath = `songs/audio/${songId}.${extension}`;

      // Skip if already in standard location
      if (currentPath === targetPath) {
        console.log(`✅ ${song.title || songId} - already standardized`);
        stats.skipped++;
        continue;
      }

      console.log(`\n[${stats.total}] ${song.title || 'Untitled'} (${songId})`);

      if (dryRun) {
        console.log(`   [DRY RUN] Would migrate:`);
        console.log(`   Current: ${currentPath}`);
        console.log(`   Target: ${targetPath}`);
        stats.successful++;
      } else {
        const result = await migrateSingleFile(songId, currentPath, targetPath);

        if (result.success) {
          stats.successful++;
        } else {
          stats.failed++;
          stats.errors.push({ songId, error: result.error });
        }

        // Pause between migrations to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n===================================');
    console.log('📊 MIGRATION SUMMARY');
    console.log('===================================\n');
    console.log(`Total songs: ${stats.total}`);
    console.log(`✅ Migrated: ${stats.successful}`);
    console.log(`⏭️  Skipped: ${stats.skipped}`);
    console.log(`❌ Failed: ${stats.failed}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      stats.errors.forEach(({ songId, error }) => {
        console.log(`  ${songId}: ${error}`);
      });
    }

    if (dryRun) {
      console.log('\n⚠️  This was a DRY RUN. No changes were made.');
      console.log('   To apply changes, run: migrateAllSongs(false)');
    } else {
      console.log('\n✅ Migration complete!');
      console.log('\n💡 Original files are still in storage for rollback.');
      console.log('   Test playback, then delete old files after verification.');
    }

    return stats;
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

/**
 * Quick migration for a single known song
 */
export async function migrateSong(songId) {
  console.log(`🚀 Migrating single song: ${songId}\n`);

  const docSnap = await getDocs(collection(db, 'songs'));
  const song = docSnap.docs.find(d => d.id === songId)?.data();

  if (!song) {
    console.error('❌ Song not found');
    return;
  }

  const audioUrl = song.audioUrl || song.streamUrl || song.url || song.src;
  const match = audioUrl.match(/\/o\/([^?]+)/);

  if (!match) {
    console.error('❌ Invalid audio URL');
    return;
  }

  const currentPath = decodeURIComponent(match[1]);
  const extension = currentPath.split('.').pop();
  const targetPath = `songs/audio/${songId}.${extension}`;

  return await migrateSingleFile(songId, currentPath, targetPath);
}

// Export for console access
if (typeof window !== 'undefined') {
  window.migrateAllSongs = migrateAllSongs;
  window.migrateSong = migrateSong;
}
