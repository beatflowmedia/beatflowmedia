# Firestore Index Requirements

This document outlines the composite indexes needed for optimal performance.

## Required Indexes

### 1. Album Reviews Index
**Collection:** `albumReviews`
**Fields:**
- `albumId` (Ascending)
- `createdAt` (Descending)

**Purpose:** Efficiently query reviews for a specific album sorted by newest first

**Command:**
```bash
# This index should be created automatically when you run the query
# If not, create it manually in Firebase Console or use:
firebase firestore:indexes
```

### 2. Songs by Album Index
**Collection:** `songs`
**Fields:**
- `albumId` (Ascending)
- `trackNumber` (Ascending)

**Purpose:** Query tracks for an album in correct track order

**Note:** Currently sorting is done client-side to avoid requiring this index. For better performance with large albums (>50 tracks), create this index.

## Performance Notes

- Client-side sorting is used for reviews and tracks to avoid index requirements
- For production with large datasets, server-side sorting with indexes is recommended
- Monitor query performance in Firebase Console and create indexes as needed

## Creating Indexes

1. **Automatic:** Firebase will suggest indexes when queries fail
2. **Manual:** Go to Firebase Console > Firestore > Indexes
3. **CLI:** Use `firebase deploy --only firestore:indexes` with firestore.indexes.json

## Current Status

✅ Album queries - No index needed (single document lookup)
✅ Tracks queries - Client-side sorting used
✅ Reviews queries - Client-side sorting used
⚠️  For production scale, consider creating the indexes above
