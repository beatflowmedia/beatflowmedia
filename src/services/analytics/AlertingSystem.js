// src/services/analytics/AlertingSystem.js
// Real-time alerting system for performance monitoring and business intelligence

import AnalyticsConfig from "./AnalyticsConfig";

class AlertingSystem {
  constructor() {
    this.config = AnalyticsConfig;
    this.alerts = new Map();
    this.subscribers = new Map();
    this.alertHistory = [];
    this.thresholds = this.config.businessIntelligence.alertThresholds;

    this.initialize();
  }

  /**
   * Initialize alerting system
   */
  initialize() {
    this.setupDefaultAlerts();
    this.startMonitoring();
    console.log("Alerting system initialized");
  }

  /**
   * Setup default alert rules
   */
  setupDefaultAlerts() {
    // Performance alerts
    this.addAlert("high_error_rate", {
      type: "performance",
      metric: "error_rate",
      threshold: this.thresholds.errorRate,
      operator: ">",
      severity: "critical",
      description: "Error rate above acceptable threshold"
    });

    this.addAlert("high_latency", {
      type: "performance",
      metric: "latency_p95",
      threshold: this.thresholds.latencyP95,
      operator: ">",
      severity: "warning",
      description: "P95 latency above threshold"
    });

    // Business alerts
    this.addAlert("revenue_drop", {
      type: "business",
      metric: "revenue_change",
      threshold: -0.1, // 10% drop
      operator: "<",
      severity: "high",
      description: "Revenue decreased significantly"
    });

    this.addAlert("conversion_drop", {
      type: "business",
      metric: "conversion_rate",
      threshold: 0.05, // 5% drop
      operator: "<",
      severity: "medium",
      description: "Conversion rate below normal"
    });

    // Security alerts
    this.addAlert("license_failures", {
      type: "security",
      metric: "license_failure_rate",
      threshold: this.thresholds.licenseFailure,
      operator: ">",
      severity: "critical",
      description: "High DRM license failure rate"
    });

    this.addAlert("suspicious_activity", {
      type: "security",
      metric: "suspicious_events",
      threshold: 10,
      operator: ">",
      severity: "high",
      description: "Unusual security activity detected"
    });

    // Content alerts
    this.addAlert("buffer_underrun", {
      type: "content",
      metric: "buffer_underrun_rate",
      threshold: this.thresholds.bufferUnderrun,
      operator: ">",
      severity: "warning",
      description: "High buffer underrun rate"
    });
  }

  /**
   * Add new alert rule
   */
  addAlert(id, alertConfig) {
    this.alerts.set(id, {
      id,
      ...alertConfig,
      active: true,
      lastTriggered: null,
      triggerCount: 0,
      created: Date.now()
    });
  }

  /**
   * Subscribe to alerts
   */
  subscribe(alertId, callback, options = {}) {
    if (!this.subscribers.has(alertId)) {
      this.subscribers.set(alertId, []);
    }

    const subscription = {
      id: this.generateSubscriptionId(),
      callback,
      options,
      created: Date.now()
    };

    this.subscribers.get(alertId).push(subscription);
    return subscription.id;
  }

  /**
   * Unsubscribe from alerts
   */
  unsubscribe(alertId, subscriptionId) {
    const subscribers = this.subscribers.get(alertId);
    if (subscribers) {
      const index = subscribers.findIndex((sub) => sub.id === subscriptionId);
      if (index !== -1) {
        subscribers.splice(index, 1);
      }
    }
  }

  /**
   * Check metric against alert thresholds
   */
  checkAlerts(metrics) {
    for (const [alertId, alert] of this.alerts) {
      if (!alert.active) continue;

      const metricValue = this.getMetricValue(metrics, alert.metric);
      if (metricValue === null || metricValue === undefined) continue;

      const shouldTrigger = this.evaluateThreshold(
        metricValue,
        alert.threshold,
        alert.operator,
      );

      if (shouldTrigger) {
        this.triggerAlert(alertId, metricValue, metrics);
      }
    }
  }

