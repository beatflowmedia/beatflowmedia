# Create Stripe Test Mode Products

## Problem
You're using test Stripe keys but live price IDs, causing checkout to fail:
```
No such price: 'price_1RPG6sAEum2hO0KZGTDZIqOr'
```

## Solution: Create Test Mode Versions

### Step 1: Switch to Test Mode in Stripe Dashboard
1. Go to https://dashboard.stripe.com
2. Toggle to **Test Mode** (switch in top-right corner)
3. You should see "TEST MODE" badge

### Step 2: Create 4 Test Products

#### Product 1: Student (Test)
```
Name: BeatFlow Student (TEST)
Price: $9.99 USD
Billing: Monthly recurring
```

#### Product 2: Creator (Test)
```
Name: BeatFlow Creator (TEST)
Price: $24.00 USD
Billing: Monthly recurring
```

#### Product 3: Pro (Test)
```
Name: BeatFlow Pro (TEST)
Price: $49.00 USD
Billing: Monthly recurring
```

#### Product 4: Agency (Test)
```
Name: BeatFlow Agency (TEST)
Price: $149.00 USD
Billing: Monthly recurring
```

### Step 3: Copy Test Price IDs to .env

After creating each product, Stripe will generate test price IDs (format: `price_xxxxx`).

Update your `.env` file:

```bash
# REPLACE THESE WITH YOUR TEST PRICE IDs:
REACT_APP_STRIPE_STUDENT_PRICE_ID=price_TEST_STUDENT_HERE
REACT_APP_STRIPE_CREATOR_PRICE_ID=price_TEST_CREATOR_HERE
REACT_APP_STRIPE_PRO_PRICE_ID=price_TEST_PRO_HERE
REACT_APP_STRIPE_AGENCY_PRICE_ID=price_TEST_AGENCY_HERE
```

### Step 4: Test Checkout

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

Expiry: Any future date (e.g., `12/34`)
CVC: Any 3 digits (e.g., `123`)

---

## When to Switch to Live Mode

When you're ready to go live:
1. Switch `.env` to live keys:
   ```bash
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
   STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
   ```
2. Switch price IDs to live versions (the ones you already have)
3. Deploy to production

---

## Current .env Status

✅ Test keys are correct:
```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_ZhhC5ymolTEY5tpitpISQ4cA
STRIPE_SECRET_KEY=sk_test_REPLACED_SEE_NETLIFY_ENV_VARS
```

❌ Price IDs are LIVE (need test versions):
```
REACT_APP_STRIPE_STUDENT_PRICE_ID=price_1RPG6sAEum2hO0KZGTDZIqOr  # LIVE
REACT_APP_STRIPE_CREATOR_PRICE_ID=price_1RPFZuAEum2hO0KZ6R9hDDBS  # LIVE
REACT_APP_STRIPE_PRO_PRICE_ID=price_1RPGGGAEum2hO0KZbsLLd4x1     # LIVE
REACT_APP_STRIPE_AGENCY_PRICE_ID=price_1RPGOLAEum2hO0KZ7tHXcspp  # LIVE
```
