const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

(async () => {
  const artistDoc = await db.collection('artists').doc('qOeXglBQj8NMyqk3XI1i9T6fIKK2').get();
  if (artistDoc.exists) {
    console.log('Artist profile exists:', JSON.stringify(artistDoc.data(), null, 2));
  } else {
    console.log('No artist profile found for Percy Rice');
  }
  process.exit(0);
})();
