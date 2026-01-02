# BeatFlow Media Cloud Functions

This directory contains Firebase Cloud Functions for automated email notifications.

## Features

- **Sync Licensing Inquiry Emails**: Sends confirmation to customers and notification to admin when sync licensing forms are submitted
- **Investor Request Emails**: Sends confirmation to investors and notification to admin when investor access is requested
- **Purchase Confirmation Emails**: Sends purchase confirmation and download link to customers after successful purchases

## Setup Instructions

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Configure Gmail for Email Sending

#### Option A: Using Environment Variables (Development)

1. Create a `.env` file in the `functions` directory (copy from `.env.example`)
2. Go to https://myaccount.google.com/apppasswords
3. Create an app password for "BeatFlow Media"
4. Add your credentials to `.env`:

```
GMAIL_EMAIL=your-email@gmail.com
GMAIL_PASSWORD=your-16-char-app-password
```

#### Option B: Using Firebase Config (Production)

```bash
firebase functions:config:set gmail.email="your-email@gmail.com"
firebase functions:config:set gmail.password="your-app-password"
```

To view current config:
```bash
firebase functions:config:get
```

### 3. Update Email Addresses

In `index.js`, update the admin notification emails:
- Line 133: `licensing@beatflowmedia.com` (for sync licensing inquiries)
- Line 237: `office@beatflowmedia.com` (for investor requests)

You can also update the "from" address on line 19 if you have a custom domain.

### 4. Deploy Functions

```bash
firebase deploy --only functions
```

Or deploy specific functions:
```bash
firebase deploy --only functions:onSyncLicensingInquiry
firebase deploy --only functions:onInvestorRequest
firebase deploy --only functions:onPurchaseComplete
```

### 5. Test the Functions

After deployment:
1. Submit a sync licensing inquiry at `/sync-licensing`
2. Submit an investor request at `/investors`
3. Complete a purchase (song or album)

Check the Firebase Console logs to see function execution:
```bash
firebase functions:log
```

## Email Templates

All emails include:
- Responsive HTML design
- BeatFlow Media branding
- Clear call-to-action buttons
- Professional formatting
- Company contact information

### Customer Emails Include:
- Confirmation of submission/purchase
- Summary of details
- Next steps
- Support contact information

### Admin Emails Include:
- New inquiry/purchase notification
- Full details of the submission
- Direct link to Firebase Console
- Customer contact information

## Troubleshooting

### Emails not sending?

1. Check Firebase Console logs: https://console.firebase.google.com/project/beatflowmedia/functions/logs
2. Verify Gmail credentials are correct
3. Make sure "Less secure app access" is enabled (or use App Password)
4. Check that the function was triggered (look for creation timestamp in Firestore)

### Function deployment errors?

1. Make sure you're on the Blaze (pay-as-you-go) plan
2. Check that all dependencies are installed: `cd functions && npm install`
3. Verify Node.js version is compatible (Node 18+ recommended)

### Testing locally?

```bash
firebase emulators:start --only functions,firestore
```

## Cost Considerations

- Firebase Cloud Functions are billed based on:
  - Number of invocations
  - Execution time
  - Network egress
- Email sending via Gmail is free (with limits)
- Estimated cost for typical usage: < $1/month

## Alternative Email Services

If you need more robust email sending, consider:
- **SendGrid** (99,000 free emails/month)
- **Mailgun** (5,000 free emails/month)
- **Amazon SES** (62,000 free emails/month for first year)

To switch, update the transporter configuration in `index.js`.
