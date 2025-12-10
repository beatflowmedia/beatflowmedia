/**
 * Event Collection Service with Buffering and Real-time Streaming
 * Handles collection, buffering, validation, and transmission of analytics events
 */

import axios, { AxiosInstance, AxiosResponse } from "axios";
import {
  AnalyticsEvent,
  AnalyticsConfig,
  DEFAULT_ANALYTICS_CONFIG,
  ANALYTICS_EVENTS,
} from "./AnalyticsConfig";
import { EventValidator } from "./EventValidator";
import { PrivacyManager } from "./PrivacyManager";
import { QueueManager } from "./QueueManager";

export interface CollectorMetrics {
  eventsCollected: number;
  eventsBuffered: number;
  eventsSent: number;
  eventsFailedValidation: number;
  eventsDropped: number;
  lastFlushTime: number;
  averageLatency: number;
  errorRate: number;
}

export class EventCollector {
  private config: AnalyticsConfig;
  private buffer: AnalyticsEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private retryQueue: AnalyticsEvent[] = [];
  private httpClient: AxiosInstance;
  private metrics: CollectorMetrics;
  private eventValidator: EventValidator;
  private privacyManager: PrivacyManager;
  private queueManager: QueueManager;
  private isEnabled = true;
  private sessionId: string;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_ANALYTICS_CONFIG, ...config };
    this.metrics = this.initializeMetrics();
    this.sessionId = this.generateSessionId();

    this.httpClient = axios.create({
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        "X-Analytics-Version": "2.0",
        "X-Session-ID": this.sessionId,
      },
    });

    this.eventValidator = new EventValidator();
    this.privacyManager = new PrivacyManager(this.config);
    this.queueManager = new QueueManager(this.config);

    this.setupInterceptors();
    this.startFlushTimer();
    this.setupBeforeUnload();
  }

  /**
   * Collect an analytics event
   */
  public async collect(event: Partial<AnalyticsEvent>): Promise<boolean> {
    if (!this.isEnabled || !this.config.enabled) {
      return false;
    }

    // Check privacy consent
    if (!(await this.privacyManager.checkConsent(event.eventType))) {
      return false;
    }

    try {
      // Enrich event with standard fields
      const enrichedEvent = this.enrichEvent(event);

      // Validate event
      if (!this.eventValidator.validate(enrichedEvent)) {
        this.metrics.eventsFailedValidation++;
        console.warn("Analytics event failed validation:", enrichedEvent);
        return false;
      }

      // Apply privacy filters
      const sanitizedEvent =
        await this.privacyManager.sanitizeEvent(enrichedEvent);

      // Add to buffer
      this.buffer.push(sanitizedEvent);
      this.metrics.eventsCollected++;
      this.metrics.eventsBuffered = this.buffer.length;

      // Immediate flush for high-priority events
      if (this.isHighPriorityEvent(sanitizedEvent)) {
        await this.flush();
      }

      // Check buffer size
      if (this.buffer.length >= this.config.bufferSize) {
        await this.flush();
      }

      return true;
    } catch (error) {
      console.error("Error collecting analytics event:", error);
      return false;
    }
  }

  /**
   * Force flush all buffered events
   */
  public async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const eventsToSend = [...this.buffer];
    this.buffer = [];
    this.metrics.eventsBuffered = 0;

    try {
      await this.sendEvents(eventsToSend);
      this.metrics.lastFlushTime = Date.now();
    } catch (error) {
      console.error("Error flushing events:", error);
      // Add failed events to retry queue
      this.retryQueue.push(...eventsToSend);
      await this.retryFailedEvents();
    }
  }

  /**
   * Get current collector metrics
   */
  public getMetrics(): CollectorMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  /**
   * Enable/disable event collection
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled && this.buffer.length > 0) {
      this.flush();
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.privacyManager.updateConfig(this.config);
    this.queueManager.updateConfig(this.config);

    // Restart flush timer with new interval
    this.stopFlushTimer();
    this.startFlushTimer();
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopFlushTimer();
    this.flush();
    this.isEnabled = false;
  }

  /**
   * Enrich event with standard fields
   */
  private enrichEvent(event: Partial<AnalyticsEvent>): AnalyticsEvent {
    const baseEvent: AnalyticsEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      sessionId: this.sessionId,
      deviceId: this.getDeviceId(),
      userAgent: navigator.userAgent,
      platform: this.detectPlatform(),
      version: this.getAppVersion(),
      eventType: event.eventType || "unknown",
    } as AnalyticsEvent;

    return baseEvent;
  }

  /**
   * Send events to analytics endpoint
   */
  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    const startTime = Date.now();

    try {
      const payload = {
        events: events,
        batchId: this.generateBatchId(),
        timestamp: Date.now(),
        compressed: this.config.compressionEnabled,
      };

      let response: AxiosResponse;

      if (
        this.config.enableRealtime &&
        events.some((e) => this.isRealtimeEvent(e))
      ) {
        // Send realtime events to realtime endpoint
        response = await this.httpClient.post(
          this.config.realtimeEndpoint,
          payload,
        );
      } else {
        // Send to batch endpoint
        response = await this.httpClient.post(
          this.config.collectorEndpoint,
          payload,
        );
      }

      if (response.status === 200) {
        this.metrics.eventsSent += events.length;
        this.updateLatencyMetric(Date.now() - startTime);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.metrics.eventsDropped += events.length;
      this.updateErrorRate();
      throw error;
    }
  }

  /**
   * Retry failed events with exponential backoff
   */
  private async retryFailedEvents(): Promise<void> {
    if (this.retryQueue.length === 0) return;

    const eventsToRetry = this.retryQueue.splice(0, this.config.batchSize);
    let retryCount = 0;

    while (retryCount < this.config.maxRetries && eventsToRetry.length > 0) {
      try {
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.retryDelay * Math.pow(2, retryCount)),
        );

        await this.sendEvents(eventsToRetry);
        break; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        console.warn(`Retry attempt ${retryCount} failed:`, error);

        if (retryCount >= this.config.maxRetries) {
          this.metrics.eventsDropped += eventsToRetry.length;
          console.error(
            "Max retries exceeded, dropping events:",
            eventsToRetry.length,
          );
        }
      }
    }
  }

  /**
   * Check if event is high priority (needs immediate sending)
   */
  private isHighPriorityEvent(event: AnalyticsEvent): boolean {
    const highPriorityEvents = [
      ANALYTICS_EVENTS.SECURITY_VIOLATION,
      ANALYTICS_EVENTS.DRM_ERROR,
      ANALYTICS_EVENTS.PAYMENT_FAILURE,
      ANALYTICS_EVENTS.AUTHENTICATION_FAILURE,
    ];

    return highPriorityEvents.includes(event.eventType as any);
  }

  /**
   * Check if event should be sent to realtime endpoint
   */
  private isRealtimeEvent(event: AnalyticsEvent): boolean {
    const realtimeEvents = [
      ANALYTICS_EVENTS.PLAY_START,
      ANALYTICS_EVENTS.PLAY_END,
      ANALYTICS_EVENTS.SESSION_START,
      ANALYTICS_EVENTS.SESSION_END,
      ANALYTICS_EVENTS.SECURITY_VIOLATION,
    ];

    return realtimeEvents.includes(event.eventType as any);
  }

  /**
   * Setup HTTP client interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.httpClient.interceptors.request.use(
      (config) => {
        config.headers["X-Request-ID"] = this.generateRequestId();
        config.headers["X-Timestamp"] = Date.now().toString();
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        this.updateErrorRate();
        return Promise.reject(error);
      },
    );
  }

  /**
   * Setup beforeunload event to flush remaining events
   */
  private setupBeforeUnload(): void {
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        // Use sendBeacon for reliable delivery during page unload
        if (this.buffer.length > 0 && navigator.sendBeacon) {
          const payload = JSON.stringify({
            events: this.buffer,
            batchId: this.generateBatchId(),
            timestamp: Date.now(),
          });

          navigator.sendBeacon(this.config.collectorEndpoint, payload);
        }
      });
    }
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  /**
   * Stop flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Initialize metrics object
   */
  private initializeMetrics(): CollectorMetrics {
    return {
      eventsCollected: 0,
      eventsBuffered: 0,
      eventsSent: 0,
      eventsFailedValidation: 0,
      eventsDropped: 0,
      lastFlushTime: 0,
      averageLatency: 0,
      errorRate: 0,
    };
  }

  /**
   * Update latency metric with exponential moving average
   */
  private updateLatencyMetric(latency: number): void {
    if (this.metrics.averageLatency === 0) {
      this.metrics.averageLatency = latency;
    } else {
      // Exponential moving average with alpha = 0.1
      this.metrics.averageLatency =
        0.1 * latency + 0.9 * this.metrics.averageLatency;
    }
  }

  /**
   * Update error rate metric
   */
  private updateErrorRate(): void {
    const totalEvents =
      this.metrics.eventsCollected + this.metrics.eventsDropped;
    this.metrics.errorRate =
      totalEvents > 0 ? this.metrics.eventsDropped / totalEvents : 0;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique batch ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Get or generate device ID
   */
  private getDeviceId(): string {
    let deviceId = localStorage.getItem("beatflow_device_id");
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
      localStorage.setItem("beatflow_device_id", deviceId);
    }
    return deviceId;
  }

  /**
   * Detect platform type
   */
  private detectPlatform(): "web" | "mobile" | "desktop" {
    const userAgent = navigator.userAgent.toLowerCase();
    if (
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent,
      )
    ) {
      return "mobile";
    }
    return "web";
  }

  /**
   * Get application version
   */
  private getAppVersion(): string {
    return process.env.REACT_APP_VERSION || "1.0.0";
  }
}
