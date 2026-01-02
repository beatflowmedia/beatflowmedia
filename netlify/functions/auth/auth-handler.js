/**
 * Authentication API Handler
 *
 * Secure API endpoints for authentication, authorization, and token management
 * Implements enterprise-grade security with comprehensive audit logging
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

const db = admin.firestore();

// JWT Configuration
const JWT_CONFIG = {
  PLAYBACK_SECRET: process.env.JWT_PLAYBACK_SECRET || crypto.randomBytes(32).toString('hex'),
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || crypto.randomBytes(32).toString('hex'),
  ISSUER: 'beatflow-auth',
  AUDIENCE_PLAYBACK: 'beatflow-streaming',
  AUDIENCE_API: 'beatflow-api',
  PLAYBACK_TTL: 120, // 2 minutes
  REFRESH_TTL: 30 * 24 * 60 * 60, // 30 days
  ALGORITHM: 'HS256'
};

// Rate limiting configuration
const RATE_LIMITS = {
  PLAYBACK_TOKEN: { requests: 100, window: 3600 }, // 100 per hour
  AUTH_ENDPOINT: { requests: 20, window: 900 }, // 20 per 15 minutes
  REFRESH_TOKEN: { requests: 50, window: 3600 } // 50 per hour
};

// Security headers
const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'",
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache'
};

/**
 * Main handler function
 */
exports.handler = async (event, context) => {
  // Set security headers
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://beatflowmediagroup.com',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    ...SECURITY_HEADERS
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const path = event.path.replace('/api/auth', '');
    const method = event.httpMethod;

    // Route requests
    switch (`${method} ${path}`) {
      case 'POST /playback-token':
        return await handlePlaybackToken(event, headers);

      case 'POST /refresh-playback-token':
        return await handleRefreshPlaybackToken(event, headers);

      case 'POST /verify-token':
        return await handleVerifyToken(event, headers);

      case 'POST /revoke-token':
        return await handleRevokeToken(event, headers);

      case 'GET /user-profile':
        return await handleGetUserProfile(event, headers);

      case 'PUT /user-profile':
        return await handleUpdateUserProfile(event, headers);

      case 'POST /register-device':
        return await handleRegisterDevice(event, headers);

      case 'GET /devices':
        return await handleGetDevices(event, headers);

      case 'DELETE /devices/:deviceId':
        return await handleRemoveDevice(event, headers);

      case 'POST /mfa/setup':
        return await handleMFASetup(event, headers);

      case 'POST /mfa/verify':
        return await handleMFAVerify(event, headers);

      case 'GET /audit-log':
        return await handleGetAuditLog(event, headers);

      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Endpoint not found' })
        };
    }

  } catch (error) {
    console.error('Auth handler error:', error);

    await logSecurityEvent({
      type: 'API_ERROR',
      error: error.message,
      path: event.path,
      method: event.httpMethod,
      userAgent: event.headers['user-agent'],
      ip: getClientIP(event),
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        requestId: context.awsRequestId
      })
    };
  }
};

/**
 * Generate JWT playback token
 */
