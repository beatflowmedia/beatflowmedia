// netlify/functions/create-checkout.js
// Create Stripe checkout session for song/album purchases

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  console.log('🔔 create-checkout function invoked');
  console.log('Environment check:', {
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7)
  });

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('❌ Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('📦 Parsing request body...');
    const {
      userId,
      itemId,
      itemType, // 'song', 'album', or 'submission_credits'
      itemName,
      artistName,
      price, // in cents
      userEmail,
      email,
      credits,
      recurring,
      metadata
    } = JSON.parse(event.body);

    console.log('✅ Request data:', { userId, itemId, itemType, price, userEmail });

    // Validate required fields
    if (!userId || !itemId || !itemType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Determine pricing and mode based on item type
    let checkoutConfig;

    if (itemType === 'artist_membership') {
      // Annual artist membership - $25/year for unlimited uploads
      checkoutConfig = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'BeatFlow Artist Membership',
                description: 'Unlimited track uploads for 1 year',
                metadata: {
                  itemType,
                  userId
                }
              },
              unit_amount: price || 2500, // $25 in cents
              recurring: { interval: 'year' }
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.URL || 'http://localhost:8888'}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.URL || 'http://localhost:8888'}/purchase/cancelled`,
        customer_email: email || userEmail,
        metadata: {
          userId,
          itemType,
          itemId,
          membershipType: 'annual'
        }
      };
    } else if (itemType === 'playlist_submission') {
      // Curator playlist placement payment (escrow)
      checkoutConfig = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: itemName,
                description: artistName, // Track title
                metadata: {
                  itemType,
                  itemId,
                  userId,
                  paymentType: 'escrow'
                }
              },
              unit_amount: price, // Price in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        payment_intent_data: {
          capture_method: 'manual', // Hold funds in escrow
          metadata: {
            ...metadata,
            paymentType: 'escrow',
            itemType
          }
        },
        success_url: `${process.env.URL || 'http://localhost:8888'}/artist-profile?submission=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.URL || 'http://localhost:8888'}/artist-profile?submission=cancelled`,
        customer_email: userEmail,
        metadata: {
          userId,
          itemId,
          itemType,
          ...metadata
        },
        automatic_tax: { enabled: false }
      };
    } else {
      // Regular song/album purchase
      checkoutConfig = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: itemName,
                description: `${itemType === 'song' ? 'Song' : 'Album'} by ${artistName}`,
                metadata: {
                  itemType,
                  itemId,
                  userId
                }
              },
              unit_amount: price, // Price in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.URL || 'http://localhost:8888'}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.URL || 'http://localhost:8888'}/purchase/cancelled`,
        customer_email: userEmail,
        metadata: {
          userId,
          itemId,
          itemType,
          ...metadata
        },
        // Enable automatic tax collection if configured
        automatic_tax: { enabled: false }
      };
    }

    // Create the checkout session
    console.log('💳 Creating Stripe checkout session...');
    const session = await stripe.checkout.sessions.create(checkoutConfig);
    console.log('✅ Session created successfully:', session.id);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url
      })
    };
  } catch (error) {
    console.error('💥 Error creating checkout session:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode
    });
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: error.message || 'Failed to create checkout session',
        type: error.type,
        code: error.code
      })
    };
  }
};
