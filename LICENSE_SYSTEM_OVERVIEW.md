# BeatFlow License System Overview

## ✅ Already Implemented - Complete License System

Your platform **already has a comprehensive license system** that creates unique licenses for every purchase.

---

## 📋 License Flow

### When a Customer Purchases a Song/Album:

1. **Customer clicks "License for $29.00"**
   - `PurchaseButton` → `stripeService.createSongCheckout()`

2. **Stripe Checkout Session Created**
   - Price calculated (with subscriber discount if applicable)
   - Metadata attached: `userId`, `itemId`, `itemType`, `subscriberTier`

3. **Customer Completes Payment**
   - Stripe processes payment
   - Sends webhook to: `/.netlify/functions/stripe-webhook`

4. **Webhook Creates Unique License** (Lines 494-570)
   - ✅ Generates unique license ID: `LIC-XXXXXXXXXX`
   - ✅ Creates purchase record with license
   - ✅ Creates perpetual license in `licenses` collection
   - ✅ Updates user's `purchasedItems` array

---

## 🔑 License Types

### 1. Purchase License ID (Short Format)
**Format:** `LIC-XXXXXXXXXX` (16 hex characters)

**Example:** `LIC-A3F5D8C9E2B1F407`

**Used in:** `purchases` collection
```javascript
{
  licenseId: "LIC-A3F5D8C9E2B1F407",
  userId: "user123",
  itemId: "song456",
  itemType: "song",
  status: "completed",
  purchasedAt: Timestamp
}
```

### 2. Perpetual License ID (Long Format)
**Format:** `lic_perp_{userId}_{itemId}_{timestamp}`

**Example:** `lic_perp_user123_song456_1709745623000`

**Used in:** `licenses` collection
```javascript
{
  licenseId: "lic_perp_user123_song456_1709745623000",
  userId: "user123",
  trackId: "song456",
  purchaseId: "purchase789",
  tier: "creator", // Subscriber tier at time of purchase
  licenseType: "perpetual",
  status: "active",
  validWhileSubscribed: false, // Survives subscription cancellation
  pricePaid: 2030, // Cents (Creator discount: $20.30)
  originalPrice: 2900, // Original price before discount
  discountApplied: true,
  note: "Perpetual license purchased with creator subscriber discount",
  purchasedAt: Timestamp,
  createdAt: Timestamp
}
```

---

## 🗂️ Firestore Collections

### `purchases` Collection
**Purpose:** Track all completed purchases

**Schema:**
```javascript
{
  userId: string,
  itemId: string,
  itemType: "song" | "album" | "bundle",
  itemName: string,
  artistName: string,
  price: number, // Dollars (e.g., 20.30)
  currency: string, // "usd"
  status: "completed",
  licenseId: string, // "LIC-XXXXXXXXXX"
  stripeSessionId: string,
  stripePaymentIntent: string,
  customerEmail: string,
  purchasedAt: Timestamp,
  metadata: {
    subscriberTier: "none" | "student" | "creator" | "pro" | "agency",
    originalPrice: string,
    discountApplied: boolean,
    savings: string
  }
}
```

### `licenses` Collection
**Purpose:** Track perpetual licenses (survive subscription cancellation)

**Schema:**
```javascript
{
  licenseId: string, // "lic_perp_{userId}_{trackId}_{timestamp}"
  userId: string,
  trackId: string,
  purchaseId: string, // Reference to purchases collection
  tier: string, // Subscriber tier at purchase time
  licenseType: "perpetual" | "time-bound",
  status: "active" | "revoked" | "expired",
  validWhileSubscribed: boolean, // false for perpetual
  pricePaid: number, // Cents (actual amount paid)
  originalPrice: number, // Cents (price before discount)
  discountApplied: boolean,
  note: string,
  purchasedAt: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🔐 License Verification Flow

### Download Permission Check:

```javascript
// stripeService.js:88-106
async canDownloadSong(userId, songId) {
  // 1. Check direct purchase
  const hasPurchased = await hasPurchasedSong(userId, songId);
  if (hasPurchased) return true;

  // 2. Check album purchase
  const songDoc = await getDoc(doc(db, 'songs', songId));
  if (songDoc.data().albumId) {
    const hasAlbum = await hasPurchasedAlbum(userId, albumId);
    if (hasAlbum) return true;
  }

  // 3. Check active subscription
  // 4. Check perpetual license

  return false;
}
```

---

## 📊 License Generation Code (Already Exists)

### Location: `netlify/functions/stripe-webhook.js`

**Line 494-496:** Generate short license ID
```javascript
const crypto = require('crypto');
const licenseId = `LIC-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
```

