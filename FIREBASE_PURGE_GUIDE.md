# Firebase Purge Guide - Clean Up Unnecessary Data

## ⚠️ IMPORTANT SAFETY WARNINGS

1. **All purge operations default to DRY RUN mode** - no data deleted until you confirm
2. **Make backups** before running live deletions
3. **Review audit results** carefully before purging
4. **Start with Firestore** (easier to restore) before Storage

## Quick Start

**Refresh your browser**, then run in console:

```js
// Step 1: Audit everything (safe - read only)
auditFirestoreCollections()  // See all collections
auditFirebaseStorage()        // See all storage folders

// Step 2: Dry run purge (safe - shows what would be deleted)
purgeAllFirebase(true)        // Preview deletions

// Step 3: Execute purge (DESTRUCTIVE!)
purgeAllFirebase(false)       // Actually delete data
```

---

## What Will Be Deleted

### Firestore Collections (Safe to Delete)

**Duplicate Collections:**
- `tracks` - Duplicate of `songs`
- `songLikes` - Use `likes` instead
- `songFavorites` - Use `likes` instead
- `playlistTracks` - Embedded in playlists

**Unused Features:**
- `podcast_episodes` - Not implemented
- `audiobooks` - Not implemented
- `jobs` - Not implemented
- `applications` - Not implemented
- `vendorApplications` - Not implemented
- `adSignups` - Not implemented
- `customGenres` - Unused
- `customCategories` - Unused
- `customMoods` - Unused

**Legacy/Temporary:**
- `submissions` - Old submission system
- `creditTransactions` - Legacy payments
- `supervisorSamplers` - Unused
- `audioAccess` - Temporary access logs
- `user_sessions` - Can regenerate
- `user_devices` - Can regenerate
- `error_logs` - Can be cleared

**Analytics (can archive first):**
- `playbackEvents`
- `playEvents`
- `likeEvents`
- `followEvents`
- `playlistFollowEvents`
- `recommendation_interactions`

**Agent-Generated (can regenerate):**
- `content_metadata`
- `moderation_results`

### Firebase Storage Folders

**Temporary (safe to delete):**
- `temp/` - Temporary uploads
- `temp-uploads/` - Processing temp files

**Legacy (delete AFTER migration):**
- `admin-uploads/` - Old audio location (migrate to `songs/audio/` first!)
- `artist-uploads/` - Old uploads (verify migration first)

---

## Collections That Will Be KEPT

These are essential and will never be deleted:

- ✅ `songs` - All music tracks
- ✅ `albums` - Album collections
- ✅ `artists` - Artist profiles
- ✅ `users` - User accounts
- ✅ `playlists` - User playlists
- ✅ `purchases` - Purchase records
- ✅ `downloads` - Download history
- ✅ `likes` - User likes/favorites
- ✅ `userQueues` / `queues` - Player queues

---

## Step-by-Step Purge Process

### Phase 1: Audit (Safe - No Changes)

```js
// See all Firestore collections
const firestoreAudit = await auditFirestoreCollections()

// See all Storage files
const storageAudit = await auditFirebaseStorage()
```

**Review the output:**
- How many documents in each collection?
- How much storage space used?
- Anything unexpected?

### Phase 2: Purge Firestore (DRY RUN)

```js
// Preview what would be deleted
await purgeFirestoreCollections(true)
```

**Output shows:**
- Which collections will be deleted
- How many documents in each
- Estimated cleanup

### Phase 3: Purge Firestore (LIVE)

⚠️ **Only run this after reviewing dry run results!**

```js
// Actually delete unused collections
await purgeFirestoreCollections(false)
```

### Phase 4: Purge Storage (DRY RUN)

```js
// Preview storage cleanup
await purgeFirebaseStorage(true)
```

### Phase 5: Purge Storage (LIVE)

⚠️ **Make sure songs are migrated first!**

```js
// Delete temp files
await purgeFirebaseStorage(false)
```

