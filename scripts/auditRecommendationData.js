/**
 * Audit Script for AI Recommendation System
 *
 * Analyzes current Firestore data to understand:
 * - How many songs, playlists, users exist
 * - What fields are populated
 * - Data quality for recommendations
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function auditRecommendationData() {
  console.log('🔍 Starting Recommendation System Data Audit...\n');

  try {
    // 1. Audit Songs Collection
    console.log('📀 SONGS COLLECTION');
    console.log('─'.repeat(60));
    const songsSnapshot = await db.collection('songs').limit(1000).get();
    const totalSongs = songsSnapshot.size;
    console.log(`Total songs (sample): ${totalSongs}`);

    if (totalSongs > 0) {
      const sampleSong = songsSnapshot.docs[0].data();
      console.log('\nSample song structure:');
      console.log(JSON.stringify(sampleSong, null, 2).substring(0, 500) + '...');

      // Check for acoustic features
      const songsWithAcoustics = songsSnapshot.docs.filter(doc =>
        doc.data().acousticFeatures
      ).length;
      console.log(`\nSongs with acoustic features: ${songsWithAcoustics}/${totalSongs}`);

      // Check for genres
      const songsWithGenre = songsSnapshot.docs.filter(doc =>
        doc.data().genre || doc.data().category
      ).length;
      console.log(`Songs with genre/category: ${songsWithGenre}/${totalSongs}`);

      // Genre distribution
      const genreMap = {};
      songsSnapshot.docs.forEach(doc => {
        const genre = doc.data().genre || doc.data().category || 'Unknown';
        genreMap[genre] = (genreMap[genre] || 0) + 1;
      });
      console.log('\nGenre distribution:');
      Object.entries(genreMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([genre, count]) => {
          console.log(`  ${genre}: ${count}`);
        });
    }

    // 2. Audit Playlists Collection
    console.log('\n\n📋 PLAYLISTS COLLECTION');
    console.log('─'.repeat(60));
    const playlistsSnapshot = await db.collection('playlists').limit(1000).get();
    const totalPlaylists = playlistsSnapshot.size;
    console.log(`Total public playlists: ${totalPlaylists}`);

    if (totalPlaylists > 0) {
      const samplePlaylist = playlistsSnapshot.docs[0].data();
      console.log('\nSample playlist structure:');
      console.log(JSON.stringify(samplePlaylist, null, 2).substring(0, 500) + '...');

      // Check for playlist profiles
      const playlistsWithProfile = playlistsSnapshot.docs.filter(doc =>
        doc.data().playlistProfile || doc.data().targetGenres
      ).length;
      console.log(`\nPlaylists with profile data: ${playlistsWithProfile}/${totalPlaylists}`);

      // Average songs per playlist
      const totalSongsInPlaylists = playlistsSnapshot.docs.reduce((sum, doc) => {
        const songs = doc.data().songs || [];
        return sum + songs.length;
      }, 0);
      console.log(`Average songs per playlist: ${(totalSongsInPlaylists / totalPlaylists).toFixed(1)}`);
    }

    // 3. Audit Users Collection
    console.log('\n\n👥 USERS COLLECTION');
    console.log('─'.repeat(60));
    const usersSnapshot = await db.collection('users').limit(1000).get();
    const totalUsers = usersSnapshot.size;
    console.log(`Total users (sample): ${totalUsers}`);

    if (totalUsers > 0) {
      const sampleUser = usersSnapshot.docs[0].data();
      console.log('\nSample user structure (excluding sensitive data):');
      const safeSample = { ...sampleUser };
      delete safeSample.email;
      delete safeSample.phoneNumber;
      console.log(JSON.stringify(safeSample, null, 2).substring(0, 500) + '...');

      // Check for preferences
      const usersWithPreferences = usersSnapshot.docs.filter(doc =>
        doc.data().preferences || doc.data().favoriteGenres
      ).length;
      console.log(`\nUsers with preference data: ${usersWithPreferences}/${totalUsers}`);
    }

    // 4. Audit Play Events
    console.log('\n\n▶️  PLAY EVENTS COLLECTION');
    console.log('─'.repeat(60));
    const playEventsSnapshot = await db.collection('playEvents')
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get();
    const totalPlayEvents = playEventsSnapshot.size;
    console.log(`Total play events (recent 1000): ${totalPlayEvents}`);

    if (totalPlayEvents > 0) {
      const sampleEvent = playEventsSnapshot.docs[0].data();
      console.log('\nSample play event structure:');
      console.log(JSON.stringify(sampleEvent, null, 2));

      // Check for completion rate data
      const eventsWithCompletionRate = playEventsSnapshot.docs.filter(doc =>
        doc.data().completionRate !== undefined
      ).length;
      console.log(`\nEvents with completion rate: ${eventsWithCompletionRate}/${totalPlayEvents}`);

      // Average completion rate
      const avgCompletionRate = playEventsSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().completionRate || 0);
      }, 0) / totalPlayEvents;
      console.log(`Average completion rate: ${(avgCompletionRate * 100).toFixed(1)}%`);
    }

    // 5. Audit Like Events
    console.log('\n\n❤️  LIKE EVENTS COLLECTION');
    console.log('─'.repeat(60));
    const likeEventsSnapshot = await db.collection('likeEvents')
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get();
    const totalLikeEvents = likeEventsSnapshot.size;
    console.log(`Total like events (recent 1000): ${totalLikeEvents}`);

    // 6. Summary & Recommendations
    console.log('\n\n📊 SUMMARY & RECOMMENDATIONS');
    console.log('═'.repeat(60));

    console.log('\n✅ Data Availability:');
    console.log(`  • Songs: ${totalSongs > 0 ? '✓' : '✗'} (${totalSongs} found)`);
    console.log(`  • Playlists: ${totalPlaylists > 0 ? '✓' : '✗'} (${totalPlaylists} found)`);
    console.log(`  • Users: ${totalUsers > 0 ? '✓' : '✗'} (${totalUsers} found)`);
    console.log(`  • Play Events: ${totalPlayEvents > 0 ? '✓' : '✗'} (${totalPlayEvents} found)`);
    console.log(`  • Like Events: ${totalLikeEvents > 0 ? '✓' : '✗'} (${totalLikeEvents} found)`);

    console.log('\n⚠️  Data Gaps:');
    if (totalSongs > 0) {
      const songsWithAcoustics = songsSnapshot.docs.filter(doc =>
        doc.data().acousticFeatures
      ).length;
      if (songsWithAcoustics === 0) {
        console.log('  • No acoustic features found - need audio analysis');
      }
    }

    if (totalPlaylists > 0) {
      const playlistsWithProfile = playlistsSnapshot.docs.filter(doc =>
        doc.data().playlistProfile
      ).length;
      if (playlistsWithProfile === 0) {
        console.log('  • No playlist profiles found - need curator metadata');
      }
    }

    if (totalUsers > 0) {
      const usersWithPreferences = usersSnapshot.docs.filter(doc =>
        doc.data().preferences
      ).length;
      if (usersWithPreferences === 0) {
        console.log('  • No user preferences found - need onboarding');
      }
    }

    console.log('\n🚀 Ready for Phase 1?');
    const readyForPhase1 = totalSongs > 0 && totalPlaylists > 0 && totalUsers > 0 && totalPlayEvents > 0;
    console.log(`  ${readyForPhase1 ? 'YES ✓' : 'NOT YET ✗'} - ${readyForPhase1 ? 'Sufficient data to start recommendations' : 'Need more base data'}`);

    console.log('\n');

  } catch (error) {
    console.error('❌ Error during audit:', error);
    throw error;
  } finally {
    // Clean up
    await admin.app().delete();
  }
}

// Run the audit
auditRecommendationData()
  .then(() => {
    console.log('✅ Audit complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Audit failed:', error);
    process.exit(1);
  });
