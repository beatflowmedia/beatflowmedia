/**
 * Security Middleware
 *
 * Comprehensive security middleware for BeatflowMedia that implements:
 * - Request authentication and authorization
 * - Rate limiting and DDoS protection
 * - CORS and CSP policy enforcement
 * - Security headers and HTTPS enforcement
 * - Request validation and sanitization
 * - Audit logging and monitoring
 */

import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import { authService } from "../services/authService";
import { entitlementService } from "../services/entitlementService";

// Rate limiting configurations
const RATE_LIMIT_CONFIGS = {
  // General API rate limiting
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: "Too many requests from this IP, please try again later.",
      retryAfter: "15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise use IP
      return req.user?.uid || req.ip;
    }
  },

  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit to 20 auth attempts per 15 minutes
    message: {
      error: "Too many authentication attempts, please try again later.",
      retryAfter: "15 minutes"
    },
    skipSuccessfulRequests: true
  },

  // Playback token generation
  playback: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 500, // 500 token requests per hour
    message: {
      error: "Token generation rate limit exceeded.",
      retryAfter: "1 hour"
    }
  },

  // Content streaming
  streaming: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute for streaming
    message: {
      error: "Streaming rate limit exceeded.",
      retryAfter: "1 minute"
    }
  },

  // Content upload
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: {
      error: "Upload rate limit exceeded.",
      retryAfter: "1 hour"
    }
  }
};

// CORS configuration
const CORS_CONFIG = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "https://beatflowmedia.com",
      "https://www.beatflowmedia.com",
      "https://app.beatflowmedia.com",
      "https://admin.beatflowmedia.com",
    ];

    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    // Development environment
    if (process.env.NODE_ENV === "development") {
      allowedOrigins.push("http://localhost:3000", "http://127.0.0.1:3000");
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-API-Key",
    "X-Client-Version",
    "X-Device-ID",
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Content Security Policy
const CSP_CONFIG = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for some React functionality
      "https://apis.google.com",
      "https://www.gstatic.com",
      "https://connect.facebook.net",
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for Material-UI
      "https://fonts.googleapis.com",
    ],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: [
      "'self'",
      "data:",
      "https:",
      "https://firebasestorage.googleapis.com",
      "https://lh3.googleusercontent.com",
    ],
    mediaSrc: [
      "'self'",
      "https://firebasestorage.googleapis.com",
      "blob:",
      "data:",
    ],
    connectSrc: [
      "'self'",
      "https://identitytoolkit.googleapis.com",
      "https://firestore.googleapis.com",
      "https://api.stripe.com",
    ],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: []
  }
};

/**
 * Security Middleware Class
 */
export class SecurityMiddleware {
  constructor() {
    this.rateLimiters = this.initializeRateLimiters();
    this.auditLogger = this.initializeAuditLogger();
  }

  /**
   * Initialize rate limiters
   */
  initializeRateLimiters() {
    const limiters = {};

    Object.entries(RATE_LIMIT_CONFIGS).forEach(([key, config]) => {
      limiters[key] = rateLimit({
        ...config,
        handler: (req, res) => {
          this.logSecurityEvent(req, "RATE_LIMIT_EXCEEDED", {
            limitType: key,
            ip: req.ip,
            userAgent: req.get("User-Agent"),
            endpoint: req.path
          });

          res.status(429).json(config.message);
        }
      });
    });

    return limiters;
  }

  /**
   * Initialize audit logger
   */
  initializeAuditLogger() {
    return {
      logRequest: (req, res, next) => {
        // Log significant requests
        const significantEndpoints = [
          "/api/auth",
          "/api/stream",
          "/api/upload",
        ];

        if (
          significantEndpoints.some((endpoint) => req.path.startsWith(endpoint))
        ) {
          this.logSecurityEvent(req, "API_REQUEST", {
            method: req.method,
            path: req.path,
            userAgent: req.get("User-Agent"),
            referer: req.get("Referer"),
            contentLength: req.get("Content-Length")
          });
        }

        next();
      }
    };
  }

  /**
   * Core security middleware
   */
  securityHeaders() {
    return helmet({
      contentSecurityPolicy: CSP_CONFIG,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      frameguard: { action: "deny" },
      xssFilter: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" }
    });
  }

