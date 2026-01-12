# 2026 Hybrid Marketing Strategy - Implementation Guide

## Overview
This document describes where to find and test all features from Google's 2026 Hybrid Marketing Strategy implementation in BeatFlow Media.

---

## 🎯 Where to Access Features

### 1. **Admin Marketing Dashboard**
**URL:** `/admin/dashboard`

New tabs added (tabs 5-8):

#### Tab 5: Smart Links
- **Component:** `SmartLinkManager.js` (already created)
- **Features:**
  - Create trackable smart links for songs/artists/playlists
  - View click/conversion metrics
  - Copy to clipboard functionality
  - Campaign attribution

#### Tab 6: Video Tools
- **Component:** `VideoToolsStudio.js`
- **Features:**
  - Bulk video clip generation interface
  - Instructions to use ShareButton video feature
  - Coming soon: Batch processing

#### Tab 7: Fan Capture
- **Component:** `FanCaptureManager.js`
- **Features:**
  - View all captured fan emails
  - See incentive types
  - Track capture sources
  - Weekly/monthly metrics

#### Tab 8: SEO Manager
- **Component:** `SEOManager.js`
- **Features:**
  - Generate XML sitemap (calls Firebase Function)
  - View SEO implementation status
  - Download sitemap
  - SEO features checklist

---

### 2. **Song Pages** (`/song/:id`)

**Auto-Active Features:**
- ✅ **SEO Meta Tags** - Open Graph & Twitter Cards (metaTagsHelper.js)
- ✅ **Schema.org Markup** - MusicRecording structured data (schemaMarkup.js)
- ✅ **Conversion Tracking** - trackSongView() on page load
- ✅ **Share Button Enhancement** - New "Create TikTok/Reels Clip" option

**How to Test:**
1. Navigate to any song page: `/song/{id}`
2. View page source - see meta tags in `<head>`
3. Click Share button → see "Create TikTok/Reels Clip" option
4. Open browser console → see conversion tracking logs

---

### 3. **Artist Pages** (`/artist/:id`)

**Auto-Active Features:**
- ✅ **SEO Meta Tags** - Artist-specific meta tags
- ✅ **Schema.org Markup** - MusicGroup structured data
- ✅ **Conversion Tracking** - trackArtistView() on page load

**How to Test:**
1. Navigate to any artist page: `/artist/{id}`
2. View page source - see artist meta tags
3. Check browser console for tracking events

---

### 4. **Playlist Pages** (`/playlist/:id`)

**Auto-Active Features:**
- ✅ **SEO Meta Tags** - Playlist-specific meta tags
- ✅ **Schema.org Markup** - MusicPlaylist structured data
- ✅ **Conversion Tracking** - trackPlaylistView() on page load

**How to Test:**
1. Navigate to any playlist page: `/playlist/{id}`
2. View page source - see playlist meta tags
3. Check browser console for tracking events

---

### 5. **Discover Weekly**
**URL:** `/discover-weekly`

**Features:**
- Algorithmic music recommendations
- Based on skip rate (<20%) and completion rate (>70%)
- 3 tabs: For You, Trending, Your Genres
- Uses songMetrics collection data

**How to Test:**
1. Navigate to `/discover-weekly`
2. See personalized recommendations based on listening quality
3. Switch between tabs

---

### 6. **Smart Link Redirects**
**URL:** `/link/:slug`

**Features:**
- Trackable smart links with conversion metrics
- Increments click count automatically
- Redirects to target (song/artist/playlist)
- Updates Meta/TikTok pixels

**How to Test:**
1. Create smart link in Admin Dashboard → Smart Links tab
2. Visit generated URL: `https://beatflowmedia.com/link/{slug}`
3. Should redirect and log conversion

---

### 7. **Playlist Creation with Mood Tags**
**Location:** Sidebar → "Create Playlist" button

**Features:**
- 10 mood options with emojis
- Mood tags stored in Firestore
- Used for algorithmic recommendations

**How to Test:**
1. Click "Create Playlist" in sidebar
2. See mood tag selector
3. Select moods → create playlist
4. Check Firestore - see `moods` array in playlist document

---

### 8. **Campaign Wizard**
**URL:** `/campaign-wizard` (artist role required)

**Features:**
- New campaign type: "Conversion Ads (Meta/TikTok)"
- Shows FIRST in list
- Marked as "NEW" and "RECOMMENDED"
- Base price: $200

**How to Test:**
1. Log in as artist
2. Navigate to `/campaign-wizard`
3. See "Conversion Ads (Meta/TikTok)" at top of list

