# Stripe Pricing Setup Guide

## Overview
This guide helps you create the Stripe subscription products and configure the pricing plan IDs for BeatFlow's premium subscription tiers.

## Prerequisites
- Stripe account (test mode for development)
- Admin access to Stripe Dashboard

## Steps to Configure Stripe Pricing

### 1. Create Subscription Products in Stripe

Log into [Stripe Dashboard](https://dashboard.stripe.com/products) and create the following products:

#### Student Plan
- **Product Name**: BeatFlow Student
- **Description**: Educational discount with full commercial licensing for students
- **Pricing**: $9.99/month recurring
- **Trial Period**: 30 days
- **Metadata** (optional but recommended):
  - `plan_id`: `student`
  - `plan_tier`: `student`
  - `requires_verification`: `edu_email`

#### Creator Plan
- **Product Name**: BeatFlow Creator
- **Description**: Perfect for full-time content creators (YouTube, TikTok, Instagram, podcasts)
- **Pricing**: $19.99/month recurring
- **Trial Period**: 30 days
- **Metadata** (optional but recommended):
  - `plan_id`: `creator`
  - `plan_tier`: `creator`
  - `featured`: `true`

#### Pro Plan
- **Product Name**: BeatFlow Pro
- **Description**: For professional productions with broadcast and film distribution rights
- **Pricing**: $39.99/month recurring
- **Trial Period**: 30 days
- **Metadata** (optional but recommended):
  - `plan_id`: `pro`
  - `plan_tier`: `professional`

#### Agency Plan
- **Product Name**: BeatFlow Agency
- **Description**: For agencies and teams with multiple users
- **Pricing**: $99/month recurring
- **Trial Period**: 30 days
- **Metadata** (optional but recommended):
  - `plan_id`: `agency`
  - `plan_tier`: `enterprise`
  - `seats_included`: `5`

### 2. Get the Price IDs

After creating each product:
1. Click on the product in Stripe Dashboard
2. Find the **Price ID** (starts with `price_`)
3. Copy the Price ID for each plan

### 3. Configure Environment Variables

Update your `.env` file (create from `.env.example` if needed):

```bash
# Stripe Pricing Plans
REACT_APP_STRIPE_STUDENT_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxx
REACT_APP_STRIPE_CREATOR_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxx
REACT_APP_STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxx
REACT_APP_STRIPE_AGENCY_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxx
```

**IMPORTANT**:
- Use **TEST MODE** price IDs (starting with `price_`) during development
- Switch to **LIVE MODE** price IDs when deploying to production
- Never commit `.env` file to version control

### 4. Verify Configuration

After setting environment variables:

1. Restart your development server:
   ```bash
   npm start
   ```

2. Navigate to `/explore-premium`

3. Open browser console and check if price IDs are loaded:
   ```javascript
   // The plans should have valid Stripe price IDs
   console.log('Price IDs configured:',
     process.env.REACT_APP_STRIPE_STUDENT_PRICE_ID,
     process.env.REACT_APP_STRIPE_CREATOR_PRICE_ID,
     process.env.REACT_APP_STRIPE_PRO_PRICE_ID,
     process.env.REACT_APP_STRIPE_AGENCY_PRICE_ID
   );
   ```

4. Test a subscription flow (use Stripe test card: `4242 4242 4242 4242`)

### 5. Production Deployment

When deploying to production:

1. Create identical products in Stripe **LIVE MODE**
2. Update environment variables in your hosting platform (Netlify, Vercel, etc.)
3. Test with real payment methods before going live

## Troubleshooting

### Price IDs not loading
- Ensure `.env` file is in the root directory
- Environment variables must start with `REACT_APP_` for Create React App
- Restart development server after modifying `.env`

### Subscription checkout fails
- Verify price IDs match exactly (case-sensitive)
- Check if Stripe API keys are configured correctly
- Ensure price is set to recurring (not one-time payment)

### Trial period not working
- Configure trial period in Stripe product settings
- Check if trial_period_days is set on the price

## Security Notes

⚠️ **Important Security Practices**:
- Never commit real Stripe API keys to Git
- Use test mode for all development
- Rotate keys if accidentally exposed
- Use environment variables for all sensitive data

## Next Steps

After completing Stripe setup:
1. [ ] Implement .edu email verification for Student plan
2. [ ] Configure webhook handlers for subscription events
3. [ ] Set up Stripe Customer Portal for subscription management
4. [ ] Add subscription status checks in user profile
5. [ ] Implement download limits based on subscription tier

## References

- [Stripe Products Documentation](https://stripe.com/docs/products-prices/overview)
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Test Cards](https://stripe.com/docs/testing)