**Line 525:** Generate perpetual license ID
```javascript
const perpetualLicenseId = `lic_perp_${userId}_${itemId}_${Date.now()}`;
```

**Lines 530-548:** Create license document
```javascript
await db.collection('licenses').doc(perpetualLicenseId).set({
  licenseId: perpetualLicenseId,
  userId,
  trackId: itemId,
  purchaseId: purchaseRef.id,
  tier: subscriberTier,
  licenseType: 'perpetual',
  status: 'active',
  validWhileSubscribed: false,
  pricePaid: session.amount_total,
  originalPrice: originalPrice,
  discountApplied: discountApplied,
  // ... more fields
});
```

---

## 🎯 Hybrid License Model

Your platform supports **two types of licenses**:

### 1. Time-Bound Subscription Licenses
- Access to catalog **while subscribed**
- Downloaded content can be used **in published work forever**
- Unpublished work loses license if subscription ends

### 2. Perpetual Purchase Licenses
- **Permanent ownership** of specific track
- Survives subscription cancellation
- Can be purchased **at a discount** if user has active subscription
- Stored in both `purchases` and `licenses` collections

---

## 🔍 To View Licenses in Firestore:

### Firebase Console → Firestore Database

1. **View All Purchases:**
   - Collection: `purchases`
   - Filter by: `userId == "user123"`
   - Shows: All purchases with license IDs

2. **View Perpetual Licenses:**
   - Collection: `licenses`
   - Filter by: `userId == "user123"`
   - Filter by: `licenseType == "perpetual"`
   - Shows: All perpetual licenses

---

## ✅ What's Already Working:

1. ✅ Unique license generation (`LIC-XXXX` format)
2. ✅ Perpetual license creation in `licenses` collection
3. ✅ Purchase tracking in `purchases` collection
4. ✅ Subscriber discount tracking in license metadata
5. ✅ License type tracking (perpetual vs time-bound)
6. ✅ Price paid vs original price tracking
7. ✅ Webhook event handling for license creation

---

## 🚀 How to Test License Creation:

### Local Development:

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

**Browser:**
1. Go to `http://localhost:8888/song/[song-id]`
2. Click "License for $29.00"
3. Complete test checkout: `4242 4242 4242 4242`
4. Watch Terminal 2 for webhook events

**Verify in Firebase:**
1. Check `purchases` collection for new document
2. Check `licenses` collection for perpetual license
3. Verify `licenseId` matches in both

---

## 📝 Example License Document:

```json
{
  "licenseId": "lic_perp_abc123_xyz789_1709745623000",
  "userId": "abc123",
  "trackId": "xyz789",
  "purchaseId": "purchase123",
  "tier": "creator",
  "licenseType": "perpetual",
  "status": "active",
  "validWhileSubscribed": false,
  "pricePaid": 2030,
  "originalPrice": 2900,
  "discountApplied": true,
  "note": "Perpetual license purchased with creator subscriber discount",
  "purchasedAt": "2024-03-06T12:00:00Z",
  "createdAt": "2024-03-06T12:00:00Z",
  "updatedAt": "2024-03-06T12:00:00Z"
}
```

---

## 🎓 Summary

Your license system **is already fully implemented** and includes:

- ✅ Unique license IDs for every purchase
- ✅ Dual collection storage (purchases + licenses)
- ✅ Perpetual vs time-bound license tracking
- ✅ Subscriber discount tracking
- ✅ Webhook-driven license creation
- ✅ License verification for downloads

**No additional implementation needed** - just need to:
1. Run the dev server properly (`npm run dev`)
2. Set up Stripe webhook forwarding (`stripe listen`)
3. Test the complete flow
4. Fix song prices in database (`/debug-song-price`)
