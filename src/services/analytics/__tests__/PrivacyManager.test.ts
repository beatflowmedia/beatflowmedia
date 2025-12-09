/**
 * Tests for Privacy Manager
 * Tests GDPR, CCPA, COPPA compliance and data protection
 */

import { PrivacyManager } from "../PrivacyManager";
import {
  AnalyticsEvent,
  AnalyticsConfig,
  ANALYTICS_EVENTS,
} from "../AnalyticsConfig";

describe("PrivacyManager", () => {
  let privacyManager: PrivacyManager;
  let mockConfig: AnalyticsConfig;

  const sampleEvent: AnalyticsEvent = {
    eventType: ANALYTICS_EVENTS.PLAY_START,
    timestamp: Date.now(),
    sessionId: "session123",
    deviceId: "device456",
    userAgent: "test-agent",
    platform: "web",
    version: "1.0.0",
    userId: "user123",
    ip: "192.168.1.100",
    country: "US",
    territory: "US",
  };

  beforeEach(() => {
    mockConfig = {
      enabled: true,
      bufferSize: 100,
      flushInterval: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      respectDoNotTrack: true,
      anonymizeIp: true,
      consentRequired: true,
      dataRetentionDays: 365,
      samplingRate: 1.0,
      enableRealtime: true,
      batchSize: 50,
      compressionEnabled: true,
      collectorEndpoint: "/api/analytics/events",
      realtimeEndpoint: "/api/analytics/realtime",
      exportEndpoint: "/api/analytics/export",
      enableGeoTracking: true,
      enablePerformanceMonitoring: true,
      enableSecurityTracking: true,
      enableBusinessIntelligence: true,
      errorRateThreshold: 0.05,
      latencyThreshold: 2000,
      bufferHealthThreshold: 0.1,
      gdprCompliant: true,
      ccpaCompliant: true,
      coppaCompliant: true,
    };

    // Clear localStorage before each test
    localStorage.clear();

    privacyManager = new PrivacyManager(mockConfig);
  });

  describe("Consent Management", () => {
    test("should initialize with default consent settings", () => {
      const consentStatus = privacyManager.getConsentStatus();

      expect(consentStatus.analytics).toBe(false);
      expect(consentStatus.personalization).toBe(false);
      expect(consentStatus.marketing).toBe(false);
      expect(consentStatus.functional).toBe(true); // Usually required
      expect(consentStatus.performance).toBe(false);
    });

    test("should update consent settings", () => {
      const newConsent = {
        analytics: true,
        personalization: true,
        marketing: false,
        functional: true,
        performance: true,
      };

      privacyManager.updateConsent(newConsent);

      const consentStatus = privacyManager.getConsentStatus();
      expect(consentStatus.analytics).toBe(true);
      expect(consentStatus.personalization).toBe(true);
      expect(consentStatus.marketing).toBe(false);
      expect(consentStatus.timestamp).toBeTruthy();
    });

    test("should save consent to localStorage", () => {
      const newConsent = {
        analytics: true,
        personalization: true,
      };

      privacyManager.updateConsent(newConsent);

      const stored = localStorage.getItem("beatflow_consent");
      expect(stored).toBeTruthy();

      const parsedStored = JSON.parse(stored!);
      expect(parsedStored.consent.analytics).toBe(true);
      expect(parsedStored.consent.personalization).toBe(true);
    });

    test("should load consent from localStorage", () => {
      const consentData = {
        consent: {
          analytics: true,
          personalization: false,
          marketing: true,
          functional: true,
          performance: false,
        },
        timestamp: Date.now(),
        version: "2.0",
      };

      localStorage.setItem("beatflow_consent", JSON.stringify(consentData));

      const manager = new PrivacyManager(mockConfig);
      const status = manager.getConsentStatus();

      expect(status.analytics).toBe(true);
      expect(status.marketing).toBe(true);
    });

    test("should handle corrupted localStorage gracefully", () => {
      localStorage.setItem("beatflow_consent", "invalid-json");

      const manager = new PrivacyManager(mockConfig);
      const status = manager.getConsentStatus();

      // Should fall back to defaults
      expect(status.analytics).toBe(false);
      expect(status.functional).toBe(true);
    });

    test("should reset consent", () => {
      privacyManager.updateConsent({ analytics: true, marketing: true });

      privacyManager.resetConsent();

      const status = privacyManager.getConsentStatus();
      expect(status.analytics).toBe(false);
      expect(status.marketing).toBe(false);
      expect(status.functional).toBe(true);
      expect(status.timestamp).toBeNull();
    });
  });

  describe("Consent Checking", () => {
    beforeEach(() => {
      privacyManager.updateConsent({
        analytics: true,
        personalization: false,
        marketing: false,
        functional: true,
        performance: true,
      });
    });

    test("should allow events when consent is given", async () => {
      const result = await privacyManager.checkConsent(
        ANALYTICS_EVENTS.PLAY_START,
      );
      expect(result).toBe(true);
    });

    test("should deny events when consent is not required but not given", async () => {
      privacyManager.updateConsent({ analytics: false });

      const result = await privacyManager.checkConsent(
        ANALYTICS_EVENTS.PLAY_START,
      );
      expect(result).toBe(false);
    });

    test("should respect Do Not Track when enabled", async () => {
      Object.defineProperty(navigator, "doNotTrack", {
        value: "1",
        configurable: true,
      });

      const result = await privacyManager.checkConsent(
        ANALYTICS_EVENTS.PLAY_START,
      );
      expect(result).toBe(false);
    });

    test("should allow functional events even without analytics consent", async () => {
      privacyManager.updateConsent({ analytics: false, functional: true });

      const result = await privacyManager.checkConsent(
        ANALYTICS_EVENTS.SESSION_START,
      );
      expect(result).toBe(true);
    });

    test("should check performance consent for performance events", async () => {
      privacyManager.updateConsent({ performance: false });

      const result = await privacyManager.checkConsent(
        ANALYTICS_EVENTS.LATENCY_MEASUREMENT,
      );
      expect(result).toBe(false);
    });

    test("should check personalization consent for personalization events", async () => {
      privacyManager.updateConsent({ personalization: false });

      const result = await privacyManager.checkConsent(
        ANALYTICS_EVENTS.TRACK_LIKE,
      );
      expect(result).toBe(false);
    });

    test("should allow all events when consent is not required", async () => {
      const manager = new PrivacyManager({
        ...mockConfig,
        consentRequired: false,
      });

      const result = await manager.checkConsent(ANALYTICS_EVENTS.PLAY_START);
      expect(result).toBe(true);
    });

    test("should expire old consent", async () => {
      // Set consent timestamp to 14 months ago
      const oldTimestamp = Date.now() - 14 * 30 * 24 * 60 * 60 * 1000;

      localStorage.setItem(
        "beatflow_consent",
        JSON.stringify({
          consent: { analytics: true },
          timestamp: oldTimestamp,
          version: "2.0",
        }),
      );

      const manager = new PrivacyManager(mockConfig);
      const result = await manager.checkConsent(ANALYTICS_EVENTS.PLAY_START);

      expect(result).toBe(false);
    });
  });

  describe("Data Sanitization", () => {
    test("should anonymize IP addresses", async () => {
      const event = { ...sampleEvent, ip: "192.168.1.100" };

      const sanitized = await privacyManager.sanitizeEvent(event);

      expect(sanitized.ip).toBe("192.168.1.0"); // IPv4 anonymization
    });

    test("should anonymize IPv6 addresses", async () => {
      const event = {
        ...sampleEvent,
        ip: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      };

      const sanitized = await privacyManager.sanitizeEvent(event);

      expect(sanitized.ip).toBe("2001:0db8:85a3::"); // IPv6 anonymization
    });

    test("should handle invalid IP addresses", async () => {
      const event = { ...sampleEvent, ip: "invalid-ip" };

      const sanitized = await privacyManager.sanitizeEvent(event);

      expect(sanitized.ip).toBe("anonymized");
    });

    test("should pseudonymize user IDs", async () => {
      const event = { ...sampleEvent, userId: "user123" };

      const sanitized = await privacyManager.sanitizeEvent(event);

      expect(sanitized.userId).not.toBe("user123");
      expect(sanitized.userId).toHaveLength(16); // Pseudonymized hash length
    });

    test("should remove PII when personalization consent is not given", async () => {
      privacyManager.updateConsent({ personalization: false });

      const event = { ...sampleEvent, userId: "user123" };
      const sanitized = await privacyManager.sanitizeEvent(event);

      expect(sanitized.userId).toBeUndefined();
    });

    test("should anonymize geography for sensitive regions", async () => {
      const event = { ...sampleEvent, country: "DE" }; // Germany - strict privacy

      const sanitized = await privacyManager.sanitizeEvent(event);

      expect(sanitized.country).toBeUndefined();
      expect(sanitized.territory).toBeUndefined();
      expect(sanitized.ip).toBeUndefined();
    });

    test("should apply COPPA compliance for minors", async () => {
      const event = { ...sampleEvent, userId: "minor_user123" };

      const sanitized = await privacyManager.sanitizeEvent(event);

      expect(sanitized.userId).toBeUndefined();
      expect(sanitized.ip).toBeUndefined();
      expect(sanitized.country).toBeUndefined();
      expect(sanitized.territory).toBeUndefined();
    });

    test("should not anonymize when disabled", async () => {
      const manager = new PrivacyManager({
        ...mockConfig,
        anonymizeIp: false,
      });

      const event = { ...sampleEvent, ip: "192.168.1.100" };
      const sanitized = await manager.sanitizeEvent(event);

      expect(sanitized.ip).toBe("192.168.1.100");
    });
  });

  describe("Data Subject Rights", () => {
    test("should provide correct rights for GDPR regions", () => {
      const rights = privacyManager.getDataSubjectRights();

      expect(rights.hasRightToAccess).toBe(true);
      expect(rights.hasRightToRectification).toBe(true);
      expect(rights.hasRightToErasure).toBe(true);
      expect(rights.hasRightToPortability).toBe(true);
      expect(rights.hasRightToObject).toBe(true);
      expect(rights.hasRightToRestrict).toBe(true);
    });

    test("should provide correct rights for CCPA regions", () => {
      const manager = new PrivacyManager({
        ...mockConfig,
        gdprCompliant: false,
        ccpaCompliant: true,
      });

      const rights = manager.getDataSubjectRights();

      expect(rights.hasRightToAccess).toBe(true);
      expect(rights.hasRightToRectification).toBe(false); // CCPA doesn't have this
      expect(rights.hasRightToErasure).toBe(true);
      expect(rights.hasRightToPortability).toBe(false); // CCPA doesn't have this
    });

    test("should handle data export requests", async () => {
      const exportData = await privacyManager.requestDataExport("user123");

      expect(exportData).toEqual({
        userId: "user123",
        requestTimestamp: expect.any(Number),
        dataRetentionPeriod: 365,
        consent: expect.any(Object),
        events: [],
      });
    });

    test("should handle data deletion requests", async () => {
      const result = await privacyManager.requestDataDeletion("user123");

      expect(result).toBe(true);
    });

    test("should reject data operations when rights not available", async () => {
      const manager = new PrivacyManager({
        ...mockConfig,
        gdprCompliant: false,
        ccpaCompliant: false,
      });

      await expect(manager.requestDataExport("user123")).rejects.toThrow(
        "Data access rights not available in this jurisdiction",
      );

      await expect(manager.requestDataDeletion("user123")).rejects.toThrow(
        "Data deletion rights not available in this jurisdiction",
      );
    });
  });

  describe("Data Retention", () => {
    test("should check if data retention has expired", () => {
      const oneYearAgo = Date.now() - 366 * 24 * 60 * 60 * 1000;
      const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

      const expiredResult = privacyManager.isDataRetentionExpired(oneYearAgo);
      const validResult = privacyManager.isDataRetentionExpired(oneMonthAgo);

      expect(expiredResult).toBe(true);
      expect(validResult).toBe(false);
    });

    test("should use custom retention period", () => {
      const manager = new PrivacyManager({
        ...mockConfig,
        dataRetentionDays: 30,
      });

      const twoMonthsAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      const expiredResult = manager.isDataRetentionExpired(twoMonthsAgo);
      const validResult = manager.isDataRetentionExpired(oneWeekAgo);

      expect(expiredResult).toBe(true);
      expect(validResult).toBe(false);
    });
  });

  describe("Configuration Updates", () => {
    test("should update configuration", () => {
      const newConfig = {
        ...mockConfig,
        gdprCompliant: false,
        dataRetentionDays: 180,
      };

      privacyManager.updateConfig(newConfig);

      const rights = privacyManager.getDataSubjectRights();
      expect(rights.hasRightToRectification).toBe(false); // GDPR specific right
    });
  });

  describe("Browser Integration", () => {
    test("should detect Do Not Track from different browser properties", async () => {
      // Test navigator.doNotTrack
      Object.defineProperty(navigator, "doNotTrack", {
        value: "1",
        configurable: true,
      });

      let result = await privacyManager.checkConsent();
      expect(result).toBe(false);

      // Test window.doNotTrack
      Object.defineProperty(navigator, "doNotTrack", {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(window, "doNotTrack", {
        value: "1",
        configurable: true,
      });

      result = await privacyManager.checkConsent();
      expect(result).toBe(false);

      // Test navigator.msDoNotTrack (IE)
      Object.defineProperty(window, "doNotTrack", {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(navigator, "msDoNotTrack", {
        value: "1",
        configurable: true,
      });

      result = await privacyManager.checkConsent();
      expect(result).toBe(false);
    });

    test("should handle storage events for DNT policy changes", () => {
      const storageEvent = new StorageEvent("storage", {
        key: "dnt-policy-acknowledged",
        newValue: "true",
      });

      // Should not throw error
      expect(() => {
        window.dispatchEvent(storageEvent);
      }).not.toThrow();
    });
  });

  describe("IP Anonymization", () => {
    test("should cache anonymized IPs", async () => {
      const event1 = { ...sampleEvent, ip: "192.168.1.100" };
      const event2 = { ...sampleEvent, ip: "192.168.1.100" };

      const sanitized1 = await privacyManager.sanitizeEvent(event1);
      const sanitized2 = await privacyManager.sanitizeEvent(event2);

      expect(sanitized1.ip).toBe(sanitized2.ip);
    });

    test("should handle different IP formats", async () => {
      const testCases = [
        { input: "192.168.1.100", expected: "192.168.1.0" },
        { input: "10.0.0.1", expected: "10.0.0.0" },
        { input: "172.16.254.1", expected: "172.16.254.0" },
        {
          input: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
          expected: "2001:0db8:85a3::",
        },
        { input: "invalid", expected: "anonymized" },
      ];

      for (const testCase of testCases) {
        const event = { ...sampleEvent, ip: testCase.input };
        const sanitized = await privacyManager.sanitizeEvent(event);
        expect(sanitized.ip).toBe(testCase.expected);
      }
    });
  });

  describe("COPPA Compliance", () => {
    test("should identify minor accounts", async () => {
      const manager = new PrivacyManager({
        ...mockConfig,
        coppaCompliant: true,
      });

      const minorEvent = { ...sampleEvent, userId: "minor_user123" };
      const sanitized = await manager.sanitizeEvent(minorEvent);

      expect(sanitized.userId).toBeUndefined();
      expect(sanitized.ip).toBeUndefined();
    });

    test("should not apply COPPA when disabled", async () => {
      const manager = new PrivacyManager({
        ...mockConfig,
        coppaCompliant: false,
      });

      const minorEvent = { ...sampleEvent, userId: "minor_user123" };
      const sanitized = await manager.sanitizeEvent(minorEvent);

      expect(sanitized.userId).toBeDefined(); // Should not be removed
    });
  });

  describe("Geographic Privacy", () => {
    test("should anonymize data for strict privacy countries", async () => {
      const strictCountries = ["DE", "FR", "AT", "BE", "DK", "FI", "SE", "NO"];

      for (const country of strictCountries) {
        const event = { ...sampleEvent, country };
        const sanitized = await privacyManager.sanitizeEvent(event);

        expect(sanitized.country).toBeUndefined();
        expect(sanitized.territory).toBeUndefined();
        expect(sanitized.ip).toBeUndefined();
      }
    });

    test("should not anonymize data for non-strict countries", async () => {
      const event = { ...sampleEvent, country: "US" };
      const sanitized = await privacyManager.sanitizeEvent(event);

      expect(sanitized.country).toBe("US");
      expect(sanitized.territory).toBe("US");
      expect(sanitized.ip).toBe("192.168.1.0"); // Still anonymized due to config
    });
  });

  describe("Error Handling", () => {
    test("should handle localStorage errors gracefully", () => {
      // Mock localStorage to throw errors
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error("Storage full");
      });

      // Should not throw error
      expect(() => {
        privacyManager.updateConsent({ analytics: true });
      }).not.toThrow();

      // Restore original method
      localStorage.setItem = originalSetItem;
    });

    test("should handle crypto API errors gracefully", async () => {
      // Mock crypto.subtle to fail
      const originalCrypto = global.crypto;
      global.crypto = {
        ...global.crypto,
        subtle: {
          ...global.crypto.subtle,
          digest: jest.fn().mockRejectedValue(new Error("Crypto error")),
        },
      };

      const event = { ...sampleEvent, userId: "user123" };

      // Should not throw error and handle gracefully
      await expect(privacyManager.sanitizeEvent(event)).resolves.toBeDefined();

      // Restore original crypto
      global.crypto = originalCrypto;
    });

    test("should handle consent status corruption", () => {
      localStorage.setItem(
        "beatflow_consent",
        JSON.stringify({
          consent: null, // Invalid consent object
          timestamp: "invalid-timestamp",
        }),
      );

      const manager = new PrivacyManager(mockConfig);
      const status = manager.getConsentStatus();

      // Should fall back to defaults
      expect(status.analytics).toBe(false);
      expect(status.functional).toBe(true);
    });
  });
});
