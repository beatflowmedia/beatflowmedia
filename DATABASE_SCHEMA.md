# Content Ingestion Database Schema

This document outlines the complete database schema for the BeatflowMedia content ingestion system using Firestore.

## Collections Overview

### 1. uploadSessions
Tracks resumable upload sessions using TUS protocol.

```javascript
{
  id: string,                    // UUID for upload session
  uploadLength: number,          // Total file size in bytes
  uploadOffset: number,          // Current upload progress in bytes
  metadata: {                    // User-provided metadata
    filename: string,
    title: string,
    artist: string,
    album?: string,
    genre?: string,
    isrc?: string,
    territorialRights: string,   // 'worldwide', 'us', 'eu', etc.
    releaseDate?: string,        // YYYY-MM-DD format
    label?: string,
    copyrightOwner?: string
  },
  status: string,                // 'created', 'uploading', 'completed', 'failed'
  createdAt: timestamp,
  expiresAt: timestamp,          // TTL for cleanup
  userId: string,                // Firebase Auth UID
  chunks: [{                     // Array of uploaded chunks
    id: string,
    path: string,               // Storage path
    offset: number,
    size: number,
    uploadedAt: timestamp
  }],
  processingStage: string,       // 'pending', 'assembling', 'validating', etc.
  validationResults?: object,
  transcodingStatus?: object,
  assembledFilePath?: string,
  updatedAt: timestamp
}
```

### 2. contentProcessing
Main content processing records tracking the full ingestion pipeline.

```javascript
{
  id: string,                    // UUID for content
  uploadId: string,              // Reference to uploadSessions
  filePath: string,              // Assembled file path in storage
  originalFilename: string,
  fileSize: number,              // File size in bytes
  contentType: string,           // MIME type
  status: string,                // Overall processing status
  processingSteps: {             // Detailed step tracking
    validation: {
      status: string,            // 'pending', 'in_progress', 'completed', 'failed'
      startedAt?: timestamp,
      completedAt?: timestamp,
      updatedAt: timestamp,
      data?: object             // Step-specific data
    },
    virusScan: { /* same structure */ },
    metadataExtraction: { /* same structure */ },
    transcoding: { /* same structure */ },
    packaging: { /* same structure */ },
    drm: { /* same structure */ }
  },
  metadata: {                    // Original + extracted metadata
    title: string,
    artist: string,
    album?: string,
    genre?: string,
    isrc?: string,
    territorialRights: string,
    releaseDate?: string,
    label?: string,
    copyrightOwner?: string,
    duration?: number,           // In seconds
    bpm?: number,
    key?: string,               // Musical key
    mood?: string,
    energy?: number,            // 0-1 scale
    danceability?: number       // 0-1 scale
  },
  extractedMetadata?: {          // Technical metadata from file
    format: string,
    bitrate?: number,
    sampleRate?: number,
    channels?: number,
    codec?: string,
    resolution?: string,         // For video
    frameRate?: number,          // For video
    aspectRatio?: string,        // For video
    colorSpace?: string,         // For video
    audioTracks?: number,
    videoTracks?: number,
    chapters?: array,
    artwork?: {                  // Embedded artwork
      mimeType: string,
      size: number,
      data: string            // Base64 encoded
    }
  },
  technicalInfo: {               // File analysis results
    fileSize: number,
    md5Hash?: string,
    crc32c?: string,
    estimatedDuration?: number,
    qualityScore?: number,      // 0-100
    compressionRatio?: number,
    hasErrors?: boolean,
    errorDetails?: array
  },
  createdAt: timestamp,
  updatedAt: timestamp,
  userId: string,
  completedAt?: timestamp
}
```

### 3. transcodingJobs
Individual transcoding jobs for different quality levels.

```javascript
{
  id: string,                    // Job ID: contentId_type_preset
  contentId: string,             // Reference to contentProcessing
  type: string,                  // 'audio' or 'video'
  preset: string,                // 'high', 'medium', 'low', '1080p', '720p', etc.
  config: {                      // Transcoding configuration
    bitrate?: number,            // Audio bitrate (kbps)
    sampleRate?: number,         // Audio sample rate (Hz)
    channels?: number,           // Audio channels
    format: string,              // Output format
    videoBitrate?: number,       // Video bitrate (kbps)
    audioBitrate?: number,       // Audio bitrate for video
    resolution?: string,         // Video resolution (WxH)
    fps?: number,               // Frame rate
    codec?: string,             // Video codec
    duration?: number,          // Clip duration (for previews)
    description: string
  },
  inputPath: string,             // Source file path
  outputPath: string,            // Target output path
  status: string,                // 'queued', 'processing', 'completed', 'failed'
  priority: number,              // 1-5 (1 = highest)
  progress?: number,             // 0-100
  createdAt: timestamp,
  startedAt?: timestamp,
  completedAt?: timestamp,
  failedAt?: timestamp,
  error?: string,
  outputSize?: number,           // Output file size
  duration?: number,             // Actual duration
  retryCount?: number,
  maxRetries?: number
}
```

