/**
 * Security Middleware
 *
 * Comprehensive security middleware for Netlify Functions providing:
 * - Request authentication and authorization
 * - Rate limiting and DDoS protection
 * - CORS and CSP policy enforcement
 * - Security headers and HTTPS enforcement
 * - Request validation and sanitization
 * - Audit logging and monitoring
 */

const admin = require('firebase-admin');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Security configuration
const SECURITY_CONFIG = {
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  cors: {
    allowedOrigins: [
      'https://beatflowmediagroup.com',
      'https://www.beatflowmediagroup.com',
      'https://admin.beatflowmediagroup.com'
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
    credentials: true,
    maxAge: 86400 // 24 hours
  },
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", 'https://api.beatflowmediagroup.com'],
      'font-src': ["'self'"],
      'object-src': ["'none'"],
      'media-src': ["'self'"],
      'frame-src': ["'none'"]
    }
  },
  headers: {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache'
  }
};

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map();

// Blocked IPs and suspicious patterns
const securityBlacklist = {
  ips: new Set(),
  userAgents: new Set(),
  patterns: [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ]
};

/**
 * Main security middleware wrapper
 */
const securityMiddleware = (options = {}) => {
  return async (handler) => {
    return async (event, context) => {
      const startTime = Date.now();
      let securityContext = {
        requestId: crypto.randomUUID(),
        ip: getClientIP(event),
        userAgent: event.headers['user-agent'] || '',
        timestamp: new Date().toISOString(),
        path: event.path,
        method: event.httpMethod
      };

      try {
        // Step 1: Basic security checks
        const basicSecurityCheck = await performBasicSecurityChecks(event, securityContext);
        if (!basicSecurityCheck.passed) {
          return createSecurityResponse(basicSecurityCheck.statusCode, basicSecurityCheck.message);
        }

        // Step 2: HTTPS enforcement
        if (options.enforceHttps !== false) {
          const httpsCheck = enforceHttps(event);
          if (!httpsCheck.passed) {
            return createSecurityResponse(426, 'HTTPS required');
          }
        }

        // Step 3: CORS handling
        const corsHeaders = handleCORS(event);
        if (event.httpMethod === 'OPTIONS') {
          return {
            statusCode: 200,
            headers: { ...corsHeaders, ...SECURITY_CONFIG.headers },
            body: ''
          };
        }

        // Step 4: Rate limiting
        if (options.rateLimit !== false) {
          const rateLimitCheck = await checkRateLimit(securityContext);
          if (!rateLimitCheck.allowed) {
            await logSecurityEvent('RATE_LIMIT_EXCEEDED', securityContext, {
              limit: rateLimitCheck.limit,
              current: rateLimitCheck.current
            });
            return createRateLimitResponse(corsHeaders, rateLimitCheck.retryAfter);
          }
        }

        // Step 5: Authentication validation
        if (options.requireAuth !== false) {
          const authCheck = await validateAuthentication(event);
          if (!authCheck.valid) {
            await logSecurityEvent('AUTH_FAILURE', securityContext, {
              reason: authCheck.reason
            });
            return createSecurityResponse(401, 'Authentication required', corsHeaders);
          }
          securityContext.userId = authCheck.userId;
          securityContext.userRole = authCheck.role;
        }

        // Step 6: Authorization check
        if (options.requiredPermissions) {
          const authzCheck = await validateAuthorization(securityContext, options.requiredPermissions);
          if (!authzCheck.authorized) {
            await logSecurityEvent('AUTHZ_FAILURE', securityContext, {
              requiredPermissions: options.requiredPermissions,
              userPermissions: authzCheck.userPermissions
            });
            return createSecurityResponse(403, 'Insufficient permissions', corsHeaders);
          }
        }

        // Step 7: Request validation and sanitization
        if (options.validateRequest !== false) {
          const validationResult = await validateAndSanitizeRequest(event, options.schema);
          if (!validationResult.valid) {
            await logSecurityEvent('REQUEST_VALIDATION_FAILED', securityContext, {
              errors: validationResult.errors
            });
            return createSecurityResponse(400, 'Invalid request format', corsHeaders);
          }
          event.validatedBody = validationResult.sanitizedData;
        }

        // Step 8: Execute the handler
        const response = await handler(event, context);

        // Step 9: Post-process response
        const finalResponse = await postProcessResponse(response, corsHeaders, securityContext);

        // Step 10: Log successful request
        const processingTime = Date.now() - startTime;
        await logSecurityEvent('REQUEST_SUCCESS', securityContext, {
          processingTime,
          statusCode: finalResponse.statusCode
        });

        return finalResponse;

      } catch (error) {
        console.error('Security middleware error:', error);
        await logSecurityEvent('MIDDLEWARE_ERROR', securityContext, {
          error: error.message,
          stack: error.stack
        });
        return createSecurityResponse(500, 'Internal server error');
      }
    };
  };
};

/**
 * Perform basic security checks
 */
