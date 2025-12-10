# ESLint Warnings to Fix

These are non-blocking warnings from the build. The app compiles successfully but these should be cleaned up for code quality.

## Priority 1: Critical Files (Used in main layout)

### src/layouts/AppShell.js
- [ ] Line 34: Remove unused `location` variable
- [ ] Line 35: Remove unused `user` variable

### src/components/MusicPlayer.js
- [ ] Line 113: Add missing dependencies to useEffect: `manifestUrl`, `mseEngine`

## Priority 2: Page Components

### src/pages/Album.js
- [ ] Line 56: Remove unused `setAlbum`
- [ ] Line 62: Remove unused `setArtist`
- [ ] Line 140: Remove unused `loadRelatedAlbums`

### src/pages/Artist.js
- [ ] Remove ~20 unused MUI imports (Table, TableBody, Paper, etc.)
- [ ] Line 107: Fix `artistId` used before defined
- [ ] Line 237: Add `loadSimilarArtists` to useEffect deps

### src/pages/Playlist.js
- [ ] Remove ~20 unused imports
- [ ] Remove unused state variables (showCollaborators, shareDialogOpen, etc.)

### src/pages/Search.js
- [ ] Remove unused imports (InputAdornment, List, ListItem, etc.)
- [ ] Remove unused auth methods (followArtist, unfollowArtist, etc.)
- [ ] Fix useEffect dependency warnings

### src/pages/Home.js
- [ ] Remove ~30 unused imports and variables
- [ ] Fix useEffect dependency warnings

### src/pages/InvestorPortal.js
- [ ] Remove ~40 unused MUI imports
- [ ] Fix useEffect dependency: `loadTimeSeriesData`

### src/pages/CampaignWizard.js
- [ ] Remove ~30 unused imports
- [ ] Remove unused `handleStep` function

### src/pages/CuratorInbox.js
- [ ] Remove ~20 unused imports
- [ ] Remove unused state variables
- [ ] Fix useEffect dependency warnings

## Priority 3: Service Files

### src/services/analytics/AnalyticsService.js
- [ ] Line 720: Assign instance to variable before default export

### src/services/analytics/EventValidator.js
- [ ] Line 57: Remove unused `category` variable

### src/services/analytics/PrivacyManager.js
- [ ] Line 272: Remove unused `height` variable

## How to Fix

### Option 1: Auto-fix (Recommended)
```bash
npm run lint -- --fix
```

### Option 2: Manual cleanup
1. Open each file
2. Remove unused imports at the top
3. Remove or use unused variables
4. Fix useEffect dependency arrays

### Option 3: Use IDE
Most IDEs (VS Code, WebStorm) can auto-remove unused imports:
- VS Code: "Organize Imports" (Shift+Alt+O)
- WebStorm: "Optimize Imports" (Ctrl+Alt+O)

## Notes

- These are **warnings**, not errors
- The build succeeds despite these warnings
- Fixing these improves:
  - Bundle size (smaller JavaScript)
  - Code maintainability
  - IDE performance
  - Future debugging

## Status

- [ ] Priority 1 files cleaned
- [ ] Priority 2 files cleaned
- [ ] Priority 3 files cleaned
- [ ] All ESLint warnings resolved
