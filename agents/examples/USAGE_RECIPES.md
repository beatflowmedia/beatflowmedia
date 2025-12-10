# BeatFlow Agents - Usage Recipes

**Version:** 2.1.0

Common patterns and recipes for using BeatFlow agents in real-world scenarios.

---

## Table of Contents

1. [Content Upload Workflow](#content-upload-workflow)
2. [Daily Analytics Report](#daily-analytics-report)
3. [Smart Recommendations](#smart-recommendations)
4. [Automated Moderation Pipeline](#automated-moderation-pipeline)
5. [Multi-Channel Notifications](#multi-channel-notifications)
6. [Batch Content Processing](#batch-content-processing)
7. [User Onboarding Flow](#user-onboarding-flow)
8. [Content Discovery Engine](#content-discovery-engine)
9. [Compliance Monitoring](#compliance-monitoring)
10. [Performance Monitoring](#performance-monitoring)

---

## Content Upload Workflow

**Scenario:** User uploads a new track - validate, moderate, and notify

```javascript
const { ContentIngestionAgent, ModerationAgent, NotificationAgent } = require('./agents/experts');

async function handleContentUpload(file, metadata, userId) {
  console.log(`📥 Processing upload from user ${userId}`);

  // Step 1: Ingest and validate
  const ingestionAgent = new ContentIngestionAgent();
  await ingestionAgent.initialize();

  const fileInfo = {
    filePath: file.path,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type
  };

  const ingestionResult = await ingestionAgent.processFile(
    fileInfo,
    metadata,
    { profile: 'standard' }
  );

  if (ingestionResult.status !== 'validated') {
    // Notify user of failure
    const notificationAgent = new NotificationAgent();
    await notificationAgent.initialize();

    await notificationAgent.sendNotification({
      recipients: userId,
      type: 'alert',
      category: 'content',
      title: 'Upload Failed',
      message: `Your upload "${metadata.title}" failed validation. ${ingestionResult.errors.join(', ')}`,
      priority: 'high',
      channels: ['email', 'push', 'inApp']
    });

    throw new Error('Ingestion failed');
  }

  // Step 2: Moderate content
  const moderationAgent = new ModerationAgent({ strictMode: false });
  await moderationAgent.initialize();

  const moderationResult = await moderationAgent.moderateContent({
    contentType: 'track',
    content: {
      id: generateId(),
      ...metadata,
      ...ingestionResult.extractedMetadata
    },
    submittedBy: userId
  });

  // Step 3: Handle moderation decision
  const notificationAgent = new NotificationAgent();
  await notificationAgent.initialize();

  switch (moderationResult.decision) {
    case 'approved':
      // Publish content and notify
      await publishContent(metadata, ingestionResult);

      await notificationAgent.sendNotification({
        recipients: userId,
        type: 'update',
        category: 'content',
        title: '✅ Content Published',
        message: `Your track "${metadata.title}" is now live!`,
        priority: 'normal',
        channels: ['push', 'inApp'],
        actionUrl: `/track/${metadata.id}`,
        actionLabel: 'View Track'
      });
      break;

    case 'flagged':
      // Queue for human review
      await queueForReview(moderationResult);

      await notificationAgent.sendNotification({
        recipients: userId,
        type: 'update',
        category: 'content',
        title: '🔍 Content Under Review',
        message: `Your track "${metadata.title}" is being reviewed. We'll notify you once complete.`,
        priority: 'normal',
        channels: ['email', 'inApp']
      });
      break;

    case 'rejected':
      // Reject and explain
      await notificationAgent.sendNotification({
        recipients: userId,
        type: 'alert',
        category: 'content',
        title: '❌ Content Rejected',
        message: `Your track "${metadata.title}" was rejected. Reason: ${moderationResult.violations[0]?.message}`,
        priority: 'high',
        channels: ['email', 'push', 'inApp']
      });
      break;
  }

  // Cleanup
  await ingestionAgent.cleanup();
  await moderationAgent.cleanup();
  await notificationAgent.cleanup();

  return {
    ingestion: ingestionResult,
    moderation: moderationResult
  };
}
```

**Usage:**
```bash
# CLI equivalent
node agents/cli.js ingest file "track.mp3" --title "My Song" --profile standard
node agents/cli.js moderate review --content-id track123
node agents/cli.js notify send --recipient user123 --title "Upload Complete" --message "Your track is live!"
```

---

## Daily Analytics Report

**Scenario:** Generate and email daily analytics summary

```javascript
const { AnalyticsAgent, NotificationAgent } = require('./agents/experts');
const cron = require('node-cron');

// Run every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('📊 Generating daily analytics report...');

  const analyticsAgent = new AnalyticsAgent();
  await analyticsAgent.initialize();

  // Analyze yesterday's data
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const analysisResult = await analyticsAgent.analyze({
    source: 'firestore',
    timeRange: 'yesterday',
    focus: 'all'
  });

  // Generate insights summary
  const summary = generateSummary(analysisResult);

  // Send to admin team
  const notificationAgent = new NotificationAgent();
  await notificationAgent.initialize();

  await notificationAgent.sendNotification({
    recipients: ['admin@beatflow.com', 'analytics@beatflow.com'],
    type: 'update',
    category: 'account',
    title: `📊 Daily Analytics - ${yesterday.toDateString()}`,
    message: summary,
    priority: 'normal',
    channels: ['email'],
    data: {
      report: analysisResult,
      charts: generateCharts(analysisResult)
    }
  });

  await analyticsAgent.cleanup();
  await notificationAgent.cleanup();

  console.log('✅ Daily report sent');
});

function generateSummary(analysis) {
  return `
Daily Analytics Summary

📊 Events Analyzed: ${analysis.eventsAnalyzed}
🎵 Tracks Played: ${analysis.metrics.playback.totalPlays}
👥 Active Users: ${analysis.metrics.engagement.activeUsers}
💰 Revenue: $${analysis.metrics.revenue.totalRoyalties}

🔍 Key Insights:
${analysis.insights.map(i => `- ${i.message}`).join('\n')}

📈 Recommendations:
${analysis.recommendations.map(r => `- ${r.message}`).join('\n')}

⚠️ Alerts: ${analysis.alerts.length}
  `;
}
```

**Usage:**
```bash
# Manual run
npm run agents:analytics -- --focus all

# Schedule in crontab
0 9 * * * cd /path/to/project && npm run agents:analytics
```

---

## Smart Recommendations

**Scenario:** Generate personalized homepage recommendations

```javascript
const { RecommendationAgent } = require('./agents/experts');

class RecommendationService {
  constructor() {
    this.agent = null;
    this.cache = new Map();
    this.cacheTTL = 300000; // 5 minutes
  }

  async initialize() {
    this.agent = new RecommendationAgent({
      algorithm: 'hybrid',
      diversityFactor: 0.3,
      maxRecommendations: 50
    });
    await this.agent.initialize();
  }

  async getRecommendations(userId, context = 'home', limit = 20) {
    const cacheKey = `${userId}:${context}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.recommendations;
      }
    }

    // Generate fresh recommendations
    const result = await this.agent.generateRecommendations({
      userId,
      context,
      limit
    });

    // Cache results
    this.cache.set(cacheKey, {
      recommendations: result.recommendations,
      timestamp: Date.now()
    });

    return result.recommendations;
  }

  async trackClick(userId, trackId) {
    await this.agent.trackInteraction(userId, trackId, 'click');

    // Invalidate cache to get fresh recommendations
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.cache.delete(key);
      }
    }
  }

  async trackPlay(userId, trackId) {
    await this.agent.trackInteraction(userId, trackId, 'play');
  }

  async trackComplete(userId, trackId) {
    await this.agent.trackInteraction(userId, trackId, 'complete');
  }

  async cleanup() {
    if (this.agent) {
      await this.agent.cleanup();
    }
    this.cache.clear();
  }
}

// Express.js integration
const express = require('express');
const app = express();
const recService = new RecommendationService();

app.get('/api/recommendations', async (req, res) => {
  try {
    const { userId, context, limit } = req.query;

    const recommendations = await recService.getRecommendations(
      userId,
      context || 'home',
      parseInt(limit) || 20
    );

    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/recommendations/track', async (req, res) => {
  try {
    const { userId, trackId, interaction } = req.body;

    switch (interaction) {
      case 'click':
        await recService.trackClick(userId, trackId);
        break;
      case 'play':
        await recService.trackPlay(userId, trackId);
        break;
      case 'complete':
        await recService.trackComplete(userId, trackId);
        break;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Usage:**
```bash
# Generate recommendations
curl http://localhost:3000/api/recommendations?userId=user123&limit=10

# Track interaction
curl -X POST http://localhost:3000/api/recommendations/track \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","trackId":"track456","interaction":"click"}'
```

---

## Automated Moderation Pipeline

**Scenario:** Continuously moderate new content submissions

```javascript
const { ModerationAgent, NotificationAgent } = require('./agents/experts');
const { Firestore } = require('@google-cloud/firestore');

class ModerationPipeline {
  constructor() {
    this.moderationAgent = null;
    this.notificationAgent = null;
    this.db = new Firestore();
  }

  async initialize() {
    this.moderationAgent = new ModerationAgent({
      strictMode: false,
      autoApprove: false
    });

    this.notificationAgent = new NotificationAgent();

    await this.moderationAgent.initialize();
    await this.notificationAgent.initialize();
  }

  async start() {
    console.log('🛡️ Starting moderation pipeline...');

    // Watch for new submissions
    this.db.collection('submissions')
      .where('status', '==', 'pending')
      .onSnapshot(async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type === 'added') {
            await this.moderateSubmission(change.doc);
          }
        }
      });
  }

  async moderateSubmission(doc) {
    const submission = doc.data();
    console.log(`🔍 Moderating submission: ${submission.id}`);

    try {
      const result = await this.moderationAgent.moderateContent({
        contentType: submission.type,
        content: submission.content,
        submittedBy: submission.userId
      });

      // Update submission status
      await doc.ref.update({
        status: result.decision,
        moderationResult: result,
        moderatedAt: new Date()
      });

      // Notify user
      await this.notifyUser(submission, result);

      // If flagged, notify moderators
      if (result.reviewRequired) {
        await this.notifyModerators(submission, result);
      }

    } catch (error) {
      console.error('Moderation error:', error);
      await doc.ref.update({
        status: 'error',
        error: error.message
      });
    }
  }

  async notifyUser(submission, result) {
    const messages = {
      approved: `Your ${submission.type} "${submission.content.title}" has been approved!`,
      flagged: `Your ${submission.type} "${submission.content.title}" is under review.`,
      rejected: `Your ${submission.type} "${submission.content.title}" was rejected. ${result.violations[0]?.message}`
    };

    await this.notificationAgent.sendNotification({
      recipients: submission.userId,
      type: result.decision === 'approved' ? 'update' : 'alert',
      category: 'content',
      title: `Content ${result.decision.charAt(0).toUpperCase() + result.decision.slice(1)}`,
      message: messages[result.decision],
      priority: result.decision === 'rejected' ? 'high' : 'normal'
    });
  }

  async notifyModerators(submission, result) {
    await this.notificationAgent.sendNotification({
      recipients: ['moderator@beatflow.com'],
      type: 'alert',
      category: 'content',
      title: '🚩 Content Flagged for Review',
      message: `Submission ${submission.id} requires human review. ${result.flags.length} flags, ${result.violations.length} violations.`,
      priority: 'high',
      channels: ['email', 'push'],
      actionUrl: `/admin/moderation/${submission.id}`,
      actionLabel: 'Review Now'
    });
  }
}

// Start pipeline
const pipeline = new ModerationPipeline();
await pipeline.initialize();
await pipeline.start();
```

---

## Multi-Channel Notifications

**Scenario:** Send notifications with user preference handling

```javascript
const { NotificationAgent } = require('./agents/experts');

class NotificationService {
  constructor() {
    this.agent = new NotificationAgent({
      enableEmail: true,
      enableSMS: true,
      enablePush: true,
      enableInApp: true,
      batchingEnabled: true,
      throttlingEnabled: true
    });
  }

  async initialize() {
    await this.agent.initialize();
  }

  async sendWelcomeEmail(userId, userName) {
    return await this.agent.sendNotification({
      recipients: userId,
      type: 'system',
      category: 'account',
      title: `Welcome to BeatFlow, ${userName}!`,
      message: `Get started by exploring our music catalog and creating your first playlist.`,
      priority: 'normal',
      channels: ['email', 'inApp'],
      actionUrl: '/explore',
      actionLabel: 'Start Exploring'
    });
  }

  async sendNewReleaseAlert(userIds, track) {
    return await this.agent.sendNotification({
      recipients: userIds,
      type: 'update',
      category: 'content',
      title: `🎵 New Release: ${track.title}`,
      message: `${track.artist} just released "${track.title}". Listen now!`,
      priority: 'normal',
      channels: ['push', 'inApp'],
      imageUrl: track.coverArt,
      actionUrl: `/track/${track.id}`,
      actionLabel: 'Listen Now'
    });
  }

  async sendPlaylistUpdate(userId, playlistName, trackCount) {
    return await this.agent.sendNotification({
      recipients: userId,
      type: 'update',
      category: 'content',
      title: `Playlist Updated`,
      message: `Your playlist "${playlistName}" now has ${trackCount} tracks.`,
      priority: 'low',
      channels: ['inApp']
    });
  }

  async sendPaymentNotification(userId, amount, period) {
    return await this.agent.sendNotification({
      recipients: userId,
      type: 'update',
      category: 'revenue',
      title: `💰 Royalty Payment Received`,
      message: `You've earned $${amount} for ${period}. Payment processed successfully.`,
      priority: 'high',
      channels: ['email', 'push', 'inApp'],
      actionUrl: '/dashboard/payments',
      actionLabel: 'View Details'
    });
  }

  async sendSecurityAlert(userId, event) {
    return await this.agent.sendNotification({
      recipients: userId,
      type: 'alert',
      category: 'account',
      title: '🔒 Security Alert',
      message: `${event} detected on your account. If this wasn't you, secure your account immediately.`,
      priority: 'high',
      channels: ['email', 'sms', 'push', 'inApp'],
      actionUrl: '/settings/security',
      actionLabel: 'Secure Account'
    });
  }

  async sendBulkPromotion(userIds, campaign) {
    // Batch send to avoid rate limits
    const batches = chunkArray(userIds, 100);

    for (const batch of batches) {
      await this.agent.batchSend(
        batch.map(userId => ({
          recipients: userId,
          type: 'promotional',
          category: 'content',
          title: campaign.title,
          message: campaign.message,
          priority: 'low',
          channels: ['email'],
          imageUrl: campaign.image,
          actionUrl: campaign.url,
          actionLabel: campaign.cta
        }))
      );

      // Rate limiting
      await sleep(1000);
    }
  }
}

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## Batch Content Processing

**Scenario:** Process an entire music library

```javascript
const { ContentIngestionAgent } = require('./agents/experts');
const path = require('path');

async function processLibrary(libraryPath) {
  const agent = new ContentIngestionAgent();
  await agent.initialize();

  console.log(`📚 Processing library: ${libraryPath}`);

  const batchResult = await agent.batchProcess(libraryPath, {
    profile: 'music-focus',
    recursive: true,
    filePattern: '*.mp3'
  });

  console.log(`
✅ Batch Processing Complete

📊 Summary:
  Total Files: ${batchResult.total}
  Processed: ${batchResult.processed}
  Failed: ${batchResult.failed}
  Success Rate: ${((batchResult.processed / batchResult.total) * 100).toFixed(1)}%

  `);

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    library: libraryPath,
    ...batchResult,
    failedFiles: batchResult.sessions
      .filter(s => s.status !== 'validated')
      .map(s => ({
        file: s.fileInfo.fileName,
        errors: s.errors
      }))
  };

  // Save report
  await agent.writeFile(
    `batch-report-${Date.now()}.json`,
    JSON.stringify(report, null, 2)
  );

  await agent.cleanup();

  return batchResult;
}

// Usage
processLibrary('/path/to/music/library');
```

**Usage:**
```bash
# CLI equivalent
npm run agents:ingest:batch -- /path/to/music --profile music-focus
```

---

## User Onboarding Flow

**Scenario:** Complete onboarding with personalization

```javascript
const { RecommendationAgent, NotificationAgent } = require('./agents/experts');

async function onboardNewUser(userId, preferences) {
  console.log(`👋 Onboarding user: ${userId}`);

  // Step 1: Create user profile with preferences
  await createUserProfile(userId, preferences);

  // Step 2: Generate initial recommendations
  const recAgent = new RecommendationAgent();
  await recAgent.initialize();

  const recommendations = await recAgent.generateRecommendations({
    userId,
    context: 'onboarding',
    limit: 30
  });

  // Step 3: Create starter playlist
  const playlist = await createPlaylist(userId, {
    name: 'Welcome to BeatFlow',
    description: 'Handpicked tracks just for you',
    tracks: recommendations.recommendations.slice(0, 15).map(r => r.trackId)
  });

  // Step 4: Send welcome notification
  const notifAgent = new NotificationAgent();
  await notifAgent.initialize();

  await notifAgent.sendNotification({
    recipients: userId,
    type: 'system',
    category: 'account',
    title: '🎉 Welcome to BeatFlow!',
    message: `We've created a personalized playlist for you based on your preferences. Enjoy!`,
    priority: 'normal',
    channels: ['email', 'push', 'inApp'],
    actionUrl: `/playlist/${playlist.id}`,
    actionLabel: 'Listen Now'
  });

  // Step 5: Schedule follow-up notifications
  await notifAgent.scheduleNotification({
    recipients: userId,
    type: 'update',
    category: 'content',
    title: 'Discover More Music',
    message: 'Check out our new releases and trending tracks!',
    channels: ['push', 'inApp']
  }, getTimestamp('+3 days'));

  await recAgent.cleanup();
  await notifAgent.cleanup();

  console.log(`✅ Onboarding complete for ${userId}`);
}

function getTimestamp(offset) {
  const date = new Date();
  // Parse offset like "+3 days"
  const [value, unit] = offset.match(/([+-]?\d+)\s*(\w+)/).slice(1);

  if (unit === 'days') date.setDate(date.getDate() + parseInt(value));
  if (unit === 'hours') date.setHours(date.getHours() + parseInt(value));

  return date.toISOString();
}
```

---

## More Recipes

For additional examples, see:
- `/agents/examples/content-workflow.js`
- `/agents/examples/analytics-dashboard.js`
- `/agents/examples/notification-templates.js`
- `/agents/examples/recommendation-tuning.js`

---

**Generated by BeatFlow Agents**
**Version:** 2.1.0
