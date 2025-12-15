# Stripe Artist Membership Testing Guide

## Overview
This guide explains how to test the $25/year artist membership Stripe integration.

## Test Mode Configuration ✅
Your Stripe keys are configured in **TEST MODE** (pk_test_...). This means:
- No real charges will be made
- Use Stripe test card numbers
- Webhooks need special setup for local testing

---

## Method 1: Testing Locally with Stripe CLI (Recommended for Development)

### Step 1: Install Stripe CLI
```bash
# Download from https://stripe.com/docs/stripe-cli
# Or use package manager:
# Windows (with Scoop): scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe
```

### Step 2: Login to Stripe
```bash
stripe login
```
This will open your browser to authenticate.

### Step 3: Start Local Dev Server
```bash
npm start
# App runs on http://localhost:3000
```

### Step 4: Start Netlify Functions Locally
```bash
netlify dev
# Functions run on http://localhost:8888/.netlify/functions/
```

### Step 5: Forward Webhooks to Local Functions
In a new terminal:
```bash
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

This will output a webhook signing secret like:
```
whsec_xxxxxxxxxxxxxxxxxxxxx
```

### Step 6: Update .env with Local Webhook Secret
Add to your `.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

### Step 7: Test the Purchase Flow

1. Navigate to: http://localhost:3000/artist-pricing
2. Click "Join Now - $25/Year"
3. Use a Stripe test card:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **Requires Auth**: `4000 0025 0000 3155`
   - Any future expiry date (e.g., 12/34)
   - Any 3-digit CVC (e.g., 123)
   - Any 5-digit ZIP (e.g., 12345)

4. Watch the Stripe CLI terminal for webhook events:
   ```
   checkout.session.completed
   customer.subscription.created
   ```

5. Check Firebase users collection - should see:
   - `artistMembershipActive: true`
   - `membershipExpiresAt: [timestamp 1 year from now]`
   - `stripeSubscriptionId: sub_xxxxx`

---

## Method 2: Testing on Deployed Netlify Site (Production-like Testing)

### Step 1: Deploy to Netlify
```bash
# Make sure all env variables are set in Netlify dashboard
netlify deploy --prod
```

### Step 2: Configure Stripe Webhook Endpoint

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Enter your endpoint URL:
   ```
   https://YOUR-SITE.netlify.app/.netlify/functions/stripe-webhook
   ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_`)

### Step 3: Add Webhook Secret to Netlify

1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add variable:
   - **Key**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: `whsec_xxxxxxxxxxxxxxxxxxxxx`
3. Redeploy site to apply new env var

### Step 4: Test the Full Flow

1. Visit: https://YOUR-SITE.netlify.app/artist-pricing
2. Sign in with Google
3. Click "Join Now - $25/Year"
4. Use test card: `4242 4242 4242 4242`
5. Complete checkout
6. Should redirect to: `/for-artists?membership=active`
7. Verify membership status shows "Active"

### Step 5: Verify in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/subscriptions
2. You should see the new subscription
3. Customer should be created
4. Check webhook logs for successful delivery

---

## Debugging Tips

### Issue: Payment succeeds but membership not activated

**Check:**
1. Netlify Functions logs: `netlify logs:functions`
2. Stripe webhook logs: https://dashboard.stripe.com/test/webhooks
3. Firebase console → users collection
4. Look for error messages in webhook delivery

**Common causes:**
- Webhook secret mismatch
- Firebase Admin not initialized correctly
- Missing environment variables in Netlify

### Issue: Checkout session doesn't create

**Check:**
1. Browser console for errors
2. Network tab → check `/.netlify/functions/create-checkout` response
3. Verify `STRIPE_SECRET_KEY` is set in Netlify env vars

### Issue: Webhook signature verification failed

**Fix:**
- Make sure `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint
- For local testing, use the secret from `stripe listen` output
- For deployed site, use the secret from Stripe Dashboard webhook settings

---

## Test Card Numbers

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Success (default) |
| 4000 0000 0000 0002 | Declined |
| 4000 0025 0000 3155 | Requires 3D Secure auth |
| 4000 0000 0000 9995 | Insufficient funds |

More test cards: https://stripe.com/docs/testing#cards

---

## What Should Happen on Successful Purchase

1. **Checkout Session Completed**
   - User is charged $25
   - Stripe creates a subscription
   - Redirect to success URL

2. **Webhook Fires**
   - `checkout.session.completed` event sent to your webhook
   - Webhook handler updates Firebase:
     ```javascript
     {
       artistMembershipActive: true,
       membershipExpiresAt: Timestamp (1 year from now),
       stripeSubscriptionId: "sub_xxxxx",
       stripeCustomerId: "cus_xxxxx"
     }
     ```

3. **User Can Upload**
   - Visit `/for-artists`
   - Should see "Membership Status: Active"
   - Can upload unlimited tracks

4. **Subscription Renewal**
   - After 1 year, Stripe auto-charges $25
   - Webhook updates `membershipExpiresAt` to new date
   - Membership continues

---

## Quick Local Test Command

```bash
# Terminal 1: Start dev server
npm start

# Terminal 2: Start Netlify functions
netlify dev

# Terminal 3: Forward webhooks
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook

# Update .env with webhook secret from Terminal 3
# Then test at http://localhost:3000/artist-pricing
```

---

## Verify Webhook is Working

After a test purchase, check:

1. **Stripe CLI output** (if testing locally):
   ```
   [200] POST /stripe-webhook [evt_xxxxx]
   ```

2. **Netlify Functions log**:
   ```bash
   netlify logs:functions
   ```
   Should see:
   ```
   Checkout session completed: cs_test_xxxxx
   Processing artist membership subscription for user xxx
   ✅ Artist membership activated for user xxx
   ```

3. **Firebase Console**:
   - Go to Firestore → users → [your user ID]
   - Should have membership fields

---

## Next Steps After Testing

1. ✅ Verify test purchase works
2. ✅ Check membership status updates
3. ✅ Test upload with active membership
4. ✅ Test paywall without membership
5. 📝 Switch to live mode when ready (use pk_live_ and sk_live_ keys)

---

## Support

If you encounter issues:
1. Check Stripe Dashboard webhook logs
2. Check Netlify Functions logs
3. Check browser console
4. Verify all environment variables are set correctly