---

## 📊 Background Features (Always Active)

### Player Context - Skip/Completion Tracking
**File:** `PlayerContext.js`

**Features:**
- Tracks skip if user skips before 30 seconds
- Tracks completion if song plays past 80%
- Sends to conversionTracking.js service
- Updates Meta/TikTok pixels

**How to Test:**
1. Play any song
2. Skip before 30s → see skip tracking in console
3. Let song play past 80% → see completion tracking in console

---

### Conversion Tracking Service (DRY)
**File:** `conversionTracking.js`

**Functions Available:**
- `trackSongView(song)`
- `trackSongPlay(song)`
- `trackSongCompletion(song, percent)`
- `trackSongSkip(song, timeListened)`
- `trackArtistView(artist)`
- `trackArtistFollow(artist)`
- `trackPlaylistView(playlist)`
- `trackPlaylistFollow(playlist)`
- `trackEmailCapture(email, artist)`
- `trackPurchase(item, value, currency)`

**Integration Points:**
- Automatically called from SongPage, Artist, Playlist pages
- Called from PlayerContext for skip/completion
- Called from FanCaptureModal for email captures

---

### Meta Pixel & TikTok Pixel
**File:** `public/index.html`

**Features:**
- Meta Pixel initialized with `fbq()`
- TikTok Pixel initialized with `ttq()`
- Both track PageView on load
- Custom events sent via conversionTracking.js

**How to Test:**
1. Open browser DevTools → Network tab
2. Filter by "facebook" or "tiktok"
3. See pixel requests on page loads and events

---

## 🔧 Firebase Functions (Backend)

### 1. Email Notification Functions
**File:** `functions/index.js`

**Functions:**
- `onFanEmailCapture` - Welcome email when fan subscribes
- `onNewSongRelease` - Release Radar to all followers
- `onCampaignComplete` - Performance summary email

**How to Test:**
1. Deploy functions: `firebase deploy --only functions`
2. Create fan capture → check email
3. Upload new song → followers get email
4. Complete campaign → artist gets summary email

---

### 2. XML Sitemap Generation
**Function:** `generateSitemap`

**Features:**
- Generates sitemap for all public songs/artists/playlists/albums
- Stores in Firestore `seo/sitemap` document
- Called from SEO Manager tab

**How to Test:**
1. Go to Admin Dashboard → SEO tab
2. Click "Generate Sitemap"
3. See success message with URL count
4. Check Firestore → `seo/sitemap` document

---

## 🎨 UI Components

### FanCaptureModal
**File:** `FanCaptureModal.js`

**Features:**
- Email capture with incentive types
- Race condition protection (processingRef)
- Sends to Firestore `fanCaptures` collection
- Triggers conversion tracking

**Integration:** Not yet integrated - needs to be added to Artist/Song pages

---

### VideoClipGenerator
**File:** `VideoClipGenerator.js`

**Features:**
- Select hook section (0-60s clips)
- Choose duration (15s, 30s, 60s)
- Select visualization type
- Add overlay text
- Export as 9:16 vertical video

**Integration:** Available via ShareButton → "Create TikTok/Reels Clip"

---

## 📁 File Structure Reference

```
src/
├── components/
│   ├── FanCaptureModal.js ✨ NEW
│   ├── VideoClipGenerator.js ✨ NEW
│   └── admin/
│       ├── SmartLinkManager.js ✨ NEW
│       ├── VideoToolsStudio.js ✨ NEW
│       ├── FanCaptureManager.js ✨ NEW
│       ├── SEOManager.js ✨ NEW
│       └── MarketingDashboard.js ✅ UPDATED (4 new tabs)
├── context/
│   └── PlayerContext.js ✅ UPDATED (skip/completion tracking)
├── pages/
│   ├── SongPage.js ✅ UPDATED (SEO + tracking)
│   ├── Artist.js ✅ UPDATED (SEO + tracking)
│   ├── Playlist.js ✅ UPDATED (SEO + tracking)
│   ├── DiscoverWeekly.js ✨ NEW
│   ├── SmartLink.js ✨ NEW
│   └── CampaignWizard.js ✅ UPDATED (Conversion Ads type)
├── services/
│   └── conversionTracking.js ✨ NEW (DRY tracking service)
├── utils/
│   ├── metaTagsHelper.js ✨ NEW
│   ├── schemaMarkup.js ✨ NEW
│   └── ShareButton.js ✅ UPDATED (video clip option)
└── hooks/
    └── usePlaylistManager.js ✅ UPDATED (moods parameter)

public/
└── index.html ✅ UPDATED (Meta & TikTok pixels)

functions/
└── index.js ✅ UPDATED (3 email functions + sitemap)
```

