/**
 * Analytics Configuration for BeatflowMedia
 * Centralized configuration for analytics pipeline, event tracking, and privacy controls
 */

export interface AnalyticsEventType {
  // Playback Events
  PLAY_START: "play_start";
  PLAY_END: "play_end";
  PLAY_PAUSE: "play_pause";
  PLAY_RESUME: "play_resume";
  SEEK: "seek";
  BUFFERING_START: "buffering_start";
  BUFFERING_END: "buffering_end";
  TRACK_COMPLETE: "track_complete";
  PLAYBACK_ERROR: "playback_error";
  BITRATE_SWITCH: "bitrate_switch";

  // User Engagement
  SESSION_START: "session_start";
  SESSION_END: "session_end";
  TRACK_SKIP: "track_skip";
  TRACK_LIKE: "track_like";
  TRACK_UNLIKE: "track_unlike";
  PLAYLIST_ADD: "playlist_add";
  PLAYLIST_REMOVE: "playlist_remove";
  SHARE_TRACK: "share_track";
  DOWNLOAD_START: "download_start";
  DOWNLOAD_COMPLETE: "download_complete";

  // Content Performance
  SEARCH_QUERY: "search_query";
  SEARCH_RESULT_CLICK: "search_result_click";
  CONTENT_VIEW: "content_view";
  CONTENT_INTERACTION: "content_interaction";
  RECOMMENDATION_VIEW: "recommendation_view";
  RECOMMENDATION_CLICK: "recommendation_click";

  // DRM and Security
  LICENSE_REQUEST: "license_request";
  LICENSE_GRANTED: "license_granted";
  LICENSE_DENIED: "license_denied";
  DRM_ERROR: "drm_error";
  AUTHENTICATION_SUCCESS: "auth_success";
  AUTHENTICATION_FAILURE: "auth_failure";
  TOKEN_REFRESH: "token_refresh";
  SECURITY_VIOLATION: "security_violation";

  // Network and Performance
  NETWORK_QUALITY_CHANGE: "network_quality_change";
  CDN_SWITCH: "cdn_switch";
  BUFFER_HEALTH: "buffer_health";
  LATENCY_MEASUREMENT: "latency_measurement";
  PAGE_LOAD: "page_load";
  API_CALL: "api_call";

  // Business Events
  SUBSCRIPTION_START: "subscription_start";
  SUBSCRIPTION_END: "subscription_end";
  PAYMENT_SUCCESS: "payment_success";
  PAYMENT_FAILURE: "payment_failure";
  ROYALTY_CALCULATION: "royalty_calculation";
  TERRITORY_CHECK: "territory_check";
}

export const ANALYTICS_EVENTS: AnalyticsEventType = {
  // Playback Events
  PLAY_START: "play_start",
  PLAY_END: "play_end",
  PLAY_PAUSE: "play_pause",
  PLAY_RESUME: "play_resume",
  SEEK: "seek",
  BUFFERING_START: "buffering_start",
  BUFFERING_END: "buffering_end",
  TRACK_COMPLETE: "track_complete",
  PLAYBACK_ERROR: "playback_error",
  BITRATE_SWITCH: "bitrate_switch",

  // User Engagement
  SESSION_START: "session_start",
  SESSION_END: "session_end",
  TRACK_SKIP: "track_skip",
  TRACK_LIKE: "track_like",
  TRACK_UNLIKE: "track_unlike",
  PLAYLIST_ADD: "playlist_add",
  PLAYLIST_REMOVE: "playlist_remove",
  SHARE_TRACK: "share_track",
  DOWNLOAD_START: "download_start",
  DOWNLOAD_COMPLETE: "download_complete",

  // Content Performance
  SEARCH_QUERY: "search_query",
  SEARCH_RESULT_CLICK: "search_result_click",
  CONTENT_VIEW: "content_view",
  CONTENT_INTERACTION: "content_interaction",
  RECOMMENDATION_VIEW: "recommendation_view",
  RECOMMENDATION_CLICK: "recommendation_click",

  // DRM and Security
  LICENSE_REQUEST: "license_request",
  LICENSE_GRANTED: "license_granted",
  LICENSE_DENIED: "license_denied",
  DRM_ERROR: "drm_error",
  AUTHENTICATION_SUCCESS: "auth_success",
  AUTHENTICATION_FAILURE: "auth_failure",
  TOKEN_REFRESH: "token_refresh",
  SECURITY_VIOLATION: "security_violation",

  // Network and Performance
  NETWORK_QUALITY_CHANGE: "network_quality_change",
  CDN_SWITCH: "cdn_switch",
  BUFFER_HEALTH: "buffer_health",
  LATENCY_MEASUREMENT: "latency_measurement",
  PAGE_LOAD: "page_load",
  API_CALL: "api_call",

  // Business Events
  SUBSCRIPTION_START: "subscription_start",
  SUBSCRIPTION_END: "subscription_end",
  PAYMENT_SUCCESS: "payment_success",
  PAYMENT_FAILURE: "payment_failure",
  ROYALTY_CALCULATION: "royalty_calculation",
  TERRITORY_CHECK: "territory_check",
};

