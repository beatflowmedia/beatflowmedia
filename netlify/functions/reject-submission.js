// netlify/functions/reject-submission.js
// Reject artist submission with feedback

const admin = require('firebase-admin');

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
    const { submissionId, feedback } = JSON.parse(event.body);

    if (!submissionId || !feedback) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing submissionId or feedback' })
      };
    }

    // Get the submission
    const submissionRef = db.collection('artistSubmissions').doc(submissionId);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Submission not found' })
      };
    }

    const submission = submissionDoc.data();

    // Update submission status to rejected
    await submissionRef.update({
      status: 'rejected',
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      rejectionFeedback: feedback
    });

    // TODO: Send email notification to artist with feedback
    // You can integrate with SendGrid, Mailgun, or another email service here
    console.log(`📧 TODO: Send rejection email to artist (userId: ${submission.uploadedBy})`);
    console.log(`Feedback: ${feedback}`);

    console.log(`❌ Submission ${submissionId} rejected`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Submission rejected'
      })
    };
  } catch (error) {
    console.error('Error rejecting submission:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Failed to reject submission'
      })
    };
  }
};
