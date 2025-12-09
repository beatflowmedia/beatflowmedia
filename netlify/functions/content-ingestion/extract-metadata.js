// netlify/functions/content-ingestion/extract-metadata.js
// Advanced metadata extraction service for audio/video content
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

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

    console.log(`Starting metadata extraction for content ${contentId}`);

    // Update metadata extraction status
    await updateProcessingStep(contentId, 'metadataExtraction', 'in_progress');

    // Extract metadata based on content type
    const extractionResults = await extractMetadata(contentRecord);

    if (extractionResults.success) {
      // Mark metadata extraction as completed
      await updateProcessingStep(contentId, 'metadataExtraction', 'completed', extractionResults);

      // Update content record with extracted metadata
      await updateContentMetadata(contentId, extractionResults.metadata);

      // Trigger transcoding pipeline
      await triggerTranscoding(contentId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Metadata extraction completed successfully',
          contentId,
          metadata: extractionResults.metadata
        })
      };
    } else {
      // Mark metadata extraction as failed
      await updateProcessingStep(contentId, 'metadataExtraction', 'failed', extractionResults);

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'Metadata extraction failed',
          contentId,
          errors: extractionResults.errors
        })
      };
    }

  } catch (error) {
    console.error('Metadata extraction error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function extractMetadata(contentRecord) {
  const results = {
    success: true,
    errors: [],
    metadata: {},
    technical: {},
    artwork: null
  };

  try {
    const bucket = storage.bucket();
    const file = bucket.file(contentRecord.filePath);

    // Read file header for metadata extraction
    const headerSize = Math.min(64 * 1024, contentRecord.fileSize); // Read first 64KB
    const readable = file.createReadStream({ start: 0, end: headerSize - 1 });
    const chunks = [];

    await new Promise((resolve, reject) => {
      readable.on('data', chunk => chunks.push(chunk));
      readable.on('end', resolve);
      readable.on('error', reject);
    });

    const header = Buffer.concat(chunks);

    // Extract metadata based on content type
    if (contentRecord.contentType.startsWith('audio/')) {
      const audioMetadata = await extractAudioMetadata(header, contentRecord.contentType);
      Object.assign(results.metadata, audioMetadata.metadata);
      Object.assign(results.technical, audioMetadata.technical);
      if (audioMetadata.artwork) {
        results.artwork = audioMetadata.artwork;
      }
    } else if (contentRecord.contentType.startsWith('video/')) {
      const videoMetadata = await extractVideoMetadata(header, contentRecord.contentType);
      Object.assign(results.metadata, videoMetadata.metadata);
      Object.assign(results.technical, videoMetadata.technical);
      if (videoMetadata.artwork) {
        results.artwork = videoMetadata.artwork;
      }
    }

    // Enhance metadata with content analysis
    const analysisResults = await analyzeContent(file, contentRecord);
    Object.assign(results.technical, analysisResults);

    return results;

  } catch (error) {
    console.error('Metadata extraction failed:', error);
    results.success = false;
    results.errors.push(`Extraction failed: ${error.message}`);
    return results;
  }
}

async function extractAudioMetadata(header, contentType) {
  const metadata = {};
  const technical = {};
  let artwork = null;

  try {
    if (contentType === 'audio/mpeg' || contentType === 'audio/mp3') {
      // Extract ID3 metadata from MP3
      const id3Data = parseID3Tags(header);
      Object.assign(metadata, id3Data.metadata);
      Object.assign(technical, id3Data.technical);
      artwork = id3Data.artwork;

    } else if (contentType === 'audio/mp4' || contentType === 'audio/aac') {
      // Extract metadata from MP4/AAC
      const mp4Data = parseMP4Metadata(header);
      Object.assign(metadata, mp4Data.metadata);
      Object.assign(technical, mp4Data.technical);
      artwork = mp4Data.artwork;

    } else if (contentType === 'audio/flac') {
      // Extract FLAC metadata
      const flacData = parseFLACMetadata(header);
      Object.assign(metadata, flacData.metadata);
      Object.assign(technical, flacData.technical);
      artwork = flacData.artwork;

    } else if (contentType === 'audio/wav') {
      // Extract WAV metadata
      const wavData = parseWAVMetadata(header);
      Object.assign(metadata, wavData.metadata);
      Object.assign(technical, wavData.technical);

    } else if (contentType === 'audio/ogg') {
      // Extract OGG Vorbis metadata
      const oggData = parseOGGMetadata(header);
      Object.assign(metadata, oggData.metadata);
      Object.assign(technical, oggData.technical);
    }

    return { metadata, technical, artwork };

  } catch (error) {
    console.error('Audio metadata extraction failed:', error);
    return { metadata: {}, technical: {}, artwork: null };
  }
}

async function extractVideoMetadata(header, contentType) {
  const metadata = {};
  const technical = {};
  let artwork = null;

  try {
    if (contentType === 'video/mp4') {
      // Extract metadata from MP4 video
      const mp4Data = parseMP4VideoMetadata(header);
      Object.assign(metadata, mp4Data.metadata);
      Object.assign(technical, mp4Data.technical);
      artwork = mp4Data.artwork;

    } else if (contentType === 'video/quicktime') {
      // Extract metadata from MOV
      const qtData = parseQuickTimeMetadata(header);
      Object.assign(metadata, qtData.metadata);
      Object.assign(technical, qtData.technical);

    } else if (contentType === 'video/x-msvideo') {
      // Extract metadata from AVI
      const aviData = parseAVIMetadata(header);
      Object.assign(metadata, aviData.metadata);
      Object.assign(technical, aviData.technical);

    } else if (contentType === 'video/x-matroska') {
      // Extract metadata from MKV
      const mkvData = parseMKVMetadata(header);
      Object.assign(metadata, mkvData.metadata);
      Object.assign(technical, mkvData.technical);
    }

    return { metadata, technical, artwork };

  } catch (error) {
    console.error('Video metadata extraction failed:', error);
    return { metadata: {}, technical: {}, artwork: null };
  }
}

function parseID3Tags(buffer) {
  const metadata = {};
  const technical = {};
  let artwork = null;

  try {
    // Check for ID3v2 header
    if (buffer.slice(0, 3).toString() === 'ID3') {
      const version = buffer[3];
      const revision = buffer[4];
      const flags = buffer[5];

      // Calculate tag size (synchsafe integer)
      const size = (buffer[6] << 21) | (buffer[7] << 14) | (buffer[8] << 7) | buffer[9];

      technical.id3Version = `2.${version}.${revision}`;
      technical.id3Size = size;

      let offset = 10;

      // Parse frames
      while (offset < size + 10 && offset < buffer.length - 10) {
        const frameId = buffer.slice(offset, offset + 4).toString();
        const frameSize = buffer.readUInt32BE(offset + 4);

        if (frameSize === 0 || frameSize > buffer.length - offset) break;

        const frameData = buffer.slice(offset + 10, offset + 10 + frameSize);

        // Parse common frames
        switch (frameId) {
          case 'TIT2': // Title
            metadata.title = parseTextFrame(frameData);
            break;
          case 'TPE1': // Artist
            metadata.artist = parseTextFrame(frameData);
            break;
          case 'TALB': // Album
            metadata.album = parseTextFrame(frameData);
            break;
          case 'TYER': // Year
          case 'TDRC': // Recording time
            metadata.year = parseTextFrame(frameData);
            break;
          case 'TCON': // Genre
            metadata.genre = parseTextFrame(frameData);
            break;
          case 'TPE2': // Album artist
            metadata.albumArtist = parseTextFrame(frameData);
            break;
          case 'TRCK': // Track number
            metadata.track = parseTextFrame(frameData);
            break;
          case 'APIC': // Attached picture
            artwork = parseAPICFrame(frameData);
            break;
          case 'TLEN': // Length
            technical.duration = parseInt(parseTextFrame(frameData)) / 1000;
            break;
          case 'TBPM': // BPM
            technical.bpm = parseInt(parseTextFrame(frameData));
            break;
        }

        offset += 10 + frameSize;
      }
    }

    // Extract audio technical information from MPEG header
    const mpegInfo = parseMPEGHeader(buffer);
    Object.assign(technical, mpegInfo);

    return { metadata, technical, artwork };

  } catch (error) {
    console.error('ID3 parsing error:', error);
    return { metadata: {}, technical: {}, artwork: null };
  }
}

function parseTextFrame(data) {
  if (data.length === 0) return '';

  const encoding = data[0];
  const textData = data.slice(1);

  switch (encoding) {
    case 0: // ISO-8859-1
      return textData.toString('latin1').replace(/\0/g, '');
    case 1: // UTF-16 with BOM
      return textData.toString('utf16le').replace(/\0/g, '');
    case 2: // UTF-16BE without BOM
      return textData.toString('utf16le').replace(/\0/g, '');
    case 3: // UTF-8
      return textData.toString('utf8').replace(/\0/g, '');
    default:
      return textData.toString('utf8').replace(/\0/g, '');
  }
}

function parseAPICFrame(data) {
  if (data.length < 4) return null;

  try {
    const encoding = data[0];
    let offset = 1;

    // Find MIME type
    const mimeEnd = data.indexOf(0, offset);
    if (mimeEnd === -1) return null;

    const mimeType = data.slice(offset, mimeEnd).toString();
    offset = mimeEnd + 1;

    // Picture type
    const pictureType = data[offset];
    offset++;

    // Find description end
    const descEnd = data.indexOf(0, offset);
    if (descEnd === -1) return null;

    const description = data.slice(offset, descEnd).toString();
    offset = descEnd + 1;

    // Remaining data is the image
    const imageData = data.slice(offset);

    return {
      mimeType,
      pictureType,
      description,
      size: imageData.length,
      data: imageData.toString('base64')
    };
  } catch (error) {
    console.error('APIC frame parsing error:', error);
    return null;
  }
}

function parseMPEGHeader(buffer) {
  const technical = {};

  try {
    // Find MPEG audio frame header
    for (let i = 0; i < buffer.length - 4; i++) {
      if (buffer[i] === 0xFF && (buffer[i + 1] & 0xE0) === 0xE0) {
        const header = buffer.readUInt32BE(i);

        // Parse MPEG header
        const version = (header >> 19) & 0x3;
        const layer = (header >> 17) & 0x3;
        const bitrate = (header >> 12) & 0xF;
        const sampleRate = (header >> 10) & 0x3;
        const channelMode = (header >> 6) & 0x3;

        // Convert to readable values
        const versionMap = { 3: '1', 2: '2', 0: '2.5' };
        const layerMap = { 3: 'I', 2: 'II', 1: 'III' };

        technical.mpegVersion = versionMap[version];
        technical.layer = layerMap[layer];
        technical.channels = channelMode === 3 ? 1 : 2;

        // Bitrate and sample rate tables would be more complex in production
        technical.bitrateDetected = true;

        break;
      }
    }
  } catch (error) {
    console.error('MPEG header parsing error:', error);
  }

  return technical;
}

// Simplified parsers for other formats (would be more complex in production)
function parseMP4Metadata(buffer) {
  return { metadata: {}, technical: { format: 'MP4' }, artwork: null };
}

function parseFLACMetadata(buffer) {
  return { metadata: {}, technical: { format: 'FLAC', lossless: true }, artwork: null };
}

function parseWAVMetadata(buffer) {
  return { metadata: {}, technical: { format: 'WAV', lossless: true }, artwork: null };
}

function parseOGGMetadata(buffer) {
  return { metadata: {}, technical: { format: 'OGG' }, artwork: null };
}

function parseMP4VideoMetadata(buffer) {
  return { metadata: {}, technical: { format: 'MP4 Video' }, artwork: null };
}

function parseQuickTimeMetadata(buffer) {
  return { metadata: {}, technical: { format: 'QuickTime' }, artwork: null };
}

function parseAVIMetadata(buffer) {
  return { metadata: {}, technical: { format: 'AVI' }, artwork: null };
}

function parseMKVMetadata(buffer) {
  return { metadata: {}, technical: { format: 'Matroska' }, artwork: null };
}

async function analyzeContent(file, contentRecord) {
  const analysis = {};

  try {
    // Get file metadata for technical analysis
    const [metadata] = await file.getMetadata();

    analysis.fileSize = parseInt(metadata.size);
    analysis.lastModified = metadata.updated;
    analysis.contentType = metadata.contentType;
    analysis.md5Hash = metadata.md5Hash;
    analysis.crc32c = metadata.crc32c;

    // Estimate duration based on file size and type (simplified)
    if (contentRecord.contentType.startsWith('audio/')) {
      // Rough estimation: 1MB per minute for typical compression
      analysis.estimatedDuration = Math.round(analysis.fileSize / (1024 * 1024) * 60);
    }

    return analysis;

  } catch (error) {
    console.error('Content analysis error:', error);
    return {};
  }
}

async function updateContentMetadata(contentId, extractedMetadata) {
  try {
    const updateData = {
      'extractedMetadata': extractedMetadata,
      'updatedAt': new Date()
    };

    // Merge with existing metadata, preferring extracted over provided
    const contentDoc = await db.collection('contentProcessing').doc(contentId).get();
    const currentMetadata = contentDoc.data().metadata || {};

    const mergedMetadata = {
      ...currentMetadata,
      ...extractedMetadata.metadata,
      // Keep user-provided ISRC and territorial rights if they exist
      isrc: currentMetadata.isrc || extractedMetadata.metadata.isrc,
      territorialRights: currentMetadata.territorialRights || 'worldwide'
    };

    updateData.metadata = mergedMetadata;

    await db.collection('contentProcessing').doc(contentId).update(updateData);

    console.log(`Content metadata updated for ${contentId}`);

  } catch (error) {
    console.error('Error updating content metadata:', error);
  }
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

async function triggerTranscoding(contentId) {
  try {
    const transcodingUrl = `${process.env.URL}/.netlify/functions/content-ingestion/transcode-content`;
    fetch(transcodingUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId })
    }).catch(error => {
      console.error('Failed to trigger transcoding:', error);
    });

    console.log(`Transcoding triggered for content ${contentId}`);

  } catch (error) {
    console.error('Error triggering transcoding:', error);
  }
}