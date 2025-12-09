/**
 * Performance Monitor Service
 * Monitors application performance, network quality, and system health
 */

import { AnalyticsConfig, ANALYTICS_EVENTS } from "./AnalyticsConfig";

export interface PerformanceMetrics {
  // Page Performance
  pageLoadTime: number;
  domContentLoadedTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;

  // Network Performance
  networkLatency: number;
  bandwidth: number;
  connectionType: string;
  effectiveType: string;

  // Audio Performance
  bufferHealth: number;
  audioDropouts: number;
  bitrateChanges: number;
  seekLatency: number;

  // Memory Performance
  heapUsed: number;
  heapTotal: number;
  heapLimit: number;

  // Error Rates
  jsErrorRate: number;
  networkErrorRate: number;
  audioErrorRate: number;

  timestamp: number;
}

export interface AlertConfig {
  metric: string;
  threshold: number;
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
}

export interface PerformanceAlert {
  id: string;
  metric: string;
  value: number;
  threshold: number;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: number;
  resolved: boolean;
}

export class PerformanceMonitor {
  private config: AnalyticsConfig;
  private isMonitoring = false;
  private metricsTimer: NodeJS.Timeout | null = null;
  private observer: PerformanceObserver | null = null;
  private currentMetrics: PerformanceMetrics;
  private alertConfigs: AlertConfig[] = [];
  private activeAlerts: Map<string, PerformanceAlert> = new Map();
  private errorCounts = { js: 0, network: 0, audio: 0 };
  private totalRequests = { js: 0, network: 0, audio: 0 };

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.currentMetrics = this.initializeMetrics();
    this.setupAlertConfigs();
    this.setupErrorHandlers();
  }

  /**
   * Start performance monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Setup performance observer for web vitals
    this.setupPerformanceObserver();

    // Setup network monitoring
    this.setupNetworkMonitoring();

    // Start periodic metrics collection
    this.metricsTimer = setInterval(() => {
      this.collectMetrics();
    }, 5000); // Collect every 5 seconds

    console.log("Performance monitoring started");
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = null;
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    console.log("Performance monitoring stopped");
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.currentMetrics };
  }

  /**
   * Get active performance alerts
   */
  public getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.activeAlerts.values()).filter(
      (alert) => !alert.resolved,
    );
  }

  /**
   * Update configuration
   */
  public updateConfig(config: AnalyticsConfig): void {
    this.config = config;
  }

  /**
   * Record audio performance event
   */
  public recordAudioEvent(eventType: string, data: any): void {
    switch (eventType) {
      case "buffer_health":
        this.currentMetrics.bufferHealth = data.health || 0;
        this.checkAlert("bufferHealth", this.currentMetrics.bufferHealth);
        break;

      case "audio_dropout":
        this.currentMetrics.audioDropouts++;
        this.errorCounts.audio++;
        break;

      case "bitrate_change":
        this.currentMetrics.bitrateChanges++;
        break;

      case "seek_latency":
        this.currentMetrics.seekLatency = data.latency || 0;
        this.checkAlert("seekLatency", this.currentMetrics.seekLatency);
        break;

      case "audio_error":
        this.errorCounts.audio++;
        break;
    }

    this.totalRequests.audio++;
    this.currentMetrics.audioErrorRate =
      this.errorCounts.audio / this.totalRequests.audio;
  }

  /**
   * Record network performance event
   */
  public recordNetworkEvent(eventType: string, data: any): void {
    switch (eventType) {
      case "latency":
        this.currentMetrics.networkLatency = data.latency || 0;
        this.checkAlert("networkLatency", this.currentMetrics.networkLatency);
        break;

      case "bandwidth":
        this.currentMetrics.bandwidth = data.bandwidth || 0;
        break;

      case "error":
        this.errorCounts.network++;
        break;
    }

    this.totalRequests.network++;
    this.currentMetrics.networkErrorRate =
      this.errorCounts.network / this.totalRequests.network;
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): any {
    const alerts = this.getActiveAlerts();
    const criticalAlerts = alerts.filter((a) => a.severity === "critical");
    const highAlerts = alerts.filter((a) => a.severity === "high");

    return {
      overall: this.getOverallPerformanceScore(),
      criticalIssues: criticalAlerts.length,
      warnings: highAlerts.length,
      metrics: {
        pageLoad: `${this.currentMetrics.pageLoadTime.toFixed(0)}ms`,
        networkLatency: `${this.currentMetrics.networkLatency.toFixed(0)}ms`,
        bufferHealth: `${(this.currentMetrics.bufferHealth * 100).toFixed(1)}%`,
        errorRate: `${(this.currentMetrics.jsErrorRate * 100).toFixed(2)}%`,
      },
    };
  }

  /**
   * Setup performance observer for web vitals
   */
  private setupPerformanceObserver(): void {
    if (typeof PerformanceObserver === "undefined") return;

    try {
      this.observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.processPerformanceEntry(entry);
        });
      });

      // Observe different types of performance entries
      this.observer.observe({
        entryTypes: ["navigation", "paint", "largest-contentful-paint"],
      });

      // Setup layout shift observer
      if ("LayoutShift" in window) {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          let cls = 0;
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          });
          this.currentMetrics.cumulativeLayoutShift = cls;
        });
        layoutShiftObserver.observe({ entryTypes: ["layout-shift"] });
      }
    } catch (error) {
      console.warn("Performance observer setup failed:", error);
    }
  }

  /**
   * Process performance entry
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case "navigation":
        const navEntry = entry as PerformanceNavigationTiming;
        this.currentMetrics.pageLoadTime =
          navEntry.loadEventEnd - navEntry.navigationStart;
        this.currentMetrics.domContentLoadedTime =
          navEntry.domContentLoadedEventEnd - navEntry.navigationStart;
        this.checkAlert("pageLoadTime", this.currentMetrics.pageLoadTime);
        break;

      case "paint":
        const paintEntry = entry as PerformancePaintTiming;
        if (paintEntry.name === "first-contentful-paint") {
          this.currentMetrics.firstContentfulPaint = paintEntry.startTime;
        }
        break;

      case "largest-contentful-paint":
        const lcpEntry = entry as any;
        this.currentMetrics.largestContentfulPaint = lcpEntry.startTime;
        this.checkAlert(
          "largestContentfulPaint",
          this.currentMetrics.largestContentfulPaint,
        );
        break;
    }
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    // Monitor connection changes
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      this.currentMetrics.connectionType = connection.type || "unknown";
      this.currentMetrics.effectiveType = connection.effectiveType || "unknown";
      this.currentMetrics.bandwidth = connection.downlink || 0;

      connection.addEventListener("change", () => {
        this.currentMetrics.connectionType = connection.type || "unknown";
        this.currentMetrics.effectiveType =
          connection.effectiveType || "unknown";
        this.currentMetrics.bandwidth = connection.downlink || 0;
      });
    }

    // Monitor network latency
    this.measureNetworkLatency();
    setInterval(() => this.measureNetworkLatency(), 30000); // Every 30 seconds
  }

  /**
   * Measure network latency
   */
  private async measureNetworkLatency(): Promise<void> {
    try {
      const start = performance.now();
      await fetch("/ping", { method: "HEAD", mode: "no-cors" });
      const latency = performance.now() - start;
      this.currentMetrics.networkLatency = latency;
      this.checkAlert("networkLatency", latency);
    } catch (error) {
      this.errorCounts.network++;
    }
  }

  /**
   * Collect current metrics
   */
  private collectMetrics(): void {
    // Update memory metrics
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      this.currentMetrics.heapUsed = memory.usedJSHeapSize;
      this.currentMetrics.heapTotal = memory.totalJSHeapSize;
      this.currentMetrics.heapLimit = memory.jsHeapSizeLimit;

      // Check memory usage alert
      const memoryUsageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      this.checkAlert("memoryUsage", memoryUsageRatio);
    }

    // Update timestamp
    this.currentMetrics.timestamp = Date.now();

    // Emit metrics event (would be sent to analytics in real implementation)
    if (this.config.enablePerformanceMonitoring) {
      this.emitPerformanceEvent();
    }
  }

  /**
   * Setup error handlers
   */
  private setupErrorHandlers(): void {
    // JavaScript errors
    window.addEventListener("error", (event) => {
      this.errorCounts.js++;
      this.totalRequests.js++;
      this.currentMetrics.jsErrorRate =
        this.errorCounts.js / this.totalRequests.js;
    });

    // Unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.errorCounts.js++;
      this.totalRequests.js++;
      this.currentMetrics.jsErrorRate =
        this.errorCounts.js / this.totalRequests.js;
    });
  }

  /**
   * Setup alert configurations
   */
  private setupAlertConfigs(): void {
    this.alertConfigs = [
      {
        metric: "pageLoadTime",
        threshold: 3000,
        severity: "high",
        enabled: true,
      },
      {
        metric: "networkLatency",
        threshold: 1000,
        severity: "medium",
        enabled: true,
      },
      {
        metric: "largestContentfulPaint",
        threshold: 2500,
        severity: "high",
        enabled: true,
      },
      {
        metric: "bufferHealth",
        threshold: 0.1,
        severity: "critical",
        enabled: true,
      },
      {
        metric: "seekLatency",
        threshold: 500,
        severity: "medium",
        enabled: true,
      },
      {
        metric: "memoryUsage",
        threshold: 0.9,
        severity: "high",
        enabled: true,
      },
      {
        metric: "jsErrorRate",
        threshold: 0.05,
        severity: "critical",
        enabled: true,
      },
    ];
  }

  /**
   * Check metric against alert thresholds
   */
  private checkAlert(metric: string, value: number): void {
    const alertConfig = this.alertConfigs.find(
      (config) => config.metric === metric,
    );
    if (!alertConfig || !alertConfig.enabled) return;

    const alertKey = `${metric}_${alertConfig.threshold}`;
    const isAboveThreshold = value > alertConfig.threshold;

    if (isAboveThreshold && !this.activeAlerts.has(alertKey)) {
      // Create new alert
      const alert: PerformanceAlert = {
        id: this.generateAlertId(),
        metric,
        value,
        threshold: alertConfig.threshold,
        severity: alertConfig.severity,
        message: this.generateAlertMessage(
          metric,
          value,
          alertConfig.threshold,
        ),
        timestamp: Date.now(),
        resolved: false,
      };

      this.activeAlerts.set(alertKey, alert);
      console.warn(`Performance alert: ${alert.message}`);
    } else if (!isAboveThreshold && this.activeAlerts.has(alertKey)) {
      // Resolve existing alert
      const alert = this.activeAlerts.get(alertKey)!;
      alert.resolved = true;
      console.log(`Performance alert resolved: ${alert.message}`);
    }
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(
    metric: string,
    value: number,
    threshold: number,
  ): string {
    const formatValue = (val: number) => {
      if (metric.includes("Time") || metric.includes("Latency")) {
        return `${val.toFixed(0)}ms`;
      } else if (metric.includes("Rate") || metric.includes("Usage")) {
        return `${(val * 100).toFixed(2)}%`;
      } else if (metric === "bufferHealth") {
        return `${(val * 100).toFixed(1)}%`;
      }
      return val.toFixed(2);
    };

    return `${metric} is ${formatValue(value)} (threshold: ${formatValue(threshold)})`;
  }

  /**
   * Get overall performance score (0-100)
   */
  private getOverallPerformanceScore(): number {
    let score = 100;

    // Page load performance (25% weight)
    if (this.currentMetrics.pageLoadTime > 3000) score -= 15;
    else if (this.currentMetrics.pageLoadTime > 2000) score -= 8;

    // Network performance (25% weight)
    if (this.currentMetrics.networkLatency > 500) score -= 15;
    else if (this.currentMetrics.networkLatency > 200) score -= 8;

    // Audio performance (30% weight)
    if (this.currentMetrics.bufferHealth < 0.1) score -= 20;
    else if (this.currentMetrics.bufferHealth < 0.3) score -= 10;

    // Error rates (20% weight)
    if (this.currentMetrics.jsErrorRate > 0.05) score -= 15;
    else if (this.currentMetrics.jsErrorRate > 0.02) score -= 8;

    return Math.max(0, score);
  }

  /**
   * Emit performance event to analytics
   */
  private emitPerformanceEvent(): void {
    // In real implementation, this would send to analytics service
    const event = {
      eventType: ANALYTICS_EVENTS.LATENCY_MEASUREMENT,
      timestamp: Date.now(),
      metrics: this.currentMetrics,
      alerts: this.getActiveAlerts().length,
    };

    console.debug("Performance metrics collected:", event);
  }

  /**
   * Initialize metrics object
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      pageLoadTime: 0,
      domContentLoadedTime: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0,
      networkLatency: 0,
      bandwidth: 0,
      connectionType: "unknown",
      effectiveType: "unknown",
      bufferHealth: 1.0,
      audioDropouts: 0,
      bitrateChanges: 0,
      seekLatency: 0,
      heapUsed: 0,
      heapTotal: 0,
      heapLimit: 0,
      jsErrorRate: 0,
      networkErrorRate: 0,
      audioErrorRate: 0,
      timestamp: Date.now(),
    };
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }
}
