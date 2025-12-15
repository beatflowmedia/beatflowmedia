// netlify/functions/migrate-song-prices.js
// Migrate song prices from 299 cents ($2.99) to 99 cents ($0.99)

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

async function migratePrices() {
  try {
    console.log('Starting price migration...');

    // Get all songs with price = 299
    const songsSnapshot = await db.collection('songs').where('price', '==', 299).get();

    console.log(`Found ${songsSnapshot.size} songs with price 299`);

    let updated = 0;
    const batch = db.batch();

    songsSnapshot.forEach(doc => {
      batch.update(doc.ref, { price: 99 });
      updated++;
      console.log(`Updating ${doc.id} - ${doc.data().title}`);
    });

    await batch.commit();

    console.log(`✅ Successfully updated ${updated} songs to price 99 cents ($0.99)`);

    return {
      success: true,
      message: 'Migration complete',
      songsUpdated: updated
    };
  } catch (error) {
    console.error('Migration error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const result = await migratePrices();

  return {
    statusCode: result.success ? 200 : 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(result)
  };
};

// Allow running directly with node for testing
if (require.main === module) {
  migratePrices().then(result => {
    console.log('Migration result:', result);
    process.exit(result.success ? 0 : 1);
  });
}
