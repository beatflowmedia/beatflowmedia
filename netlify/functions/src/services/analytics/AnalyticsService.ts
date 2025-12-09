/**
 * Main Analytics Service
 * Central service that orchestrates event collection, real-time streaming, and analytics processing
 */

import { EventCollector } from "./EventCollector";
import { EventValidator } from "./EventValidator";
import { PrivacyManager } from "./PrivacyManager";
import { QueueManager } from "./QueueManager";
import { RoyaltyCalculator } from "./RoyaltyCalculator";
import { PerformanceMonitor } from "./PerformanceMonitor";
import {
  AnalyticsEvent,
  PlaybackEvent,
  UserEngagementEvent,
  SecurityEvent,
  PerformanceEvent,
  AnalyticsConfig,
  DEFAULT_ANALYTICS_CONFIG,
  ANALYTICS_EVENTS,
} from "./AnalyticsConfig";

export interface AnalyticsServiceConfig extends AnalyticsConfig {
  enableRoyaltyCalculation: boolean;
  enablePerformanceMonitoring: boolean;
  enableSecurityTracking: boolean;
}

export interface ServiceMetrics {
  eventsProcessed: number;
  eventsPerSecond: number;
  averageProcessingTime: number;
  errorRate: number;
  queueSize: number;
  lastFlushTime: number;
}

export class AnalyticsService {
  private config: AnalyticsServiceConfig;
  private eventCollector: EventCollector;
  private eventValidator: EventValidator;
  private privacyManager: PrivacyManager;
  private queueManager: QueueManager;
  private royaltyCalculator?: RoyaltyCalculator;
  private performanceMonitor?: PerformanceMonitor;
  private isInitialized = false;
  private sessionId: string;
  private userId?: string;

  constructor(config: Partial<AnalyticsServiceConfig> = {}) {
    this.config = {
      ...DEFAULT_ANALYTICS_CONFIG,
      enableRoyaltyCalculation: true,
      enablePerformanceMonitoring: true,
      enableSecurityTracking: true,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.initializeServices();
  }

  /**
   * Initialize the analytics service
   */
  public async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) return;

    this.userId = userId;

    // Track session start
    await this.trackSessionStart();

    // Initialize performance monitoring
    if (this.config.enablePerformanceMonitoring) {
      this.performanceMonitor = new PerformanceMonitor(this.config);
      this.performanceMonitor.startMonitoring();
    }

    // Initialize royalty calculation
    if (this.config.enableRoyaltyCalculation) {
      this.royaltyCalculator = new RoyaltyCalculator(this.config);
      this.royaltyCalculator.startCalculation();
    }

