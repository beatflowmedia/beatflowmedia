// src/services/analytics/AnalyticsService.js
// Production-grade analytics service with real-time streaming, buffering, and compliance

import AnalyticsConfig from './AnalyticsConfig';
import { EventValidator } from './EventValidator';
import { PrivacyManager } from './PrivacyManager';
import { QueueManager } from './QueueManager';

class AnalyticsService {
  constructor() {
    this.config = AnalyticsConfig;
    this.eventValidator = new EventValidator();
    this.privacyManager = new PrivacyManager();
    this.queueManager = new QueueManager();

    // Event buffers for different priorities
    this.buffers = {
      critical: [],
      high: [],
      normal: [],
      low: []
    };

    // Service state
    this.initialized = false;
    this.userId = null;
    this.sessionId = null;
    this.consentStatus = {};

    // Performance monitoring
    this.metrics = {
      eventsCollected: 0,
      eventsProcessed: 0,
      eventsDropped: 0,
      lastFlushTime: Date.now(),
      errorCount: 0
    };

    // Network state tracking
    this.networkState = {
      online: navigator.onLine,
      effectiveType: null,
      downlink: null,
      rtt: null
    };

    this.initialize();
  }

  /**
   * Initialize the analytics service
   */
  async initialize() {
    try {
      // Initialize session
      this.sessionId = this.generateSessionId();

      // Setup network monitoring
      this.setupNetworkMonitoring();

      // Setup flush intervals
      this.setupFlushScheduler();

      // Setup error handling
      this.setupErrorHandling();

      // Load user consent status
      await this.loadConsentStatus();

      // Setup offline queue
      this.setupOfflineQueue();

      this.initialized = true;

      // Track service initialization
      this.trackEvent('analytics_service_initialized', {
        timestamp: Date.now(),
        version: '1.0.0',
        capabilities: this.getServiceCapabilities()
      });

    } catch (error) {
      console.error('Failed to initialize AnalyticsService:', error);
      this.handleError('service_initialization_failed', error);
    }
  }

  /**
   * Set user context for analytics
   */
  setUser(userId, userProperties = {}) {
    this.userId = userId;
    this.userProperties = {
      ...userProperties,
      first_seen: userProperties.first_seen || Date.now()
    };

    // Apply privacy settings
    if (this.privacyManager.shouldPseudonymize()) {
      this.userId = this.privacyManager.pseudonymizeUserId(userId);
    }

    this.trackEvent('user_context_set', {
      user_id: this.userId,
      timestamp: Date.now(),
      properties: this.privacyManager.filterUserProperties(userProperties)
    });
  }

  /**
   * Update user consent status
   */
  updateConsent(consentTypes) {
    this.consentStatus = { ...this.consentStatus, ...consentTypes };

    // Store consent for persistence
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('analytics_consent', JSON.stringify(this.consentStatus));
    }

