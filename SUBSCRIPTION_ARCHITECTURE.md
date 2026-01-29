# Subscription Architecture - Separation of Concerns

## Overview

BeatFlow Media has **two distinct subscription types** that must be kept separate to avoid field collisions in the `users` collection:

1. **Artist Membership Subscriptions** - For artists to upload and manage content
2. **Listener Premium Subscriptions** - For listeners to access premium features (ad-free, offline, etc.)

## Field Naming Convention

All subscription fields in the `users` collection are **namespaced** to avoid conflicts:

### Artist Subscription Fields

```javascript
{
  // Status flags
  artistMembershipActive: boolean,              // True if artist has active membership
  artistSubscriptionStatus: string,             // 'active' | 'cancelled' | 'past_due' | 'unpaid'

  // Stripe identifiers
  artistStripeSubscriptionId: string,           // Stripe subscription ID
  artistStripeCustomerId: string,               // Stripe customer ID for artist billing

  // Dates
  artistMembershipExpiresAt: Timestamp,         // When membership expires (for annual subscriptions)
  artistMembershipStartedAt: Timestamp,         // When membership started
  artistMembershipCancelledAt: Timestamp,       // When membership was cancelled (if applicable)

  // Metadata
  membershipType: string,                       // 'annual' | 'monthly'

  // LEGACY FIELDS (backward compatibility - remove after migration)
  membershipExpiresAt: Timestamp,               // OLD - use artistMembershipExpiresAt
  membershipStartedAt: Timestamp,               // OLD - use artistMembershipStartedAt
  stripeSubscriptionId: string,                 // OLD - use artistStripeSubscriptionId
  subscriptionStatus: string                    // OLD - use artistSubscriptionStatus
}
```

### Listener Premium Subscription Fields

```javascript
{
  // Status flags
  isPremium: boolean,                           // True if listener has premium
  premiumActive: boolean,                       // Alias for isPremium
  listenerSubscriptionStatus: string,           // 'active' | 'cancelled' | 'past_due' | 'unpaid'

  // Stripe identifiers
  listenerStripeSubscriptionId: string,         // Stripe subscription ID
  listenerStripeCustomerId: string,             // Stripe customer ID for listener billing

  // Dates
  listenerSubscriptionExpiresAt: Timestamp,     // When premium expires
  listenerSubscriptionStartedAt: Timestamp,     // When premium started
  listenerSubscriptionCancelledAt: Timestamp,   // When premium was cancelled (if applicable)

  // Metadata
  premiumTier: string,                          // 'basic' | 'plus' | 'premium'
  subscriptionPlan: string                      // Alias for premiumTier
}
```

## Validation Logic

### Artist Membership Validation

**Service:** `src/services/membershipService.js`

**Function:** `checkMembershipStatus(userId)`

**Returns:**
```javascript
{
  active: boolean,              // True if artist can access artist features
  expiresAt: Date | null,       // Expiration date (null for ongoing subscriptions)
  daysRemaining: number | null, // Days until expiration
  subscriptionId: string | null,
  subscriptionStatus: string | null
}
```

**Logic:**
- Artist is active if **EITHER**:
  1. Has `artistStripeSubscriptionId` AND `artistSubscriptionStatus === 'active'` (ongoing subscription), **OR**
  2. Has `artistMembershipActive === true` AND `artistMembershipExpiresAt` is in the future (time-limited)

### Listener Premium Validation

**Hook:** `src/hooks/useSubscription.js`

**Function:** `useSubscription(user)`

**Returns:**
```javascript
{
  hasSubscription: boolean,     // True if listener has active premium
  loading: boolean,
  subscriptionData: {
    status: string | null,
    tier: string | null,
    customerId: string | null,
    isPremium: boolean,
    expiresAt: Date | null
  }
}
```

**Logic:**
- Listener has premium if:
  - Has `listenerStripeCustomerId` **AND**
  - (`listenerSubscriptionStatus === 'active'` **OR** `isPremium === true` **OR** `premiumActive === true`)

## Stripe Webhook Handlers

**File:** `netlify/functions/stripe-webhook.js`

### checkout.session.completed

Handles initial subscription purchases:

```javascript
// Artist membership checkout
if (itemType === 'artist_membership') {
  await db.collection('users').doc(userId).update({
    artistMembershipActive: true,
    artistMembershipExpiresAt: expirationDate,
    artistStripeSubscriptionId: session.subscription,
    artistStripeCustomerId: session.customer,
    artistSubscriptionStatus: 'active'
  });
}

// Listener premium checkout
if (itemType === 'listener_premium') {
  await db.collection('users').doc(userId).update({
    isPremium: true,
    premiumActive: true,
    listenerStripeSubscriptionId: session.subscription,
    listenerStripeCustomerId: session.customer,
    listenerSubscriptionStatus: 'active'
  });
}
```

### customer.subscription.updated

Handles subscription renewals and status changes:

```javascript
// Identifies subscription type by checking both fields
let usersSnapshot = await db.collection('users')
  .where('artistStripeSubscriptionId', '==', subscription.id)
  .get();

let isArtistSubscription = !usersSnapshot.empty;

if (usersSnapshot.empty) {
  usersSnapshot = await db.collection('users')
    .where('listenerStripeSubscriptionId', '==', subscription.id)
    .get();
}

// Updates appropriate fields based on subscription type
```

