// src/services/analytics/PrivacyManager.js
// Privacy and compliance manager for GDPR and music industry requirements

import AnalyticsConfig from "./AnalyticsConfig";

export class PrivacyManager {
  constructor() {
    this.config = AnalyticsConfig.privacy;
    this.pseudonymizationCache = new Map();
    this.consentStatus = {};
    this.dataRetentionPolicies = new Map();

    this.initializePrivacyFeatures();
  }

  /**
   * Initialize privacy management features
   */
  initializePrivacyFeatures() {
    // Load stored consent
    this.loadConsentStatus();

    // Setup data retention monitoring
    this.setupDataRetentionMonitoring();

    // Initialize pseudonymization
    this.initializePseudonymization();
  }

  /**
   * Apply privacy filters to event data
   */
  applyPrivacyFilters(eventData) {
    let filteredData = { ...eventData };

    // Apply pseudonymization
    if (this.config.pseudonymization) {
      filteredData = this.pseudonymizeData(filteredData);
    }

    // Filter PII based on consent
    filteredData = this.filterPIIBasedOnConsent(filteredData);

    // Apply data minimization
    filteredData = this.minimizeData(filteredData);

    // Add privacy metadata
    filteredData._privacy = {
      pseudonymized: this.config.pseudonymization,
      consent_version: this.getConsentVersion(),
      retention_policy: this.getRetentionPolicy(eventData.event_name),
      processed_timestamp: Date.now()
    };

    return filteredData;
  }

  /**
   * Pseudonymize sensitive data fields
   */
  pseudonymizeData(eventData) {
    const data = { ...eventData };

    // Pseudonymize PII fields
    this.config.piiFields.forEach((field) => {
      const value = this.getNestedValue(data, field);
      if (value) {
        this.setNestedValue(data, field, this.pseudonymizeValue(value, field));
      }
    });

    // Pseudonymize IP addresses
    if (data.ip_address) {
      data.ip_address = this.hashIP(data.ip_address);
    }

    // Pseudonymize device identifiers
    if (data.device_info?.device_id) {
      data.device_info.device_id = this.pseudonymizeValue(
        data.device_info.device_id,
        "device_id",
      );
    }

    return data;
  }

  /**
   * Pseudonymize individual value with caching
   */
  pseudonymizeValue(value, fieldType) {
    const cacheKey = `${fieldType}:${value}`;

    // Check cache first for consistency
    if (this.pseudonymizationCache.has(cacheKey)) {
      return this.pseudonymizationCache.get(cacheKey);
    }

    // Generate pseudonymized value
    let pseudonymized;
    switch (fieldType) {
      case "user_id":
        pseudonymized = this.generatePseudonymousUserId(value);
        break;
      case "device_id":
        pseudonymized = this.generatePseudonymousDeviceId(value);
        break;
      default:
        pseudonymized = this.generateGenericHash(value);
    }

    // Cache for consistency
    this.pseudonymizationCache.set(cacheKey, pseudonymized);

    // Limit cache size
    if (this.pseudonymizationCache.size > 10000) {
      const firstKey = this.pseudonymizationCache.keys().next().value;
      this.pseudonymizationCache.delete(firstKey);
    }

    return pseudonymized;
  }

  /**
   * Generate pseudonymous user ID that's consistent but not reversible
   */
  generatePseudonymousUserId(originalId) {
    const salt = this.getUserIdSalt();
    return `user_${this.sha256Hash(originalId + salt).substring(0, 16)}`;
  }

  /**
   * Generate pseudonymous device ID
   */
  generatePseudonymousDeviceId(originalId) {
    const salt = this.getDeviceIdSalt();
    return `device_${this.sha256Hash(originalId + salt).substring(0, 16)}`;
  }

  /**
   * Generate generic hash for other PII
   */
  generateGenericHash(value) {
    const salt = this.getGenericSalt();
    return this.sha256Hash(value + salt).substring(0, 16);
  }

  /**
   * Hash IP address for privacy compliance
   */
  hashIP(ipAddress) {
    if (!ipAddress) return null;

    // For IPv4, mask last octet; for IPv6, mask last 64 bits
    if (ipAddress.includes(".")) {
      // IPv4
      const parts = ipAddress.split(".");
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    } else {
      // IPv6 - simplified masking
      const parts = ipAddress.split(":");
      return parts.slice(0, 4).join(":") + "::";
    }
  }

  /**
   * Filter PII based on user consent
   */
  filterPIIBasedOnConsent(eventData) {
    const data = { ...eventData };

    // Remove fields that require consent if not granted
    if (!this.hasConsent("analytics")) {
      this.config.piiFields.forEach((field) => {
        this.removeNestedValue(data, field);
      });
    }

    // Remove marketing-related data if marketing consent not granted
    if (!this.hasConsent("marketing")) {
      delete data.utm_parameters;
      delete data.referrer;
      delete data.marketing_data;
    }

    // Remove personalization data if consent not granted
    if (!this.hasConsent("personalization")) {
      delete data.recommendation_data;
      delete data.preference_data;
      delete data.behavioral_data;
    }

    return data;
  }