    this.trackEvent('consent_updated', {
      user_id: this.userId,
      timestamp: Date.now(),
      consent_types: Object.keys(consentTypes),
      granted: Object.values(consentTypes).filter(Boolean).length
    });
  }

  /**
   * Main event tracking method
   */
  trackEvent(eventName, eventData = {}, options = {}) {
    if (!this.initialized) {
      console.warn('AnalyticsService not initialized');
      return false;
    }

    // Check consent requirements
    if (!this.hasRequiredConsent(eventName)) {
      return false;
    }

    try {
      // Enhance event data with context
      const enhancedEvent = this.enhanceEventData(eventName, eventData, options);

      // Validate event schema
      const validationResult = this.eventValidator.validate(eventName, enhancedEvent);
      if (!validationResult.valid) {
        console.warn('Event validation failed:', validationResult.errors);
        this.metrics.eventsDropped++;
        return false;
      }

      // Apply privacy filters
      const privateEvent = this.privacyManager.applyPrivacyFilters(enhancedEvent);

      // Determine event priority
      const priority = this.getEventPriority(eventName);

      // Add to appropriate buffer
      this.addToBuffer(priority, privateEvent);

      // Immediate flush for critical events
      if (priority === 'critical' || this.config.collection.realTimeEvents.includes(eventName)) {
        this.flushBuffer('critical');
      }

      this.metrics.eventsCollected++;
      return true;

    } catch (error) {
      console.error('Error tracking event:', error);
      this.handleError('event_tracking_failed', error, { eventName, eventData });
      return false;
    }
  }

  /**
   * Track playback events with music industry compliance
   */
  trackPlayback(eventType, trackData, playbackData = {}) {
    const baseEvent = {
      user_id: this.userId,
      session_id: this.sessionId,
      track_id: trackData.id,
      artist_id: trackData.artist_id,
      album_id: trackData.album_id,
      territory: this.getUserTerritory(),
      timestamp: Date.now(),
      ...playbackData
    };

    // Add royalty-specific data for qualifying events
    if (['play_start', 'play_end', 'track_complete'].includes(eventType)) {
      baseEvent.royalty_qualifying = this.isRoyaltyQualifying(playbackData);
      baseEvent.user_tier = this.getUserTier();
      baseEvent.license_type = trackData.license_type || 'standard';
    }

    return this.trackEvent(eventType, baseEvent, { category: 'playback' });
  }

  /**
   * Track user engagement events
   */
  trackEngagement(eventType, engagementData = {}) {
    const baseEvent = {
      user_id: this.userId,
      session_id: this.sessionId,
      timestamp: Date.now(),
      ...engagementData
    };

    return this.trackEvent(eventType, baseEvent, { category: 'engagement' });
  }

  /**
   * Track technical performance events
   */
  trackPerformance(eventType, performanceData = {}) {
    const baseEvent = {
      user_id: this.userId,
      session_id: this.sessionId,
      timestamp: Date.now(),
      network_state: this.networkState,
      ...performanceData
    };

    return this.trackEvent(eventType, baseEvent, { category: 'performance' });
  }

  /**
   * Track DRM and security events
   */
  trackSecurity(eventType, securityData = {}) {
    const baseEvent = {
      user_id: this.userId,
      session_id: this.sessionId,
      timestamp: Date.now(),
      user_agent: navigator.userAgent,
      ip_hash: this.privacyManager.hashIP(this.getClientIP()),
      ...securityData
    };

    return this.trackEvent(eventType, baseEvent, {
      category: 'security',
      priority: 'critical'
    });
  }

  /**
   * Track business events
   */
  trackBusiness(eventType, businessData = {}) {
    const baseEvent = {
      user_id: this.userId,
      timestamp: Date.now(),
      currency: 'USD',
      ...businessData
    };

    return this.trackEvent(eventType, baseEvent, {
      category: 'business',
      priority: 'high'
    });
  }

  /**
   * Enhanced event data with context
   */
  enhanceEventData(eventName, eventData, options) {
    return {
      event_name: eventName,
      event_id: this.generateEventId(),
      user_id: this.userId,
      session_id: this.sessionId,
      timestamp: eventData.timestamp || Date.now(),

      // Device context
      device_info: {
  user_agent: navigator.userAgent,
  language: navigator.language,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  screen_resolution: typeof window !== 'undefined' && window.screen ? `${window.screen.width}x${window.screen.height}` : null,
  viewport_size: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : null,
  color_depth: typeof window !== 'undefined' && window.screen ? window.screen.colorDepth : null,
  pixel_ratio: typeof window !== 'undefined' ? window.devicePixelRatio : null
      },

      // Network context
      network_info: this.networkState,

      // Application context
      app_info: {
        version: process.env.REACT_APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV,
        build_id: process.env.REACT_APP_BUILD_ID,
        deployment_id: process.env.REACT_APP_DEPLOYMENT_ID
      },

      // Page context
      page_info: {
        url: window.location.href,
        path: window.location.pathname,
        referrer: document.referrer,
        title: document.title
      },

      // Event category and priority
      category: options.category || 'general',
      priority: options.priority || this.getEventPriority(eventName),

      // Original event data
      ...eventData
    };
  }

  /**
   * Add event to priority buffer
   */
  addToBuffer(priority, event) {
    if (!this.buffers[priority]) {
      priority = 'normal';
    }

    this.buffers[priority].push(event);

    // Check if buffer needs flushing
    if (this.buffers[priority].length >= this.config.collection.bufferSize) {
      this.flushBuffer(priority);
    }
  }

  /**
   * Flush events from buffer to collection endpoint
   */
  async flushBuffer(priority = 'all') {
    const priorities = priority === 'all'
      ? Object.keys(this.buffers)
      : [priority];

    for (const p of priorities) {
      const events = this.buffers[p].splice(0);

      if (events.length === 0) continue;

      try {
        await this.sendEvents(events, p);
        this.metrics.eventsProcessed += events.length;
      } catch (error) {
        console.error(`Failed to flush ${p} buffer:`, error);

        // Re-queue events for retry if not critical
        if (p !== 'critical' && events.length < this.config.collection.bufferSize) {
          this.buffers[p].unshift(...events);
        }

        this.handleError('buffer_flush_failed', error, {
          priority: p,
          eventCount: events.length
        });
      }
    }

    this.metrics.lastFlushTime = Date.now();
  }

  /**
   * Send events to collection endpoint
   */
  async sendEvents(events, priority) {
    const endpoint = this.config.api.endpoints.collect;
    const payload = {
      events,
      priority,
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: Date.now(),
      service_version: '1.0.0'
    };

    // Apply compression if enabled
    const body = this.config.dataWarehouse.streaming.compressionEnabled
      ? await this.compressPayload(payload)
      : JSON.stringify(payload);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`,
        'X-Analytics-Version': '1.0.0',
        'X-Priority': priority
      },
      body
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get event priority based on configuration
   */
  getEventPriority(eventName) {
    for (const [priority, events] of Object.entries(this.config.collection.eventPriorities)) {
      if (events.includes(eventName)) {
        return priority;
      }
    }
    return 'normal';
  }

  /**
   * Check if event meets royalty qualification requirements
   */
  isRoyaltyQualifying(playbackData) {
    const duration = playbackData.duration || 0;
    const completionPercentage = playbackData.completion_percentage || 0;

    return duration >= this.config.compliance.minimumPlayDuration ||
           completionPercentage >= 50; // 50% completion minimum
  }

  /**
   * Setup network monitoring for performance analytics
   */
  setupNetworkMonitoring() {
    if ('connection' in navigator) {
      const connection = navigator.connection;

      this.networkState = {
        online: navigator.onLine,
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };

      const updateNetworkState = () => {
        const newState = {
          online: navigator.onLine,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        };

        if (JSON.stringify(newState) !== JSON.stringify(this.networkState)) {
          this.trackPerformance('network_change', {
            from_state: this.networkState,
            to_state: newState
          });
          this.networkState = newState;
        }
      };

      connection.addEventListener('change', updateNetworkState);
      window.addEventListener('online', updateNetworkState);
      window.addEventListener('offline', updateNetworkState);
    }
  }

  /**
   * Setup automated flush scheduler
   */
  setupFlushScheduler() {
    // Regular flush interval
    setInterval(() => {
      this.flushBuffer('all');
    }, this.config.collection.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushBuffer('all');
    });

    // Flush on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flushBuffer('all');
      }
    });
  }

  /**
   * Setup error handling and reporting
   */
  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      this.trackPerformance('javascript_error', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackPerformance('unhandled_promise_rejection', {
        reason: event.reason?.toString(),
        stack: event.reason?.stack
      });
    });
  }

  /**
   * Setup offline queue management
   */
  setupOfflineQueue() {
    // Store events offline when network is unavailable
    window.addEventListener('offline', () => {
      this.queueManager.enableOfflineMode();
    });

    window.addEventListener('online', () => {
      this.queueManager.disableOfflineMode();
      this.queueManager.processOfflineQueue().then(events => {
        if (events.length > 0) {
          this.trackEvent('offline_events_processed', {
            event_count: events.length,
            offline_duration: this.queueManager.getOfflineDuration()
          });
        }
      });
    });
  }

  /**
   * Load consent status from storage
   */
  async loadConsentStatus() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('analytics_consent');
        if (stored) {
          this.consentStatus = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.warn('Failed to load consent status:', error);
    }
  }

  /**
   * Check if user has given required consent for event type
   */
  hasRequiredConsent(eventName) {
    if (!this.config.privacy.consentRequired) {
      return true;
    }

    // Map event types to consent requirements
    const consentMapping = {
      playback: 'analytics',
      engagement: 'analytics',
      business: 'analytics',
      performance: 'analytics',
      security: 'analytics', // Security events may not require consent
      marketing: 'marketing',
      personalization: 'personalization'
    };

    const requiredConsent = consentMapping[eventName] || 'analytics';
    return this.consentStatus[requiredConsent] === true;
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${this.metrics.eventsCollected}`;
  }

  /**
   * Get service capabilities for debugging
   */
  getServiceCapabilities() {
    return {
      realTimeStreaming: this.config.dataWarehouse.streaming.enabled,
      offlineQueue: true,
      compression: this.config.dataWarehouse.streaming.compressionEnabled,
      privacyCompliant: this.config.privacy.gdprCompliant,
      networkMonitoring: 'connection' in navigator,
      performanceAPI: 'performance' in window
    };
  }

  /**
   * Get user territory for compliance
   */
  getUserTerritory() {
    // Implementation would use geolocation or user profile data
    return 'US'; // Default
  }

  /**
   * Get user subscription tier
   */
  getUserTier() {
    return this.userProperties?.subscription_tier || 'free';
  }

  /**
   * Get client IP (for privacy-compliant hashing)
   */
  getClientIP() {
    // Implementation would get IP from headers or API
    return null; // Placeholder
  }

  /**
   * Get authentication token for API requests
   */
  async getAuthToken() {
    // Implementation would retrieve current auth token
    return 'mock-token'; // Placeholder
  }

  /**
   * Compress payload for efficient transmission
   */
  async compressPayload(payload) {
    // Implementation would use compression algorithm
    return JSON.stringify(payload); // Placeholder
  }

  /**
   * Handle service errors
   */
  handleError(errorType, error, context = {}) {
    this.metrics.errorCount++;

    console.error(`AnalyticsService ${errorType}:`, error, context);

    // Track error event (if service is functional)
    if (this.initialized && errorType !== 'service_initialization_failed') {
      this.trackEvent('analytics_service_error', {
        error_type: errorType,
        error_message: error.message,
        error_stack: error.stack,
        context,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Get service metrics for monitoring
   */
  getMetrics() {
    return {
      ...this.metrics,
      buffer_sizes: Object.fromEntries(
        Object.entries(this.buffers).map(([priority, buffer]) => [priority, buffer.length])
      ),
      network_state: this.networkState,
      initialized: this.initialized,
      consent_status: this.consentStatus
    };
  }

  /**
   * Export user data (GDPR compliance)
   */
  async exportUserData(format = 'json') {
    if (!this.config.privacy.exportFormats.includes(format)) {
      throw new Error(`Unsupported export format: ${format}`);
    }

    // Implementation would query data warehouse for user's data
    return {
      user_id: this.userId,
      export_format: format,
      export_timestamp: Date.now(),
      data: {} // Placeholder for actual data
    };
  }

  /**
   * Delete user data (GDPR compliance)
   */
  async deleteUserData() {
    // Implementation would trigger data deletion in all systems
    this.trackEvent('user_data_deletion_requested', {
      user_id: this.userId,
      timestamp: Date.now()
    });

    return { success: true, deletion_id: this.generateEventId() };
  }

  /**
   * Cleanup service resources
   */
  destroy() {
    // Flush remaining events
    this.flushBuffer('all');

    // Clear intervals and event listeners
    // Implementation would clean up all resources

    this.initialized = false;
  }
}

// Export singleton instance
const analyticsService = new AnalyticsService();
export default analyticsService;