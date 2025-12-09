/**
 * Privacy Manager for GDPR, CCPA, and COPPA Compliance
 * Handles consent management, data anonymization, and privacy controls
 */

import { AnalyticsEvent, AnalyticsConfig } from "./AnalyticsConfig";

export interface ConsentSettings {
  analytics: boolean;
  personalization: boolean;
  marketing: boolean;
  functional: boolean;
  performance: boolean;
}

export interface PrivacyConfig {
  gdprEnabled: boolean;
  ccpaEnabled: boolean;
  coppaEnabled: boolean;
  consentVersion: string;
  dataRetentionDays: number;
  anonymizationEnabled: boolean;
  pseudonymizationEnabled: boolean;
}

export interface DataSubjectRights {
  hasRightToAccess: boolean;
  hasRightToRectification: boolean;
  hasRightToErasure: boolean;
  hasRightToPortability: boolean;
  hasRightToObject: boolean;
  hasRightToRestrict: boolean;
}

export class PrivacyManager {
  private config: AnalyticsConfig;
  private consent: ConsentSettings;
  private privacyConfig: PrivacyConfig;
  private consentTimestamp: number | null = null;
  private ipHashCache = new Map<string, string>();

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.privacyConfig = this.getPrivacyConfig();
    this.consent = this.loadConsent();
    this.setupDoNotTrack();
  }

  /**
   * Check if consent is given for specific event type
   */
  public async checkConsent(eventType?: string): Promise<boolean> {
    // Check Do Not Track browser setting
    if (this.config.respectDoNotTrack && this.isDoNotTrackEnabled()) {
      return false;
    }

    // If consent is not required, allow all
    if (!this.config.consentRequired) {
      return true;
    }

    // Check if consent has been given
    if (!this.hasValidConsent()) {
      return false;
    }

    // Check event-specific consent
    return this.checkEventTypeConsent(eventType);
  }

  /**
   * Update consent settings
   */
  public updateConsent(consent: Partial<ConsentSettings>): void {
    this.consent = { ...this.consent, ...consent };
    this.consentTimestamp = Date.now();
    this.saveConsent();
  }

  /**
   * Sanitize event for privacy compliance
   */
  public async sanitizeEvent(event: AnalyticsEvent): Promise<AnalyticsEvent> {
    const sanitizedEvent = { ...event };

    // Anonymize IP address
    if (this.config.anonymizeIp && sanitizedEvent.ip) {
      sanitizedEvent.ip = await this.anonymizeIP(sanitizedEvent.ip);
    }

    // Pseudonymize user ID
    if (this.privacyConfig.pseudonymizationEnabled && sanitizedEvent.userId) {
      sanitizedEvent.userId = await this.pseudonymizeUserId(
        sanitizedEvent.userId,
      );
    }

    // Remove PII based on consent
    if (!this.consent.personalization) {
      delete sanitizedEvent.userId;
    }

    // Apply geographic anonymization for sensitive regions
    if (this.shouldAnonymizeGeography(sanitizedEvent.country)) {
      delete sanitizedEvent.country;
      delete sanitizedEvent.territory;
      sanitizedEvent.ip = undefined;
    }

    // COPPA compliance - remove all PII for minors
    if (await this.isCoppaApplicable(sanitizedEvent)) {
      sanitizedEvent.userId = undefined;
      sanitizedEvent.ip = undefined;
      sanitizedEvent.country = undefined;
      sanitizedEvent.territory = undefined;
    }

    return sanitizedEvent;
  }

  /**
   * Get data subject rights for current user
   */
  public getDataSubjectRights(): DataSubjectRights {
    return {
      hasRightToAccess:
        this.privacyConfig.gdprEnabled || this.privacyConfig.ccpaEnabled,
      hasRightToRectification: this.privacyConfig.gdprEnabled,
      hasRightToErasure:
        this.privacyConfig.gdprEnabled || this.privacyConfig.ccpaEnabled,
      hasRightToPortability: this.privacyConfig.gdprEnabled,
      hasRightToObject:
        this.privacyConfig.gdprEnabled || this.privacyConfig.ccpaEnabled,
      hasRightToRestrict: this.privacyConfig.gdprEnabled,
    };
  }

  /**
   * Request data export for user
   */
  public async requestDataExport(userId: string): Promise<any> {
    if (!this.getDataSubjectRights().hasRightToAccess) {
      throw new Error("Data access rights not available in this jurisdiction");
    }

    // In a real implementation, this would query the analytics database
    return {
      userId: userId,
      requestTimestamp: Date.now(),
      dataRetentionPeriod: this.config.dataRetentionDays,
      consent: this.consent,
      events: [], // Would contain user's analytics events
    };
  }

  /**
   * Request data deletion for user
   */
  public async requestDataDeletion(userId: string): Promise<boolean> {
    if (!this.getDataSubjectRights().hasRightToErasure) {
      throw new Error(
        "Data deletion rights not available in this jurisdiction",
      );
    }

    // In a real implementation, this would delete/anonymize user data
    console.log(`Data deletion requested for user: ${userId}`);
    return true;
  }

  /**
   * Check if data retention period has expired
   */
  public isDataRetentionExpired(timestamp: number): boolean {
    const retentionPeriod = this.config.dataRetentionDays * 24 * 60 * 60 * 1000;
    return Date.now() - timestamp > retentionPeriod;
  }

  /**
   * Update privacy configuration
   */
  public updateConfig(config: AnalyticsConfig): void {
    this.config = config;
    this.privacyConfig = this.getPrivacyConfig();
  }

  /**
   * Get consent status
   */
  public getConsentStatus(): ConsentSettings & { timestamp: number | null } {
    return {
      ...this.consent,
      timestamp: this.consentTimestamp,
    };
  }

  /**
   * Reset all consent and privacy data
   */
  public resetConsent(): void {
    this.consent = {
      analytics: false,
      personalization: false,
      marketing: false,
      functional: true, // Usually required for basic functionality
      performance: false,
    };
    this.consentTimestamp = null;
    this.saveConsent();
  }

  /**
   * Check if browser has Do Not Track enabled
   */
  private isDoNotTrackEnabled(): boolean {
    return (
      navigator.doNotTrack === "1" ||
      (window as any).doNotTrack === "1" ||
      (navigator as any).msDoNotTrack === "1"
    );
  }

  /**
   * Check if valid consent exists
   */
  private hasValidConsent(): boolean {
    if (!this.consentTimestamp) {
      return false;
    }

    // Check if consent is still valid (not older than 13 months for GDPR)
    const consentAge = Date.now() - this.consentTimestamp;
    const maxConsentAge = 13 * 30 * 24 * 60 * 60 * 1000; // 13 months

    return consentAge < maxConsentAge;
  }

  /**
   * Check event-specific consent
   */
  private checkEventTypeConsent(eventType?: string): boolean {
    if (!eventType) return true;

    // Map event types to consent categories
    const functionalEvents = ["session_start", "session_end", "page_load"];
    const performanceEvents = [
      "latency_measurement",
      "buffer_health",
      "network_quality_change",
    ];
    const analyticsEvents = ["play_start", "play_end", "track_complete"];
    const personalizationEvents = [
      "track_like",
      "playlist_add",
      "recommendation_click",
    ];

    if (functionalEvents.includes(eventType)) {
      return this.consent.functional;
    }

    if (performanceEvents.includes(eventType)) {
      return this.consent.performance;
    }

    if (personalizationEvents.includes(eventType)) {
      return this.consent.personalization;
    }

    if (analyticsEvents.includes(eventType)) {
      return this.consent.analytics;
    }

    // Default to analytics consent for unknown events
    return this.consent.analytics;
  }

  /**
   * Anonymize IP address
   */
  private async anonymizeIP(ip: string): Promise<string> {
    // Check cache first
    if (this.ipHashCache.has(ip)) {
      return this.ipHashCache.get(ip)!;
    }

    // For IPv4, zero out the last octet
    if (ip.includes(".")) {
      const parts = ip.split(".");
      if (parts.length === 4) {
        const anonymized = `${parts[0]}.${parts[1]}.${parts[2]}.0`;
        this.ipHashCache.set(ip, anonymized);
        return anonymized;
      }
    }

    // For IPv6, zero out the last 80 bits
    if (ip.includes(":")) {
      const parts = ip.split(":");
      if (parts.length >= 4) {
        const anonymized = `${parts.slice(0, 3).join(":")}::`;
        this.ipHashCache.set(ip, anonymized);
        return anonymized;
      }
    }

    // Fallback to complete removal
    this.ipHashCache.set(ip, "anonymized");
    return "anonymized";
  }

  /**
   * Pseudonymize user ID using one-way hash
   */
  private async pseudonymizeUserId(userId: string): Promise<string> {
    // In a real implementation, use a proper cryptographic hash
    const encoder = new TextEncoder();
    const data = encoder.encode(userId + "privacy_salt");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .substr(0, 16);
  }

  /**
   * Check if geography should be anonymized
   */
  private shouldAnonymizeGeography(country?: string): boolean {
    // Countries with strict privacy laws
    const strictPrivacyCountries = [
      "DE",
      "FR",
      "AT",
      "BE",
      "DK",
      "FI",
      "SE",
      "NO",
    ];
    return country ? strictPrivacyCountries.includes(country) : false;
  }

  /**
   * Check if COPPA applies (user is under 13)
   */
  private async isCoppaApplicable(event: AnalyticsEvent): Promise<boolean> {
    if (!this.privacyConfig.coppaEnabled) {
      return false;
    }

    // In a real implementation, this would check user age from profile
    // For now, assume COPPA applies if user ID indicates minor account
    return event.userId ? event.userId.includes("minor") : false;
  }

  /**
   * Setup Do Not Track detection
   */
  private setupDoNotTrack(): void {
    if (typeof window !== "undefined") {
      // Listen for DNT changes (some browsers support this)
      window.addEventListener("storage", (e) => {
        if (e.key === "dnt-policy-acknowledged") {
          // Refresh consent if DNT policy acknowledged
          this.consent = this.loadConsent();
        }
      });
    }
  }

  /**
   * Load consent from storage
   */
  private loadConsent(): ConsentSettings {
    if (typeof localStorage === "undefined") {
      return this.getDefaultConsent();
    }

    try {
      const stored = localStorage.getItem("beatflow_consent");
      if (stored) {
        const parsed = JSON.parse(stored);
        this.consentTimestamp = parsed.timestamp;
        return parsed.consent || this.getDefaultConsent();
      }
    } catch (error) {
      console.warn("Error loading consent settings:", error);
    }

    return this.getDefaultConsent();
  }

  /**
   * Save consent to storage
   */
  private saveConsent(): void {
    if (typeof localStorage === "undefined") return;

    try {
      const consentData = {
        consent: this.consent,
        timestamp: this.consentTimestamp,
        version: this.privacyConfig.consentVersion,
      };
      localStorage.setItem("beatflow_consent", JSON.stringify(consentData));
    } catch (error) {
      console.warn("Error saving consent settings:", error);
    }
  }

  /**
   * Get default consent settings
   */
  private getDefaultConsent(): ConsentSettings {
    return {
      analytics: false,
      personalization: false,
      marketing: false,
      functional: true, // Required for basic app functionality
      performance: false,
    };
  }

  /**
   * Get privacy configuration based on app config
   */
  private getPrivacyConfig(): PrivacyConfig {
    return {
      gdprEnabled: this.config.gdprCompliant,
      ccpaEnabled: this.config.ccpaCompliant,
      coppaEnabled: this.config.coppaCompliant,
      consentVersion: "2.0",
      dataRetentionDays: this.config.dataRetentionDays,
      anonymizationEnabled: this.config.anonymizeIp,
      pseudonymizationEnabled: true,
    };
  }
}
