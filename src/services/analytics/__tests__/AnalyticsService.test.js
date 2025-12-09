// src/services/analytics/__tests__/AnalyticsService.test.js
// Comprehensive test suite for the analytics service

import AnalyticsService from "../AnalyticsService";
import PlayerAnalytics from "../PlayerAnalytics";
import { EventValidator } from "../EventValidator";
import { PrivacyManager } from "../PrivacyManager";

// Mock dependencies
jest.mock("../EventValidator");
jest.mock("../PrivacyManager");
jest.mock("../QueueManager");

describe("AnalyticsService", () => {
  let analyticsService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock localStorage
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };

    // Mock navigator
    global.navigator = {
      onLine: true,
      connection: {
        effectiveType: "4g",
        downlink: 10,
        rtt: 50
      },
      userAgent: "Test Browser"
    };

    analyticsService = AnalyticsService;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Initialization", () => {
    test("should initialize with default configuration", () => {
      expect(analyticsService.initialized).toBe(true);
      expect(analyticsService.sessionId).toBeDefined();
      expect(analyticsService.config).toBeDefined();
    });

    test("should generate unique session ID", () => {
      const sessionId1 = analyticsService.generateSessionId();
      const sessionId2 = analyticsService.generateSessionId();

      expect(sessionId1).not.toBe(sessionId2);
      expect(sessionId1).toMatch(/^\d+-[a-z0-9]+-\d+$/);
    });

    test("should setup network monitoring", () => {
      expect(analyticsService.networkState).toEqual({
        online: true,
        effectiveType: "4g",
        downlink: 10,
        rtt: 50,
        saveData: undefined
      });
    });
  });

  describe("User Management", () => {
    test("should set user context", () => {
      const userId = "user123";
      const userProperties = {
        subscription_tier: "premium",
        country: "US"
      };

      analyticsService.setUser(userId, userProperties);

      expect(analyticsService.userId).toBe(userId);
      expect(analyticsService.userProperties).toEqual({
        ...userProperties,
        first_seen: expect.any(Number)
      });
    });

    test("should update consent status", () => {
      const consentTypes = {
        analytics: true,
        marketing: false,
        personalization: true
      };

      analyticsService.updateConsent(consentTypes);

      expect(analyticsService.consentStatus).toEqual(consentTypes);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "analytics_consent",
        JSON.stringify(consentTypes),
      );
    });
  });

  describe("Event Tracking", () => {
    beforeEach(() => {
      analyticsService.setUser("test-user", { tier: "premium" });
      analyticsService.updateConsent({ analytics: true });
    });

    test("should track basic events", () => {
      const eventName = "test_event";
      const eventData = { test: "data" };

      const result = analyticsService.trackEvent(eventName, eventData);

      expect(result).toBe(true);
      expect(EventValidator.prototype.validate).toHaveBeenCalled();
    });

    test("should reject events without consent", () => {
      analyticsService.updateConsent({ analytics: false });

      const result = analyticsService.trackEvent("test_event", {});

      expect(result).toBe(false);
    });

    test("should enhance event data with context", () => {
      const eventName = "test_event";
      const eventData = { custom: "data" };

      analyticsService.trackEvent(eventName, eventData);

      // Verify enhanced data structure
      const enhancedEvent = analyticsService.enhanceEventData(
        eventName,
        eventData,
        {},
      );

      expect(enhancedEvent).toHaveProperty("event_name", eventName);
      expect(enhancedEvent).toHaveProperty("event_id");
      expect(enhancedEvent).toHaveProperty("user_id");
      expect(enhancedEvent).toHaveProperty("session_id");
      expect(enhancedEvent).toHaveProperty("timestamp");
      expect(enhancedEvent).toHaveProperty("device_info");
      expect(enhancedEvent).toHaveProperty("network_info");
      expect(enhancedEvent).toHaveProperty("app_info");
    });
  });

  describe("Playback Tracking", () => {
    const mockTrack = {
      id: "track123",
      artist_id: "artist456",
      album_id: "album789",
      title: "Test Track",
      duration: 180
    };

    test("should track play start events", () => {
      const playbackData = {
        quality: "high",
        crossfade_enabled: true
      };

      const result = analyticsService.trackPlayback(
        "play_start",
        mockTrack,
        playbackData,
      );

      expect(result).toBe(true);
    });

    test("should calculate royalty qualifying plays", () => {
      const qualifying = analyticsService.isRoyaltyQualifying(35000, 60); // 35 seconds, 60% completion
      const notQualifying = analyticsService.isRoyaltyQualifying(20000, 40); // 20 seconds, 40% completion

      expect(qualifying).toBe(true);
      expect(notQualifying).toBe(false);
    });

    test("should track royalty qualifying plays with correct data", () => {
      const playbackData = {
        duration: 35000, // 35 seconds
        completion_percentage: 70
      };

      analyticsService.trackPlayback("play_end", mockTrack, playbackData);

      // Verify royalty data is included
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        "play_end",
        expect.objectContaining({
          royalty_qualifying: true,
          user_tier: expect.any(String),
          license_type: expect.any(String)
        }),
        expect.any(Object),
      );
    });
  });

  describe("Performance Tracking", () => {
    test("should track performance events", () => {
      const performanceData = {
        network_speed: 10,
        buffer_level: 95,
        quality: "high"
      };

      const result = analyticsService.trackPerformance(
        "quality_change",
        performanceData,
      );

      expect(result).toBe(true);
    });

    test("should include network state in performance events", () => {
      analyticsService.trackPerformance("buffer_event", {});

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        "buffer_event",
        expect.objectContaining({
          network_state: analyticsService.networkState
        }),
        expect.any(Object),
      );
    });
  });

  describe("Security Tracking", () => {
    test("should track security events with high priority", () => {
      const securityData = {
        error_code: "DRM_001",
        failure_type: "license_expired"
      };

      analyticsService.trackSecurity("drm_failure", securityData);

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        "drm_failure",
        expect.objectContaining(securityData),
        expect.objectContaining({
          category: "security",
          priority: "critical"
        }),
      );
    });
  });

  describe("Business Tracking", () => {
    test("should track business events", () => {
      const businessData = {
        amount: 9.99,
        currency: "USD",
        payment_method: "credit_card"
      };

      analyticsService.trackBusiness("payment_event", businessData);

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        "payment_event",
        expect.objectContaining(businessData),
        expect.objectContaining({
          category: "business",
          priority: "high"
        }),
      );
    });
  });

  describe("Data Export", () => {
    test("should export user data in JSON format", async () => {
      const exportData = await analyticsService.exportUserData("json");

      expect(exportData).toHaveProperty("user_id");
      expect(exportData).toHaveProperty("export_format", "json");
      expect(exportData).toHaveProperty("export_timestamp");
    });

    test("should throw error for unsupported format", async () => {
      await expect(
        analyticsService.exportUserData("unsupported"),
      ).rejects.toThrow("Unsupported export format");
    });
  });

  describe("Data Deletion", () => {
    test("should delete user data and return confirmation", async () => {
      const result = await analyticsService.deleteUserData();

      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("deletion_id");
    });
  });

  describe("Metrics and Monitoring", () => {
    test("should return service metrics", () => {
      const metrics = analyticsService.getMetrics();

      expect(metrics).toHaveProperty("eventsCollected");
      expect(metrics).toHaveProperty("eventsProcessed");
      expect(metrics).toHaveProperty("eventsDropped");
      expect(metrics).toHaveProperty("buffer_sizes");
      expect(metrics).toHaveProperty("network_state");
      expect(metrics).toHaveProperty("initialized");
      expect(metrics).toHaveProperty("consent_status");
    });

    test("should track event collection metrics", () => {
      const initialCount = analyticsService.metrics.eventsCollected;

      analyticsService.trackEvent("test_event", {});

      expect(analyticsService.metrics.eventsCollected).toBe(initialCount + 1);
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid event data gracefully", () => {
      const result = analyticsService.trackEvent(null, null);

      expect(result).toBe(false);
      expect(analyticsService.metrics.eventsDropped).toBeGreaterThan(0);
    });

    test("should handle network errors", () => {
      // Simulate network offline
      global.navigator.onLine = false;

      const result = analyticsService.trackEvent("test_event", {});

      expect(result).toBe(true); // Should still accept events for offline queue
    });
  });
});

