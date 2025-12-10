/**
 * Event Validation Service
 * Validates analytics events for completeness, format, and business rules
 */

import {
  AnalyticsEvent,
  PlaybackEvent,
  UserEngagementEvent,
  SecurityEvent,
  PerformanceEvent,
  ANALYTICS_EVENTS,
} from "./AnalyticsConfig";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class EventValidator {
  private requiredFields = ["eventType", "timestamp", "sessionId", "deviceId"];
  private maxStringLength = 255;
  private maxEventAge = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Validate an analytics event
   */
  public validate(event: AnalyticsEvent): boolean {
    const result = this.validateEvent(event);
    return result.isValid;
  }

  /**
   * Validate event and return detailed result
   */
  public validateEvent(event: AnalyticsEvent): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Basic validation
    this.validateRequired(event, result);
    this.validateTypes(event, result);
    this.validateValues(event, result);

    // Event-specific validation
    this.validateEventSpecific(event, result);

    // Business rules validation
    this.validateBusinessRules(event, result);

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate required fields
   */
  private validateRequired(
    event: AnalyticsEvent,
    result: ValidationResult,
  ): void {
    this.requiredFields.forEach((field) => {
      if (!event[field as keyof AnalyticsEvent]) {
        result.errors.push(`Missing required field: ${field}`);
      }
    });
  }

  /**
   * Validate field types
   */
  private validateTypes(event: AnalyticsEvent, result: ValidationResult): void {
    // Timestamp validation
    if (typeof event.timestamp !== "number" || event.timestamp <= 0) {
      result.errors.push("Invalid timestamp: must be a positive number");
    }

    // Session ID validation
    if (typeof event.sessionId !== "string" || event.sessionId.length === 0) {
      result.errors.push("Invalid sessionId: must be a non-empty string");
    }

    // Device ID validation
    if (typeof event.deviceId !== "string" || event.deviceId.length === 0) {
      result.errors.push("Invalid deviceId: must be a non-empty string");
    }

    // User ID validation (optional)
    if (event.userId && typeof event.userId !== "string") {
      result.errors.push("Invalid userId: must be a string");
    }

    // Platform validation
    if (
      event.platform &&
      !["web", "mobile", "desktop"].includes(event.platform)
    ) {
      result.errors.push("Invalid platform: must be web, mobile, or desktop");
    }
  }

  /**
   * Validate field values
   */
  private validateValues(
    event: AnalyticsEvent,
    result: ValidationResult,
  ): void {
    // Event type validation
    if (!Object.values(ANALYTICS_EVENTS).includes(event.eventType as any)) {
      result.errors.push(`Invalid eventType: ${event.eventType}`);
    }

    // Timestamp age validation
    const now = Date.now();
    const age = now - event.timestamp;
    if (age > this.maxEventAge) {
      result.warnings.push(
        `Event is older than 24 hours: ${Math.floor(age / 1000 / 60 / 60)} hours`,
      );
    } else if (event.timestamp > now + 60000) {
      // 1 minute future tolerance
      result.errors.push("Event timestamp is in the future");
    }

    // String length validation
    Object.entries(event).forEach(([key, value]) => {
      if (typeof value === "string" && value.length > this.maxStringLength) {
        result.warnings.push(
          `Field ${key} exceeds maximum length of ${this.maxStringLength}`,
        );
      }
    });

    // IP validation (if present)
    if (event.ip && !this.isValidIP(event.ip)) {
      result.errors.push("Invalid IP address format");
    }

    // Country code validation (if present)
    if (
      event.country &&
      (typeof event.country !== "string" || event.country.length !== 2)
    ) {
      result.warnings.push("Country should be a 2-letter ISO code");
    }
  }

  /**
   * Validate event-specific fields
   */
  private validateEventSpecific(
    event: AnalyticsEvent,
    result: ValidationResult,
  ): void {
    switch (event.eventType) {
      case ANALYTICS_EVENTS.PLAY_START:
      case ANALYTICS_EVENTS.PLAY_END:
      case ANALYTICS_EVENTS.PLAY_PAUSE:
      case ANALYTICS_EVENTS.PLAY_RESUME:
      case ANALYTICS_EVENTS.SEEK:
      case ANALYTICS_EVENTS.TRACK_COMPLETE:
        this.validatePlaybackEvent(event as PlaybackEvent, result);
        break;

      case ANALYTICS_EVENTS.TRACK_LIKE:
      case ANALYTICS_EVENTS.TRACK_UNLIKE:
      case ANALYTICS_EVENTS.PLAYLIST_ADD:
      case ANALYTICS_EVENTS.PLAYLIST_REMOVE:
        this.validateUserEngagementEvent(event as UserEngagementEvent, result);
        break;

      case ANALYTICS_EVENTS.SECURITY_VIOLATION:
      case ANALYTICS_EVENTS.DRM_ERROR:
      case ANALYTICS_EVENTS.AUTHENTICATION_FAILURE:
        this.validateSecurityEvent(event as SecurityEvent, result);
        break;

      case ANALYTICS_EVENTS.LATENCY_MEASUREMENT:
      case ANALYTICS_EVENTS.BUFFER_HEALTH:
        this.validatePerformanceEvent(event as PerformanceEvent, result);
        break;
    }
  }

  /**
   * Validate playback event
   */
  private validatePlaybackEvent(
    event: PlaybackEvent,
    result: ValidationResult,
  ): void {
    if (!event.trackId) {
      result.errors.push("Playback event missing trackId");
    }

    if (typeof event.position !== "number" || event.position < 0) {
      result.errors.push("Invalid position: must be a non-negative number");
    }

    if (typeof event.duration !== "number" || event.duration <= 0) {
      result.errors.push("Invalid duration: must be a positive number");
    }

    if (event.position > event.duration) {
      result.warnings.push("Position exceeds duration");
    }

    if (!event.quality || typeof event.quality !== "string") {
      result.warnings.push("Missing or invalid quality field");
    }

    // Validate seek events
    if (event.eventType === ANALYTICS_EVENTS.SEEK) {
      if (!("previousPosition" in event)) {
        result.warnings.push("Seek event missing previousPosition");
      }
    }
  }

  /**
   * Validate user engagement event
   */
  private validateUserEngagementEvent(
    event: UserEngagementEvent,
    result: ValidationResult,
  ): void {
    if (!event.action) {
      result.errors.push("User engagement event missing action");
    }

    if (
      event.targetType &&
      !["track", "album", "artist", "playlist"].includes(event.targetType)
    ) {
      result.errors.push("Invalid targetType");
    }

    if (event.targetType && !event.targetId) {
      result.warnings.push("targetType specified but targetId missing");
    }
  }

  /**
   * Validate security event
   */
  private validateSecurityEvent(
    event: SecurityEvent,
    result: ValidationResult,
  ): void {
    if (
      !event.securityLevel ||
      !["low", "medium", "high", "critical"].includes(event.securityLevel)
    ) {
      result.errors.push("Invalid or missing securityLevel");
    }

    if (!event.details || typeof event.details !== "object") {
      result.errors.push("Security event missing details object");
    }

    if (event.securityLevel === "critical" && !event.threatType) {
      result.warnings.push("Critical security event should include threatType");
    }
  }

  /**
   * Validate performance event
   */
  private validatePerformanceEvent(
    event: PerformanceEvent,
    result: ValidationResult,
  ): void {
    if (!event.metric) {
      result.errors.push("Performance event missing metric");
    }

    if (typeof event.value !== "number") {
      result.errors.push("Performance event value must be a number");
    }

    if (!event.unit) {
      result.errors.push("Performance event missing unit");
    }

    if (
      event.value < 0 &&
      !["latency", "buffer_health"].includes(event.metric)
    ) {
      result.warnings.push("Negative performance values are unusual");
    }
  }

  /**
   * Validate business rules
   */
  private validateBusinessRules(
    event: AnalyticsEvent,
    result: ValidationResult,
  ): void {
    // Royalty calculation events must have required fields for music industry compliance
    if (event.eventType === ANALYTICS_EVENTS.ROYALTY_CALCULATION) {
      const royaltyEvent = event as any;
      if (
        !royaltyEvent.trackId ||
        !royaltyEvent.artistId ||
        !royaltyEvent.amount
      ) {
        result.errors.push("Royalty calculation event missing required fields");
      }
    }

    // DRM events must include license information
    if (
      event.eventType === ANALYTICS_EVENTS.LICENSE_REQUEST &&
      !(event as any).drmType
    ) {
      result.warnings.push("DRM event should include drmType");
    }

    // Payment events must include amount
    if (
      [
        ANALYTICS_EVENTS.PAYMENT_SUCCESS,
        ANALYTICS_EVENTS.PAYMENT_FAILURE,
      ].includes(event.eventType as any)
    ) {
      const paymentEvent = event as any;
      if (typeof paymentEvent.amount !== "number" || paymentEvent.amount <= 0) {
        result.errors.push("Payment event must include valid amount");
      }
    }

    // Session events validation
    if (event.eventType === ANALYTICS_EVENTS.SESSION_START) {
      if ((event as any).previousSessionId) {
        result.warnings.push(
          "Session start should not reference previous session",
        );
      }
    }

    // Territory check for content access
    if (
      event.eventType === ANALYTICS_EVENTS.CONTENT_VIEW &&
      !(event as any).territory
    ) {
      result.warnings.push(
        "Content view should include territory for licensing compliance",
      );
    }

    // Minimum play duration for royalty eligibility
    if (event.eventType === ANALYTICS_EVENTS.TRACK_COMPLETE) {
      const playbackEvent = event as PlaybackEvent;
      if (playbackEvent.position < 30000) {
        // 30 seconds
        result.warnings.push(
          "Track completion under 30 seconds may not qualify for royalties",
        );
      }
    }
  }

  /**
   * Validate IP address format
   */
  private isValidIP(ip: string): boolean {
    // IPv4 validation
    const ipv4Regex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    // IPv6 validation (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Get validation errors as human-readable string
   */
  public getValidationSummary(result: ValidationResult): string {
    const parts: string[] = [];

    if (result.errors.length > 0) {
      parts.push(`Errors: ${result.errors.join(", ")}`);
    }

    if (result.warnings.length > 0) {
      parts.push(`Warnings: ${result.warnings.join(", ")}`);
    }

    return parts.join(" | ") || "Validation passed";
  }
}