  /**
   * Apply data minimization principles
   */
  minimizeData(eventData) {
    const data = { ...eventData };

    // Remove unnecessary precision from timestamps
    if (data.timestamp) {
      data.timestamp = Math.floor(data.timestamp / 1000) * 1000; // Round to nearest second
    }

    // Limit precision of location data
    if (data.location) {
      data.location = this.reduceLocationPrecision(data.location);
    }

    // Remove excessive device details
    if (data.device_info) {
      data.device_info = this.minimizeDeviceInfo(data.device_info);
    }

    // Remove debug/development data in production
    if (process.env.NODE_ENV === "production") {
      delete data.debug_info;
      delete data.internal_flags;
    }

    return data;
  }

  /**
   * Reduce location precision for privacy
   */
  reduceLocationPrecision(location) {
    if (location.latitude && location.longitude) {
      return {
        latitude: Math.round(location.latitude * 100) / 100, // ~1km precision
        longitude: Math.round(location.longitude * 100) / 100,
        accuracy: "reduced"
      };
    }
    return location;
  }

  /**
   * Minimize device information
   */
  minimizeDeviceInfo(deviceInfo) {
    return {
      platform: deviceInfo.platform,
      browser: this.normalizeBrowser(deviceInfo.user_agent),
      screen_size: this.categorizeScreenSize(deviceInfo.screen_resolution),
      // Remove detailed device fingerprinting data
    };
  }

  /**
   * Normalize browser information
   */
  normalizeBrowser(userAgent) {
    if (!userAgent) return "unknown";

    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
      return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Other";
  }

  /**
   * Categorize screen size instead of exact dimensions
   */
  categorizeScreenSize(resolution) {
    if (!resolution) return "unknown";

    const [width] = resolution.split("x").map(Number);
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    if (width < 1920) return "desktop";
    return "large";
  }

  /**
   * Check if user has given specific consent
   */
  hasConsent(consentType) {
    return this.consentStatus[consentType] === true;
  }

  /**
   * Update consent status
   */
  updateConsent(consentUpdates) {
    this.consentStatus = { ...this.consentStatus, ...consentUpdates };
    this.storeConsentStatus();

    // Clear cache if consent is revoked
    const revokedConsents = Object.entries(consentUpdates)
      .filter(([, granted]) => !granted)
      .map(([type]) => type);

    if (revokedConsents.length > 0) {
      this.handleConsentRevocation(revokedConsents);
    }
  }

  /**
   * Handle consent revocation
   */
  handleConsentRevocation(revokedConsents) {
    // Clear relevant caches
    if (revokedConsents.includes("analytics")) {
      this.pseudonymizationCache.clear();
    }

    // Trigger data deletion request if needed
    if (revokedConsents.includes("analytics") && this.config.gdprCompliant) {
      this.scheduleDataDeletion();
    }
  }

  /**
   * Schedule data deletion for compliance
   */
  scheduleDataDeletion() {
    // Implementation would schedule deletion job
    console.log("Data deletion scheduled due to consent revocation");
  }

  /**
   * Filter user properties based on privacy settings
   */
  filterUserProperties(properties) {
    if (!this.hasConsent("analytics")) {
      return {}; // No properties if no consent
    }

    const filtered = { ...properties };

    // Remove sensitive properties
    const sensitiveFields = ["email", "phone", "address", "credit_card"];
    sensitiveFields.forEach((field) => delete filtered[field]);

    // Pseudonymize if needed
    if (this.config.pseudonymization) {
      if (filtered.external_id) {
        filtered.external_id = this.pseudonymizeValue(
          filtered.external_id,
          "external_id",
        );
      }
    }

    return filtered;
  }

  /**
   * Get current consent version
   */
  getConsentVersion() {
    return "1.0"; // Implementation would track consent version changes
  }

  /**
   * Get retention policy for event type
   */
  getRetentionPolicy(eventName) {
    const policies = this.dataRetentionPolicies;

    // Compliance events have longer retention
    if (["royalty_calculation", "payment_event"].includes(eventName)) {
      return policies.get("compliance") || this.config.auditRetention;
    }

    // Marketing events have shorter retention
    if (eventName.includes("marketing")) {
      return policies.get("marketing") || 365;
    }

    return policies.get("default") || this.config.dataRetentionDays;
  }

  /**
   * Setup data retention monitoring
   */
  setupDataRetentionMonitoring() {
    // Set default retention policies
    this.dataRetentionPolicies.set("default", this.config.dataRetentionDays);
    this.dataRetentionPolicies.set(
      "compliance",
      AnalyticsConfig.compliance.auditRetention,
    );
    this.dataRetentionPolicies.set("marketing", 365);
    this.dataRetentionPolicies.set("performance", 90);

    // Schedule retention cleanup (in production, this would be a background job)
    setInterval(
      () => {
        this.performRetentionCleanup();
      },
      24 * 60 * 60 * 1000,
    ); // Daily
  }

