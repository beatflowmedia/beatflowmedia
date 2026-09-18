// src/utils/minimalCleanup.js
// Minimal recommended cleanup - delete only duplicates and unused collections
// SAFE: Only removes collections that have alternatives or are never used

import { db } from '../firebaseConfig';
import { collection, getDocs, writeBatch } from 'firebase/firestore';

/**
 * Phase 1: Delete ONLY duplicate collections (have alternatives)
 */
const DUPLICATES_TO_DELETE = [
  { name: 'tracks', alternative: 'songs', reason: 'Exact duplicate of songs collection' },
  { name: 'songLikes', alternative: 'likes', reason: 'Use unified likes collection instead' },
  { name: 'songFavorites', alternative: 'likes', reason: 'Use unified likes collection instead' },
  { name: 'userQueues', alternative: 'queues', reason: 'Standardizing on queues collection' },
  { name: 'playlistTracks', alternative: 'playlists (embedded)', reason: 'Tracks are embedded in playlist docs' }
];

/**
 * Phase 2: Delete unimplemented features (never used)
 */
const UNIMPLEMENTED_TO_DELETE = [
  { name: 'podcast_episodes', reason: 'Feature not implemented' },
  { name: 'audiobooks', reason: 'Feature not implemented' },
  { name: 'jobs', reason: 'Feature not implemented' },
  { name: 'applications', reason: 'Feature not implemented' },
  { name: 'vendorApplications', reason: 'Feature not implemented' },
  { name: 'adSignups', reason: 'Feature not implemented' },
  { name: 'advertisingInquiries', reason: 'Moved to studioInquiries' },
  { name: 'customGenres', reason: 'Feature not implemented' },
  { name: 'customCategories', reason: 'Feature not implemented' },
  { name: 'customMoods', reason: 'Feature not implemented' },
  { name: 'supervisorSamplers', reason: 'Feature not implemented' }
];

/**
 * Delete a single collection
 */
async function deleteCollection(collectionName, reason, dryRun = true) {
  const snapshot = await getDocs(collection(db, collectionName));

  if (snapshot.empty) {
    console.log(`  ⏭️  ${collectionName} - Already empty`);
    return { deleted: 0, skipped: true };
  }

  console.log(`  🗑️  ${collectionName}: ${snapshot.size} documents`);
  console.log(`      Reason: ${reason}`);

  if (dryRun) {
    console.log(`      [DRY RUN] Would delete ${snapshot.size} documents`);
    return { deleted: 0, dryRun: true, count: snapshot.size };
  }

  // Delete in batches of 500
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
  }

  console.log(`      ✅ Deleted ${deletedCount} documents`);
  return { deleted: deletedCount };
}

/**
 * Phase 1: Delete duplicate collections only
 */
export async function deleteDuplicates(dryRun = true) {
  console.log('\n🗑️  PHASE 1: DELETING DUPLICATE COLLECTIONS');
  console.log('===========================================\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  const stats = {
    total: 0,
    deleted: 0,
    skipped: 0,
    totalDocs: 0
  };

  for (const item of DUPLICATES_TO_DELETE) {
    try {
      stats.total++;
      const result = await deleteCollection(
        item.name,
        `${item.reason}. Use '${item.alternative}' instead`,
        dryRun
      );

      if (result.skipped) {
        stats.skipped++;
      } else if (result.deleted > 0 || result.dryRun) {
        stats.deleted++;
        stats.totalDocs += result.count || result.deleted;
      }
    } catch (error) {
      console.error(`  ❌ Error deleting ${item.name}: ${error.message}`);
    }
  }

  console.log('\n===========================================');
  console.log('📊 PHASE 1 SUMMARY');
  console.log('===========================================\n');
  console.log(`Collections processed: ${stats.total}`);
  console.log(`Collections deleted: ${stats.deleted}`);
  console.log(`Collections skipped (empty): ${stats.skipped}`);
  console.log(`Total documents: ${stats.totalDocs}`);

  if (dryRun) {
    console.log('\n⚠️  DRY RUN - No changes made');
    console.log('   Run: deleteDuplicates(false) to execute');
  }

  return stats;
}

/**
 * Phase 2: Delete unimplemented features
 */
export async function deleteUnimplemented(dryRun = true) {
  console.log('\n🗑️  PHASE 2: DELETING UNIMPLEMENTED FEATURES');
  console.log('=============================================\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  const stats = {
    total: 0,
    deleted: 0,
    skipped: 0,
    totalDocs: 0
  };

  for (const item of UNIMPLEMENTED_TO_DELETE) {
    try {
      stats.total++;
      const result = await deleteCollection(item.name, item.reason, dryRun);

      if (result.skipped) {
        stats.skipped++;
      } else if (result.deleted > 0 || result.dryRun) {
        stats.deleted++;
        stats.totalDocs += result.count || result.deleted;
      }
    } catch (error) {
      console.error(`  ❌ Error deleting ${item.name}: ${error.message}`);
    }
  }

  console.log('\n=============================================');
  console.log('📊 PHASE 2 SUMMARY');
  console.log('=============================================\n');
  console.log(`Collections processed: ${stats.total}`);
  console.log(`Collections deleted: ${stats.deleted}`);
  console.log(`Collections skipped (empty): ${stats.skipped}`);
  console.log(`Total documents: ${stats.totalDocs}`);

  if (dryRun) {
    console.log('\n⚠️  DRY RUN - No changes made');
    console.log('   Run: deleteUnimplemented(false) to execute');
  }

  return stats;
}

/**
 * Complete minimal cleanup (both phases)
 */
export async function minimalCleanup(dryRun = true) {
  console.log('\n🚀 MINIMAL FIREBASE CLEANUP');
  console.log('===========================\n');
  console.log('This will delete:');
  console.log('1. Duplicate collections (have alternatives)');
  console.log('2. Unimplemented features (never used)\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : '⚠️  LIVE'}\n`);

  if (!dryRun) {
    console.warn('⚠️⚠️⚠️  WARNING  ⚠️⚠️⚠️');
    console.warn('This will permanently delete data!');
    console.warn('Make sure you have reviewed the dry run results.\n');
  }

  const results = {
    phase1: await deleteDuplicates(dryRun),
    phase2: await deleteUnimplemented(dryRun)
  };

  console.log('\n===========================');
  console.log('🎯 COMPLETE CLEANUP SUMMARY');
  console.log('===========================\n');
  console.log(`Phase 1 (Duplicates): ${results.phase1.deleted} collections`);
  console.log(`Phase 2 (Unimplemented): ${results.phase2.deleted} collections`);
  console.log(`Total collections deleted: ${results.phase1.deleted + results.phase2.deleted}`);
  console.log(`Total documents deleted: ${results.phase1.totalDocs + results.phase2.totalDocs}`);

  if (dryRun) {
    console.log('\n⚠️  DRY RUN - No changes made');
    console.log('\nNext steps:');
    console.log('1. Review results above');
    console.log('2. Run: minimalCleanup(false) to execute');
  } else {
    console.log('\n✅ Cleanup complete!');
    console.log('\n💡 What was kept:');
    console.log('   - All essential collections (songs, albums, users, etc.)');
    console.log('   - Analytics collections (for future use)');
    console.log('   - All user data and purchases');
  }

  return results;
}

// Export for console access
if (typeof window !== 'undefined') {
  window.minimalCleanup = minimalCleanup;
  window.deleteDuplicates = deleteDuplicates;
  window.deleteUnimplemented = deleteUnimplemented;
}
