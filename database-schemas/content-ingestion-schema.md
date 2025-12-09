# Content Ingestion Database Schema

This document outlines the complete database schema for BeatflowMedia's content ingestion system, designed to handle audio/video content processing, DRM, territorial rights, and comprehensive metadata management.

## Firestore Collections

### 1. uploadSessions
Manages resumable upload sessions using TUS protocol.

```javascript
{
  id: string,                    // UUID for upload session
  uploadLength: number,          // Total file size in bytes
  uploadOffset: number,          // Current uploaded bytes
  metadata: {
    filename: string,
    filetype: string,
    title?: string,
    artist?: string,
    album?: string,
    genre?: string,
    isrc?: string,
    territorialRights?: string,
    releaseDate?: string,
    label?: string,
    copyrightOwner?: string
  },
  status: string,               // 'created', 'uploading', 'completed', 'failed', 'expired'
  createdAt: timestamp,
  expiresAt: timestamp,         // 24 hours from creation
  updatedAt: timestamp,
  userId: string,               // Firebase Auth user ID
  chunks: [{
    id: string,                 // Chunk UUID
    path: string,               // Storage path
    offset: number,             // Byte offset
    size: number,               // Chunk size
    uploadedAt: timestamp
  }],
  processingStage: string,      // 'pending', 'assembling', 'validating', 'completed'
  assembledFilePath?: string    // Path to assembled file
}
```

### 2. contentProcessing
Main content processing pipeline tracking.

```javascript
{
  id: string,                   // Content UUID
  uploadId: string,             // Reference to uploadSessions
  filePath: string,             // Storage path to assembled file
  originalFilename: string,
  fileSize: number,
  contentType: string,          // MIME type
  status: string,               // 'pending_validation', 'validating', 'validated', 'virus_scanning', 'clean', 'quarantined', 'transcoding', 'packaging', 'completed', 'failed'

  // Processing pipeline steps
  processingSteps: {
    validation: {
      status: string,           // 'pending', 'in_progress', 'completed', 'failed'
      startedAt?: timestamp,
      completedAt?: timestamp,
      updatedAt: timestamp,
      data?: object            // Validation results
    },
    virusScan: {
      status: string,
      startedAt?: timestamp,
      completedAt?: timestamp,
      updatedAt: timestamp,
      data?: object            // Scan results
    },
    metadataExtraction: {
      status: string,
      startedAt?: timestamp,
      completedAt?: timestamp,
      updatedAt: timestamp,
      data?: object            // Extracted metadata
    },
    transcoding: {
      status: string,
      startedAt?: timestamp,
      completedAt?: timestamp,
      updatedAt: timestamp,
      data?: object            // Transcoding job results
    },
    packaging: {
      status: string,
      startedAt?: timestamp,
      completedAt?: timestamp,
      updatedAt: timestamp,
      data?: object            // HLS/DASH package info
    },
    drm: {
      status: string,
      startedAt?: timestamp,
      completedAt?: timestamp,
      updatedAt: timestamp,
      data?: object            // DRM setup results
    }
  },

  // Content metadata
  metadata: {
    // User-provided metadata
    title: string,
    artist: string,
    album?: string,
    genre?: string,
    releaseDate?: string,      // YYYY-MM-DD format
    isrc?: string,             // International Standard Recording Code
    territorialRights: string,  // 'worldwide', 'us', 'eu', 'uk', 'ca', 'au', 'jp', 'kr', 'custom'
    customTerritories?: [string], // If territorialRights = 'custom'
    label?: string,
    copyrightOwner: string,
    description?: string,
    tags?: [string],
    explicitContent: boolean,

    // Rights and licensing
    rightsOwner: string,
    publishingRights?: {
      publisher: string,
      territory: string,
      percentage: number,
      startDate: string,
      endDate?: string
    }[],
    mechanicalRights?: {
      owner: string,
      territory: string,
      rate: number             // Per-play rate in cents
    }[],
    synchronizationRights?: {
      owner: string,
      territory: string,
      restrictions?: string[]   // e.g., ['no_tv', 'no_film', 'no_advertising']
    }[],

    // Commercial information
    price?: {
      currency: string,        // ISO 4217 currency code
      amount: number,
      priceType: string        // 'fixed', 'per_use', 'subscription', 'royalty'
    },
    licensing: {
      commercialUse: boolean,
      editorialUse: boolean,
      exclusivity: string,     // 'exclusive', 'non_exclusive', 'limited'
      duration?: number,       // License duration in days
      usageRestrictions?: string[]
    }
  },

  // Extracted technical metadata
  extractedMetadata?: {
    // Technical information
    duration?: number,          // Seconds
    bitrate?: number,          // kbps
    sampleRate?: number,       // Hz
    channels?: number,
    format: string,
    codec?: string,
    resolution?: string,       // For video: "1920x1080"
    fps?: number,              // For video

    // Audio-specific
    bpm?: number,
    key?: string,              // Musical key
    loudness?: number,         // LUFS

    // Video-specific
    aspectRatio?: string,
    colorSpace?: string,
    hdr?: boolean,

    // File information
    md5Hash: string,
    crc32c: string,
    fileIntegrity: boolean,

    // Embedded metadata
    id3Tags?: object,
    exifData?: object,

    // Content analysis
    audioFingerprint?: string,
    videoFingerprint?: string,
    contentRecognition?: {
      musicBrainzId?: string,
      acoustIdScore?: number,
      duplicateDetection?: boolean,
      copyrightClaims?: [{
        claimant: string,
        confidence: number,
        territory: string
      }]
    }
  },

  // Artwork and visual assets
  artwork?: {
    coverArt?: {
      path: string,
      mimeType: string,
      size: number,
      dimensions: {
        width: number,
        height: number
      }
    },
    thumbnail?: {
      path: string,
      mimeType: string,
      size: number
    },
    videoThumbnail?: {
      path: string,
      mimeType: string,
      timestamp: number        // Frame timestamp for thumbnail
    }
  },

  createdAt: timestamp,
  updatedAt: timestamp,
  userId: string
}
```

