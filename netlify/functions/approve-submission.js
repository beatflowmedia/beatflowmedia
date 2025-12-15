// netlify/functions/approve-submission.js
// Approve artist submission and publish to songs/albums collections

const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { submissionId } = JSON.parse(event.body);

    if (!submissionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing submissionId' })
      };
    }

    // Get the submission
    const submissionRef = db.collection('artistSubmissions').doc(submissionId);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Submission not found' })
      };
    }

    const submission = submissionDoc.data();
    console.log('Approving submission:', submissionId, submission.releaseType);

    // Convert releaseDate string to Date object for proper Firestore queries
    let releaseDateObj;
    if (submission.releaseDate) {
      releaseDateObj = new Date(submission.releaseDate);
    } else {
      releaseDateObj = new Date();
    }
    console.log('Release date:', submission.releaseDate, '-> Date object:', releaseDateObj);

    // Create album if it's an album release
    let albumId = null;
    if (submission.releaseType === 'album') {
      // Calculate album price: trackCount × $1.99 × 0.75 (25% discount)
      const trackCount = submission.tracks.length;
      const albumPrice = Math.round(trackCount * 199 * 0.75); // Price in cents

      const albumData = {
        title: submission.albumTitle,
        artistName: submission.artist,
        artist: submission.artist,
        coverUrl: submission.coverUrl,
        releaseDate: releaseDateObj,
        recordLabel: submission.recordLabel || 'BeatFlow Media Group',
        copyrightYear: submission.copyrightYear,
        copyrightHolder: submission.copyrightHolder,
        description: submission.description || '',
        genre: submission.tracks[0]?.primaryGenre || 'Unknown',
        trackCount: trackCount,
        price: albumPrice, // Album price with 25% discount
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        uploadedBy: submission.uploadedBy,
        status: 'published',
        playCount: 0,
        likeCount: 0
      };

      const albumRef = await db.collection('albums').add(albumData);
      albumId = albumRef.id;
      console.log('Created album:', albumId);
    }

    // Create songs from tracks
    const songIds = [];
    for (let index = 0; index < submission.tracks.length; index++) {
      const track = submission.tracks[index];
      const songData = {
        title: track.title,
        artist: submission.artist,
        artistName: submission.artist,
        audioUrl: track.audioUrl,
        coverUrl: submission.coverUrl, // Use album/single cover
        duration: track.duration || 0,
        genre: track.primaryGenre || 'Unknown',
        additionalGenres: track.additionalGenres || [],
        explicit: track.explicit || false,
        isInstrumental: track.isInstrumental || false,
        isRadioEdit: track.isRadioEdit || false,
        isCoverSong: track.isCoverSong || false,
        isAIGenerated: track.isAIGenerated || false,
        aiGenerationDetails: track.aiGenerationDetails || '',
        originalArtist: track.originalArtist || '',
        language: track.language || 'English',
        writers: track.writers || [],
        writerRoles: track.writerRoles || [],
        composers: track.composers || '',
        publishers: track.publishers || '',
        featuredArtists: track.featuredArtists || '',
        remixer: track.remixer || '',
        isrc: track.isrc || '',
        releaseDate: releaseDateObj,
        recordLabel: submission.recordLabel || 'BeatFlow Media Group',
        copyrightYear: submission.copyrightYear,
        copyrightHolder: submission.copyrightHolder,
        albumId: albumId || null,
        albumTitle: submission.releaseType === 'album' ? submission.albumTitle : null,
        trackNumber: index + 1, // Track position in album (1-indexed)
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        uploadedBy: submission.uploadedBy,
        status: 'published',
        playCount: 0,
        likeCount: 0,
        price: 199 // Default price in cents ($1.99)
      };

      const songRef = await db.collection('songs').add(songData);
      songIds.push(songRef.id);
      console.log('Created song:', songRef.id, `Track ${index + 1}:`, track.title);
    }

    // Update album with song IDs if it's an album
    if (albumId) {
      await db.collection('albums').doc(albumId).update({
        songs: songIds
      });
    }

    // Update submission status to published
    await submissionRef.update({
      status: 'published',
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      publishedAlbumId: albumId,
      publishedSongIds: songIds
    });

    console.log(`✅ Submission ${submissionId} approved and published`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Submission approved and published',
        albumId,
        songIds
      })
    };
  } catch (error) {
    console.error('Error approving submission:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Failed to approve submission'
      })
    };
  }
};
