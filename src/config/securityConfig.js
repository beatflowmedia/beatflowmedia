/**
 * Security Configuration
 *
 * Centralized security configuration for BeatflowMedia application
 * Implements enterprise-grade security standards and best practices
 */

// Environment-based configuration
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

// Security Configuration Object
export const SECURITY_CONFIG = {
  // Authentication Configuration
  authentication: {
    // Session management
    session: {
      timeout: 24 * 60 * 60 * 1000, // 24 hours
      renewalWindow: 60 * 60 * 1000, // 1 hour before expiry
      maxConcurrentSessions: 3,
      requireReauth: {
        sensitiveOperations: true,
        adminActions: true,
        accountChanges: true
      }
    },

    // Password policy
    password: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventReuse: 12, // Last 12 passwords
      rotationDays: 90,
      complexityScore: 3, // Minimum complexity score
      bannedPatterns: [/password/i, /123456/, /qwerty/i, /admin/i, /beatflow/i]
    },

    // Multi-factor authentication
    mfa: {
      required: {
        admin: true,
        curator: true,
        artist: false,
        premium: false,
        free: false
      },
      methods: ["totp", "sms", "email", "webauthn"],
      backup: {
        enabled: true,
        codeCount: 10
      },
      grace: {
        period: 7 * 24 * 60 * 60 * 1000, // 7 days
        reminders: [7, 3, 1], // Days before enforcement
      }
    },

    // Account lockout policy
    lockout: {
      maxAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      progressiveLockout: true,
      escalationFactor: 2, // Double lockout time each attempt
      maxLockoutDuration: 24 * 60 * 60 * 1000, // 24 hours maximum
      resetAfter: 24 * 60 * 60 * 1000, // Reset counter after 24 hours
    },

    // Device management
    device: {
      fingerprinting: true,
      trustNewDevices: false,
      maxTrustedDevices: 5,
      trustTimeout: 90 * 24 * 60 * 60 * 1000, // 90 days
      requireApproval: {
        newDevice: true,
        newLocation: true,
        suspiciousDevice: true
      }
    }
  },

  // Authorization Configuration
  authorization: {
    // Role-based access control
    rbac: {
      roles: {
        admin: {
          permissions: ["*"],
          inherits: []
        },
        curator: {
          permissions: [
            "content:moderate",
            "playlist:manage",
            "user:basic_view",
            "analytics:view",
          ],
          inherits: ["premium"]
        },
        artist: {
          permissions: [
            "content:upload",
            "content:manage_own",
            "analytics:view_own",
            "revenue:view_own",
          ],
          inherits: ["premium"]
        },
        premium: {
          permissions: [
            "stream:premium",
            "download:enabled",
            "quality:high",
            "playlist:unlimited",
          ],
          inherits: ["free"]
        },
        free: {
          permissions: ["stream:basic", "playlist:limited", "social:basic"],
          inherits: []
        }
      },
      hierarchical: true,
      caching: {
        enabled: true,
        ttl: 5 * 60 * 1000, // 5 minutes
        invalidateOnUpdate: true
      }
    }
  },

  // Token Security Configuration
  tokens: {
    jwt: {
      // Playback tokens
      playback: {
        algorithm: "HS256",
        ttl: 2 * 60, // 2 minutes
        maxTtl: 5 * 60, // 5 minutes maximum
        refreshWindow: 30, // 30 seconds before expiry
        audience: "beatflow-streaming",
        issuer: "beatflow-auth",
        claims: {
          userId: true,
          contentId: true,
          quality: true,
          permissions: true,
          territorial: true,
          deviceId: true,
          sessionId: true
        }
      },

      // API tokens
      api: {
        algorithm: "RS256",
        ttl: 60 * 60, // 1 hour
        refreshTtl: 30 * 24 * 60 * 60, // 30 days
        audience: "beatflow-api",
        issuer: "beatflow-auth"
      }
    },

    // Token validation
    validation: {
      clockTolerance: 30, // 30 seconds
      blacklistCheck: true,
      audienceValidation: true,
      issuerValidation: true
    },

    // Token revocation
    revocation: {
      enabled: true,
      batchSize: 1000,
      cleanupInterval: 60 * 60 * 1000, // 1 hour
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
    }
  },

  // Rate Limiting Configuration
  rateLimiting: {
    // Global rate limits
    global: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000,
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    },

    // Endpoint-specific limits
    endpoints: {
      "/api/auth/login": {
        windowMs: 15 * 60 * 1000,
        maxRequests: 10
      },
      "/api/auth/register": {
        windowMs: 60 * 60 * 1000,
        maxRequests: 5
      },
      "/api/auth/playback-token": {
        windowMs: 60 * 60 * 1000,
        maxRequests: 500
      },
      "/api/content/search": {
        windowMs: 60 * 1000,
        maxRequests: 100
      }
    },

    // User tier based limits
    tierLimits: {
      free: {
        windowMs: 60 * 60 * 1000,
        maxRequests: 100
      },
      premium: {
        windowMs: 60 * 60 * 1000,
        maxRequests: 500
      },
      artist: {
        windowMs: 60 * 60 * 1000,
        maxRequests: 1000
      }
    }
  },

  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "script-src": [
        "'self'",
        "'unsafe-inline'", // Required for React
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
      ],
      "style-src": [
        "'self'",
        "'unsafe-inline'", // Required for emotion/styled-components
        "https://fonts.googleapis.com",
      ],
      "img-src": [
        "'self'",
        "data:",
        "https:",
        "https://firebasestorage.googleapis.com",
      ],
      "connect-src": [
        "'self'",
        "https://api.beatflowmedia.com",
        "wss://api.beatflowmedia.com",
        "https://identitytoolkit.googleapis.com",
        "https://firestore.googleapis.com",
      ],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "object-src": ["'none'"],
      "media-src": ["'self'", "https://cdn.beatflowmedia.com"],
      "frame-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"]
    },
    reportOnly: isDevelopment,
    reportUri: "/api/security/csp-report"
  },

  // CORS Configuration
  cors: {
    allowedOrigins: [
      "https://beatflowmedia.com",
      "https://www.beatflowmedia.com",
      "https://admin.beatflowmedia.com",
      "https://artist.beatflowmedia.com",
      ...(isDevelopment
        ? ["http://localhost:3000", "http://localhost:3001"]
        : []),
    ],
    allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-API-Key",
      "X-Device-ID",
      "X-Session-ID",
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 200
  },

  // Security Headers
  headers: {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": [
      "geolocation=()",
      "microphone=()",
      "camera=()",
      "payment=(self)",
      "usb=()",
    ].join(", "),
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0"
  },

  // Encryption Configuration
  encryption: {
    // At-rest encryption
    atRest: {
      algorithm: "AES-256-GCM",
      keyRotation: {
        enabled: true,
        intervalDays: 90,
        retentionPeriod: 365, // Keep old keys for 1 year
      }
    },

    // In-transit encryption
    inTransit: {
      tls: {
        minVersion: "TLSv1.2",
        preferredCiphers: [
          "ECDHE-RSA-AES256-GCM-SHA384",
          "ECDHE-RSA-AES128-GCM-SHA256",
          "ECDHE-RSA-AES256-SHA384",
          "ECDHE-RSA-AES128-SHA256",
        ]
      }
    }
  },

  // Monitoring and Alerting
  monitoring: {
    // Security event logging
    logging: {
      level: isProduction ? "info" : "debug",
      sensitiveDataRedaction: true,
      retention: {
        auditLogs: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
        securityLogs: 90 * 24 * 60 * 60 * 1000, // 90 days
        accessLogs: 30 * 24 * 60 * 60 * 1000, // 30 days
      }
    },

    // Threat detection
    threatDetection: {
      enabled: true,
      rules: {
        bruteForce: {
          enabled: true,
          threshold: 10,
          timeWindow: 5 * 60 * 1000, // 5 minutes
        },
        suspiciousLogin: {
          enabled: true,
          factors: ["location", "device", "time", "vpn"]
        },
        dataExfiltration: {
          enabled: true,
          thresholds: {
            downloads: 100,
            apiCalls: 1000,
            dataVolume: 1024 * 1024 * 1024, // 1GB
          }
        }
      }
    },

    // Alerting
    alerting: {
      channels: ["email", "slack", "webhook"],
      severityLevels: ["low", "medium", "high", "critical"],
      escalation: {
        enabled: true,
        timeouts: {
          low: 60 * 60 * 1000, // 1 hour
          medium: 30 * 60 * 1000, // 30 minutes
          high: 15 * 60 * 1000, // 15 minutes
          critical: 5 * 60 * 1000, // 5 minutes
        }
      }
    }
  },

  // Compliance Configuration
  compliance: {
    // GDPR
    gdpr: {
      enabled: true,
      dataRetention: {
        activeUsers: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
        inactiveUsers: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
        deletedUsers: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
      rightToForgotten: true,
      dataPortability: true,
      consentManagement: true
    },

    // SOC2
    soc2: {
      enabled: isProduction,
      requirements: {
        accessControls: true,
        systemMonitoring: true,
        changeManagement: true,
        riskAssessment: true,
        vendorManagement: true
      }
    },

    // PCI DSS (if handling payments)
    pciDss: {
      enabled: false, // Enable if processing payments directly
      level: 4, // Merchant level
    }
  },

  // Development and Testing
  development: {
    // Security testing
    testing: {
      penetrationTesting: {
        enabled: true,
        frequency: "quarterly",
        scope: ["api", "web", "mobile"]
      },
      vulnerabilityScanning: {
        enabled: true,
        frequency: "weekly",
        automated: true
      }
    },

    // Debug mode settings
    debug: {
      enabled: isDevelopment,
      logSensitiveData: false, // Never log sensitive data even in dev
      bypassRateLimit: isDevelopment,
      allowInsecureConnections: isDevelopment
    }
  },

  // Feature Flags for Security Features
  features: {
    webAuthn: {
      enabled: true,
      requiresHTTPS: true
    },
    biometricAuth: {
      enabled: false, // Future feature
      fallbackToPassword: true
    },
    zeroTrustModel: {
      enabled: isProduction,
      verifyEveryRequest: true
    }
  }
};

