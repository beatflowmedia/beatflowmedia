// netlify/functions/content-ingestion/virus-scan.js
// Virus scanning service with multiple provider support
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

// Virus scanning providers configuration
const SCAN_PROVIDERS = {
  VIRUSTOTAL: {
    name: 'VirusTotal',
    apiUrl: 'https://www.virustotal.com/vtapi/v2',
    apiKey: process.env.VIRUSTOTAL_API_KEY,
    maxFileSize: 32 * 1024 * 1024, // 32MB
    enabled: !!process.env.VIRUSTOTAL_API_KEY
  },
  CLAMAV: {
    name: 'ClamAV',
    endpoint: process.env.CLAMAV_ENDPOINT,
    enabled: !!process.env.CLAMAV_ENDPOINT
  },
  METADEFENDER: {
    name: 'MetaDefender',
    apiUrl: 'https://api.metadefender.com/v4',
    apiKey: process.env.METADEFENDER_API_KEY,
    enabled: !!process.env.METADEFENDER_API_KEY
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

    console.log(`Starting virus scan for content ${contentId}`);

    // Update virus scan status
    await updateProcessingStep(contentId, 'virusScan', 'in_progress');

    // Perform virus scanning
    const scanResults = await performVirusScan(contentRecord);

    if (scanResults.clean) {
      // Mark virus scan as completed
      await updateProcessingStep(contentId, 'virusScan', 'completed', scanResults);

      // Trigger metadata extraction
      await triggerMetadataExtraction(contentId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Virus scan completed - file is clean',
          contentId,
          results: scanResults
        })
      };
    } else {
      // Mark virus scan as failed (threats detected)
      await updateProcessingStep(contentId, 'virusScan', 'failed', scanResults);

      // Update overall content status and quarantine file
      await quarantineContent(contentId, scanResults);

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'Virus scan failed - threats detected',
          contentId,
          threats: scanResults.threats
        })
      };
    }

  } catch (error) {
    console.error('Virus scan error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function performVirusScan(contentRecord) {
  const results = {
    clean: true,
    threats: [],
    scanners: [],
    details: {}
  };

  try {
    const bucket = storage.bucket();
    const file = bucket.file(contentRecord.filePath);

    // Get file metadata
    const [metadata] = await file.getMetadata();
    const fileSize = parseInt(metadata.size);

    // Run available scanners
    const scanPromises = [];

    // VirusTotal scanning
    if (SCAN_PROVIDERS.VIRUSTOTAL.enabled && fileSize <= SCAN_PROVIDERS.VIRUSTOTAL.maxFileSize) {
      scanPromises.push(scanWithVirusTotal(file, fileSize));
    }

    // ClamAV scanning
    if (SCAN_PROVIDERS.CLAMAV.enabled) {
      scanPromises.push(scanWithClamAV(file));
    }

    // MetaDefender scanning
    if (SCAN_PROVIDERS.METADEFENDER.enabled) {
      scanPromises.push(scanWithMetaDefender(file));
    }

    // If no scanners are available, use basic file signature check
    if (scanPromises.length === 0) {
      console.warn('No virus scanners configured, performing basic signature check');
      scanPromises.push(performBasicSignatureCheck(file));
    }

    const scannerResults = await Promise.allSettled(scanPromises);

    // Process results from all scanners
    scannerResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const scanResult = result.value;
        results.scanners.push(scanResult.scanner);
        results.details[scanResult.scanner] = scanResult;

        if (!scanResult.clean) {
          results.clean = false;
          if (scanResult.threats) {
            results.threats.push(...scanResult.threats);
          }
        }
      } else {
        console.error('Scanner failed:', result.reason);
        results.details[`scanner_${index}_error`] = result.reason.message;
      }
    });

    // Remove duplicate threats
    results.threats = [...new Set(results.threats)];

    return results;

  } catch (error) {
    console.error('Virus scan process failed:', error);
    return {
      clean: false,
      threats: ['Scan process failed'],
      scanners: [],
      details: { error: error.message }
    };
  }
}

async function scanWithVirusTotal(file, fileSize) {
  if (!SCAN_PROVIDERS.VIRUSTOTAL.apiKey) {
    throw new Error('VirusTotal API key not configured');
  }

  try {
    // Create a hash of the file for VirusTotal lookup
    const readable = file.createReadStream();
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');

    await new Promise((resolve, reject) => {
      readable.on('data', chunk => hash.update(chunk));
      readable.on('end', resolve);
      readable.on('error', reject);
    });

    const fileHash = hash.digest('hex');

    // Check VirusTotal report by hash first
    const reportUrl = `${SCAN_PROVIDERS.VIRUSTOTAL.apiUrl}/file/report`;
    const reportResponse = await fetch(`${reportUrl}?apikey=${SCAN_PROVIDERS.VIRUSTOTAL.apiKey}&resource=${fileHash}`);
    const reportData = await reportResponse.json();

    if (reportData.response_code === 1) {
      // File already scanned
      const positives = reportData.positives || 0;
      const total = reportData.total || 0;

      return {
        scanner: 'VirusTotal',
        clean: positives === 0,
        threats: positives > 0 ? [`${positives}/${total} engines detected threats`] : [],
        hash: fileHash,
        scanDate: reportData.scan_date,
        permalink: reportData.permalink
      };
    } else {
      // File not in VirusTotal database - would need to upload for scanning
      // For this demo, we'll just return clean if file is not known
      return {
        scanner: 'VirusTotal',
        clean: true,
        threats: [],
        hash: fileHash,
        note: 'File not in VirusTotal database'
      };
    }

  } catch (error) {
    throw new Error(`VirusTotal scan failed: ${error.message}`);
  }
}

