# Firestore Optimization Plan
**Status:** Pre-Launch Optimization (No Users Yet)
**Goal:** Optimize for scale before user signups
**Priority:** High - Must complete now while database is empty

---

## Executive Summary

Based on analysis of 200+ Firestore queries across your codebase, here are the critical optimizations needed:

### 🔴 **Critical Issues (Fix Now)**
1. **Missing Composite Indexes** - 15+ query patterns need indexes
2. **Duplicate Collections** - `tracks` vs `songs`, `userQueues` vs `queues`
3. **Inefficient Queries** - Full collection scans without indexes
4. **No Query Limits** - Unbounded queries that will fail at scale

### ✅ **What's Already Good**
- Smart denormalization (artist names, cover URLs)
- Event-driven architecture (playEvents, likeEvents)
- Proper subcollections for user data
- Security rules are comprehensive

---

## Part 1: Required Composite Indexes

### Most Frequent Query Patterns (By Collection)

#### **songs** Collection - 50+ queries
```javascript
// Pattern 1: Artist songs (used 8x in codebase)
where('artist', '==', artistName) + orderBy('playCount', 'desc')
where('uploadedBy', '==', userId) + orderBy('createdAt', 'desc')
where('albumId', '==', albumId) + orderBy('trackNumber', 'asc')

// Pattern 2: Genre filtering
where('genre', '==', genreName) + orderBy('playCount', 'desc')
where('genre', 'in', [genres]) + orderBy('releaseDate', 'desc')

// Pattern 3: Visibility + sorting
where('isVisible', '==', true) + orderBy('playCount', 'desc')
where('isVisible', '==', true) + orderBy('releaseDate', 'desc')
where('isVisible', '==', true) + orderBy('createdAt', 'desc')
```

#### **albums** Collection - 15+ queries
```javascript
where('artist', '==', artistName) + orderBy('releaseDate', 'desc')
where('uploadedBy', '==', userId) + orderBy('createdAt', 'desc')
where('isVisible', '==', true) + orderBy('releaseDate', 'desc')
```

#### **artistSubmissions** Collection - 10+ queries
```javascript
where('status', '==', 'pending') + orderBy('submittedAt', 'desc')
where('status', 'in', ['approved', 'published']) + orderBy('submittedAt', 'desc')
where('uploadedBy', '==', userId) + orderBy('submittedAt', 'desc')
```

#### **Event Collections** (playEvents, likeEvents, followEvents)
```javascript
// All events need timestamps for analytics
where('userId', '==', userId) + orderBy('timestamp', 'desc')
where('songId', '==', songId) + orderBy('timestamp', 'desc')
where('eventType', '==', type) + orderBy('timestamp', 'desc')
```

---

## Part 2: Collections to Remove/Merge

### ❌ **Remove These Collections**

1. **`tracks`** - Duplicate of `songs` (unused in codebase)
   - Action: Delete collection if empty
   - Migration: None needed (not used)

2. **`userQueues`** - Duplicate of `queues`
   - Current: Both collections exist
   - Action: Consolidate to `queues` only
   - Migration: Copy any data from `userQueues` to `queues`

3. **`playbackEvents`** - Overlaps with `playEvents`
   - Current: Two similar event tracking systems
   - Action: Use `playEvents` only (more detailed)
   - Migration: Archive old `playbackEvents` if needed

### 🔄 **Merge These Collections**

**Problem:** User playlists in two locations
```javascript
// Current (inefficient):
users/{uid}/playlists/{playlistId}  // Private playlists
playlists/{playlistId}               // Public playlists

// Optimized (recommended):
playlists/{playlistId}               // All playlists
  - Add field: privacy: 'private' | 'public'
  - Add field: creatorId: userId
  - Index: where('creatorId', '==', userId)
```

**Benefits:**
- ✅ Single query for all user playlists
- ✅ Easier to make playlists public/private
- ✅ Reduces read costs (no subcollection queries)
- ✅ Simpler security rules

---

## Part 3: Query Optimization Patterns

### 🔴 **Critical: Add Limits to All Queries**

**Current Code (Dangerous):**
```javascript
// ❌ This will break with 10,000+ songs
const songsSnapshot = await getDocs(collection(db, 'songs'));
```

**Optimized:**
```javascript
// ✅ Always limit unbounded queries
const songsQuery = query(
  collection(db, 'songs'),
  where('isVisible', '==', true),
  orderBy('playCount', 'desc'),
  limit(100)  // Add pagination for more
);
```

**Files to Update (High Priority):**
- `src/components/admin/ContentManagement.js:83` - No limit on songs query
- `src/components/admin/ContentManagement.js:95` - No limit on albums query
- `src/hooks/useTrendingSongs.js` - Multiple unbounded queries
- `src/hooks/usePersonalizedSections.js` - Add limits to all song queries

### ⚡ **Use Cached Aggregates Instead of Counts**

**Current (Expensive):**
```javascript
// ❌ Reads ALL songs to count
const songsSnapshot = await getDocs(collection(db, 'songs'));
const count = songsSnapshot.size;
```

**Optimized:**
```javascript
// ✅ Use aggregate collection
const statsDoc = await getDoc(doc(db, 'platformStats', 'global'));
const count = statsDoc.data().totalSongs;

// Update via Cloud Function on song create/delete
```

**New Collection Needed:**
```javascript
platformStats/global: {
  totalSongs: 1234,
  totalAlbums: 567,
  totalArtists: 89,
  totalUsers: 4567,
  updatedAt: Timestamp
}
```

---

## Part 4: Denormalization Strategy

### ✅ **Keep These Denormalizations** (Already Optimal)