### 4. packages
Streaming packages (HLS/DASH) with encryption info.

```javascript
{
  id: string,                    // Package ID
  contentId: string,             // Reference to contentProcessing
  format: string,                // 'hls' or 'dash'
  manifestPath: string,          // Main playlist/manifest path
  segmentPaths: [string],        // Array of segment file paths
  encryption: {                  // Encryption details
    method: string,              // 'aes-128', 'cenc'
    keyId?: string,
    keyPath?: string,           // For HLS
    pssh?: string,              // For DASH
    drmSystems?: [string]       // Supported DRM systems
  },
  qualityLevels: [{              // Available quality levels
    preset: string,
    bandwidth: number,
    resolution?: string,
    codecs: string,
    playlistPath?: string       // For HLS
  }],
  createdAt: timestamp,
  updatedAt: timestamp,
  totalSize: number,             // Total package size
  segmentDuration: number,       // Segment duration in seconds
  totalDuration: number,         // Total content duration
  cdnUrls?: {                   // CDN distribution URLs
    primary: string,
    fallback?: string,
    global?: [string]
  }
}
```

### 5. drmKeys
DRM encryption keys and system information.

```javascript
{
  contentId: string,             // Reference to contentProcessing
  keyId: string,                 // Hex string
  contentKey: string,            // Encrypted content key
  createdAt: timestamp,
  expiresAt?: timestamp,         // Key expiration
  drmSystems: {
    widevine: {
      systemId: string,
      pssh: string,             // Base64 encoded
      licenseServer: string
    },
    playready: {
      systemId: string,
      pssh: string,
      licenseServer: string
    },
    fairplay: {
      systemId: string,
      certificateUrl: string,
      licenseServer: string
    }
  },
  usage: {                      // Usage tracking
    playCount?: number,
    lastPlayed?: timestamp,
    uniqueDevices?: number
  },
  restrictions?: {              // Content restrictions
    geoBlocking?: [string],     // Blocked countries
    timeWindow?: {
      start?: timestamp,
      end?: timestamp
    },
    deviceLimit?: number
  }
}
```

### 6. songs (Enhanced)
Final processed songs ready for streaming - extends existing schema.

```javascript
{
  // Existing fields preserved...

  // New ingestion-related fields:
  contentId?: string,            // Reference to contentProcessing
  uploadId?: string,             // Reference to original upload
  processingVersion: string,     // Version of processing pipeline
  qualityLevels: {              // Available streaming qualities
    high: {
      url: string,
      bitrate: number,
      format: string,
      size: number
    },
    medium: { /* same structure */ },
    low: { /* same structure */ },
    preview?: { /* same structure */ }
  },
  streamingUrls: {
    hls?: string,               // HLS manifest URL
    dash?: string,              // DASH manifest URL
    progressive?: string        // Direct download URL
  },
  drmProtected: boolean,
  drmSystems?: [string],        // Available DRM systems
  technicalInfo: {
    originalFormat: string,
    originalBitrate?: number,
    originalSize: number,
    processingDate: timestamp,
    qualityScore?: number,
    compressionRatio?: number
  },
  ingestionMetadata: {
    uploadDate: timestamp,
    processingTime: number,     // Seconds
    automaticMetadata: object,  // Extracted metadata
    userMetadata: object,       // User-provided metadata
    validationResults: object,
    processingErrors?: [string]
  },
  isrc?: string,               // International Standard Recording Code
  territorialRights: string,   // Geographic distribution rights
  copyrightInfo: {
    owner?: string,
    label?: string,
    publishingRights?: string,
    masterRights?: string
  },
  analyticsEnabled: boolean,   // Enable play tracking
  monetizationEnabled: boolean, // Enable revenue tracking

  // Enhanced metadata
  acousticFeatures?: {         // Audio analysis results
    tempo: number,             // BPM
    key: string,               // Musical key
    mode: string,              // Major/Minor
    timeSignature: string,     // 4/4, 3/4, etc.
    energy: number,            // 0-1
    danceability: number,      // 0-1
    valence: number,           // 0-1 (positivity)
    acousticness: number,      // 0-1
    instrumentalness: number,  // 0-1
    liveness: number,          // 0-1
    speechiness: number        // 0-1
  }
}
```

### 7. errorLogs
Comprehensive error tracking across the ingestion pipeline.

```javascript
{
  id: string,                   // Error ID
  timestamp: timestamp,
  type: string,                 // Error type (see ERROR_TYPES)
  severity: string,             // 'low', 'medium', 'high', 'critical'
  message: string,              // Human-readable error message
  contentId?: string,           // Associated content
  uploadId?: string,            // Associated upload
  userId?: string,              // Associated user
  stage: string,                // Pipeline stage where error occurred
  details: {                    // Detailed error information
    stackTrace?: string,
    requestId?: string,
    functionName?: string,
    inputData?: object,
    systemInfo?: object
  },
  retryable: boolean,           // Can this error be retried?
  retryCount?: number,
  resolved: boolean,            // Has error been resolved?
  resolvedAt?: timestamp,
  resolvedBy?: string,          // User who resolved
  tags?: [string]              // Categorization tags
}
```