  /**
   * Perform data retention cleanup
   */
  performRetentionCleanup() {
    // Implementation would clean up expired data
    console.log("Performing data retention cleanup");
  }

  /**
   * Anonymize data after threshold period
   */
  anonymizeExpiredData() {
    const threshold =
      Date.now() - this.config.anonymizationThreshold * 24 * 60 * 60 * 1000;

    // Implementation would anonymize data older than threshold
    console.log(`Anonymizing data older than ${threshold}`);
  }

  /**
   * Export user data for GDPR compliance
   */
  exportUserData(userId, format = "json") {
    const exportData = {
      user_id: userId,
      export_timestamp: Date.now(),
      consent_status: this.consentStatus,
      data_retention_policies: Object.fromEntries(this.dataRetentionPolicies),
      // Implementation would include actual user data
    };

    switch (format) {
      case "json":
        return JSON.stringify(exportData, null, 2);
      case "csv":
        return this.convertToCSV(exportData);
      case "xml":
        return this.convertToXML(exportData);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Delete user data for GDPR compliance
   */
  deleteUserData(userId, deletionReason = "user_request") {
    // Implementation would trigger deletion across all systems
    const deletionRecord = {
      user_id: userId,
      deletion_timestamp: Date.now(),
      deletion_reason: deletionReason,
      retention_override: false
    };

    // Some data may need to be retained for compliance
    if (this.hasComplianceRetentionRequirement(userId)) {
      deletionRecord.retention_override = true;
      deletionRecord.retention_reason = "legal_compliance";
    }

    return deletionRecord;
  }

  /**
   * Check if user data has compliance retention requirements
   */
  hasComplianceRetentionRequirement(userId) {
    // Implementation would check for ongoing legal requirements
    return false; // Placeholder
  }

  /**
   * Initialize pseudonymization with rotating salts
   */
  initializePseudonymization() {
    // In production, these would be securely managed secrets
    this.salts = {
      user_id: process.env.REACT_APP_USER_ID_SALT || "default_user_salt",
      device_id: process.env.REACT_APP_DEVICE_ID_SALT || "default_device_salt",
      generic: process.env.REACT_APP_GENERIC_SALT || "default_generic_salt"
    };
  }

  /**
   * Load consent status from storage
   */
  loadConsentStatus() {
    try {
      if (typeof localStorage !== "undefined") {
        const stored = localStorage.getItem("privacy_consent");
        if (stored) {
          this.consentStatus = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.warn("Failed to load consent status:", error);
    }
  }

  /**
   * Store consent status
   */
  storeConsentStatus() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(
          "privacy_consent",
          JSON.stringify(this.consentStatus),
        );
      }
    } catch (error) {
      console.warn("Failed to store consent status:", error);
    }
  }

  /**
   * Utility methods for nested object manipulation
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

  setNestedValue(obj, path, value) {
    const keys = path.split(".");
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  removeNestedValue(obj, path) {
    const keys = path.split(".");
    const lastKey = keys.pop();
    const target = keys.reduce(
      (current, key) => (current && current[key] ? current[key] : null),
      obj,
    );
    if (target && target[lastKey] !== undefined) {
      delete target[lastKey];
    }
  }

  /**
   * Salt getters for pseudonymization
   */
  getUserIdSalt() {
    return this.salts.user_id;
  }

  getDeviceIdSalt() {
    return this.salts.device_id;
  }

  getGenericSalt() {
    return this.salts.generic;
  }

  /**
   * SHA-256 hash implementation (simplified)
   */
  sha256Hash(input) {
    // In production, use a proper crypto library
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(16, "0");
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    // Simple CSV conversion for GDPR exports
    const flattened = this.flattenObject(data);
    const headers = Object.keys(flattened).join(",");
    const values = Object.values(flattened)
      .map((v) => (typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : v))
      .join(",");
    return `${headers}\n${values}`;
  }

  /**
   * Convert data to XML format
   */
  convertToXML(data) {
    // Simple XML conversion for GDPR exports
    const xmlContent = this.objectToXML(data, "user_data");
    return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlContent}`;
  }

  /**
   * Flatten nested object for CSV export
   */
  flattenObject(obj, prefix = "") {
    const flattened = {};
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }
    return flattened;
  }

  /**
   * Convert object to XML
   */
  objectToXML(obj, rootTag) {
    let xml = `<${rootTag}>`;
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && value !== null) {
        xml += this.objectToXML(value, key);
      } else {
        xml += `<${key}>${this.escapeXML(value)}</${key}>`;
      }
    }
    xml += `</${rootTag}>`;
    return xml;
  }

  /**
   * Escape XML special characters
   */
  escapeXML(value) {
    if (typeof value !== "string") return value;
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Get privacy manager status
   */
  getStatus() {
    return {
      gdpr_compliant: this.config.gdprCompliant,
      pseudonymization_enabled: this.config.pseudonymization,
      consent_status: this.consentStatus,
      cache_size: this.pseudonymizationCache.size,
      retention_policies: Object.fromEntries(this.dataRetentionPolicies)
    };
  }
}
