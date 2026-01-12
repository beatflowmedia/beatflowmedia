// Script to normalize song cover image fields across Firebase
// Standardizes old 'cover' field to 'coverUrl' for consistency
// Run with: node src/scripts/normalize-song-images.js [--dry-run]

const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 100;

// Statistics
const stats = {
  total: 0,
  hasCoverUrl: 0,
  hasCover: 0,
  hasBoth: 0,
  hasNeither: 0,
  needsUpdate: 0,
  updated: 0,
  errors: 0,
  brokenUrls: []
};

/**
 * Check if a URL is a valid Firebase Storage URL
 */
function isValidFirebaseStorageUrl(url) {
  if (!url) return false;
  return url.includes('firebasestorage.googleapis.com') ||
         url.includes('firebase.storage') ||
         url.startsWith('http');
}

/**
 * Check if URL is a broken artist image reference
 */
function isBrokenArtistImageRef(url) {
  return url && url.includes('/artistImages/');
}

/**
 * Normalize a single song document
 */
async function normalizeSong(doc) {
  const data = doc.data();
  const updates = {};
  let needsUpdate = false;

  // Analyze current state
  const hasCoverUrl = !!data.coverUrl;
  const hasCover = !!data.cover;

  if (hasCoverUrl && hasCover) {
    stats.hasBoth++;
    // Has both - verify they're consistent
    if (data.coverUrl !== data.cover) {
      console.log(`⚠️  "${data.title}" has different cover and coverUrl`);
      console.log(`   coverUrl: ${data.coverUrl}`);
      console.log(`   cover: ${data.cover}`);
      // Prefer coverUrl (newer field)
    }
  } else if (hasCoverUrl && !hasCover) {
    stats.hasCoverUrl++;
    // Has coverUrl only - add cover for backward compatibility
    updates.cover = data.coverUrl;
    needsUpdate = true;
  } else if (!hasCoverUrl && hasCover) {
    stats.hasCover++;
    // Has cover only - copy to coverUrl (standardize on this field)
    updates.coverUrl = data.cover;
    needsUpdate = true;
  } else {
    stats.hasNeither++;
    console.log(`⚠️  "${data.title}" has NO cover image fields`);
  }

  // Check for broken artist image references
  if (hasCoverUrl && isBrokenArtistImageRef(data.coverUrl)) {
    stats.brokenUrls.push({
      id: doc.id,
      title: data.title,
      url: data.coverUrl
    });
    console.log(`🚨 "${data.title}" uses broken /artistImages/ reference`);
  }

  // Validate URLs if present
  const urlToCheck = data.coverUrl || data.cover;
  if (urlToCheck && !isValidFirebaseStorageUrl(urlToCheck)) {
    console.log(`⚠️  "${data.title}" has non-Firebase URL: ${urlToCheck.substring(0, 50)}...`);
  }

  return { updates, needsUpdate };
}

/**
 * Process songs in batches
 */
async function processBatch(snapshot) {
  const batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    stats.total++;

    try {
      const { updates, needsUpdate } = await normalizeSong(doc);

      if (needsUpdate) {
        stats.needsUpdate++;

        if (!DRY_RUN) {
          batch.update(doc.ref, updates);
          batchCount++;
        }

        const data = doc.data();
        console.log(`${DRY_RUN ? '🔍' : '✅'} "${data.title}"`);
        if (updates.coverUrl) {
          console.log(`   + Adding coverUrl: ${updates.coverUrl.substring(0, 60)}...`);
        }
        if (updates.cover) {
          console.log(`   + Adding cover: ${updates.cover.substring(0, 60)}...`);
        }
      }
    } catch (error) {
      stats.errors++;
      console.error(`❌ Error processing "${doc.data().title}":`, error.message);
    }
  }

  // Commit batch if not dry run
  if (!DRY_RUN && batchCount > 0) {
    await batch.commit();
    stats.updated += batchCount;
  }

  return batchCount;
}

/**
 * Main normalization function
 */
async function normalizeSongImages() {
  console.log('\n🎵 Song Image Normalization Script');
  console.log('=====================================\n');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  } else {
    console.log('⚠️  LIVE MODE - Changes will be written to Firebase\n');
  }

  try {
    // Get all songs
    console.log('📥 Fetching songs from Firebase...\n');
    const songsSnapshot = await db.collection('songs').get();

    if (songsSnapshot.empty) {
      console.log('⚠️  No songs found in collection');
      process.exit(0);
    }

    // Process in batches
    let lastDoc = null;
    let hasMore = true;
    let batchNum = 0;

    while (hasMore) {
      batchNum++;
      console.log(`\n📦 Processing batch ${batchNum}...\n`);

      let query = db.collection('songs').limit(BATCH_SIZE);
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      if (snapshot.empty) {
        hasMore = false;
        break;
      }

      await processBatch(snapshot);
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      hasMore = snapshot.docs.length === BATCH_SIZE;
    }

    // Print summary
    console.log('\n\n📊 Normalization Summary');
    console.log('========================\n');
    console.log(`Total songs processed: ${stats.total}`);
    console.log(`\nCurrent State:`);
    console.log(`  - Has coverUrl only: ${stats.hasCoverUrl}`);
    console.log(`  - Has cover only: ${stats.hasCover}`);
    console.log(`  - Has both fields: ${stats.hasBoth}`);
    console.log(`  - Has neither: ${stats.hasNeither}`);
    console.log(`\nChanges:`);
    console.log(`  - Songs needing update: ${stats.needsUpdate}`);
    console.log(`  - Songs updated: ${DRY_RUN ? 0 : stats.updated}`);
    console.log(`  - Errors: ${stats.errors}`);

    if (stats.brokenUrls.length > 0) {
      console.log(`\n🚨 Broken /artistImages/ References (${stats.brokenUrls.length}):`);
      stats.brokenUrls.forEach(({ title, url }) => {
        console.log(`  - "${title}": ${url}`);
      });
      console.log('\n⚠️  These need manual review and fixing!');
    }

    if (DRY_RUN) {
      console.log('\n💡 Run without --dry-run to apply changes');
    } else {
      console.log('\n✅ Normalization complete!');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
normalizeSongImages();
