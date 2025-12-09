// src/services/analytics/AnalyticsConfig.js
// Production-grade analytics configuration for music industry compliance

export const AnalyticsConfig = {
  // Event Collection Configuration
  collection: {
    // Buffer settings for efficient event batching
    bufferSize: 100,
    flushInterval: 5000, // 5 seconds
    maxRetries: 3,
    retryDelay: 1000,

    // Real-time streaming for critical events
    realTimeEvents: [
      "play_start",
      "play_end",
      "track_complete",
      "license_violation",
      "drm_failure",
      "payment_event",
    ],

    // Event priorities for queue management
    eventPriorities: {
      critical: ["license_violation", "drm_failure", "payment_event"],
      high: ["play_start", "play_end", "track_complete"],
      normal: ["seek", "volume_change", "playlist_action"],
      low: ["ui_interaction", "hover_event"]
    }
  },

  // Music Industry Compliance
  compliance: {
    // Royalty calculation precision
    royaltyPrecision: 4,

    // Minimum play duration for royalty qualification (30 seconds industry standard)
    minimumPlayDuration: 30,

    // Territory tracking requirements
    territorialTracking: true,

    // Required metadata for compliance
    requiredFields: [
      "user_id",
      "track_id",
      "artist_id",
      "territory",
      "timestamp",
      "play_duration",
      "completion_percentage",
    ],

    // Audit trail requirements
    auditRetention: 365 * 7, // 7 years in days
    tamperProofing: true
  },

  // Privacy and Data Protection
  privacy: {
    // GDPR compliance settings
    gdprCompliant: true,
    dataRetentionDays: 730, // 2 years default

    // PII handling
    piiFields: ["user_id", "ip_address", "device_id"],
    pseudonymization: true,
    anonymizationThreshold: 90, // days

    // Consent management
    consentRequired: true,
    consentTypes: ["analytics", "marketing", "personalization"],

    // Data export rights
    exportFormats: ["json", "csv", "xml"],
    exportRetention: 30, // days to keep export files
  },

  // Performance and Quality
  performance: {
    // Quality thresholds for adaptive streaming analytics
    qualityLevels: {
      low: { bitrate: 128, resolution: null },
      medium: { bitrate: 256, resolution: null },
      high: { bitrate: 320, resolution: null },
      lossless: { bitrate: 1411, resolution: null }
    },

    // Network quality indicators
    networkThresholds: {
      excellent: { latency: 50, bandwidth: 10000 },
      good: { latency: 100, bandwidth: 5000 },
      fair: { latency: 200, bandwidth: 1000 },
      poor: { latency: 500, bandwidth: 500 }
    },

    // Buffer health metrics
    bufferThresholds: {
      healthy: 10, // seconds
      warning: 5,
      critical: 2
    }
  },

  // Business Intelligence
  businessIntelligence: {
    // Key Performance Indicators
    kpis: [
      "daily_active_users",
      "monthly_active_users",
      "average_session_duration",
      "track_completion_rate",
      "revenue_per_user",
      "churn_rate",
      "playlist_engagement",
    ],

    // Real-time metrics refresh intervals
    refreshIntervals: {
      realTime: 1000, // 1 second
      nearRealTime: 10000, // 10 seconds
      periodic: 60000, // 1 minute
      dashboard: 300000, // 5 minutes
    },

    // Aggregation windows
    aggregationWindows: ["1h", "1d", "7d", "30d", "90d", "1y"],

    // Alert thresholds
    alertThresholds: {
      errorRate: 0.05, // 5%
      latencyP95: 2000, // 2 seconds
      bufferUnderrun: 0.02, // 2%
      licenseFailure: 0.001, // 0.1%
    }
  },

  // Data Warehouse Integration
  dataWarehouse: {
    // BigQuery configuration
    bigQuery: {
      projectId: process.env.REACT_APP_BIGQUERY_PROJECT_ID,
      datasetId: "beatflow_analytics",

      // Table schemas
      tables: {
        playback_events: "playback_events_v1",
        user_sessions: "user_sessions_v1",
        content_analytics: "content_analytics_v1",
        revenue_events: "revenue_events_v1",
        error_logs: "error_logs_v1"
      },

      // Partitioning strategy
      partitioning: {
        type: "TIME",
        field: "timestamp",
        granularity: "DAY"
      }
    },

    // Real-time streaming
    streaming: {
      enabled: true,
      endpoint: process.env.REACT_APP_ANALYTICS_STREAM_ENDPOINT,
      batchSize: 1000,
      compressionEnabled: true
    }
  },

  // Event Schema Definitions
  eventSchemas: {
    // Playback Events
    playback: {
      play_start: {
        required: ["user_id", "track_id", "session_id", "timestamp"],
        optional: ["playlist_id", "queue_position", "source", "quality"]
      },
      play_pause: {
        required: [
          "user_id",
          "track_id",
          "session_id",
          "timestamp",
          "position",
        ],
        optional: ["reason"]
      },
      play_resume: {
        required: [
          "user_id",
          "track_id",
          "session_id",
          "timestamp",
          "position",
        ],
        optional: ["gap_duration"]
      },
      play_end: {
        required: [
          "user_id",
          "track_id",
          "session_id",
          "timestamp",
          "duration",
          "completion_percentage",
        ],
        optional: ["reason", "next_track_id"]
      },
      seek: {
        required: [
          "user_id",
          "track_id",
          "session_id",
          "timestamp",
          "from_position",
          "to_position",
        ],
        optional: ["seek_reason"]
      },
      track_complete: {
        required: [
          "user_id",
          "track_id",
          "session_id",
          "timestamp",
          "duration",
        ],
        optional: ["replay_count"]
      }
    },

    // User Engagement Events
    engagement: {
      session_start: {
        required: ["user_id", "session_id", "timestamp", "device_info"],
        optional: ["referrer", "utm_parameters"]
      },
      session_end: {
        required: ["user_id", "session_id", "timestamp", "duration"],
        optional: ["tracks_played", "last_activity"]
      },
      like_track: {
        required: ["user_id", "track_id", "timestamp"],
        optional: ["playlist_context"]
      },
      playlist_create: {
        required: ["user_id", "playlist_id", "timestamp"],
        optional: ["track_count", "visibility"]
      },
      playlist_add_track: {
        required: ["user_id", "playlist_id", "track_id", "timestamp"],
        optional: ["position"]
      }
    },

    // Content Performance Events
    content: {
      track_discovery: {
        required: ["user_id", "track_id", "timestamp", "discovery_method"],
        optional: ["source_playlist", "recommendation_algorithm"]
      },
      artist_follow: {
        required: ["user_id", "artist_id", "timestamp"],
        optional: ["source_context"]
      },
      share_track: {
        required: ["user_id", "track_id", "timestamp", "share_method"],
        optional: ["recipient_count"]
      }
    },

    // Technical Performance Events
    performance: {
      quality_change: {
        required: [
          "user_id",
          "track_id",
          "session_id",
          "timestamp",
          "from_quality",
          "to_quality",
        ],
        optional: ["trigger_reason", "network_state"]
      },
      buffer_event: {
        required: [
          "user_id",
          "track_id",
          "session_id",
          "timestamp",
          "event_type",
          "buffer_level",
        ],
        optional: ["network_speed", "quality_level"]
      },
      error_event: {
        required: [
          "user_id",
          "session_id",
          "timestamp",
          "error_type",
          "error_message",
        ],
        optional: ["track_id", "stack_trace", "browser_info"]
      }
    },

    // DRM and Security Events
    security: {
      license_request: {
        required: ["user_id", "track_id", "timestamp", "license_server"],
        optional: ["request_duration", "success"]
      },
      drm_failure: {
        required: [
          "user_id",
          "track_id",
          "timestamp",
          "failure_type",
          "error_code",
        ],
        optional: ["recovery_attempted"]
      },
      authentication_event: {
        required: ["user_id", "timestamp", "event_type"],
        optional: ["ip_address", "user_agent"]
      }
    },

    // Business Events
    business: {
      subscription_change: {
        required: ["user_id", "timestamp", "from_tier", "to_tier"],
        optional: ["promotion_code", "billing_cycle"]
      },
      payment_event: {
        required: ["user_id", "timestamp", "event_type", "amount"],
        optional: ["currency", "payment_method", "transaction_id"]
      },
      royalty_calculation: {
        required: [
          "track_id",
          "artist_id",
          "timestamp",
          "play_count",
          "revenue_amount",
        ],
        optional: ["territory", "user_tier"]
      }
    }
  },

  // API Configuration
  api: {
    // Rate limiting
    rateLimits: {
      events: 10000, // events per minute per user
      exports: 10, // exports per hour per user
      queries: 1000, // queries per hour per user
    },

    // Endpoints
    endpoints: {
      collect: "/api/analytics/collect",
      query: "/api/analytics/query",
      export: "/api/analytics/export",
      dashboard: "/api/analytics/dashboard",
      alerts: "/api/analytics/alerts"
    },

    // Authentication
    auth: {
      required: true,
      tokenValidation: true,
      roleBasedAccess: true
    }
  }
};

export default AnalyticsConfig;
