// netlify/functions/create-connect-account.js
// Create Stripe Connect Express account for artists to receive payouts

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { userId, email, country = 'US' } = JSON.parse(event.body);

    if (!userId || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing userId or email' })
      };
    }

    console.log(`🎯 Creating Stripe Connect account for user: ${userId}`);

    // Check if user already has a Connect account
    const userDoc = await db.collection('users').doc(userId).get();
    let accountId = null;

    if (userDoc.exists) {
      const userData = userDoc.data();
      accountId = userData.stripeConnectAccountId;
    }

    // Create new Connect account if none exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express', // Express accounts are easiest for artists
        country: country,
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        business_type: 'individual',
        metadata: {
          userId: userId,
          platform: 'beatflowmedia'
        }
      });

      accountId = account.id;
      console.log(`✅ Created Stripe Connect account: ${accountId}`);

      // Save account ID to user document (create if doesn't exist)
      await db.collection('users').doc(userId).set({
        email: email,
        stripeConnectAccountId: accountId,
        stripeConnectCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        stripeConnectStatus: 'created'
      }, { merge: true });

      // Also update artistBalances with the Stripe account ID
      const balanceDoc = await db.collection('artistBalances').doc(userId).get();
      if (balanceDoc.exists) {
        await db.collection('artistBalances').doc(userId).update({
          stripeConnectAccountId: accountId
        });
      }
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.URL || 'https://beatflowmedia.com'}/artist-profile?stripe_refresh=true`,
      return_url: `${process.env.URL || 'https://beatflowmedia.com'}/artist-profile?stripe_connected=true`,
      type: 'account_onboarding'
    });

    console.log(`✅ Created account link: ${accountLink.url}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        accountId: accountId,
        onboardingUrl: accountLink.url
      })
    };

  } catch (error) {
    console.error('❌ Error creating Connect account:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
