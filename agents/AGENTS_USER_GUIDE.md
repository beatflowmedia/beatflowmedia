# BeatFlow Agentic Suite - Complete User Guide

**Version:** 2.0.0
**Last Updated:** December 8, 2025
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Content Ingestion Agent](#content-ingestion-agent)
4. [Analytics Agent](#analytics-agent)
5. [Documentation Agent](#documentation-agent)
6. [UI/UX Expert Agent](#uiux-expert-agent)
7. [Complete Workflows](#complete-workflows)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Overview

The BeatFlow Agentic Suite is a comprehensive collection of AI-powered automation agents for music licensing platform development. These agents handle everything from content validation to analytics analysis to documentation generation.

### Available Agents

| Agent | Purpose | Status |
|-------|---------|--------|
| **Content Ingestion** | File validation, metadata extraction, content processing | ✅ Production Ready |
| **Analytics** | Metrics collection, analysis, intelligent insights | ✅ Production Ready |
| **Documentation** | Automated README, API docs, changelogs | ✅ Production Ready |
| **UI/UX Expert** | Design system validation, accessibility, music UX | ✅ Production Ready |
| **Scaffold** | Component generation with tests and stories | ✅ Available |
| **Test Generation** | Comprehensive test suite generation | ✅ Available |
| **Quality** | Code quality analysis and linting | ✅ Available |
| **Security** | Security audits and compliance | ✅ Available |

### Quick Start

```bash
# View all available commands
npm run agents

# Or directly
node agents/cli.js --help
```

---

## Getting Started

### Installation

All dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### External Dependencies

Some agents require external tools:

**Content Ingestion Agent:**
- **ffmpeg/ffprobe** - For technical metadata extraction
  - Windows: Download from https://ffmpeg.org/
  - Mac: `brew install ffmpeg`
  - Linux: `sudo apt-get install ffmpeg`

**All other agents** work out of the box!

### Configuration

Initialize agent configuration:

```bash
npm run agents:init
```

This creates `beatflow-agents.config.json` with default settings.

---

## Content Ingestion Agent

Automates file validation, metadata extraction, and content processing for audio and video files.

### Features

- ✅ File format validation (MP3, WAV, FLAC, AAC, OGG, MP4, MOV, AVI, MKV)
- ✅ File size validation with format-specific limits
- ✅ Real metadata extraction using music-metadata and ffprobe
- ✅ Technical metadata (bitrate, sample rate, codec, duration)
- ✅ Embedded metadata (ID3 tags, artist, title, album, genre)
- ✅ Music analysis placeholders (BPM, key, mood - requires additional integration)
- ✅ Batch processing support
- ✅ Session management
- ✅ Multiple ingestion profiles

### Supported Formats

**Audio:**
- MP3 (.mp3) - Max 500MB
- WAV (.wav) - Max 1GB
- FLAC (.flac) - Max 1GB
- AAC (.aac, .m4a) - Max 500MB
- OGG (.ogg) - Max 500MB

**Video:**
- MP4 (.mp4) - Max 5GB
- MOV (.mov) - Max 5GB
- AVI (.avi) - Max 5GB
- MKV (.mkv) - Max 5GB

### Usage

#### 1. List Supported Formats

```bash
npm run agents:ingest:formats
```

#### 2. List Ingestion Profiles

```bash
npm run agents:ingest:profiles
```

**Available Profiles:**
- `quick` - Fast validation only (1-2 min)
- `standard` - Validation + basic metadata (3-5 min) **[DEFAULT]**
- `comprehensive` - Full pipeline with all stages (10-15 min)
- `music-focus` - Optimized for audio with music analysis (8-12 min)
- `video-focus` - Optimized for video with transcoding (15-20 min)
- `production` - Complete production pipeline (20-30 min)

#### 3. Validate a File

```bash
# Quick validation
node agents/cli.js ingest validate path/to/song.mp3

# Strict mode validation
node agents/cli.js ingest validate path/to/song.mp3 --strict
```

#### 4. Process a Single File

```bash
# Basic processing
npm run agents:ingest path/to/song.mp3

# With metadata
node agents/cli.js ingest file path/to/song.mp3 \
  --title "My Amazing Song" \
  --artist "Cool Artist" \
  --album "Summer EP" \
  --genre "Electronic"

# With specific profile
node agents/cli.js ingest file path/to/song.mp3 \
  --profile comprehensive \
  --title "My Song"
```

#### 5. Batch Process Files

```bash
# Process all files in directory
node agents/cli.js ingest batch ./uploads

# With specific profile
node agents/cli.js ingest batch ./uploads \
  --profile music-focus \
  --limit 50

# With file pattern
node agents/cli.js ingest batch ./uploads \
  --pattern "**/*.{mp3,wav}" \
  --profile standard
```

### Output

All operations generate detailed reports in `agents/reports/`:
- `content-ingestion-report-{timestamp}.json`

**Report Contents:**
```json
{
  "summary": {
    "totalSessions": 10,
    "successful": 8,
    "failed": 2,
    "pending": 0
  },
  "sessions": [
    {
      "id": "session_123",
      "fileName": "song.mp3",
      "status": "validated",
      "metadata": {
        "title": "My Song",
        "artist": "Artist Name",
        "duration": 240,
        "bitrate": 320,
        "format": "MP3"
      }
    }
  ]
}
```

### Metadata Extracted

**Technical:**
- Format, duration, bitrate
- Sample rate, channels, codec
- File size
- For video: resolution, frame rate, aspect ratio

**Embedded (ID3 Tags):**
- Title, artist, album, album artist
- Genre, year, track number
- Composer, publisher, copyright
- ISRC, lyrics
- Cover art (format, size, description)

**Music Analysis (Placeholder):**
- BPM, musical key, time signature
- Mood, energy, danceability
- Note: Requires essentia.js or external API integration

---

## Analytics Agent

Intelligent analytics collection, processing, and reporting with automated insights and recommendations.

### Features

- ✅ Event collection with priority-based buffering
- ✅ Schema validation for compliance
- ✅ Real-time metrics aggregation
- ✅ Playback, engagement, performance, revenue analysis
- ✅ Automated insights generation
- ✅ Intelligent recommendations
- ✅ Alert system for critical issues
- ✅ Multiple export formats (JSON, Markdown, CSV)
- ✅ Royalty tracking with configurable precision

### Event Categories

**Playback Events:**
- play_start, play_end, play_pause, play_resume
- seek, track_complete

**Engagement Events:**
- session_start, session_end
- like_track, playlist_create, share_track

**Performance Events:**
- buffer_event, error_event, quality_change

**Business Events:**
- royalty_calculation, payment_event
- subscription_change

### Usage

#### 1. Analyze with Mock Data (Demo)

```bash
# Full analysis
npm run agents:analytics

# Focus on specific area
npm run agents:analytics:playback
npm run agents:analytics:engagement
npm run agents:analytics:revenue
```

#### 2. Analyze from Data File

```bash
node agents/cli.js analytics analyze \
  --source file \
  --file ./analytics-export.json \
  --focus all \
  --format markdown \
  --save
```

**Data File Format:**
```json
{
  "events": [
    {
      "category": "playback",
      "type": "play_start",
      "data": {
        "user_id": "user_123",
        "track_id": "track_456",
        "session_id": "session_789",
        "timestamp": 1234567890000
      },
      "priority": "high"
    }
  ]
}
```

#### 3. View Metrics Summary

```bash
node agents/cli.js analytics metrics
```

### Analysis Focus Areas

**Playback Analysis:**
- Completion rate monitoring
- Track diversity assessment
- Play pattern analysis
- Recommendations for content improvement

**Engagement Analysis:**
- Session duration tracking
- Engagement rate calculation
- User retention analysis
- Recommendations for interaction improvements

**Performance Analysis:**
- Error rate monitoring (threshold: 5%)
- Buffer performance tracking
- Quality change analysis
- Critical alert generation

**Revenue Analysis:**
- Royalty distribution analysis
- Revenue per track/artist
- Territory-based insights
- Monetization recommendations

### Insights & Recommendations

The agent automatically generates:

**Insights:**
```
- [MEDIUM] Average track completion rate (68%) is below target (70%)
- [INFO] Average session duration: 582s is healthy
- [INFO] Engagement rate: 0.42 actions per session
```

**Recommendations:**
```
- IMPROVE_CONTENT_QUALITY
  Actions:
  - Analyze track completion patterns
  - Review user feedback for low-completion tracks
  - Consider improving content discovery algorithms
```

**Alerts:**
```
- [CRITICAL] Error rate (6.2%) exceeds threshold (5%)
  Action Required: IMMEDIATE_INVESTIGATION_REQUIRED
```

### Compliance Features

- ✅ Minimum play duration enforcement (30 seconds for royalty qualification)
- ✅ Royalty precision (4 decimal places)
- ✅ Territory tracking
- ✅ Audit trail ready

---

## Documentation Agent

Automated documentation generation from codebase analysis.

### Features

- ✅ README.md generation from project structure
- ✅ API documentation from functions
- ✅ Component documentation extraction
- ✅ CHANGELOG.md from git history
- ✅ Automatic code analysis
- ✅ Multiple documentation types

### Usage

#### 1. Generate README.md

```bash
# Quick README generation
npm run agents:docs:readme

# With specific target
node agents/cli.js docs readme --target ./src
```

**Generated README includes:**
- Project title and description (from package.json)
- Features summary (component/function count)
- Installation instructions
- Usage examples (from npm scripts)
- Component list
- API reference
- Configuration guide
- Contributing guidelines
- License information

#### 2. Generate Complete Documentation

```bash
# All documentation types
npm run agents:docs:all

# Specific type
node agents/cli.js docs generate --type api --output ./docs
node agents/cli.js docs generate --type component --output ./docs
```

**Documentation Types:**
- `readme` - Project README.md
- `api` - API documentation for functions
- `component` - React component documentation
- `changelog` - Git history changelog
- `all` - Generate everything

#### 3. Generate CHANGELOG.md

```bash
# From git history
npm run agents:docs:changelog

# With custom output
node agents/cli.js docs changelog --output ./docs
```

### Output

**README.md Example:**
```markdown
# music-license-app

A BeatFlow music licensing platform

## Features

- 150 React components
- 75 utility functions
- 20 classes

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm run start  # react-scripts start
npm run build  # react-scripts build
\`\`\`

## Components

- **MusicPlayer** - MusicPlayer.js
- **PlaylistView** - PlaylistView.js
...
```

**API Documentation Example:**
```markdown
# helpers.js API Documentation

## formatDuration()

**File:** `src/utils/helpers.js`

### Description

Function implementation for formatDuration

### Usage

\`\`\`javascript
import { formatDuration } from './helpers';

const result = formatDuration();
\`\`\`
```

---

## UI/UX Expert Agent

Comprehensive UI/UX analysis including design system validation, WCAG accessibility, and music-specific UX patterns.

### Features (From Previous Implementation)

- ✅ Design system validation (133 violations found)
- ✅ WCAG 2.1 AA/AAA accessibility checking (174 issues found)
- ✅ Music UX pattern analysis (207 issues found)
- ✅ Auto-remediation capability
- ✅ Multiple analysis profiles
- ✅ CI/CD integration

### Usage

```bash
# Full UI/UX review
npm run agents:uiux

# Quick accessibility scan
npm run agents:uiux:quick

# Design token validation + auto-fix
npm run agents:uiux:tokens

# Comprehensive analysis
npm run agents:uiux:comprehensive
```

For complete UI/UX Expert Agent documentation, see: `agents/UIUX_EXPERT_GUIDE.md`

---

## Complete Workflows

### Workflow 1: New Content Upload Pipeline

```bash
# Step 1: Validate the file
node agents/cli.js ingest validate uploads/new-song.mp3

# Step 2: Process with metadata
node agents/cli.js ingest file uploads/new-song.mp3 \
  --title "Summer Vibes" \
  --artist "DJ Cool" \
  --album "Summer 2025" \
  --genre "Electronic" \
  --profile comprehensive

# Step 3: Review ingestion report
cat agents/reports/content-ingestion-report-*.json
```

### Workflow 2: Monthly Analytics Review

```bash
# Step 1: Export analytics from Firestore (manual or scheduled)
# Save to analytics-export.json

# Step 2: Analyze all metrics
node agents/cli.js analytics analyze \
  --source file \
  --file ./analytics-export.json \
  --focus all \
  --format markdown \
  --save

# Step 3: Review insights and recommendations
cat agents/reports/analytics-report-*.md

# Step 4: Focus on revenue
npm run agents:analytics:revenue
```

### Workflow 3: Pre-Release Quality Check

```bash
# Step 1: UI/UX comprehensive review
npm run agents:uiux:comprehensive

# Step 2: Generate fresh documentation
npm run agents:docs:all

# Step 3: Generate changelog
npm run agents:docs:changelog

# Step 4: Security audit
npm run agents:security

# Step 5: Create PR
npm run agents:pr -- --type feat --description "Release v2.0"
```

### Workflow 4: Batch Content Migration

```bash
# Step 1: List ingestion profiles
npm run agents:ingest:profiles

# Step 2: Validate all files first
for file in ./migration-files/*.mp3; do
  node agents/cli.js ingest validate "$file"
done

# Step 3: Batch process with music-focus profile
node agents/cli.js ingest batch ./migration-files \
  --profile music-focus \
  --limit 100

# Step 4: Review batch results
cat agents/reports/content-ingestion-report-*.json
```

---

## Troubleshooting

### Content Ingestion Issues

**Problem:** "ffprobe extraction failed - ensure ffmpeg is installed"

**Solution:**
1. Install ffmpeg: https://ffmpeg.org/
2. Add ffmpeg to system PATH
3. Verify: `ffmpeg -version`

**Problem:** "music-metadata extraction failed"

**Solution:**
1. Check file is not corrupted
2. Ensure file format is supported
3. Try with `--profile quick` for basic validation only

**Problem:** File validation fails with "UNSUPPORTED_FORMAT"

**Solution:**
1. Check supported formats: `npm run agents:ingest:formats`
2. Convert file to supported format
3. Check file extension matches content

### Analytics Issues

**Problem:** No insights generated

**Solution:**
1. Ensure data file has correct format
2. Check events match schema (see event categories)
3. Try with mock data first: `npm run agents:analytics`

**Problem:** "Event validation failed"

**Solution:**
1. Check required fields for event type
2. Ensure timestamp is in milliseconds
3. Validate event schema against `MetricsCollector.js`

### Documentation Issues

**Problem:** Empty or minimal README generated

**Solution:**
1. Ensure package.json exists and has description
2. Check target path contains code files
3. Try with specific target: `--target ./src`

**Problem:** No API docs generated

**Solution:**
1. Ensure functions are exported
2. Check function naming (lowercase start)
3. Add JSDoc comments for better documentation

### General Issues

**Problem:** "Command not found: node agents/cli.js"

**Solution:**
1. Ensure you're in project root directory
2. Check Node.js is installed: `node --version`
3. Use npm scripts instead: `npm run agents:docs`

**Problem:** Permission denied errors

**Solution:**
1. On Unix: `chmod +x agents/cli.js`
2. Or use: `node agents/cli.js` instead of direct execution

---

## Best Practices

### Content Ingestion

1. **Always validate first** before processing
2. **Use appropriate profiles** for your content type
3. **Process in batches** for large volumes
4. **Review reports** after batch processing
5. **Keep ffmpeg updated** for best compatibility

### Analytics

1. **Start with mock data** to understand output
2. **Use focus areas** for specific analysis needs
3. **Save reports** for historical tracking
4. **Review recommendations** before implementing changes
5. **Set up regular analysis** (weekly/monthly)

### Documentation

1. **Generate README** for new projects immediately
2. **Update changelog** before releases
3. **Regenerate docs** after major changes
4. **Keep API docs** in sync with code
5. **Use JSDoc comments** for better auto-docs

### UI/UX

1. **Run pre-commit checks** for critical issues
2. **Use auto-fix** for design token violations
3. **Address WCAG AA** issues before launch
4. **Review music UX** patterns regularly
5. **Monitor accessibility** score trends

### General

1. **Use npm scripts** for common tasks
2. **Check reports directory** regularly
3. **Configure in beatflow-agents.config.json** for custom settings
4. **Run agents in CI/CD** for automated quality gates
5. **Keep agents updated** for new features

---

## Advanced Configuration

### Custom Ingestion Profile

Create `custom-profile.json`:

```json
{
  "name": "custom-profile",
  "config": {
    "strictMode": true,
    "requireMinBitrate": true,
    "minAudioBitrate": 256,
    "extractTechnical": true,
    "extractMusic": true,
    "extractEmbedded": true
  }
}
```

### Analytics Thresholds

Edit `beatflow-agents.config.json`:

```json
{
  "analytics": {
    "errorRateThreshold": 0.03,
    "completionRateThreshold": 0.75,
    "sessionDurationThreshold": 720
  }
}
```

### Documentation Templates

Customize documentation output by modifying `DocumentationAgent.js` templates.

---

## Support & Resources

### Documentation
- This guide: `agents/AGENTS_USER_GUIDE.md`
- UI/UX Guide: `agents/UIUX_EXPERT_GUIDE.md`
- Implementation Summary: `agents/NEW_AGENTS_SUMMARY.md`
- Previous Summary: `agents/IMPLEMENTATION_SUMMARY.md`

### Getting Help
- GitHub Issues: Preferred for bug reports
- Check reports directory for detailed logs
- Enable verbose mode: `--verbose` flag

### Contributing
- Follow existing agent patterns
- Add comprehensive JSDoc comments
- Include error handling
- Test with real data
- Update documentation

---

## Quick Reference

### Most Common Commands

```bash
# Content Ingestion
npm run agents:ingest:formats          # List formats
npm run agents:ingest song.mp3        # Process file
node agents/cli.js ingest batch ./uploads  # Batch process

# Analytics
npm run agents:analytics              # Analyze with mock data
npm run agents:analytics:playback     # Focus on playback
npm run agents:analytics:revenue      # Focus on revenue

# Documentation
npm run agents:docs:readme            # Generate README
npm run agents:docs:changelog         # Generate CHANGELOG
npm run agents:docs:all               # Generate all docs

# UI/UX
npm run agents:uiux                   # Full review
npm run agents:uiux:quick             # Quick accessibility
npm run agents:uiux:tokens            # Design tokens + auto-fix
```

### File Locations

```
agents/
├── cli.js                       # Main CLI entry point
├── core/                        # Core utilities
│   ├── AgentBase.js
│   ├── AudioFileValidator.js
│   ├── MetadataExtractor.js
│   └── MetricsCollector.js
├── experts/                     # Expert agents
│   ├── ContentIngestionAgent.js
│   ├── AnalyticsAgent.js
│   └── DocumentationAgent.js
├── workflows/                   # Workflow configs
│   └── content-ingestion.json
└── reports/                     # Generated reports
    ├── content-ingestion-report-*.json
    ├── analytics-report-*.md
    └── documentation-report-*.json
```

---

**🎉 You're all set to use the BeatFlow Agentic Suite!**

*For updates and new features, check the CHANGELOG.md or git history.*

**Version:** 2.0.0 | **Last Updated:** December 8, 2025