async function performBasicSecurityChecks(event, securityContext) {
  // Check if IP is blacklisted
  if (securityBlacklist.ips.has(securityContext.ip)) {
    return { passed: false, statusCode: 403, message: 'Access denied' };
  }

  // Check user agent patterns
  for (const pattern of securityBlacklist.patterns) {
    if (pattern.test(securityContext.userAgent)) {
      await addToBlacklist('userAgent', securityContext.userAgent);
      return { passed: false, statusCode: 403, message: 'Access denied' };
    }
  }

  // Check request size
  const contentLength = parseInt(event.headers['content-length'] || '0');
  if (contentLength > 10 * 1024 * 1024) { // 10MB limit
    return { passed: false, statusCode: 413, message: 'Request too large' };
  }

  // Check for common attack patterns in headers
  const suspiciousHeaders = ['x-forwarded-host', 'x-original-host', 'x-rewrite-url'];
  for (const header of suspiciousHeaders) {
    if (event.headers[header]) {
      await logSecurityEvent('SUSPICIOUS_HEADER', securityContext, { header, value: event.headers[header] });
    }
  }

  return { passed: true };
}

/**
 * Enforce HTTPS
 */
function enforceHttps(event) {
  const forwarded = event.headers['x-forwarded-proto'];
  const isHttps = forwarded === 'https' || event.headers.host?.includes('localhost');

  return { passed: isHttps };
}

/**
 * Handle CORS
 */
function handleCORS(event) {
  const origin = event.headers.origin || event.headers.Origin;
  const allowedOrigin = SECURITY_CONFIG.cors.allowedOrigins.includes(origin) ? origin : 'null';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': SECURITY_CONFIG.cors.allowedMethods.join(', '),
    'Access-Control-Allow-Headers': SECURITY_CONFIG.cors.allowedHeaders.join(', '),
    'Access-Control-Allow-Credentials': SECURITY_CONFIG.cors.credentials.toString(),
    'Access-Control-Max-Age': SECURITY_CONFIG.cors.maxAge.toString(),
    'Vary': 'Origin'
  };
}

/**
 * Rate limiting implementation
 */
async function checkRateLimit(securityContext) {
  const key = `${securityContext.ip}:${securityContext.path}`;
  const now = Date.now();
  const windowStart = now - SECURITY_CONFIG.rateLimiting.windowMs;

  // Get existing requests for this key
  let requests = rateLimitStore.get(key) || [];

  // Remove old requests outside the window
  requests = requests.filter(timestamp => timestamp > windowStart);

  // Check if limit exceeded
  if (requests.length >= SECURITY_CONFIG.rateLimiting.maxRequests) {
    const oldestRequest = Math.min(...requests);
    const retryAfter = Math.ceil((oldestRequest + SECURITY_CONFIG.rateLimiting.windowMs - now) / 1000);

    return {
      allowed: false,
      limit: SECURITY_CONFIG.rateLimiting.maxRequests,
      current: requests.length,
      retryAfter
    };
  }

  // Add current request
  requests.push(now);
  rateLimitStore.set(key, requests);

  // Clean up old entries periodically
  if (Math.random() < 0.01) { // 1% chance to clean up
    cleanupRateLimitStore();
  }

  return {
    allowed: true,
    limit: SECURITY_CONFIG.rateLimiting.maxRequests,
    current: requests.length
  };
}

/**
 * Validate authentication
 */
async function validateAuthentication(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, reason: 'Missing or invalid authorization header' };
  }

  const token = authHeader.substring(7);

  try {
    // Validate Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Get user profile for additional context
    const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    // Check if user is suspended or banned
    if (userData.status === 'suspended' || userData.status === 'banned') {
      return { valid: false, reason: 'User account suspended' };
    }

    return {
      valid: true,
      userId: decodedToken.uid,
      email: decodedToken.email,
      role: userData.role || 'user',
      permissions: userData.permissions || [],
      subscription: userData.subscription || {}
    };

  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, reason: 'Invalid token' };
  }
}

/**
 * Validate authorization
 */
async function validateAuthorization(securityContext, requiredPermissions) {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return { authorized: true };
  }

  // Get user permissions from database
  const userDoc = await admin.firestore().collection('users').doc(securityContext.userId).get();
  const userData = userDoc.exists ? userDoc.data() : {};
  const userPermissions = userData.permissions || [];
  const userRole = userData.role || 'user';

  // Admin users have all permissions
  if (userRole === 'admin') {
    return { authorized: true, userPermissions: ['*'] };
  }

  // Check if user has all required permissions
  const hasAllPermissions = requiredPermissions.every(permission =>
    userPermissions.includes(permission)
  );

  return {
    authorized: hasAllPermissions,
    userPermissions,
    missingPermissions: requiredPermissions.filter(p => !userPermissions.includes(p))
  };
}

/**
 * Validate and sanitize request
 */
