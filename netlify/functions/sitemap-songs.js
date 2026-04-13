// netlify/functions/sitemap-songs.js
// Dynamic sitemap generator for published songs

const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY_BASE64
    ? Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf8')
    : process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!privateKey) {
    throw new Error('Firebase private key not found');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
    })
  });
}

const db = admin.firestore();
const SITE_URL = 'https://beatflowmediagroup.com';

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    // Query all published songs (simple query, no composite index needed)
    const snapshot = await db.collection('songs')
      .where('approved', '==', true)
      .limit(5000)
      .get();

    const urls = snapshot.docs.map(doc => {
      const data = doc.data();
      const lastmod = data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date();
      const dateStr = lastmod.toISOString().split('T')[0];

      return `  <url>
    <loc>${SITE_URL}/song/${doc.id}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600'
      },
      body: xml
    };
  } catch (error) {
    console.error('Error generating songs sitemap:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/xml' },
      body: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`
    };
  }
};
