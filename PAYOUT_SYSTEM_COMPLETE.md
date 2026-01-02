# BeatFlow Media - Manual Payout System (Option 2)

## Overview

**Model**: Platform collects all payments, artists request payouts when ready
- **Revenue Flow**: Buyer → BeatFlow Media → Artist (on request)
- **Split**: 70% to artist, 30% to platform
- **Minimum Payout**: $10.00
- **Payout Speed**: 2 business days after request

## How It Works

### 1. Purchase Made
```
Customer buys song ($1.99) → Stripe charges card → BeatFlow receives $1.99
```

### 2. Revenue Allocated
```
Webhook processes purchase:
- Records in `purchases` collection
- Calculates split: $1.39 (artist) + $0.60 (platform)
- Adds $1.39 to artist's available balance
- Stores in `revenueAllocations` (status: pending)
```

### 3. Artist Views Balance
```
Artist dashboard shows:
- Available Balance: $1.39
- Total Earnings: $1.39
- Total Paid Out: $0.00
- Status: "Minimum payout is $10.00"
```

### 4. Artist Requests Payout
```
Once balance ≥ $10.00:
- Artist clicks "Request Payout" button
- System creates Stripe transfer
- Deducts from available balance
- Records in `payoutRequests` collection
- Updates `revenueAllocations` (status: paid)
```

### 5. Money Transferred
```
Stripe processes transfer:
- Funds leave BeatFlow account
- Arrive in artist's Stripe Connect account (instantly)
- Artist receives in bank account (2 business days)
```

## Firestore Collections

### `artistBalances/{artistId}`
Tracks each artist's current financial status
```json
{
  "artistId": "user123",
  "availableBalance": 45.50,        // Can be withdrawn
  "totalEarnings": 145.50,          // All-time earnings
  "totalPaidOut": 100.00,           // Already transferred
  "pendingAllocations": 12,         // Number of pending sales
  "completedPayouts": 3,            // Number of payouts made
  "lastEarningAt": Timestamp,
  "lastPayoutAt": Timestamp,
  "stripeConnectAccountId": "acct_..."
}
```

### `revenueAllocations/{allocationId}`
Individual sales awaiting payout
```json
{
  "purchaseId": "purchase123",
  "artistId": "user123",
  "itemId": "song456",
  "itemType": "song",
  "totalAmount": 1.99,
  "artistAmount": 1.39,
  "platformAmount": 0.60,
  "artistShare": 70,
  "status": "pending",              // pending | paid
  "allocatedAt": Timestamp,
  "paidAt": Timestamp               // Set when payout made
}
```

### `payoutRequests/{requestId}`
History of all payout transfers
```json
{
  "artistId": "user123",
  "stripeTransferId": "tr_...",
  "stripeConnectAccountId": "acct_...",
  "amount": 45.50,
  "status": "completed",
  "requestedAt": Timestamp,
  "completedAt": Timestamp
}
```

## API Endpoints

### 1. Create Connect Account
```bash
POST /.netlify/functions/create-connect-account
Body: {
  "userId": "user123",
  "email": "artist@example.com",
  "country": "US"
}
Response: {
  "accountId": "acct_...",
  "onboardingUrl": "https://connect.stripe.com/..."
}
```

### 2. Request Payout
```bash
POST /.netlify/functions/request-payout
Body: {
  "artistId": "user123",
  "requestedAmount": 45.50  // Optional, defaults to full balance
}
Response: {
  "success": true,
  "payoutId": "doc123",
  "transferId": "tr_...",
  "amount": 45.50,
  "newBalance": 0.00,
  "expectedArrival": "2 business days"
}
```

### 3. Process Revenue Split (Auto-triggered by webhook)
```bash
POST /.netlify/functions/process-revenue-split
Body: {
  "purchaseId": "purchase123",
  "userId": "buyer456",
  "itemId": "song789",
  "itemType": "song",
  "amount": 1.99
}
Response: {
  "success": true,
  "artistAmount": 1.39,
  "platformAmount": 0.60,
  "status": "allocated"
}
```

## Artist Dashboard UI

The `StripeConnectOnboarding` component shows:

### Not Connected
```
┌─────────────────────────────────────┐
│ ⚠ Connect Stripe to Receive Payouts│
│                                      │
│ You'll earn 70% of every sale.      │
│ [Connect Stripe Account]             │
└─────────────────────────────────────┘
```

### Connected - Insufficient Balance
```
┌─────────────────────────────────────┐
│ ✓ Stripe Connected                  │
│                                      │
│ Available: $5.50  Total: $5.50      │
│ Paid Out: $0.00                     │
│                                      │
│ ⓘ Minimum payout is $10.00          │
└─────────────────────────────────────┘
```