async function validateAndSanitizeRequest(event, schema) {
  if (!event.body) {
    return { valid: true, sanitizedData: {} };
  }

  try {
    let data;
    try {
      data = JSON.parse(event.body);
    } catch (e) {
      return { valid: false, errors: ['Invalid JSON format'] };
    }

    // Basic sanitization
    const sanitizedData = sanitizeObject(data);

    // Schema validation would go here if schema is provided
    if (schema) {
      // Placeholder for schema validation
      // Could integrate with Joi, Yup, or similar library
    }

    return { valid: true, sanitizedData };

  } catch (error) {
    console.error('Request validation error:', error);
    return { valid: false, errors: ['Request validation failed'] };
  }
}

/**
 * Post-process response with security headers
 */
async function postProcessResponse(response, corsHeaders, securityContext) {
  if (!response.headers) {
    response.headers = {};
  }

  // Add security headers
  Object.assign(response.headers, SECURITY_CONFIG.headers);

  // Add CORS headers
  Object.assign(response.headers, corsHeaders);

  // Add CSP header
  const cspHeader = Object.entries(SECURITY_CONFIG.contentSecurityPolicy.directives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
  response.headers['Content-Security-Policy'] = cspHeader;

  // Add request ID for tracking
  response.headers['X-Request-ID'] = securityContext.requestId;

  // Ensure response is not cached for sensitive endpoints
  if (securityContext.path.includes('/api/auth/') || securityContext.path.includes('/api/admin/')) {
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private';
  }

  return response;
}

/**
 * Log security events
 */
async function logSecurityEvent(eventType, securityContext, additionalData = {}) {
  const logEntry = {
    eventType,
    requestId: securityContext.requestId,
    timestamp: securityContext.timestamp,
    ip: securityContext.ip,
    userAgent: securityContext.userAgent,
    path: securityContext.path,
    method: securityContext.method,
    userId: securityContext.userId,
    ...additionalData,
    severity: getSeverityLevel(eventType)
  };

  try {
    // Store in Firestore audit log
    await admin.firestore().collection('securityAuditLog').add(logEntry);

    // For critical events, also log to external monitoring
    if (logEntry.severity === 'critical' || logEntry.severity === 'high') {
      console.error('Security Event:', JSON.stringify(logEntry, null, 2));

      // Could integrate with external services like DataDog, NewRelic, etc.
      await notifySecurityTeam(logEntry);
    }

  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Utility functions
 */
function getClientIP(event) {
  return event.headers['x-forwarded-for'] ||
         event.headers['x-real-ip'] ||
         event.requestContext?.identity?.sourceIp ||
         'unknown';
}

function createSecurityResponse(statusCode, message, additionalHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...SECURITY_CONFIG.headers,
      ...additionalHeaders
    },
    body: JSON.stringify({
      error: message,
      timestamp: new Date().toISOString()
    })
  };
}

function createRateLimitResponse(corsHeaders, retryAfter) {
  return {
    statusCode: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': retryAfter.toString(),
      ...SECURITY_CONFIG.headers,
      ...corsHeaders
    },
    body: JSON.stringify({
      error: 'Rate limit exceeded',
      retryAfter,
      timestamp: new Date().toISOString()
    })
  };
}

function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Remove potentially dangerous keys
    if (['__proto__', 'constructor', 'prototype'].includes(key)) {
      continue;
    }

    // Sanitize string values
    if (typeof value === 'string') {
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocols
        .trim();
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function getSeverityLevel(eventType) {
  const severityMap = {
    'REQUEST_SUCCESS': 'info',
    'AUTH_FAILURE': 'medium',
    'AUTHZ_FAILURE': 'medium',
    'RATE_LIMIT_EXCEEDED': 'medium',
    'REQUEST_VALIDATION_FAILED': 'low',
    'SUSPICIOUS_HEADER': 'medium',
    'MIDDLEWARE_ERROR': 'high',
    'BLACKLIST_ADD': 'high'
  };

  return severityMap[eventType] || 'low';
}

async function addToBlacklist(type, value) {
  if (type === 'ip') {
    securityBlacklist.ips.add(value);
  } else if (type === 'userAgent') {
    securityBlacklist.userAgents.add(value);
  }

  // Store in database for persistence
  await admin.firestore().collection('securityBlacklist').add({
    type,
    value,
    addedAt: new Date().toISOString(),
    reason: 'Automated detection'
  });

  await logSecurityEvent('BLACKLIST_ADD', { ip: 'system' }, { type, value });
}

function cleanupRateLimitStore() {
  const now = Date.now();
  const cutoff = now - SECURITY_CONFIG.rateLimiting.windowMs;

  for (const [key, requests] of rateLimitStore.entries()) {
    const validRequests = requests.filter(timestamp => timestamp > cutoff);
    if (validRequests.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, validRequests);
    }
  }
}

async function notifySecurityTeam(logEntry) {
  // Placeholder for security team notification
  // Could integrate with Slack, PagerDuty, email, etc.
  console.warn('Security team notification:', logEntry.eventType);
}

// Export security middleware and utilities
module.exports = {
  securityMiddleware,
  SECURITY_CONFIG,
  validateAuthentication,
  validateAuthorization,
  logSecurityEvent,
  getClientIP,
  addToBlacklist
};