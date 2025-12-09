// netlify/functions/content-ingestion/assemble-file.js
// Assemble uploaded chunks into complete file and trigger validation/processing
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST',
  };

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { uploadId } = JSON.parse(event.body);

    if (!uploadId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Upload ID required' })
      };
    }

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

    // Verify upload is complete
    if (uploadSession.uploadOffset < uploadSession.uploadLength) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Upload not complete' })
      };
    }

    console.log(`Assembling file for upload ${uploadId}`);

    // Update processing stage
    await db.collection('uploadSessions').doc(uploadId).update({
      processingStage: 'assembling',
      updatedAt: new Date()
    });

    // Assemble file from chunks
    const assembledFilePath = await assembleFileFromChunks(uploadId, uploadSession);

    // Update session with assembled file path
    await db.collection('uploadSessions').doc(uploadId).update({
      processingStage: 'validating',
      assembledFilePath,
      updatedAt: new Date()
    });

    // Trigger validation pipeline
    await triggerValidation(uploadId, assembledFilePath, uploadSession);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'File assembly initiated',
        uploadId,
        processingStage: 'validating'
      })
    };

  } catch (error) {
    console.error('File assembly error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function assembleFileFromChunks(uploadId, uploadSession) {
  const bucket = storage.bucket();
  const chunks = uploadSession.chunks.sort((a, b) => a.offset - b.offset);

  // Create write stream for assembled file
  const assembledPath = `uploads/${uploadId}/assembled/${uploadSession.metadata.filename || 'file'}`;
  const assembledFile = bucket.file(assembledPath);
  const writeStream = assembledFile.createWriteStream({
    metadata: {
      contentType: getContentType(uploadSession.metadata),
      metadata: {
        uploadId,
        originalFilename: uploadSession.metadata.filename,
        totalSize: uploadSession.uploadLength,
        chunksCount: chunks.length,
        assembledAt: new Date().toISOString()
      }
    }
  });

  return new Promise(async (resolve, reject) => {
    try {
      // Stream chunks in order
      for (const chunk of chunks) {
        const chunkFile = bucket.file(chunk.path);
        const chunkStream = chunkFile.createReadStream();

        await new Promise((chunkResolve, chunkReject) => {
          chunkStream.on('data', (data) => {
            writeStream.write(data);
          });

          chunkStream.on('end', chunkResolve);
          chunkStream.on('error', chunkReject);
        });
      }

      writeStream.end();
      writeStream.on('finish', () => {
        console.log(`File assembled successfully: ${assembledPath}`);
        resolve(assembledPath);
      });

      writeStream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
}

async function triggerValidation(uploadId, filePath, uploadSession) {
  try {
    // Create content processing record
    const contentRecord = {
      id: crypto.randomUUID(),
      uploadId,
      filePath,
      originalFilename: uploadSession.metadata.filename,
      fileSize: uploadSession.uploadLength,
      contentType: getContentType(uploadSession.metadata),
      status: 'pending_validation',
      processingSteps: {
        validation: { status: 'pending', startedAt: null, completedAt: null },
        virusScan: { status: 'pending', startedAt: null, completedAt: null },
        metadataExtraction: { status: 'pending', startedAt: null, completedAt: null },
        transcoding: { status: 'pending', startedAt: null, completedAt: null },
        packaging: { status: 'pending', startedAt: null, completedAt: null },
        drm: { status: 'pending', startedAt: null, completedAt: null }
      },
      metadata: {
        title: uploadSession.metadata.title,
        artist: uploadSession.metadata.artist,
        album: uploadSession.metadata.album,
        genre: uploadSession.metadata.genre,
        isrc: uploadSession.metadata.isrc,
        territorialRights: uploadSession.metadata.territorialRights || 'worldwide',
        releaseDate: uploadSession.metadata.releaseDate,
        label: uploadSession.metadata.label,
        copyrightOwner: uploadSession.metadata.copyrightOwner
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: uploadSession.userId
    };

    // Store content record
    await db.collection('contentProcessing').doc(contentRecord.id).set(contentRecord);

    // Trigger validation function
    const validationUrl = `${process.env.URL}/.netlify/functions/content-ingestion/validate-content`;
    fetch(validationUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId: contentRecord.id })
    }).catch(error => {
      console.error('Failed to trigger validation:', error);
    });

    console.log(`Validation triggered for content ${contentRecord.id}`);

  } catch (error) {
    console.error('Error triggering validation:', error);
    throw error;
  }
}

function getContentType(metadata) {
  const filename = metadata.filename || '';
  const ext = filename.toLowerCase().split('.').pop();

  const mimeTypes = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'flac': 'audio/flac',
    'aac': 'audio/aac',
    'ogg': 'audio/ogg',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska'
  };

  return mimeTypes[ext] || 'application/octet-stream';
}