async function handlePlaybackToken(event, headers) {
  try {
    const { authorization } = event.headers;
    const body = JSON.parse(event.body || '{}');

    // Validate Firebase ID token
    const user = await validateFirebaseToken(authorization);
    if (!user) {
      return unauthorizedResponse(headers);
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(user.uid, 'PLAYBACK_TOKEN');
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(headers, rateLimitResult.retryAfter);
    }

    // Validate request
    const validation = validatePlaybackTokenRequest(body);
    if (!validation.valid) {
      return badRequestResponse(headers, validation.error);
    }

    // Get user profile and validate entitlements
    const userProfile = await getUserProfile(user.uid);
    const entitlementCheck = await validateEntitlements(userProfile, body);

    if (!entitlementCheck.allowed) {
      return forbiddenResponse(headers, entitlementCheck.reason);
    }

    // Generate playback token
    const tokenPayload = {
      sub: user.uid,
      aud: JWT_CONFIG.AUDIENCE_PLAYBACK,
      iss: JWT_CONFIG.ISSUER,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + JWT_CONFIG.PLAYBACK_TTL,
      contentId: body.contentId,
      contentType: body.contentType,
      permissions: entitlementCheck.permissions,
      quality: entitlementCheck.quality,
      territoryRestrictions: body.territoryRestrictions || [],
      deviceId: body.deviceId,
      sessionId: generateSessionId(),
      jti: generateTokenId()
    };

    const token = jwt.sign(tokenPayload, JWT_CONFIG.PLAYBACK_SECRET, {
      algorithm: JWT_CONFIG.ALGORITHM
    });

    // Store token for blacklist management
    await storeActiveToken(tokenPayload.jti, user.uid, 'playback', tokenPayload.exp);

    // Log successful token generation
    await logSecurityEvent({
      type: 'PLAYBACK_TOKEN_GENERATED',
      userId: user.uid,
      contentId: body.contentId,
      deviceId: body.deviceId,
      ip: getClientIP(event),
      userAgent: event.headers['user-agent'],
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        token,
        expiresAt: new Date((tokenPayload.exp) * 1000).toISOString(),
        permissions: entitlementCheck.permissions,
        quality: entitlementCheck.quality
      })
    };

  } catch (error) {
    console.error('Playback token generation error:', error);
    return internalErrorResponse(headers);
  }
}

/**
 * Refresh playback token
 */
async function handleRefreshPlaybackToken(event, headers) {
  try {
    const { authorization } = event.headers;
    const { token: currentToken } = JSON.parse(event.body || '{}');

    // Validate Firebase ID token
    const user = await validateFirebaseToken(authorization);
    if (!user) {
      return unauthorizedResponse(headers);
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(user.uid, 'REFRESH_TOKEN');
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(headers, rateLimitResult.retryAfter);
    }

    // Verify current token
    let decoded;
    try {
      decoded = jwt.verify(currentToken, JWT_CONFIG.PLAYBACK_SECRET);
    } catch (error) {
      return badRequestResponse(headers, 'Invalid token');
    }

    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(decoded.jti);
    if (isBlacklisted) {
      return forbiddenResponse(headers, 'Token revoked');
    }

    // Validate that token belongs to user
    if (decoded.sub !== user.uid) {
      return forbiddenResponse(headers, 'Token mismatch');
    }

    // Check if token is within refresh window (last 30 seconds)
    const timeToExpiry = decoded.exp - Math.floor(Date.now() / 1000);
    if (timeToExpiry > 30) {
      return badRequestResponse(headers, 'Token not eligible for refresh');
    }

    // Generate new token with same permissions
    const newTokenPayload = {
      ...decoded,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + JWT_CONFIG.PLAYBACK_TTL,
      jti: generateTokenId()
    };

    const newToken = jwt.sign(newTokenPayload, JWT_CONFIG.PLAYBACK_SECRET, {
      algorithm: JWT_CONFIG.ALGORITHM
    });

    // Blacklist old token
    await blacklistToken(decoded.jti);

    // Store new token
    await storeActiveToken(newTokenPayload.jti, user.uid, 'playback', newTokenPayload.exp);

    // Log token refresh
    await logSecurityEvent({
      type: 'PLAYBACK_TOKEN_REFRESHED',
      userId: user.uid,
      oldTokenId: decoded.jti,
      newTokenId: newTokenPayload.jti,
      ip: getClientIP(event),
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        token: newToken,
        expiresAt: new Date(newTokenPayload.exp * 1000).toISOString()
      })
    };

  } catch (error) {
    console.error('Token refresh error:', error);
    return internalErrorResponse(headers);
  }
}

/**
 * Verify token validity
 */
async function handleVerifyToken(event, headers) {
  try {
    const { token } = JSON.parse(event.body || '{}');

    if (!token) {
      return badRequestResponse(headers, 'Token required');
    }

    try {
      const decoded = jwt.verify(token, JWT_CONFIG.PLAYBACK_SECRET);

      // Check if token is blacklisted
      const isBlacklisted = await isTokenBlacklisted(decoded.jti);
      if (isBlacklisted) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            valid: false,
            reason: 'Token revoked'
          })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          valid: true,
          payload: decoded
        })
      };

    } catch (error) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          valid: false,
          reason: error.message
        })
      };
    }

  } catch (error) {
    console.error('Token verification error:', error);
    return internalErrorResponse(headers);
  }
}

