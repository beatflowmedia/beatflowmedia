// netlify/functions/content-ingestion/upload-chunk.js
// Handle resumable upload chunks using TUS protocol
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Upload-Offset, Upload-Checksum, Tus-Resumable',
    'Access-Control-Allow-Methods': 'PATCH, HEAD, OPTIONS',
    'Access-Control-Expose-Headers': 'Upload-Offset, Upload-Length, Tus-Resumable',
    'Tus-Resumable': '1.0.0'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Extract upload ID from path
  const uploadId = event.path.split('/').pop();
  if (!uploadId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Upload ID required' })
    };
  }

  try {
    // Get upload session
    const uploadDoc = await db.collection('uploadSessions').doc(uploadId).get();
    if (!uploadDoc.exists) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Upload session not found' })
      };
    }

    const uploadSession = uploadDoc.data();

    // Check if upload has expired
    if (uploadSession.expiresAt.toDate() < new Date()) {
      return {
        statusCode: 410,
        headers,
        body: JSON.stringify({ error: 'Upload session expired' })
      };
    }

    // Handle HEAD request (get upload offset)
    if (event.httpMethod === 'HEAD') {
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Upload-Offset': uploadSession.uploadOffset.toString(),
          'Upload-Length': uploadSession.uploadLength.toString(),
          'Cache-Control': 'no-store'
        },
        body: ''
      };
    }

    // Handle PATCH request (upload chunk)
    if (event.httpMethod === 'PATCH') {
      const uploadOffset = parseInt(event.headers['upload-offset'] || '0');
      const contentType = event.headers['content-type'];
      const uploadChecksum = event.headers['upload-checksum'];

      // Verify offset matches expected
      if (uploadOffset !== uploadSession.uploadOffset) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            error: 'Upload offset conflict',
            expectedOffset: uploadSession.uploadOffset,
            providedOffset: uploadOffset
          })
        };
      }

      // Get chunk data from body (base64 encoded in Netlify Functions)
      const chunkData = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'binary');

      // Verify checksum if provided
      if (uploadChecksum) {
        const [algorithm, expectedHash] = uploadChecksum.split(' ');
        if (algorithm === 'sha1') {
          const actualHash = crypto.createHash('sha1').update(chunkData).digest('base64');
          if (actualHash !== expectedHash) {
            return {
              statusCode: 460,
              headers,
              body: JSON.stringify({ error: 'Checksum mismatch' })
            };
          }
        }
      }

      // Store chunk in Firebase Storage
      const chunkId = crypto.randomUUID();
      const chunkPath = `uploads/${uploadId}/chunks/${chunkId}`;
      const bucket = storage.bucket();
      const file = bucket.file(chunkPath);

      await file.save(chunkData, {
        metadata: {
          contentType: contentType || 'application/octet-stream',
          metadata: {
            uploadId,
            chunkIndex: uploadSession.chunks.length,
            offset: uploadOffset,
            size: chunkData.length
          }
        }
      });

      // Update upload session
      const newOffset = uploadOffset + chunkData.length;
      const updatedChunks = [...uploadSession.chunks, {
        id: chunkId,
        path: chunkPath,
        offset: uploadOffset,
        size: chunkData.length,
        uploadedAt: new Date()
      }];

      await db.collection('uploadSessions').doc(uploadId).update({
        uploadOffset: newOffset,
        chunks: updatedChunks,
        updatedAt: new Date()
      });

      // Check if upload is complete
      if (newOffset >= uploadSession.uploadLength) {
        // Trigger file assembly and processing
        await triggerFileProcessing(uploadId);
      }

      return {
        statusCode: 204,
        headers: {
          ...headers,
          'Upload-Offset': newOffset.toString()
        },
        body: ''
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Upload chunk error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Trigger file assembly and processing pipeline
async function triggerFileProcessing(uploadId) {
  try {
    // Mark upload as complete and ready for processing
    await db.collection('uploadSessions').doc(uploadId).update({
      status: 'completed',
      processingStage: 'assembling',
      completedAt: new Date()
    });

    // Trigger file assembly function (could be a separate function or cloud task)
    const assemblyUrl = `${process.env.URL}/.netlify/functions/content-ingestion/assemble-file`;

    // Use fetch to trigger assembly (fire and forget)
    fetch(assemblyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId })
    }).catch(error => {
      console.error('Failed to trigger file assembly:', error);
    });

  } catch (error) {
    console.error('Error triggering file processing:', error);
  }
}