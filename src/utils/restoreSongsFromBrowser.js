/**
 * Browser-based songs restoration
 *
 * Instructions:
 * 1. Open your app in the browser (localhost:3000)
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Run: window.restoreSongs()
 */

import { db } from '../firebaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  Timestamp,
  arrayUnion
} from 'firebase/firestore';

async function restoreSongs() {
  console.log('🔄 Starting songs restoration from browser...\n');

  try {
    // Check current state
    console.log('📊 Checking current collections...');
    const songsSnap = await getDocs(query(collection(db, 'songs')));
    const albumsSnap = await getDocs(collection(db, 'albums'));
    const submissionsSnap = await getDocs(
      query(
        collection(db, 'artistSubmissions'),
        where('status', 'in', ['approved', 'published'])
      )
    );

    console.log(`   Songs: ${songsSnap.size}`);
    console.log(`   Albums: ${albumsSnap.size}`);
    console.log(`   Approved Submissions: ${submissionsSnap.size}\n`);

    if (submissionsSnap.size === 0) {
      console.log('⚠️  No approved submissions found. Nothing to restore.');
      return;
    }

    // eslint-disable-next-line no-restricted-globals
    const confirmRestore = confirm(
      `This will restore songs from ${submissionsSnap.size} approved submissions.\n\nContinue?`
    );

    if (!confirmRestore) {
      console.log('❌ Restoration cancelled');
      return;
    }

    let totalCreated = 0;
    let totalSkipped = 0;
    let errors = 0;

    for (const submissionDoc of submissionsSnap.docs) {
      const submission = submissionDoc.data();
      const submissionId = submissionDoc.id;

      console.log(`\n📀 "${submission.albumTitle}" by ${submission.artist}`);
      console.log(`   Type: ${submission.releaseType}, Tracks: ${submission.tracks?.length || 0}`);

      if (!submission.tracks || submission.tracks.length === 0) {
        console.log('   ⚠️  No tracks, skipping');
        continue;
      }

      const albumId = submission.publishedAlbumId || null;
      const songIds = [];

      for (let i = 0; i < submission.tracks.length; i++) {
        const track = submission.tracks[i];

        if (!track.title || !track.audioUrl) {
          console.log(`   ⚠️  Track ${i + 1} missing data, skipping`);
          continue;
        }

        try {
          // Check if exists
          const existingQuery = query(
            collection(db, 'songs'),
            where('title', '==', track.title),
            where('artist', '==', submission.artist)
          );
          const existing = await getDocs(existingQuery);

          if (existing.size > 0) {
            songIds.push(existing.docs[0].id);
            console.log(`   ✓ Exists: "${track.title}"`);
            totalSkipped++;
            continue;
          }

          // Create song
          const songData = {
            title: track.title,
            artist: submission.artist,
            artistName: submission.artist,
            audioUrl: track.audioUrl,
            coverUrl: submission.coverUrl || '/images/Logo.png',
            duration: track.duration || 0,
            genre: track.primaryGenre || 'Unknown',
            additionalGenres: track.additionalGenres || [],
            explicit: track.explicit || false,
            isInstrumental: track.isInstrumental || false,
            isAIGenerated: track.isAIGenerated || false,
            language: track.language || 'English',
            writers: track.writers || [],
            composers: track.composers || '',
            publishers: track.publishers || '',
            albumId: albumId,
            albumTitle: albumId ? submission.albumTitle : null,
            trackNumber: i + 1,
            releaseDate: submission.releaseDate || Timestamp.now(),
            recordLabel: submission.recordLabel || 'BeatFlow Media Group',
            copyrightYear: submission.copyrightYear || new Date().getFullYear(),
            copyrightHolder: submission.copyrightHolder || submission.artist,
            createdAt: Timestamp.now(),
            uploadedBy: submission.uploadedBy,
            status: 'published',
            playCount: 0,
            likeCount: 0,
            isVisible: true,
            price: 199
          };

          const songRef = await addDoc(collection(db, 'songs'), songData);
          songIds.push(songRef.id);
          console.log(`   ✅ Created: "${track.title}"`);
          totalCreated++;

        } catch (err) {
          console.error(`   ❌ Error: ${err.message}`);
          errors++;
        }
      }

      // Update album
      if (albumId && songIds.length > 0) {
        try {
          await updateDoc(doc(db, 'albums', albumId), {
            songs: arrayUnion(...songIds)
          });
          console.log(`   ✅ Updated album with songs`);
        } catch (err) {
          console.error(`   ⚠️  Could not update album: ${err.message}`);
        }
      }

      // Update submission
      if (songIds.length > 0) {
        try {
          await updateDoc(doc(db, 'artistSubmissions', submissionId), {
            publishedSongIds: songIds,
            status: 'published'
          });
        } catch (err) {
          // Non-critical
        }
      }
    }

    console.log(`\n✅ RESTORATION COMPLETE!`);
    console.log(`   Created: ${totalCreated}`);
    console.log(`   Skipped (already exist): ${totalSkipped}`);
    console.log(`   Errors: ${errors}`);
    console.log(`\n🔄 Refresh the page to see your songs!\n`);

    alert(`Restoration complete!\n\nCreated: ${totalCreated} songs\nSkipped: ${totalSkipped}\nErrors: ${errors}\n\nRefresh the page to see results!`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    alert(`Error: ${error.message}`);
  }
}

// Export for use in browser console
window.restoreSongs = restoreSongs;

export { restoreSongs };
