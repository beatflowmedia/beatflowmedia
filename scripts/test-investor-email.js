// Test script to trigger investor email
const admin = require('firebase-admin');
const serviceAccount = require('../beatflowmedia-firebase-adminsdk-f3ewj-f63a7fff20.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testInvestorEmail() {
  try {
    console.log('Creating test investor request...');
    
    const docRef = await db.collection('investorRequests').add({
      email: 'percyricemusic@gmail.com',
      consent: true,
      consentTs: admin.firestore.FieldValue.serverTimestamp(),
      testRequest: true
    });

    console.log('✅ Test investor request created:', docRef.id);
    console.log('Firebase Function should trigger and send email to percyricemusic@gmail.com');
    console.log('Check your email in a few moments!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test request:', error);
    process.exit(1);
  }
}

testInvestorEmail();
