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
      itemType, // 'song', 'album', 'submission_credits', or 'studio_sample'
      itemName,
      artistName,
      price, // in cents (discounted price if subscriber)
      originalPrice, // Original price before subscriber discount
      priceId, // Stripe Price ID for fixed products
      userEmail,
      email,
      credits,
      recurring,
      metadata,
      sampleId,
      sampleTitle,
      licenseType
    } = JSON.parse(event.body);

    console.log('✅ Request data:', { userId, itemId, itemType, price, priceId, userEmail });

    // Validate required fields - allow priceId OR (userId + itemId + itemType)
    if (priceId) {
      // Using Stripe Price ID (for studio samples, subscriptions, etc.)
      console.log('Using Stripe Price ID:', priceId);
    } else if (!userId || !itemId || !itemType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Determine pricing and mode based on item type
    let checkoutConfig;

    if (priceId) {
      // Using fixed Stripe Price ID (for studio samples, products, etc.)
      checkoutConfig = {
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.URL || 'http://localhost:8888'}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.URL || 'http://localhost:8888'}/purchase/cancelled`,
        customer_email: userEmail || email,
        metadata: {
          userId: userId || 'guest',
          itemId: sampleId || itemId,
          itemType: 'studio_sample',
          sampleTitle: sampleTitle || itemName,
          licenseType: licenseType || 'personal',
          ...metadata
        },
        automatic_tax: { enabled: false }
      };
    } else if (itemType === 'artist_membership') {
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
      const hasDiscount = originalPrice && originalPrice > price;
      const description = hasDiscount
        ? `${itemType === 'song' ? 'Song' : 'Album'} by ${artistName} (Subscriber discount applied)`
        : `${itemType === 'song' ? 'Song' : 'Album'} by ${artistName}`;

      checkoutConfig = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: itemName,
                description,
                metadata: {
                  itemType,
                  itemId,
                  userId,
                  originalPrice: originalPrice?.toString() || price.toString(),
                  discountApplied: hasDiscount.toString()
                }
              },
              unit_amount: price, // Price in cents (discounted if subscriber)
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
          originalPrice: originalPrice?.toString() || price.toString(),
          discountedPrice: price.toString(),
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