describe("PlayerAnalytics", () => {
  let playerAnalytics;

  beforeEach(() => {
    playerAnalytics = new PlayerAnalytics();
  });

  describe("Track Loading", () => {
    test("should track track load with metadata", () => {
      const track = {
        id: "track123",
        title: "Test Track",
        duration: 180
      };

      const options = {
        loadTime: 1200,
        cacheHit: true,
        quality: "high"
      };

      playerAnalytics.trackTrackLoad(track, options);

      expect(playerAnalytics.currentTrack).toBe(track);
      expect(playerAnalytics.seekCount).toBe(0);
    });
  });

  describe("Playback Events", () => {
    const mockTrack = {
      id: "track123",
      title: "Test Track",
      duration: 180
    };

    beforeEach(() => {
      playerAnalytics.currentTrack = mockTrack;
    });

    test("should track play start", () => {
      const options = {
        queuePosition: 0,
        source: "playlist",
        autoPlay: false
      };

      playerAnalytics.trackPlayStart(mockTrack, options);

      expect(playerAnalytics.playStartTime).toBeDefined();
      expect(playerAnalytics.playbackState.isPlaying).toBe(true);
      expect(playerAnalytics.sessionMetrics.tracksPlayed).toBe(1);
    });

    test("should track play pause with reason", () => {
      playerAnalytics.playStartTime = Date.now() - 30000; // 30 seconds ago
      playerAnalytics.playbackState.isPlaying = true;

      playerAnalytics.trackPlayPause("user_action");

      expect(playerAnalytics.playbackState.isPlaying).toBe(false);
    });

    test("should track play end with completion data", () => {
      playerAnalytics.playStartTime = Date.now() - 120000; // 2 minutes ago
      playerAnalytics.playbackState.position = 150;
      playerAnalytics.playbackState.duration = 180;

      playerAnalytics.trackPlayEnd("natural_end");

      expect(playerAnalytics.playbackState.isPlaying).toBe(false);
    });
  });

  describe("Seek Tracking", () => {
    test("should track seek events", () => {
      playerAnalytics.currentTrack = { id: "track123" };

      playerAnalytics.trackSeek(30, 60, "user_seek");

      expect(playerAnalytics.seekCount).toBe(1);
      expect(playerAnalytics.sessionMetrics.seekCount).toBe(1);
      expect(playerAnalytics.playbackState.position).toBe(60);
    });
  });

  describe("Quality Changes", () => {
    test("should track quality changes", () => {
      playerAnalytics.currentTrack = { id: "track123" };

      playerAnalytics.trackQualityChange("medium", "high", "adaptive");

      expect(playerAnalytics.playbackState.quality).toBe("high");
      expect(playerAnalytics.qualityChanges).toHaveLength(1);
      expect(playerAnalytics.sessionMetrics.qualityChanges).toBe(1);
    });
  });

  describe("Buffer Events", () => {
    test("should track buffer events", () => {
      playerAnalytics.currentTrack = { id: "track123" };

      playerAnalytics.trackBufferEvent("underrun", 2.5, 5);

      expect(playerAnalytics.bufferEvents).toHaveLength(1);
      expect(playerAnalytics.playbackState.bufferLevel).toBe(2.5);
    });

    test("should track critical buffer underruns", () => {
      playerAnalytics.currentTrack = { id: "track123" };

      playerAnalytics.trackBufferUnderrun(0.5);

      // Should call analytics service with critical severity
    });
  });

  describe("Error Tracking", () => {
    test("should track playback errors", () => {
      const error = new Error("Playback failed");
      error.code = "MEDIA_ERR_DECODE";

      playerAnalytics.trackPlaybackError(error, {
        recoveryAttempted: true
      });

      expect(playerAnalytics.errorEvents).toHaveLength(1);
      expect(playerAnalytics.sessionMetrics.errorCount).toBe(1);
    });
  });

  describe("DRM Events", () => {
    test("should track DRM license events", () => {
      const licenseData = {
        server: "widevine",
        duration: 250,
        success: true,
        licenseType: "streaming"
      };

      playerAnalytics.trackDrmLicense("license_request", licenseData);

      // Should call analytics service with security category
    });
  });

  describe("Engagement Events", () => {
    test("should track like events", () => {
      playerAnalytics.currentTrack = {
        id: "track123",
        artist_id: "artist456"
      };

      playerAnalytics.trackLike(true);

      // Should call analytics service with engagement data
    });

    test("should track share events", () => {
      playerAnalytics.currentTrack = { id: "track123" };

      playerAnalytics.trackShare("social_media", 5);

      // Should call analytics service with share data
    });
  });

  describe("Session Management", () => {
    test("should calculate completion percentage", () => {
      playerAnalytics.playbackState.position = 90;
      playerAnalytics.playbackState.duration = 180;

      const completion = playerAnalytics.calculateCompletionPercentage();

      expect(completion).toBe(50);
    });

    test("should determine royalty qualification", () => {
      const qualifying1 = playerAnalytics.isRoyaltyQualifying(35000, 60);
      const qualifying2 = playerAnalytics.isRoyaltyQualifying(25000, 55);
      const notQualifying = playerAnalytics.isRoyaltyQualifying(20000, 40);

      expect(qualifying1).toBe(true);
      expect(qualifying2).toBe(true);
      expect(notQualifying).toBe(false);
    });

    test("should get analytics summary", () => {
      const summary = playerAnalytics.getAnalyticsSummary();

      expect(summary).toHaveProperty("session_metrics");
      expect(summary).toHaveProperty("compliance_data");
      expect(summary).toHaveProperty("current_state");
      expect(summary).toHaveProperty("session_duration");
    });

    test("should reset analytics for new session", () => {
      playerAnalytics.sessionMetrics.tracksPlayed = 5;
      playerAnalytics.seekCount = 10;

      playerAnalytics.reset();

      expect(playerAnalytics.sessionMetrics.tracksPlayed).toBe(0);
      expect(playerAnalytics.seekCount).toBe(0);
      expect(playerAnalytics.currentTrack).toBeNull();
    });
  });
});

