// src/services/analytics/EventValidator.js
// Event validation service for ensuring data quality and schema compliance

import AnalyticsConfig from "./AnalyticsConfig";

export class EventValidator {
  constructor() {
    this.schemas = AnalyticsConfig.eventSchemas;
    this.validationRules = this.createValidationRules();
  }

  /**
   * Validate event against schema and business rules
   */
  validate(eventName, eventData) {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // Find event schema
      const schema = this.findEventSchema(eventName);
      if (!schema) {
        result.valid = false;
        result.errors.push(`Unknown event type: ${eventName}`);
        return result;
      }

      // Validate required fields
      this.validateRequiredFields(schema, eventData, result);

      // Validate field types and formats
      this.validateFieldTypes(schema, eventData, result);

      // Validate business rules
      this.validateBusinessRules(eventName, eventData, result);

      // Check data quality
      this.validateDataQuality(eventData, result);

      // Validate compliance requirements
      this.validateCompliance(eventName, eventData, result);
    } catch (error) {
      result.valid = false;
      result.errors.push(`Validation error: ${error.message}`);
    }

    return result;
  }

  /**
   * Find event schema by name
   */
  findEventSchema(eventName) {
    for (const [category, events] of Object.entries(this.schemas)) {
      if (events[eventName]) {
        return events[eventName];
      }
    }
    return null;
  }

  /**
   * Validate required fields are present
   */
  validateRequiredFields(schema, eventData, result) {
    const missing = schema.required.filter(
      (field) => !this.hasValidValue(eventData, field),
    );

    if (missing.length > 0) {
      result.valid = false;
      result.errors.push(`Missing required fields: ${missing.join(", ")}`);
    }
  }

  /**
   * Validate field types and formats
   */
  validateFieldTypes(schema, eventData, result) {
    const allFields = [...schema.required, ...(schema.optional || [])];

    for (const field of allFields) {
      if (!this.hasValidValue(eventData, field)) continue;

      const value = this.getNestedValue(eventData, field);
      const validation = this.validateFieldValue(field, value);

      if (!validation.valid) {
        result.errors.push(`Invalid ${field}: ${validation.message}`);
        result.valid = false;
      }

      if (validation.warning) {
        result.warnings.push(`${field}: ${validation.warning}`);
      }
    }
  }

  /**
   * Validate individual field value
   */
  validateFieldValue(field, value) {
    const rules = this.validationRules[field] || this.validationRules._default;

    // Type validation
    if (rules.type && typeof value !== rules.type) {
      return {
        valid: false,
        message: `Expected ${rules.type}, got ${typeof value}`
      };
    }

    // Format validation
    if (rules.format && !rules.format.test(value)) {
      return {
        valid: false,
        message: `Invalid format for ${field}`
      };
    }

    // Range validation
    if (rules.min !== undefined && value < rules.min) {
      return {
        valid: false,
        message: `Value must be >= ${rules.min}`
      };
    }

    if (rules.max !== undefined && value > rules.max) {
      return {
        valid: false,
        message: `Value must be <= ${rules.max}`
      };
    }

    // Length validation
    if (rules.maxLength && value.length > rules.maxLength) {
      return {
        valid: false,
        message: `Length must be <= ${rules.maxLength}`
      };
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      return {
        valid: false,
        message: `Must be one of: ${rules.enum.join(", ")}`
      };
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value);
    }

    return { valid: true };
  }

  /**
   * Validate business rules
   */
  validateBusinessRules(eventName, eventData, result) {
    // Playback event business rules
    if (eventName.startsWith("play_")) {
      this.validatePlaybackRules(eventName, eventData, result);
    }

    // Session event business rules
    if (eventName.includes("session_")) {
      this.validateSessionRules(eventName, eventData, result);
    }

    // Revenue event business rules
    if (
      ["payment_event", "subscription_change", "royalty_calculation"].includes(
        eventName,
      )
    ) {
      this.validateRevenueRules(eventName, eventData, result);
    }

    // Engagement event business rules
    if (
      ["like_track", "playlist_create", "artist_follow"].includes(eventName)
    ) {
      this.validateEngagementRules(eventName, eventData, result);
    }
  }

  /**
   * Validate playback-specific business rules
   */
  validatePlaybackRules(eventName, eventData, result) {
    // Position validation for seek events
    if (eventName === "seek") {
      const { from_position, to_position } = eventData;
      if (from_position !== undefined && to_position !== undefined) {
        if (from_position < 0 || to_position < 0) {
          result.errors.push("Seek positions cannot be negative");
          result.valid = false;
        }
        if (Math.abs(to_position - from_position) < 0.1) {
          result.warnings.push(
            "Seek distance very small, possible duplicate event",
          );
        }
      }
    }

    // Completion percentage validation
    if (["play_end", "track_complete"].includes(eventName)) {
      const completion = eventData.completion_percentage;
      if (completion !== undefined) {
        if (completion < 0 || completion > 100) {
          result.errors.push("Completion percentage must be between 0 and 100");
          result.valid = false;
        }
      }
    }

    // Duration validation
    if (eventData.duration !== undefined) {
      if (eventData.duration < 0) {
        result.errors.push("Duration cannot be negative");
        result.valid = false;
      }
      if (eventData.duration > 86400) {
        // 24 hours
        result.warnings.push("Unusually long duration detected");
      }
    }

    // Quality validation
    if (eventData.quality) {
      const validQualities = ["low", "medium", "high", "lossless"];
      if (!validQualities.includes(eventData.quality)) {
        result.errors.push(`Invalid quality level: ${eventData.quality}`);
        result.valid = false;
      }
    }
  }

  /**
   * Validate session-specific business rules
   */
  validateSessionRules(eventName, eventData, result) {
    if (eventName === "session_end") {
      const duration = eventData.duration;
      if (duration !== undefined) {
        if (duration < 0) {
          result.errors.push("Session duration cannot be negative");
          result.valid = false;
        }
        if (duration < 1000) {
          // Less than 1 second
          result.warnings.push("Very short session duration");
        }
        if (duration > 86400000) {
          // More than 24 hours
          result.warnings.push("Unusually long session duration");
        }
      }
    }
  }

  /**
   * Validate revenue-specific business rules
   */
  validateRevenueRules(eventName, eventData, result) {
    if (eventData.amount !== undefined) {
      if (eventData.amount < 0) {
        result.errors.push("Revenue amount cannot be negative");
        result.valid = false;
      }
    }

    if (eventData.currency) {
      const validCurrencies = ["USD", "EUR", "GBP", "CAD", "AUD"];
      if (!validCurrencies.includes(eventData.currency)) {
        result.warnings.push(`Uncommon currency: ${eventData.currency}`);
      }
    }

    // Subscription tier validation
    if (eventName === "subscription_change") {
      const validTiers = ["free", "premium", "family", "student", "artist"];
      if (eventData.to_tier && !validTiers.includes(eventData.to_tier)) {
        result.errors.push(`Invalid subscription tier: ${eventData.to_tier}`);
        result.valid = false;
      }
    }
  }

  /**
   * Validate engagement-specific business rules
   */
  validateEngagementRules(eventName, eventData, result) {
    // Playlist validation
    if (
      eventName === "playlist_create" &&
      eventData.track_count !== undefined
    ) {
      if (eventData.track_count < 0) {
        result.errors.push("Track count cannot be negative");
        result.valid = false;
      }
      if (eventData.track_count > 10000) {
        result.warnings.push("Unusually large playlist");
      }
    }

    // Visibility validation
    if (eventData.visibility) {
      const validVisibilities = ["public", "private", "collaborative"];
      if (!validVisibilities.includes(eventData.visibility)) {
        result.errors.push(`Invalid visibility: ${eventData.visibility}`);
        result.valid = false;
      }
    }
  }

  /**
   * Validate data quality
   */
  validateDataQuality(eventData, result) {
    // Timestamp validation
    if (eventData.timestamp) {
      const now = Date.now();
      const timestamp = eventData.timestamp;

      // Check for future timestamps
      if (timestamp > now + 60000) {
        // 1 minute tolerance
        result.warnings.push("Event timestamp is in the future");
      }

      // Check for very old timestamps
      if (timestamp < now - 86400000) {
        // 24 hours
        result.warnings.push("Event timestamp is more than 24 hours old");
      }
    }

    // User ID validation
    if (eventData.user_id) {
      if (
        typeof eventData.user_id !== "string" ||
        eventData.user_id.length < 1
      ) {
        result.errors.push("Invalid user_id format");
        result.valid = false;
      }
    }

    // Session ID validation
    if (eventData.session_id) {
      if (
        typeof eventData.session_id !== "string" ||
        eventData.session_id.length < 1
      ) {
        result.errors.push("Invalid session_id format");
        result.valid = false;
      }
    }

    // Check for suspicious patterns
    this.detectSuspiciousPatterns(eventData, result);
  }

  /**
   * Validate compliance requirements
   */
  validateCompliance(eventName, eventData, result) {
    // Music industry compliance
    if (["play_start", "play_end", "track_complete"].includes(eventName)) {
      const requiredFields = AnalyticsConfig.compliance.requiredFields;
      const missing = requiredFields.filter(
        (field) => !this.hasValidValue(eventData, field),
      );

      if (missing.length > 0) {
        result.errors.push(`Missing compliance fields: ${missing.join(", ")}`);
        result.valid = false;
      }

      // Territory validation for royalty calculations
      if (!eventData.territory) {
        result.warnings.push(
          "Missing territory information for royalty compliance",
        );
      }
    }

    // Privacy compliance
    if (AnalyticsConfig.privacy.gdprCompliant) {
      this.validatePrivacyCompliance(eventData, result);
    }
  }

  /**
   * Validate privacy compliance
   */
  validatePrivacyCompliance(eventData, result) {
    const piiFields = AnalyticsConfig.privacy.piiFields;

    for (const field of piiFields) {
      if (this.hasValidValue(eventData, field)) {
        const value = this.getNestedValue(eventData, field);

        // Check if PII is properly pseudonymized
        if (field === "user_id" && !this.isPseudonymized(value)) {
          result.warnings.push("User ID may not be properly pseudonymized");
        }

        // Check for raw IP addresses
        if (field === "ip_address" && this.isRawIP(value)) {
          result.errors.push("Raw IP addresses are not allowed");
          result.valid = false;
        }
      }
    }
  }

  /**
   * Detect suspicious patterns in data
   */
  detectSuspiciousPatterns(eventData, result) {
    // Check for bot-like behavior patterns
    if (eventData.user_agent && this.isBotUserAgent(eventData.user_agent)) {
      result.warnings.push("Potential bot activity detected");
    }

    // Check for duplicate event IDs
    if (eventData.event_id && this.isDuplicateEventId(eventData.event_id)) {
      result.warnings.push("Duplicate event ID detected");
    }

    // Check for rapid-fire events
    if (this.isRapidFireEvent(eventData)) {
      result.warnings.push("Potential rapid-fire event pattern");
    }
  }

  /**
   * Create validation rules for different field types
   */
  createValidationRules() {
    return {
      // IDs and identifiers
      user_id: {
        type: "string",
        maxLength: 255,
        format: /^[a-zA-Z0-9_-]+$/
      },
      track_id: {
        type: "string",
        maxLength: 255,
        format: /^[a-zA-Z0-9_-]+$/
      },
      session_id: {
        type: "string",
        maxLength: 255,
        format: /^[a-zA-Z0-9_-]+$/
      },

      // Timestamps
      timestamp: {
        type: "number",
        min: 0,
        custom: (value) => {
          const now = Date.now();
          if (value > now + 300000) {
            // 5 minutes tolerance
            return { valid: false, message: "Timestamp too far in future" };
          }
          return { valid: true };
        }
      },

      // Numeric values
      duration: {
        type: "number",
        min: 0,
        max: 86400, // 24 hours in seconds
      },
      position: {
        type: "number",
        min: 0
      },
      completion_percentage: {
        type: "number",
        min: 0,
        max: 100
      },
      amount: {
        type: "number",
        min: 0
      },

      // Enums
      quality: {
        type: "string",
        enum: ["low", "medium", "high", "lossless"]
      },
      currency: {
        type: "string",
        enum: ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"]
      },
      territory: {
        type: "string",
        format: /^[A-Z]{2}$/, // ISO country codes
      },

      // Default validation for unknown fields
      _default: {
        custom: (value) => {
          // Basic sanity checks
          if (typeof value === "string" && value.length > 10000) {
            return { valid: false, message: "String value too long" };
          }
          return { valid: true };
        }
      }
    };
  }

  /**
   * Check if value exists and is not null/undefined/empty
   */
  hasValidValue(obj, path) {
    const value = this.getNestedValue(obj, path);
    return value !== null && value !== undefined && value !== "";
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path
      .split(".")
      .reduce(
        (current, key) =>
          current && current[key] !== undefined ? current[key] : undefined,
        obj,
      );
  }

  /**
   * Check if user ID appears to be pseudonymized
   */
  isPseudonymized(userId) {
    // Simple heuristic: pseudonymized IDs are typically hashes
    return /^[a-f0-9]{32}$/.test(userId) || userId.startsWith("user_");
  }

  /**
   * Check if value is a raw IP address
   */
  isRawIP(value) {
    const ipv4Regex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    const ipv6Regex = /^[a-fA-F0-9:]+$/;
    return ipv4Regex.test(value) || ipv6Regex.test(value);
  }

  /**
   * Check if user agent indicates bot activity
   */
  isBotUserAgent(userAgent) {
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /headless/i,
      /phantom/i,
      /selenium/i,
    ];
    return botPatterns.some((pattern) => pattern.test(userAgent));
  }

  /**
   * Check for duplicate event IDs (simple implementation)
   */
  isDuplicateEventId(eventId) {
    // In production, this would check against a cache or database
    return false; // Placeholder
  }

  /**
   * Check for rapid-fire event patterns
   */
  isRapidFireEvent(eventData) {
    // In production, this would track event frequency per user
    return false; // Placeholder
  }

  /**
   * Get validation statistics
   */
  getValidationStats() {
    return {
      total_validations: this.validationCount || 0,
      failed_validations: this.failedValidations || 0,
      warning_count: this.warningCount || 0,
      last_validation: this.lastValidation || null
    };
  }
}
