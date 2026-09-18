// src/utils/standardizeFirebaseStorage.js
// Migration utility to standardize Firebase Storage and Firestore structure
// Run in browser console: standardizeFirebaseStorage()

import { db, storage } from '../firebaseConfig';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { ref, getDownloadURL, uploadBytes, deleteObject, listAll } from 'firebase/storage';

/**
 * PHASE 1: Audit current state
 * Safe read-only analysis
 */
export async function auditStorageStructure() {
  console.log('🔍 PHASE 1: AUDITING CURRENT STATE');
  console.log('=====================================\n');

  const songsSnapshot = await getDocs(collection(db, 'songs'));
  const stats = {
    totalSongs: songsSnapshot.size,
    pathDistribution: {},
    fieldDistribution: {
      audioUrl: 0,
      streamUrl: 0,
      url: 0,
      src: 0,
      none: 0
    },
    issues: {
      missingAudio: [],
      invalidUrls: [],
      needsMigration: []
    }
  };

  songsSnapshot.forEach((docSnap) => {
    const song = docSnap.data();
    const songId = docSnap.id;

    // Check which field has the audio URL
    const audioUrl = song.audioUrl;
    const streamUrl = song.streamUrl;
    const url = song.url;
    const src = song.src;

    if (audioUrl) stats.fieldDistribution.audioUrl++;
    if (streamUrl) stats.fieldDistribution.streamUrl++;
    if (url) stats.fieldDistribution.url++;
    if (src) stats.fieldDistribution.src++;

    const primaryUrl = audioUrl || streamUrl || url || src;

    if (!primaryUrl) {
      stats.fieldDistribution.none++;
      stats.issues.missingAudio.push({ id: songId, title: song.title });
      return;
    }

    // Extract path from URL
    const match = primaryUrl.match(/\/o\/([^?]+)/);
    if (!match) {
      stats.issues.invalidUrls.push({ id: songId, title: song.title, url: primaryUrl });
      return;
    }

    const filePath = decodeURIComponent(match[1]);
    const pathPrefix = filePath.split('/')[0];

    stats.pathDistribution[pathPrefix] = (stats.pathDistribution[pathPrefix] || 0) + 1;

    // Check if needs migration (not in standard location)
    if (!filePath.startsWith('songs/audio/')) {
      stats.issues.needsMigration.push({
        id: songId,
        title: song.title,
        currentPath: filePath,
        targetPath: `songs/audio/${songId}.${filePath.split('.').pop()}`
      });
    }
  });

  console.log('📊 AUDIT RESULTS');
  console.log('─────────────────\n');
  console.log(`Total songs: ${stats.totalSongs}`);
  console.log('\nField usage:');
  Object.entries(stats.fieldDistribution).forEach(([field, count]) => {
    console.log(`  ${field}: ${count}`);
  });
  console.log('\nStorage paths:');
  Object.entries(stats.pathDistribution).forEach(([path, count]) => {
    console.log(`  ${path}: ${count} files`);
  });
  console.log(`\n⚠️  Issues found:`);
  console.log(`  Missing audio: ${stats.issues.missingAudio.length}`);
  console.log(`  Invalid URLs: ${stats.issues.invalidUrls.length}`);
  console.log(`  Need migration: ${stats.issues.needsMigration.length}`);

  return stats;
}

/**
 * PHASE 2: Migrate Firestore documents
 * Update all song documents to use standardized fields
 */
