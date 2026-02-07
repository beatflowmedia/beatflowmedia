// netlify/functions/migrate-license-ids.js
// Netlify function to migrate existing purchases to have unique license IDs

const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('🔄 Starting license ID migration...');

    // Get all purchases without a license ID
    const purchasesSnapshot = await db.collection('purchases').get();

    console.log(`📊 Found ${purchasesSnapshot.size} total purchases`);

    let updatedCount = 0;
    let skippedCount = 0;
    const updates = [];

    // Process each purchase
    for (const purchaseDoc of purchasesSnapshot.docs) {
      const purchaseData = purchaseDoc.data();

      // Skip if already has a license ID
      if (purchaseData.licenseId) {
        console.log(`⏭️  Skipping ${purchaseDoc.id} - already has license ID`);
        skippedCount++;
        continue;
      }

      // Generate unique license ID
      const licenseId = `LIC-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

      // Update the purchase document
      await purchaseDoc.ref.update({
        licenseId: licenseId
      });

      console.log(`✅ Updated ${purchaseDoc.id} with license ID: ${licenseId}`);

      updates.push({
        purchaseId: purchaseDoc.id,
        itemName: purchaseData.itemName || 'Unknown',
        itemType: purchaseData.itemType || 'Unknown',
        licenseId: licenseId,
        userId: purchaseData.userId
      });

      updatedCount++;
    }

    // Also update download records
    const downloadsSnapshot = await db.collection('downloads').get();
    console.log(`📊 Found ${downloadsSnapshot.size} total download records`);

    let downloadUpdatedCount = 0;
    let downloadSkippedCount = 0;

    for (const downloadDoc of downloadsSnapshot.docs) {
      const downloadData = downloadDoc.data();

      // Skip if already has a license ID
      if (downloadData.licenseId) {
        console.log(`⏭️  Skipping download ${downloadDoc.id} - already has license ID`);
        downloadSkippedCount++;
        continue;
      }

      // Generate unique license ID
      const licenseId = `LIC-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

      // Update the download document
      await downloadDoc.ref.update({
        licenseId: licenseId
      });

      console.log(`✅ Updated download ${downloadDoc.id} with license ID: ${licenseId}`);
      downloadUpdatedCount++;
    }

    const summary = {
      success: true,
      purchases: {
        total: purchasesSnapshot.size,
        updated: updatedCount,
        skipped: skippedCount
      },
      downloads: {
        total: downloadsSnapshot.size,
        updated: downloadUpdatedCount,
        skipped: downloadSkippedCount
      },
      updates: updates
    };

    console.log('✅ Migration complete!', summary);

    return {
      statusCode: 200,
      body: JSON.stringify(summary, null, 2)
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      })
    };
  }
};
