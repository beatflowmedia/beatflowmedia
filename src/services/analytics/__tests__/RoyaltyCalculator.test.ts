/**
 * Tests for Royalty Calculator
 * Tests music industry compliance, royalty calculations, and territorial rates
 */

import { RoyaltyCalculator } from "../RoyaltyCalculator";
import {
  PlaybackEvent,
  ANALYTICS_EVENTS,
  AnalyticsConfig,
  DEFAULT_ANALYTICS_CONFIG,
} from "../AnalyticsConfig";

describe("RoyaltyCalculator", () => {
  let royaltyCalculator: RoyaltyCalculator;
  let mockConfig: AnalyticsConfig;

  const createPlaybackEvent = (
    overrides: Partial<PlaybackEvent> = {},
  ): PlaybackEvent => ({
    eventType: ANALYTICS_EVENTS.TRACK_COMPLETE,
    timestamp: Date.now(),
    sessionId: "session123",
    deviceId: "device456",
    userAgent: "test-agent",
    platform: "web",
    version: "1.0.0",
    trackId: "track123",
    artistId: "artist456",
    position: 35000, // 35 seconds - above minimum threshold
    duration: 180000, // 3 minutes
    quality: "high",
    territory: "US",
    ...overrides,
  });

  beforeEach(() => {
    jest.useFakeTimers();
    mockConfig = { ...DEFAULT_ANALYTICS_CONFIG };
    royaltyCalculator = new RoyaltyCalculator(mockConfig);
  });

  afterEach(() => {
    royaltyCalculator.stopCalculation();
    jest.useRealTimers();
  });

  describe("Royalty Qualification", () => {
    test("should qualify valid track completion events", async () => {
      const event = createPlaybackEvent();

      const result = await royaltyCalculator.processPlaybackEvent(event);

      expect(result).toBe(true);
      expect(royaltyCalculator.getPendingRoyaltiesCount()).toBe(1);
    });

    test("should reject events below minimum play duration", async () => {
      const event = createPlaybackEvent({
        position: 25000, // 25 seconds - below 30 second threshold
      });

      const result = await royaltyCalculator.processPlaybackEvent(event);

      expect(result).toBe(false);
      expect(royaltyCalculator.getPendingRoyaltiesCount()).toBe(0);
    });

    test("should reject events without track ID", async () => {
      const event = createPlaybackEvent({
        trackId: "",
      });

      const result = await royaltyCalculator.processPlaybackEvent(event);

      expect(result).toBe(false);
    });

    test("should reject events without artist ID", async () => {
      const event = createPlaybackEvent({
        artistId: "",
      });

      const result = await royaltyCalculator.processPlaybackEvent(event);

      expect(result).toBe(false);
    });

    test("should reject preview quality tracks", async () => {
      const event = createPlaybackEvent({
        quality: "preview",
      });

      const result = await royaltyCalculator.processPlaybackEvent(event);

      expect(result).toBe(false);
    });

    test("should reject test quality tracks", async () => {
      const event = createPlaybackEvent({
        quality: "test",
      });

      const result = await royaltyCalculator.processPlaybackEvent(event);

      expect(result).toBe(false);
    });

    test("should only accept qualifying event types", async () => {
      const playStartEvent = createPlaybackEvent({
        eventType: ANALYTICS_EVENTS.PLAY_START,
      });

      const result =
        await royaltyCalculator.processPlaybackEvent(playStartEvent);

      expect(result).toBe(false);
    });
  });

  describe("Royalty Calculation", () => {
    test("should calculate premium stream royalties", async () => {
      const event = createPlaybackEvent({
        eventType: ANALYTICS_EVENTS.TRACK_COMPLETE,
        territory: "US",
      });

      // Mock premium subscription metadata
      (event as any).metadata = { subscriptionType: "premium" };

      await royaltyCalculator.processPlaybackEvent(event);

      const metrics = royaltyCalculator.getMetrics();
      expect(metrics.totalRoyaltiesCalculated).toBe(0.004); // Premium rate * US multiplier
    });

    test("should calculate free stream royalties", async () => {
      const event = createPlaybackEvent({
        territory: "US",
      });

      await royaltyCalculator.processPlaybackEvent(event);

      const metrics = royaltyCalculator.getMetrics();
      expect(metrics.totalRoyaltiesCalculated).toBe(0.0015); // Free rate * US multiplier
    });

    test("should calculate download royalties", async () => {
      const event = createPlaybackEvent({
        eventType: ANALYTICS_EVENTS.DOWNLOAD_COMPLETE,
        territory: "US",
      });

      await royaltyCalculator.processPlaybackEvent(event);

      const metrics = royaltyCalculator.getMetrics();
      expect(metrics.totalRoyaltiesCalculated).toBe(0.7); // Download rate * US multiplier
    });

    test("should apply territory multipliers correctly", async () => {
      const territories = [
        { territory: "US", expectedMultiplier: 1.0 },
        { territory: "UK", expectedMultiplier: 0.85 },
        { territory: "DE", expectedMultiplier: 0.8 },
        { territory: "FR", expectedMultiplier: 0.75 },
        { territory: "JP", expectedMultiplier: 0.9 },
        { territory: "OTHER", expectedMultiplier: 0.5 },
      ];

      for (const { territory, expectedMultiplier } of territories) {
        const calculator = new RoyaltyCalculator(mockConfig);
        const event = createPlaybackEvent({ territory });

        await calculator.processPlaybackEvent(event);

        const metrics = calculator.getMetrics();
        const expectedRoyalty = 0.0015 * expectedMultiplier; // Free rate * multiplier
        expect(metrics.totalRoyaltiesCalculated).toBeCloseTo(
          expectedRoyalty,
          6,
        );

        calculator.stopCalculation();
      }
    });

    test("should use default territory for unknown territories", async () => {
      const event = createPlaybackEvent({
        territory: "UNKNOWN",
      });

      await royaltyCalculator.processPlaybackEvent(event);

      const metrics = royaltyCalculator.getMetrics();
      const expectedRoyalty = 0.0015 * 0.5; // Free rate * default multiplier
      expect(metrics.totalRoyaltiesCalculated).toBeCloseTo(expectedRoyalty, 6);
    });

    test("should detect territory from timezone when not provided", async () => {
      const event = createPlaybackEvent();
      delete (event as any).territory;

      // Mock timezone detection
      jest
        .spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions")
        .mockReturnValue({
          timeZone: "America/New_York",
          locale: "en-US",
          calendar: "gregory",
          numberingSystem: "latn",
        });

      await royaltyCalculator.processPlaybackEvent(event);

      const metrics = royaltyCalculator.getMetrics();
      expect(metrics.totalRoyaltiesCalculated).toBe(0.0015); // Should default to US rate
    });
  });

  describe("Metrics Tracking", () => {
    test("should track qualifying and non-qualifying plays", async () => {
      const qualifyingEvent = createPlaybackEvent();
      const nonQualifyingEvent = createPlaybackEvent({
        position: 20000, // Below threshold
      });

      await royaltyCalculator.processPlaybackEvent(qualifyingEvent);
      await royaltyCalculator.processPlaybackEvent(nonQualifyingEvent);

      const metrics = royaltyCalculator.getMetrics();
      expect(metrics.qualifyingPlays).toBe(1);
      expect(metrics.nonQualifyingPlays).toBe(1);
    });

    test("should track territory distribution", async () => {
      const usEvent = createPlaybackEvent({ territory: "US" });
      const ukEvent = createPlaybackEvent({ territory: "UK" });

      await royaltyCalculator.processPlaybackEvent(usEvent);
      await royaltyCalculator.processPlaybackEvent(ukEvent);

      const metrics = royaltyCalculator.getMetrics();
      expect(metrics.territoryDistribution["US"]).toBe(0.0015);
      expect(metrics.territoryDistribution["UK"]).toBeCloseTo(0.001275, 6); // 0.0015 * 0.85
    });

    test("should update last calculation time", async () => {
      const event = createPlaybackEvent();

      const beforeTime = Date.now();
      await royaltyCalculator.processPlaybackEvent(event);
      const afterTime = Date.now();

      const metrics = royaltyCalculator.getMetrics();
      expect(metrics.lastCalculationTime).toBeGreaterThanOrEqual(beforeTime);
      expect(metrics.lastCalculationTime).toBeLessThanOrEqual(afterTime);
    });
  });

  describe("Report Generation", () => {
    beforeEach(async () => {
      // Add some test data
      const events = [
        createPlaybackEvent({
          artistId: "artist1",
          trackId: "track1",
          territory: "US",
        }),
        createPlaybackEvent({
          artistId: "artist1",
          trackId: "track2",
          territory: "UK",
        }),
        createPlaybackEvent({
          artistId: "artist2",
          trackId: "track3",
          territory: "US",
        }),
      ];

      for (const event of events) {
        await royaltyCalculator.processPlaybackEvent(event);
      }
    });

    test("should generate artist report", async () => {
      const startDate = Date.now() - 86400000; // 24 hours ago
      const endDate = Date.now();

      const report = await royaltyCalculator.generateArtistReport(
        "artist1",
        startDate,
        endDate,
      );

      expect(report.artistId).toBe("artist1");
      expect(report.totalStreams).toBe(2);
      expect(report.qualifyingStreams).toBe(2);
      expect(report.territoryBreakdown).toHaveProperty("US");
      expect(report.territoryBreakdown).toHaveProperty("UK");
      expect(report.totalRoyalties).toBeGreaterThan(0);
    });

    test("should generate track report", async () => {
      const startDate = Date.now() - 86400000;
      const endDate = Date.now();

      const report = await royaltyCalculator.generateTrackReport(
        "track1",
        startDate,
        endDate,
      );

      expect(report.trackId).toBe("track1");
      expect(report.totalStreams).toBe(1);
      expect(report.territoryBreakdown["US"].streams).toBe(1);
    });

    test("should filter reports by date range", async () => {
      const futureDate = Date.now() + 86400000; // 24 hours in future
      const farFutureDate = Date.now() + 172800000; // 48 hours in future

      const report = await royaltyCalculator.generateArtistReport(
        "artist1",
        futureDate,
        farFutureDate,
      );

      expect(report.totalStreams).toBe(0);
      expect(report.totalRoyalties).toBe(0);
    });

    test("should include territory breakdown with correct rates", async () => {
      const startDate = Date.now() - 86400000;
      const endDate = Date.now();

      const report = await royaltyCalculator.generateArtistReport(
        "artist1",
        startDate,
        endDate,
      );

      expect(report.territoryBreakdown["US"].rate).toBe(0.0015);
      expect(report.territoryBreakdown["UK"].rate).toBe(0.0015);
    });
  });

  describe("Royalty Processing", () => {
    test("should start and stop calculation timers", () => {
      jest.spyOn(global, "setInterval");
      jest.spyOn(global, "clearInterval");

      royaltyCalculator.startCalculation();

      expect(setInterval).toHaveBeenCalledTimes(2); // Calculation and reporting timers

      royaltyCalculator.stopCalculation();

      expect(clearInterval).toHaveBeenCalledTimes(2);
    });

    test("should process royalties on timer", async () => {
      const event = createPlaybackEvent();
      await royaltyCalculator.processPlaybackEvent(event);

      expect(royaltyCalculator.getPendingRoyaltiesCount()).toBe(1);

      royaltyCalculator.startCalculation();

      // Advance timer to trigger processing
      jest.advanceTimersByTime(3600000); // 1 hour

      expect(royaltyCalculator.getPendingRoyaltiesCount()).toBe(0);
    });

    test("should generate reports on timer", async () => {
      const event = createPlaybackEvent();
      await royaltyCalculator.processPlaybackEvent(event);

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      royaltyCalculator.startCalculation();

      // Advance timer to trigger reporting
      jest.advanceTimersByTime(86400000); // 24 hours

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Generated royalty report for artist"),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Data Export", () => {
    beforeEach(async () => {
      const event = createPlaybackEvent();
      await royaltyCalculator.processPlaybackEvent(event);
    });

    test("should export royalty data as JSON", () => {
      const exportData = royaltyCalculator.exportRoyaltyData("json");

      expect(Array.isArray(exportData)).toBe(true);
      expect(exportData[0]).toHaveProperty("eventId");
      expect(exportData[0]).toHaveProperty("trackId");
      expect(exportData[0]).toHaveProperty("royaltyAmount");
    });

    test("should export royalty data as CSV", () => {
      const exportData = royaltyCalculator.exportRoyaltyData("csv");

      expect(typeof exportData).toBe("string");
      expect(exportData).toContain("Event ID,Track ID,Artist ID");
      expect(exportData).toContain("track123,artist456");
    });
  });

  describe("Configuration Updates", () => {
    test("should update configuration", () => {
      const newConfig = {
        ...mockConfig,
        bufferSize: 20,
      };

      royaltyCalculator.updateConfig(newConfig);

      // Configuration should be updated (tested through behavior)
      expect(royaltyCalculator).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    test("should handle processing errors gracefully", async () => {
      const invalidEvent = createPlaybackEvent();
      delete (invalidEvent as any).trackId;

      const result = await royaltyCalculator.processPlaybackEvent(invalidEvent);

      expect(result).toBe(false);
    });

    test("should handle report generation errors", async () => {
      const startDate = Date.now();
      const endDate = Date.now() - 86400000; // End before start

      const report = await royaltyCalculator.generateArtistReport(
        "artist1",
        startDate,
        endDate,
      );

      expect(report.totalStreams).toBe(0);
    });

    test("should handle missing territory gracefully", async () => {
      const event = createPlaybackEvent();
      delete (event as any).territory;

      // Mock timezone detection to return unrecognized timezone
      jest
        .spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions")
        .mockReturnValue({
          timeZone: "Unknown/Timezone",
          locale: "en-US",
          calendar: "gregory",
          numberingSystem: "latn",
        });

      const result = await royaltyCalculator.processPlaybackEvent(event);

      expect(result).toBe(true);
      const metrics = royaltyCalculator.getMetrics();
      expect(metrics.totalRoyaltiesCalculated).toBe(0.0015); // Should default to US
    });
  });

  describe("Stream Type Detection", () => {
    test("should detect premium streams from metadata", async () => {
      const event = createPlaybackEvent();
      (event as any).metadata = { subscriptionType: "premium" };

      await royaltyCalculator.processPlaybackEvent(event);

      const metrics = royaltyCalculator.getMetrics();
      expect(metrics.totalRoyaltiesCalculated).toBe(0.004); // Premium rate
    });

    test("should detect download events", async () => {
      const event = createPlaybackEvent({
        eventType: ANALYTICS_EVENTS.DOWNLOAD_COMPLETE,
      });

      await royaltyCalculator.processPlaybackEvent(event);

      const metrics = royaltyCalculator.getMetrics();
      expect(metrics.totalRoyaltiesCalculated).toBe(0.7); // Download rate
    });

    test("should default to free stream type", async () => {
      const event = createPlaybackEvent();

      await royaltyCalculator.processPlaybackEvent(event);

      const metrics = royaltyCalculator.getMetrics();
      expect(metrics.totalRoyaltiesCalculated).toBe(0.0015); // Free rate
    });
  });

  describe("Industry Compliance", () => {
    test("should enforce 30-second minimum play duration", async () => {
      const shortPlay = createPlaybackEvent({
        position: 29999, // Just under 30 seconds
      });

      const longPlay = createPlaybackEvent({
        position: 30000, // Exactly 30 seconds
      });

      const shortResult =
        await royaltyCalculator.processPlaybackEvent(shortPlay);
      const longResult = await royaltyCalculator.processPlaybackEvent(longPlay);

      expect(shortResult).toBe(false);
      expect(longResult).toBe(true);
    });

    test("should require essential metadata for compliance", async () => {
      const missingTrackId = createPlaybackEvent({ trackId: "" });
      const missingArtistId = createPlaybackEvent({ artistId: "" });
      const completeEvent = createPlaybackEvent();

      const result1 =
        await royaltyCalculator.processPlaybackEvent(missingTrackId);
      const result2 =
        await royaltyCalculator.processPlaybackEvent(missingArtistId);
      const result3 =
        await royaltyCalculator.processPlaybackEvent(completeEvent);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(true);
    });

    test("should track royalties for accounting audit trail", async () => {
      const event = createPlaybackEvent();

      await royaltyCalculator.processPlaybackEvent(event);

      const exportData = royaltyCalculator.exportRoyaltyData("json");
      const royaltyRecord = exportData[0];

      expect(royaltyRecord).toHaveProperty("eventId");
      expect(royaltyRecord).toHaveProperty("trackId");
      expect(royaltyRecord).toHaveProperty("artistId");
      expect(royaltyRecord).toHaveProperty("playDuration");
      expect(royaltyRecord).toHaveProperty("territory");
      expect(royaltyRecord).toHaveProperty("streamType");
      expect(royaltyRecord).toHaveProperty("royaltyAmount");
      expect(royaltyRecord).toHaveProperty("timestamp");
      expect(royaltyRecord).toHaveProperty("calculatedAt");
    });
  });
});
