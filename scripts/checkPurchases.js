/**
 * Check purchases for Percy Rice
 */
const admin = require('firebase-admin');

let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    serviceAccount = require('../serviceAccountKey.json');
  }
} catch (error) {
  console.error('❌ Could not load service account key');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

(async () => {
  try {
    console.log('\n🔍 Checking purchases for Percy Rice...\n');

    // Check all purchases
    const allPurchasesQuery = await db.collection('purchases').get();
    console.log(`Total purchases in database: ${allPurchasesQuery.size}\n`);

    // Try by artistName
    const purchasesByName = await db.collection('purchases')
      .where('artistName', '==', 'Percy Rice')
      .get();

    console.log(`Found ${purchasesByName.size} purchases by artistName "Percy Rice":\n`);
    purchasesByName.forEach(doc => {
      const data = doc.data();
      console.log(`  Purchase ID: ${doc.id}`);
      console.log(`  Item: ${data.itemName} (${data.itemType})`);
      console.log(`  Price: $${data.price}`);
      console.log(`  Artist Payout: $${data.artistPayout || 'N/A'}`);
      console.log(`  Artist Name: ${data.artistName}`);
      console.log(`  Artist ID: ${data.artistId || 'NOT SET'}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Payout Status: ${data.payoutStatus || 'N/A'}`);
      console.log('');
    });

    // Try by artist field variations
    const variations = ['percy rice', 'percyrice', 'Percy Rice'];
    for (const variant of variations) {
      const variantQuery = await db.collection('purchases')
        .where('artistName', '==', variant)
        .get();
      if (variantQuery.size > 0) {
        console.log(`Found ${variantQuery.size} purchases with artistName "${variant}"`);
      }
    }

    // Check user ID
    const userQuery = await db.collection('users')
      .where('email', '==', 'percyricemusic@gmail.com')
      .get();

    if (userQuery.size > 0) {
      const userId = userQuery.docs[0].id;
      console.log(`\nPercy Rice User ID: ${userId}\n`);

      const purchasesById = await db.collection('purchases')
        .where('artistId', '==', userId)
        .get();

      console.log(`Found ${purchasesById.size} purchases by artistId\n`);
    }

    // Group all purchases by artist
    console.log('\n📋 All purchases grouped by artist:\n');
    const byArtist = {};
    allPurchasesQuery.docs.forEach(doc => {
      const data = doc.data();
      const artist = data.artistName || 'Unknown';
      if (!byArtist[artist]) {
        byArtist[artist] = [];
      }
      byArtist[artist].push({
        item: data.itemName,
        price: data.price,
        type: data.itemType
      });
    });

    Object.keys(byArtist).sort().forEach(artist => {
      console.log(`${artist}: ${byArtist[artist].length} purchases`);
      const total = byArtist[artist].reduce((sum, p) => sum + (p.price || 0), 0);
      const artistPayout = total * 0.70;
      console.log(`  Total: $${total.toFixed(2)} | Artist payout (70%): $${artistPayout.toFixed(2)}`);
      byArtist[artist].forEach(p => {
        console.log(`    - ${p.item} (${p.type}) $${p.price}`);
      });
      console.log('');
    });

    console.log('✅ Done!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
})();
