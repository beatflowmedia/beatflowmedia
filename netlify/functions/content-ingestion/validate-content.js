// netlify/functions/content-ingestion/validate-content.js
// Content validation service including file format validation, virus scanning, and metadata extraction
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

// Supported file formats and their validation rules
const SUPPORTED_FORMATS = {
  audio: {
    'audio/mpeg': { extensions: ['.mp3'], maxSize: 500 * 1024 * 1024 }, // 500MB
    'audio/wav': { extensions: ['.wav'], maxSize: 1024 * 1024 * 1024 }, // 1GB
    'audio/flac': { extensions: ['.flac'], maxSize: 1024 * 1024 * 1024 }, // 1GB
    'audio/aac': { extensions: ['.aac', '.m4a'], maxSize: 500 * 1024 * 1024 }, // 500MB
    'audio/ogg': { extensions: ['.ogg'], maxSize: 500 * 1024 * 1024 } // 500MB
  },
  video: {
    'video/mp4': { extensions: ['.mp4'], maxSize: 5 * 1024 * 1024 * 1024 }, // 5GB
    'video/quicktime': { extensions: ['.mov'], maxSize: 5 * 1024 * 1024 * 1024 }, // 5GB
    'video/x-msvideo': { extensions: ['.avi'], maxSize: 5 * 1024 * 1024 * 1024 }, // 5GB
    'video/x-matroska': { extensions: ['.mkv'], maxSize: 5 * 1024 * 1024 * 1024 } // 5GB
  }
};

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
    const { contentId } = JSON.parse(event.body);

    if (!contentId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Content ID required' })
      };
    }

    // Get content processing record
    const contentDoc = await db.collection('contentProcessing').doc(contentId).get();
    if (!contentDoc.exists) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Content not found' })
      };
    }

    const contentRecord = contentDoc.data();

    console.log(`Starting validation for content ${contentId}`);

    // Update validation status
    await updateProcessingStep(contentId, 'validation', 'in_progress');

    // Perform validation steps
    const validationResults = await performValidation(contentRecord);

    if (validationResults.passed) {
      // Mark validation as completed
      await updateProcessingStep(contentId, 'validation', 'completed', validationResults);

      // Trigger virus scanning
      await triggerVirusScanning(contentId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Validation completed successfully',
          contentId,
          results: validationResults
        })
      };
    } else {
      // Mark validation as failed
      await updateProcessingStep(contentId, 'validation', 'failed', validationResults);

      // Update overall content status
      await db.collection('contentProcessing').doc(contentId).update({
        status: 'validation_failed',
        updatedAt: new Date()
      });

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'Validation failed',
          contentId,
          errors: validationResults.errors
        })
      };
    }

  } catch (error) {
    console.error('Content validation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function performValidation(contentRecord) {
  const results = {
    passed: true,
    errors: [],
    warnings: [],
    details: {}
  };

  try {
    // 1. File format validation
    const formatValidation = await validateFileFormat(contentRecord);
    results.details.format = formatValidation;
    if (!formatValidation.valid) {
      results.passed = false;
      results.errors.push(...formatValidation.errors);
    }

    // 2. File size validation
    const sizeValidation = validateFileSize(contentRecord);
    results.details.size = sizeValidation;
    if (!sizeValidation.valid) {
      results.passed = false;
      results.errors.push(...sizeValidation.errors);
    }

    // 3. Metadata validation
    const metadataValidation = validateMetadata(contentRecord.metadata);
    results.details.metadata = metadataValidation;
    if (!metadataValidation.valid) {
      results.passed = false;
      results.errors.push(...metadataValidation.errors);
    }
    if (metadataValidation.warnings?.length > 0) {
      results.warnings.push(...metadataValidation.warnings);
    }

    // 4. File integrity check
    const integrityValidation = await validateFileIntegrity(contentRecord);
    results.details.integrity = integrityValidation;
    if (!integrityValidation.valid) {
      results.passed = false;
      results.errors.push(...integrityValidation.errors);
    }

    // 5. ISRC validation (if provided)
    if (contentRecord.metadata.isrc) {
      const isrcValidation = validateISRC(contentRecord.metadata.isrc);
      results.details.isrc = isrcValidation;
      if (!isrcValidation.valid) {
        results.warnings.push(...isrcValidation.errors);
      }
    }

    return results;

  } catch (error) {
    console.error('Validation error:', error);
    results.passed = false;
    results.errors.push(`Validation process failed: ${error.message}`);
    return results;
  }
}

async function validateFileFormat(contentRecord) {
  const { contentType, filePath } = contentRecord;

  try {
    // Check if content type is supported
    const allFormats = { ...SUPPORTED_FORMATS.audio, ...SUPPORTED_FORMATS.video };
    const formatConfig = allFormats[contentType];

    if (!formatConfig) {
      return {
        valid: false,
        errors: [`Unsupported content type: ${contentType}`]
      };
    }

    // Get file from storage and perform basic format checks
    const bucket = storage.bucket();
    const file = bucket.file(filePath);

    const [exists] = await file.exists();
    if (!exists) {
      return {
        valid: false,
        errors: ['File not found in storage']
      };
    }

    // Read file header to verify format
    const [metadata] = await file.getMetadata();
    const actualContentType = metadata.contentType;

    if (actualContentType !== contentType) {
      return {
        valid: false,
        errors: [`Content type mismatch. Expected: ${contentType}, Actual: ${actualContentType}`]
      };
    }

    return {
      valid: true,
      contentType: actualContentType,
      size: parseInt(metadata.size)
    };

  } catch (error) {
    return {
      valid: false,
      errors: [`Format validation failed: ${error.message}`]
    };
  }
}

function validateFileSize(contentRecord) {
  const { fileSize, contentType } = contentRecord;
  const allFormats = { ...SUPPORTED_FORMATS.audio, ...SUPPORTED_FORMATS.video };
  const formatConfig = allFormats[contentType];

  if (!formatConfig) {
    return {
      valid: false,
      errors: [`Unknown format configuration for ${contentType}`]
    };
  }

  if (fileSize > formatConfig.maxSize) {
    const maxSizeMB = Math.round(formatConfig.maxSize / (1024 * 1024));
    const actualSizeMB = Math.round(fileSize / (1024 * 1024));
    return {
      valid: false,
      errors: [`File size ${actualSizeMB}MB exceeds maximum allowed ${maxSizeMB}MB for ${contentType}`]
    };
  }

  return {
    valid: true,
    size: fileSize,
    maxAllowed: formatConfig.maxSize
  };
}

function validateMetadata(metadata) {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!metadata.title || metadata.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!metadata.artist || metadata.artist.trim().length === 0) {
    errors.push('Artist is required');
  }

  // Validate territorial rights
  const validTerritories = ['worldwide', 'us', 'eu', 'uk', 'ca', 'au', 'jp', 'kr', 'custom'];
  if (metadata.territorialRights && !validTerritories.includes(metadata.territorialRights.toLowerCase())) {
    warnings.push(`Unusual territorial rights value: ${metadata.territorialRights}`);
  }

  // Validate release date format
  if (metadata.releaseDate) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(metadata.releaseDate)) {
      errors.push('Release date must be in YYYY-MM-DD format');
    } else {
      const releaseDate = new Date(metadata.releaseDate);
      const now = new Date();
      if (releaseDate > now) {
        warnings.push('Release date is in the future');
      }
    }
  }

  // Validate title and artist length
  if (metadata.title && metadata.title.length > 200) {
    errors.push('Title must be 200 characters or less');
  }

  if (metadata.artist && metadata.artist.length > 200) {
    errors.push('Artist name must be 200 characters or less');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

async function validateFileIntegrity(contentRecord) {
  try {
    const bucket = storage.bucket();
    const file = bucket.file(contentRecord.filePath);

    // Get file metadata and verify size matches expected
    const [metadata] = await file.getMetadata();
    const actualSize = parseInt(metadata.size);

    if (actualSize !== contentRecord.fileSize) {
      return {
        valid: false,
        errors: [`File size mismatch. Expected: ${contentRecord.fileSize}, Actual: ${actualSize}`]
      };
    }

    // Calculate file hash for integrity verification
    const readable = file.createReadStream();
    const hash = crypto.createHash('sha256');

    return new Promise((resolve) => {
      readable.on('data', (chunk) => {
        hash.update(chunk);
      });

      readable.on('end', () => {
        const fileHash = hash.digest('hex');
        resolve({
          valid: true,
          hash: fileHash,
          size: actualSize
        });
      });

      readable.on('error', (error) => {
        resolve({
          valid: false,
          errors: [`Integrity check failed: ${error.message}`]
        });
      });
    });

  } catch (error) {
    return {
      valid: false,
      errors: [`Integrity validation failed: ${error.message}`]
    };
  }
}

function validateISRC(isrc) {
  // ISRC format: CC-XXX-YY-NNNNN (12 characters)
  const isrcRegex = /^[A-Z]{2}[A-Z0-9]{3}[0-9]{2}[0-9]{5}$/;

  if (!isrcRegex.test(isrc)) {
    return {
      valid: false,
      errors: ['ISRC format invalid. Must be CC-XXX-YY-NNNNN (e.g., USRC17607839)']
    };
  }

  return {
    valid: true,
    isrc: isrc
  };
}

async function updateProcessingStep(contentId, step, status, data = null) {
  const updateData = {
    [`processingSteps.${step}.status`]: status,
    [`processingSteps.${step}.updatedAt`]: new Date(),
    updatedAt: new Date()
  };

  if (status === 'in_progress') {
    updateData[`processingSteps.${step}.startedAt`] = new Date();
  } else if (status === 'completed' || status === 'failed') {
    updateData[`processingSteps.${step}.completedAt`] = new Date();
  }

  if (data) {
    updateData[`processingSteps.${step}.data`] = data;
  }

  await db.collection('contentProcessing').doc(contentId).update(updateData);
}

async function triggerVirusScanning(contentId) {
  try {
    const virusScanUrl = `${process.env.URL}/.netlify/functions/content-ingestion/virus-scan`;
    fetch(virusScanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId })
    }).catch(error => {
      console.error('Failed to trigger virus scanning:', error);
    });

    console.log(`Virus scanning triggered for content ${contentId}`);

  } catch (error) {
    console.error('Error triggering virus scanning:', error);
  }
}