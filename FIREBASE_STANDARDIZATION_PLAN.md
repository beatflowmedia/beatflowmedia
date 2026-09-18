# Firebase Storage & Firestore Standardization Plan

## Current Issues
1. **Storage Fragmentation**: Audio files scattered across multiple paths
   - `admin-uploads/{userId}/` - Current upload location
   - `artist-uploads/audio/` - Legacy location
   - `songs/audio/` - Another legacy location
   - `audio/` - Yet another location

2. **Firestore Inconsistencies**:
   - Songs use different field names: `audioUrl`, `streamUrl`, `url`, `src`
   - Album references may not match actual file locations
   - Missing or broken file references

3. **Collection Duplication**: 67 collections with potential overlaps

## Standardized Structure

### Storage Hierarchy
```
beatflowmedia.firebasestorage.app/
├── songs/
│   ├── audio/{songId}.mp3           # Standardized audio location
│   └── covers/{songId}.jpg          # Song cover art
├── albums/
│   └── covers/{albumId}.jpg         # Album cover art
├── artists/
│   ├── {artistId}/
│   │   ├── profile.jpg              # Artist profile image
│   │   └── banner.jpg               # Artist banner
├── playlists/
│   └── covers/{playlistId}.jpg      # Playlist covers
├── users/
│   └── {userId}/
│       └── avatar.jpg               # User avatars
└── temp/
    └── {userId}/                    # Temporary uploads during processing
```

### Firestore Document Standards

#### Songs Collection
```javascript
{
  id: string,                        // Firestore document ID
  title: string,
  artistId: string,
  artistName: string,
  albumId: string | null,

  // AUDIO - Single source of truth
  audioUrl: string,                  // Full Firebase Storage URL (primary)
  audioPath: string,                 // Storage path: "songs/audio/{songId}.mp3"

  // METADATA
  duration: number,                  // seconds
  fileSize: number,                  // bytes
  format: string,                    // "mp3", "wav", etc.
  bitrate: number,                   // kbps

  // ARTWORK - Single source of truth
  coverUrl: string | null,           // Full Firebase Storage URL
  coverPath: string | null,          // Storage path: "songs/covers/{songId}.jpg"

  // Remove these legacy fields:
  // streamUrl, url, src, image, albumArt, artwork
}
```

#### Albums Collection
```javascript
{
  id: string,
  title: string,
  artistId: string,
  artistName: string,

  // ARTWORK
  coverUrl: string,
  coverPath: string,                 // "albums/covers/{albumId}.jpg"

  // METADATA
  releaseDate: timestamp,
  trackCount: number,
  totalDuration: number,
}
```

## Migration Steps

### Phase 1: Audit (Safe - Read Only)
1. Run `diagnoseSongStorage()` to analyze current state
2. Generate report of all files and their locations
3. Identify duplicates, missing files, and orphaned documents
4. Create backup plan

### Phase 2: Storage Migration
1. Copy all audio files to standardized location: `songs/audio/{songId}.{ext}`
2. Copy all cover art to: `songs/covers/{songId}.jpg`
3. Verify all files copied successfully
4. Keep originals until verification complete

### Phase 3: Firestore Migration
1. Update all song documents to use standardized fields
2. Remove legacy fields (streamUrl, url, src)
3. Ensure all references are valid
4. Update albums, playlists, and user collections

### Phase 4: Component Updates
1. Update all upload components to use standard paths
2. Update all queries to use `audioUrl` field only
3. Update player components to expect consistent structure
4. Update admin tools to maintain standards

### Phase 5: Cleanup
1. Remove duplicate files after verification period (7 days)
2. Delete orphaned documents with no files
3. Archive old migration logs

## Benefits
- ✅ Predictable file locations
- ✅ Faster queries (single field instead of checking 4 fields)
- ✅ Easier debugging
- ✅ Better CSP security (known paths)
- ✅ Simplified backup/restore
- ✅ Reduced storage costs (no duplicates)

## Timeline
- **Week 1**: Audit and planning (current)
- **Week 2**: Run migration scripts
- **Week 3**: Verification and component updates
- **Week 4**: Cleanup and monitoring

## Rollback Plan
- Keep original files for 7 days
- Document ID mapping for reversal
- Firestore document backups
- Ability to switch back to legacy fields if needed
