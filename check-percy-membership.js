// Quick script to check Percy's membership status
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

const db = admin.firestore();

async function checkMembership() {
  try {
    // Find Percy's user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', 'percyricemusic@gmail.com')
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.log('❌ User not found: percyricemusic@gmail.com');
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('✅ Found user:', userDoc.id);
    console.log('\n📋 Membership Fields:');
    console.log('  artistMembershipActive:', userData.artistMembershipActive);
    console.log('  artistStripeSubscriptionId:', userData.artistStripeSubscriptionId);
    console.log('  artistSubscriptionStatus:', userData.artistSubscriptionStatus);
    console.log('  artistMembershipExpiresAt:', userData.artistMembershipExpiresAt?.toDate());
    console.log('\n📋 Legacy Fields:');
    console.log('  membershipExpiresAt:', userData.membershipExpiresAt?.toDate());
    console.log('  stripeSubscriptionId:', userData.stripeSubscriptionId);
    console.log('  subscriptionStatus:', userData.subscriptionStatus);
    console.log('  stripeCustomerId:', userData.stripeCustomerId);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkMembership().then(() => process.exit(0));