// Security utility functions
export const SECURITY_UTILS = {
  /**
   * Generate secure random string
   */
  generateSecureRandom: (length = 32) => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) =>
      ("0" + byte.toString(16)).slice(-2),
    ).join("");
  },

  /**
   * Validate password strength
   */
  validatePasswordStrength: (password) => {
    const { password: policy } = SECURITY_CONFIG.authentication;
    const issues = [];

    if (password.length < policy.minLength) {
      issues.push(`Password must be at least ${policy.minLength} characters`);
    }

    if (password.length > policy.maxLength) {
      issues.push(
        `Password must be no more than ${policy.maxLength} characters`,
      );
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      issues.push("Password must contain at least one uppercase letter");
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      issues.push("Password must contain at least one lowercase letter");
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      issues.push("Password must contain at least one number");
    }

    if (
      policy.requireSpecialChars &&
      !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    ) {
      issues.push("Password must contain at least one special character");
    }

    // Check against banned patterns
    for (const pattern of policy.bannedPatterns) {
      if (pattern.test(password)) {
        issues.push("Password contains common patterns and is not allowed");
        break;
      }
    }

    return {
      isStrong: issues.length === 0,
      score: Math.max(0, 100 - issues.length * 20),
      issues
    };
  },

  /**
   * Generate CSP header string
   */
  generateCSPHeader: () => {
    const directives = SECURITY_CONFIG.contentSecurityPolicy.directives;
    return Object.entries(directives)
      .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
      .join("; ");
  },

  /**
   * Check if origin is allowed
   */
  isOriginAllowed: (origin) => {
    return SECURITY_CONFIG.cors.allowedOrigins.includes(origin);
  },

  /**
   * Get rate limit for endpoint
   */
  getRateLimitForEndpoint: (endpoint, userTier = "free") => {
    const endpointLimit = SECURITY_CONFIG.rateLimiting.endpoints[endpoint];
    const tierLimit = SECURITY_CONFIG.rateLimiting.tierLimits[userTier];
    const globalLimit = SECURITY_CONFIG.rateLimiting.global;

    return endpointLimit || tierLimit || globalLimit;
  }
};

// Export default configuration
export default SECURITY_CONFIG;
