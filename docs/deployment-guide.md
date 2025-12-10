# Content Ingestion System Deployment Guide

## Prerequisites

Before deploying the content ingestion system, ensure you have:

1. **Node.js** (v16 or higher)
2. **Firebase CLI** installed globally
3. **Netlify CLI** installed globally
4. **Firebase project** configured
5. **Git** for version control

## Quick Start Deployment

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd music-license-app

# Install dependencies
npm install

# Install CLI tools if not already installed
npm install -g firebase-tools netlify-cli

# Login to services
firebase login
netlify login
```

### 2. Firebase Configuration

```bash
# Initialize Firebase (if not already done)
firebase init

# Select these services:
# - Firestore Database
# - Storage
# - Functions (optional for additional backend logic)

# Deploy Firestore rules and indexes
firebase deploy --only firestore
```

### 3. Environment Variables

Create environment files for different stages:

#### `.env.local` (Development)
```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=beatflowmedia-dev
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@beatflowmedia-dev.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=beatflowmedia-dev.appspot.com

# Development URLs
URL=http://localhost:8888

# Virus Scanning (Optional in dev)
VIRUSTOTAL_API_KEY=optional-for-dev
CLAMAV_ENDPOINT=http://localhost:3310

# DRM Configuration (Use test keys in dev)
WIDEVINE_LICENSE_SERVER=https://widevine-proxy.appspot.com/proxy
PLAYREADY_LICENSE_SERVER=https://test.playready.microsoft.com
FAIRPLAY_CERTIFICATE_URL=https://fps.example.com/fairplay.cer

# Monitoring
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
ALERT_EMAIL_WEBHOOK=https://api.emailservice.com/send

# Transcoding
TRANSCODING_SERVICE=builtin
```

#### `.env.production`
```bash
# Firebase Configuration (Production)
FIREBASE_PROJECT_ID=beatflowmedia-prod
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@beatflowmedia-prod.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=beatflowmedia-prod.appspot.com

# Production URLs
URL=https://your-domain.com

# Virus Scanning (Required in production)
VIRUSTOTAL_API_KEY=your-production-virustotal-key
CLAMAV_ENDPOINT=https://your-clamav-service.com
METADEFENDER_API_KEY=your-metadefender-key

# DRM Configuration (Production keys)
WIDEVINE_LICENSE_SERVER=https://your-widevine-license-server.com
PLAYREADY_LICENSE_SERVER=https://your-playready-license-server.com
FAIRPLAY_CERTIFICATE_URL=https://your-fairplay-cert-server.com/cert

# Cloud Transcoding (Recommended for production)
TRANSCODING_SERVICE=aws
AWS_MEDIACONVERT_ROLE=arn:aws:iam::account:role/MediaConvertRole
AWS_S3_BUCKET=your-transcoding-bucket

# Or use GCP
TRANSCODING_SERVICE=gcp
GCP_PROJECT_ID=your-gcp-project
GCP_LOCATION=us-central1
GCP_STORAGE_BUCKET=your-gcp-bucket

# Monitoring and Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/PROD/WEBHOOK
ALERT_EMAIL_WEBHOOK=https://api.emailservice.com/send
```

### 4. Netlify Deployment

```bash
# Build the project
npm run build

# Deploy to Netlify
netlify deploy --prod

# Set environment variables in Netlify Dashboard
netlify env:set FIREBASE_PROJECT_ID "your-project-id"
netlify env:set FIREBASE_PRIVATE_KEY "your-private-key"
# ... repeat for all environment variables
```

### 5. Database Initialization

Run the database setup script to create initial collections and indexes:

```bash
# Create initial database structure
node scripts/initializeDatabase.js

# Optionally seed with test data
node scripts/seedTestData.js
```

## Detailed Configuration

### Firebase Storage Configuration

#### Storage Rules (`storage.rules`)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Upload chunks - authenticated users only
    match /uploads/{uploadId}/chunks/{chunkId} {
      allow write: if request.auth != null;
      allow read: if request.auth != null &&
        request.auth.uid == resource.metadata.userId;
    }

    // Assembled files - system access only
    match /uploads/{uploadId}/assembled/{filename} {
      allow write: if request.auth != null;
      allow read: if request.auth != null;
    }

    // Transcoded content - public read for published content
    match /transcoded/{contentId}/{allPaths=**} {
      allow read: if true; // Public read for streaming
      allow write: if false; // System only
    }

    // Packages (HLS/DASH) - public read
    match /packages/{contentId}/{allPaths=**} {
      allow read: if true;
      allow write: if false;
    }

    // DRM keys - no public access
    match /drm-keys/{allPaths=**} {
      allow read, write: if false; // Admin SDK only
    }
  }
}
```

