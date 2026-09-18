# Testimonials Collection Schema

**Collection:** `testimonials`

**Purpose:** Store verified user testimonials for marketing materials, landing pages, and social proof.

---

## Document Structure

```javascript
{
  // Identity
  userId: string,                    // Reference to users/{userId}
  userType: string,                  // 'artist' | 'curator' | 'listener' | 'advertiser'

  // Content
  name: string,                      // User's display name (can be edited for privacy)
  role: string,                      // "Indie Pop Artist" | "Hip-Hop Curator" | "Music Enthusiast"
  quote: string,                     // The testimonial text (max 280 characters)
  fullTestimonial: string,          // Optional longer version

  // Stats (must be verifiable)
  stats: {
    // For artists
    streams: number,                 // Total streams (verifiable from songs collection)
    earnings: number,                // Total earnings in cents (verifiable from payouts)
    followers: number,               // Follower count

    // For curators
    playlists: number,               // Number of playlists created
    playlistFollowers: number,       // Total followers across all playlists

    // For listeners
    discoveries: number,             // Number of new artists discovered
    hoursListened: number,           // Total listening hours
    playlistsCreated: number         // Personal playlists created
  },

  // Media
  image: string,                     // Storage URL: gs://beatflow/testimonials/{userId}.webp
  imageUrl: string,                  // Public URL for display

  // Verification & Consent
  verified: boolean,                 // Admin verified the testimonial is real
  verifiedBy: string,                // Admin userId who verified
  verifiedAt: Timestamp,             // When it was verified

  consentGiven: boolean,             // User explicitly consented to public display
  consentDate: Timestamp,            // When consent was given
  consentMethod: string,             // 'form' | 'email' | 'phone'

  // Display Settings
  featured: boolean,                 // Show on homepage/landing pages
  displayOrder: number,              // Order for featured testimonials (1-100)
  segment: string,                   // 'artists' | 'curators' | 'listeners' | 'all'

  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  status: string,                    // 'pending' | 'approved' | 'rejected' | 'archived'
  rejectionReason: string,           // If rejected, why?

  // Optional
  location: string,                  // "Los Angeles, CA" (if user wants to share)
  website: string,                   // Artist website/social media
  videoUrl: string                   // Video testimonial URL (optional)
}
```

---

## Firestore Rules

```javascript
match /testimonials/{testimonialId} {
  // Anyone can read approved, featured testimonials
  allow read: if resource.data.status == 'approved'
                 && resource.data.featured == true
                 && resource.data.verified == true;

  // Only the user can create their own testimonial
  allow create: if request.auth != null
                   && request.resource.data.userId == request.auth.uid
                   && request.resource.data.consentGiven == true;

  // Users can update their own testimonial (if not yet verified)
  allow update: if request.auth != null
                   && resource.data.userId == request.auth.uid
                   && resource.data.verified == false;

  // Admins can verify/approve/reject testimonials
  allow update: if request.auth != null
                   && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

---

## Indexes Required

```javascript
// Query featured testimonials
testimonials: {
  fields: ['featured', 'verified', 'status', 'displayOrder']
}

// Query by segment
testimonials: {
  fields: ['segment', 'featured', 'verified', 'displayOrder']
}

// Query by userType
testimonials: {
  fields: ['userType', 'featured', 'verified', 'displayOrder']
}
```

---

## Usage Examples

### Admin Approval Workflow

```javascript
// 1. User submits testimonial
await addDoc(collection(db, 'testimonials'), {
  userId: user.uid,
  userType: 'artist',
  name: 'Sarah Martinez',
  role: 'Indie Pop Artist',
  quote: 'BeatFlow helped me reach real listeners who love my music.',
  stats: {
    streams: 50000,
    earnings: 150000, // $1,500 in cents
    followers: 1200
  },
  image: 'gs://beatflow/testimonials/user123.webp',
  verified: false,
  consentGiven: true,
  consentDate: serverTimestamp(),
  consentMethod: 'form',
  featured: false,
  displayOrder: 0,
  segment: 'artists',
  status: 'pending',
  createdAt: serverTimestamp()
});

