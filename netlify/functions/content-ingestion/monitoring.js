// netlify/functions/content-ingestion/monitoring.js
// Comprehensive monitoring and error handling system for content ingestion
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

// Error types and severity levels
const ERROR_TYPES = {
  UPLOAD_FAILED: 'upload_failed',
  VALIDATION_FAILED: 'validation_failed',
  VIRUS_DETECTED: 'virus_detected',
  TRANSCODING_FAILED: 'transcoding_failed',
  PACKAGING_FAILED: 'packaging_failed',
  DRM_FAILED: 'drm_failed',
  STORAGE_ERROR: 'storage_error',
  TIMEOUT: 'timeout',
  SYSTEM_ERROR: 'system_error'
};

const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Monitoring metrics
const METRICS = {
  UPLOAD_SUCCESS_RATE: 'upload_success_rate',
  PROCESSING_TIME: 'processing_time',
  TRANSCODING_TIME: 'transcoding_time',
  STORAGE_USAGE: 'storage_usage',
  ERROR_RATE: 'error_rate',
  QUEUE_DEPTH: 'queue_depth'
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const { action } = event.queryStringParameters || {};

  try {
    switch (action) {
      case 'health':
        return await handleHealthCheck(headers);
      case 'metrics':
        return await handleMetrics(headers);
      case 'status':
        return await handleStatusCheck(event, headers);
      case 'errors':
        return await handleErrorLogs(event, headers);
      case 'alert':
        return await handleAlert(event, headers);
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }
  } catch (error) {
    console.error('Monitoring error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Health check endpoint
async function handleHealthCheck(headers) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {},
    version: process.env.npm_package_version || '1.0.0'
  };

  try {
    // Check Firestore connectivity
    const testDoc = await db.collection('_health').doc('test').get();
    health.services.firestore = 'healthy';
  } catch (error) {
    health.services.firestore = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    // Check Firebase Storage connectivity
    const bucket = storage.bucket();
    await bucket.getMetadata();
    health.services.storage = 'healthy';
  } catch (error) {
    health.services.storage = 'unhealthy';
    health.status = 'degraded';
  }

  // Check processing queue health
  try {
    const queueStats = await getQueueStats();
    health.services.processing_queue = {
      status: 'healthy',
      stats: queueStats
    };
  } catch (error) {
    health.services.processing_queue = 'unhealthy';
    health.status = 'degraded';
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(health)
  };
}

// System metrics endpoint
async function handleMetrics(headers) {
  try {
    const metrics = await calculateSystemMetrics();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        metrics
      })
    };
  } catch (error) {
    throw new Error(`Failed to calculate metrics: ${error.message}`);
  }
}

// Status check for specific content
async function handleStatusCheck(event, headers) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const { contentId } = JSON.parse(event.body);

  if (!contentId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Content ID required' })
    };
  }

  try {
    const status = await getContentProcessingStatus(contentId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(status)
    };
  } catch (error) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Content not found' })
    };
  }
}

// Error logs endpoint
async function handleErrorLogs(event, headers) {
  const { limit = 50, severity, type, since } = event.queryStringParameters || {};

  try {
    const errors = await getErrorLogs({
      limit: parseInt(limit),
      severity,
      type,
      since: since ? new Date(since) : null
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        errors,
        total: errors.length
      })
    };
  } catch (error) {
    throw new Error(`Failed to get error logs: ${error.message}`);
  }
}

// Alert handling endpoint
async function handleAlert(event, headers) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const { type, severity, message, contentId, metadata } = JSON.parse(event.body);

  try {
    await createAlert({
      type,
      severity,
      message,
      contentId,
      metadata,
      timestamp: new Date()
    });

    // Trigger alert notifications based on severity
    if (severity === SEVERITY_LEVELS.CRITICAL || severity === SEVERITY_LEVELS.HIGH) {
      await sendAlertNotification({
        type,
        severity,
        message,
        contentId,
        metadata
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Alert created successfully' })
    };
  } catch (error) {
    throw new Error(`Failed to create alert: ${error.message}`);
  }
}

// Calculate system metrics
async function calculateSystemMetrics() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Upload success rate (last 24 hours)
  const uploadStats = await getUploadStats(oneDayAgo, now);
  const uploadSuccessRate = uploadStats.total > 0
    ? (uploadStats.successful / uploadStats.total) * 100
    : 100;

  // Processing times (last hour)
  const processingTimes = await getProcessingTimes(oneHourAgo, now);

  // Error rate (last 24 hours)
  const errorStats = await getErrorStats(oneDayAgo, now);
  const errorRate = uploadStats.total > 0
    ? (errorStats.total / uploadStats.total) * 100
    : 0;

  // Storage usage
  const storageUsage = await getStorageUsage();

  // Queue depth
  const queueDepth = await getQueueDepth();

  return {
    [METRICS.UPLOAD_SUCCESS_RATE]: {
      value: uploadSuccessRate,
      unit: 'percentage',
      period: '24h'
    },
    [METRICS.PROCESSING_TIME]: {
      average: processingTimes.average,
      median: processingTimes.median,
      p95: processingTimes.p95,
      unit: 'seconds',
      period: '1h'
    },
    [METRICS.TRANSCODING_TIME]: {
      average: processingTimes.transcoding.average,
      median: processingTimes.transcoding.median,
      unit: 'seconds',
      period: '1h'
    },
    [METRICS.STORAGE_USAGE]: {
      total: storageUsage.total,
      used: storageUsage.used,
      percentage: storageUsage.percentage,
      unit: 'bytes'
    },
    [METRICS.ERROR_RATE]: {
      value: errorRate,
      unit: 'percentage',
      period: '24h'
    },
    [METRICS.QUEUE_DEPTH]: {
      upload: queueDepth.upload,
      processing: queueDepth.processing,
      transcoding: queueDepth.transcoding
    }
  };
}