describe("EventValidator", () => {
  let validator;

  beforeEach(() => {
    validator = new EventValidator();
  });

  describe("Event Schema Validation", () => {
    test("should validate known event types", () => {
      const result = validator.validate("play_start", {
        user_id: "user123",
        track_id: "track456",
        session_id: "session789",
        timestamp: Date.now()
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should reject unknown event types", () => {
      const result = validator.validate("unknown_event", {});

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Unknown event type: unknown_event");
    });

    test("should validate required fields", () => {
      const result = validator.validate("play_start", {
        user_id: "user123",
        // missing track_id, session_id, timestamp
      });

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Missing required fields");
    });
  });

  describe("Field Type Validation", () => {
    test("should validate field types", () => {
      const result = validator.validateFieldValue("timestamp", Date.now());

      expect(result.valid).toBe(true);
    });

    test("should reject invalid field types", () => {
      const result = validator.validateFieldValue("timestamp", "invalid");

      expect(result.valid).toBe(false);
    });

    test("should validate numeric ranges", () => {
      const validResult = validator.validateFieldValue(
        "completion_percentage",
        75,
      );
      const invalidResult = validator.validateFieldValue(
        "completion_percentage",
        150,
      );

      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
    });
  });

  describe("Business Rules Validation", () => {
    test("should validate playback rules", () => {
      const result = validator.validate("seek", {
        user_id: "user123",
        track_id: "track456",
        session_id: "session789",
        timestamp: Date.now(),
        from_position: 30,
        to_position: 60
      });

      expect(result.valid).toBe(true);
    });

    test("should detect invalid seek positions", () => {
      const result = validator.validate("seek", {
        user_id: "user123",
        track_id: "track456",
        session_id: "session789",
        timestamp: Date.now(),
        from_position: -10,
        to_position: 60
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Seek positions cannot be negative");
    });
  });

  describe("Data Quality Validation", () => {
    test("should detect future timestamps", () => {
      const futureTimestamp = Date.now() + 300000; // 5 minutes in future

      const result = validator.validate("play_start", {
        user_id: "user123",
        track_id: "track456",
        session_id: "session789",
        timestamp: futureTimestamp
      });

      expect(result.warnings).toContain("Event timestamp is in the future");
    });

    test("should detect suspicious patterns", () => {
      const result = validator.validate("play_start", {
        user_id: "user123",
        track_id: "track456",
        session_id: "session789",
        timestamp: Date.now(),
        user_agent: "bot/1.0"
      });

      expect(result.warnings).toContain("Potential bot activity detected");
    });
  });
});

describe("PrivacyManager", () => {
  let privacyManager;

  beforeEach(() => {
    privacyManager = new PrivacyManager();
  });

  describe("Pseudonymization", () => {
    test("should pseudonymize user IDs consistently", () => {
      const originalId = "user12345";

      const pseudo1 = privacyManager.pseudonymizeValue(originalId, "user_id");
      const pseudo2 = privacyManager.pseudonymizeValue(originalId, "user_id");

      expect(pseudo1).toBe(pseudo2);
      expect(pseudo1).not.toBe(originalId);
      expect(pseudo1).toMatch(/^user_[a-f0-9]{16}$/);
    });

    test("should apply privacy filters to event data", () => {
      const eventData = {
        user_id: "user12345",
        ip_address: "192.168.1.100",
        device_id: "device67890",
        event_name: "play_start"
      };

      const filtered = privacyManager.applyPrivacyFilters(eventData);

      expect(filtered.user_id).not.toBe(eventData.user_id);
      expect(filtered.ip_address).not.toBe(eventData.ip_address);
      expect(filtered._privacy).toBeDefined();
    });
  });

  describe("Consent Management", () => {
    test("should check consent status", () => {
      privacyManager.updateConsent({ analytics: true, marketing: false });

      expect(privacyManager.hasConsent("analytics")).toBe(true);
      expect(privacyManager.hasConsent("marketing")).toBe(false);
    });

    test("should filter data based on consent", () => {
      privacyManager.updateConsent({ analytics: true, marketing: false });

      const eventData = {
        user_id: "user123",
        utm_parameters: { source: "google" },
        event_name: "play_start"
      };

      const filtered = privacyManager.filterPIIBasedOnConsent(eventData);

      expect(filtered.user_id).toBeDefined();
      expect(filtered.utm_parameters).toBeUndefined();
    });
  });

  describe("Data Minimization", () => {
    test("should minimize device information", () => {
      const deviceInfo = {
        user_agent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        screen_resolution: "1920x1080",
        detailed_specs: "sensitive data"
      };

      const minimized = privacyManager.minimizeDeviceInfo(deviceInfo);

      expect(minimized.browser).toBeDefined();
      expect(minimized.screen_size).toBeDefined();
      expect(minimized.detailed_specs).toBeUndefined();
    });

    test("should reduce location precision", () => {
      const location = {
        latitude: 40.7128123456,
        longitude: -74.0060987654
      };

      const reduced = privacyManager.reduceLocationPrecision(location);

      expect(reduced.latitude).toBe(40.71);
      expect(reduced.longitude).toBe(-74.01);
      expect(reduced.accuracy).toBe("reduced");
    });
  });

  describe("Data Export and Deletion", () => {
    test("should export user data in JSON format", () => {
      const userId = "user123";
      const exported = privacyManager.exportUserData(userId, "json");

      expect(exported).toContain("user_id");
      expect(exported).toContain(userId);
    });

    test("should export user data in CSV format", () => {
      const userId = "user123";
      const exported = privacyManager.exportUserData(userId, "csv");

      expect(exported).toContain("user_id");
      expect(exported).toContain(",");
    });

    test("should delete user data with proper record keeping", () => {
      const userId = "user123";
      const deletionRecord = privacyManager.deleteUserData(
        userId,
        "user_request",
      );

      expect(deletionRecord.user_id).toBe(userId);
      expect(deletionRecord.deletion_reason).toBe("user_request");
      expect(deletionRecord.deletion_timestamp).toBeDefined();
    });
  });

  describe("IP Address Handling", () => {
    test("should hash IPv4 addresses", () => {
      const ipv4 = "192.168.1.100";
      const hashed = privacyManager.hashIP(ipv4);

      expect(hashed).toBe("192.168.1.0");
    });

    test("should hash IPv6 addresses", () => {
      const ipv6 = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
      const hashed = privacyManager.hashIP(ipv6);

      expect(hashed).toContain("::");
      expect(hashed).not.toBe(ipv6);
    });
  });
});
