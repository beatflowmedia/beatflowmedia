# Beat Flow Artist Page - Live Mockup
**URL:** http://localhost:8888/artist/Beat%20Flow

---

## Visual Layout (Current State)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌──────────┐                                                          │
│  │          │   Beat Flow                                              │
│  │          │                                                          │
│  │  Artist  │   5 songs  [Follow]                                     │
│  │  Photo   │                                                          │
│  │  200x200 │   (No followers yet • No plays yet)                     │
│  │          │                                                          │
│  └──────────┘                                                          │
│                                                                         │
│  [▶ Play All]                                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Songs (5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────────────────────────┐
│ 1  [🎵] Track 1                       [$0.99] [♡] [+] [🔗] [▶]        │
│         Beat Flow                                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ 2  [🎵] Track 2                       [$0.99] [♡] [+] [🔗] [▶]        │
│         Beat Flow                                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ 3  [🎵] Track 3                       [$0.99] [♡] [+] [🔗] [▶]        │
│         Beat Flow                                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ 4  [🎵] Track 4                       [$0.99] [♡] [+] [🔗] [▶]        │
│         Beat Flow                                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ 5  [🎵] Track 5                       [$0.99] [♡] [+] [🔗] [▶]        │
│         Beat Flow                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## After User Interactions

### Scenario 1: You follow the artist
```
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌──────────┐                                                          │
│  │  Artist  │   Beat Flow                                              │
│  │  Photo   │                                                          │
│  └──────────┘   1 follower                                            │
│                                                                         │
│                 5 songs  [Following] ← Button changes                  │
│                                                                         │
│  [▶ Play All]                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Scenario 2: You play a song (adds play count)
```
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌──────────┐                                                          │
│  │  Artist  │   Beat Flow                                              │
│  │  Photo   │                                                          │
│  └──────────┘   1 follower • 1 total play                             │
│                                                                         │
│                 5 songs  [Following]                                   │
│                                                                         │
│  [▶ Play All]                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Songs (5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────────────────────────┐
│ 1  [🎵] Track 1                       [$0.99] [♡] [+] [🔗] [⏸]        │
│         Beat Flow                     ← Now playing (pause icon)       │
│    ┌───────┐                                                           │
│    │ 🎵🎵🎵│ ← Animated playing indicator                             │
│    └───────┘                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Scenario 3: You purchase a song
```
Songs (5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────────────────────────┐
│ 1  [🎵] Track 1                       [✓ Owned] [♡] [+] [🔗] [▶]      │
│         Beat Flow                     ← Changed from [$0.99]           │
│                                       Click "Owned" to download        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ 2  [🎵] Track 2                       [$0.99] [♡] [+] [🔗] [▶]        │
│         Beat Flow                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Scenario 4: You like a song
```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1  [🎵] Track 1                       [✓ Owned] [❤] [+] [🔗] [▶]      │
│         Beat Flow                     ← Heart is filled/pink           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Scenario 5: Multiple users engage (Growth)
```
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌──────────┐                                                          │
│  │  Artist  │   Beat Flow                                              │
│  │  Photo   │                                                          │
│  └──────────┘   127 followers • 3,456 total plays                     │
│                                                                         │
│                 5 songs  [Following]                                   │
│                                                                         │
│  [▶ Play All]                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Color Scheme (Dark Theme)

```css
Background:           #121212 (Dark grey)
Card Background:      #1a1a1a (Slightly lighter)
Card Hover:           #2a2a2a (Even lighter on hover)
Primary Text:         #FFFFFF (White)
Secondary Text:       #B3B3B3 (Grey 400)
Tertiary Text:        #808080 (Grey 500)

Follow Button:        #1DB954 (Spotify green)
Follow Hover:         #1ED760 (Lighter green)
Following Button:     Outlined with #1DB954

Purchase Button:      Outlined primary
Owned Chip:           Green (#1DB954) with checkmark
Like (Active):        #E91E63 (Pink)
Like (Inactive):      #B3B3B3 (Grey)
```

---

## Interactive Elements Detail

### Follow Button States:
```
NOT FOLLOWING:
┌─────────────┐
│   Follow    │ ← Green filled (#1DB954), white text, rounded corners
└─────────────┘

FOLLOWING:
┌─────────────┐
│  Following  │ ← Green outline (#1DB954), green text, rounded corners
└─────────────┘
```

### Purchase Button States:
```
NOT PURCHASED:
┌──────────┐
│ 🛒 $0.99 │ ← Small, outlined, blue/primary color
└──────────┘

PURCHASED:
┌──────────┐
│ ✓ Owned  │ ← Small green chip, clickable
└──────────┘

CHECKING:
┌──────────┐
│ ◌  ...   │ ← Spinner, disabled
└──────────┘
```

### Song Row Buttons:
```
[♡] Like (unfilled heart) → Click → [❤] Like (filled pink heart)
[+] Add to playlist → Opens dropdown menu
[🔗] Share → Copies link or opens share dialog
[▶] Play → Click → [⏸] Pause (when playing)
```

---

## Real-Time Data Flow

### When Page Loads:
1. ✅ Fetch artist doc from `artists` collection (name: "Beat Flow")
2. ✅ Fetch all songs where `artistName == "Beat Flow"`
3. ✅ Query `users` collection for `followedArtists` array containing "Beat Flow"
4. ✅ Calculate total plays from all songs' `playCount` fields
5. ✅ Check if current user is following this artist

### When You Click "Follow":
1. ✅ Updates your user doc: adds "Beat Flow" to `followedArtists` array
2. ✅ Button changes to "Following"
3. ✅ Follower count increments: 0 → 1
4. ✅ Shows toast: "Followed Beat Flow"

### When You Click Purchase:
1. ✅ Redirects to Stripe checkout
2. ✅ Shows payment form for $0.99
3. ✅ On success: Creates doc in `purchases` collection
4. ✅ Returns to page, button shows "✓ Owned"

### When You Click "Owned":
1. ✅ Fetches signed download URL
2. ✅ Records download in `downloads` collection
3. ✅ Triggers browser download

---

## Current Firestore Data Structure Needed

### Artist Document: `artists/[artistId]`
```javascript
{
  name: "Beat Flow",
  profileImage: "https://...",  // or uses default logo
  bio: "...",                    // optional
  // followers/plays calculated dynamically
}
```

### Song Documents: `songs/[songId]`
```javascript
{
  title: "Track 1",
  artistName: "Beat Flow",
  coverUrl: "https://...",
  audioUrl: "https://...",
  price: 0.99,              // optional, defaults to 0.99
  playCount: 0,             // increments with each play
  albumId: "...",           // optional
  // ... other fields
}
```

### User Follow Data: `users/[userId]`
```javascript
{
  followedArtists: ["Beat Flow", "Other Artist"],  // array
  likes: ["songId1", "songId2"],                   // array
  // ... other fields
}
```

---

## Empty State vs Populated State

### Empty State (Initial):
```
Beat Flow
5 songs  [Follow]
```
- No stats line shown
- All songs show [$0.99]
- No likes/purchases yet

### Populated State (After Activity):
```
Beat Flow
1,234 followers • 56,789 total plays
5 songs  [Following]
```
- Stats visible
- Some songs show [✓ Owned]
- Some hearts are filled (liked)

---

## Browser View (Actual HTML/CSS)

```
http://localhost:8888/artist/Beat%20Flow
└─ Dark background (#121212)
   └─ Centered content
      ├─ Artist header (flex row)
      │  ├─ Profile image (200x200)
      │  └─ Info column
      │     ├─ Name (H3)
      │     ├─ Stats (if any)
      │     └─ Song count + Follow button
      │
      ├─ Biography (if exists)
      │
      ├─ Play All button
      │
      └─ Songs list
         └─ Each song is a card with:
            - Track number
            - Cover image (40x40)
            - Title & artist
            - Purchase button (compact)
            - Action buttons (like, playlist, share, play)
```

---

## Testing Checklist

- [ ] Navigate to http://localhost:8888/artist/Beat%20Flow
- [ ] Verify 5 songs load
- [ ] Click "Follow" → Should change to "Following"
- [ ] Follower count should show "1 follower"
- [ ] Click [$0.99] on a song → Redirects to Stripe
- [ ] Complete test purchase (4242 4242 4242 4242)
- [ ] Return to page → Button shows [✓ Owned]
- [ ] Click [✓ Owned] → Downloads song
- [ ] Click [♡] on a song → Turns pink [❤]
- [ ] Click [▶] on a song → Starts playing, icon changes to [⏸]
- [ ] Play count should increment in Firestore

