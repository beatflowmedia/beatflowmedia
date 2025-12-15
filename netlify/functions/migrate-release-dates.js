// netlify/functions/migrate-release-dates.js
// One-time migration to convert releaseDate strings to Date objects

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
    let songsUpdated = 0;
    let albumsUpdated = 0;

    // Migrate songs collection
    const songsSnapshot = await db.collection('songs').get();

    for (const doc of songsSnapshot.docs) {
      const data = doc.data();

      // Check if releaseDate exists and is a string
      if (data.releaseDate && typeof data.releaseDate === 'string') {
        const dateObj = new Date(data.releaseDate);
        await doc.ref.update({
          releaseDate: dateObj
        });
        console.log(`✅ Updated song ${doc.id}: ${data.releaseDate} -> Date object`);
        songsUpdated++;
      }
    }

    // Migrate albums collection
    const albumsSnapshot = await db.collection('albums').get();

    for (const doc of albumsSnapshot.docs) {
      const data = doc.data();

      // Check if releaseDate exists and is a string
      if (data.releaseDate && typeof data.releaseDate === 'string') {
        const dateObj = new Date(data.releaseDate);
        await doc.ref.update({
          releaseDate: dateObj
        });
        console.log(`✅ Updated album ${doc.id}: ${data.releaseDate} -> Date object`);
        albumsUpdated++;
      }
    }

    console.log(`🎉 Migration complete: ${songsUpdated} songs, ${albumsUpdated} albums updated`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Migration complete',
        songsUpdated,
        albumsUpdated
      })
    };
  } catch (error) {
    console.error('Error during migration:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Failed to migrate release dates'
      })
    };
  }
};
