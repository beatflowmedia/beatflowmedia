# Stripe Product Configuration Guide
## BeatFlow Hybrid Model Implementation

**Created:** February 15, 2026
**Status:** Action Required - Must be completed before deployment

---

## Overview

This guide walks through setting up the new Stripe products for BeatFlow's Hybrid Licensing Model.

**New Pricing:**
- Student: $9.99/month
- Creator: $24.00/month ⬆️ (was $19.99)
- Pro: $49.00/month ⬆️ (was $39.99)
- Agency: $149.00/month ⬆️ (was $99.00)

---

## Step 1: Create New Stripe Products

### Login to Stripe Dashboard
1. Go to https://dashboard.stripe.com
2. Select your BeatFlow account
3. Navigate to **Products** → **Add Product**

### Create Each Product

#### Product 1: Student Plan
```
Product Name: BeatFlow Student
Description: Educational discount with commercial licensing for published content. Requires .edu email verification.

Pricing:
- Type: Recurring
- Price: $9.99 USD
- Billing Period: Monthly
- Usage Type: Licensed

Metadata (Important):
- license_type: time-bound
- tier: student
- features: commercial,social,podcast,published-perpetual
- requires_verification: true
```

#### Product 2: Creator Plan
```
Product Name: BeatFlow Creator
Description: For active content creators - unlimited downloads, published content stays licensed forever.

Pricing:
- Type: Recurring
- Price: $24.00 USD
- Billing Period: Monthly
- Usage Type: Licensed

Metadata:
- license_type: time-bound
- tier: creator
- features: commercial,social,podcast,published-perpetual,unlimited-downloads
- popular: true
```

#### Product 3: Pro Plan
```
Product Name: BeatFlow Pro
Description: Professional licensing with broadcast rights, film/TV, and client work.

Pricing:
- Type: Recurring
- Price: $49.00 USD
- Billing Period: Monthly
- Usage Type: Licensed

Metadata:
- license_type: time-bound
- tier: pro
- features: commercial,broadcast,film-tv,client-work,published-perpetual,priority-support
```

#### Product 4: Agency Plan
```
Product Name: BeatFlow Agency
Description: Team licensing for agencies - up to 3 seats, unlimited client projects.

Pricing:
- Type: Recurring
- Price: $149.00 USD
- Billing Period: Monthly
- Usage Type: Licensed

Metadata:
- license_type: time-bound
- tier: agency
- features: commercial,broadcast,team-seats-3,client-work,published-perpetual,priority-support
```

---

## Step 2: Copy Price IDs to .env

After creating each product, Stripe will generate a Price ID (format: `price_xxxxxxxxxxxxx`).

### Update Your .env File

```bash
# OLD PRICE IDs (DEPRECATED - DO NOT DELETE YET)
# REACT_APP_STRIPE_STUDENT_PRICE_ID_OLD=price_1RPG6sAEum2hO0KZGTDZIqOr
# REACT_APP_STRIPE_CREATOR_PRICE_ID_OLD=price_xxxxx
# REACT_APP_STRIPE_PRO_PRICE_ID_OLD=price_xxxxx
# REACT_APP_STRIPE_AGENCY_PRICE_ID_OLD=price_xxxxx

# NEW PRICE IDs (HYBRID MODEL - FEBRUARY 2026)
REACT_APP_STRIPE_STUDENT_PRICE_ID=price_NEW_STUDENT_ID_HERE
REACT_APP_STRIPE_CREATOR_PRICE_ID=price_NEW_CREATOR_ID_HERE
REACT_APP_STRIPE_PRO_PRICE_ID=price_NEW_PRO_ID_HERE
REACT_APP_STRIPE_AGENCY_PRICE_ID=price_NEW_AGENCY_ID_HERE

# Stripe API Keys (no changes needed)
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_existing_key
STRIPE_SECRET_KEY=your_existing_secret
```

### Verification Checklist
- [ ] Student Price ID copied correctly
- [ ] Creator Price ID copied correctly
- [ ] Pro Price ID copied correctly
- [ ] Agency Price ID copied correctly
- [ ] All prices show correct amounts ($9.99, $24, $49, $149)
- [ ] All set to "Monthly" billing
- [ ] Metadata fields populated

---

## Step 3: Configure Annual Billing (Optional but Recommended)

Create annual versions with discounts to improve cash flow and retention.

### Annual Pricing (17% discount = ~2 months free)

#### Annual Student
```
Price: $99.88/year ($8.32/month - 17% off)
Billing: Annual
Price ID: Save as REACT_APP_STRIPE_STUDENT_ANNUAL_PRICE_ID
```

#### Annual Creator
```
Price: $239.88/year ($19.99/month - 17% off)
Billing: Annual
Price ID: Save as REACT_APP_STRIPE_CREATOR_ANNUAL_PRICE_ID
```

#### Annual Pro
```
Price: $488.88/year ($40.74/month - 17% off)
Billing: Annual
Price ID: Save as REACT_APP_STRIPE_PRO_ANNUAL_PRICE_ID
```

