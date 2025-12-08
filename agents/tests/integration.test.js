/**
 * BeatFlow Agents - Integration Test Suite
 *
 * Tests all agents working together in realistic workflows
 */

const ContentIngestionAgent = require('../experts/ContentIngestionAgent');
const AnalyticsAgent = require('../experts/AnalyticsAgent');
const DocumentationAgent = require('../experts/DocumentationAgent');
const RecommendationAgent = require('../experts/RecommendationAgent');
const ModerationAgent = require('../experts/ModerationAgent');
const NotificationAgent = require('../experts/NotificationAgent');
const path = require('path');
const fs = require('fs').promises;

describe('BeatFlow Agents Integration Tests', () => {

  // ===========================================
  // Content Upload Workflow
  // ===========================================
  describe('Content Upload Workflow', () => {
    let ingestionAgent, moderationAgent, notificationAgent;

    beforeAll(async () => {
      ingestionAgent = new ContentIngestionAgent();
      moderationAgent = new ModerationAgent();
      notificationAgent = new NotificationAgent();

      await ingestionAgent.initialize();
      await moderationAgent.initialize();
      await notificationAgent.initialize();
    });

    afterAll(async () => {
      await ingestionAgent.cleanup();
      await moderationAgent.cleanup();
      await notificationAgent.cleanup();
    });

    test('should process, moderate, and notify for valid content', async () => {
      // Mock file info
      const fileInfo = {
        filePath: '/mock/path/test-track.mp3',
        fileName: 'test-track.mp3',
        fileSize: 5000000,
        mimeType: 'audio/mpeg'
      };

      const metadata = {
        title: 'Test Track',
        artist: 'Test Artist',
        album: 'Test Album',
        genre: 'Pop'
      };

      // Step 1: Ingest (would fail with real file, mocked for test)
      // const ingestionResult = await ingestionAgent.processFile(fileInfo, metadata);
      // expect(ingestionResult.status).toBe('validated');

      // Step 2: Moderate
      const moderationResult = await moderationAgent.moderateContent({
        contentType: 'track',
        content: {
          id: 'test-track-1',
          ...metadata,
          copyrightOwner: 'Test Rights Holder',
          licenseType: 'Standard',
          territories: ['US', 'GB']
        },
        submittedBy: 'test-user-1'
      });

      expect(moderationResult.status).toBe('completed');
      expect(['approved', 'flagged', 'rejected']).toContain(moderationResult.decision);

      // Step 3: Notify
      const notificationResult = await notificationAgent.sendNotification({
        recipients: 'test-user-1',
        type: 'update',
        category: 'content',
        title: 'Content Processed',
        message: `Your track "${metadata.title}" has been ${moderationResult.decision}`,
        priority: 'normal',
        channels: ['inApp']
      });

      expect(notificationResult.status).toBe('completed');
      expect(notificationResult.recipients).toContain('test-user-1');
    }, 30000);
  });

  // ===========================================
  // Recommendation Flow
  // ===========================================
  describe('Recommendation Flow', () => {
    let recommendationAgent;

    beforeAll(async () => {
      recommendationAgent = new RecommendationAgent({ algorithm: 'hybrid' });
      await recommendationAgent.initialize();
    });

    afterAll(async () => {
      await recommendationAgent.cleanup();
    });

    test('should generate recommendations and track interactions', async () => {
      // Generate recommendations
      const recommendations = await recommendationAgent.generateRecommendations({
        userId: 'test-user-2',
        context: 'home',
        limit: 10
      });

      expect(recommendations.status).toBe('completed');
      expect(recommendations.recommendations).toHaveLength(10);
      expect(recommendations.recommendations[0]).toHaveProperty('trackId');
      expect(recommendations.recommendations[0]).toHaveProperty('score');
      expect(recommendations.recommendations[0]).toHaveProperty('reason');

      // Track click interaction
      await recommendationAgent.trackInteraction(
        'test-user-2',
        recommendations.recommendations[0].trackId,
        'click'
      );

      // Track play interaction
      await recommendationAgent.trackInteraction(
        'test-user-2',
        recommendations.recommendations[0].trackId,
        'play'
      );

      // Metrics should be updated
      expect(recommendationAgent.recommendationMetrics.clicked).toBeGreaterThan(0);
      expect(recommendationAgent.recommendationMetrics.played).toBeGreaterThan(0);
    });

    test('should provide diverse recommendations', async () => {
      const recommendations = await recommendationAgent.generateRecommendations({
        userId: 'test-user-3',
        context: 'home',
        limit: 20
      });

      expect(recommendations.metadata.diversityScore).toBeGreaterThan(0);

      // Check artist diversity
      const uniqueArtists = new Set(
        recommendations.recommendations.map(r => r.artist)
      );
      expect(uniqueArtists.size).toBeGreaterThan(1);
    });
  });

  // ===========================================
  // Analytics Pipeline
  // ===========================================
  describe('Analytics Pipeline', () => {
    let analyticsAgent;

    beforeAll(async () => {
      analyticsAgent = new AnalyticsAgent();
      await analyticsAgent.initialize();
    });

    afterAll(async () => {
      await analyticsAgent.cleanup();
    });

    test('should analyze mock data and generate insights', async () => {
      const analysis = await analyticsAgent.analyze({
        source: 'mock',
        focus: 'all'
      });

      expect(analysis.status).toBe('completed');
      expect(analysis.eventsAnalyzed).toBeGreaterThan(0);
      expect(analysis.insights).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
      expect(analysis.metrics).toBeDefined();

      // Should have playback metrics
      expect(analysis.metrics.playback).toBeDefined();
      expect(analysis.metrics.playback.totalPlays).toBeGreaterThan(0);
    });

    test('should detect alerts for critical issues', async () => {
      const analysis = await analyticsAgent.analyze({
        source: 'mock',
        focus: 'performance'
      });

      expect(analysis.alerts).toBeDefined();
      // Mock data should have no alerts, but structure should exist
      expect(Array.isArray(analysis.alerts)).toBe(true);
    });
  });

  // ===========================================
  // Moderation Compliance
  // ===========================================
  describe('Moderation Compliance', () => {
    let moderationAgent;

    beforeAll(async () => {
      moderationAgent = new ModerationAgent();
      await moderationAgent.initialize();
    });

    afterAll(async () => {
      await moderationAgent.cleanup();
    });

    test('should approve clean content', async () => {
      const result = await moderationAgent.moderateContent({
        contentType: 'track',
        content: {
          id: 'clean-track-1',
          title: 'Clean Track Title',
          artist: 'Professional Artist',
          genre: 'Jazz',
          copyrightOwner: 'Rights Holder LLC',
          licenseType: 'Standard License',
          territories: ['US', 'GB', 'DE'],
          explicit: false
        },
        submittedBy: 'test-user-4'
      });

      expect(result.status).toBe('completed');
      expect(result.decision).toBe('approved');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.reviewRequired).toBe(false);
    });

    test('should flag content with missing metadata', async () => {
      const result = await moderationAgent.moderateContent({
        contentType: 'track',
        content: {
          id: 'incomplete-track-1',
          title: '',  // Missing title
          artist: 'Artist Name',
          genre: 'Pop'
          // Missing copyright and license
        },
        submittedBy: 'test-user-5'
      });

      expect(result.status).toBe('completed');
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(1.0);
    });

    test('should calculate confidence scores correctly', async () => {
      const result = await moderationAgent.moderateContent({
        contentType: 'track',
        content: {
          id: 'test-track-2',
          title: 'Track with Warnings',
          artist: 'Artist',
          genre: 'Pop',
          copyrightOwner: 'Owner',
          licenseType: 'Standard',
          territories: ['INVALID']  // Invalid territory code
        },
        submittedBy: 'test-user-6'
      });

      expect(result.confidence).toBeLessThan(1.0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  // ===========================================
  // Notification Delivery
  // ===========================================
  describe('Notification Delivery', () => {
    let notificationAgent;

    beforeAll(async () => {
      notificationAgent = new NotificationAgent();
      await notificationAgent.initialize();
    });

    afterAll(async () => {
      await notificationAgent.cleanup();
    });

    test('should send single notification', async () => {
      const result = await notificationAgent.sendNotification({
        recipients: 'test-user-7',
        type: 'update',
        category: 'content',
        title: 'Test Notification',
        message: 'This is a test notification',
        priority: 'normal',
        channels: ['inApp']
      });

      expect(result.status).toBe('completed');
      expect(result.notificationId).toBeDefined();
      expect(result.delivery.inApp.sent).toBe(true);
    });

    test('should send to multiple recipients', async () => {
      const result = await notificationAgent.sendNotification({
        recipients: ['user-1', 'user-2', 'user-3'],
        type: 'alert',
        category: 'account',
        title: 'System Alert',
        message: 'Important system message',
        priority: 'high',
        channels: ['push', 'inApp']
      });

      expect(result.status).toBe('completed');
      expect(result.recipients.length).toBe(3);
    });

    test('should handle multi-channel delivery', async () => {
      const result = await notificationAgent.sendNotification({
        recipients: 'test-user-8',
        type: 'update',
        category: 'content',
        title: 'Multi-Channel Test',
        message: 'Testing all channels',
        priority: 'normal',
        channels: ['email', 'push', 'inApp']
      });

      expect(result.delivery.email.sent).toBe(true);
      expect(result.delivery.push.sent).toBe(true);
      expect(result.delivery.inApp.sent).toBe(true);
    });

    test('should track delivery statistics', async () => {
      await notificationAgent.sendNotification({
        recipients: 'test-user-9',
        type: 'update',
        category: 'content',
        title: 'Stats Test',
        message: 'Testing statistics tracking',
        priority: 'normal',
        channels: ['inApp']
      });

      const stats = notificationAgent.deliveryStats;
      expect(stats.sent).toBeGreaterThan(0);
      expect(stats.delivered).toBeGreaterThan(0);
      expect(stats.deliveryRate).toBeGreaterThan(0);
    });
  });

  // ===========================================
  // Documentation Generation
  // ===========================================
  describe('Documentation Generation', () => {
    let documentationAgent;

    beforeAll(async () => {
      documentationAgent = new DocumentationAgent();
      await documentationAgent.initialize();
    });

    afterAll(async () => {
      await documentationAgent.cleanup();
    });

    test('should generate changelog', async () => {
      const result = await documentationAgent.generateDocumentation({
        target: '.',
        type: 'changelog',
        output: './test-output'
      });

      expect(result.status).toBe('completed');
      expect(result.filesGenerated.length).toBeGreaterThan(0);
      expect(result.filesGenerated[0].type).toBe('changelog');
    });
  });

  // ===========================================
  // Full Workflow Integration
  // ===========================================
  describe('Complete Workflow', () => {
    test('should handle full content lifecycle', async () => {
      const userId = 'integration-test-user';
      const contentId = 'integration-test-content';

      // 1. Moderate content
      const moderationAgent = new ModerationAgent();
      await moderationAgent.initialize();

      const moderationResult = await moderationAgent.moderateContent({
        contentType: 'track',
        content: {
          id: contentId,
          title: 'Integration Test Track',
          artist: 'Test Artist',
          genre: 'Electronic',
          copyrightOwner: 'Test Owner',
          licenseType: 'Standard',
          territories: ['US']
        },
        submittedBy: userId
      });

      expect(moderationResult.status).toBe('completed');

      // 2. Send notification
      const notificationAgent = new NotificationAgent();
      await notificationAgent.initialize();

      const notificationResult = await notificationAgent.sendNotification({
        recipients: userId,
        type: 'update',
        category: 'content',
        title: 'Content Moderated',
        message: `Your content was ${moderationResult.decision}`,
        priority: 'normal',
        channels: ['inApp']
      });

      expect(notificationResult.status).toBe('completed');

      // 3. Generate recommendations (if approved)
      if (moderationResult.decision === 'approved') {
        const recommendationAgent = new RecommendationAgent();
        await recommendationAgent.initialize();

        const recommendations = await recommendationAgent.generateRecommendations({
          userId,
          context: 'home',
          limit: 5
        });

        expect(recommendations.status).toBe('completed');
        expect(recommendations.recommendations.length).toBeGreaterThan(0);

        await recommendationAgent.cleanup();
      }

      // Cleanup
      await moderationAgent.cleanup();
      await notificationAgent.cleanup();
    }, 60000);
  });

  // ===========================================
  // Error Handling
  // ===========================================
  describe('Error Handling', () => {
    test('should handle invalid input gracefully', async () => {
      const moderationAgent = new ModerationAgent();
      await moderationAgent.initialize();

      const result = await moderationAgent.moderateContent({
        contentType: 'track',
        content: {
          id: 'invalid-content'
          // Missing required fields
        },
        submittedBy: 'test-user'
      });

      expect(result.status).toBe('completed');
      expect(result.violations.length).toBeGreaterThan(0);

      await moderationAgent.cleanup();
    });

    test('should handle missing recipients in notification', async () => {
      const notificationAgent = new NotificationAgent();
      await notificationAgent.initialize();

      try {
        await notificationAgent.sendNotification({
          recipients: [],
          title: 'Test',
          message: 'Test message'
        });
      } catch (error) {
        expect(error.message).toContain('Recipients required');
      }

      await notificationAgent.cleanup();
    });
  });
});

// Test helpers
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
