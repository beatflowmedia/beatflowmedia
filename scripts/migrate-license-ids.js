// scripts/migrate-license-ids.js
// Migration script to add unique license IDs to existing purchases

const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateLicenseIds() {
  try {
    console.log('🔄 Starting license ID migration...\n');

    // Get all purchases
    const purchasesSnapshot = await db.collection('purchases').get();

    console.log(`📊 Found ${purchasesSnapshot.size} total purchases\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each purchase
    for (const purchaseDoc of purchasesSnapshot.docs) {
      const purchaseData = purchaseDoc.data();

      // Skip if already has a license ID
      if (purchaseData.licenseId) {
        console.log(`⏭️  Skipping ${purchaseDoc.id} - already has license ID: ${purchaseData.licenseId}`);
        skippedCount++;
        continue;
      }

      try {
        // Generate unique license ID
        const licenseId = `LIC-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

        // Update the purchase document
        await purchaseDoc.ref.update({
          licenseId: licenseId
        });

        console.log(`✅ Updated ${purchaseDoc.id}`);
        console.log(`   Item: ${purchaseData.itemName || 'Unknown'}`);
        console.log(`   Type: ${purchaseData.itemType || 'Unknown'}`);
        console.log(`   License ID: ${licenseId}`);
        console.log(`   User: ${purchaseData.userId}\n`);

        updatedCount++;
      } catch (error) {
        console.error(`❌ Error updating ${purchaseDoc.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📈 Migration Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⏭️  Skipped (already had license ID): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total processed: ${purchasesSnapshot.size}`);
    console.log('='.repeat(50) + '\n');

    console.log('✅ Migration complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateLicenseIds();
