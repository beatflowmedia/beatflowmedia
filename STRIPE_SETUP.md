# Stripe Integration Setup Guide

This guide will help you set up Stripe payments for song and album purchases.

## Overview

The integration allows users to:
- Purchase individual songs for $0.99 (default)
- Purchase entire albums for $10.99 (default)
- Download purchased content
- Track purchase history

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Firebase project with Firestore enabled
3. Netlify account for hosting functions

## Step 1: Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)
4. Add these to your `.env` file:

```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
```

## Step 2: Install Dependencies

The following packages are already installed:
```bash
npm install stripe @stripe/stripe-js firebase-admin
```

## Step 3: Configure Stripe Webhook

### Create Webhook Endpoint

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter your webhook URL:
   ```
   https://your-domain.netlify.app/.netlify/functions/stripe-webhook
   ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

### Test Webhook Locally

Use Stripe CLI to test webhooks locally:
```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local endpoint
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook

# Trigger test events
stripe trigger checkout.session.completed
```

## Step 4: Deploy Netlify Functions

1. Ensure `netlify.toml` has functions directory configured:
```toml
[build]
  functions = "netlify/functions"
```

2. Deploy to Netlify:
```bash
netlify deploy --prod
```

3. Set environment variables in Netlify dashboard:
   - Go to Site settings > Environment variables
   - Add all Stripe and Firebase variables from `.env`

## Step 5: Configure Firestore Security Rules

The Firestore rules have been updated to include:
- `purchases` collection (read: user + admin, create: webhook only)
- `downloads` collection (user can track their downloads)
- `failed_payments` collection (admin only)

Deploy the rules:
```bash
firebase deploy --only firestore:rules
```

## Step 6: Update Price Defaults (Optional)

Default prices are set in `src/services/stripeService.js`:
```javascript
const DEFAULT_SONG_PRICE = 0.99;
const DEFAULT_ALBUM_PRICE = 10.99;
```

To set custom prices per song/album, add a `price` field to the Firestore document:
```javascript
{
  title: "Song Title",
  artist: "Artist Name",
  price: 1.99, // Custom price
  // ... other fields
}
```

## Step 7: Testing the Integration

### Test with Stripe Test Cards

Use these test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any ZIP code.

### Test Purchase Flow

1. Navigate to a song or album page
2. Click the "Buy for $X.XX" button
3. Complete checkout with test card
4. Verify redirect to success page
5. Check that purchase appears in Firestore:
   - Collection: `purchases`
   - Document should contain: userId, itemId, itemType, status: 'completed'
6. Try downloading the purchased item

## Step 8: Go Live

### Switch to Production Keys

1. Get production keys from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Update `.env` with production keys:
   ```env
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
   STRIPE_SECRET_KEY=sk_live_your_key
   ```
3. Update webhook endpoint with production URL
4. Update environment variables in Netlify

### Enable Payment Methods

1. Go to [Stripe Settings > Payment methods](https://dashboard.stripe.com/settings/payment_methods)
2. Enable desired payment methods:
   - Cards (Visa, Mastercard, Amex, etc.)
   - Apple Pay
   - Google Pay
   - Link

## File Structure

```
├── src/
│   ├── components/
│   │   └── PurchaseButton.js          # Purchase/Download button component
│   ├── pages/
│   │   ├── PurchaseSuccess.js         # Success page after purchase
│   │   ├── PurchaseCancelled.js       # Cancelled purchase page
│   │   ├── SongPage.js                # Song page with purchase button
│   │   └── Album.js                   # Album page with purchase button
│   └── services/
│       └── stripeService.js           # Stripe integration service
├── netlify/functions/
│   ├── create-checkout.js             # Create Stripe checkout session
│   └── stripe-webhook.js              # Handle Stripe webhook events
└── firestore.rules                    # Firestore security rules

```

## Features

### For Users
- Browse songs and albums
- Purchase songs ($0.99 default) or albums ($10.99 default)
- Secure checkout via Stripe
- Download purchased content
- View purchase history
- Access purchased content from any device

### For Admins
- Track all purchases in Firestore
- View failed payment attempts
- Monitor download activity
- Generate revenue reports

## Troubleshooting

### Webhook not receiving events
- Verify webhook URL is correct
- Check Stripe webhook logs in dashboard
- Ensure webhook secret is correct in environment variables
- Test locally with Stripe CLI

### Purchases not appearing
- Check Firestore security rules
- Verify webhook is processing `checkout.session.completed` event
- Check Netlify function logs for errors
- Ensure Firebase Admin SDK is properly initialized

### Download button not showing
- Verify purchase exists in Firestore `purchases` collection
- Check `stripeService.canDownloadSong()` logic
- Ensure user is authenticated
- Check browser console for errors

## Support

For issues:
1. Check Stripe Dashboard > Developers > Logs
2. Check Netlify function logs
3. Check browser console for errors
4. Review Firestore security rules

## Security Best Practices

1. **Never expose secret keys** - Keep `STRIPE_SECRET_KEY` server-side only
2. **Validate webhooks** - Always verify webhook signatures
3. **Use HTTPS** - Ensure all traffic is encrypted
4. **Implement rate limiting** - Prevent abuse of checkout endpoints
5. **Log transactions** - Keep audit trail of all purchases
6. **Handle errors gracefully** - Show user-friendly error messages

## Next Steps

- [ ] Set up Stripe Radar for fraud detection
- [ ] Configure tax collection if required
- [ ] Set up subscription plans for premium features
- [ ] Implement refund handling
- [ ] Add promotional codes/discounts
- [ ] Create admin dashboard for revenue analytics
