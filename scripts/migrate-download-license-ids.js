// scripts/migrate-download-license-ids.js
// Migration script to add unique license IDs to existing download records

const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateDownloadLicenseIds() {
  try {
    console.log('🔄 Starting download license ID migration...\n');

    // Get all downloads
    const downloadsSnapshot = await db.collection('downloads').get();

    console.log(`📊 Found ${downloadsSnapshot.size} total download records\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each download
    for (const downloadDoc of downloadsSnapshot.docs) {
      const downloadData = downloadDoc.data();

      // Skip if already has a license ID
      if (downloadData.licenseId) {
        console.log(`⏭️  Skipping ${downloadDoc.id} - already has license ID: ${downloadData.licenseId}`);
        skippedCount++;
        continue;
      }

      try {
        // Generate unique license ID
        const licenseId = `LIC-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

        // Update the download document
        await downloadDoc.ref.update({
          licenseId: licenseId
        });

        console.log(`✅ Updated ${downloadDoc.id}`);
        console.log(`   Item: ${downloadData.itemName || 'Unknown'}`);
        console.log(`   Type: ${downloadData.itemType || 'Unknown'}`);
        console.log(`   License ID: ${licenseId}`);
        console.log(`   User: ${downloadData.userId}\n`);

        updatedCount++;
      } catch (error) {
        console.error(`❌ Error updating ${downloadDoc.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📈 Migration Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⏭️  Skipped (already had license ID): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total processed: ${downloadsSnapshot.size}`);
    console.log('='.repeat(50) + '\n');

    console.log('✅ Migration complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateDownloadLicenseIds();
