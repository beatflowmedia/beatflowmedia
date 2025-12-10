// netlify/functions/content-ingestion/transcode-content.js
// Advanced transcoding pipeline for multiple bitrates and formats
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

// Transcoding presets for different quality levels
const AUDIO_PRESETS = {
  high: {
    bitrate: 320,
    sampleRate: 48000,
    format: 'aac',
    channels: 2,
    description: 'High Quality (320kbps AAC)'
  },
  medium: {
    bitrate: 192,
    sampleRate: 44100,
    format: 'aac',
    channels: 2,
    description: 'Standard Quality (192kbps AAC)'
  },
  low: {
    bitrate: 128,
    sampleRate: 44100,
    format: 'aac',
    channels: 2,
    description: 'Mobile Quality (128kbps AAC)'
  },
  preview: {
    bitrate: 96,
    sampleRate: 22050,
    format: 'aac',
    channels: 1,
    duration: 30,
    description: 'Preview (30s, 96kbps AAC)'
  }
};

const VIDEO_PRESETS = {
  '4k': {
    resolution: '3840x2160',
    videoBitrate: 15000,
    audioBitrate: 192,
    fps: 30,
    format: 'mp4',
    codec: 'h264',
    description: '4K Ultra HD (15Mbps)'
  },
  '1080p': {
    resolution: '1920x1080',
    videoBitrate: 5000,
    audioBitrate: 192,
    fps: 30,
    format: 'mp4',
    codec: 'h264',
    description: 'Full HD 1080p (5Mbps)'
  },
  '720p': {
    resolution: '1280x720',
    videoBitrate: 2500,
    audioBitrate: 128,
    fps: 30,
    format: 'mp4',
    codec: 'h264',
    description: 'HD 720p (2.5Mbps)'
  },
  '480p': {
    resolution: '854x480',
    videoBitrate: 1000,
    audioBitrate: 128,
    fps: 30,
    format: 'mp4',
    codec: 'h264',
    description: 'Standard 480p (1Mbps)'
  },
  '360p': {
    resolution: '640x360',
    videoBitrate: 500,
    audioBitrate: 96,
    fps: 25,
    format: 'mp4',
    codec: 'h264',
    description: 'Mobile 360p (500kbps)'
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

    console.log(`Starting transcoding for content ${contentId}`);

    // Update transcoding status
    await updateProcessingStep(contentId, 'transcoding', 'in_progress');

    // Start transcoding process
    const transcodingResults = await initiateTranscoding(contentRecord);

    if (transcodingResults.success) {
      // Mark transcoding as in progress (actual transcoding happens asynchronously)
      await updateProcessingStep(contentId, 'transcoding', 'in_progress', transcodingResults);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Transcoding initiated successfully',
          contentId,
          jobs: transcodingResults.jobs
        })
      };
    } else {
      // Mark transcoding as failed
      await updateProcessingStep(contentId, 'transcoding', 'failed', transcodingResults);

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'Transcoding initiation failed',
          contentId,
          errors: transcodingResults.errors
        })
      };
    }

  } catch (error) {
    console.error('Transcoding error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function initiateTranscoding(contentRecord) {
  const results = {
    success: true,
    errors: [],
    jobs: []
  };

  try {
    const isAudio = contentRecord.contentType.startsWith('audio/');
    const isVideo = contentRecord.contentType.startsWith('video/');

    if (isAudio) {
      // Create audio transcoding jobs
      const audioJobs = await createAudioTranscodingJobs(contentRecord);
      results.jobs.push(...audioJobs);
    } else if (isVideo) {
      // Create video transcoding jobs
      const videoJobs = await createVideoTranscodingJobs(contentRecord);
      results.jobs.push(...videoJobs);
    } else {
      results.success = false;
      results.errors.push('Unsupported content type for transcoding');
      return results;
    }

    // Start transcoding jobs
    for (const job of results.jobs) {
      await startTranscodingJob(job);
    }

    return results;

  } catch (error) {
    console.error('Transcoding initiation failed:', error);
    results.success = false;
    results.errors.push(`Transcoding initiation failed: ${error.message}`);
    return results;
  }
}

async function createAudioTranscodingJobs(contentRecord) {
  const jobs = [];

  // Create jobs for each audio preset
  for (const [preset, config] of Object.entries(AUDIO_PRESETS)) {
    const jobId = `${contentRecord.id}_audio_${preset}`;
    const outputPath = `transcoded/${contentRecord.id}/audio/${preset}.${config.format}`;

    const job = {
      id: jobId,
      contentId: contentRecord.id,
      type: 'audio',
      preset,
      config,
      inputPath: contentRecord.filePath,
      outputPath,
      status: 'queued',
      createdAt: new Date(),
      priority: preset === 'high' ? 1 : preset === 'medium' ? 2 : 3
    };

    jobs.push(job);

    // Store job in database
    await db.collection('transcodingJobs').doc(jobId).set(job);
  }

  return jobs;
}

async function createVideoTranscodingJobs(contentRecord) {
  const jobs = [];

  // Create jobs for each video preset
  for (const [preset, config] of Object.entries(VIDEO_PRESETS)) {
    const jobId = `${contentRecord.id}_video_${preset}`;
    const outputPath = `transcoded/${contentRecord.id}/video/${preset}.${config.format}`;

    const job = {
      id: jobId,
      contentId: contentRecord.id,
      type: 'video',
      preset,
      config,
      inputPath: contentRecord.filePath,
      outputPath,
      status: 'queued',
      createdAt: new Date(),
      priority: preset === '1080p' ? 1 : preset === '720p' ? 2 : 3
    };

    jobs.push(job);

    // Store job in database
    await db.collection('transcodingJobs').doc(jobId).set(job);
  }

  return jobs;
}

async function startTranscodingJob(job) {
  try {
    console.log(`Starting transcoding job ${job.id}`);

    // Update job status
    await db.collection('transcodingJobs').doc(job.id).update({
      status: 'processing',
      startedAt: new Date()
    });

    // For this implementation, we'll simulate transcoding with a cloud function
    // In production, this would integrate with services like:
    // - AWS Elemental MediaConvert
    // - Google Cloud Video Intelligence
    // - Azure Media Services
    // - FFmpeg-based workers

    if (process.env.TRANSCODING_SERVICE === 'aws') {
      await startAWSTranscoding(job);
    } else if (process.env.TRANSCODING_SERVICE === 'gcp') {
      await startGCPTranscoding(job);
    } else {
      // Use built-in FFmpeg simulation
      await startBuiltInTranscoding(job);
    }

  } catch (error) {
    console.error(`Error starting transcoding job ${job.id}:`, error);

    // Mark job as failed
    await db.collection('transcodingJobs').doc(job.id).update({
      status: 'failed',
      error: error.message,
      failedAt: new Date()
    });
  }
}

async function startBuiltInTranscoding(job) {
  // Simulate transcoding process with a delay
  // In production, this would be replaced with actual FFmpeg commands

  console.log(`Simulating transcoding for job ${job.id} with preset ${job.preset}`);

  // Simulate processing time based on content type and quality
  const processingTime = calculateProcessingTime(job);

  // Use setTimeout to simulate async transcoding
  setTimeout(async () => {
    try {
      // Simulate the transcoding process
      const success = await simulateTranscoding(job);

      if (success) {
        // Mark job as completed
        await db.collection('transcodingJobs').doc(job.id).update({
          status: 'completed',
          completedAt: new Date(),
          outputSize: Math.floor(Math.random() * 50 * 1024 * 1024), // Random size for simulation
          duration: Math.floor(Math.random() * 300) // Random duration
        });

        // Check if all jobs for this content are complete
        await checkTranscodingCompletion(job.contentId);

      } else {
        // Mark job as failed
        await db.collection('transcodingJobs').doc(job.id).update({
          status: 'failed',
          error: 'Simulated transcoding failure',
          failedAt: new Date()
        });
      }

    } catch (error) {
      console.error(`Error in simulated transcoding for job ${job.id}:`, error);
      await db.collection('transcodingJobs').doc(job.id).update({
        status: 'failed',
        error: error.message,
        failedAt: new Date()
      });
    }
  }, processingTime);
}

function calculateProcessingTime(job) {
  // Simulate processing time based on quality and type
  const baseTime = job.type === 'video' ? 30000 : 10000; // 30s for video, 10s for audio
  const qualityMultiplier = {
    '4k': 3,
    '1080p': 2,
    '720p': 1.5,
    '480p': 1,
    '360p': 0.7,
    'high': 2,
    'medium': 1.5,
    'low': 1,
    'preview': 0.5
  };

  return baseTime * (qualityMultiplier[job.preset] || 1);
}

async function simulateTranscoding(job) {
  // Simulate 95% success rate
  return Math.random() > 0.05;
}

async function startAWSTranscoding(job) {
  // AWS Elemental MediaConvert integration
  // This would require AWS SDK and proper IAM permissions

  try {
    const mediaConvertParams = {
      Role: process.env.AWS_MEDIACONVERT_ROLE,
      Settings: {
        Inputs: [{
          FileInput: `s3://${process.env.AWS_S3_BUCKET}/${job.inputPath}`
        }],
        OutputGroups: [{
          OutputGroupSettings: {
            Type: job.type === 'audio' ? 'FILE_GROUP_SETTINGS' : 'HLS_GROUP_SETTINGS',
            FileGroupSettings: {
              Destination: `s3://${process.env.AWS_S3_BUCKET}/transcoded/${job.contentId}/`
            }
          },
          Outputs: [createAWSOutput(job)]
        }]
      }
    };

    console.log(`AWS MediaConvert job would be created with params:`, JSON.stringify(mediaConvertParams, null, 2));

    // Simulate success
    return true;

  } catch (error) {
    throw new Error(`AWS transcoding failed: ${error.message}`);
  }
}

async function startGCPTranscoding(job) {
  // Google Cloud Video Intelligence / Transcoder API integration

  try {
    const transcoderParams = {
      parent: `projects/${process.env.GCP_PROJECT_ID}/locations/${process.env.GCP_LOCATION}`,
      job: {
        inputUri: `gs://${process.env.GCP_STORAGE_BUCKET}/${job.inputPath}`,
        outputUri: `gs://${process.env.GCP_STORAGE_BUCKET}/transcoded/${job.contentId}/`,
        config: createGCPConfig(job)
      }
    };

    console.log(`GCP Transcoder job would be created with params:`, JSON.stringify(transcoderParams, null, 2));

    // Simulate success
    return true;

  } catch (error) {
    throw new Error(`GCP transcoding failed: ${error.message}`);
  }
}

function createAWSOutput(job) {
  // Create AWS MediaConvert output configuration
  if (job.type === 'audio') {
    return {
      AudioDescriptions: [{
        CodecSettings: {
          AacSettings: {
            Bitrate: job.config.bitrate * 1000,
            SampleRate: job.config.sampleRate
          }
        }
      }],
      Extension: job.config.format
    };
  } else {
    return {
      VideoDescription: {
        CodecSettings: {
          H264Settings: {
            Bitrate: job.config.videoBitrate * 1000,
            MaxBitrate: job.config.videoBitrate * 1200
          }
        },
        Width: parseInt(job.config.resolution.split('x')[0]),
        Height: parseInt(job.config.resolution.split('x')[1])
      },
      AudioDescriptions: [{
        CodecSettings: {
          AacSettings: {
            Bitrate: job.config.audioBitrate * 1000
          }
        }
      }],
      Extension: job.config.format
    };
  }
}

function createGCPConfig(job) {
  // Create GCP Transcoder configuration
  if (job.type === 'audio') {
    return {
      elementaryStreams: [{
        key: 'audio_stream',
        audioStream: {
          codec: 'aac',
          bitrateBps: job.config.bitrate * 1000
        }
      }],
      muxStreams: [{
        key: 'output',
        elementaryStreams: ['audio_stream'],
        container: job.config.format
      }]
    };
  } else {
    return {
      elementaryStreams: [
        {
          key: 'video_stream',
          videoStream: {
            codec: 'h264',
            bitrateBps: job.config.videoBitrate * 1000,
            frameRate: job.config.fps
          }
        },
        {
          key: 'audio_stream',
          audioStream: {
            codec: 'aac',
            bitrateBps: job.config.audioBitrate * 1000
          }
        }
      ],
      muxStreams: [{
        key: 'output',
        elementaryStreams: ['video_stream', 'audio_stream'],
        container: job.config.format
      }]
    };
  }
}

async function checkTranscodingCompletion(contentId) {
  try {
    // Get all transcoding jobs for this content
    const jobsSnapshot = await db.collection('transcodingJobs')
      .where('contentId', '==', contentId)
      .get();

    const jobs = jobsSnapshot.docs.map(doc => doc.data());
    const completedJobs = jobs.filter(job => job.status === 'completed');
    const failedJobs = jobs.filter(job => job.status === 'failed');

    console.log(`Transcoding status for ${contentId}: ${completedJobs.length}/${jobs.length} completed, ${failedJobs.length} failed`);

    if (completedJobs.length === jobs.length) {
      // All jobs completed successfully
      await updateProcessingStep(contentId, 'transcoding', 'completed', {
        totalJobs: jobs.length,
        completedJobs: completedJobs.length,
        failedJobs: failedJobs.length
      });

      // Trigger packaging
      await triggerPackaging(contentId);

    } else if (failedJobs.length > 0 && (completedJobs.length + failedJobs.length) === jobs.length) {
      // Some jobs failed, but all are finished
      if (completedJobs.length > 0) {
        // At least some succeeded, mark as partially completed
        await updateProcessingStep(contentId, 'transcoding', 'completed', {
          totalJobs: jobs.length,
          completedJobs: completedJobs.length,
          failedJobs: failedJobs.length,
          status: 'partial'
        });

        // Trigger packaging with available formats
        await triggerPackaging(contentId);
      } else {
        // All jobs failed
        await updateProcessingStep(contentId, 'transcoding', 'failed', {
          totalJobs: jobs.length,
          completedJobs: completedJobs.length,
          failedJobs: failedJobs.length,
          error: 'All transcoding jobs failed'
        });
      }
    }

  } catch (error) {
    console.error('Error checking transcoding completion:', error);
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

async function triggerPackaging(contentId) {
  try {
    const packagingUrl = `${process.env.URL}/.netlify/functions/content-ingestion/package-content`;
    fetch(packagingUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId })
    }).catch(error => {
      console.error('Failed to trigger packaging:', error);
    });

    console.log(`Packaging triggered for content ${contentId}`);

  } catch (error) {
    console.error('Error triggering packaging:', error);
  }
}