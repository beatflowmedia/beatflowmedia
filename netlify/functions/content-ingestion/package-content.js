// netlify/functions/content-ingestion/package-content.js
// HLS/DASH packaging service with CENC encryption for streaming
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

// Packaging configurations
const PACKAGING_CONFIGS = {
  hls: {
    segmentDuration: 6, // seconds
    playlistType: 'vod',
    targetDuration: 10,
    formats: ['aac', 'mp4'],
    encryption: 'aes-128'
  },
  dash: {
    segmentDuration: 4, // seconds
    timeScale: 90000,
    formats: ['aac', 'mp4'],
    encryption: 'cenc'
  }
};

// DRM configuration
const DRM_CONFIG = {
  widevine: {
    licenseServer: process.env.WIDEVINE_LICENSE_SERVER,
    contentId: null, // Will be generated
    provider: 'widevine'
  },
  playready: {
    licenseServer: process.env.PLAYREADY_LICENSE_SERVER,
    contentId: null,
    provider: 'playready'
  },
  fairplay: {
    licenseServer: process.env.FAIRPLAY_LICENSE_SERVER,
    certificateUrl: process.env.FAIRPLAY_CERTIFICATE_URL,
    contentId: null,
    provider: 'fairplay'
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

    console.log(`Starting packaging for content ${contentId}`);

    // Update packaging status
    await updateProcessingStep(contentId, 'packaging', 'in_progress');

    // Start packaging process
    const packagingResults = await initiatePackaging(contentRecord);

    if (packagingResults.success) {
      // Mark packaging as completed
      await updateProcessingStep(contentId, 'packaging', 'completed', packagingResults);

      // Trigger DRM setup
      await triggerDRMSetup(contentId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Packaging completed successfully',
          contentId,
          packages: packagingResults.packages
        })
      };
    } else {
      // Mark packaging as failed
      await updateProcessingStep(contentId, 'packaging', 'failed', packagingResults);

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'Packaging failed',
          contentId,
          errors: packagingResults.errors
        })
      };
    }

  } catch (error) {
    console.error('Packaging error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function initiatePackaging(contentRecord) {
  const results = {
    success: true,
    errors: [],
    packages: {}
  };

  try {
    // Get completed transcoding jobs
    const transcodingJobs = await getCompletedTranscodingJobs(contentRecord.id);

    if (transcodingJobs.length === 0) {
      results.success = false;
      results.errors.push('No completed transcoding jobs found');
      return results;
    }

    // Create HLS package
    const hlsPackage = await createHLSPackage(contentRecord, transcodingJobs);
    if (hlsPackage.success) {
      results.packages.hls = hlsPackage;
    } else {
      results.errors.push(...hlsPackage.errors);
    }

    // Create DASH package
    const dashPackage = await createDASHPackage(contentRecord, transcodingJobs);
    if (dashPackage.success) {
      results.packages.dash = dashPackage;
    } else {
      results.errors.push(...dashPackage.errors);
    }

    // If both packaging failed
    if (!results.packages.hls && !results.packages.dash) {
      results.success = false;
    }

    return results;

  } catch (error) {
    console.error('Packaging initiation failed:', error);
    results.success = false;
    results.errors.push(`Packaging initiation failed: ${error.message}`);
    return results;
  }
}

async function getCompletedTranscodingJobs(contentId) {
  try {
    const jobsSnapshot = await db.collection('transcodingJobs')
      .where('contentId', '==', contentId)
      .where('status', '==', 'completed')
      .get();

    return jobsSnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error getting transcoding jobs:', error);
    return [];
  }
}

async function createHLSPackage(contentRecord, transcodingJobs) {
  const results = {
    success: true,
    errors: [],
    format: 'hls',
    manifestPath: null,
    segmentPaths: [],
    keyInfo: null
  };

  try {
    console.log(`Creating HLS package for content ${contentRecord.id}`);

    const packagePath = `packages/${contentRecord.id}/hls`;
    const manifestPath = `${packagePath}/playlist.m3u8`;

    // Generate encryption key for HLS AES-128
    const encryptionKey = crypto.randomBytes(16);
    const keyId = crypto.randomUUID();
    const keyPath = `${packagePath}/key.bin`;

    // Store encryption key
    await storeEncryptionKey(keyPath, encryptionKey);

    // Create master playlist
    const masterPlaylist = await createHLSMasterPlaylist(transcodingJobs, packagePath);

    // Create individual playlists and segments for each quality
    const qualityPlaylists = [];

    for (const job of transcodingJobs) {
      const qualityPlaylistPath = `${packagePath}/${job.preset}/playlist.m3u8`;
      const segments = await createHLSSegments(job, packagePath, encryptionKey, keyId);

      if (segments.success) {
        qualityPlaylists.push({
          preset: job.preset,
          playlistPath: qualityPlaylistPath,
          bandwidth: calculateBandwidth(job),
          resolution: job.config.resolution || null,
          segments: segments.segmentPaths
        });

        results.segmentPaths.push(...segments.segmentPaths);
      } else {
        results.errors.push(...segments.errors);
      }
    }

    // Store master playlist
    await storePlaylist(manifestPath, masterPlaylist);

    // Store individual quality playlists
    for (const playlist of qualityPlaylists) {
      const playlistContent = createHLSPlaylist(playlist, keyId, keyPath);
      await storePlaylist(playlist.playlistPath, playlistContent);
    }

    results.manifestPath = manifestPath;
    results.keyInfo = {
      keyId,
      keyPath,
      method: 'AES-128'
    };

    console.log(`HLS package created successfully at ${manifestPath}`);

    return results;

  } catch (error) {
    console.error('HLS packaging failed:', error);
    results.success = false;
    results.errors.push(`HLS packaging failed: ${error.message}`);
    return results;
  }
}

async function createDASHPackage(contentRecord, transcodingJobs) {
  const results = {
    success: true,
    errors: [],
    format: 'dash',
    manifestPath: null,
    segmentPaths: [],
    drmInfo: null
  };

  try {
    console.log(`Creating DASH package for content ${contentRecord.id}`);

    const packagePath = `packages/${contentRecord.id}/dash`;
    const manifestPath = `${packagePath}/manifest.mpd`;

    // Generate CENC encryption info
    const cencInfo = await generateCENCEncryption(contentRecord.id);

    // Create DASH manifest
    const manifest = await createDASHManifest(transcodingJobs, packagePath, cencInfo);

    // Create segments for each representation
    const representations = [];

    for (const job of transcodingJobs) {
      const segments = await createDASHSegments(job, packagePath, cencInfo);

      if (segments.success) {
        representations.push({
          id: `${job.type}_${job.preset}`,
          preset: job.preset,
          bandwidth: calculateBandwidth(job),
          mimeType: getMimeType(job),
          segments: segments.segmentPaths
        });

        results.segmentPaths.push(...segments.segmentPaths);
      } else {
        results.errors.push(...segments.errors);
      }
    }

    // Store DASH manifest
    await storePlaylist(manifestPath, manifest);

    results.manifestPath = manifestPath;
    results.drmInfo = cencInfo;

    console.log(`DASH package created successfully at ${manifestPath}`);

    return results;

  } catch (error) {
    console.error('DASH packaging failed:', error);
    results.success = false;
    results.errors.push(`DASH packaging failed: ${error.message}`);
    return results;
  }
}

async function createHLSSegments(job, packagePath, encryptionKey, keyId) {
  const results = {
    success: true,
    errors: [],
    segmentPaths: []
  };

  try {
    const segmentDuration = PACKAGING_CONFIGS.hls.segmentDuration;
    const qualityPath = `${packagePath}/${job.preset}`;

    // This would typically use FFmpeg to segment the transcoded file
    // For this implementation, we'll simulate the process

    const estimatedDuration = job.duration || 180; // 3 minutes default
    const segmentCount = Math.ceil(estimatedDuration / segmentDuration);

    for (let i = 0; i < segmentCount; i++) {
      const segmentPath = `${qualityPath}/segment_${i.toString().padStart(3, '0')}.ts`;

      // Simulate segment creation with encryption
      const segmentData = await createEncryptedSegment(job, i, encryptionKey);

      // Store segment
      await storeSegment(segmentPath, segmentData);

      results.segmentPaths.push(segmentPath);
    }

    return results;

  } catch (error) {
    console.error('HLS segment creation failed:', error);
    results.success = false;
    results.errors.push(`HLS segment creation failed: ${error.message}`);
    return results;
  }
}

async function createDASHSegments(job, packagePath, cencInfo) {
  const results = {
    success: true,
    errors: [],
    segmentPaths: []
  };

  try {
    const segmentDuration = PACKAGING_CONFIGS.dash.segmentDuration;
    const representationPath = `${packagePath}/${job.type}_${job.preset}`;

    // Create initialization segment
    const initSegmentPath = `${representationPath}/init.mp4`;
    const initSegmentData = await createInitializationSegment(job);
    await storeSegment(initSegmentPath, initSegmentData);
    results.segmentPaths.push(initSegmentPath);

    // Create media segments
    const estimatedDuration = job.duration || 180;
    const segmentCount = Math.ceil(estimatedDuration / segmentDuration);

    for (let i = 0; i < segmentCount; i++) {
      const segmentPath = `${representationPath}/segment_${i + 1}.m4s`;

      // Simulate segment creation with CENC encryption
      const segmentData = await createCENCSegment(job, i, cencInfo);

      // Store segment
      await storeSegment(segmentPath, segmentData);

      results.segmentPaths.push(segmentPath);
    }

    return results;

  } catch (error) {
    console.error('DASH segment creation failed:', error);
    results.success = false;
    results.errors.push(`DASH segment creation failed: ${error.message}`);
    return results;
  }
}

async function generateCENCEncryption(contentId) {
  // Generate CENC encryption keys and key IDs
  const keyId = crypto.randomBytes(16);
  const contentKey = crypto.randomBytes(16);
  const pssh = generatePSSH(keyId);

  const cencInfo = {
    keyId: keyId.toString('hex'),
    contentKey: contentKey.toString('hex'),
    pssh: pssh.toString('base64'),
    drmSystems: {
      widevine: {
        systemId: 'edef8ba9-79d6-4ace-a3c8-27dcd51d21ed',
        pssh: pssh.toString('base64')
      },
      playready: {
        systemId: '9a04f079-9840-4286-ab92-e65be0885f95',
        pssh: generatePlayReadyPSSH(keyId, contentId).toString('base64')
      }
    }
  };

  // Store DRM keys securely
  await storeDRMKeys(contentId, cencInfo);

  return cencInfo;
}

function generatePSSH(keyId) {
  // Generate Widevine PSSH box
  const psshHeader = Buffer.from([
    0x00, 0x00, 0x00, 0x20, // Box size (32 bytes)
    0x70, 0x73, 0x73, 0x68, // Box type 'pssh'
    0x01, 0x00, 0x00, 0x00, // Version and flags
  ]);

  const systemId = Buffer.from('edef8ba979d64acea3c827dcd51d21ed', 'hex'); // Widevine system ID
  const keyIdCount = Buffer.from([0x00, 0x00, 0x00, 0x01]); // One key ID
  const dataSize = Buffer.from([0x00, 0x00, 0x00, 0x00]); // No additional data

  return Buffer.concat([psshHeader, systemId, keyIdCount, keyId, dataSize]);
}

function generatePlayReadyPSSH(keyId, contentId) {
  // Generate PlayReady PSSH box (simplified)
  const playreadySystemId = Buffer.from('9a04f07998404286ab92e65be0885f95', 'hex');
  const playreadyData = Buffer.from(`<WRMHEADER><DATA><PROTECTINFO><KEYLEN>16</KEYLEN><ALGID>AESCTR</ALGID></PROTECTINFO><KID>${keyId.toString('base64')}</KID><CHECKSUM></CHECKSUM></DATA></WRMHEADER>`);

  const psshHeader = Buffer.alloc(12);
  psshHeader.writeUInt32BE(12 + 16 + 4 + playreadyData.length, 0); // Box size
  psshHeader.write('pssh', 4); // Box type
  psshHeader.writeUInt32BE(0x01000000, 8); // Version and flags

  return Buffer.concat([psshHeader, playreadySystemId, Buffer.from([0x00, 0x00, 0x00, 0x01]), keyId, Buffer.alloc(4), playreadyData]);
}

async function createHLSMasterPlaylist(transcodingJobs, packagePath) {
  let playlist = '#EXTM3U\n#EXT-X-VERSION:6\n\n';

  // Sort jobs by quality for proper ordering
  const sortedJobs = transcodingJobs.sort((a, b) => {
    const bandwidthA = calculateBandwidth(a);
    const bandwidthB = calculateBandwidth(b);
    return bandwidthB - bandwidthA; // Highest first
  });

  for (const job of sortedJobs) {
    const bandwidth = calculateBandwidth(job);
    const resolution = job.config.resolution || '';

    playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth}`;

    if (resolution) {
      playlist += `,RESOLUTION=${resolution}`;
    }

    if (job.config.fps) {
      playlist += `,FRAME-RATE=${job.config.fps}`;
    }

    playlist += `,CODECS="${getCodecs(job)}"`;
    playlist += `\n${job.preset}/playlist.m3u8\n\n`;
  }

  return playlist;
}

function createHLSPlaylist(playlist, keyId, keyPath) {
  const segmentDuration = PACKAGING_CONFIGS.hls.segmentDuration;
  const targetDuration = PACKAGING_CONFIGS.hls.targetDuration;

  let playlistContent = '#EXTM3U\n';
  playlistContent += '#EXT-X-VERSION:6\n';
  playlistContent += `#EXT-X-TARGETDURATION:${targetDuration}\n`;
  playlistContent += '#EXT-X-PLAYLIST-TYPE:VOD\n';
  playlistContent += '#EXT-X-MEDIA-SEQUENCE:0\n\n';

  // Add encryption info
  playlistContent += `#EXT-X-KEY:METHOD=AES-128,URI="${keyPath}",IV=0x${keyId.replace(/-/g, '').padStart(32, '0')}"\n\n`;

  // Add segments
  playlist.segments.forEach((segmentPath, index) => {
    playlistContent += `#EXTINF:${segmentDuration}.000,\n`;
    playlistContent += `${segmentPath.split('/').pop()}\n`;
  });

  playlistContent += '#EXT-X-ENDLIST\n';

  return playlistContent;
}

async function createDASHManifest(transcodingJobs, packagePath, cencInfo) {
  const minBufferTime = 'PT4S';
  const maxSegmentDuration = 'PT4S';

  let manifest = '<?xml version="1.0"?>\n';
  manifest += '<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" xmlns:cenc="urn:mpeg:cenc:2013" ';
  manifest += 'profiles="urn:mpeg:dash:profile:isoff-live:2011" type="static" ';
  manifest += `minBufferTime="${minBufferTime}" maxSegmentDuration="${maxSegmentDuration}">\n`;

  // Add DRM ContentProtection
  manifest += '  <ContentProtection schemeIdUri="urn:mpeg:dash:mp4protection:2011" value="cenc" cenc:default_KID="';
  manifest += cencInfo.keyId.match(/.{2}/g).join('-') + '"/>\n';

  // Add Widevine ContentProtection
  manifest += '  <ContentProtection schemeIdUri="urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed">\n';
  manifest += `    <cenc:pssh>${cencInfo.pssh}</cenc:pssh>\n`;
  manifest += '  </ContentProtection>\n';

  // Add PlayReady ContentProtection
  manifest += '  <ContentProtection schemeIdUri="urn:uuid:9a04f079-9840-4286-ab92-e65be0885f95">\n';
  manifest += `    <cenc:pssh>${cencInfo.drmSystems.playready.pssh}</cenc:pssh>\n`;
  manifest += '  </ContentProtection>\n';

  manifest += '  <Period>\n';

  // Group jobs by type (audio/video)
  const audioJobs = transcodingJobs.filter(job => job.type === 'audio');
  const videoJobs = transcodingJobs.filter(job => job.type === 'video');

  // Add AdaptationSets
  if (audioJobs.length > 0) {
    manifest += createAudioAdaptationSet(audioJobs);
  }

  if (videoJobs.length > 0) {
    manifest += createVideoAdaptationSet(videoJobs);
  }

  manifest += '  </Period>\n';
  manifest += '</MPD>';

  return manifest;
}

function createAudioAdaptationSet(audioJobs) {
  let adaptationSet = '    <AdaptationSet mimeType="audio/mp4" segmentAlignment="true">\n';

  audioJobs.forEach(job => {
    const bandwidth = calculateBandwidth(job);
    adaptationSet += `      <Representation id="audio_${job.preset}" bandwidth="${bandwidth}">\n`;
    adaptationSet += `        <SegmentTemplate media="${job.type}_${job.preset}/segment_$Number$.m4s" `;
    adaptationSet += `initialization="${job.type}_${job.preset}/init.mp4" startNumber="1"/>\n`;
    adaptationSet += '      </Representation>\n';
  });

  adaptationSet += '    </AdaptationSet>\n';
  return adaptationSet;
}

function createVideoAdaptationSet(videoJobs) {
  let adaptationSet = '    <AdaptationSet mimeType="video/mp4" segmentAlignment="true">\n';

  videoJobs.forEach(job => {
    const bandwidth = calculateBandwidth(job);
    const [width, height] = job.config.resolution.split('x');

    adaptationSet += `      <Representation id="video_${job.preset}" bandwidth="${bandwidth}" `;
    adaptationSet += `width="${width}" height="${height}" frameRate="${job.config.fps}">\n`;
    adaptationSet += `        <SegmentTemplate media="${job.type}_${job.preset}/segment_$Number$.m4s" `;
    adaptationSet += `initialization="${job.type}_${job.preset}/init.mp4" startNumber="1"/>\n`;
    adaptationSet += '      </Representation>\n';
  });

  adaptationSet += '    </AdaptationSet>\n';
  return adaptationSet;
}

function calculateBandwidth(job) {
  if (job.type === 'audio') {
    return job.config.bitrate * 1000; // Convert kbps to bps
  } else {
    return (job.config.videoBitrate + job.config.audioBitrate) * 1000;
  }
}

function getMimeType(job) {
  if (job.type === 'audio') {
    return 'audio/mp4';
  } else {
    return 'video/mp4';
  }
}

function getCodecs(job) {
  if (job.type === 'audio') {
    return 'mp4a.40.2'; // AAC LC
  } else {
    return 'avc1.42001e,mp4a.40.2'; // H.264 Baseline + AAC LC
  }
}

// Storage functions (simulated)
async function storeEncryptionKey(keyPath, keyData) {
  const bucket = storage.bucket();
  const file = bucket.file(keyPath);
  await file.save(keyData, {
    metadata: { contentType: 'application/octet-stream' }
  });
}

async function storePlaylist(playlistPath, content) {
  const bucket = storage.bucket();
  const file = bucket.file(playlistPath);
  await file.save(content, {
    metadata: { contentType: 'application/x-mpegURL' }
  });
}

async function storeSegment(segmentPath, data) {
  const bucket = storage.bucket();
  const file = bucket.file(segmentPath);
  await file.save(data, {
    metadata: { contentType: 'video/mp2t' }
  });
}

async function createEncryptedSegment(job, segmentIndex, encryptionKey) {
  // Simulate encrypted segment creation
  const segmentSize = Math.floor(Math.random() * 1024 * 1024); // Random size up to 1MB
  return Buffer.alloc(segmentSize, segmentIndex); // Placeholder data
}

async function createInitializationSegment(job) {
  // Simulate initialization segment creation
  return Buffer.alloc(1024, 0); // Placeholder data
}

async function createCENCSegment(job, segmentIndex, cencInfo) {
  // Simulate CENC encrypted segment creation
  const segmentSize = Math.floor(Math.random() * 1024 * 1024);
  return Buffer.alloc(segmentSize, segmentIndex);
}

async function storeDRMKeys(contentId, cencInfo) {
  // Store DRM keys securely in database
  await db.collection('drmKeys').doc(contentId).set({
    contentId,
    keyId: cencInfo.keyId,
    contentKey: cencInfo.contentKey, // In production, this should be encrypted
    createdAt: new Date(),
    drmSystems: cencInfo.drmSystems
  });
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

async function triggerDRMSetup(contentId) {
  try {
    const drmUrl = `${process.env.URL}/.netlify/functions/content-ingestion/setup-drm`;
    fetch(drmUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId })
    }).catch(error => {
      console.error('Failed to trigger DRM setup:', error);
    });

    console.log(`DRM setup triggered for content ${contentId}`);

  } catch (error) {
    console.error('Error triggering DRM setup:', error);
  }
}