### customer.subscription.deleted

Handles cancellations:

```javascript
if (isArtistSubscription) {
  await db.collection('users').doc(userId).update({
    artistMembershipActive: false,
    artistSubscriptionStatus: 'cancelled',
    artistMembershipCancelledAt: serverTimestamp()
  });
} else {
  await db.collection('users').doc(userId).update({
    isPremium: false,
    premiumActive: false,
    listenerSubscriptionStatus: 'cancelled',
    listenerSubscriptionCancelledAt: serverTimestamp()
  });
}
```

## Migration Path

### For Existing Users with Legacy Fields

The system supports **backward compatibility** by:

1. Reading both old and new field names:
   ```javascript
   const expiresAt = userData.artistMembershipExpiresAt?.toDate()
                  || userData.membershipExpiresAt?.toDate()
                  || null;
   ```

2. Writing both old and new fields during webhook:
   ```javascript
   membershipData = {
     artistMembershipExpiresAt: expirationDate,  // NEW
     membershipExpiresAt: expirationDate,        // LEGACY
     // ...
   }
   ```

### Migration Script (Optional)

To migrate existing users to new schema:

```javascript
const migrateSubscriptionFields = async () => {
  const usersSnapshot = await getDocs(collection(db, 'users'));

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const updates = {};

    // Migrate artist fields
    if (userData.stripeSubscriptionId && !userData.artistStripeSubscriptionId) {
      updates.artistStripeSubscriptionId = userData.stripeSubscriptionId;
      updates.artistSubscriptionStatus = userData.subscriptionStatus || 'active';
    }

    if (userData.membershipExpiresAt && !userData.artistMembershipExpiresAt) {
      updates.artistMembershipExpiresAt = userData.membershipExpiresAt;
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(userDoc.ref, updates);
      console.log(`✅ Migrated user ${userDoc.id}`);
    }
  }
};
```

## Usage Examples

### Check Artist Access

```javascript
import { checkMembershipStatus } from './services/membershipService';

const status = await checkMembershipStatus(user.uid);

if (!status.active) {
  navigate('/artist-pricing');
}
```

### Check Listener Premium

```javascript
import { useSubscription } from './hooks/useSubscription';

const { hasSubscription, subscriptionData } = useSubscription(user);

if (hasSubscription) {
  // Show premium features
}
```

## Benefits of This Architecture

1. **No Field Collisions** - Artist and listener subscriptions use separate fields
2. **Clear Separation** - Each subscription type has its own validation service
3. **Scalability** - Easy to add new subscription types (curator, label, etc.)
4. **Backward Compatible** - Supports legacy field names during migration
5. **Type Safety** - Clear naming prevents bugs from mixing subscription types
6. **Audit Trail** - Separate cancellation timestamps for each type

## Future Enhancements

### Potential Additional Subscription Types

Using the same namespacing pattern:

```javascript
// Curator subscriptions
{
  curatorSubscriptionActive: boolean,
  curatorStripeSubscriptionId: string,
  curatorSubscriptionStatus: string,
  // ...
}

// Label subscriptions
{
  labelSubscriptionActive: boolean,
  labelStripeSubscriptionId: string,
  labelSubscriptionStatus: string,
  // ...
}
```

## Firestore Indexes

Required composite indexes for efficient queries:

```javascript
// Artist subscription lookups
users: {
  fields: ['artistStripeSubscriptionId', 'artistSubscriptionStatus']
}

// Listener subscription lookups
users: {
  fields: ['listenerStripeSubscriptionId', 'listenerSubscriptionStatus']
}
```

## Testing

### Test Active Artist Subscription

```javascript
// Stripe CLI
stripe trigger checkout.session.completed --add metadata:userId=test123 --add metadata:itemType=artist_membership

// Expected result in Firestore
{
  artistMembershipActive: true,
  artistStripeSubscriptionId: 'sub_xxx',
  artistSubscriptionStatus: 'active'
}
```

### Test Active Listener Premium

```javascript
// Stripe CLI
stripe trigger checkout.session.completed --add metadata:userId=test123 --add metadata:itemType=listener_premium

// Expected result in Firestore
{
  isPremium: true,
  listenerStripeSubscriptionId: 'sub_yyy',
  listenerSubscriptionStatus: 'active'
}
```

### Test User with Both Subscriptions

A user can have both artist membership AND listener premium simultaneously:

```javascript
{
  // Artist fields
  artistMembershipActive: true,
  artistStripeSubscriptionId: 'sub_xxx',
  artistSubscriptionStatus: 'active',

  // Listener fields
  isPremium: true,
  listenerStripeSubscriptionId: 'sub_yyy',
  listenerSubscriptionStatus: 'active'
}
```

## Summary

✅ **Proper separation of concerns achieved**
✅ **No field name collisions**
✅ **Backward compatible**
✅ **Clear validation logic for each type**
✅ **Scalable architecture**

The subscription system now properly distinguishes between artist memberships and listener premium subscriptions, ensuring no data conflicts and clear validation paths.
