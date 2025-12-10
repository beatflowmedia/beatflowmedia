#!/usr/bin/env node

// scripts/initializeContentIngestion.js
// Initialization script for content ingestion system setup

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'beatflowmedia',
  collections: [
    'uploadSessions',
    'contentProcessing',
    'transcodingJobs',
    'packages',
    'drmKeys',
    'contentLibrary',
    'errorLogs',
    'alerts',
    'quarantinedContent',
    'adminUsers'
  ],
  sampleData: process.env.INCLUDE_SAMPLE_DATA === 'true'
};

console.log('🚀 Initializing BeatflowMedia Content Ingestion System...\n');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.projectId}.firebaseio.com`,
    storageBucket: `${serviceAccount.projectId}.appspot.com`
  });
}

const db = admin.firestore();
const storage = admin.storage();

async function initializeDatabase() {
  console.log('📄 Setting up Firestore collections...');

  // Create admin user (first user becomes admin)
  try {
    const adminUsersRef = db.collection('adminUsers');
    const adminSnapshot = await adminUsersRef.limit(1).get();

    if (adminSnapshot.empty && process.env.ADMIN_EMAIL) {
      console.log('👤 Creating initial admin user...');

      // Create admin user document
      await adminUsersRef.doc('initial-admin').set({
        email: process.env.ADMIN_EMAIL,
        role: 'admin',
        permissions: [
          'read:all',
          'write:all',
          'admin:system',
          'admin:users',
          'admin:content'
        ],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'system'
      });

      console.log('✅ Admin user created');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }

  // Initialize collection schemas
  for (const collectionName of CONFIG.collections) {
    try {
      await initializeCollection(collectionName);
      console.log(`✅ ${collectionName} collection initialized`);
    } catch (error) {
      console.error(`❌ Error initializing ${collectionName}:`, error.message);
    }
  }

  console.log('');
}

async function initializeCollection(collectionName) {
  const collectionRef = db.collection(collectionName);

  // Check if collection exists by trying to get a document
  const snapshot = await collectionRef.limit(1).get();

  if (snapshot.empty) {
    // Create a placeholder document to initialize the collection
    const placeholder = {
      _placeholder: true,
      _createdAt: admin.firestore.FieldValue.serverTimestamp(),
      _note: `Placeholder document for ${collectionName} collection initialization`
    };

    await collectionRef.doc('_init').set(placeholder);

    // Immediately delete the placeholder
    await collectionRef.doc('_init').delete();
  }
}

async function initializeStorageBuckets() {
  console.log('🗄️  Setting up Firebase Storage structure...');

  const bucket = storage.bucket();

  // Create storage structure with placeholder files
  const storageStructure = [
    'uploads/',
    'transcoded/',
    'packages/',
    'drm-keys/',
    'quarantine/',
    'temp/',
    'thumbnails/',
    'waveforms/',
    'previews/'
  ];

  for (const folder of storageStructure) {
    try {
      const file = bucket.file(`${folder}.gitkeep`);
      await file.save('# Storage folder placeholder\n', {
        metadata: {
          contentType: 'text/plain',
          metadata: {
            purpose: 'Storage structure initialization',
            createdBy: 'content-ingestion-setup'
          }
        }
      });
      console.log(`✅ Created storage folder: ${folder}`);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.error(`❌ Error creating ${folder}:`, error.message);
      }
    }
  }

  console.log('');
}

async function setupDRMKeys() {
  console.log('🔐 Setting up DRM configuration...');

  // Create sample DRM configuration
  const drmConfig = {
    widevine: {
      licenseServerUrl: process.env.WIDEVINE_LICENSE_SERVER || 'https://proxy.uat.widevine.com/proxy',
      provider: 'widevine',
      systemId: 'edef8ba9-79d6-4ace-a3c8-27dcd51d21ed'
    },
    playready: {
      licenseServerUrl: process.env.PLAYREADY_LICENSE_SERVER || 'https://test.playready.microsoft.com',
      provider: 'playready',
      systemId: '9a04f079-9840-4286-ab92-e65be0885f95'
    },
    fairplay: {
      licenseServerUrl: process.env.FAIRPLAY_LICENSE_SERVER || 'https://fps.example.com',
      certificateUrl: process.env.FAIRPLAY_CERTIFICATE_URL || 'https://fps.example.com/fairplay.cer',
      provider: 'fairplay'
    }
  };

  try {
    await db.collection('systemConfig').doc('drm').set({
      configuration: drmConfig,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'system'
    });
    console.log('✅ DRM configuration created');
  } catch (error) {
    console.error('❌ Error setting up DRM:', error.message);
  }

  console.log('');
}

async function createSampleData() {
  if (!CONFIG.sampleData) {
    console.log('⏭️  Skipping sample data creation');
    return;
  }

  console.log('📝 Creating sample data...');

  // Sample content processing record
  const sampleContent = {
    id: 'sample-content-001',
    uploadId: 'sample-upload-001',
    filePath: 'uploads/sample-upload-001/assembled/sample.mp3',
    originalFilename: 'sample-song.mp3',
    fileSize: 5242880, // 5MB
    contentType: 'audio/mpeg',
    status: 'completed',

    processingSteps: {
      validation: {
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        data: { passed: true }
      },
      virusScan: {
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        data: { clean: true, scanners: ['basic'] }
      },
      metadataExtraction: {
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        data: { format: 'MP3', duration: 180 }
      },
      transcoding: {
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        data: { jobs: 3, completed: 3 }
      },
      packaging: {
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        data: { formats: ['hls', 'dash'] }
      },
      drm: {
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        data: { encrypted: true }
      }
    },

    metadata: {
      title: 'Sample Song',
      artist: 'Sample Artist',
      album: 'Sample Album',
      genre: 'Electronic',
      territorialRights: 'worldwide',
      copyrightOwner: 'Sample Records',
      explicitContent: false
    },

    extractedMetadata: {
      duration: 180,
      bitrate: 320,
      sampleRate: 44100,
      channels: 2,
      format: 'MP3',
      md5Hash: 'sample-hash-123',
      fileIntegrity: true
    },

    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    userId: 'sample-user-001'
  };

  try {
    await db.collection('contentProcessing').doc('sample-content-001').set(sampleContent);
    console.log('✅ Sample content record created');
  } catch (error) {
    console.error('❌ Error creating sample data:', error.message);
  }

  // Sample content library entry
  const sampleLibraryContent = {
    id: 'sample-content-001',
    contentProcessingId: 'sample-content-001',
    title: 'Sample Song',
    artist: 'Sample Artist',
    album: 'Sample Album',
    genre: 'Electronic',
    releaseDate: '2024-01-01',
    contentType: 'audio',
    category: 'music',
    duration: 180,
    format: 'MP3',

    quality: {
      maxBitrate: 320,
      audioQuality: 'lossy',
      availableFormats: ['320k', '192k', '128k']
    },

    territorialRights: {
      primary: 'worldwide',
      restrictions: []
    },

    licensing: {
      commercialUse: {
        available: true,
        price: {
          currency: 'USD',
          amount: 29.99,
          unit: 'per_use'
        }
      },
      streaming: {
        available: true,
        platforms: ['web', 'mobile', 'tv']
      }
    },

    streamingUrls: {
      hls: 'https://storage.googleapis.com/sample-bucket/packages/sample-content-001/hls/playlist.m3u8',
      dash: 'https://storage.googleapis.com/sample-bucket/packages/sample-content-001/dash/manifest.mpd'
    },

    assets: {
      artwork: {
        thumbnail: 'https://storage.googleapis.com/sample-bucket/thumbnails/sample-content-001.jpg',
        cover: 'https://storage.googleapis.com/sample-bucket/artwork/sample-content-001.jpg'
      }
    },

    metrics: {
      plays: 1250,
      downloads: 45,
      likes: 89,
      shares: 12,
      revenue: {
        total: 149.95,
        currency: 'USD',
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      },
      popularityScore: 75
    },

    flags: {
      featured: false,
      trending: true,
      explicit: false,
      copyrightClaimed: false,
      monetized: true,
      verified: true,
      qualityApproved: true
    },

    status: 'published',
    publishedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    uploadedBy: 'sample-user-001',
    version: 1
  };

  try {
    await db.collection('contentLibrary').doc('sample-content-001').set(sampleLibraryContent);
    console.log('✅ Sample library content created');
  } catch (error) {
    console.error('❌ Error creating sample library content:', error.message);
  }

  console.log('');
}

async function setupFirestoreIndexes() {
  console.log('📑 Note: Firestore indexes should be deployed separately using:');
  console.log('   firebase deploy --only firestore:indexes');
  console.log('');
}

async function validateConfiguration() {
  console.log('🔍 Validating configuration...');

  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    process.exit(1);
  }

  const optionalVars = [
    'VIRUSTOTAL_API_KEY',
    'WIDEVINE_LICENSE_SERVER',
    'SLACK_WEBHOOK_URL'
  ];

  const missingOptionalVars = optionalVars.filter(varName => !process.env[varName]);

  if (missingOptionalVars.length > 0) {
    console.log('⚠️  Optional environment variables not set:');
    missingOptionalVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('   These can be configured later for full functionality.');
  }

  console.log('✅ Configuration validation completed');
  console.log('');
}

async function generateSetupReport() {
  console.log('📊 Setup Report');
  console.log('================');
  console.log(`Project ID: ${CONFIG.projectId}`);
  console.log(`Collections created: ${CONFIG.collections.length}`);
  console.log(`Sample data: ${CONFIG.sampleData ? 'Included' : 'Skipped'}`);
  console.log('');

  console.log('🎉 Content Ingestion System initialization completed!');
  console.log('');
  console.log('Next Steps:');
  console.log('1. Deploy Firestore indexes: firebase deploy --only firestore:indexes');
  console.log('2. Deploy Firestore rules: firebase deploy --only firestore:rules');
  console.log('3. Deploy Netlify Functions: netlify deploy --prod');
  console.log('4. Configure environment variables in Netlify Dashboard');
  console.log('5. Test the upload workflow');
  console.log('');
  console.log('For detailed deployment instructions, see docs/deployment-guide.md');
}

// Main execution
async function main() {
  try {
    await validateConfiguration();
    await initializeDatabase();
    await initializeStorageBuckets();
    await setupDRMKeys();
    await createSampleData();
    await setupFirestoreIndexes();
    await generateSetupReport();
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    console.error('');
    console.error('Please check your configuration and try again.');
    console.error('For help, see docs/deployment-guide.md');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  initializeDatabase,
  initializeStorageBuckets,
  setupDRMKeys,
  createSampleData
};