// Get content processing status with detailed progress
async function getContentProcessingStatus(contentId) {
  // Get main content record
  const contentDoc = await db.collection('contentProcessing').doc(contentId).get();
  if (!contentDoc.exists) {
    throw new Error('Content not found');
  }

  const contentData = contentDoc.data();

  // Get transcoding jobs
  const transcodingJobs = await db.collection('transcodingJobs')
    .where('contentId', '==', contentId)
    .get();

  const jobs = transcodingJobs.docs.map(doc => doc.data());

  // Calculate overall progress
  const overallProgress = calculateOverallProgress(contentData.processingSteps);

  // Get error logs for this content
  const errorLogs = await db.collection('errorLogs')
    .where('contentId', '==', contentId)
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();

  const errors = errorLogs.docs.map(doc => doc.data());

  return {
    contentId,
    status: contentData.status,
    overallProgress,
    processingSteps: contentData.processingSteps,
    transcodingJobs: jobs,
    metadata: contentData.metadata,
    extractedMetadata: contentData.extractedMetadata,
    createdAt: contentData.createdAt,
    updatedAt: contentData.updatedAt,
    errors: errors.slice(0, 5), // Latest 5 errors
    estimatedTimeRemaining: estimateTimeRemaining(contentData.processingSteps)
  };
}

// Calculate overall progress based on processing steps
function calculateOverallProgress(processingSteps) {
  const steps = ['validation', 'virusScan', 'metadataExtraction', 'transcoding', 'packaging', 'drm'];
  const weights = { validation: 10, virusScan: 10, metadataExtraction: 15, transcoding: 40, packaging: 20, drm: 5 };

  let totalWeight = 0;
  let completedWeight = 0;

  for (const step of steps) {
    const stepData = processingSteps[step];
    totalWeight += weights[step];

    if (stepData?.status === 'completed') {
      completedWeight += weights[step];
    } else if (stepData?.status === 'in_progress') {
      // Add partial progress for in-progress steps
      completedWeight += weights[step] * 0.5;
    }
  }

  return totalWeight > 0 ? completedWeight / totalWeight : 0;
}

// Estimate remaining time based on current progress
function estimateTimeRemaining(processingSteps) {
  const averageTimes = {
    validation: 30,      // seconds
    virusScan: 60,       // seconds
    metadataExtraction: 45, // seconds
    transcoding: 300,    // seconds (5 minutes)
    packaging: 120,      // seconds
    drm: 60             // seconds
  };

  let estimatedTime = 0;
  const steps = Object.keys(averageTimes);

  for (const step of steps) {
    const stepData = processingSteps[step];
    if (!stepData || stepData.status === 'pending') {
      estimatedTime += averageTimes[step];
    } else if (stepData.status === 'in_progress') {
      estimatedTime += averageTimes[step] * 0.5; // Assume halfway done
    }
  }

  return estimatedTime;
}

// Get upload statistics
async function getUploadStats(startDate, endDate) {
  const uploadsSnapshot = await db.collection('uploadSessions')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();

  const uploads = uploadsSnapshot.docs.map(doc => doc.data());

  return {
    total: uploads.length,
    successful: uploads.filter(u => u.status === 'completed').length,
    failed: uploads.filter(u => u.status === 'failed').length,
    inProgress: uploads.filter(u => u.status === 'created' || u.status === 'uploading').length
  };
}

