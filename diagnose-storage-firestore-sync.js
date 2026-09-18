// diagnose-storage-firestore-sync.js
// Script to diagnose Firebase Storage and Firestore synchronization issues
// Run with: node diagnose-storage-firestore-sync.js
//
// NOTE: This script requires admin credentials to access Firebase Storage
// If you don't have serviceAccountKey.json, you can:
// 1. Download it from Firebase Console > Project Settings > Service Accounts
// 2. Or use Firebase Application Default Credentials:
//    Set GOOGLE_APPLICATION_CREDENTIALS environment variable

const admin = require('firebase-admin');

// Try to use Application Default Credentials if service account key doesn't exist
let credential;
try {
  const serviceAccount = require('./serviceAccountKey.json');
  credential = admin.credential.cert(serviceAccount);
} catch (error) {
  console.log('Using Application Default Credentials (set GOOGLE_APPLICATION_CREDENTIALS if this fails)');
  credential = admin.credential.applicationDefault();
}

admin.initializeApp({
  credential: credential,
  storageBucket: 'beatflowmedia.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function analyzeSongDocuments() {
  console.log('\n========================================');
  console.log('ANALYZING FIRESTORE SONG DOCUMENTS');
  console.log('========================================\n');

  const songsSnapshot = await db.collection('songs').limit(50).get();
  console.log(`Found ${songsSnapshot.size} song documents\n`);

  const pathStats = {};
  const missingFiles = [];
  const goodFiles = [];

  for (const doc of songsSnapshot.docs) {
    const song = doc.data();
    const audioUrl = song.audioUrl || song.streamUrl || song.url || song.src;

    if (!audioUrl) {
      console.log(`❌ Song ${doc.id} (${song.title || 'Untitled'}) - NO AUDIO URL FIELD`);
      continue;
    }

    // Extract path from URL
    const match = audioUrl.match(/\/o\/([^?]+)/);
    if (!match) {
      console.log(`⚠️  Song ${doc.id} (${song.title || 'Untitled'}) - Invalid URL format: ${audioUrl}`);
      continue;
    }

    const filePath = decodeURIComponent(match[1]);
    const pathPrefix = filePath.split('/')[0];

    // Track path statistics
    pathStats[pathPrefix] = (pathStats[pathPrefix] || 0) + 1;

    // Check if file exists in storage
    const file = bucket.file(filePath);
    const [exists] = await file.exists();

    if (exists) {
      goodFiles.push({
        songId: doc.id,
        title: song.title,
        path: filePath
      });
    } else {
      missingFiles.push({
        songId: doc.id,
        title: song.title,
        path: filePath,
        url: audioUrl
      });
      console.log(`❌ File NOT FOUND: ${filePath}`);
      console.log(`   Song: ${song.title || 'Untitled'} (${doc.id})`);
    }
  }

  console.log('\n========================================');
  console.log('STORAGE PATH STATISTICS');
  console.log('========================================\n');
  Object.entries(pathStats).forEach(([path, count]) => {
    console.log(`${path}: ${count} songs`);
  });

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================\n');
  console.log(`✅ Files found in storage: ${goodFiles.length}`);
  console.log(`❌ Files missing from storage: ${missingFiles.length}`);

  if (missingFiles.length > 0) {
    console.log('\nMissing files details:');
    missingFiles.forEach(({ songId, title, path }) => {
      console.log(`  - ${title} (${songId}): ${path}`);
    });
  }

  return { pathStats, missingFiles, goodFiles };
}

async function analyzeStorageFiles() {
  console.log('\n========================================');
  console.log('ANALYZING FIREBASE STORAGE FILES');
  console.log('========================================\n');

  const folders = ['admin-uploads', 'artist-uploads/audio', 'songs/audio', 'audio'];
  const storageStats = {};

  for (const folder of folders) {
    try {
      const [files] = await bucket.getFiles({ prefix: folder });
      const audioFiles = files.filter(f =>
        f.name.endsWith('.mp3') ||
        f.name.endsWith('.wav') ||
        f.name.endsWith('.m4a') ||
        f.name.endsWith('.flac')
      );

      storageStats[folder] = audioFiles.length;
      console.log(`${folder}: ${audioFiles.length} audio files`);

      if (audioFiles.length > 0 && audioFiles.length <= 10) {
        console.log('  Sample files:');
        audioFiles.slice(0, 5).forEach(f => {
          console.log(`    - ${f.name}`);
        });
      }
    } catch (error) {
      console.log(`❌ Error accessing ${folder}:`, error.message);
    }
  }

  return storageStats;
}

async function main() {
  try {
    const storageStats = await analyzeStorageFiles();
    const { pathStats, missingFiles, goodFiles } = await analyzeSongDocuments();

    console.log('\n========================================');
    console.log('RECOMMENDATIONS');
    console.log('========================================\n');

    if (missingFiles.length > 0) {
      console.log('⚠️  ISSUE DETECTED: Some songs reference files that don\'t exist in storage');
      console.log('\nPossible causes:');
      console.log('1. Files were deleted from storage but song documents weren\'t updated');
      console.log('2. Files are in a different storage bucket');
      console.log('3. File paths in Firestore are incorrect');
      console.log('\nRecommended action:');
      console.log('- Review and delete orphaned song documents, OR');
      console.log('- Re-upload missing audio files to correct paths');
    }

    const storageFolders = Object.keys(storageStats).filter(k => storageStats[k] > 0);
    const dbFolders = Object.keys(pathStats);

    console.log('\nStorage folders with files:', storageFolders);
    console.log('Firestore references use:', dbFolders);

    if (JSON.stringify(storageFolders.sort()) !== JSON.stringify(dbFolders.sort())) {
      console.log('\n⚠️  MISMATCH: Storage and Firestore are using different folder structures');
      console.log('This indicates the database and storage are not aligned.');
    }

    console.log('\n✅ Diagnosis complete');
    process.exit(0);
  } catch (error) {
    console.error('Error during diagnosis:', error);
    process.exit(1);
  }
}

main();