### 3. transcodingJobs
Individual transcoding job tracking.

```javascript
{
  id: string,                   // Job UUID
  contentId: string,            // Reference to contentProcessing
  type: string,                 // 'audio' or 'video'
  preset: string,               // Quality preset name
  config: {
    // Audio presets
    bitrate?: number,           // kbps
    sampleRate?: number,        // Hz
    format: string,             // 'aac', 'mp3', 'flac'
    channels?: number,
    duration?: number,          // For preview clips

    // Video presets
    resolution?: string,        // "1920x1080"
    videoBitrate?: number,      // kbps
    audioBitrate?: number,      // kbps
    fps?: number,
    codec?: string,
    description: string
  },
  inputPath: string,            // Source file path
  outputPath: string,           // Transcoded file path
  status: string,               // 'queued', 'processing', 'completed', 'failed'
  priority: number,             // 1-3, lower is higher priority
  createdAt: timestamp,
  startedAt?: timestamp,
  completedAt?: timestamp,
  failedAt?: timestamp,
  error?: string,

  // Progress tracking
  progress?: number,            // 0-100 percentage
  outputSize?: number,          // Bytes
  processingTime?: number,      // Seconds

  // Cloud service job IDs
  awsJobId?: string,
  gcpJobId?: string,

  // Quality metrics
  qualityMetrics?: {
    psnr?: number,              // Peak Signal-to-Noise Ratio
    ssim?: number,              // Structural Similarity Index
    vmaf?: number               // Video Multimethod Assessment Fusion
  }
}
```

### 4. packages
Streaming packages (HLS/DASH) for content delivery.

```javascript
{
  id: string,                   // Package UUID
  contentId: string,            // Reference to contentProcessing
  format: string,               // 'hls' or 'dash'
  manifestPath: string,         // Master playlist/manifest path

  // Package details
  segmentPaths: [string],       // Array of segment file paths
  segmentDuration: number,      // Seconds
  totalDuration: number,        // Seconds

  // Quality variants
  representations: [{
    id: string,
    quality: string,            // '1080p', '720p', 'high', 'medium', etc.
    bandwidth: number,          // bps
    resolution?: string,        // For video
    mimeType: string,
    segments: [string]          // Segment paths for this quality
  }],

  // DRM information
  encryption: {
    method: string,             // 'AES-128', 'CENC'
    keyId?: string,
    keyPath?: string,           // For HLS AES-128
    pssh?: string,              // For DASH CENC
    drmSystems?: {
      widevine?: {
        systemId: string,
        pssh: string
      },
      playready?: {
        systemId: string,
        pssh: string
      },
      fairplay?: {
        systemId: string,
        keyUri: string,
        certificateUrl: string
      }
    }
  },

  // CDN and delivery
  cdnUrls?: {
    primary: string,
    backup?: string,
    regions?: {
      [region: string]: string  // Regional CDN endpoints
    }
  },

  // Access control
  accessControl: {
    public: boolean,
    geoRestrictions?: [string], // ISO country codes
    requireAuth: boolean,
    allowedDomains?: [string],
    maxConcurrentStreams?: number
  },

  createdAt: timestamp,
  updatedAt: timestamp,
  expiresAt?: timestamp         // For temporary packages
}
```