  /**
   * CORS middleware
   */
  corsMiddleware() {
    return cors(CORS_CONFIG);
  }

  /**
   * Authentication middleware
   */
  authenticate(required = true) {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          if (required) {
            this.logSecurityEvent(req, "AUTH_MISSING", {
              endpoint: req.path,
              method: req.method
            });
            return res.status(401).json({ error: "Authentication required" });
          }
          return next();
        }

        const token = authHeader.substring(7);

        // Verify Firebase ID token
        const user = await authService.auth.verifyIdToken(token);

        if (!user) {
          this.logSecurityEvent(req, "AUTH_INVALID", {
            endpoint: req.path,
            method: req.method
          });
          return res
            .status(401)
            .json({ error: "Invalid authentication token" });
        }

        // Get user profile
        const userProfile = await authService.getUserProfile(user.uid);

        if (!userProfile) {
          this.logSecurityEvent(req, "USER_NOT_FOUND", {
            userId: user.uid,
            endpoint: req.path
          });
          return res.status(401).json({ error: "User profile not found" });
        }

        // Attach user info to request
        req.user = user;
        req.userProfile = userProfile;

        // Log successful authentication
        this.logSecurityEvent(req, "AUTH_SUCCESS", {
          userId: user.uid,
          endpoint: req.path
        });