export async function migrateFirestoreDocuments(dryRun = true) {
  console.log(`\n🔄 PHASE 2: MIGRATING FIRESTORE DOCUMENTS ${dryRun ? '(DRY RUN)' : '(LIVE)'}`);
  console.log('=====================================\n');

  const songsSnapshot = await getDocs(collection(db, 'songs'));
  const batch = writeBatch(db);
  let updateCount = 0;
  const updates = [];

  for (const docSnap of songsSnapshot.docs) {
    const song = docSnap.data();
    const songId = docSnap.id;

    // Find the audio URL from any field
    const audioUrl = song.audioUrl || song.streamUrl || song.url || song.src;

    if (!audioUrl) {
      console.log(`⏭️  Skipping ${songId} - no audio URL found`);
      continue;
    }

    // Extract path
    const match = audioUrl.match(/\/o\/([^?]+)/);
    if (!match) {
      console.log(`⚠️  Skipping ${songId} - invalid URL format`);
      continue;
    }

    const currentPath = decodeURIComponent(match[1]);
    const extension = currentPath.split('.').pop();
    const standardPath = `songs/audio/${songId}.${extension}`;

    // Build update object
    const updateData = {
      audioUrl: audioUrl, // Keep current URL for now (will update after file migration)
      audioPath: currentPath, // Track current path
      _standardPath: standardPath, // Target path for migration
      _migrationStatus: 'pending',
      updatedAt: new Date()
    };

    // Remove legacy fields
    if (song.streamUrl && song.streamUrl !== song.audioUrl) {
      updateData.streamUrl = null;
    }
    if (song.url && song.url !== song.audioUrl) {
      updateData.url = null;
    }
    if (song.src && song.src !== song.audioUrl) {
      updateData.src = null;
    }

    updates.push({ id: songId, title: song.title, update: updateData });

    if (!dryRun) {
      const docRef = doc(db, 'songs', songId);
      batch.update(docRef, updateData);
      updateCount++;

      // Commit in batches of 500 (Firestore limit)
      if (updateCount % 500 === 0) {
        await batch.commit();
        console.log(`✅ Committed batch of 500 updates`);
      }
    }
  }

  if (!dryRun && updateCount % 500 !== 0) {
    await batch.commit();
  }

  console.log(`\n📊 MIGRATION SUMMARY`);
  console.log(`Documents to update: ${updates.length}`);
  console.log(`Status: ${dryRun ? 'DRY RUN - No changes made' : `LIVE - ${updateCount} documents updated`}`);

  if (dryRun) {
    console.log('\n💡 Sample updates:');
    updates.slice(0, 5).forEach(({ id, title, update }) => {
      console.log(`  ${title} (${id})`);
      console.log(`    Current: ${update.audioPath}`);
      console.log(`    Target: ${update._standardPath}`);
    });
    console.log(`\n⚠️  To apply changes, run: migrateFirestoreDocuments(false)`);
  }

  return { updateCount, updates };
}

/**
 * PHASE 3: Update upload components
 * Ensure all new uploads use standard paths
 */
export function getStandardUploadPath(type, id, extension) {
  const paths = {
    songAudio: `songs/audio/${id}.${extension}`,
    songCover: `songs/covers/${id}.jpg`,
    albumCover: `albums/covers/${id}.jpg`,
    artistProfile: `artists/${id}/profile.jpg`,
    artistBanner: `artists/${id}/banner.jpg`,
    playlistCover: `playlists/covers/${id}.jpg`,
    userAvatar: `users/${id}/avatar.jpg`
  };

  return paths[type] || `temp/${id}/${Date.now()}.${extension}`;
}

/**
 * Main standardization function
 */
export async function standardizeFirebaseStorage() {
  console.log('🚀 FIREBASE STANDARDIZATION PROCESS');
  console.log('====================================\n');
  console.log('This will analyze and standardize your Firebase Storage and Firestore structure.\n');

  try {
    // Phase 1: Audit
    const auditResults = await auditStorageStructure();

    console.log('\n─────────────────────────────────────');
    console.log('\n📋 RECOMMENDATIONS');
    console.log('─────────────────────────────────────\n');

    if (auditResults.issues.needsMigration.length > 0) {
      console.log(`⚠️  ${auditResults.issues.needsMigration.length} songs need path standardization`);
      console.log('\nNext steps:');
      console.log('1. Review audit results above');
      console.log('2. Run: migrateFirestoreDocuments(true) // Dry run');
      console.log('3. Run: migrateFirestoreDocuments(false) // Apply changes');
      console.log('\n⚠️  NOTE: File migration requires backend script (files can\'t be moved from browser)');
      console.log('   Contact admin to run: node migrate-storage-files.js');
    } else {
      console.log('✅ All songs are already in standard locations!');
    }

    return auditResults;
  } catch (error) {
    console.error('❌ Error during standardization:', error);
    throw error;
  }
}

// Export for console access
if (typeof window !== 'undefined') {
  window.standardizeFirebaseStorage = standardizeFirebaseStorage;
  window.auditStorageStructure = auditStorageStructure;
  window.migrateFirestoreDocuments = migrateFirestoreDocuments;
  window.getStandardUploadPath = getStandardUploadPath;
}
