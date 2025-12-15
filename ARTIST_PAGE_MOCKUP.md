# Artist Page Mockup - Visual Layout

## Header Section
```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌──────────┐                                                          │
│  │          │   Drake                                                  │
│  │  Artist  │                                                          │
│  │  Photo   │   1,234,567 followers • 987,654,321 total plays        │
│  │  200x200 │                                                          │
│  │          │   25 songs  [Follow]                                    │
│  └──────────┘                                                          │
│                                                                         │
│  About                                                                 │
│  Canadian rapper, singer, and songwriter known for...                 │
│                                                                         │
│  [▶ Play All]                                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Songs List Section

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Songs (25)                                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ 1  [🎵] God's Plan                    [$0.99] [❤] [+] [🔗] [▶]       │
│         Drake                                                           │
│                                                                         │
│ 2  [🎵] One Dance                     [$0.99] [❤] [+] [🔗] [▶]       │
│         Drake                                                           │
│                                                                         │
│ 3  [🎵] In My Feelings                [$0.99] [❤] [+] [🔗] [▶]       │
│         Drake                                                           │
│                                                                         │
│ 4  [🎵] Hotline Bling                 [✓ Owned] [❤] [+] [🔗] [▶]     │
│         Drake                                                           │
│                                                                         │
│ 5  [🎵] Passionfruit                  [$0.99] [❤] [+] [🔗] [▶]       │
│         Drake                                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Detailed Component Breakdown

### Artist Header Info:
```
Artist Name: Drake (H3, Bold, White)
Stats Line:  1,234,567 followers • 987,654,321 total plays (Grey 400)
Song Count:  25 songs (Grey 500)
Action:      [Follow] button (Green #1DB954, rounded)
```

### Each Song Row Contains:
```
[#]     Track number (Grey 500)
[🎵]    Album cover (40x40px, rounded)
Title   Song name (White, medium font)
Artist  Artist name (Grey 400, small font)
[$X.XX] Purchase button - Small outlined button with price
  OR
[Owned] Green chip if already purchased (clickable to download)
[❤]     Like/Favorite toggle (Pink when liked)
[+]     Add to playlist menu
[🔗]    Share button
[▶]     Play/Pause toggle
```

## Color Scheme

- **Background**: Dark grey (#1a1a1a)
- **Card Hover**: Lighter grey (#2a2a2a)
- **Text Primary**: White
- **Text Secondary**: Grey 400
- **Accent Green**: #1DB954 (Spotify green)
- **Accent Pink**: #e91e63 (For likes)
- **Success Green**: Green chip for owned songs

## Interactive States

### Follow Button:
- **Not Following**:
  ```
  [  Follow  ]  - Green filled, white text
  ```
- **Following**:
  ```
  [ Following ]  - Green outlined, green text
  ```

### Purchase Button:
- **Not Purchased**:
  ```
  [ 🛒 $0.99 ]  - Small outlined button
  ```
- **Purchased**:
  ```
  [ ✓ Owned ]   - Green chip (click to download)
  ```

### Play States:
- **Not Playing**: ▶ Play icon (Grey)
- **Currently Playing**: ⏸ Pause icon + animated bars on cover
- **Is Current Song**: Card background slightly lighter (#2a2a2a)

## Example with Real Data

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌──────────┐                                                          │
│  │          │   BeatFlow Artist                                        │
│  │   [BA]   │                                                          │
│  │          │   3 followers • 1,250 total plays                       │
│  │ (Artist  │                                                          │
│  │  Photo)  │   5 songs  [Follow]                                     │
│  └──────────┘                                                          │
│                                                                         │
│  [▶ Play All]                                                         │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ Songs (5)                                                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ 1  [🎵] Summer Vibes                  [$0.99] [♡] [+] [🔗] [▶]       │
│         BeatFlow Artist                   (325 plays)                  │
│                                                                         │
│ 2  [🎵] Midnight Dreams               [$0.99] [❤] [+] [🔗] [▶]       │
│         BeatFlow Artist                   (502 plays) LIKED            │
│                                                                         │
│ 3  [🎵] City Lights                   [✓ Owned] [♡] [+] [🔗] [▶]     │
│         BeatFlow Artist                   (198 plays) OWNED            │
│                                                                         │
│ 4  [🎵] Ocean Breeze                  [$0.99] [♡] [+] [🔗] [▶]       │
│         BeatFlow Artist                   (125 plays)                  │
│                                                                         │
│ 5  [🎵] Neon Nights                   [$0.99] [♡] [+] [🔗] [▶]       │
│         BeatFlow Artist                   (100 plays)                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Stats Calculation Examples

### Scenario 1: New Artist (No activity yet)
```
Artist Name
5 songs  [Follow]
```

### Scenario 2: Artist with 1 follower
```
Artist Name
1 follower
5 songs  [Follow]
```

### Scenario 3: Artist with plays but no followers
```
Artist Name
1,250 total plays
5 songs  [Follow]
```

### Scenario 4: Popular artist (Full stats)
```
Artist Name
50,000 followers • 25,000,000 total plays
25 songs  [Following]  ← You're following
```

## Responsive Behavior

- Stats wrap on smaller screens
- Follow button stays visible
- Song rows stack vertically on mobile
- Action buttons may condense on mobile (icons only)

## Data Sources

- **Follower Count**: Real-time query of `users` collection
  - Counts users with artist in `followedArtists` array
  - Updates when you follow/unfollow

- **Total Plays**: Sum of `playCount` from all artist songs
  - Calculated from loaded song data
  - No additional query needed

- **Song Count**: Number of documents in `songs` collection with matching `artistName`

## Purchase Flow

1. User clicks **[$0.99]** button
2. Redirects to Stripe checkout
3. After purchase, returns to success page
4. On return, button changes to **[✓ Owned]**
5. Click **[✓ Owned]** to download the song

## Implementation Status

✅ Artist profile display
✅ Follow/Following button with real-time updates
✅ Follower count (live from Firestore)
✅ Total plays calculation
✅ Compact purchase buttons
✅ Like/Unlike functionality
✅ Add to playlist
✅ Share functionality
✅ Play/Pause controls
✅ Dynamic stats (only show when > 0)
