# BeatFlow Agents - API Reference

**Version:** 2.1.0
**Last Updated:** December 8, 2025

Complete API documentation for all BeatFlow expert agents.

---

## Table of Contents

1. [Content Ingestion Agent](#content-ingestion-agent)
2. [Analytics Agent](#analytics-agent)
3. [Documentation Agent](#documentation-agent)
4. [Recommendation Agent](#recommendation-agent)
5. [Moderation Agent](#moderation-agent)
6. [Notification Agent](#notification-agent)
7. [Base Agent API](#base-agent-api)

---

## Content Ingestion Agent

**File:** `agents/experts/ContentIngestionAgent.js`

### Constructor

```javascript
new ContentIngestionAgent(config)
```

**Parameters:**
- `config.projectRoot` (string) - Project root directory
- `config.strictMode` (boolean) - Enable strict validation (default: false)
- `config.enableVirusScan` (boolean) - Enable virus scanning (default: true)
- `config.enableTranscoding` (boolean) - Enable transcoding (default: false)

### Methods

#### `processFile(fileInfo, metadata, options)`

Process a single file through the ingestion pipeline.

**Parameters:**
```javascript
{
  fileInfo: {
    filePath: string,      // Absolute path to file
    fileName: string,      // File name
    fileSize: number,      // Size in bytes
    mimeType: string       // MIME type
  },
  metadata: {
    title: string,         // Content title
    artist: string,        // Artist name
    album: string,         // Album name (optional)
    genre: string          // Genre (optional)
  },
  options: {
    profile: string        // Ingestion profile (quick|standard|comprehensive)
  }
}
```

**Returns:**
```javascript
{
  status: 'validated' | 'rejected' | 'error',
  sessionId: string,
  stages: {
    validation: { passed: boolean, ... },
    virusScan: { passed: boolean, ... },
    metadataExtraction: { ... }
  },
  errors: Array<string>,
  warnings: Array<string>
}
```

#### `batchProcess(directory, options)`

Process multiple files in a directory.

**Parameters:**
```javascript
{
  directory: string,      // Directory path
  options: {
    profile: string,      // Ingestion profile
    recursive: boolean,   // Recursive directory scan
    filePattern: string   // File pattern filter
  }
}
```

**Returns:**
```javascript
{
  total: number,
  processed: number,
  failed: number,
  sessions: Array<SessionResult>
}
```

### Profiles

**Available Profiles:**
- `quick` - Fast validation only (1-2 min)
- `standard` - Validation + metadata extraction (3-5 min)
- `comprehensive` - Full pipeline including transcoding (10-15 min)
- `music-focus` - Optimized for music files (8-12 min)
- `video-focus` - Optimized for video files (15-20 min)
- `production` - Complete production pipeline (20-30 min)

---

## Analytics Agent

**File:** `agents/experts/AnalyticsAgent.js`

### Constructor

```javascript
new AnalyticsAgent(config)
```

**Parameters:**
- `config.errorRateThreshold` (number) - Error rate alert threshold (default: 0.05)
- `config.completionRateThreshold` (number) - Completion rate target (default: 0.7)
- `config.sessionDurationThreshold` (number) - Session duration target in seconds (default: 600)
- `config.bufferUnderrunThreshold` (number) - Buffer underrun threshold (default: 0.02)

### Methods

#### `analyze(options)`

Analyze analytics data and generate insights.

**Parameters:**
```javascript
{
  source: 'mock' | 'file' | 'firestore',
  sourcePath: string,      // File path (if source='file')
  timeRange: string,       // Time range to analyze
  focus: 'all' | 'playback' | 'engagement' | 'performance' | 'revenue'
}
```

**Returns:**
```javascript
{
  status: 'completed' | 'failed',
  eventsAnalyzed: number,
  insights: Array<Insight>,
  recommendations: Array<Recommendation>,
  anomalies: Array<Anomaly>,
  alerts: Array<Alert>,
  metrics: {
    collection: { ... },
    playback: { ... },
    engagement: { ... },
    performance: { ... },
    revenue: { ... }
  }
}
```

### Event Categories

**Playback Events:**
- `track_start` - Track playback started
- `track_end` - Track playback completed
- `track_pause` - Track paused
- `track_resume` - Track resumed
- `track_skip` - Track skipped

**Engagement Events:**
- `like` - Content liked
- `unlike` - Content unliked
- `playlist_create` - Playlist created
- `playlist_add` - Track added to playlist
- `share` - Content shared

**Performance Events:**
- `buffer_start` - Buffering started
- `buffer_end` - Buffering ended
- `quality_change` - Quality level changed
- `error` - Playback error

**Business Events:**
- `royalty_accrued` - Royalty payment accrued
- `subscription_start` - Subscription started
- `subscription_renew` - Subscription renewed

---

## Documentation Agent

**File:** `agents/experts/DocumentationAgent.js`

### Constructor

```javascript
new DocumentationAgent(config)
```

**Parameters:**
- `config.generateReadme` (boolean) - Generate README.md (default: true)
- `config.generateApiDocs` (boolean) - Generate API docs (default: true)
- `config.generateComponentDocs` (boolean) - Generate component docs (default: true)
- `config.includeExamples` (boolean) - Include code examples (default: true)
- `config.format` (string) - Output format (default: 'markdown')

### Methods

#### `generateDocumentation(options)`

Generate documentation for a project or component.

**Parameters:**
```javascript
{
  target: string,          // Path to document
  type: 'readme' | 'api' | 'component' | 'changelog' | 'all',
  output: string           // Output directory
}
```

**Returns:**
```javascript
{
  status: 'completed' | 'failed',
  filesGenerated: Array<{
    type: string,
    path: string,
    size: number
  }>,
  warnings: Array<string>,
  errors: Array<string>
}
```

---

## Recommendation Agent

**File:** `agents/experts/RecommendationAgent.js`

### Constructor

```javascript
new RecommendationAgent(config)
```

**Parameters:**
- `config.algorithm` (string) - Algorithm type: 'collaborative' | 'content-based' | 'hybrid' (default: 'hybrid')
- `config.maxRecommendations` (number) - Max recommendations to return (default: 20)
- `config.minSimilarityScore` (number) - Minimum similarity threshold (default: 0.3)
- `config.diversityFactor` (number) - Diversity penalty factor 0-1 (default: 0.2)
- `config.enableRealtime` (boolean) - Enable real-time updates (default: true)

### Methods

#### `generateRecommendations(options)`

Generate personalized recommendations for a user.

**Parameters:**
```javascript
{
  userId: string,          // User ID to generate for
  context: 'home' | 'search' | 'playlist' | 'artist',
  limit: number,           // Number of recommendations
  excludeIds: Array<string> // Track IDs to exclude
}
```

**Returns:**
```javascript
{
  status: 'completed' | 'failed',
  userId: string,
  algorithm: string,
  recommendations: Array<{
    trackId: string,
    title: string,
    artist: string,
    score: number,         // 0-10 recommendation score
    confidence: number,    // 0-1 confidence level
    reason: string,        // Human-readable explanation
    factors: {             // Contributing factors
      collaborative: number,
      genre: number,
      artist: number,
      mood: number,
      tempo: number
    }
  }>,
  metadata: {
    totalCandidates: number,
    filteredCount: number,
    diversityScore: number  // 0-1 diversity metric
  }
}
```

#### `trackInteraction(userId, trackId, interactionType)`

Track user interaction with recommended content.

**Parameters:**
```javascript
{
  userId: string,
  trackId: string,
  interactionType: 'click' | 'play' | 'complete'
}
```

**Returns:**
```javascript
{
  success: boolean
}
```

### Algorithms

**Collaborative Filtering:**
- Finds users with similar listening patterns
- Recommends tracks liked by similar users
- Weight: 60% in hybrid mode

**Content-Based Filtering:**
- Matches tracks based on features (genre, mood, tempo)
- Uses user preference profiles
- Weight: 40% in hybrid mode

**Hybrid:**
- Combines both methods
- Provides best overall performance
- Balances personalization with discovery

---

## Moderation Agent

**File:** `agents/experts/ModerationAgent.js`

### Constructor

```javascript
new ModerationAgent(config)
```

**Parameters:**
- `config.strictMode` (boolean) - Reject on high violations (default: false)
- `config.autoApprove` (boolean) - Auto-approve clean content (default: false)
- `config.checkCopyright` (boolean) - Check copyright compliance (default: true)
- `config.checkExplicit` (boolean) - Check explicit content (default: true)
- `config.checkMetadata` (boolean) - Check metadata quality (default: true)
- `config.checkTerritorial` (boolean) - Check territorial restrictions (default: true)

### Methods

#### `moderateContent(options)`

Moderate content and check compliance.

**Parameters:**
```javascript
{
  contentType: 'track' | 'album' | 'playlist' | 'user',
  content: {
    id: string,
    title: string,
    artist: string,
    genre: string,
    explicit: boolean,
    lyrics: string,
    copyrightOwner: string,
    licenseType: string,
    territories: Array<string>,
    isrc: string           // Optional
  },
  submittedBy: string      // User ID
}
```

**Returns:**
```javascript
{
  status: 'completed' | 'failed',
  decision: 'approved' | 'flagged' | 'rejected',
  confidence: number,      // 0-1 confidence score
  reviewRequired: boolean,
  flags: Array<{
    type: string,
    severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH',
    message: string,
    requiresReview: boolean
  }>,
  violations: Array<{
    type: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH',
    field: string,
    message: string
  }>,
  warnings: Array<{
    type: string,
    severity: 'LOW' | 'MEDIUM',
    message: string
  }>
}
```

#### `bulkModerate(contentItems, options)`

Moderate multiple content items.

**Parameters:**
```javascript
{
  contentItems: Array<Content>,
  options: { ... }
}
```

**Returns:**
```javascript
{
  total: number,
  processed: number,
  approved: number,
  flagged: number,
  rejected: number,
  items: Array<ModerationResult>
}
```

### Decision Logic

**Approved:**
- No high severity violations
- Fewer than 3 medium violations
- No flags requiring review

**Flagged:**
- 1+ high severity violations (non-strict mode)
- 3+ medium violations
- Flags requiring human review

**Rejected:**
- High severity violations in strict mode
- Multiple critical compliance failures

**Confidence Score:**
- Starts at 100%
- -10% per violation
- -5% per flag
- -2% per warning

---

## Notification Agent

**File:** `agents/experts/NotificationAgent.js`

### Constructor

```javascript
new NotificationAgent(config)
```

**Parameters:**
- `config.enableEmail` (boolean) - Enable email channel (default: true)
- `config.enableSMS` (boolean) - Enable SMS channel (default: false)
- `config.enablePush` (boolean) - Enable push notifications (default: true)
- `config.enableInApp` (boolean) - Enable in-app notifications (default: true)
- `config.batchingEnabled` (boolean) - Enable batching (default: true)
- `config.batchingInterval` (number) - Batch interval in ms (default: 300000)
- `config.maxPerHour` (number) - Max notifications per user per hour (default: 10)

### Methods

#### `sendNotification(options)`

Send notification to user(s).

**Parameters:**
```javascript
{
  recipients: string | Array<string>,  // User ID(s)
  type: 'alert' | 'update' | 'promotional' | 'system',
  category: 'playback' | 'content' | 'account' | 'revenue',
  title: string,
  message: string,
  priority: 'high' | 'normal' | 'low',
  channels: Array<'email' | 'sms' | 'push' | 'inApp'>,
  imageUrl: string,      // Optional
  actionUrl: string,     // Optional
  actionLabel: string,   // Optional
  data: Object           // Optional additional data
}
```

**Returns:**
```javascript
{
  status: 'completed' | 'partial' | 'failed' | 'skipped',
  notificationId: string,
  recipients: Array<string>,
  channels: Array<string>,
  delivery: {
    email: { sent: boolean, delivered: boolean, messageId: string },
    sms: { sent: boolean, delivered: boolean, messageId: string },
    push: { sent: boolean, delivered: boolean, messageId: string },
    inApp: { sent: boolean, delivered: boolean, messageId: string }
  },
  errors: Array<{
    channel: string,
    error: string
  }>
}
```

#### `batchSend(notifications)`

Send multiple notifications.

**Parameters:**
```javascript
{
  notifications: Array<NotificationOptions>
}
```

**Returns:**
```javascript
{
  total: number,
  sent: number,
  failed: number,
  items: Array<NotificationResult>
}
```

#### `scheduleNotification(options, scheduledTime)`

Schedule notification for future delivery.

**Parameters:**
```javascript
{
  options: NotificationOptions,
  scheduledTime: string   // ISO 8601 timestamp
}
```

**Returns:**
```javascript
{
  notificationId: string,
  scheduledFor: string,
  status: 'scheduled'
}
```

#### `trackInteraction(notificationId, interactionType)`

Track notification interaction.

**Parameters:**
```javascript
{
  notificationId: string,
  interactionType: 'opened' | 'clicked'
}
```

**Returns:**
```javascript
{
  success: boolean
}
```

### User Preferences

Users can configure:
- **Channel Preferences:** Enable/disable email, SMS, push, in-app
- **Category Preferences:** Opt-in/out of categories
- **Frequency:** Immediate vs batched delivery
- **Quiet Hours:** Don't send during specified hours (except high priority)

---

## Base Agent API

**File:** `agents/core/AgentBase.js`

All agents extend AgentBase and inherit these methods.

### Methods

#### `initialize()`

Initialize the agent.

**Returns:** `Promise<void>`

#### `cleanup()`

Cleanup and finalization.

**Returns:** `Promise<void>`

#### `generateReport()`

Generate execution report.

**Returns:** `Object`

#### `saveReport()`

Save report to file.

**Returns:** `Promise<string>` - Report file path

### Properties

- `agentName` (string) - Agent name
- `config` (Object) - Agent configuration
- `logger` (Object) - Logger instance
- `metrics` (Object) - Performance metrics
  - `operations` (number) - Operations completed
  - `errors` (number) - Errors encountered
  - `warnings` (number) - Warnings generated

### Helper Methods

#### `readFile(filePath)`

Read file contents.

**Returns:** `Promise<string>`

#### `writeFile(filePath, content)`

Write file contents.

**Returns:** `Promise<void>`

#### `executeCommand(command)`

Execute shell command.

**Returns:** `Promise<{ success: boolean, stdout: string, stderr: string }>`

#### `generateTimestampedName(prefix, extension)`

Generate timestamped filename.

**Returns:** `string`

---

## CLI Usage

All agents are accessible via CLI:

```bash
# Content Ingestion
node agents/cli.js ingest file <path> [options]
node agents/cli.js ingest batch <dir> [options]
node agents/cli.js ingest validate <path>

# Analytics
node agents/cli.js analytics analyze [options]
node agents/cli.js analytics metrics

# Documentation
node agents/cli.js docs generate [options]
node agents/cli.js docs readme
node agents/cli.js docs changelog

# Recommendations
node agents/cli.js recommend generate --user-id <id> [options]
node agents/cli.js recommend track --user-id <id> --track-id <id> --interaction <type>

# Moderation
node agents/cli.js moderate review --content-id <id> [options]

# Notifications
node agents/cli.js notify send --recipient <id> --title <title> --message <msg> [options]
```

### NPM Scripts

Convenient shortcuts:

```bash
npm run agents:ingest
npm run agents:analytics
npm run agents:docs
npm run agents:recommend
npm run agents:moderate
npm run agents:notify
```

---

## Error Handling

All agents follow consistent error handling:

```javascript
try {
  const result = await agent.methodName(options);
  if (result.status === 'completed') {
    // Success
  } else {
    // Handle error
    console.error(result.error);
  }
} catch (error) {
  // Handle exception
  console.error(error.message);
}
```

---

## Report Format

All agents generate JSON reports in `agents/reports/`:

```javascript
{
  title: string,
  generated: string,      // ISO 8601 timestamp
  agent: string,
  status: string,
  // Agent-specific data
  summary: {
    // Agent-specific summary
  }
}
```

---

## Integration Examples

### Content Upload Workflow

```javascript
const ContentIngestionAgent = require('./agents/experts/ContentIngestionAgent');
const ModerationAgent = require('./agents/experts/ModerationAgent');
const NotificationAgent = require('./agents/experts/NotificationAgent');

async function uploadContent(file, metadata, userId) {
  // 1. Ingest content
  const ingestionAgent = new ContentIngestionAgent();
  await ingestionAgent.initialize();

  const ingestionResult = await ingestionAgent.processFile(
    { filePath: file.path, fileName: file.name, fileSize: file.size, mimeType: file.type },
    metadata,
    { profile: 'standard' }
  );

  if (ingestionResult.status !== 'validated') {
    throw new Error('Content ingestion failed');
  }

  // 2. Moderate content
  const moderationAgent = new ModerationAgent();
  await moderationAgent.initialize();

  const moderationResult = await moderationAgent.moderateContent({
    contentType: 'track',
    content: { ...metadata, ...ingestionResult.extractedMetadata },
    submittedBy: userId
  });

  // 3. Notify user
  const notificationAgent = new NotificationAgent();
  await notificationAgent.initialize();

  if (moderationResult.decision === 'approved') {
    await notificationAgent.sendNotification({
      recipients: userId,
      type: 'update',
      category: 'content',
      title: 'Content Approved',
      message: `Your track "${metadata.title}" has been approved!`,
      priority: 'normal'
    });
  } else if (moderationResult.decision === 'flagged') {
    await notificationAgent.sendNotification({
      recipients: userId,
      type: 'alert',
      category: 'content',
      title: 'Content Under Review',
      message: `Your track "${metadata.title}" is being reviewed by our team.`,
      priority: 'normal'
    });
  }

  return {
    ingestion: ingestionResult,
    moderation: moderationResult
  };
}
```

### Personalized Recommendations

```javascript
const RecommendationAgent = require('./agents/experts/RecommendationAgent');

async function getHomeRecommendations(userId) {
  const agent = new RecommendationAgent({ algorithm: 'hybrid' });
  await agent.initialize();

  const result = await agent.generateRecommendations({
    userId,
    context: 'home',
    limit: 20
  });

  await agent.cleanup();

  return result.recommendations;
}

async function trackRecommendationClick(userId, trackId) {
  const agent = new RecommendationAgent();
  await agent.initialize();

  await agent.trackInteraction(userId, trackId, 'click');

  await agent.cleanup();
}
```

---

## Support

For issues or questions:
- Documentation: `agents/AGENTS_USER_GUIDE.md`
- Examples: `agents/examples/`
- CLI Help: `node agents/cli.js --help`
- GitHub Issues: https://github.com/beatflow/agents/issues

---

**Generated by BeatFlow Documentation Agent**
**Version:** 2.1.0
**Date:** December 8, 2025