#### Annual Agency
```
Price: $1,488/year ($124/month - 17% off)
Billing: Annual
Price ID: Save as REACT_APP_STRIPE_AGENCY_ANNUAL_PRICE_ID
```

---

## Step 4: Update Webhook Configuration

### Configure Webhooks to Track License Events

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Add endpoint: `https://beatflowmediagroup.com/.netlify/functions/stripe-webhook`
3. Select events to listen for:

**Critical Events:**
```
✓ customer.subscription.created
✓ customer.subscription.updated
✓ customer.subscription.deleted
✓ invoice.payment_succeeded
✓ invoice.payment_failed
✓ customer.subscription.trial_will_end (if you add trials later)
```

**Why These Matter:**
- `subscription.created` → Create license record in Firestore
- `subscription.updated` → Update license status (upgrade/downgrade)
- `subscription.deleted` → Mark licenses as "published-only" (time-bound)
- `payment_succeeded` → Extend license validity
- `payment_failed` → Send warning email before suspending

4. Copy the **Webhook Signing Secret** to `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

## Step 5: Test Checkout Flow

### Use Stripe Test Mode

1. Switch to **Test Mode** (toggle in Stripe Dashboard)
2. Create test products with same prices
3. Get test Price IDs

### Test Card Numbers
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184
```

### Test Scenarios
- [ ] Student checkout with .edu verification
- [ ] Creator plan checkout ($24/month)
- [ ] Upgrade from Creator to Pro
- [ ] Downgrade from Pro to Creator
- [ ] Cancellation flow
- [ ] Failed payment handling
- [ ] Annual billing checkout

---

## Step 6: Migration Strategy for Existing Users

### Grandfather Existing Subscriptions (60-Day Transition)

**Option A: Keep Old Pricing (Recommended for First 30 Days)**
```javascript
// In your Stripe webhook handler
if (subscription.created < new Date('2026-04-15')) {
  // Existing customer - keep old pricing
  // Don't force migration yet
  return keepExistingPriceId(subscription);
}
```

**Option B: Offer Upgrade Incentive**
Email existing users:
> "Lock in 20% off forever by upgrading to annual billing this month!"

Annual Creator at $239.88 = $19.99/month (same as old monthly price)

### Update Email Template
```
Subject: Important: BeatFlow Pricing Update

Hi [Name],

We're improving BeatFlow's licensing model to match industry standards (Epidemic Sound, Artlist).

What's Changing:
✓ Content you publish while subscribed = Licensed forever (same as before)
✗ New projects after cancellation = Require active subscription (NEW)

Your Options:
1. Keep your current plan at $19.99/month until [DATE]
2. Switch to annual billing: $239.88/year (20% off = $19.99/month)
3. Upgrade to the new model when ready

Published content stays licensed - no changes to your existing videos.

Questions? Reply to this email.

- BeatFlow Team
```

---

## Step 7: Update Stripe Customer Portal

Allow users to manage subscriptions themselves.

### Enable Customer Portal
1. **Settings** → **Billing** → **Customer Portal**
2. Enable features:
   - ✓ Subscription cancellation
   - ✓ Plan changes (upgrade/downgrade)
   - ✓ Invoice history
   - ✓ Payment method updates
   - ✗ Subscription pausing (disabled - licenses would be confusing)

3. Configure cancellation flow:
```
Cancellation Message:
"Your published content will stay licensed. You won't be able to use downloaded music in NEW projects after [CANCELLATION DATE]. You can reactivate anytime."

Cancellation Survey (Optional):
- Too expensive
- Not using it enough
- Switching to competitor
- Missing features
- Other: [text input]
```

---

## Step 8: Set Up Payment Retry Logic

### Handle Failed Payments Gracefully

**Stripe Smart Retries (Recommended):**
1. **Settings** → **Billing** → **Subscriptions and emails**
2. Enable **Smart Retries**
3. Configure schedule:
   - Day 1: Retry immediately
   - Day 3: Retry + send email
   - Day 5: Retry + send warning email
   - Day 7: Final retry + send "subscription ending" email
   - Day 10: Cancel subscription

**Email Templates:**
```
Day 3: "Payment Failed - Please Update"
Subject: Action needed: Update your payment method

Hi [Name],

Your payment of $[amount] failed. Please update your payment method to keep your BeatFlow subscription active.

Update Payment Method: [LINK]

Your published content will remain licensed, but you won't be able to license new projects if your subscription ends.

---

Day 7: "Final Notice - Subscription Ending Soon"
Subject: Final notice: Your BeatFlow subscription ends in 3 days

Hi [Name],

We couldn't process your payment. Your subscription will end on [DATE] if we don't receive payment.

What happens when your subscription ends:
✓ Published content stays licensed (safe)
✗ New projects cannot use downloaded music

Update Payment Method: [LINK]
```

---

## Step 9: Revenue Recognition & Accounting

### Set Up Proper Revenue Tracking