    this.isInitialized = true;
    console.log("Analytics service initialized");
  }

  /**
   * Track playback events
   */
  public async trackPlayback(
    eventType: keyof typeof ANALYTICS_EVENTS,
    data: Partial<PlaybackEvent>,
  ): Promise<boolean> {
    const event: PlaybackEvent = {
      ...data,
      eventType,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      deviceId: this.getDeviceId(),
      userAgent: navigator.userAgent,
      platform: this.detectPlatform(),
      version: this.getAppVersion(),
      position: data.position || 0,
      duration: data.duration || 0,
      quality: data.quality || "unknown",
      trackId: data.trackId || "unknown",
    } as PlaybackEvent;

    // Calculate royalties for qualifying events
    if (this.royaltyCalculator && this.isRoyaltyEligibleEvent(eventType)) {
      await this.royaltyCalculator.processPlaybackEvent(event);
    }

    return await this.eventCollector.collect(event);
  }

  /**
   * Track user engagement events
   */
  public async trackEngagement(
    eventType: keyof typeof ANALYTICS_EVENTS,
    data: Partial<UserEngagementEvent>,
  ): Promise<boolean> {
    const event: UserEngagementEvent = {
      ...data,
      eventType,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      deviceId: this.getDeviceId(),
      userAgent: navigator.userAgent,
      platform: this.detectPlatform(),
      version: this.getAppVersion(),
      action: data.action || eventType,
    } as UserEngagementEvent;

    return await this.eventCollector.collect(event);
  }

  /**
   * Track security events
   */
  public async trackSecurity(
    eventType: keyof typeof ANALYTICS_EVENTS,
    data: Partial<SecurityEvent>,
  ): Promise<boolean> {
    if (!this.config.enableSecurityTracking) return false;

    const event: SecurityEvent = {
      ...data,
      eventType,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      deviceId: this.getDeviceId(),
      userAgent: navigator.userAgent,
      platform: this.detectPlatform(),
      version: this.getAppVersion(),
      securityLevel: data.securityLevel || "medium",
      details: data.details || {},
    } as SecurityEvent;

    // High priority for security events
    return await this.eventCollector.collect(event);
  }

  /**
   * Track performance events
   */
  public async trackPerformance(
    eventType: keyof typeof ANALYTICS_EVENTS,
    data: Partial<PerformanceEvent>,
  ): Promise<boolean> {
    if (!this.config.enablePerformanceMonitoring) return false;

    const event: PerformanceEvent = {
      ...data,
      eventType,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      deviceId: this.getDeviceId(),
      userAgent: navigator.userAgent,
      platform: this.detectPlatform(),
      version: this.getAppVersion(),
      metric: data.metric || "unknown",
      value: data.value || 0,
      unit: data.unit || "ms",
    } as PerformanceEvent;

    return await this.eventCollector.collect(event);
  }

  /**
   * Track custom events
   */
  public async trackCustom(
    eventType: string,
    data: Record<string, any>,
  ): Promise<boolean> {
    const event: AnalyticsEvent = {
      eventType: eventType as any,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      deviceId: this.getDeviceId(),
      userAgent: navigator.userAgent,
      platform: this.detectPlatform(),
      version: this.getAppVersion(),
      ...data,
    };

    return await this.eventCollector.collect(event);
  }

  /**
   * Get service metrics
   */
  public getMetrics(): ServiceMetrics {
    const collectorMetrics = this.eventCollector.getMetrics();
    const queueMetrics = this.queueManager.getMetrics();

    return {
      eventsProcessed: collectorMetrics.eventsSent,
      eventsPerSecond: this.calculateEventsPerSecond(),
      averageProcessingTime: collectorMetrics.averageLatency,
      errorRate: collectorMetrics.errorRate,
      queueSize: queueMetrics.totalQueued,
      lastFlushTime: collectorMetrics.lastFlushTime,
    };
  }

  /**
   * Update service configuration
   */
  public updateConfig(newConfig: Partial<AnalyticsServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };

    this.eventCollector.updateConfig(this.config);
    this.privacyManager.updateConfig(this.config);
    this.queueManager.updateConfig(this.config);

    if (this.performanceMonitor) {
      this.performanceMonitor.updateConfig(this.config);
    }

    if (this.royaltyCalculator) {
      this.royaltyCalculator.updateConfig(this.config);
    }
  }

  /**
   * Update user consent settings
   */
  public updateConsent(consent: any): void {
    this.privacyManager.updateConsent(consent);
  }

  /**
   * Get consent status
   */
  public getConsentStatus(): any {
    return this.privacyManager.getConsentStatus();
  }

  /**
   * Request data export for user
   */
  public async requestDataExport(): Promise<any> {
    if (!this.userId) {
      throw new Error("No user ID available for data export");
    }
    return await this.privacyManager.requestDataExport(this.userId);
  }

  /**
   * Request data deletion for user
   */
  public async requestDataDeletion(): Promise<boolean> {
    if (!this.userId) {
      throw new Error("No user ID available for data deletion");
    }
    return await this.privacyManager.requestDataDeletion(this.userId);
  }

  /**
   * Force flush all pending events
   */
  public async flush(): Promise<void> {
    await this.eventCollector.flush();
  }

  /**
   * Start a new session
   */
  public async startNewSession(userId?: string): Promise<void> {
    // End current session
    await this.trackSessionEnd();

    // Generate new session ID
    this.sessionId = this.generateSessionId();
    this.userId = userId;

    // Start new session
    await this.trackSessionStart();
  }

  /**
   * Clean shutdown
   */
  public async destroy(): Promise<void> {
    // Track session end
    await this.trackSessionEnd();

    // Flush remaining events
    await this.flush();

    // Stop monitoring services
    if (this.performanceMonitor) {
      this.performanceMonitor.stopMonitoring();
    }

    if (this.royaltyCalculator) {
      this.royaltyCalculator.stopCalculation();
    }

    // Cleanup collectors
    this.eventCollector.destroy();

    this.isInitialized = false;
    console.log("Analytics service destroyed");
  }

  /**
   * Initialize service components
   */
  private initializeServices(): void {
    this.eventValidator = new EventValidator();
    this.privacyManager = new PrivacyManager(this.config);
    this.queueManager = new QueueManager(this.config);
    this.eventCollector = new EventCollector(this.config);
  }

  /**
   * Track session start event
   */
  private async trackSessionStart(): Promise<void> {
    const event: AnalyticsEvent = {
      eventType: ANALYTICS_EVENTS.SESSION_START,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      deviceId: this.getDeviceId(),
      userAgent: navigator.userAgent,
      platform: this.detectPlatform(),
      version: this.getAppVersion(),
    };

    await this.eventCollector.collect(event);
  }

  /**
   * Track session end event
   */
  private async trackSessionEnd(): Promise<void> {
    const event: AnalyticsEvent = {
      eventType: ANALYTICS_EVENTS.SESSION_END,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      deviceId: this.getDeviceId(),
      userAgent: navigator.userAgent,
      platform: this.detectPlatform(),
      version: this.getAppVersion(),
    };

    await this.eventCollector.collect(event);
  }

  /**
   * Check if event is eligible for royalty calculation
   */
  private isRoyaltyEligibleEvent(eventType: string): boolean {
    return [
      ANALYTICS_EVENTS.PLAY_START,
      ANALYTICS_EVENTS.TRACK_COMPLETE,
      ANALYTICS_EVENTS.DOWNLOAD_COMPLETE,
    ].includes(eventType as any);
  }

  /**
   * Calculate events per second
   */
  private calculateEventsPerSecond(): number {
    const metrics = this.eventCollector.getMetrics();
    const timeElapsed = Date.now() - (metrics.lastFlushTime || Date.now());
    return timeElapsed > 0 ? metrics.eventsSent / (timeElapsed / 1000) : 0;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