---

## 🧪 Testing Checklist

### Phase 1: Foundation
- [ ] Open `/song/{id}` → Check browser console for conversion tracking
- [ ] Skip song before 30s → See skip event in console
- [ ] Play song past 80% → See completion event in console
- [ ] View page source → See Meta Pixel and TikTok Pixel scripts

### Phase 2: SEO
- [ ] Open `/song/{id}` → View source → See Open Graph tags
- [ ] Open `/artist/{id}` → View source → See artist meta tags
- [ ] Open `/playlist/{id}` → View source → See playlist meta tags
- [ ] All pages → See Schema.org JSON-LD in `<head>`

### Phase 3: User Features
- [ ] Create playlist → See mood tag selector
- [ ] Select moods → Create → Check Firestore for `moods` field
- [ ] Click share button on song → See "Create TikTok/Reels Clip" option
- [ ] Open video clip generator → Test UI (no actual generation)

### Phase 4: Admin Features
- [ ] Go to `/admin/dashboard`
- [ ] Click "Smart Links" tab → See smart link management
- [ ] Click "Video Tools" tab → See video tools info
- [ ] Click "Fan Capture" tab → See captured emails table
- [ ] Click "SEO" tab → Generate sitemap

### Phase 5: Discovery
- [ ] Go to `/discover-weekly`
- [ ] See "For You" recommendations
- [ ] Switch to "Trending" tab
- [ ] Switch to "Your Genres" tab (if available)

### Phase 6: Campaigns
- [ ] Log in as artist
- [ ] Go to `/campaign-wizard`
- [ ] See "Conversion Ads (Meta/TikTok)" first in list
- [ ] Marked as "NEW" and "RECOMMENDED"

---

## 🔐 Firebase Security Rules (TODO)

Need to add rules for new collections:

```javascript
// firestore.rules

// Fan email captures
match /fanCaptures/{captureId} {
  allow read: if request.auth != null && request.auth.uid == resource.data.artistId;
  allow create: if request.auth != null;
}

// Smart links
match /smartLinks/{linkId} {
  allow read: if true; // Public readable
  allow create, update: if request.auth != null;
  allow delete: if request.auth != null && request.auth.uid == resource.data.createdBy;
}

// SEO sitemap
match /seo/{document} {
  allow read: if true; // Public readable
  allow write: if request.auth != null && request.auth.token.admin == true;
}
```

---

## 📝 Next Steps

1. **Add FanCaptureModal to pages:**
   - Add to Artist pages as CTA
   - Add to Song pages for exclusive content

2. **Add navigation links:**
   - Add "Discover Weekly" to sidebar
   - Add to main navigation menu

3. **Deploy Firebase Functions:**
   ```bash
   firebase deploy --only functions
   ```

4. **Update Firestore security rules:**
   - Add rules for fanCaptures, smartLinks, seo collections

5. **Configure actual Pixel IDs:**
   - Replace `YOUR_PIXEL_ID` in public/index.html
   - Replace `YOUR_TIKTOK_PIXEL_ID` in public/index.html

6. **Test email notifications:**
   - Configure SMTP in functions/emailConfig.js
   - Test fan capture email
   - Test release radar email
   - Test campaign completion email

---

## ✨ Summary

**21 tasks completed across 7 phases:**

- ✅ PHASE 1 (4 tasks): Pixel tracking, conversion schema, tracking service, skip/completion
- ✅ PHASE 2 (3 tasks): Meta tags helper, Schema.org helper, email functions
- ✅ PHASE 3 (3 tasks): Smart links, SEO integration, fan capture modal
- ✅ PHASE 4 (2 tasks): XML sitemap, Release Radar
- ✅ PHASE 5 (5 tasks): Mood tags, Discover Weekly, video clips, share enhancement
- ✅ PHASE 6 (1 task): Conversion Ads campaign type
- ✅ PHASE 7 (4 tasks): Admin dashboard tabs

**All features follow:**
- DRY principles (Don't Repeat Yourself)
- Separation of concerns
- Race condition protection
- Firebase best practices

**Ready for production** after:
1. Adding Firebase security rules
2. Configuring actual Pixel IDs
3. Setting up SMTP for emails
4. Adding navigation links
