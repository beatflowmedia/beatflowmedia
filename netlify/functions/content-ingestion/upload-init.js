// netlify/functions/content-ingestion/upload-init.js
// Initialize resumable upload session using TUS protocol
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const crypto = require('crypto');

// Initialize Firebase Admin if not already done
const { initializeApp, getApps, cert } = require('firebase-admin/app');

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const db = getFirestore();
const storage = getStorage();

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Upload-Length, Upload-Metadata, Tus-Resumable',
    'Access-Control-Allow-Methods': 'POST, PATCH, HEAD, OPTIONS',
    'Access-Control-Expose-Headers': 'Upload-Offset, Upload-Length, Location, Tus-Resumable',
    'Tus-Resumable': '1.0.0',
    'Tus-Version': '1.0.0',
    'Tus-Extension': 'creation,expiration,checksum'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Verify authentication
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authentication required' })
      };
    }

    // Parse upload metadata
    const uploadLength = parseInt(event.headers['upload-length']);
    const uploadMetadata = event.headers['upload-metadata'];

    if (!uploadLength) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Upload-Length header required' })
      };
    }

    // Parse metadata from base64 encoded string
    let metadata = {};
    if (uploadMetadata) {
      const pairs = uploadMetadata.split(',');
      pairs.forEach(pair => {
        const [key, value] = pair.trim().split(' ');
        if (key && value) {
          metadata[key] = Buffer.from(value, 'base64').toString('utf-8');
        }
      });
    }

    // Generate unique upload ID
    const uploadId = crypto.randomUUID();
    const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create upload session document
    const uploadSession = {
      id: uploadId,
      uploadLength,
      uploadOffset: 0,
      metadata,
      status: 'created',
      createdAt: new Date(),
      expiresAt: expirationDate,
      userId: context.user?.uid || null,
      chunks: [],
      processingStage: 'pending',
      validationResults: null,
      transcodingStatus: null
    };

    // Store upload session in Firestore
    await db.collection('uploadSessions').doc(uploadId).set(uploadSession);

    // Return upload URL and session ID
    const uploadUrl = `${process.env.URL}/.netlify/functions/content-ingestion/upload-chunk/${uploadId}`;

    return {
      statusCode: 201,
      headers: {
        ...headers,
        'Location': uploadUrl,
        'Upload-Expires': expirationDate.toISOString()
      },
      body: JSON.stringify({
        uploadId,
        uploadUrl,
        expiresAt: expirationDate.toISOString()
      })
    };

  } catch (error) {
    console.error('Upload initialization error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};