        next();
      } catch (error) {
        console.error("Authentication error:", error);

        this.logSecurityEvent(req, "AUTH_ERROR", {
          error: error.message,
          endpoint: req.path
        });

        res.status(401).json({ error: "Authentication failed" });
      }
    };
  }

  /**
   * Authorization middleware
   */
  authorize(requiredPermissions = [], options = {}) {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.userProfile) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const { allowOwner = false, resourceIdParam = null } = options;

        // Check if user is owner of resource
        if (allowOwner && resourceIdParam) {
          const resourceId = req.params[resourceIdParam];
          if (resourceId === req.user.uid) {
            return next();
          }
        }

        // Check required permissions
        if (requiredPermissions.length > 0) {
          const userPermissions = req.userProfile.permissions || [];
          const hasPermission = requiredPermissions.every((permission) =>
            userPermissions.includes(permission),
          );

          if (!hasPermission) {
            this.logSecurityEvent(req, "AUTHORIZATION_DENIED", {
              userId: req.user.uid,
              requiredPermissions,
              userPermissions,
              endpoint: req.path
            });

            return res.status(403).json({
              error: "Insufficient permissions",
              required: requiredPermissions
            });
          }
        }

        // Log successful authorization
        this.logSecurityEvent(req, "AUTHORIZATION_SUCCESS", {
          userId: req.user.uid,
          permissions: requiredPermissions,
          endpoint: req.path
        });

        next();
      } catch (error) {
        console.error("Authorization error:", error);

        this.logSecurityEvent(req, "AUTHORIZATION_ERROR", {
          error: error.message,
          endpoint: req.path
        });

        res.status(500).json({ error: "Authorization check failed" });
      }
    };
  }

  /**
   * Content access validation middleware
   */
  validateContentAccess(accessType = "stream") {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.userProfile) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const contentId = req.params.contentId || req.body.contentId;

        if (!contentId) {
          return res.status(400).json({ error: "Content ID required" });
        }

        // Validate content access with entitlement service
        const accessCheck = await entitlementService.validateContentAccess(
          req.user.uid,
          contentId,
          accessType,
        );

        if (!accessCheck.allowed) {
          this.logSecurityEvent(req, "CONTENT_ACCESS_DENIED", {
            userId: req.user.uid,
            contentId,
            accessType,
            reason: accessCheck.reason
          });

          return res.status(403).json({
            error: "Content access denied",
            reason: accessCheck.reason
          });
        }

        // Attach access info to request
        req.contentAccess = accessCheck;

        next();
      } catch (error) {
        console.error("Content access validation error:", error);
        res.status(500).json({ error: "Access validation failed" });
      }
    };
  }

  /**
   * Input validation and sanitization
   */
  validateInput(schema) {
    return (req, res, next) => {
      try {
        // Basic input validation (extend with joi or similar for production)
        const validation = this.validateRequestData(req.body, schema);

        if (!validation.valid) {
          this.logSecurityEvent(req, "INPUT_VALIDATION_FAILED", {
            errors: validation.errors,
            endpoint: req.path
          });

          return res.status(400).json({
            error: "Input validation failed",
            details: validation.errors
          });
        }

        // Sanitize input
        req.body = validation.sanitizedData;
        next();
      } catch (error) {
        console.error("Input validation error:", error);
        res.status(500).json({ error: "Validation error" });
      }
    };
  }

  /**
   * Request size limiting
   */
  limitRequestSize(maxSize = "10mb") {
    return (req, res, next) => {
      const contentLength = parseInt(req.get("Content-Length") || "0");
      const maxSizeBytes = this.parseSize(maxSize);

      if (contentLength > maxSizeBytes) {
        this.logSecurityEvent(req, "REQUEST_SIZE_EXCEEDED", {
          contentLength,
          maxSize: maxSizeBytes,
          endpoint: req.path
        });

        return res.status(413).json({
          error: "Request entity too large",
          maxSize
        });
      }

      next();
    };
  }

  /**
   * IP whitelist/blacklist middleware
   */
  ipFilter(options = {}) {
    const { whitelist = [], blacklist = [] } = options;

    return (req, res, next) => {
      const clientIP = this.getClientIP(req);

      // Check blacklist first
      if (blacklist.includes(clientIP)) {
        this.logSecurityEvent(req, "IP_BLACKLISTED", {
          ip: clientIP,
          endpoint: req.path
        });

        return res.status(403).json({ error: "Access denied" });
      }

      // Check whitelist if provided
      if (whitelist.length > 0 && !whitelist.includes(clientIP)) {
        this.logSecurityEvent(req, "IP_NOT_WHITELISTED", {
          ip: clientIP,
          endpoint: req.path
        });

        return res.status(403).json({ error: "Access denied" });
      }

      next();
    };
  }

  /**
   * Device trust verification
   */
  verifyDeviceTrust() {
    return async (req, res, next) => {
      try {
        const deviceId = req.headers["x-device-id"];

        if (!deviceId) {
          return res.status(400).json({ error: "Device ID required" });
        }

        if (req.userProfile) {
          const device = req.userProfile.devices?.find(
            (d) => d.id === deviceId,
          );

          if (!device) {
            this.logSecurityEvent(req, "UNKNOWN_DEVICE", {
              userId: req.user?.uid,
              deviceId,
              endpoint: req.path
            });

            return res.status(403).json({ error: "Device not recognized" });
          }

          req.device = device;
        }

        next();
      } catch (error) {
        console.error("Device verification error:", error);
        res.status(500).json({ error: "Device verification failed" });
      }
    };
  }

  /**
   * Get rate limiter by type
   */
  getRateLimiter(type = "general") {
    return this.rateLimiters[type] || this.rateLimiters.general;
  }

  /**
   * Log security events
   */
  async logSecurityEvent(req, eventType, data = {}) {
    try {
      const event = {
        type: eventType,
        timestamp: new Date().toISOString(),
        ip: this.getClientIP(req),
        userAgent: req.get("User-Agent"),
        method: req.method,
        path: req.path,
        userId: req.user?.uid,
        sessionId: req.sessionId,
        ...data
      };

      // In production, this would go to a proper logging service
      console.log("Security Event:", JSON.stringify(event));

      // Store in database for audit trail
      if (process.env.NODE_ENV === "production") {
        // await this.storeAuditLog(event);
      }
    } catch (error) {
      console.error("Failed to log security event:", error);
    }
  }

  /**
   * Utility methods
   */
  getClientIP(req) {
    return (
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip
    );
  }

  parseSize(size) {
    const units = {
      b: 1,
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024
    };

    const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)$/);
    if (!match) return 0;

    return parseInt(match[1]) * units[match[2]];
  }

  validateRequestData(data, schema) {
    // Basic validation - extend with proper schema validation library
    const errors = [];
    const sanitizedData = { ...data };

    // Remove any null bytes and trim strings
    Object.keys(sanitizedData).forEach((key) => {
      if (typeof sanitizedData[key] === "string") {
        sanitizedData[key] = sanitizedData[key].replace(/\0/g, "").trim();
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      sanitizedData
    };
  }
}

// Export singleton instance
export const securityMiddleware = new SecurityMiddleware();
export default securityMiddleware;