```javascript
// songs collection
{
  artist: "Artist Name",        // ✅ Allows queries without join
  artistName: "Artist Name",    // ✅ Flexibility for display
  albumTitle: "Album Title",    // ✅ Display without album fetch
  coverUrl: "...",              // ✅ No album fetch for cover
  albumId: "abc123"             // ✅ Reference for joining if needed
}

// albums collection
{
  artistName: "Artist Name",    // ✅ Display without artist fetch
  songs: ["id1", "id2"],        // ✅ Fast access to track list
  trackCount: 10                // ✅ No need to count array
}
```

### 🆕 **Add These Denormalizations**

1. **Artist Metrics on Songs**
   ```javascript
   songs/{id}: {
     // Add these:
     artistFollowerCount: 1234,  // Cache for trending calculation
     artistVerified: true,       // Display verification badge
   }
   ```

2. **Album Metrics on Songs**
   ```javascript
   songs/{id}: {
     // Add these:
     albumPlayCount: 5678,       // Trending album tracks
     albumReleaseDate: Timestamp // Filter by album age
   }
   ```

3. **User Engagement Summary**
   ```javascript
   userMetrics/{userId}: {
     totalPlays: 1234,
     totalLikes: 567,
     totalPlaylists: 12,
     favoriteGenres: ["Pop", "Rock"],  // Cache for recommendations
     lastActive: Timestamp
   }
   ```

---

## Part 5: Index Creation Script

### Required Composite Indexes

Create file: `firestore.indexes.json`

```json
{
  "indexes": [
    {
      "collectionGroup": "songs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isVisible", "order": "ASCENDING" },
        { "fieldPath": "playCount", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "songs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isVisible", "order": "ASCENDING" },
        { "fieldPath": "releaseDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "songs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "artist", "order": "ASCENDING" },
        { "fieldPath": "playCount", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "songs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "albumId", "order": "ASCENDING" },
        { "fieldPath": "trackNumber", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "songs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "uploadedBy", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "songs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "genre", "order": "ASCENDING" },
        { "fieldPath": "playCount", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "albums",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isVisible", "order": "ASCENDING" },
        { "fieldPath": "releaseDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "albums",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "artist", "order": "ASCENDING" },
        { "fieldPath": "releaseDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "albums",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "uploadedBy", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "artistSubmissions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "submittedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "artistSubmissions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "uploadedBy", "order": "ASCENDING" },
        { "fieldPath": "submittedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "playEvents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "playEvents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "songId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "playlists",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "creatorId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "playlists",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "privacy", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

**Deploy indexes:**
```bash
firebase deploy --only firestore:indexes
```

---

## Part 6: Migration Plan (Step-by-Step)

### Phase 1: Create Indexes (No Downtime)
1. Deploy `firestore.indexes.json`
2. Wait for indexes to build (Firebase Console)
3. Test queries still work

### Phase 2: Remove Duplicate Collections
1. **Remove `tracks` collection** (if empty/unused)
2. **Migrate `userQueues` to `queues`** (run script)
3. **Archive `playbackEvents`** (rename to `playbackEvents_archive`)

### Phase 3: Consolidate Playlists
1. Create migration script to move user playlists
2. Add `creatorId` and `privacy` fields
3. Update queries to use new structure
4. Remove subcollections after verification

### Phase 4: Add Aggregate Collections
1. Create `platformStats/global` document
2. Create Cloud Functions to update stats
3. Update code to use stats instead of counts

### Phase 5: Add Missing Denormalizations
1. Update song creation to include artist metrics
2. Backfill existing songs (run script)
3. Update queries to use denormalized fields

### Phase 6: Add Query Limits
1. Update all unbounded queries with limits
2. Add pagination for large result sets
3. Test with large dataset

---

## Part 7: Implementation Scripts

I'll create these scripts for you:

1. **`create-indexes.sh`** - Deploy all required indexes
2. **`migrate-playlists.js`** - Consolidate playlist collections
3. **`add-query-limits.js`** - Add limits to queries in code
4. **`create-platform-stats.js`** - Initialize aggregate stats
5. **`remove-duplicate-collections.js`** - Clean up duplicates

---

## Cost Impact Analysis

### Current (Inefficient)
- Unbounded queries: **High read costs** when scaled
- No indexes: **High latency** + potential failures
- Duplicate collections: **Extra storage costs**
- **Estimated monthly cost at 10K users:** $500-800

### Optimized (Proposed)
- Indexed queries: **Fast, predictable costs**
- Query limits + pagination: **Controlled read costs**
- Single source collections: **Reduced storage**
- **Estimated monthly cost at 10K users:** $150-250

**Savings: 60-70% on Firestore costs**

---

## Timeline

**Week 1: Preparation**
- [ ] Day 1-2: Create index definitions
- [ ] Day 3-4: Write migration scripts
- [ ] Day 5: Test in development

**Week 2: Execution**
- [ ] Day 1: Deploy indexes (start building)
- [ ] Day 2-3: Run migrations
- [ ] Day 4: Update code with limits
- [ ] Day 5: Final testing

**Week 3: Verification**
- [ ] Day 1-2: Performance testing
- [ ] Day 3: Monitor costs/latency
- [ ] Day 4-5: Fix any issues

---

## Success Metrics

✅ **Optimization Complete When:**
1. All queries have composite indexes
2. No unbounded queries remain
3. Duplicate collections removed
4. Platform stats collection active
5. Query latency <100ms (p95)
6. Read costs predictable and controlled

---

## Next Steps

1. **Review this plan** - Confirm approach
2. **Run index creation** - Start building indexes now
3. **Execute migrations** - One phase at a time
4. **Update codebase** - Add limits, use new structure
5. **Monitor & optimize** - Track metrics post-launch

**Ready to proceed?** I'll create the implementation scripts.