### 5. drmKeys
Secure storage for DRM encryption keys.

```javascript
{
  contentId: string,            // Primary key
  keyId: string,                // Hex string
  contentKey: string,           // Encrypted content key
  keyRotationId?: string,       // For key rotation

  // Key derivation
  derivationMethod: string,     // 'random', 'content_hash', 'user_specific'
  salt?: string,

  // DRM system keys
  drmSystems: {
    widevine?: {
      systemId: string,
      pssh: string,
      licenseUrl: string
    },
    playready?: {
      systemId: string,
      pssh: string,
      licenseUrl: string
    },
    fairplay?: {
      systemId: string,
      keyUri: string,
      certificateUrl: string
    }
  },

  // Key management
  createdAt: timestamp,
  expiresAt?: timestamp,        // For key rotation
  rotatedAt?: timestamp,
  status: string,               // 'active', 'rotated', 'revoked'

  // Access tracking
  lastAccessedAt?: timestamp,
  accessCount: number,

  // Security
  keyVersion: number,
  encryptionAlgorithm: string   // 'AES-256-GCM'
}
```

### 6. contentLibrary
Published content ready for streaming and licensing.

```javascript
{
  id: string,                   // Content UUID (same as contentProcessing.id)
  contentProcessingId: string,  // Reference to processing record

  // Content identification
  title: string,
  artist: string,
  album?: string,
  genre: string,
  releaseDate: string,
  isrc?: string,
  upc?: string,                 // Universal Product Code for albums

  // Content classification
  contentType: string,          // 'audio', 'video', 'audiovisual'
  category: string,             // 'music', 'podcast', 'audiobook', 'film', 'documentary'
  subGenre?: string,
  mood?: [string],              // 'upbeat', 'melancholy', 'energetic'
  instruments?: [string],
  vocals?: string,              // 'male', 'female', 'mixed', 'instrumental'
  language?: string,            // ISO 639-1 language code

  // Technical specifications
  duration: number,             // Seconds
  format: string,
  quality: {
    maxResolution?: string,     // Highest available resolution
    maxBitrate: number,         // Highest available bitrate
    audioQuality: string,       // 'lossy', 'lossless', 'hi-res'
    availableFormats: [string]  // All available formats/qualities
  },

  // Rights and licensing
  rightsOwner: string,
  copyrightYear: number,
  publishingInfo: {
    publisher?: string,
    publishingYear?: number,
    songwriters?: [string],
    composers?: [string]
  },

  // Territorial rights (detailed)
  territorialRights: {
    primary: string,            // Primary territory
    restrictions: [{
      territory: string,        // ISO country code or region
      type: string,             // 'allowed', 'restricted', 'exclusive'
      startDate: string,
      endDate?: string,
      restrictions?: [string],  // Specific restrictions
      royaltyRate?: number
    }]
  },

  // Licensing options
  licensing: {
    commercialUse: {
      available: boolean,
      price?: {
        currency: string,
        amount: number,
        unit: string            // 'per_use', 'per_month', 'flat_rate'
      },
      restrictions?: [string]
    },
    editorialUse: {
      available: boolean,
      price?: object,
      restrictions?: [string]
    },
    sync: {
      available: boolean,
      price?: object,
      restrictions?: [string],
      approvalRequired: boolean
    },
    streaming: {
      available: boolean,
      platforms?: [string],     // Allowed platforms
      exclusivity?: string
    }
  },

  // Content delivery
  streamingUrls: {
    hls?: string,               // HLS manifest URL
    dash?: string,              // DASH manifest URL
    progressive?: {
      [quality: string]: string // Direct file URLs for progressive download
    }
  },

  // Assets
  assets: {
    artwork?: {
      thumbnail: string,        // Small thumbnail URL
      cover: string,            // Cover art URL
      banner?: string           // Wide banner image URL
    },
    preview?: {
      audio?: string,           // Preview clip URL
      video?: string            // Video preview URL
    },
    waveform?: string,          // Waveform data URL
    lyrics?: {
      text: string,
      timedLyrics?: string,     // LRC format
      language: string
    }
  },

  // Analytics and metrics
  metrics: {
    plays: number,
    downloads: number,
    likes: number,
    shares: number,
    revenue: {
      total: number,
      currency: string,
      lastUpdated: timestamp
    },
    popularityScore: number,    // Algorithm-calculated score
    trendingScore?: number
  },

  // Content flags
  flags: {
    featured: boolean,
    trending: boolean,
    explicit: boolean,
    copyrightClaimed: boolean,
    monetized: boolean,
    verified: boolean,          // Artist/content verification
    qualityApproved: boolean    // Editorial quality approval
  },

  // SEO and discovery
  seo: {
    slug: string,               // URL-friendly identifier
    keywords: [string],
    description: string,
    metaTags?: object
  },

  // Publishing status
  status: string,               // 'draft', 'pending_review', 'approved', 'published', 'archived'
  publishedAt?: timestamp,
  archivedAt?: timestamp,

  // Timestamps
  createdAt: timestamp,
  updatedAt: timestamp,

  // User references
  uploadedBy: string,           // User ID
  approvedBy?: string,          // Admin user ID

  // Version control
  version: number,
  previousVersions?: [string]   // Array of previous content IDs
}
```

