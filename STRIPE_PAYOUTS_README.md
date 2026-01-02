# BeatFlow Media - Stripe Payout System

## Overview

Automated revenue distribution system that splits payments between BeatFlow Media (30%) and artists (70%) using Stripe Connect.

## How It Works

1. **Customer purchases song/album** → Stripe checkout
2. **Webhook receives payment confirmation** → Records purchase in Firestore
3. **Revenue split triggered automatically** → Transfers 70% to artist's Stripe Connect account
4. **Artist receives payout** → Funds available in 2 business days

## Architecture

### Collections in Firestore

- **`purchases`** - All completed purchases
- **`artistEarnings`** - Aggregated earnings per artist
- **`revenueTransfers`** - Individual transfer records
- **`pendingPayouts`** - Payouts waiting for Stripe Connect setup
- **`failedTransfers`** - Failed transfer attempts for debugging

### Netlify Functions

1. **`stripe-webhook.js`** - Handles Stripe events
   - Records purchases
   - Triggers revenue split

2. **`process-revenue-split.js`** - Splits and transfers revenue
   - Calculates 70/30 split
   - Creates Stripe transfer
   - Records transfer in Firestore
   - Updates artist earnings

3. **`create-connect-account.js`** - Artist onboarding
   - Creates Stripe Connect Express account
   - Generates onboarding link

4. **`api/stripe/payouts.js`** - Fetch payout history
   - Retrieves balance
   - Lists payouts
   - Shows transaction ledger

## Setup Instructions

### 1. Enable Stripe Connect

1. Go to https://dashboard.stripe.com/settings/connect
2. Enable "Express" platform type
3. Configure branding and business information
4. Set platform fee to 30%

### 2. Set Environment Variables

In Netlify or your deployment platform:

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FIREBASE_PROJECT_ID=beatflowmedia
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
URL=https://beatflowmediagroup.com
```

### 3. Configure Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://beatflowmediagroup.com/.netlify/functions/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

### 4. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 5. Test the System

1. **Artist Onboarding**:
   - Artist signs in
   - Clicks "Connect Stripe Account"
   - Completes Stripe Express onboarding
   - Returns to platform with connected account

2. **Make a Test Purchase**:
   - Use Stripe test card: `4242 4242 4242 4242`
   - Complete checkout
   - Check webhook logs
   - Verify transfer in Stripe Dashboard

3. **Verify Earnings**:
   - Artist views earnings in dashboard
   - Check `artistEarnings` collection in Firestore
   - Verify funds in artist's Stripe Connect account

## Revenue Split Logic

### Default Split
- **Artist**: 70% ($1.39 on $1.99 song)
- **Platform**: 30% ($0.60 on $1.99 song)

### Custom Splits (Optional)

You can set custom revenue splits per song/album:

```javascript
// In song/album document
{
  revenueSplit: {
    artistPercent: 0.80, // 80% to artist
    platformPercent: 0.20 // 20% to platform
  }
}
```

## Artist Dashboard Integration

Add the `StripeConnectOnboarding` component to your artist portal:

```jsx
import StripeConnectOnboarding from '../components/StripeConnectOnboarding';

function ArtistPortal() {
  return (
    <div>
      <h2>Payouts</h2>
      <StripeConnectOnboarding />
    </div>
  );
}
```

## API Endpoints

### Create Connect Account
```
POST /.netlify/functions/create-connect-account
Body: { userId, email, country }
Response: { accountId, onboardingUrl }
```

### Process Revenue Split
```
POST /.netlify/functions/process-revenue-split
Body: { purchaseId, userId, itemId, itemType, amount }
Response: { transferId, artistAmount, platformAmount }
```

### Get Payout History
```
GET /.netlify/functions/api/stripe/payouts?stripeAccountId=acct_...
Response: { balance, payouts, ledger }
```

## Monitoring & Troubleshooting

### Check Webhook Logs
```bash
netlify functions:log stripe-webhook
```

### View Failed Transfers
Query the `failedTransfers` collection in Firebase Console to see any errors.

### Common Issues

1. **Artist hasn't connected Stripe**
   - Funds held in `pendingPayouts` collection
   - Artist shown warning in dashboard
   - Can be manually processed after connection

2. **Transfer failed**
   - Recorded in `failedTransfers`
   - Check error message
   - Can be retried manually

3. **Webhook not received**
   - Check Stripe webhook logs
   - Verify webhook secret is correct
   - Ensure endpoint is accessible

## Payout Timeline

- **Purchase completed** → Immediate
- **Transferred to artist** → Within 1 hour
- **Available in artist's bank** → 2 business days (Stripe standard)

## Security

- All transfers authenticated via Stripe
- Firestore rules prevent unauthorized access
- Artist can only view their own earnings
- Platform admins can view all transfers

## Support

For payout issues:
1. Check Firebase Console → `revenueTransfers`
2. Check Stripe Dashboard → Transfers
3. Review `failedTransfers` collection
4. Contact Stripe support if needed

## Testing

### Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

### Test Mode
Use test API keys (`sk_test_...`) for development:
- No real money transferred
- Full Stripe Connect functionality
- Can view in Stripe test dashboard

## Going Live

1. Switch to live API keys
2. Complete Stripe Connect activation form
3. Update webhook endpoint to production URL
4. Test with real payment
5. Monitor first few transactions closely

## Compliance

- **PCI Compliance**: Handled by Stripe
- **Tax Reporting**: Artists receive 1099 if earning > $600/year
- **KYC**: Stripe handles identity verification
- **Fraud Prevention**: Stripe Radar included

## Future Enhancements

- [ ] Bulk payout processing
- [ ] Custom payout schedules
- [ ] Multi-currency support
- [ ] Royalty calculations for collaborations
- [ ] Automated tax withholding
- [ ] Detailed earnings analytics
- [ ] CSV export of transactions
