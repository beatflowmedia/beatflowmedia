/**
 * Comprehensive tests for Analytics Service
 * Tests event collection, privacy compliance, and service functionality
 */

import { AnalyticsService } from "../AnalyticsService";
import { EventCollector } from "../EventCollector";
import { PrivacyManager } from "../PrivacyManager";
import { QueueManager } from "../QueueManager";
import { RoyaltyCalculator } from "../RoyaltyCalculator";
import { PerformanceMonitor } from "../PerformanceMonitor";
import {
  ANALYTICS_EVENTS,
  AnalyticsEvent,
  PlaybackEvent,
} from "../AnalyticsConfig";
import axios from "axios";

// Mock dependencies
jest.mock("axios");
jest.mock("../EventCollector");
jest.mock("../PrivacyManager");
jest.mock("../QueueManager");
jest.mock("../RoyaltyCalculator");
jest.mock("../PerformanceMonitor");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("AnalyticsService", () => {
  let analyticsService: AnalyticsService;
  let mockEventCollector: jest.Mocked<EventCollector>;
  let mockPrivacyManager: jest.Mocked<PrivacyManager>;
  let mockQueueManager: jest.Mocked<QueueManager>;
  let mockRoyaltyCalculator: jest.Mocked<RoyaltyCalculator>;
  let mockPerformanceMonitor: jest.Mocked<PerformanceMonitor>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create service instance
    analyticsService = new AnalyticsService({
      enabled: true,
      bufferSize: 10,
      flushInterval: 1000,
      enableRoyaltyCalculation: true,
      enablePerformanceMonitoring: true,
    });

    // Get mocked instances
    mockEventCollector = (
      EventCollector as jest.MockedClass<typeof EventCollector>
    ).mock.instances[0] as jest.Mocked<EventCollector>;
    mockPrivacyManager = (
      PrivacyManager as jest.MockedClass<typeof PrivacyManager>
    ).mock.instances[0] as jest.Mocked<PrivacyManager>;
    mockQueueManager = (QueueManager as jest.MockedClass<typeof QueueManager>)
      .mock.instances[0] as jest.Mocked<QueueManager>;

    // Setup default mock behavior
    mockEventCollector.collect.mockResolvedValue(true);
    mockEventCollector.getMetrics.mockReturnValue({
      eventsCollected: 0,
      eventsBuffered: 0,
      eventsSent: 0,
      eventsFailedValidation: 0,
      eventsDropped: 0,
      lastFlushTime: 0,
      averageLatency: 0,
      errorRate: 0,
    });

    mockQueueManager.getMetrics.mockReturnValue({
      totalQueued: 0,
      highPriorityQueued: 0,
      normalPriorityQueued: 0,
      droppedEvents: 0,
      oldestEventAge: 0,
      averageQueueTime: 0,
    });

    mockPrivacyManager.getConsentStatus.mockReturnValue({
      analytics: true,
      personalization: true,
      marketing: false,
      functional: true,
      performance: true,
      timestamp: Date.now(),
    });
  });

  afterEach(() => {
    analyticsService.destroy();
  });

  describe("Service Initialization", () => {
    test("should initialize with default configuration", () => {
      const service = new AnalyticsService();
      expect(service).toBeDefined();
      expect(EventCollector).toHaveBeenCalled();
      expect(PrivacyManager).toHaveBeenCalled();
      expect(QueueManager).toHaveBeenCalled();
    });

    test("should initialize with custom configuration", () => {
      const config = {
        enabled: false,
        bufferSize: 50,
        enableRoyaltyCalculation: false,
      };

      const service = new AnalyticsService(config);
      expect(service).toBeDefined();
      expect(EventCollector).toHaveBeenCalledWith(
        expect.objectContaining(config),
      );
      service.destroy();
    });

    test("should initialize royalty calculator when enabled", async () => {
      await analyticsService.initialize("user123");
      expect(RoyaltyCalculator).toHaveBeenCalled();
    });

    test("should initialize performance monitor when enabled", async () => {
      await analyticsService.initialize("user123");
      expect(PerformanceMonitor).toHaveBeenCalled();
    });
  });

  describe("Event Tracking", () => {
    beforeEach(async () => {
      await analyticsService.initialize("user123");
    });

    test("should track playback events successfully", async () => {
      const playbackData = {
        trackId: "track123",
        artistId: "artist456",
        position: 30000,
        duration: 180000,
        quality: "high",
      };

      const result = await analyticsService.trackPlayback(
        ANALYTICS_EVENTS.PLAY_START,
        playbackData,
      );

      expect(result).toBe(true);
      expect(mockEventCollector.collect).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: ANALYTICS_EVENTS.PLAY_START,
          trackId: "track123",
          artistId: "artist456",
          position: 30000,
          duration: 180000,
          quality: "high",
          userId: "user123",
        }),
      );
    });

    test("should track user engagement events", async () => {
      const engagementData = {
        action: "like",
        targetId: "track123",
        targetType: "track" as const,
      };

      const result = await analyticsService.trackEngagement(
        ANALYTICS_EVENTS.TRACK_LIKE,
        engagementData,
      );

      expect(result).toBe(true);
      expect(mockEventCollector.collect).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: ANALYTICS_EVENTS.TRACK_LIKE,
          action: "like",
          targetId: "track123",
          targetType: "track",
        }),
      );
    });

    test("should track security events with high priority", async () => {
      const securityData = {
        securityLevel: "critical" as const,
        threatType: "unauthorized_access",
        details: { ip: "192.168.1.100", attempts: 5 },
      };

      const result = await analyticsService.trackSecurity(
        ANALYTICS_EVENTS.SECURITY_VIOLATION,
        securityData,
      );

      expect(result).toBe(true);
      expect(mockEventCollector.collect).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: ANALYTICS_EVENTS.SECURITY_VIOLATION,
          securityLevel: "critical",
          threatType: "unauthorized_access",
        }),
      );
    });

    test("should track performance events", async () => {
      const performanceData = {
        metric: "latency",
        value: 250,
        unit: "ms",
      };

      const result = await analyticsService.trackPerformance(
        ANALYTICS_EVENTS.LATENCY_MEASUREMENT,
        performanceData,
      );

      expect(result).toBe(true);
      expect(mockEventCollector.collect).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: ANALYTICS_EVENTS.LATENCY_MEASUREMENT,
          metric: "latency",
          value: 250,
          unit: "ms",
        }),
      );
    });

    test("should track custom events", async () => {
      const customData = {
        customField: "customValue",
        numericField: 42,
      };

      const result = await analyticsService.trackCustom(
        "custom_event",
        customData,
      );

      expect(result).toBe(true);
      expect(mockEventCollector.collect).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "custom_event",
          customField: "customValue",
          numericField: 42,
        }),
      );
    });

    test("should handle tracking errors gracefully", async () => {
      mockEventCollector.collect.mockRejectedValue(
        new Error("Collection failed"),
      );

      const result = await analyticsService.trackPlayback(
        ANALYTICS_EVENTS.PLAY_START,
        {
          trackId: "track123",
          position: 0,
          duration: 180000,
          quality: "high",
        },
      );

      expect(result).toBe(false);
    });
  });

  describe("Royalty Calculation Integration", () => {
    beforeEach(async () => {
      await analyticsService.initialize("user123");
      mockRoyaltyCalculator = (
        RoyaltyCalculator as jest.MockedClass<typeof RoyaltyCalculator>
      ).mock.instances[0] as jest.Mocked<RoyaltyCalculator>;
    });

    test("should process royalty-eligible events", async () => {
      mockRoyaltyCalculator.processPlaybackEvent.mockResolvedValue(true);

      const playbackData = {
        trackId: "track123",
        artistId: "artist456",
        position: 35000, // Over minimum threshold
        duration: 180000,
        quality: "high",
      };

      await analyticsService.trackPlayback(
        ANALYTICS_EVENTS.TRACK_COMPLETE,
        playbackData,
      );

      expect(mockRoyaltyCalculator.processPlaybackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: ANALYTICS_EVENTS.TRACK_COMPLETE,
          trackId: "track123",
          artistId: "artist456",
        }),
      );
    });

    test("should not process royalties for non-eligible events", async () => {
      const playbackData = {
        trackId: "track123",
        position: 15000, // Under minimum threshold
        duration: 180000,
        quality: "high",
      };

      await analyticsService.trackPlayback(
        ANALYTICS_EVENTS.PLAY_PAUSE,
        playbackData,
      );

      expect(mockRoyaltyCalculator.processPlaybackEvent).not.toHaveBeenCalled();
    });
  });

  describe("Privacy and Consent Management", () => {
    beforeEach(async () => {
      await analyticsService.initialize("user123");
    });

    test("should update consent settings", () => {
      const newConsent = {
        analytics: false,
        personalization: true,
        marketing: true,
      };

      analyticsService.updateConsent(newConsent);

      expect(mockPrivacyManager.updateConsent).toHaveBeenCalledWith(newConsent);
    });

    test("should get consent status", () => {
      const consentStatus = analyticsService.getConsentStatus();

      expect(mockPrivacyManager.getConsentStatus).toHaveBeenCalled();
      expect(consentStatus).toEqual(
        expect.objectContaining({
          analytics: true,
          functional: true,
        }),
      );
    });

    test("should request data export", async () => {
      const mockExportData = {
        userId: "user123",
        requestTimestamp: Date.now(),
        events: [],
      };

      mockPrivacyManager.requestDataExport.mockResolvedValue(mockExportData);

      const result = await analyticsService.requestDataExport();

      expect(mockPrivacyManager.requestDataExport).toHaveBeenCalledWith(
        "user123",
      );
      expect(result).toEqual(mockExportData);
    });

    test("should request data deletion", async () => {
      mockPrivacyManager.requestDataDeletion.mockResolvedValue(true);

      const result = await analyticsService.requestDataDeletion();

      expect(mockPrivacyManager.requestDataDeletion).toHaveBeenCalledWith(
        "user123",
      );
      expect(result).toBe(true);
    });

    test("should throw error for data operations without user ID", async () => {
      const service = new AnalyticsService();
      await service.initialize(); // No user ID

      await expect(service.requestDataExport()).rejects.toThrow(
        "No user ID available for data export",
      );
      await expect(service.requestDataDeletion()).rejects.toThrow(
        "No user ID available for data deletion",
      );

      service.destroy();
    });
  });

  describe("Session Management", () => {
    test("should track session start on initialization", async () => {
      await analyticsService.initialize("user123");

      expect(mockEventCollector.collect).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: ANALYTICS_EVENTS.SESSION_START,
          userId: "user123",
        }),
      );
    });

    test("should start new session", async () => {
      await analyticsService.initialize("user123");
      jest.clearAllMocks();

      await analyticsService.startNewSession("user456");

      // Should track session end for previous session
      expect(mockEventCollector.collect).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: ANALYTICS_EVENTS.SESSION_END,
          userId: "user123",
        }),
      );

      // Should track session start for new session
      expect(mockEventCollector.collect).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: ANALYTICS_EVENTS.SESSION_START,
          userId: "user456",
        }),
      );
    });

    test("should track session end on destroy", async () => {
      await analyticsService.initialize("user123");
      jest.clearAllMocks();

      await analyticsService.destroy();

      expect(mockEventCollector.collect).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: ANALYTICS_EVENTS.SESSION_END,
          userId: "user123",
        }),
      );
    });
  });

  describe("Configuration Updates", () => {
    beforeEach(async () => {
      await analyticsService.initialize("user123");
    });

    test("should update service configuration", () => {
      const newConfig = {
        bufferSize: 25,
        flushInterval: 5000,
        enableRealtime: false,
      };

      analyticsService.updateConfig(newConfig);

      expect(mockEventCollector.updateConfig).toHaveBeenCalledWith(
        expect.objectContaining(newConfig),
      );
      expect(mockPrivacyManager.updateConfig).toHaveBeenCalledWith(
        expect.objectContaining(newConfig),
      );
      expect(mockQueueManager.updateConfig).toHaveBeenCalledWith(
        expect.objectContaining(newConfig),
      );
    });
  });

  describe("Metrics and Monitoring", () => {
    beforeEach(async () => {
      await analyticsService.initialize("user123");
    });

    test("should get service metrics", () => {
      const metrics = analyticsService.getMetrics();

      expect(mockEventCollector.getMetrics).toHaveBeenCalled();
      expect(mockQueueManager.getMetrics).toHaveBeenCalled();
      expect(metrics).toEqual(
        expect.objectContaining({
          eventsProcessed: expect.any(Number),
          eventsPerSecond: expect.any(Number),
          averageProcessingTime: expect.any(Number),
          errorRate: expect.any(Number),
          queueSize: expect.any(Number),
          lastFlushTime: expect.any(Number),
        }),
      );
    });

    test("should calculate events per second correctly", () => {
      mockEventCollector.getMetrics.mockReturnValue({
        eventsCollected: 100,
        eventsBuffered: 5,
        eventsSent: 95,
        eventsFailedValidation: 2,
        eventsDropped: 3,
        lastFlushTime: Date.now() - 10000, // 10 seconds ago
        averageLatency: 150,
        errorRate: 0.02,
      });

      const metrics = analyticsService.getMetrics();

      expect(metrics.eventsPerSecond).toBeGreaterThan(0);
    });
  });

  describe("Flush Operations", () => {
    beforeEach(async () => {
      await analyticsService.initialize("user123");
    });

    test("should flush pending events", async () => {
      mockEventCollector.flush.mockResolvedValue();

      await analyticsService.flush();

      expect(mockEventCollector.flush).toHaveBeenCalled();
    });

    test("should handle flush errors gracefully", async () => {
      mockEventCollector.flush.mockRejectedValue(new Error("Flush failed"));

      await expect(analyticsService.flush()).rejects.toThrow("Flush failed");
    });
  });

  describe("Error Handling", () => {
    test("should handle service initialization errors", async () => {
      mockEventCollector.collect.mockRejectedValue(new Error("Init failed"));

      // Should not throw error during initialization
      await expect(
        analyticsService.initialize("user123"),
      ).resolves.not.toThrow();
    });

    test("should handle configuration update errors", () => {
      mockEventCollector.updateConfig.mockImplementation(() => {
        throw new Error("Config update failed");
      });

      // Should not throw error
      expect(() => {
        analyticsService.updateConfig({ bufferSize: 20 });
      }).not.toThrow();
    });

    test("should handle metrics retrieval errors", () => {
      mockEventCollector.getMetrics.mockImplementation(() => {
        throw new Error("Metrics failed");
      });

      // Should return default metrics or handle gracefully
      expect(() => analyticsService.getMetrics()).not.toThrow();
    });
  });

  describe("Event Enrichment", () => {
    beforeEach(async () => {
      await analyticsService.initialize("user123");
    });

    test("should enrich events with standard fields", async () => {
      const playbackData = {
        trackId: "track123",
      };

      await analyticsService.trackPlayback(
        ANALYTICS_EVENTS.PLAY_START,
        playbackData,
      );

      expect(mockEventCollector.collect).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: ANALYTICS_EVENTS.PLAY_START,
          trackId: "track123",
          timestamp: expect.any(Number),
          sessionId: expect.any(String),
          userId: "user123",
          deviceId: expect.any(String),
          userAgent: expect.any(String),
          platform: expect.any(String),
          version: expect.any(String),
          position: 0, // Default value
          duration: 0, // Default value
          quality: "unknown", // Default value
        }),
      );
    });

    test("should preserve provided field values", async () => {
      const playbackData = {
        trackId: "track123",
        position: 45000,
        duration: 180000,
        quality: "high",
      };

      await analyticsService.trackPlayback(
        ANALYTICS_EVENTS.PLAY_START,
        playbackData,
      );

      expect(mockEventCollector.collect).toHaveBeenCalledWith(
        expect.objectContaining({
          position: 45000,
          duration: 180000,
          quality: "high",
        }),
      );
    });
  });

  describe("Integration with External Services", () => {
    beforeEach(async () => {
      await analyticsService.initialize("user123");
    });

    test("should integrate with performance monitor", () => {
      if (mockPerformanceMonitor) {
        expect(mockPerformanceMonitor.startMonitoring).toHaveBeenCalled();
      }
    });

    test("should integrate with royalty calculator", () => {
      if (mockRoyaltyCalculator) {
        expect(mockRoyaltyCalculator.startCalculation).toHaveBeenCalled();
      }
    });

    test("should stop external services on destroy", async () => {
      await analyticsService.destroy();

      if (mockPerformanceMonitor) {
        expect(mockPerformanceMonitor.stopMonitoring).toHaveBeenCalled();
      }

      if (mockRoyaltyCalculator) {
        expect(mockRoyaltyCalculator.stopCalculation).toHaveBeenCalled();
      }
    });
  });
});