/**
 * Revoke token
 */
async function handleRevokeToken(event, headers) {
  try {
    const { authorization } = event.headers;
    const { token, tokenId } = JSON.parse(event.body || '{}');

    // Validate Firebase ID token
    const user = await validateFirebaseToken(authorization);
    if (!user) {
      return unauthorizedResponse(headers);
    }

    let jti;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_CONFIG.PLAYBACK_SECRET);
        jti = decoded.jti;

        // Verify token belongs to user
        if (decoded.sub !== user.uid) {
          return forbiddenResponse(headers, 'Unauthorized token revocation');
        }
      } catch (error) {
        return badRequestResponse(headers, 'Invalid token');
      }
    } else if (tokenId) {
      jti = tokenId;
    } else {
      return badRequestResponse(headers, 'Token or tokenId required');
    }

    // Blacklist token
    await blacklistToken(jti);

    // Log token revocation
    await logSecurityEvent({
      type: 'TOKEN_REVOKED',
      userId: user.uid,
      tokenId: jti,
      ip: getClientIP(event),
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Token revocation error:', error);
    return internalErrorResponse(headers);
  }
}

/**
 * Get user profile with security context
 */
async function handleGetUserProfile(event, headers) {
  try {
    const { authorization } = event.headers;

    // Validate Firebase ID token
    const user = await validateFirebaseToken(authorization);
    if (!user) {
      return unauthorizedResponse(headers);
    }

    const userProfile = await getUserProfile(user.uid);
    if (!userProfile) {
      return notFoundResponse(headers, 'User profile not found');
    }

    // Remove sensitive information
    const sanitizedProfile = {
      uid: userProfile.uid,
      email: userProfile.email,
      displayName: userProfile.displayName,
      photoURL: userProfile.photoURL,
      emailVerified: userProfile.emailVerified,
      role: userProfile.role,
      subscription: userProfile.subscription,
      preferences: userProfile.preferences,
      usage: userProfile.usage,
      devices: userProfile.devices?.map(device => ({
        id: device.id,
        name: device.name,
        type: device.type,
        trusted: device.trusted,
        lastAccess: device.lastAccess
      }))
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(sanitizedProfile)
    };

  } catch (error) {
    console.error('Get user profile error:', error);
    return internalErrorResponse(headers);
  }
}

/**
 * Update user profile
 */