### 8. alerts
System alerts and notifications.

```javascript
{
  id: string,
  type: string,                 // Alert type
  severity: string,             // Alert severity
  message: string,
  contentId?: string,
  metadata?: object,            // Additional alert data
  timestamp: timestamp,
  acknowledged: boolean,
  acknowledgedAt?: timestamp,
  acknowledgedBy?: string,
  notificationsSent: {          // Track notification delivery
    email?: timestamp,
    slack?: timestamp,
    webhook?: timestamp
  },
  resolved: boolean,
  resolvedAt?: timestamp,
  tags?: [string]
}
```

### 9. quarantinedContent
Content flagged by virus scanning or other security measures.

```javascript
{
  contentId: string,
  originalPath: string,
  quarantinePath: string,
  threats: [string],            // Detected threats
  scanDetails: object,          // Detailed scan results
  quarantinedAt: timestamp,
  userId: string,
  reviewStatus: string,         // 'pending', 'approved', 'rejected'
  reviewedAt?: timestamp,
  reviewedBy?: string,
  reviewNotes?: string,
  releaseRequested: boolean,
  releaseApproved?: boolean
}
```

### 10. systemMetrics
System performance and health metrics.

```javascript
{
  id: string,                   // Metric ID (timestamp-based)
  timestamp: timestamp,
  metrics: {
    uploadSuccessRate: number,
    processingTime: {
      average: number,
      median: number,
      p95: number
    },
    transcodingTime: {
      average: number,
      median: number
    },
    storageUsage: {
      total: number,
      used: number,
      percentage: number
    },
    errorRate: number,
    queueDepth: {
      upload: number,
      processing: number,
      transcoding: number
    }
  },
  period: string,               // '1h', '1d', '1w'
  aggregationType: string       // 'snapshot', 'average', 'sum'
}
```

## Indexes

### Required Firestore Indexes

```javascript
// uploadSessions
- userId, createdAt (desc)
- status, createdAt (desc)
- expiresAt (asc)

// contentProcessing
- userId, createdAt (desc)
- status, createdAt (desc)
- uploadId
- contentType, createdAt (desc)

// transcodingJobs
- contentId, createdAt (desc)
- status, priority (desc), createdAt (asc)
- type, status, createdAt (desc)

// songs (enhanced existing)
- contentId
- isrc
- territorialRights, approved (existing)
- processingVersion, createdAt (desc)

// errorLogs
- timestamp (desc)
- severity, timestamp (desc)
- type, timestamp (desc)
- contentId, timestamp (desc)
- resolved, timestamp (desc)

// alerts
- timestamp (desc)
- severity, acknowledged, timestamp (desc)
- acknowledged, timestamp (desc)

// systemMetrics
- timestamp (desc)
- period, timestamp (desc)
```

## Security Rules Updates

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing rules preserved...

    // Upload sessions: users can only access their own
    match /uploadSessions/{sessionId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }

    // Content processing: users can read their own, admins can read all
    match /contentProcessing/{contentId} {
      allow read: if request.auth.uid == resource.data.userId
                  || request.auth.token.admin == true;
      allow write: if request.auth.token.admin == true;
    }

    // Transcoding jobs: admin only
    match /transcodingJobs/{jobId} {
      allow read, write: if request.auth.token.admin == true;
    }

    // Packages: read-only for authenticated users
    match /packages/{packageId} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.token.admin == true;
    }

    // DRM keys: admin only
    match /drmKeys/{contentId} {
      allow read, write: if request.auth.token.admin == true;
    }

    // Error logs: admin only
    match /errorLogs/{errorId} {
      allow read, write: if request.auth.token.admin == true;
    }

    // Alerts: admin only
    match /alerts/{alertId} {
      allow read, write: if request.auth.token.admin == true;
    }

    // Quarantined content: admin only
    match /quarantinedContent/{contentId} {
      allow read, write: if request.auth.token.admin == true;
    }

    // System metrics: admin only
    match /systemMetrics/{metricId} {
      allow read, write: if request.auth.token.admin == true;
    }
  }
}
```

## Data Migration

For existing installations, you'll need to:

1. **Preserve existing data**: All current `songs` collection data is preserved
2. **Add new fields**: Use Firestore batch updates to add new optional fields
3. **Create new collections**: Initialize the new collections with proper indexes
4. **Update security rules**: Deploy the enhanced security rules
5. **Migrate user uploads**: Existing file uploads can be retroactively processed through the new pipeline

## Cleanup Policies

- **uploadSessions**: Auto-delete after 7 days if not completed
- **transcodingJobs**: Archive completed jobs after 30 days
- **errorLogs**: Retain for 90 days, then archive critical errors only
- **systemMetrics**: Aggregate daily metrics into weekly/monthly summaries
- **packages**: Keep indefinitely but can be regenerated if deleted
- **drmKeys**: Retain as long as content is active