export interface BaseAnalyticsEvent {
  eventType: keyof AnalyticsEventType;
  timestamp: number;
  sessionId: string;
  userId?: string;
  deviceId: string;
  userAgent: string;
  ip?: string;
  country?: string;
  territory?: string;
  platform: "web" | "mobile" | "desktop";
  version: string;
}

export interface PlaybackEvent extends BaseAnalyticsEvent {
  trackId: string;
  albumId?: string;
  artistId?: string;
  playlistId?: string;
  position: number;
  duration: number;
  quality: string;
  drmType?: string;
  cdn?: string;
}

export interface UserEngagementEvent extends BaseAnalyticsEvent {
  action: string;
  targetId?: string;
  targetType?: "track" | "album" | "artist" | "playlist";
  metadata?: Record<string, any>;
}

export interface SecurityEvent extends BaseAnalyticsEvent {
  securityLevel: "low" | "medium" | "high" | "critical";
  threatType?: string;
  details: Record<string, any>;
}

export interface PerformanceEvent extends BaseAnalyticsEvent {
  metric: string;
  value: number;
  unit: string;
  threshold?: number;
}

export type AnalyticsEvent =
  | PlaybackEvent
  | UserEngagementEvent
  | SecurityEvent
  | PerformanceEvent
  | BaseAnalyticsEvent;

export interface AnalyticsConfig {
  // Data Collection
  enabled: boolean;
  bufferSize: number;
  flushInterval: number;
  maxRetries: number;
  retryDelay: number;

  // Privacy Settings
  respectDoNotTrack: boolean;
  anonymizeIp: boolean;
  consentRequired: boolean;
  dataRetentionDays: number;

  // Performance Settings
  samplingRate: number;
  enableRealtime: boolean;
  batchSize: number;
  compressionEnabled: boolean;

  // Endpoints
  collectorEndpoint: string;
  realtimeEndpoint: string;
  exportEndpoint: string;

  // Feature Flags
  enableGeoTracking: boolean;
  enablePerformanceMonitoring: boolean;
  enableSecurityTracking: boolean;
  enableBusinessIntelligence: boolean;

  // Alert Thresholds
  errorRateThreshold: number;
  latencyThreshold: number;
  bufferHealthThreshold: number;

  // Compliance
  gdprCompliant: boolean;
  ccpaCompliant: boolean;
  coppaCompliant: boolean;
}

export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  // Data Collection
  enabled: true,
  bufferSize: 100,
  flushInterval: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000,

  // Privacy Settings
  respectDoNotTrack: true,
  anonymizeIp: true,
  consentRequired: true,
  dataRetentionDays: 365,

  // Performance Settings
  samplingRate: 1.0, // 100% sampling for music industry compliance
  enableRealtime: true,
  batchSize: 50,
  compressionEnabled: true,

  // Endpoints
  collectorEndpoint: "/api/analytics/events",
  realtimeEndpoint: "/api/analytics/realtime",
  exportEndpoint: "/api/analytics/export",

  // Feature Flags
  enableGeoTracking: true,
  enablePerformanceMonitoring: true,
  enableSecurityTracking: true,
  enableBusinessIntelligence: true,

  // Alert Thresholds
  errorRateThreshold: 0.05, // 5%
  latencyThreshold: 2000, // 2 seconds
  bufferHealthThreshold: 0.1, // 10% buffer health

  // Compliance
  gdprCompliant: true,
  ccpaCompliant: true,
  coppaCompliant: true,
};

export interface RoyaltyCalculationConfig {
  // Royalty Rates (per play)
  premiumStreamRate: number;
  freeStreamRate: number;
  downloadRate: number;

  // Territory Multipliers
  territoryMultipliers: Record<string, number>;

  // Minimum Play Duration for Royalty (30 seconds industry standard)
  minimumPlayDuration: number;

  // Calculation Intervals
  calculationInterval: number; // How often to calculate royalties (ms)
  reportingInterval: number; // How often to generate reports (ms)
}

export const DEFAULT_ROYALTY_CONFIG: RoyaltyCalculationConfig = {
  premiumStreamRate: 0.004, // $0.004 per stream
  freeStreamRate: 0.0015, // $0.0015 per stream
  downloadRate: 0.7, // $0.70 per download

  territoryMultipliers: {
    US: 1.0,
    UK: 0.85,
    DE: 0.8,
    FR: 0.75,
    JP: 0.9,
    default: 0.5,
  },

  minimumPlayDuration: 30000, // 30 seconds
  calculationInterval: 3600000, // 1 hour
  reportingInterval: 86400000, // 24 hours
};

export interface DashboardConfig {
  // Refresh Intervals
  realtimeRefreshInterval: number;
  dashboardRefreshInterval: number;

  // Chart Settings
  maxDataPoints: number;
  animationDuration: number;

  // Data Retention for UI
  shortTermRetention: number; // Hours
  mediumTermRetention: number; // Days
  longTermRetention: number; // Days
}

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  realtimeRefreshInterval: 5000, // 5 seconds
  dashboardRefreshInterval: 30000, // 30 seconds
  maxDataPoints: 1000,
  animationDuration: 300,
  shortTermRetention: 24, // 24 hours
  mediumTermRetention: 30, // 30 days
  longTermRetention: 365, // 1 year
};
