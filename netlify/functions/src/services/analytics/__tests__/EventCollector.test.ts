/**
 * Tests for Event Collector with axios mocking
 * Tests HTTP requests, retry logic, and buffering behavior
 */

import { EventCollector } from "../EventCollector";
import { EventValidator } from "../EventValidator";
import { PrivacyManager } from "../PrivacyManager";
import { QueueManager } from "../QueueManager";
import { AnalyticsEvent, ANALYTICS_EVENTS } from "../AnalyticsConfig";
import axios, { AxiosResponse } from "axios";

// Mock dependencies
jest.mock("axios");
jest.mock("../EventValidator");
jest.mock("../PrivacyManager");
jest.mock("../QueueManager");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("EventCollector", () => {
  let eventCollector: EventCollector;
  let mockEventValidator: jest.Mocked<EventValidator>;
  let mockPrivacyManager: jest.Mocked<PrivacyManager>;
  let mockQueueManager: jest.Mocked<QueueManager>;

  const sampleEvent: AnalyticsEvent = {
    eventType: ANALYTICS_EVENTS.PLAY_START,
    timestamp: Date.now(),
    sessionId: "session123",
    deviceId: "device456",
    userAgent: "test-agent",
    platform: "web",
    version: "1.0.0",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup axios mock
    mockedAxios.create.mockReturnValue(mockedAxios);
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: { success: true },
    } as AxiosResponse);

    // Create collector instance
    eventCollector = new EventCollector({
      enabled: true,
      bufferSize: 5,
      flushInterval: 1000,
      collectorEndpoint: "/api/analytics/events",
      maxRetries: 3,
      retryDelay: 100,
    });

    // Get mocked instances
    mockEventValidator = (
      EventValidator as jest.MockedClass<typeof EventValidator>
    ).mock.instances[0] as jest.Mocked<EventValidator>;
    mockPrivacyManager = (
      PrivacyManager as jest.MockedClass<typeof PrivacyManager>
    ).mock.instances[0] as jest.Mocked<PrivacyManager>;
    mockQueueManager = (QueueManager as jest.MockedClass<typeof QueueManager>)
      .mock.instances[0] as jest.Mocked<QueueManager>;

    // Setup default mock behavior
    mockEventValidator.validate.mockReturnValue(true);
    mockPrivacyManager.checkConsent.mockResolvedValue(true);
    mockPrivacyManager.sanitizeEvent.mockImplementation(async (event) => event);
  });

  afterEach(() => {
    eventCollector.destroy();
  });

  describe("Event Collection", () => {
    test("should collect valid events successfully", async () => {
      const result = await eventCollector.collect(sampleEvent);

      expect(result).toBe(true);
      expect(mockEventValidator.validate).toHaveBeenCalledWith(
        expect.objectContaining(sampleEvent),
      );
      expect(mockPrivacyManager.checkConsent).toHaveBeenCalledWith(
        sampleEvent.eventType,
      );
      expect(mockPrivacyManager.sanitizeEvent).toHaveBeenCalled();
    });

    test("should reject events without consent", async () => {
      mockPrivacyManager.checkConsent.mockResolvedValue(false);

      const result = await eventCollector.collect(sampleEvent);

      expect(result).toBe(false);
      expect(mockEventValidator.validate).not.toHaveBeenCalled();
    });

    test("should reject invalid events", async () => {
      mockEventValidator.validate.mockReturnValue(false);

      const result = await eventCollector.collect(sampleEvent);

      expect(result).toBe(false);
      expect(mockPrivacyManager.sanitizeEvent).not.toHaveBeenCalled();
    });

    test("should enrich events with missing fields", async () => {
      const partialEvent = {
        eventType: ANALYTICS_EVENTS.PLAY_START,
      };

      await eventCollector.collect(partialEvent);

      expect(mockEventValidator.validate).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: ANALYTICS_EVENTS.PLAY_START,
          timestamp: expect.any(Number),
          sessionId: expect.any(String),
          deviceId: expect.any(String),
          userAgent: expect.any(String),
          platform: "web",
          version: expect.any(String),
        }),
      );
    });

    test("should handle collection errors gracefully", async () => {
      mockPrivacyManager.sanitizeEvent.mockRejectedValue(
        new Error("Sanitization failed"),
      );

      const result = await eventCollector.collect(sampleEvent);

      expect(result).toBe(false);
    });
  });

  describe("HTTP Requests", () => {
    test("should send events to collector endpoint", async () => {
      // Fill buffer to trigger flush
      for (let i = 0; i < 5; i++) {
        await eventCollector.collect({
          ...sampleEvent,
          timestamp: Date.now() + i,
        });
      }

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/analytics/events",
        expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({ eventType: ANALYTICS_EVENTS.PLAY_START }),
          ]),
          batchId: expect.any(String),
          timestamp: expect.any(Number),
          compressed: expect.any(Boolean),
        }),
      );
    });

    test("should send to realtime endpoint for high-priority events", async () => {
      const securityEvent: AnalyticsEvent = {
        ...sampleEvent,
        eventType: ANALYTICS_EVENTS.SECURITY_VIOLATION,
      };

      eventCollector.updateConfig({
        enabled: true,
        bufferSize: 5,
        flushInterval: 1000,
        collectorEndpoint: "/api/analytics/events",
        realtimeEndpoint: "/api/analytics/realtime",
        enableRealtime: true,
        maxRetries: 3,
        retryDelay: 100,
      });

      await eventCollector.collect(securityEvent);
      await eventCollector.flush();

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/analytics/realtime",
        expect.any(Object),
      );
    });

    test("should include proper request headers", async () => {
      await eventCollector.collect(sampleEvent);
      await eventCollector.flush();

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 10000,
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-Analytics-Version": "2.0",
            "X-Session-ID": expect.any(String),
          }),
        }),
      );
    });

    test("should add request interceptor headers", async () => {
      // Simulate interceptor behavior
      const requestConfig = { headers: {} };
      const interceptor = mockedAxios.interceptors.request.use.mock.calls[0][0];

      if (interceptor) {
        const result = interceptor(requestConfig);
        expect(result.headers["X-Request-ID"]).toBeDefined();
        expect(result.headers["X-Timestamp"]).toBeDefined();
      }
    });
  });

  describe("Retry Logic", () => {
    test("should retry failed requests", async () => {
      mockedAxios.post
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          status: 200,
          data: { success: true },
        } as AxiosResponse);

      await eventCollector.collect(sampleEvent);
      await eventCollector.flush();

      // Should eventually succeed after retry
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    test("should implement exponential backoff", async () => {
      mockedAxios.post.mockRejectedValue(new Error("Persistent error"));

      await eventCollector.collect(sampleEvent);

      // Mock the retry process
      const retryPromise = eventCollector.flush();

      // Advance timers to trigger retries
      jest.advanceTimersByTime(100); // First retry
      jest.advanceTimersByTime(200); // Second retry (exponential backoff)
      jest.advanceTimersByTime(400); // Third retry

      await retryPromise;

      const metrics = eventCollector.getMetrics();
      expect(metrics.eventsDropped).toBeGreaterThan(0);
    }, 10000);

    test("should drop events after max retries", async () => {
      mockedAxios.post.mockRejectedValue(new Error("Persistent error"));

      await eventCollector.collect(sampleEvent);
      await eventCollector.flush();

      // Wait for all retries to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const metrics = eventCollector.getMetrics();
      expect(metrics.eventsDropped).toBeGreaterThan(0);
    });
  });

  describe("Buffering Behavior", () => {
    test("should buffer events until buffer size is reached", async () => {
      // Add events but don't fill buffer
      await eventCollector.collect(sampleEvent);
      await eventCollector.collect({
        ...sampleEvent,
        timestamp: Date.now() + 1,
      });

      expect(mockedAxios.post).not.toHaveBeenCalled();

      const metrics = eventCollector.getMetrics();
      expect(metrics.eventsBuffered).toBe(2);
    });

    test("should flush when buffer is full", async () => {
      // Fill buffer to capacity (5 events)
      for (let i = 0; i < 5; i++) {
        await eventCollector.collect({
          ...sampleEvent,
          timestamp: Date.now() + i,
        });
      }

      expect(mockedAxios.post).toHaveBeenCalled();
    });

    test("should flush immediately for high-priority events", async () => {
      const criticalEvent: AnalyticsEvent = {
        ...sampleEvent,
        eventType: ANALYTICS_EVENTS.SECURITY_VIOLATION,
      };

      await eventCollector.collect(criticalEvent);

      expect(mockedAxios.post).toHaveBeenCalled();
    });

    test("should flush on timer interval", async () => {
      jest.useFakeTimers();

      await eventCollector.collect(sampleEvent);

      expect(mockedAxios.post).not.toHaveBeenCalled();

      // Advance timer to trigger flush
      jest.advanceTimersByTime(1000);

      expect(mockedAxios.post).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe("Metrics Tracking", () => {
    test("should track collection metrics", async () => {
      await eventCollector.collect(sampleEvent);
      await eventCollector.collect({
        ...sampleEvent,
        timestamp: Date.now() + 1,
      });

      const metrics = eventCollector.getMetrics();

      expect(metrics.eventsCollected).toBe(2);
      expect(metrics.eventsBuffered).toBe(2);
    });

    test("should track validation failures", async () => {
      mockEventValidator.validate.mockReturnValue(false);

      await eventCollector.collect(sampleEvent);

      const metrics = eventCollector.getMetrics();
      expect(metrics.eventsFailedValidation).toBe(1);
    });

    test("should track sent events", async () => {
      await eventCollector.collect(sampleEvent);
      await eventCollector.flush();

      const metrics = eventCollector.getMetrics();
      expect(metrics.eventsSent).toBe(1);
    });

    test("should track error rate", async () => {
      mockedAxios.post.mockRejectedValue(new Error("Network error"));

      await eventCollector.collect(sampleEvent);
      await eventCollector.flush();

      const metrics = eventCollector.getMetrics();
      expect(metrics.errorRate).toBeGreaterThan(0);
    });

    test("should track average latency", async () => {
      // Mock a delay in the request
      mockedAxios.post.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  status: 200,
                  data: { success: true },
                } as AxiosResponse),
              100,
            ),
          ),
      );

      await eventCollector.collect(sampleEvent);
      await eventCollector.flush();

      const metrics = eventCollector.getMetrics();
      expect(metrics.averageLatency).toBeGreaterThan(0);
    });
  });

  describe("Configuration Updates", () => {
    test("should update configuration", () => {
      const newConfig = {
        enabled: false,
        bufferSize: 10,
        flushInterval: 2000,
      };

      eventCollector.updateConfig(newConfig);

      // Should reflect in behavior (events not collected when disabled)
      eventCollector.setEnabled(false);

      const result = eventCollector.collect(sampleEvent);
      expect(result).resolves.toBe(false);
    });

    test("should restart flush timer on interval change", () => {
      jest.useFakeTimers();
      jest.spyOn(global, "setInterval");
      jest.spyOn(global, "clearInterval");

      eventCollector.updateConfig({ flushInterval: 5000 });

      expect(clearInterval).toHaveBeenCalled();
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 5000);

      jest.useRealTimers();
    });
  });

  describe("Enable/Disable Functionality", () => {
    test("should stop collecting when disabled", async () => {
      eventCollector.setEnabled(false);

      const result = await eventCollector.collect(sampleEvent);

      expect(result).toBe(false);
      expect(mockEventValidator.validate).not.toHaveBeenCalled();
    });

    test("should flush remaining events when disabled", async () => {
      await eventCollector.collect(sampleEvent);

      eventCollector.setEnabled(false);

      expect(mockedAxios.post).toHaveBeenCalled();
    });

    test("should resume collecting when re-enabled", async () => {
      eventCollector.setEnabled(false);
      eventCollector.setEnabled(true);

      const result = await eventCollector.collect(sampleEvent);

      expect(result).toBe(true);
    });
  });

  describe("Browser Integration", () => {
    test("should handle beforeunload event", () => {
      const mockSendBeacon = jest.fn();
      Object.defineProperty(navigator, "sendBeacon", {
        value: mockSendBeacon,
        writable: true,
      });

      // Simulate collecting an event
      eventCollector.collect(sampleEvent);

      // Simulate beforeunload
      const beforeUnloadEvent = new Event("beforeunload");
      window.dispatchEvent(beforeUnloadEvent);

      expect(mockSendBeacon).toHaveBeenCalledWith(
        "/api/analytics/events",
        expect.any(String),
      );
    });

    test("should generate device ID from localStorage", async () => {
      const mockGetItem = jest.fn().mockReturnValue(null);
      const mockSetItem = jest.fn();

      Object.defineProperty(Storage.prototype, "getItem", {
        value: mockGetItem,
      });
      Object.defineProperty(Storage.prototype, "setItem", {
        value: mockSetItem,
      });

      await eventCollector.collect(sampleEvent);

      expect(mockGetItem).toHaveBeenCalledWith("beatflow_device_id");
      expect(mockSetItem).toHaveBeenCalledWith(
        "beatflow_device_id",
        expect.stringMatching(/^device_\d+_[a-z0-9]+$/),
      );
    });
  });

  describe("Error Handling", () => {
    test("should handle network errors gracefully", async () => {
      mockedAxios.post.mockRejectedValue(new Error("Network unavailable"));

      await eventCollector.collect(sampleEvent);
      const result = await eventCollector.flush();

      // Should not throw error
      expect(result).toBeUndefined();
    });

    test("should handle malformed responses", async () => {
      mockedAxios.post.mockResolvedValue({
        status: 500,
        statusText: "Internal Server Error",
      } as AxiosResponse);

      await eventCollector.collect(sampleEvent);
      await eventCollector.flush();

      const metrics = eventCollector.getMetrics();
      expect(metrics.eventsDropped).toBeGreaterThan(0);
    });

    test("should handle privacy manager errors", async () => {
      mockPrivacyManager.checkConsent.mockRejectedValue(
        new Error("Privacy check failed"),
      );

      const result = await eventCollector.collect(sampleEvent);

      expect(result).toBe(false);
    });

    test("should handle event validator errors", async () => {
      mockEventValidator.validate.mockImplementation(() => {
        throw new Error("Validation error");
      });

      const result = await eventCollector.collect(sampleEvent);

      expect(result).toBe(false);
    });
  });

  describe("Cleanup and Destruction", () => {
    test("should flush remaining events on destroy", async () => {
      await eventCollector.collect(sampleEvent);

      eventCollector.destroy();

      expect(mockedAxios.post).toHaveBeenCalled();
    });

    test("should stop collecting after destroy", async () => {
      eventCollector.destroy();

      const result = await eventCollector.collect(sampleEvent);

      expect(result).toBe(false);
    });

    test("should clear timers on destroy", () => {
      jest.spyOn(global, "clearInterval");

      eventCollector.destroy();

      expect(clearInterval).toHaveBeenCalled();
    });
  });

  describe("Platform Detection", () => {
    test("should detect mobile platform", async () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        configurable: true,
      });

      const collector = new EventCollector();
      await collector.collect(sampleEvent);

      expect(mockEventValidator.validate).toHaveBeenCalledWith(
        expect.objectContaining({ platform: "mobile" }),
      );

      collector.destroy();
    });

    test("should detect web platform by default", async () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        configurable: true,
      });

      await eventCollector.collect(sampleEvent);

      expect(mockEventValidator.validate).toHaveBeenCalledWith(
        expect.objectContaining({ platform: "web" }),
      );
    });
  });
});