// Get processing time statistics
async function getProcessingTimes(startDate, endDate) {
  const contentSnapshot = await db.collection('contentProcessing')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .where('status', '==', 'completed')
    .get();

  const contents = contentSnapshot.docs.map(doc => doc.data());
  const processingTimes = [];
  const transcodingTimes = [];

  for (const content of contents) {
    if (content.createdAt && content.updatedAt) {
      const totalTime = (content.updatedAt.toDate() - content.createdAt.toDate()) / 1000;
      processingTimes.push(totalTime);

      // Calculate transcoding time specifically
      const transcodingStep = content.processingSteps?.transcoding;
      if (transcodingStep?.startedAt && transcodingStep?.completedAt) {
        const transcodingTime = (transcodingStep.completedAt.toDate() - transcodingStep.startedAt.toDate()) / 1000;
        transcodingTimes.push(transcodingTime);
      }
    }
  }

  return {
    average: calculateAverage(processingTimes),
    median: calculateMedian(processingTimes),
    p95: calculatePercentile(processingTimes, 95),
    transcoding: {
      average: calculateAverage(transcodingTimes),
      median: calculateMedian(transcodingTimes)
    }
  };
}

// Get error statistics
async function getErrorStats(startDate, endDate) {
  const errorsSnapshot = await db.collection('errorLogs')
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<=', endDate)
    .get();

  const errors = errorsSnapshot.docs.map(doc => doc.data());

  return {
    total: errors.length,
    byType: groupBy(errors, 'type'),
    bySeverity: groupBy(errors, 'severity')
  };
}

// Get storage usage information
async function getStorageUsage() {
  try {
    const bucket = storage.bucket();
    const [metadata] = await bucket.getMetadata();

    // This is a simplified version - in production you'd query actual usage
    return {
      total: 1000 * 1024 * 1024 * 1024, // 1TB limit (example)
      used: metadata.size || 0,
      percentage: metadata.size ? (metadata.size / (1000 * 1024 * 1024 * 1024)) * 100 : 0
    };
  } catch (error) {
    return { total: 0, used: 0, percentage: 0 };
  }
}

// Get queue depth statistics
async function getQueueDepth() {
  const [uploadQueue, processingQueue, transcodingQueue] = await Promise.all([
    db.collection('uploadSessions').where('status', '==', 'created').get(),
    db.collection('contentProcessing').where('status', 'in', ['pending_validation', 'validating', 'pending_virus_scan']).get(),
    db.collection('transcodingJobs').where('status', 'in', ['queued', 'processing']).get()
  ]);

  return {
    upload: uploadQueue.size,
    processing: processingQueue.size,
    transcoding: transcodingQueue.size
  };
}

// Get queue statistics
async function getQueueStats() {
  const queueDepth = await getQueueDepth();

  return {
    depth: queueDepth,
    healthy: queueDepth.upload < 100 && queueDepth.processing < 50 && queueDepth.transcoding < 20
  };
}

// Get error logs with filters
async function getErrorLogs(filters = {}) {
  let query = db.collection('errorLogs');

  if (filters.severity) {
    query = query.where('severity', '==', filters.severity);
  }

  if (filters.type) {
    query = query.where('type', '==', filters.type);
  }

  if (filters.since) {
    query = query.where('timestamp', '>=', filters.since);
  }

  query = query.orderBy('timestamp', 'desc').limit(filters.limit || 50);

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Create alert
async function createAlert(alertData) {
  const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.collection('alerts').doc(alertId).set({
    id: alertId,
    ...alertData,
    createdAt: new Date(),
    acknowledged: false
  });

  return alertId;
}

// Send alert notification
async function sendAlertNotification(alert) {
  // Integration with notification services (email, Slack, PagerDuty, etc.)
  console.log('🚨 ALERT:', alert);

  // Email notification (example)
  if (process.env.ALERT_EMAIL_WEBHOOK) {
    try {
      await fetch(process.env.ALERT_EMAIL_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `[${alert.severity.toUpperCase()}] Content Ingestion Alert`,
          message: alert.message,
          metadata: alert.metadata
        })
      });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  // Slack notification (example)
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 *${alert.severity.toUpperCase()} Alert*\n${alert.message}`,
          attachments: [{
            color: alert.severity === 'critical' ? 'danger' : 'warning',
            fields: [
              { title: 'Type', value: alert.type, short: true },
              { title: 'Content ID', value: alert.contentId || 'N/A', short: true }
            ]
          }]
        })
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }
}

// Utility functions
function calculateAverage(numbers) {
  return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
}

function calculateMedian(numbers) {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculatePercentile(numbers, percentile) {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = Math.floor((percentile / 100) * sorted.length);
  return sorted[Math.min(index, sorted.length - 1)];
}

function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const group = item[key] || 'unknown';
    groups[group] = (groups[group] || 0) + 1;
    return groups;
  }, {});
}

// Export monitoring utilities for use in other functions
module.exports = {
  ERROR_TYPES,
  SEVERITY_LEVELS,
  createAlert,
  sendAlertNotification,
  calculateOverallProgress
};