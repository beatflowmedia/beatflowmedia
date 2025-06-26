// netlify/functions/submissions.js
// Handles curator submissions: create, fetch, update

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../../serviceAccountKey.json');

let app;
if (!app) {
  app = initializeApp({
    credential: cert(serviceAccount),
    projectId: 'beatflowmedia', // ensure correct Firebase project
  });
}
const db = getFirestore();

exports.handler = async (event) => {
  const { httpMethod, body, queryStringParameters, headers } = event;
  // CORS preflight
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-user-id',
      },
      body: ''
    };
  }
  // common response headers
  const respHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };
  try {
    // Simple auth check for brevity (replace with real auth in prod)
    const userId = headers['x-user-id'] || null;
    if (!userId) return { statusCode: 401, headers: respHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };

    if (httpMethod === 'POST') {
      // Create submission
      const { songId, playlistId } = JSON.parse(body);
      const docRef = await db.collection('submissions').add({
        songId,
        playlistId,
        artistId: userId,
        status: 'pending',
        feedback: '',
        createdAt: new Date(),
      });
      return { statusCode: 200, headers: respHeaders, body: JSON.stringify({ id: docRef.id }) };
    }

    if (httpMethod === 'GET') {
      // Fetch submissions (by artist or all for curators)
      const { mode } = queryStringParameters || {};
      let submissions = [];
      if (mode === 'curator') {
        const snap = await db.collection('submissions').get();
        submissions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else {
        const snap = await db.collection('submissions').where('artistId', '==', userId).get();
        submissions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      return { statusCode: 200, headers: respHeaders, body: JSON.stringify(submissions) };
    }

    if (httpMethod === 'PUT') {
      // Update submission (curator only)
      const { id, status, feedback } = JSON.parse(body);
      await db.collection('submissions').doc(id).update({ status, feedback });
      return { statusCode: 200, headers: respHeaders, body: JSON.stringify({ message: 'Updated' }) };
    }

    return { statusCode: 405, headers: respHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, headers: respHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
