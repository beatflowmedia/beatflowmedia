// netlify/functions/create-checkout.js
// Create Stripe checkout session for song/album purchases

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
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
        success_url: `${process.env.URL || 'http://localhost:8888'}/for-artists?membership=active`,
        cancel_url: `${process.env.URL || 'http://localhost:8888'}/purchase/cancelled`,
        customer_email: email || userEmail,
        metadata: {
          userId,
          itemType,
          itemId,
          membershipType: 'annual'
        }
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
    const session = await stripe.checkout.sessions.create(checkoutConfig);

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
    console.error('Error creating checkout session:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Failed to create checkout session'
      })
    };
  }
};