#### Storage Lifecycle Configuration
```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 7,
          "matchesPrefix": ["uploads/"]
        }
      },
      {
        "action": {
          "type": "SetStorageClass",
          "storageClass": "COLDLINE"
        },
        "condition": {
          "age": 90,
          "matchesPrefix": ["transcoded/"]
        }
      }
    ]
  }
}
```

### Firestore Configuration

#### Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can manage their own upload sessions
    match /uploadSessions/{uploadId} {
      allow read, write: if request.auth != null &&
        (resource == null || resource.data.userId == request.auth.uid);
    }

    // Content processing - users can read their own, admins can read all
    match /contentProcessing/{contentId} {
      allow read: if request.auth != null &&
        (resource.data.userId == request.auth.uid || isAdmin());
      allow write: if request.auth != null &&
        (resource.data.userId == request.auth.uid || isAdmin());
    }

    // Published content library - public read for published content
    match /contentLibrary/{contentId} {
      allow read: if resource.data.status == 'published' ||
        (request.auth != null &&
         (resource.data.uploadedBy == request.auth.uid || isAdmin()));
      allow write: if request.auth != null && isAdmin();
    }

    // Transcoding jobs - admins only
    match /transcodingJobs/{jobId} {
      allow read, write: if request.auth != null && isAdmin();
    }

    // DRM keys - no direct access (Admin SDK only)
    match /drmKeys/{contentId} {
      allow read, write: if false;
    }

    // Error logs and monitoring - admins only
    match /errorLogs/{errorId} {
      allow read, write: if request.auth != null && isAdmin();
    }

    match /alerts/{alertId} {
      allow read, write: if request.auth != null && isAdmin();
    }

    // Helper functions
    function isAdmin() {
      return request.auth != null &&
        exists(/databases/$(database)/documents/adminUsers/$(request.auth.uid));
    }
  }
}
```

#### Firestore Indexes (`firestore.indexes.json`)
```json
{
  "indexes": [
    {
      "collectionGroup": "uploadSessions",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "contentProcessing",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "updatedAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "transcodingJobs",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "priority", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "contentLibrary",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "publishedAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "errorLogs",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "severity", "order": "ASCENDING"},
        {"fieldPath": "timestamp", "order": "DESCENDING"}
      ]
    }
  ],
  "fieldOverrides": [
    {
      "collectionGroup": "contentProcessing",
      "fieldPath": "metadata.territorialRights",
      "indexes": [
        {
          "order": "ASCENDING",
          "queryScope": "COLLECTION"
        }
      ]
    }
  ]
}
```

### CDN Configuration

#### Netlify `_redirects` file
```
# API redirects
/api/content-ingestion/*  /.netlify/functions/content-ingestion/:splat  200

# Streaming content (for development)
/stream/*  https://storage.googleapis.com/your-bucket/:splat  200

# SPA fallback
/*    /index.html   200
```

#### Netlify `_headers` file
```
# Security headers
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin

# CORS for API endpoints
/.netlify/functions/*
  Access-Control-Allow-Origin: https://your-domain.com
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization, Upload-Length, Upload-Metadata, Upload-Offset, Tus-Resumable

# Streaming content headers
/stream/*
  Cache-Control: public, max-age=31536000
  Access-Control-Allow-Origin: *
```

## Production Deployment Checklist

### Pre-deployment

- [ ] Environment variables configured
- [ ] Firebase project permissions set
- [ ] DRM licenses obtained and configured
- [ ] Virus scanning services configured
- [ ] CDN accounts set up
- [ ] Monitoring tools configured
- [ ] SSL certificates installed
- [ ] Domain names configured

### Security

- [ ] Firestore security rules deployed
- [ ] Storage security rules deployed
- [ ] Admin user accounts created
- [ ] API rate limiting configured
- [ ] Content encryption keys generated
- [ ] Backup strategies implemented
- [ ] Access logs enabled

### Performance

- [ ] CDN regions configured
- [ ] Database indexes created
- [ ] Storage lifecycle policies set
- [ ] Transcoding services optimized
- [ ] Monitoring thresholds configured
- [ ] Auto-scaling rules defined

### Testing

- [ ] End-to-end upload flow tested
- [ ] DRM functionality verified
- [ ] Cross-browser compatibility tested
- [ ] Mobile responsiveness verified
- [ ] Performance benchmarks met
- [ ] Security scanning completed

## Monitoring and Maintenance

### Health Checks

```bash
# Automated health check script
#!/bin/bash

echo "Checking Content Ingestion System Health..."

# Check Netlify Functions
curl -f https://your-domain.com/.netlify/functions/content-ingestion/monitoring?action=health || echo "❌ Functions unhealthy"

# Check Firebase connectivity
firebase database:get / --project your-project-id > /dev/null || echo "❌ Firebase unreachable"

# Check storage bucket
gsutil ls gs://your-bucket > /dev/null || echo "❌ Storage unreachable"

echo "✅ Health check completed"
```

### Backup Strategy

```bash
# Daily backup script
#!/bin/bash

DATE=$(date +%Y%m%d)

# Backup Firestore
gcloud firestore export gs://your-backup-bucket/firestore-backup-$DATE --project=your-project-id

# Backup critical storage paths
gsutil -m cp -r gs://your-bucket/uploads gs://your-backup-bucket/storage-backup-$DATE/uploads
gsutil -m cp -r gs://your-bucket/packages gs://your-backup-bucket/storage-backup-$DATE/packages

echo "✅ Backup completed for $DATE"
```

### Log Monitoring

```bash
# Monitor error logs
#!/bin/bash

# Get recent errors
curl -s "https://your-domain.com/.netlify/functions/content-ingestion/monitoring?action=errors&limit=100&since=$(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ)" | jq '.errors[] | select(.severity == "critical" or .severity == "high")'

# Alert if critical errors found
ERROR_COUNT=$(curl -s "https://your-domain.com/.netlify/functions/content-ingestion/monitoring?action=errors&severity=critical&since=$(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ)" | jq '.errors | length')

if [ "$ERROR_COUNT" -gt 0 ]; then
    echo "🚨 $ERROR_COUNT critical errors in the last hour"
    # Send alert notification
fi
```

## Troubleshooting

### Common Deployment Issues

#### 1. Firebase Permissions
```bash
# Grant necessary permissions
gcloud projects add-iam-policy-binding your-project-id \
    --member="serviceAccount:your-service-account@your-project-id.iam.gserviceaccount.com" \
    --role="roles/firebase.admin"
```

#### 2. Storage CORS Configuration
```json
[
  {
    "origin": ["https://your-domain.com"],
    "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Upload-Offset", "Upload-Length", "Tus-Resumable"]
  }
]
```

#### 3. Function Timeout Issues
```javascript
// Increase timeout in netlify.toml
[functions]
  timeout = 900  # 15 minutes for large file processing
```

### Performance Optimization

#### 1. Function Memory Allocation
```toml
# netlify.toml
[functions."content-ingestion/*"]
  memory = 3008  # Maximum memory for processing large files
```

#### 2. Database Query Optimization
```javascript
// Use composite indexes for complex queries
const query = db.collection('contentProcessing')
  .where('status', '==', 'processing')
  .where('userId', '==', userId)
  .orderBy('createdAt', 'desc')
  .limit(20);
```

#### 3. Storage Upload Optimization
```javascript
// Configure resumable upload chunk size
const OPTIMAL_CHUNK_SIZE = 8 * 1024 * 1024; // 8MB for most connections
```

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Review error logs and performance metrics
2. **Monthly**: Update dependencies and security patches
3. **Quarterly**: Review and rotate DRM keys
4. **Annually**: Security audit and compliance review

### Emergency Procedures

1. **Service Outage**: Activate backup CDN regions
2. **Security Breach**: Rotate all keys and certificates
3. **Data Loss**: Restore from automated backups
4. **Performance Degradation**: Scale up processing resources

For additional support, refer to the architecture documentation or contact the development team.