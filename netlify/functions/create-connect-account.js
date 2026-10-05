// netlify/functions/create-connect-account.js
// Create Stripe Connect Express account for artists to receive payouts

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');
const { requireSelf } = require('./lib/require-auth');

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
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (err) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Malformed request body.' })
      };
    }

    const { userId, email: claimedEmail, country = 'US' } = body;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing userId' })
      };
    }

    const auth = await requireSelf(event, userId);
    if (!auth.ok) return auth.response;

    // The body's `email` is a claim; the token's is verified. This account receives
    // payouts, so the address it is opened against is not taken from the request when
    // a verified one is available -- otherwise a caller could open a Connect account
    // under someone else's user id against an address they control.
    //
    // The exception is an admin acting for another account: the admin's own address
    // is verified but wrong for the artist's account, so the body is used there.
    const email = auth.actingAsAdmin ? claimedEmail : (auth.email || claimedEmail);

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing email' })
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
      refresh_url: `${process.env.URL || 'https://beatflowmediagroup.com'}/artist-profile?stripe_refresh=true`,
      return_url: `${process.env.URL || 'https://beatflowmediagroup.com'}/artist-profile?stripe_connected=true`,
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
