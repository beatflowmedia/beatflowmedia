# Purchase & Download Flow - Complete Testing Guide

## Overview

The complete purchase-to-download flow involves:
1. User clicks **"Buy for $0.99"**
2. Redirects to Stripe Checkout
3. Completes payment
4. **Webhook receives event** and creates purchase record in Firestore
5. User redirected back to success page
6. Button changes to **"Download"** (compact) or **"Go to Downloads"** (full)
7. Clicking button takes user to **Downloads page** with license info
8. User can download from Downloads page anytime

---

## Prerequisites

### 1. Environment Variables Setup

Ensure `.env` file has:
```env
# Frontend (React)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# Backend (Netlify Functions)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Site URL
URL=http://localhost:8888
```

### 2. Stripe Webhook Configuration

**Option A: Local Testing with Stripe CLI**
```bash
# Install Stripe CLI (if not installed)
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local Netlify dev server
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook

# You'll get a webhook secret like: whsec_...
# Add it to your .env as STRIPE_WEBHOOK_SECRET
```

**Option B: Deployed Testing**
1. Deploy to Netlify: `netlify deploy --prod`
2. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
3. Click "Add endpoint"
4. Enter: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
5. Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
6. Copy webhook secret to Netlify environment variables

---

## Testing Steps

### Step 1: Verify Firestore Rules

Check that `purchases` collection has proper rules:
```javascript
match /purchases/{purchaseId} {
  allow create: if false; // Only webhook can create
  allow read: if request.auth != null &&
                 (resource.data.userId == request.auth.uid || isPlatformAdmin());
}
```

### Step 2: Start Local Development

```bash
# Terminal 1: Start React app
npm start

# Terminal 2: Start Netlify dev server (for functions)
netlify dev

# Terminal 3: Start Stripe CLI webhook forwarding
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

### Step 3: Perform Test Purchase

1. **Navigate to a song or artist page**
   - Example: `http://localhost:8888/artist/Beat%20Flow`

2. **Sign in with test account**
   - Use Google Sign-in or your test account

3. **Click purchase button**
   - Should show **[$0.99]** button
   - Click it

4. **Complete Stripe Checkout**
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date (e.g., `12/34`)
   - Any 3-digit CVC (e.g., `123`)
   - Any ZIP code (e.g., `12345`)
   - Click "Pay"

5. **Monitor Webhook Events**
   - Check Terminal 3 (Stripe CLI) for webhook events
   - Should see: `checkout.session.completed`
   - Should see: `✔ Received event: checkout.session.completed`

6. **Check Netlify Function Logs**
   - Terminal 2 should show:
   ```
   Checkout session completed: cs_test_...
   Purchase recorded for user [userId]: song [songId]
   ```

7. **Verify Firestore Database**
   - Open Firebase Console
   - Navigate to Firestore Database
   - Check `purchases` collection
   - Should have new document with:
   ```javascript
   {
     userId: "test-user-id",
     itemId: "song-id",
     itemType: "song",
     itemName: "Track 1",
     artistName: "Beat Flow",
     price: 0.99,
     status: "completed",
     stripeSessionId: "cs_test_...",
     purchasedAt: Timestamp,
     ...
   }
   ```

8. **Return to App**
   - Should redirect to `/purchase/success`
   - Should show success message
   - Wait 2-3 seconds for page to load purchase

9. **Verify Button State Changed**
   - Navigate back to artist/song page
   - Button should now show **"Download"** (compact) or **"Go to Downloads"** (full)
   - Color should be green

10. **Click Download Button**
    - Should redirect to `/downloads` page

11. **Verify Downloads Page**
    - Should show purchased song in table
    - Should show license ID (format: `LIC-XXXXXXXXXXXX`)
    - Should show purchase date
    - Should have **Download** button

12. **Download the Song**
    - Click **Download** button in table
    - Should trigger file download
    - Check your downloads folder for the file

---

## Debugging Common Issues

### Issue 1: Button Still Shows "Buy" After Purchase

**Symptoms:**
- Completed payment
- Webhook received event
- But button still shows [$0.99]

**Debug Steps:**
```javascript
// Check browser console for these logs:
[StripeService] Checking purchase for: { userId: "...", songId: "..." }
[StripeService] Purchase check result: { found: false, count: 0 }
```

**Causes:**
1. **Webhook didn't fire** - Check Stripe CLI or Dashboard webhook logs
2. **Wrong userId in purchase doc** - Check Firestore, compare userId in purchase vs auth
3. **Wrong itemId** - Compare songId in URL vs itemId in purchase doc
4. **Status not 'completed'** - Check purchase doc has `status: 'completed'`

**Fix:**
```bash
# Check webhook is running
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook

# Manually trigger test event
stripe trigger checkout.session.completed

# Check Firestore manually
# purchases collection > check userId matches current user
```

### Issue 2: Webhook Not Receiving Events

**Symptoms:**
- Payment completes
- No logs in Stripe CLI
- No purchase doc created

**Debug Steps:**
1. Check Stripe CLI is running: `stripe listen`
2. Check endpoint URL is correct
3. Check webhook secret matches `.env`

**Fix:**
```bash
# Restart webhook forwarding
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook

# Test with manual trigger
stripe trigger checkout.session.completed
```

