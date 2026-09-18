// src/utils/purgeFirebase.js
// Comprehensive Firebase cleanup - removes unnecessary collections and files
// DANGEROUS: Use with extreme caution

import { db, storage } from '../firebaseConfig';
import { collection, getDocs, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';

/**
 * Collections to keep (essential for app functionality)
 */
const ESSENTIAL_COLLECTIONS = [
  'songs',
  'albums',
  'artists',
  'users',
  'playlists',
  'purchases',
  'downloads',
  'likes',
  'userQueues',
  'queues'
];

/**
 * PRIORITY 1: Duplicate collections (SAFE TO DELETE - have alternatives)
 */
const DUPLICATE_COLLECTIONS = [
  'tracks', // Duplicate of songs
  'songLikes', // Use 'likes' instead
  'songFavorites', // Use 'likes' instead
  'userQueues', // Use 'queues' instead (standardizing on 'queues')
  'playlistTracks' // Embedded in playlists
];

/**
 * PRIORITY 2: Unimplemented features (SAFE TO DELETE - never used)
 */
const UNIMPLEMENTED_COLLECTIONS = [
  'podcast_episodes', // Not implemented
  'audiobooks', // Not implemented
  'jobs', // Not implemented
  'applications', // Not implemented
  'vendorApplications', // Not implemented
  'adSignups', // Not implemented
  'advertisingInquiries', // Moved to studioInquiries
  'customGenres', // Unused
  'customCategories', // Unused
  'customMoods', // Unused
  'supervisorSamplers' // Unused feature
];

/**
 * PRIORITY 3: Legacy/temporary (can delete after verification)
 */
const LEGACY_COLLECTIONS = [
  'submissions', // Old submission system (replaced by artistSubmissions)
  'audioAccess', // Temporary access logs
  'creditTransactions', // Legacy payment system
  'user_sessions', // Can be regenerated
  'user_devices', // Can be regenerated
  'error_logs' // Can be cleared periodically
];

/**
 * PRIORITY 4: Analytics (keep for now, can archive later)
 */
const ANALYTICS_COLLECTIONS = [
  'playbackEvents', // Consider keeping for analytics
  'playEvents', // Consider keeping for analytics
  'songPlays', // Consider keeping for analytics
  'likeEvents', // Consider keeping for analytics
  'followEvents', // Consider keeping for analytics
  'playlistFollowEvents' // Consider keeping for analytics
];

/**
 * PRIORITY 5: Agent/AI generated (can regenerate if needed)
 */
const AGENT_COLLECTIONS = [
  'content_metadata', // Agent-generated (can regenerate)
  'moderation_results', // Agent-generated (can regenerate)
  'recommendation_interactions' // Analytics
];

/**
 * Collections that are safe to delete (combined)
 */
const SAFE_TO_DELETE_COLLECTIONS = [
  ...DUPLICATE_COLLECTIONS,
  ...UNIMPLEMENTED_COLLECTIONS,
  ...LEGACY_COLLECTIONS
  // Note: Not including analytics or agent collections by default
  // Add them manually if needed
];

/**
 * Audit all Firestore collections
 */
export async function auditFirestoreCollections() {
  console.log('🔍 AUDITING FIRESTORE COLLECTIONS');
  console.log('===================================\n');

  const allCollections = [
    ...ESSENTIAL_COLLECTIONS,
    ...SAFE_TO_DELETE_COLLECTIONS
  ];

  const stats = {
    essential: {},
    safeToDelete: {},
    unknown: {},
    totalDocs: 0,
    estimatedDeletableDocs: 0
  };

  for (const collectionName of allCollections) {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      const docCount = snapshot.size;

      const info = {
        name: collectionName,
        docs: docCount,
        sampleData: snapshot.docs[0]?.data() || null
      };

      if (ESSENTIAL_COLLECTIONS.includes(collectionName)) {
        stats.essential[collectionName] = info;
      } else if (SAFE_TO_DELETE_COLLECTIONS.includes(collectionName)) {
        stats.safeToDelete[collectionName] = info;
        stats.estimatedDeletableDocs += docCount;
      }

      stats.totalDocs += docCount;

      console.log(`${ESSENTIAL_COLLECTIONS.includes(collectionName) ? '✅' : '🗑️'}  ${collectionName}: ${docCount} documents`);
    } catch (error) {
      console.log(`⚠️  ${collectionName}: Error reading (${error.message})`);
    }
  }

  console.log('\n===================================');
  console.log('📊 SUMMARY');
  console.log('===================================\n');
  console.log(`Total documents: ${stats.totalDocs}`);
  console.log(`Essential collections: ${Object.keys(stats.essential).length}`);
  console.log(`Safe to delete: ${Object.keys(stats.safeToDelete).length} collections`);
  console.log(`Deletable documents: ${stats.estimatedDeletableDocs}`);

  console.log('\n🗑️  COLLECTIONS MARKED FOR DELETION:');
  Object.entries(stats.safeToDelete).forEach(([name, info]) => {
    if (info.docs > 0) {
      console.log(`  - ${name}: ${info.docs} docs`);
    }
  });

  return stats;
}

