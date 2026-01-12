# Firebase Campaigns Collection Schema

## Collection: `campaigns`

### Base Fields (Existing)
```javascript
{
  artistId: string,           // User UID who created campaign
  artistName: string,          // Display name
  artistEmail: string,         // Contact email
  type: string,                // 'playlist_placement', 'social_promotion', 'radio_submission', 'influencer_outreach', 'conversion_ads'
  title: string,               // Campaign name
  description: string,         // Campaign description
  selectedTracks: string[],    // Array of song IDs
  targetGenres: string[],      // Genre targeting
  targetMoods: string[],       // Mood targeting
  targetDemographics: string[], // Age groups
  targetLocations: string[],   // Geographic targeting
  budget: number,              // Campaign budget in USD
  duration: number,            // Duration in days
  startDate: timestamp,        // Campaign start
  goals: {
    streams: number,
    playlistAdds: number,
    followers: number
  },
  status: string,              // 'pending_review', 'active', 'paused', 'completed', 'rejected'
  estimatedReach: number,      // Calculated reach
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### NEW Conversion Tracking Fields (2026 Hybrid Strategy)
```javascript
{
  // Smart Link Tracking
  smartLinkId: string,         // Reference to generated smart link
  smartLinkUrl: string,        // Full trackable URL (e.g., beatflowmedia.com/link/xyz)

  // Conversion Metrics
  conversions: {
    clicks: number,            // Total smart link clicks
    plays: number,             // Plays from smart link
    follows: number,           // New followers from campaign
    saves: number,             // Saves to library
    playlistAdds: number,      // User playlist additions
    shares: number,            // Social shares
    emailCaptures: number,     // Fan email captures
    completionRate: number,    // Avg % of song listened to (0-100)
    skipRate: number           // % of plays skipped before 30s (0-100)
  },

  // Pixel Tracking
  metaPixelEvents: {
    pageViews: number,         // Meta Pixel PageView events
    viewContent: number,       // ViewContent events (song page views)
    addToCart: number,         // AddToCart events (playlist additions)
    lead: number,              // Lead events (email captures)
    purchase: number           // Purchase events (subscription conversions)
  },

  tiktokPixelEvents: {
    pageViews: number,         // TikTok page views
    viewContent: number,       // Content views
    clickButton: number,       // Button clicks (play, follow)
    completeRegistration: number, // Email/account signups
    contact: number            // Contact form submissions
  },

  // Campaign Performance
  performance: {
    cpc: number,               // Cost per click
    cpa: number,               // Cost per acquisition (follow/save)
    roi: number,               // Return on investment %
    engagement: number,        // Overall engagement score (0-100)
    lastUpdated: timestamp     // Last metrics update
  },

  // A/B Testing (for future)
  variant: string,             // 'A', 'B', null (for split testing)

  // Additional Notes
  additionalNotes: string      // Existing field, kept for compatibility
}
```

### Example Campaign Document with Conversion Tracking
```javascript
{
  // Base fields
  artistId: "abc123",
  artistName: "Artist Name",
  artistEmail: "artist@example.com",
  type: "conversion_ads",
  title: "Summer Release Campaign",
  description: "Drive streams and followers via Meta/TikTok ads",
  selectedTracks: ["song1", "song2"],
  targetGenres: ["Pop", "Electronic"],
  targetMoods: ["Energetic", "Uplifting"],
  targetDemographics: ["18-24", "25-34"],
  targetLocations: ["United States", "Canada"],
  budget: 500,
  duration: 14,
  startDate: Timestamp,
  goals: {
    streams: 5000,
    playlistAdds: 100,
    followers: 250
  },
  status: "active",
  estimatedReach: 15000,
  createdAt: Timestamp,
  updatedAt: Timestamp,

  // NEW conversion tracking fields
  smartLinkId: "sl_xyz789",
  smartLinkUrl: "https://beatflowmedia.com/link/summer-release-xyz789",

  conversions: {
    clicks: 1250,
    plays: 890,
    follows: 143,
    saves: 78,
    playlistAdds: 45,
    shares: 23,
    emailCaptures: 67,
    completionRate: 72.5,
    skipRate: 12.3
  },

  metaPixelEvents: {
    pageViews: 1250,
    viewContent: 890,
    addToCart: 45,
    lead: 67,
    purchase: 12
  },

  tiktokPixelEvents: {
    pageViews: 780,
    viewContent: 560,
    clickButton: 340,
    completeRegistration: 45,
    contact: 15
  },

  performance: {
    cpc: 0.40,
    cpa: 3.50,
    roi: 285,
    engagement: 78,
    lastUpdated: Timestamp
  },

  variant: null,
  additionalNotes: "Targeting college students for summer festival promotion"
}
```

### Firestore Indexes Required
```javascript
// campaigns collection indexes
{
  collectionGroup: "campaigns",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "artistId", order: "ASCENDING" },
    { fieldPath: "status", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
},
{
  collectionGroup: "campaigns",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "type", order: "ASCENDING" },
    { fieldPath: "performance.roi", order: "DESCENDING" }
  ]
}
```

### Security Rules
```javascript
match /campaigns/{campaignId} {
  // Artists can read their own campaigns
  allow read: if request.auth != null &&
              resource.data.artistId == request.auth.uid;

  // Artists can create campaigns
  allow create: if request.auth != null &&
                request.resource.data.artistId == request.auth.uid;

  // Artists can update their own campaigns (status changes)
  allow update: if request.auth != null &&
                resource.data.artistId == request.auth.uid;

  // Admin can read/write all campaigns
  allow read, write: if request.auth.token.role == 'admin';
}
```

### Migration Notes
- All existing campaigns will have conversion fields initialized to zero/null
- Legacy campaigns without `conversions` object will default to empty metrics
- `smartLinkId` and `smartLinkUrl` optional for non-conversion campaigns
- Backward compatible with existing CampaignWizard.js implementation