### 7. errorLogs
System error tracking and monitoring.

```javascript
{
  id: string,                   // Error UUID
  timestamp: timestamp,
  type: string,                 // Error type from ERROR_TYPES enum
  severity: string,             // 'low', 'medium', 'high', 'critical'
  message: string,

  // Context
  contentId?: string,
  uploadId?: string,
  userId?: string,
  functionName?: string,        // Which function/service

  // Error details
  error: {
    name: string,
    message: string,
    stack?: string,
    code?: string
  },

  // Request context
  request?: {
    method: string,
    url: string,
    headers?: object,
    body?: string,
    userAgent?: string,
    ip?: string
  },

  // System context
  system: {
    environment: string,        // 'production', 'staging', 'development'
    version: string,
    node_version?: string,
    memory_usage?: object,
    cpu_usage?: number
  },

  // Resolution tracking
  resolved: boolean,
  resolvedAt?: timestamp,
  resolvedBy?: string,
  resolution?: string,

  // Related errors
  parentErrorId?: string,
  childErrors?: [string],

  // Occurrence tracking
  occurrenceCount: number,
  firstOccurrence: timestamp,
  lastOccurrence: timestamp,

  // Alert status
  alertSent: boolean,
  alertLevel?: string,
  acknowledgment?: {
    acknowledged: boolean,
    acknowledgedBy?: string,
    acknowledgedAt?: timestamp
  }
}
```

### 8. alerts
System alerts and notifications.

```javascript
{
  id: string,                   // Alert UUID
  type: string,                 // Alert type
  severity: string,             // 'low', 'medium', 'high', 'critical'
  title: string,
  message: string,

  // Context
  contentId?: string,
  userId?: string,
  metadata?: object,

  // Alert lifecycle
  status: string,               // 'active', 'acknowledged', 'resolved', 'suppressed'
  createdAt: timestamp,
  acknowledgedAt?: timestamp,
  acknowledgedBy?: string,
  resolvedAt?: timestamp,
  resolvedBy?: string,

  // Notification tracking
  notifications: [{
    channel: string,            // 'email', 'slack', 'webhook', 'sms'
    status: string,             // 'sent', 'failed', 'pending'
    sentAt?: timestamp,
    recipient?: string,
    error?: string
  }],

  // Alert rules
  rules: {
    autoResolve: boolean,
    autoResolveTimeout?: number, // Minutes
    suppressDuplicates: boolean,
    suppressionWindow?: number,  // Minutes
    escalationRules?: [{
      level: string,
      delay: number,             // Minutes
      recipients: [string]
    }]
  },

  // Metrics
  metrics?: {
    affectedUsers?: number,
    affectedContent?: number,
    estimatedImpact?: string,
    slaBreached?: boolean
  }
}
```

### 9. quarantinedContent
Content flagged by security scans.