/**
 * Delete a single collection (all documents)
 */
async function deleteCollection(collectionName, dryRun = true) {
  const snapshot = await getDocs(collection(db, collectionName));

  if (snapshot.empty) {
    console.log(`  ⏭️  ${collectionName} is already empty`);
    return { deleted: 0, skipped: true };
  }

  console.log(`  🗑️  ${collectionName}: ${snapshot.size} documents`);

  if (dryRun) {
    console.log(`     [DRY RUN] Would delete ${snapshot.size} documents`);
    return { deleted: 0, dryRun: true };
  }

  // Delete in batches of 500 (Firestore limit)
  let deletedCount = 0;
  const batchSize = 500;

  for (let i = 0; i < snapshot.docs.length; i += batchSize) {
    const batch = writeBatch(db);
    const batchDocs = snapshot.docs.slice(i, i + batchSize);

    batchDocs.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });

    await batch.commit();
    deletedCount += batchDocs.length;
    console.log(`     Deleted ${deletedCount}/${snapshot.size} documents...`);
  }

  console.log(`  ✅ Deleted ${deletedCount} documents from ${collectionName}`);
  return { deleted: deletedCount };
}

/**
 * Purge unnecessary Firestore collections
 */
export async function purgeFirestoreCollections(dryRun = true) {
  console.log('\n🗑️  PURGING FIRESTORE COLLECTIONS');
  console.log('===================================\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will delete data!)'}\n`);

  if (!dryRun) {
    console.warn('⚠️  WARNING: This will PERMANENTLY DELETE data!');
    console.warn('⚠️  Make sure you have backups before proceeding!\n');
  }

  const stats = {
    total: 0,
    deleted: 0,
    failed: 0
  };

  for (const collectionName of SAFE_TO_DELETE_COLLECTIONS) {
    try {
      stats.total++;
      const result = await deleteCollection(collectionName, dryRun);

      if (result.deleted > 0 || result.dryRun) {
        stats.deleted++;
      }
    } catch (error) {
      console.error(`  ❌ Failed to delete ${collectionName}: ${error.message}`);
      stats.failed++;
    }
  }

  console.log('\n===================================');
  console.log('📊 DELETION SUMMARY');
  console.log('===================================\n');
  console.log(`Collections processed: ${stats.total}`);
  console.log(`Collections deleted: ${stats.deleted}`);
  console.log(`Failed: ${stats.failed}`);

  if (dryRun) {
    console.log('\n⚠️  This was a DRY RUN. No data was deleted.');
    console.log('   To actually delete, run: purgeFirestoreCollections(false)');
  } else {
    console.log('\n✅ Firestore cleanup complete!');
  }

  return stats;
}

/**
 * Audit Firebase Storage for orphaned files
 */
export async function auditFirebaseStorage() {
  console.log('\n🔍 AUDITING FIREBASE STORAGE');
  console.log('===================================\n');

  const folders = [
    'admin-uploads',
    'artist-uploads',
    'songs/audio',
    'songs/covers',
    'albums/covers',
    'audio',
    'temp',
    'temp-uploads'
  ];

  const stats = {
    folders: {},
    totalFiles: 0,
    totalSize: 0,
    orphanedFiles: []
  };

  for (const folder of folders) {
    try {
      const folderRef = ref(storage, folder);
      const result = await listAll(folderRef);

      const files = result.items;
      let folderSize = 0;

      // Get file metadata
      for (const file of files) {
        try {
          const metadata = await file.getMetadata();
          folderSize += parseInt(metadata.size || 0);
        } catch (error) {
          // File might not exist
        }
      }

      stats.folders[folder] = {
        count: files.length,
        size: folderSize,
        sizeReadable: (folderSize / 1024 / 1024).toFixed(2) + ' MB'
      };

      stats.totalFiles += files.length;
      stats.totalSize += folderSize;

      console.log(`📁 ${folder}: ${files.length} files (${stats.folders[folder].sizeReadable})`);
    } catch (error) {
      console.log(`⚠️  ${folder}: ${error.message}`);
    }
  }

  console.log('\n===================================');
  console.log('📊 STORAGE SUMMARY');
  console.log('===================================\n');
  console.log(`Total files: ${stats.totalFiles}`);
  console.log(`Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);

  console.log('\n💡 RECOMMENDATIONS:');
  console.log('- Delete files from old locations after migration');
  console.log('- admin-uploads: Legacy location, migrate to songs/audio');
  console.log('- temp/temp-uploads: Can be cleared');

  return stats;
}