  /**
   * Trigger an alert
   */
  triggerAlert(alertId, value, context = {}) {
    const alert = this.alerts.get(alertId);
    if (!alert) return;

    // Check cooldown period to prevent spam
    const cooldownPeriod = 300000; // 5 minutes
    if (
      alert.lastTriggered &&
      Date.now() - alert.lastTriggered < cooldownPeriod
    ) {
      return;
    }

    // Create alert event
    const alertEvent = {
      id: this.generateAlertId(),
      alertId,
      type: alert.type,
      severity: alert.severity,
      message: alert.description,
      metric: alert.metric,
      value,
      threshold: alert.threshold,
      timestamp: Date.now(),
      context
    };

    // Update alert state
    alert.lastTriggered = Date.now();
    alert.triggerCount++;

    // Store in history
    this.alertHistory.unshift(alertEvent);
    if (this.alertHistory.length > 1000) {
      this.alertHistory.pop();
    }

    // Notify subscribers
    this.notifySubscribers(alertId, alertEvent);

    // Send to external systems
    this.sendToExternalSystems(alertEvent);

    console.warn("Alert triggered:", alertEvent);
  }

  /**
   * Notify subscribers
   */
  notifySubscribers(alertId, alertEvent) {
    const subscribers = this.subscribers.get(alertId) || [];
    const globalSubscribers = this.subscribers.get("*") || [];

    [...subscribers, ...globalSubscribers].forEach((subscription) => {
      try {
        subscription.callback(alertEvent);
      } catch (error) {
        console.error("Alert subscriber error:", error);
      }
    });
  }

  /**
   * Send alerts to external systems
   */
  async sendToExternalSystems(alertEvent) {
    // Send to Slack
    if (this.config.alerting?.slack?.enabled) {
      await this.sendToSlack(alertEvent);
    }

    // Send to email
    if (this.config.alerting?.email?.enabled) {
      await this.sendToEmail(alertEvent);
    }

    // Send to PagerDuty for critical alerts
    if (
      alertEvent.severity === "critical" &&
      this.config.alerting?.pagerduty?.enabled
    ) {
      await this.sendToPagerDuty(alertEvent);
    }

    // Send to webhook
    if (this.config.alerting?.webhook?.url) {
      await this.sendToWebhook(alertEvent);
    }
  }