**Important for Financial Reporting:**

1. **Stripe Revenue Recognition** (if available in your plan)
   - Enables accrual accounting
   - Tracks deferred revenue for annual plans
   - Exports to QuickBooks/Xero

2. **Configure in Stripe:**
   - **Settings** → **Revenue Recognition**
   - Set recognition schedule: "Recognize over subscription period"
   - This spreads annual revenue across 12 months (GAAP compliant)

3. **Chart of Accounts Mapping:**
```
Subscription Revenue (Monthly): 4000
Subscription Revenue (Annual): 4001
Deferred Revenue (Annual): 2400
Artist Payouts: 5000
Stripe Fees: 5100
```

---

## Step 10: Monitoring & Analytics

### Set Up Dashboards

**Key Metrics to Track:**

1. **Stripe Dashboard** → **Analytics** → Create custom report:
```
Metrics:
- MRR (Monthly Recurring Revenue)
- MRR by plan (Student, Creator, Pro, Agency)
- Churn rate by plan
- New subscriptions vs. cancellations
- Failed payment rate
- Average subscription lifetime
```

2. **Create Webhook Event Monitor:**
```javascript
// In your Netlify function or Firebase function
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const event = req.body;

  // Log to analytics
  await analytics.track({
    event: event.type,
    properties: {
      customer: event.data.object.customer,
      amount: event.data.object.amount_total,
      plan: event.data.object.plan.id
    }
  });

  // Handle event...
});
```

3. **Set Up Alerts:**
   - Slack notification when MRR drops >5% day-over-day
   - Email alert when churn rate exceeds 7%
   - SMS alert when failed payments exceed 10% of attempts

---

## Step 11: Tax Configuration (Important!)

### Sales Tax / VAT Compliance

**Stripe Tax (Recommended):**
1. **Products** → **Tax Settings**
2. Enable **Stripe Tax**
3. Configure:
   - Product tax code: `txcd_10103001` (Digital products - SaaS)
   - Tax behavior: Inclusive or Exclusive (check your jurisdiction)
   - Enable automatic tax calculation

**Manual Tax Rates (If not using Stripe Tax):**
- US: No federal sales tax (most states exempt SaaS)
- EU: VAT required (15-27% depending on country)
- Canada: GST/HST (5-15%)
- Australia: GST (10%)

**Tax ID Collection:**
Enable tax ID collection for business customers (they may be exempt).

---

## Step 12: Fraud Prevention

### Radar Rules (Built into Stripe)

**Enable Stripe Radar:**
1. **Radar** → **Rules**
2. Recommended rules:

```
Block if:
- Card is from high-risk country AND purchase > $100
- More than 3 failed payments in 24 hours from same IP
- Email domain is disposable (mailinator, tempmail, etc.)
- Billing address doesn't match IP geolocation by >1000 miles

Review if:
- First purchase > $500
- Sudden upgrade from Student to Agency
- Payment method changed 3+ times in 30 days
```

3. **3D Secure (SCA Compliance):**
   - Automatically enabled for EU customers
   - Reduces fraud by 50%+
   - May reduce conversion by 2-5%

---

## Verification Checklist

Before going live, verify:

### Products
- [ ] All 4 products created (Student, Creator, Pro, Agency)
- [ ] Prices are correct ($9.99, $24, $49, $149)
- [ ] Metadata fields populated
- [ ] Annual versions created (optional)

### Environment Variables
- [ ] All Price IDs in .env
- [ ] Webhook secret in .env
- [ ] Publishable key working
- [ ] Secret key secure

### Webhooks
- [ ] Endpoint URL correct
- [ ] 6 critical events selected
- [ ] Webhook signing verified
- [ ] Test event sent successfully

### Customer Experience
- [ ] Test checkout completes
- [ ] Confirmation email sends
- [ ] Customer portal accessible
- [ ] Cancellation flow tested
- [ ] Failed payment emails work

### Compliance
- [ ] Tax configuration complete
- [ ] Terms of Service updated
- [ ] Privacy Policy updated
- [ ] License agreement clear
- [ ] GDPR compliance checked (if EU customers)

---

## Next Steps After Stripe Setup

1. **Update Frontend** → Ensure buttons use new Price IDs
2. **Test Integration** → Complete checkout in test mode
3. **Database Schema** → Set up license tracking (see FIRESTORE_SCHEMA.md)
4. **Email Users** → Announce changes (60-day notice)
5. **Go Live** → Switch to live mode

---

## Support Resources

**Stripe Documentation:**
- Products & Pricing: https://stripe.com/docs/billing/subscriptions/products-and-prices
- Webhooks: https://stripe.com/docs/webhooks
- Customer Portal: https://stripe.com/docs/billing/subscriptions/customer-portal
- Testing: https://stripe.com/docs/testing

**Need Help?**
- Stripe Support: https://support.stripe.com
- BeatFlow Dev Team: dev@beatflowmedia.com

---

**Status:** Ready to implement → Proceed to database schema design
