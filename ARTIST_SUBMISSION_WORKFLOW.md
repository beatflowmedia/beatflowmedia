# Artist Submission Workflow

## Overview
This document describes the complete workflow for artist music submissions on BeatFlow.

## Architecture

### Collections
- **`artistSubmissions`** - Staging area for pending submissions
- **`songs`** - Published songs visible to users
- **`albums`** - Published albums visible to users

### Workflow States
1. `pending` - Artist submitted, awaiting admin review
2. `under_review` - Admin is currently reviewing
3. `approved` - Admin approved, will be published
4. `published` - Live on platform (songs/albums created)
5. `rejected` - Rejected with feedback for artist

## User Flow

### For Artists
1. Artist purchases $25/year membership via Stripe
2. Artist uploads music via `/for-artists` page:
   - Upload audio files (drag & drop multiple files supported)
   - Enter track metadata (title, genre, explicit, etc.)
   - Add songwriter information (real names, contributions)
   - Upload cover art
   - Specify if AI-generated, cover song, radio edit, etc.
3. Submission saved to `artistSubmissions` collection with `status: "pending"`
4. Artist receives confirmation

### For Admins
1. Admin navigates to `/admin` dashboard
2. Click "Content Ingestion" tab
3. View all submissions in table format:
   - Pending submissions show **Approve** and **Reject** buttons
   - Click Approve → Automatically publishes to platform
   - Click Reject → Enter feedback for artist

## Technical Implementation

### Approval Process (`/.netlify/functions/approve-submission`)
When admin clicks "Approve":
1. Fetch submission from `artistSubmissions` collection
2. If album release:
   - Create document in `albums` collection
   - Set all album metadata (title, artist, cover, etc.)
3. For each track:
   - Create document in `songs` collection
   - Copy all metadata from submission
   - Link to album if applicable
   - Set default price ($2.99)
4. Update submission status to `published`
5. Record approval timestamp and IDs

### Rejection Process (`/.netlify/functions/reject-submission`)
When admin clicks "Reject":
1. Prompt admin for rejection feedback
2. Update submission status to `rejected`
3. Store rejection feedback
4. Record rejection timestamp
5. TODO: Send email notification to artist

## Metadata Captured

### Release Information
- Release type (single/EP/album)
- Album title
- Artist name (stage name)
- Cover art
- Release date
- Record label (default: "BeatFlow Media Group")
- Copyright year & holder

### Track Information
- Title
- Primary genre (1 required)
- Additional genres (up to 4)
- Explicit content flag
- Instrumental/Radio Edit/Cover Song flags
- AI-generated content disclosure
- Language
- Duration (auto-extracted)

### Credits
- Songwriters (real names, not stage names)
  - Name
  - Contribution (music/lyrics/both)
- Composers
- Publishers
- Featured artists
- Remixer
- ISRC code

### Optional Services
- Loudness Normalization ($2.99/track)
  - Only charged if track needs normalization

## Premium Features (Upgrade Required)
- Custom record label (default: BeatFlow Media Group)
- Custom release dates
- Advanced analytics
- Priority review & support

## Files Modified
- `src/pages/ForArtists.js` - Artist upload interface
- `src/components/ContentIngestionDashboard.js` - Admin review interface
- `src/services/contentIngestionService.js` - Frontend service
- `netlify/functions/approve-submission.js` - Approval backend
- `netlify/functions/reject-submission.js` - Rejection backend

## Next Steps / TODOs
1. Add email notifications for rejections
2. Add email notifications for approvals
3. Create artist dashboard to view submission status
4. Add ability to resubmit rejected tracks
5. Implement loudness normalization service
6. Add premium membership upgrade flow
7. Add batch approval functionality
8. Add submission analytics (avg review time, approval rate, etc.)
