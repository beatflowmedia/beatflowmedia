// Script to encode Firebase service account key to base64
// Usage: node scripts/encode-firebase-key.js path/to/serviceAccountKey.json

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node scripts/encode-firebase-key.js path/to/serviceAccountKey.json');
  console.log('\nThis will output the environment variables needed for Netlify:');
  console.log('- FIREBASE_PROJECT_ID');
  console.log('- FIREBASE_CLIENT_EMAIL');
  console.log('- FIREBASE_PRIVATE_KEY_BASE64');
  process.exit(1);
}

const keyPath = args[0];

if (!fs.existsSync(keyPath)) {
  console.error(`Error: File not found: ${keyPath}`);
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

  console.log('\n=== Add these to Netlify Environment Variables ===\n');

  console.log('FIREBASE_PROJECT_ID');
  console.log(serviceAccount.project_id);
  console.log('');

  console.log('FIREBASE_CLIENT_EMAIL');
  console.log(serviceAccount.client_email);
  console.log('');

  console.log('FIREBASE_PRIVATE_KEY_BASE64');
  const privateKeyBase64 = Buffer.from(serviceAccount.private_key).toString('base64');
  console.log(privateKeyBase64);
  console.log('');

  console.log('=== Update webhook.js to decode the base64 key ===\n');
  console.log('In netlify/functions/webhook.js, update the initialization to:');
  console.log(`
const privateKey = process.env.FIREBASE_PRIVATE_KEY_BASE64
  ? Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf8')
  : process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey
  })
});
  `);

  console.log('\n=== Done! ===\n');

} catch (error) {
  console.error('Error reading or parsing service account key:', error.message);
  process.exit(1);
}
