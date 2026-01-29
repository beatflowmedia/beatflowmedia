/**
 * Cleanup Duplicate Collections
 *
 * Identifies and provides instructions for removing duplicate/unused collections:
 * - tracks (unused, duplicate of songs)
 * - userQueues (duplicate of queues)
 * - playbackEvents (overlaps with playEvents)
 *
 * Usage in browser console:
 * 1. Refresh browser
 * 2. Run: cleanupDuplicateCollections()
 */

import { db } from '../firebaseConfig';
import {
  collection,
  getDocs,
  query,
  limit
} from 'firebase/firestore';

async function cleanupDuplicateCollections() {
  console.log('🔍 Analyzing Firestore collections for duplicates...\n');

  const results = {
    duplicates: [],
    recommendations: []
  };

  try {
    // Check for 'tracks' collection (should use 'songs' instead)
    console.log('📂 Checking tracks collection...');
    try {
      const tracksSnapshot = await getDocs(query(collection(db, 'tracks'), limit(1)));
      if (tracksSnapshot.size > 0) {
        results.duplicates.push({
          collection: 'tracks',
          count: tracksSnapshot.size,
          duplicate_of: 'songs',
          recommendation: 'DELETE - Use songs collection instead'
        });
        console.log(`   ⚠️  Found ${tracksSnapshot.size} documents in tracks collection`);
        console.log('   Recommendation: Delete this collection, use songs instead');
      } else {
        console.log('   ✓ tracks collection is empty or doesn\'t exist');
      }
    } catch (err) {
      console.log('   ✓ tracks collection doesn\'t exist');
    }

    // Check for 'userQueues' collection (should use 'queues' instead)
    console.log('\n📂 Checking userQueues collection...');
    try {
      const userQueuesSnapshot = await getDocs(query(collection(db, 'userQueues'), limit(1)));
      if (userQueuesSnapshot.size > 0) {
        results.duplicates.push({
          collection: 'userQueues',
          count: userQueuesSnapshot.size,
          duplicate_of: 'queues',
          recommendation: 'MIGRATE - Move data to queues collection'
        });
        console.log(`   ⚠️  Found ${userQueuesSnapshot.size} documents in userQueues`);
        console.log('   Recommendation: Migrate to queues collection');
      } else {
        console.log('   ✓ userQueues collection is empty or doesn\'t exist');
      }
    } catch (err) {
      console.log('   ✓ userQueues collection doesn\'t exist');
    }

    // Check for 'playbackEvents' collection (overlaps with 'playEvents')
    console.log('\n📂 Checking playbackEvents collection...');
    try {
      const playbackEventsSnapshot = await getDocs(query(collection(db, 'playbackEvents'), limit(1)));
      if (playbackEventsSnapshot.size > 0) {
        results.duplicates.push({
          collection: 'playbackEvents',
          count: playbackEventsSnapshot.size,
          duplicate_of: 'playEvents',
          recommendation: 'ARCHIVE - Rename to playbackEvents_archive, use playEvents going forward'
        });
        console.log(`   ⚠️  Found ${playbackEventsSnapshot.size} documents in playbackEvents`);
        console.log('   Recommendation: Archive and use playEvents instead');
      } else {
        console.log('   ✓ playbackEvents collection is empty or doesn\'t exist');
      }
    } catch (err) {
      console.log('   ✓ playbackEvents collection doesn\'t exist');
    }

    // Generate report
    console.log('\n' + '='.repeat(60));
    console.log('📊 CLEANUP REPORT');
    console.log('='.repeat(60) + '\n');

    if (results.duplicates.length === 0) {
      console.log('✅ No duplicate collections found! Database is clean.\n');
      alert('✅ Database is clean! No duplicate collections found.');
    } else {
      console.log(`⚠️  Found ${results.duplicates.length} duplicate collection(s):\n`);

      results.duplicates.forEach((dup, index) => {
        console.log(`${index + 1}. Collection: ${dup.collection}`);
        console.log(`   Duplicate of: ${dup.duplicate_of}`);
        console.log(`   Recommendation: ${dup.recommendation}\n`);
      });

      console.log('🔧 HOW TO FIX:');
      console.log('   Option 1: Manual cleanup via Firebase Console');
      console.log('   Option 2: Contact admin to run cleanup script');
      console.log('   Option 3: Collections will be ignored if unused\n');

      const message = `Found ${results.duplicates.length} duplicate collection(s):\n\n` +
        results.duplicates.map(d => `• ${d.collection} (${d.recommendation})`).join('\n') +
        '\n\nSee console for details.';

      alert(message);
    }

    return results;

  } catch (error) {
    console.error('❌ Error during analysis:', error);
    alert(`Error: ${error.message}`);
    throw error;
  }
}

// Add helper to check if code references these collections
async function findCollectionReferences() {
  console.log('\n🔍 Checking codebase for collection references...\n');

  const collectionsToCheck = ['tracks', 'userQueues', 'playbackEvents'];

  console.log('To find references in your codebase, run these commands:\n');

  collectionsToCheck.forEach(coll => {
    console.log(`   grep -r "collection(db, '${coll}')" src/`);
    console.log(`   grep -r 'collection(db, "${coll}")' src/\n`);
  });

  console.log('If no references found, collections are safe to delete!\n');
}

// Make both functions globally available
window.cleanupDuplicateCollections = cleanupDuplicateCollections;
window.findCollectionReferences = findCollectionReferences;

export { cleanupDuplicateCollections, findCollectionReferences };