// 2. Admin reviews and verifies
await updateDoc(doc(db, 'testimonials', testimonialId), {
  verified: true,
  verifiedBy: adminUserId,
  verifiedAt: serverTimestamp(),
  status: 'approved',
  featured: true,
  displayOrder: 5,
  updatedAt: serverTimestamp()
});
```

### Query for Marketing Display

```javascript
// Get featured artist testimonials for landing page
const q = query(
  collection(db, 'testimonials'),
  where('segment', '==', 'artists'),
  where('featured', '==', true),
  where('verified', '==', true),
  where('status', '==', 'approved'),
  orderBy('displayOrder', 'asc'),
  limit(3)
);

const snapshot = await getDocs(q);
const testimonials = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

### Verify Stats Before Approval

```javascript
// Admin function to verify testimonial stats match database
async function verifyTestimonialStats(testimonialId) {
  const testimonialDoc = await getDoc(doc(db, 'testimonials', testimonialId));
  const testimonial = testimonialDoc.data();

  if (testimonial.userType === 'artist') {
    // Verify streams
    const songsQuery = query(
      collection(db, 'songs'),
      where('uploadedBy', '==', testimonial.userId)
    );
    const songsSnapshot = await getDocs(songsQuery);

    let totalStreams = 0;
    songsSnapshot.forEach(doc => {
      totalStreams += doc.data().plays || 0;
    });

    // Check if claimed streams are accurate
    if (Math.abs(totalStreams - testimonial.stats.streams) > totalStreams * 0.1) {
      // Claimed streams are more than 10% off
      return {
        verified: false,
        reason: 'Stream count does not match database',
        actual: totalStreams,
        claimed: testimonial.stats.streams
      };
    }

    // Verify earnings
    const payoutsQuery = query(
      collection(db, 'payouts'),
      where('artistId', '==', testimonial.userId)
    );
    const payoutsSnapshot = await getDocs(payoutsQuery);

    let totalEarnings = 0;
    payoutsSnapshot.forEach(doc => {
      totalEarnings += doc.data().amount || 0;
    });

    if (Math.abs(totalEarnings - testimonial.stats.earnings) > totalEarnings * 0.1) {
      return {
        verified: false,
        reason: 'Earnings do not match database',
        actual: totalEarnings,
        claimed: testimonial.stats.earnings
      };
    }

    return {
      verified: true,
      actualStats: {
        streams: totalStreams,
        earnings: totalEarnings
      }
    };
  }

  return { verified: true };
}
```

---

## Legal Requirements

### FTC Compliance

✅ **Required for legal testimonials:**
1. Must be from real users
2. Must have written consent
3. Stats must be verifiable
4. Cannot fabricate or exaggerate
5. Must disclose if incentivized
6. Must be typical results, not outliers

### GDPR/Privacy

✅ **User consent must include:**
- Permission to display name/photo publicly
- Permission to display stats publicly
- Right to revoke consent anytime
- Right to request removal
- Data retention policy

### Consent Form Example

```javascript
const consentForm = {
  checkboxes: [
    '✓ I consent to BeatFlow displaying my testimonial publicly on marketing materials',
    '✓ I consent to BeatFlow using my name, photo, and stats in marketing',
    '✓ I confirm the stats I provided are accurate',
    '✓ I understand I can revoke this consent at any time by emailing support@beatflow.com'
  ],
  signature: 'User\'s typed name',
  date: new Date(),
  ipAddress: '...' // For verification
};
```

---

## Admin Dashboard Features

### Testimonials Management UI

**Features needed:**
1. ✅ View pending testimonials
2. ✅ Verify stats against database (automated)
3. ✅ Approve/reject with reason
4. ✅ Set display order
5. ✅ Mark as featured
6. ✅ Upload/crop user photo
7. ✅ Preview how it looks on landing page
8. ✅ Revoke/archive testimonials

---

## Migration from Existing Fake Testimonials

```javascript
// DO NOT use fake testimonials
// MarketingAgent.js already updated to show:
{
  note: 'TODO: Pull from Firestore testimonials collection',
  warning: 'Must have user consent for public display'
}

// When you get real testimonials:
// 1. User submits through form
// 2. Admin verifies stats
// 3. Admin approves
// 4. Testimonial appears on marketing materials
```

---

## Status: Ready to Implement

**Next Steps:**
1. Create admin UI for testimonial management
2. Create user-facing testimonial submission form
3. Implement automated stats verification
4. Query testimonials in MarketingAgent.js instead of fake data

**ETA:** 2-3 days for full implementation