### Connected - Ready for Payout
```
┌─────────────────────────────────────┐
│ ✓ Stripe Connected                  │
│                                      │
│ Available: $45.50  Total: $145.50   │
│ Paid Out: $100.00                   │
│                                      │
│ ✓ Ready to withdraw                 │
│ $45.50 available [Request Payout]   │
└─────────────────────────────────────┘
```

### After Payout Requested
```
┌─────────────────────────────────────┐
│ ✓ Payout initiated successfully!    │
│ $45.50 will arrive within 2 days    │
│                                      │
│ Available: $0.00  Total: $145.50    │
│ Paid Out: $145.50                   │
└─────────────────────────────────────┘
```

## Setup Checklist

- [ ] Enable Stripe Connect (Platform Model - Option 2)
- [ ] Deploy Netlify functions:
  - `process-revenue-split.js`
  - `create-connect-account.js`
  - `request-payout.js`
- [ ] Update `stripe-webhook.js` to call revenue split
- [ ] Deploy Firestore rules
- [ ] Add `StripeConnectOnboarding` component to artist dashboard
- [ ] Test with Stripe test mode
- [ ] Configure webhook endpoint in Stripe dashboard
- [ ] Set environment variables

## Testing Flow

### 1. Artist Onboarding
```bash
1. Artist signs in
2. Goes to artist portal
3. Clicks "Connect Stripe Account"
4. Completes Stripe Express onboarding
5. Returns with connected account
```

### 2. Make Test Purchase
```bash
1. Customer buys song with test card: 4242 4242 4242 4242
2. Webhook processes payment
3. Revenue split allocates $1.39 to artist balance
4. Artist sees updated balance in dashboard
```

### 3. Request Payout
```bash
1. Artist accumulates $10+ in balance
2. Clicks "Request Payout"
3. System creates Stripe transfer
4. Balance shows $0.00 available
5. Check Stripe dashboard for transfer
6. Funds arrive in 2 business days
```

## Advantages of This Model

✅ **Full Control**: You control when money moves
✅ **Global Support**: 118 countries vs 45
✅ **Easier Accounting**: All revenue through your account
✅ **No Liability**: Not responsible for seller debt
✅ **Better UX**: Artists request when they want to withdraw
✅ **Fraud Protection**: Can hold suspicious funds
✅ **Refund Control**: Easy to process refunds

## Monitoring & Admin

### View All Artist Balances
```javascript
// Firebase Console → artistBalances collection
// See all artists, their balances, and payout history
```

### View Pending Allocations
```javascript
// Firebase Console → revenueAllocations collection
// Filter by status: "pending" to see unpaid revenue
```

### View Payout History
```javascript
// Firebase Console → payoutRequests collection
// See all completed payouts and transfer IDs
```

### Track Failed Payouts
```javascript
// Firebase Console → failedPayouts collection
// See errors and retry if needed
```

## Important Notes

1. **Minimum Payout**: $10.00 prevents excessive transfer fees
2. **No Auto-Payouts**: Artists must manually request
3. **Balance Accumulates**: Sales add to balance until withdrawn
4. **Stripe Fees**: Already deducted from initial charge
5. **Platform Fee**: 30% stays in your account automatically
6. **2-Day Delay**: Standard Stripe transfer time to bank
7. **Tax Reporting**: Stripe handles 1099 forms for artists earning $600+

## Cost Structure

### Per Transaction
- Stripe fee: 2.9% + $0.30 (deducted from $1.99)
- Net received: ~$1.64
- Artist gets: 70% of $1.99 = $1.39
- Platform keeps: 30% of $1.99 = $0.60
- **Note**: Stripe fee comes from platform's 30%

### Per Payout
- Stripe transfer: FREE (included in Connect)
- No additional fees for payouts

## Support & Troubleshooting

### Artist can't connect Stripe
- Check if email is verified
- Ensure they complete full onboarding
- Check Stripe Dashboard for rejected accounts

### Payout fails
- Check `failedPayouts` collection for error
- Verify Stripe Connect account is active
- Ensure sufficient balance in platform account
- Check if artist's bank details are correct

### Balance doesn't update
- Check webhook logs in Netlify
- Verify `process-revenue-split` function ran
- Look for errors in Firebase Functions logs

## Next Steps

1. Deploy all functions to Netlify
2. Enable Stripe Connect in dashboard
3. Test full flow with test cards
4. Add component to artist portal
5. Monitor first few real transactions
6. Set up email notifications (optional)