### Issue 3: Purchase Created But Button Not Updating

**Symptoms:**
- Purchase doc exists in Firestore
- Button still shows "Buy"

**Debug Steps:**
1. Hard refresh page (Ctrl+Shift+R)
2. Check console for purchase check logs
3. Verify `status: 'completed'` in purchase doc

**Fix:**
```javascript
// In browser console, manually check:
import { stripeService } from './services/stripeService';
const userId = "your-user-id";
const songId = "song-id";
await stripeService.hasPurchasedSong(userId, songId);
// Should return true
```

### Issue 4: License ID Not Showing

**Symptoms:**
- Downloads page loads
- Table shows purchase
- License ID is blank or error

**Cause:**
- `purchasedAt` field is missing or invalid

**Fix:**
- Check purchase doc has `purchasedAt` Timestamp field
- If missing, webhook might not have set it properly

---

## Expected Data Flow

```
User Action → Stripe Checkout → Payment Success
                                      ↓
                              Stripe Webhook Event
                                      ↓
                          Netlify Function: stripe-webhook.js
                                      ↓
                              handleCheckoutSessionCompleted()
                                      ↓
                          Create document in Firestore:
                          - collection: purchases
                          - fields: userId, itemId, itemType, status, etc.
                                      ↓
                          Update user document:
                          - Add to purchasedItems array
                                      ↓
                              User Redirected to /purchase/success
                                      ↓
                          PurchaseButton checks purchases collection
                                      ↓
                          Button shows "Download" or "Go to Downloads"
                                      ↓
                          User clicks → Navigates to /downloads
                                      ↓
                          Downloads page queries purchases collection
                                      ↓
                          Shows table with:
                          - Song/Album info
                          - License ID
                          - Download button
                                      ↓
                          User clicks Download → File downloads
```

---

## Manual Database Verification

### Check Purchase Document
```javascript
// Firestore Console
// Navigate to: purchases collection

// Expected document structure:
{
  artistName: "Beat Flow"
  customerEmail: "test@example.com"
  currency: "usd"
  itemId: "abc123" // Song ID
  itemName: "Track 1"
  itemType: "song"
  metadata: {
    albumId: null
    itemType: "song"
    songId: "abc123"
    userId: "xyz789"
  }
  price: 0.99
  purchasedAt: Timestamp (January 11, 2025 at 1:23:45 PM)
  status: "completed" // MUST be "completed"
  stripePaymentIntent: "pi_..."
  stripeSessionId: "cs_test_..."
  userId: "xyz789" // MUST match current user's auth UID
}
```

### Verify User Can Read Purchase
```javascript
// Firestore Rules Simulator
// Collection: purchases
// Document: [any purchase doc]
// Auth: Your test user's UID

// Test read operation - should succeed
```

---

## Test Card Numbers

| Card Number | Description |
|------------|-------------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Card declined |
| 4000 0025 0000 3155 | Requires 3D Secure |
| 4000 0000 0000 9995 | Insufficient funds |

---

## Success Criteria Checklist

- [ ] Purchase button shows correct price
- [ ] Clicking button redirects to Stripe Checkout
- [ ] Payment completes successfully
- [ ] Webhook receives `checkout.session.completed` event
- [ ] Netlify function logs show "Purchase recorded"
- [ ] Firestore `purchases` collection has new document
- [ ] Purchase document has `status: 'completed'`
- [ ] Purchase document has correct `userId` and `itemId`
- [ ] User redirected to `/purchase/success` page
- [ ] Success page shows purchase details
- [ ] Returning to song/artist page shows "Download" button
- [ ] Clicking "Download" navigates to `/downloads` page
- [ ] Downloads page shows purchase in table
- [ ] License ID is displayed and copyable
- [ ] Download button triggers file download
- [ ] File downloads successfully

---

## Production Deployment Checklist

Before going live:

- [ ] Switch to Stripe production keys
- [ ] Create production webhook endpoint
- [ ] Update webhook URL in Stripe Dashboard
- [ ] Test with production cards
- [ ] Verify webhook secret is correct
- [ ] Enable Stripe Radar for fraud detection
- [ ] Set up email notifications for purchases
- [ ] Configure tax collection if required
- [ ] Test refund flow (if needed)
- [ ] Document customer support process

---

## Support & Troubleshooting

**Stripe Dashboard:**
- Logs: https://dashboard.stripe.com/logs
- Webhooks: https://dashboard.stripe.com/webhooks
- Payments: https://dashboard.stripe.com/payments

**Firebase Console:**
- Firestore: https://console.firebase.google.com/project/[project]/firestore
- Authentication: https://console.firebase.google.com/project/[project]/authentication

**Netlify:**
- Functions Logs: https://app.netlify.com/sites/[site]/functions
- Environment Variables: https://app.netlify.com/sites/[site]/settings/deploys#environment

---

## Quick Test Command

```bash
# One-command test (with Stripe CLI)
stripe trigger checkout.session.completed \
  --add checkout_session:metadata[userId]=test-user-123 \
  --add checkout_session:metadata[itemId]=song-456 \
  --add checkout_session:metadata[itemType]=song
```

This simulates a successful payment without going through the UI.