---

## Individual Operations

### Audit Only (No Deletion)

```js
// Firestore collections
auditFirestoreCollections()

// Storage files
auditFirebaseStorage()
```

### Delete Specific Parts

```js
// Only Firestore
purgeFirestoreCollections(true)   // Dry run
purgeFirestoreCollections(false)  // Execute

// Only Storage
purgeFirebaseStorage(true)   // Dry run
purgeFirebaseStorage(false)  // Execute
```

### Complete Purge (Both)

```js
// Everything at once
purgeAllFirebase(true)   // Dry run
purgeAllFirebase(false)  // Execute
```

---

## Expected Results

### Before Purge
- **Collections**: 67 total
- **Documents**: Thousands (many in unused collections)
- **Storage**: Duplicated files in multiple locations

### After Purge
- **Collections**: ~10-15 essential collections
- **Documents**: Only active user data
- **Storage**: Clean, standardized structure

### Benefits
- ✅ Faster queries (less collections to search)
- ✅ Lower costs (less storage, less reads/writes)
- ✅ Easier debugging (cleaner structure)
- ✅ Better performance (smaller database)

---

## Safety Features

1. **Dry Run Default**: All functions default to `dryRun = true`
2. **Batch Processing**: Deletes in safe batches to avoid timeouts
3. **Error Handling**: Continues on error, reports at end
4. **Essential Protection**: Never deletes essential collections
5. **Detailed Logging**: Shows exactly what's being deleted

---

## Rollback Plan

### If Something Goes Wrong

**Firestore:**
1. Check Firebase Console > Firestore > Backups
2. Restore from automatic daily backup
3. Or use exported data (if you made exports)

**Storage:**
1. Files are harder to restore - make sure migration works first!
2. Keep originals for 7 days after migration
3. Manual re-upload if needed

### Recommended Backup Before Purging

```bash
# Export Firestore data (optional but recommended)
firebase firestore:export gs://your-bucket/backups/$(date +%Y%m%d)
```

---

## Common Scenarios

### Scenario 1: Fresh Start
"I want to delete everything except essential data"

```js
auditFirestoreCollections()  // See what you have
purgeAllFirebase(true)        // Preview
purgeAllFirebase(false)       // Execute
```

### Scenario 2: Clean Up After Migration
"I migrated songs, now want to delete old files"

```js
// First verify migration worked
standardizeFirebaseStorage()

// Then clean up
auditFirebaseStorage()
purgeFirebaseStorage(false)
```

### Scenario 3: Analytics Cleanup
"Keep app data, just clean up analytics"

```js
// Manually delete specific collections
purgeFirestoreCollections(false)
// (It will delete analytics collections)
```

---

## Monitoring After Purge

1. **Check app functionality** - Does everything still work?
2. **Monitor errors** - Any "collection not found" errors?
3. **Verify performance** - Queries faster?
4. **Check costs** - Firebase usage decreased?

---

## FAQ

**Q: Will this delete my songs?**
A: No. Songs, albums, artists, users, and other essential collections are protected.

**Q: Can I undo a purge?**
A: Firestore has automatic backups (if enabled). Storage files are permanent - verify migration first!

**Q: How long does it take?**
A: Depends on data volume. Usually 1-5 minutes for Firestore, longer for Storage.

**Q: Will users be affected?**
A: No if done correctly. Essential data is preserved. Test in dry-run first!

**Q: What if I'm not sure?**
A: Always start with audits and dry runs. Review results carefully before executing.

---

## Summary Commands

```js
// 1. AUDIT (safe)
auditFirestoreCollections()
auditFirebaseStorage()

// 2. DRY RUN (safe)
purgeAllFirebase(true)

// 3. EXECUTE (destructive)
purgeAllFirebase(false)

// 4. Individual operations
purgeFirestoreCollections(false)  // Just Firestore
purgeFirebaseStorage(false)       // Just Storage
```

**Always review audit results before purging!**