async function handleUpdateUserProfile(event, headers) {
  try {
    const { authorization } = event.headers;
    const updates = JSON.parse(event.body || '{}');

    // Validate Firebase ID token
    const user = await validateFirebaseToken(authorization);
    if (!user) {
      return unauthorizedResponse(headers);
    }

    // Validate updates
    const validation = validateProfileUpdates(updates);
    if (!validation.valid) {
      return badRequestResponse(headers, validation.error);
    }

    // Update user profile
    await updateUserProfile(user.uid, validation.sanitizedUpdates);

    // Log profile update
    await logSecurityEvent({
      type: 'PROFILE_UPDATED',
      userId: user.uid,
      updatedFields: Object.keys(validation.sanitizedUpdates),
      ip: getClientIP(event),
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Update user profile error:', error);
    return internalErrorResponse(headers);
  }
}

/**
 * Device management endpoints
 */
async function handleRegisterDevice(event, headers) {
  try {
    const { authorization } = event.headers;
    const deviceInfo = JSON.parse(event.body || '{}');

    const user = await validateFirebaseToken(authorization);
    if (!user) {
      return unauthorizedResponse(headers);
    }

    const device = await registerUserDevice(user.uid, deviceInfo);

    await logSecurityEvent({
      type: 'DEVICE_REGISTERED',
      userId: user.uid,
      deviceId: device.id,
      deviceInfo: device,
      ip: getClientIP(event),
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(device)
    };

  } catch (error) {
    console.error('Device registration error:', error);
    return internalErrorResponse(headers);
  }
}

/**
 * Utility functions
 */
async function validateFirebaseToken(authorization) {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.substring(7);

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token validation error:', error);
    return null;
  }
}

async function getUserProfile(userId) {
  const userDoc = await db.collection('users').doc(userId).get();
  return userDoc.exists ? userDoc.data() : null;
}

async function updateUserProfile(userId, updates) {
  await db.collection('users').doc(userId).update({
    ...updates,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function validateEntitlements(userProfile, request) {
  // This would integrate with the entitlement service
  // For now, return basic validation
  const subscription = userProfile.subscription || { tier: 'FREE' };

  const permissions = [];
  let quality = 'standard';

  switch (subscription.tier) {
    case 'PREMIUM':
    case 'PREMIUM_FAMILY':
    case 'ARTIST':
      permissions.push('stream:premium');
      quality = subscription.tier === 'ARTIST' ? 'lossless' : 'high';
      break;
    default:
      permissions.push('stream:free');
      break;
  }

  return {
    allowed: true,
    permissions,
    quality
  };
}

async function checkRateLimit(userId, action) {
  const key = `rate_limit:${userId}:${action}`;
  const limit = RATE_LIMITS[action];

  // This would integrate with Redis or similar for production
  // For now, return allowed
  return { allowed: true };
}

async function storeActiveToken(jti, userId, type, exp) {
  await db.collection('activeTokens').doc(jti).set({
    userId,
    type,
    exp,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function blacklistToken(jti) {
  await db.collection('blacklistedTokens').doc(jti).set({
    blacklistedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function isTokenBlacklisted(jti) {
  const doc = await db.collection('blacklistedTokens').doc(jti).get();
  return doc.exists;
}

async function logSecurityEvent(event) {
  await db.collection('securityAuditLog').add({
    ...event,
    serverTimestamp: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function registerUserDevice(userId, deviceInfo) {
  const device = {
    id: generateDeviceId(),
    ...deviceInfo,
    registeredAt: admin.firestore.FieldValue.serverTimestamp(),
    trusted: false,
    lastAccess: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('users').doc(userId).update({
    devices: admin.firestore.FieldValue.arrayUnion(device)
  });

  return device;
}

function validatePlaybackTokenRequest(body) {
  if (!body.contentId) {
    return { valid: false, error: 'contentId is required' };
  }
  if (!body.deviceId) {
    return { valid: false, error: 'deviceId is required' };
  }
  return { valid: true };
}

function validateProfileUpdates(updates) {
  const allowedFields = ['preferences', 'displayName'];
  const sanitizedUpdates = {};

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      sanitizedUpdates[key] = value;
    }
  }

  return {
    valid: Object.keys(sanitizedUpdates).length > 0,
    sanitizedUpdates,
    error: Object.keys(sanitizedUpdates).length === 0 ? 'No valid fields to update' : null
  };
}

function generateTokenId() {
  return crypto.randomBytes(16).toString('hex');
}

function generateSessionId() {
  return 'sess_' + crypto.randomBytes(12).toString('hex');
}

function generateDeviceId() {
  return 'dev_' + crypto.randomBytes(12).toString('hex');
}

function getClientIP(event) {
  return event.headers['x-forwarded-for'] ||
         event.headers['x-real-ip'] ||
         event.requestContext?.identity?.sourceIp ||
         'unknown';
}

// Response helpers
function unauthorizedResponse(headers) {
  return {
    statusCode: 401,
    headers,
    body: JSON.stringify({ error: 'Unauthorized' })
  };
}

function forbiddenResponse(headers, reason) {
  return {
    statusCode: 403,
    headers,
    body: JSON.stringify({ error: 'Forbidden', reason })
  };
}

function badRequestResponse(headers, error) {
  return {
    statusCode: 400,
    headers,
    body: JSON.stringify({ error })
  };
}

function notFoundResponse(headers, error) {
  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error })
  };
}

function rateLimitResponse(headers, retryAfter) {
  return {
    statusCode: 429,
    headers: {
      ...headers,
      'Retry-After': retryAfter.toString()
    },
    body: JSON.stringify({
      error: 'Rate limit exceeded',
      retryAfter
    })
  };
}

function internalErrorResponse(headers) {
  return {
    statusCode: 500,
    headers,
    body: JSON.stringify({ error: 'Internal server error' })
  };
}