/**
 * Delete files from a specific Storage folder
 */
async function deleteStorageFolder(folderPath, dryRun = true) {
  console.log(`\n🗑️  Processing: ${folderPath}`);

  try {
    const folderRef = ref(storage, folderPath);
    const result = await listAll(folderRef);

    if (result.items.length === 0) {
      console.log(`  ⏭️  Folder is empty`);
      return { deleted: 0 };
    }

    console.log(`  Found ${result.items.length} files`);

    if (dryRun) {
      console.log(`  [DRY RUN] Would delete ${result.items.length} files`);
      return { deleted: 0, dryRun: true };
    }

    let deletedCount = 0;
    for (const fileRef of result.items) {
      await deleteObject(fileRef);
      deletedCount++;

      if (deletedCount % 10 === 0) {
        console.log(`  Deleted ${deletedCount}/${result.items.length} files...`);
      }
    }

    console.log(`  ✅ Deleted ${deletedCount} files`);
    return { deleted: deletedCount };
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return { deleted: 0, error: error.message };
  }
}

/**
 * Purge temporary and legacy Storage files
 */
export async function purgeFirebaseStorage(dryRun = true) {
  console.log('\n🗑️  PURGING FIREBASE STORAGE');
  console.log('===================================\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  const foldersToClean = [
    'temp',
    'temp-uploads'
    // Note: Don't auto-delete admin-uploads, artist-uploads
    // User should verify migration first
  ];

  const stats = {
    total: 0,
    deleted: 0,
    failed: 0
  };

  for (const folder of foldersToClean) {
    stats.total++;
    const result = await deleteStorageFolder(folder, dryRun);

    if (result.deleted > 0 || result.dryRun) {
      stats.deleted++;
    }
    if (result.error) {
      stats.failed++;
    }
  }

  console.log('\n===================================');
  console.log('📊 STORAGE CLEANUP SUMMARY');
  console.log('===================================\n');
  console.log(`Folders processed: ${stats.total}`);
  console.log(`Folders cleaned: ${stats.deleted}`);
  console.log(`Failed: ${stats.failed}`);

  if (dryRun) {
    console.log('\n⚠️  This was a DRY RUN.');
    console.log('   To delete, run: purgeFirebaseStorage(false)');
  }

  return stats;
}

/**
 * Complete Firebase purge - collections AND storage
 */
export async function purgeAllFirebase(dryRun = true) {
  console.log('\n🚨 COMPLETE FIREBASE PURGE');
  console.log('===================================\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : '⚠️  LIVE - WILL DELETE DATA!'}\n`);

  if (!dryRun) {
    console.error('⚠️⚠️⚠️  WARNING  ⚠️⚠️⚠️');
    console.error('This will PERMANENTLY DELETE:');
    console.error('- Unused Firestore collections');
    console.error('- Temporary Storage files');
    console.error('\nMake sure you have backups!\n');
  }

  const results = {
    firestore: await purgeFirestoreCollections(dryRun),
    storage: await purgeFirebaseStorage(dryRun)
  };

  console.log('\n===================================');
  console.log('🎯 COMPLETE PURGE SUMMARY');
  console.log('===================================\n');
  console.log(`Firestore collections deleted: ${results.firestore.deleted}`);
  console.log(`Storage folders cleaned: ${results.storage.deleted}`);

  if (dryRun) {
    console.log('\n⚠️  DRY RUN - No changes made');
    console.log('   Review results, then run: purgeAllFirebase(false)');
  } else {
    console.log('\n✅ Firebase purge complete!');
  }

  return results;
}

// Export for console access
if (typeof window !== 'undefined') {
  window.auditFirestoreCollections = auditFirestoreCollections;
  window.purgeFirestoreCollections = purgeFirestoreCollections;
  window.auditFirebaseStorage = auditFirebaseStorage;
  window.purgeFirebaseStorage = purgeFirebaseStorage;
  window.purgeAllFirebase = purgeAllFirebase;
}