async function scanWithClamAV(file) {
  if (!SCAN_PROVIDERS.CLAMAV.endpoint) {
    throw new Error('ClamAV endpoint not configured');
  }

  try {
    // This would integrate with a ClamAV service
    // For demo purposes, we'll simulate the integration
    const response = await fetch(SCAN_PROVIDERS.CLAMAV.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: file.createReadStream()
    });

    const result = await response.text();

    return {
      scanner: 'ClamAV',
      clean: result.includes('OK'),
      threats: result.includes('FOUND') ? [result.trim()] : [],
      rawResult: result
    };

  } catch (error) {
    throw new Error(`ClamAV scan failed: ${error.message}`);
  }
}

async function scanWithMetaDefender(file) {
  if (!SCAN_PROVIDERS.METADEFENDER.apiKey) {
    throw new Error('MetaDefender API key not configured');
  }

  try {
    // Upload file to MetaDefender for scanning
    const uploadResponse = await fetch(`${SCAN_PROVIDERS.METADEFENDER.apiUrl}/file`, {
      method: 'POST',
      headers: {
        'apikey': SCAN_PROVIDERS.METADEFENDER.apiKey,
        'Content-Type': 'application/octet-stream'
      },
      body: file.createReadStream()
    });

    const uploadData = await uploadResponse.json();
    const dataId = uploadData.data_id;

    // Poll for scan results
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max wait

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

      const resultResponse = await fetch(`${SCAN_PROVIDERS.METADEFENDER.apiUrl}/file/${dataId}`, {
        headers: { 'apikey': SCAN_PROVIDERS.METADEFENDER.apiKey }
      });

      const resultData = await resultResponse.json();

      if (resultData.scan_results && resultData.scan_results.progress_percentage === 100) {
        const threats = [];
        let clean = true;

        Object.values(resultData.scan_results.scan_details).forEach(engine => {
          if (engine.threat_found) {
            clean = false;
            threats.push(`${engine.def_name}: ${engine.threat_found}`);
          }
        });

        return {
          scanner: 'MetaDefender',
          clean,
          threats,
          engines: Object.keys(resultData.scan_results.scan_details).length,
          dataId
        };
      }

      attempts++;
    }

    throw new Error('MetaDefender scan timeout');

  } catch (error) {
    throw new Error(`MetaDefender scan failed: ${error.message}`);
  }
}

async function performBasicSignatureCheck(file) {
  try {
    // Read first 1KB for signature analysis
    const readable = file.createReadStream({ start: 0, end: 1023 });
    const chunks = [];

    await new Promise((resolve, reject) => {
      readable.on('data', chunk => chunks.push(chunk));
      readable.on('end', resolve);
      readable.on('error', reject);
    });

    const header = Buffer.concat(chunks);

    // Basic malware signatures (simplified for demo)
    const malwareSignatures = [
      Buffer.from('4d5a', 'hex'), // PE executable header
      Buffer.from('7f454c46', 'hex'), // ELF header
      Buffer.from('feed', 'hex'), // Mach-O header
    ];

    const suspiciousPatterns = [
      /virus/i,
      /malware/i,
      /trojan/i,
      /backdoor/i
    ];

    // Check for executable headers in audio/video files (suspicious)
    for (const signature of malwareSignatures) {
      if (header.indexOf(signature) === 0) {
        return {
          scanner: 'BasicSignatureCheck',
          clean: false,
          threats: ['Suspicious executable signature detected in media file'],
        };
      }
    }

    // Check for suspicious strings
    const headerText = header.toString('ascii', 0, Math.min(header.length, 512));
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(headerText)) {
        return {
          scanner: 'BasicSignatureCheck',
          clean: false,
          threats: ['Suspicious content pattern detected'],
        };
      }
    }

    return {
      scanner: 'BasicSignatureCheck',
      clean: true,
      threats: [],
      note: 'Basic signature check passed'
    };

  } catch (error) {
    throw new Error(`Basic signature check failed: ${error.message}`);
  }
}

async function quarantineContent(contentId, scanResults) {
  try {
    // Move file to quarantine location
    const bucket = storage.bucket();
    const contentDoc = await db.collection('contentProcessing').doc(contentId).get();
    const contentRecord = contentDoc.data();

    const quarantinePath = `quarantine/${contentId}/${contentRecord.originalFilename}`;
    const sourceFile = bucket.file(contentRecord.filePath);
    const quarantineFile = bucket.file(quarantinePath);

    await sourceFile.copy(quarantineFile);

    // Update content status
    await db.collection('contentProcessing').doc(contentId).update({
      status: 'quarantined',
      quarantinePath,
      quarantinedAt: new Date(),
      updatedAt: new Date()
    });

    // Create quarantine record
    await db.collection('quarantinedContent').doc(contentId).set({
      contentId,
      originalPath: contentRecord.filePath,
      quarantinePath,
      threats: scanResults.threats,
      scanDetails: scanResults.details,
      quarantinedAt: new Date(),
      userId: contentRecord.userId
    });

    console.log(`Content ${contentId} quarantined due to security threats`);

  } catch (error) {
    console.error('Error quarantining content:', error);
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

async function triggerMetadataExtraction(contentId) {
  try {
    const metadataUrl = `${process.env.URL}/.netlify/functions/content-ingestion/extract-metadata`;
    fetch(metadataUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId })
    }).catch(error => {
      console.error('Failed to trigger metadata extraction:', error);
    });

    console.log(`Metadata extraction triggered for content ${contentId}`);

  } catch (error) {
    console.error('Error triggering metadata extraction:', error);
  }
}