// src/utils/diagnoseSongStorage.js
// Browser-based diagnostic tool for Firebase Storage/Firestore alignment
// Run this in the browser console:
// import { diagnoseSongStorage } from './utils/diagnoseSongStorage'
// diagnoseSongStorage()

import { db } from '../firebaseConfig';
import { collection, query, limit, getDocs } from 'firebase/firestore';

export async function diagnoseSongStorage(sampleSize = 50) {
  console.log('\n========================================');
  console.log('DIAGNOSING SONG STORAGE ALIGNMENT');
  console.log('========================================\n');

  try {
    const songsRef = collection(db, 'songs');
    const q = query(songsRef, limit(sampleSize));
    const snapshot = await getDocs(q);

    console.log(`Analyzing ${snapshot.size} song documents...\n`);

    const pathStats = {};
    const missingAudioUrl = [];
    const urlFormats = {
      firebaseStorage: 0,  // firebasestorage.googleapis.com URLs
      directPaths: 0,      // /music/ or similar
      other: 0
    };

    snapshot.forEach((doc) => {
      const song = doc.data();
      const audioUrl = song.audioUrl || song.streamUrl || song.url || song.src;

      if (!audioUrl) {
        missingAudioUrl.push({
          id: doc.id,
          title: song.title || 'Untitled'
        });
        return;
      }

      // Categorize URL type
      if (audioUrl.includes('firebasestorage.googleapis.com')) {
        urlFormats.firebaseStorage++;

        // Extract path from URL
        const match = audioUrl.match(/\/o\/([^?]+)/);
        if (match) {
          const filePath = decodeURIComponent(match[1]);
          const pathPrefix = filePath.split('/')[0];
          pathStats[pathPrefix] = (pathStats[pathPrefix] || 0) + 1;
        }
      } else if (audioUrl.startsWith('/')) {
        urlFormats.directPaths++;
      } else {
        urlFormats.other++;
      }
    });

    console.log('📊 STATISTICS');
    console.log('================\n');

    console.log('URL Formats:');
    console.log(`  Firebase Storage URLs: ${urlFormats.firebaseStorage}`);
    console.log(`  Direct paths (/music/...): ${urlFormats.directPaths}`);
    console.log(`  Other formats: ${urlFormats.other}`);

    console.log('\nStorage Path Distribution:');
    Object.entries(pathStats).forEach(([path, count]) => {
      const percentage = ((count / snapshot.size) * 100).toFixed(1);
      console.log(`  ${path}: ${count} songs (${percentage}%)`);
    });

    if (missingAudioUrl.length > 0) {
      console.log(`\n⚠️  ${missingAudioUrl.length} songs have NO audio URL`);
      console.log('Sample missing URLs:');
      missingAudioUrl.slice(0, 10).forEach(({ id, title }) => {
        console.log(`  - ${title} (${id})`);
      });
    }

    console.log('\n🔍 FINDINGS');
    console.log('================\n');

    if (Object.keys(pathStats).length > 1) {
      console.log('⚠️  ISSUE: Songs are stored in multiple locations:');
      Object.keys(pathStats).forEach(path => {
        console.log(`  - ${path}`);
      });
      console.log('\nThis fragmentation can cause issues. Consider standardizing to one location.');
    }

    if (urlFormats.directPaths > 0) {
      console.log('⚠️  ISSUE: Some songs use direct paths instead of Firebase Storage URLs');
      console.log('   These may not work correctly with signed URL authentication.');
    }

    const recommendedPath = Object.entries(pathStats).sort((a, b) => b[1] - a[1])[0];
    if (recommendedPath) {
      console.log(`\n✅ RECOMMENDATION: Standardize all audio to: ${recommendedPath[0]}/`);
      console.log(`   This is currently used by ${recommendedPath[1]} songs (most common)`);
    }

    console.log('\n✅ Diagnosis complete');

    return {
      totalSongs: snapshot.size,
      pathStats,
      missingAudioUrl,
      urlFormats,
      recommendedPath: recommendedPath?.[0]
    };
  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
    throw error;
  }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  window.diagnoseSongStorage = diagnoseSongStorage;
}