  /**
   * Send alert to Slack
   */
  async sendToSlack(alertEvent) {
    const slackConfig = this.config.alerting.slack;

    const payload = {
      text: `🚨 ${alertEvent.severity.toUpperCase()} Alert`,
      attachments: [
        {
          color: this.getSeverityColor(alertEvent.severity),
          fields: [
            {
              title: "Alert",
              value: alertEvent.message,
              short: false
            },
            {
              title: "Metric",
              value: `${alertEvent.metric}: ${alertEvent.value}`,
              short: true
            },
            {
              title: "Threshold",
              value: alertEvent.threshold,
              short: true
            },
            {
              title: "Time",
              value: new Date(alertEvent.timestamp).toISOString(),
              short: true
            },
          ]
        },
      ]
    };

    try {
      await fetch(slackConfig.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error("Failed to send Slack alert:", error);
    }
  }

  /**
   * Send alert to email
   */
  async sendToEmail(alertEvent) {
    // Implementation would use email service
    console.log("Sending email alert:", alertEvent);
  }

  /**
   * Send alert to PagerDuty
   */
  async sendToPagerDuty(alertEvent) {
    // Implementation would use PagerDuty API
    console.log("Sending PagerDuty alert:", alertEvent);
  }

  /**
   * Send alert to webhook
   */
  async sendToWebhook(alertEvent) {
    const webhookUrl = this.config.alerting.webhook.url;

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertEvent)
      });
    } catch (error) {
      console.error("Failed to send webhook alert:", error);
    }
  }

  /**
   * Start monitoring loop
   */
  startMonitoring() {
    setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Every minute
  }

  /**
   * Perform system health check
   */
  async performHealthCheck() {
    try {
      // Get current metrics
      const metrics = await this.getCurrentMetrics();

      // Check all alerts
      this.checkAlerts(metrics);

      // Check for anomalies
      this.detectAnomalies(metrics);
    } catch (error) {
      console.error("Health check failed:", error);
    }
  }

  /**
   * Get current system metrics
   */
  async getCurrentMetrics() {
    // This would integrate with actual monitoring systems
    return {
      error_rate: 0.02,
      latency_p95: 1500,
      revenue_change: 0.05,
      conversion_rate: 0.12,
      license_failure_rate: 0.001,
      buffer_underrun_rate: 0.015,
      suspicious_events: 5
    };
  }

  /**
   * Detect anomalies in metrics
   */
  detectAnomalies(metrics) {
    // Simple anomaly detection based on historical data
    // In production, this would use ML models

    for (const [metric, value] of Object.entries(metrics)) {
      const history = this.getMetricHistory(metric);
      if (history.length < 10) continue; // Need enough data

      const average =
        history.reduce((sum, val) => sum + val, 0) / history.length;
      const stdDev = Math.sqrt(
        history.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) /
          history.length,
      );

      // Check if current value is more than 2 standard deviations from mean
      if (Math.abs(value - average) > 2 * stdDev) {
        this.triggerAlert("anomaly_detected", value, {
          metric,
          average,
          standard_deviation: stdDev,
          anomaly_type: value > average ? "spike" : "drop"
        });
      }
    }
  }

  /**
   * Get metric history for anomaly detection
   */
  getMetricHistory(metric) {
    // Placeholder - would retrieve from time series database
    return [];
  }

  /**
   * Evaluate threshold condition
   */
  evaluateThreshold(value, threshold, operator) {
    switch (operator) {
      case ">":
        return value > threshold;
      case "<":
        return value < threshold;
      case ">=":
        return value >= threshold;
      case "<=":
        return value <= threshold;
      case "==":
        return value === threshold;
      case "!=":
        return value !== threshold;
      default:
        return false;
    }
  }

  /**
   * Get metric value from metrics object
   */
  getMetricValue(metrics, metricPath) {
    return metricPath.split(".").reduce((obj, key) => obj?.[key], metrics);
  }

  /**
   * Get severity color for Slack
   */
  getSeverityColor(severity) {
    const colors = {
      critical: "#ff0000",
      high: "#ff6600",
      medium: "#ffcc00",
      warning: "#ffff00",
      low: "#00ff00",
      info: "#0066ff"
    };
    return colors[severity] || "#cccccc";
  }

  /**
   * Generate unique alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique subscription ID
   */
  generateSubscriptionId() {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return Array.from(this.alerts.values()).filter((alert) => alert.active);
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 100) {
    return this.alertHistory.slice(0, limit);
  }

  /**
   * Mute alert
   */
  muteAlert(alertId, duration = 3600000) {
    // 1 hour default
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.muted = true;
      alert.muteUntil = Date.now() + duration;
    }
  }

  /**
   * Unmute alert
   */
  unmuteAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.muted = false;
      alert.muteUntil = null;
    }
  }

  /**
   * Update alert configuration
   */
  updateAlert(alertId, updates) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      Object.assign(alert, updates);
    }
  }

  /**
   * Delete alert
   */
  deleteAlert(alertId) {
    this.alerts.delete(alertId);
    this.subscribers.delete(alertId);
  }

  /**
   * Get alerting statistics
   */
  getStatistics() {
    const alerts = Array.from(this.alerts.values());

    return {
      total_alerts: alerts.length,
      active_alerts: alerts.filter((a) => a.active).length,
      muted_alerts: alerts.filter((a) => a.muted).length,
      total_triggers: alerts.reduce((sum, a) => sum + a.triggerCount, 0),
      total_subscribers: Array.from(this.subscribers.values()).reduce(
        (sum, subs) => sum + subs.length,
        0,
      ),
      alert_types: this.getAlertTypeDistribution(),
      recent_alerts: this.alertHistory.slice(0, 10)
    };
  }

  /**
   * Get alert type distribution
   */
  getAlertTypeDistribution() {
    const alerts = Array.from(this.alerts.values());
    const distribution = {};

    alerts.forEach((alert) => {
      distribution[alert.type] = (distribution[alert.type] || 0) + 1;
    });

    return distribution;
  }
}

// Export singleton instance
export default new AlertingSystem();