```javascript
{
  contentId: string,            // Primary key
  originalPath: string,
  quarantinePath: string,

  // Security details
  threats: [string],            // Detected threats
  scanDetails: {
    scanners: [string],         // Which scanners detected issues
    confidence: number,         // 0-100 confidence score
    details: object             // Scanner-specific details
  },

  // Quarantine info
  quarantinedAt: timestamp,
  quarantinedBy: string,        // 'system' or user ID
  reason: string,
  automaticQuarantine: boolean,

  // Review process
  reviewStatus: string,         // 'pending', 'reviewing', 'approved', 'rejected'
  reviewedAt?: timestamp,
  reviewedBy?: string,
  reviewNotes?: string,
  falsePositive?: boolean,

  // Actions
  actions: [{
    action: string,             // 'quarantine', 'delete', 'approve', 'flag'
    performedAt: timestamp,
    performedBy: string,
    notes?: string
  }],

  // Related data
  userId: string,               // Original uploader
  originalMetadata?: object,

  // Cleanup
  scheduledDeletion?: timestamp,
  deleted?: boolean,
  deletedAt?: timestamp
}
```

## Indexes

### Performance Optimization Indexes

```javascript
// uploadSessions indexes
uploadSessions.userId
uploadSessions.status
uploadSessions.expiresAt
uploadSessions.createdAt

// contentProcessing indexes
contentProcessing.userId
contentProcessing.status
contentProcessing.createdAt
contentProcessing.updatedAt
contentProcessing.metadata.artist
contentProcessing.metadata.genre
contentProcessing.metadata.territorialRights

// transcodingJobs indexes
transcodingJobs.contentId
transcodingJobs.status
transcodingJobs.priority_createdAt // Composite for queue processing
transcodingJobs.createdAt

// contentLibrary indexes
contentLibrary.status
contentLibrary.publishedAt
contentLibrary.artist
contentLibrary.genre
contentLibrary.territorialRights.primary
contentLibrary.flags.featured
contentLibrary.flags.trending
contentLibrary.metrics.popularityScore
contentLibrary.seo.slug // Unique

// errorLogs indexes
errorLogs.timestamp
errorLogs.severity
errorLogs.type
errorLogs.contentId
errorLogs.resolved

// alerts indexes
alerts.status
alerts.severity
alerts.createdAt
alerts.type
```

## Security Rules

### Firestore Security Rules Example

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Upload sessions - users can only access their own
    match /uploadSessions/{uploadId} {
      allow read, write: if request.auth != null &&
        (resource == null || resource.data.userId == request.auth.uid);
    }

    // Content processing - users can read their own, admins can read all
    match /contentProcessing/{contentId} {
      allow read: if request.auth != null &&
        (resource.data.userId == request.auth.uid ||
         isAdmin(request.auth.uid));
      allow write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    // Content library - public read for published content
    match /contentLibrary/{contentId} {
      allow read: if resource.data.status == 'published' ||
        (request.auth != null &&
         (resource.data.uploadedBy == request.auth.uid ||
          isAdmin(request.auth.uid)));
      allow write: if request.auth != null && isAdmin(request.auth.uid);
    }

    // Error logs and alerts - admin only
    match /errorLogs/{errorId} {
      allow read, write: if request.auth != null && isAdmin(request.auth.uid);
    }

    match /alerts/{alertId} {
      allow read, write: if request.auth != null && isAdmin(request.auth.uid);
    }

    // DRM keys - system access only (handled by admin SDK)
    match /drmKeys/{contentId} {
      allow read, write: if false; // Admin SDK only
    }

    // Helper function
    function isAdmin(userId) {
      return exists(/databases/$(database)/documents/users/$(userId)) &&
        get(/databases/$(database)/documents/users/$(userId)).data.role == 'admin';
    }
  }
}
```

## Data Retention and Cleanup

### Automated Cleanup Policies

1. **Upload Sessions**: Delete after 7 days
2. **Error Logs**: Retain for 90 days, then archive
3. **Quarantined Content**: Delete after 30 days if not reviewed
4. **Transcoding Jobs**: Clean up after 30 days for completed jobs
5. **DRM Keys**: Rotate every 365 days
6. **Audit Logs**: Retain for 2 years for compliance

### Storage Optimization

- Use Firebase Storage lifecycle rules for automatic cleanup
- Implement data compression for archived content
- Regular database maintenance for optimal performance
- Monitor and optimize query performance with composite indexes

This schema provides a comprehensive foundation for a production-ready content ingestion system with proper security, monitoring, and scalability considerations.