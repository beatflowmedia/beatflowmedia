/**
 * Admin Security Metrics API
 *
 * Provides comprehensive security metrics and analytics for the admin dashboard
 * Requires admin privileges and implements extensive security monitoring
 */

const admin = require('firebase-admin');
const { securityMiddleware } = require('../../middleware/securityMiddleware');

// Initialize Firebase Admin if not already done
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

/**
 * Get security metrics for admin dashboard
 */
const getSecurityMetrics = async (event, context) => {
  try {
    const timeRange = event.queryStringParameters?.range || '24h';
    const now = new Date();
    let startTime;

    // Calculate time range
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get metrics in parallel
    const [
      userMetrics,
      authMetrics,
      securityEvents,
      tokenMetrics,
      deviceMetrics,
      threatIntelligence
    ] = await Promise.all([
      getUserMetrics(startTime),
      getAuthenticationMetrics(startTime),
      getSecurityEvents(startTime),
      getTokenMetrics(startTime),
      getDeviceMetrics(startTime),
      getThreatIntelligence(startTime)
    ]);

    const metrics = {
      timestamp: now.toISOString(),
      timeRange,
      userMetrics,
      authMetrics,
      securityEvents,
      tokenMetrics,
      deviceMetrics,
      threatIntelligence,
      summary: generateSummary({
        userMetrics,
        authMetrics,
        securityEvents,
        tokenMetrics,
        deviceMetrics
      })
    };

    return {
      statusCode: 200,
      body: JSON.stringify(metrics)
    };

  } catch (error) {
    console.error('Security metrics error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to retrieve security metrics',
        message: error.message
      })
    };
  }
};

/**
 * Get user-related metrics
 */
async function getUserMetrics(startTime) {
  try {
    // Total users
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;

    // Active users (logged in within timeframe)
    const activeUsersQuery = db.collection('users')
      .where('lastLoginAt', '>=', startTime.toISOString());
    const activeUsersSnapshot = await getDocs(activeUsersQuery);
    const activeUsers = activeUsersSnapshot.size;

    // New registrations
    const newUsersQuery = db.collection('users')
      .where('createdAt', '>=', startTime.toISOString());
    const newUsersSnapshot = await getDocs(newUsersQuery);
    const newUsers = newUsersSnapshot.size;

    // User roles distribution
    const roleDistribution = {};
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const role = userData.role || 'user';
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;
    });

    // Subscription tiers
    const subscriptionTiers = {};
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const tier = userData.subscription?.tier || 'FREE';
      subscriptionTiers[tier] = (subscriptionTiers[tier] || 0) + 1;
    });

    return {
      totalUsers,
      activeUsers,
      newUsers,
      inactiveUsers: totalUsers - activeUsers,
      roleDistribution,
      subscriptionTiers
    };

  } catch (error) {
    console.error('User metrics error:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      newUsers: 0,
      inactiveUsers: 0,
      roleDistribution: {},
      subscriptionTiers: {}
    };
  }
}

/**
 * Get authentication metrics
 */
async function getAuthenticationMetrics(startTime) {
  try {
    const auditLogQuery = db.collection('securityAuditLog')
      .where('timestamp', '>=', startTime.toISOString())
      .where('eventType', 'in', ['AUTH_SUCCESS', 'AUTH_FAILURE', 'MFA_SUCCESS', 'MFA_FAILURE']);

    const auditSnapshot = await auditLogQuery.get();

    let totalLogins = 0;
    let failedLogins = 0;
    let mfaSuccess = 0;
    let mfaFailures = 0;
    const providerStats = {};
    const locationStats = {};

    auditSnapshot.forEach(doc => {
      const data = doc.data();

      switch (data.eventType) {
        case 'AUTH_SUCCESS':
          totalLogins++;
          if (data.provider) {
            providerStats[data.provider] = (providerStats[data.provider] || 0) + 1;
          }
          if (data.location) {
            locationStats[data.location.country] = (locationStats[data.location.country] || 0) + 1;
          }
          break;
        case 'AUTH_FAILURE':
          failedLogins++;
          break;
        case 'MFA_SUCCESS':
          mfaSuccess++;
          break;
        case 'MFA_FAILURE':
          mfaFailures++;
          break;
      }
    });

    return {
      totalLogins,
      successfulLogins: totalLogins,
      failedLogins,
      successRate: totalLogins > 0 ? ((totalLogins - failedLogins) / totalLogins * 100).toFixed(2) : 100,
      mfaSuccess,
      mfaFailures,
      mfaAdoption: await getMfaAdoptionRate(),
      providerStats,
      locationStats
    };

  } catch (error) {
    console.error('Authentication metrics error:', error);
    return {
      totalLogins: 0,
      successfulLogins: 0,
      failedLogins: 0,
      successRate: 0,
      mfaSuccess: 0,
      mfaFailures: 0,
      mfaAdoption: 0,
      providerStats: {},
      locationStats: {}
    };
  }
}

/**
 * Get security events and incidents
 */
async function getSecurityEvents(startTime) {
  try {
    const securityEventsQuery = db.collection('securityAuditLog')
      .where('timestamp', '>=', startTime.toISOString())
      .where('severity', 'in', ['medium', 'high', 'critical']);

    const eventsSnapshot = await securityEventsQuery.get();

    const events = {
      total: eventsSnapshot.size,
      critical: 0,
      high: 0,
      medium: 0,
      byType: {},
      recentEvents: []
    };

    eventsSnapshot.forEach(doc => {
      const data = doc.data();

      // Count by severity
      events[data.severity] = (events[data.severity] || 0) + 1;

      // Count by type
      events.byType[data.eventType] = (events.byType[data.eventType] || 0) + 1;

      // Collect recent events
      if (events.recentEvents.length < 10) {
        events.recentEvents.push({
          id: doc.id,
          type: data.eventType,
          severity: data.severity,
          timestamp: data.timestamp,
          ip: data.ip,
          userId: data.userId,
          details: data.details
        });
      }
    });

    // Sort recent events by timestamp
    events.recentEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return events;

  } catch (error) {
    console.error('Security events error:', error);
    return {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      byType: {},
      recentEvents: []
    };
  }
}

/**
 * Get token-related metrics
 */
async function getTokenMetrics(startTime) {
  try {
    // Active tokens
    const activeTokensSnapshot = await db.collection('activeTokens').get();
    const activeTokens = activeTokensSnapshot.size;

    // Blacklisted tokens
    const blacklistedTokensSnapshot = await db.collection('blacklistedTokens').get();
    const blacklistedTokens = blacklistedTokensSnapshot.size;

    // Token generation events
    const tokenEventsQuery = db.collection('securityAuditLog')
      .where('timestamp', '>=', startTime.toISOString())
      .where('eventType', 'in', ['PLAYBACK_TOKEN_GENERATED', 'PLAYBACK_TOKEN_REFRESHED', 'TOKEN_REVOKED']);

    const tokenEventsSnapshot = await tokenEventsQuery.get();

    let tokensGenerated = 0;
    let tokensRefreshed = 0;
    let tokensRevoked = 0;

    tokenEventsSnapshot.forEach(doc => {
      const data = doc.data();
      switch (data.eventType) {
        case 'PLAYBACK_TOKEN_GENERATED':
          tokensGenerated++;
          break;
        case 'PLAYBACK_TOKEN_REFRESHED':
          tokensRefreshed++;
          break;
        case 'TOKEN_REVOKED':
          tokensRevoked++;
          break;
      }
    });

    return {
      activeTokens,
      blacklistedTokens,
      tokensGenerated,
      tokensRefreshed,
      tokensRevoked,
      tokenUtilization: {
        generationRate: tokensGenerated,
        refreshRate: tokensRefreshed > 0 ? (tokensRefreshed / tokensGenerated * 100).toFixed(2) : 0,
        revocationRate: tokensRevoked > 0 ? (tokensRevoked / tokensGenerated * 100).toFixed(2) : 0
      }
    };

  } catch (error) {
    console.error('Token metrics error:', error);
    return {
      activeTokens: 0,
      blacklistedTokens: 0,
      tokensGenerated: 0,
      tokensRefreshed: 0,
      tokensRevoked: 0,
      tokenUtilization: {
        generationRate: 0,
        refreshRate: 0,
        revocationRate: 0
      }
    };
  }
}

/**
 * Get device-related metrics
 */
async function getDeviceMetrics(startTime) {
  try {
    // Get all users with devices
    const usersSnapshot = await db.collection('users').get();

    let totalDevices = 0;
    let trustedDevices = 0;
    const deviceTypes = {};
    const browserStats = {};

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const devices = userData.devices || [];

      devices.forEach(device => {
        totalDevices++;

        if (device.trusted) {
          trustedDevices++;
        }

        // Device type stats
        deviceTypes[device.type] = (deviceTypes[device.type] || 0) + 1;

        // Browser stats
        if (device.browser) {
          browserStats[device.browser] = (browserStats[device.browser] || 0) + 1;
        }
      });
    });

    // Device registrations in timeframe
    const deviceEventsQuery = db.collection('securityAuditLog')
      .where('timestamp', '>=', startTime.toISOString())
      .where('eventType', '==', 'DEVICE_REGISTERED');

    const deviceEventsSnapshot = await deviceEventsQuery.get();
    const newDevices = deviceEventsSnapshot.size;

    return {
      totalDevices,
      trustedDevices,
      untrustedDevices: totalDevices - trustedDevices,
      newDevices,
      deviceTypes,
      browserStats,
      trustRatio: totalDevices > 0 ? (trustedDevices / totalDevices * 100).toFixed(2) : 0
    };

  } catch (error) {
    console.error('Device metrics error:', error);
    return {
      totalDevices: 0,
      trustedDevices: 0,
      untrustedDevices: 0,
      newDevices: 0,
      deviceTypes: {},
      browserStats: {},
      trustRatio: 0
    };
  }
}

/**
 * Get threat intelligence data
 */
async function getThreatIntelligence(startTime) {
  try {
    // Blocked IPs
    const blockedIPsSnapshot = await db.collection('securityBlacklist')
      .where('type', '==', 'ip')
      .get();
    const blockedIPs = blockedIPsSnapshot.size;

    // Rate limit violations
    const rateLimitQuery = db.collection('securityAuditLog')
      .where('timestamp', '>=', startTime.toISOString())
      .where('eventType', '==', 'RATE_LIMIT_EXCEEDED');

    const rateLimitSnapshot = await rateLimitQuery.get();
    const rateLimitViolations = rateLimitSnapshot.size;

    // Suspicious activity patterns
    const suspiciousQuery = db.collection('securityAuditLog')
      .where('timestamp', '>=', startTime.toISOString())
      .where('eventType', '==', 'SUSPICIOUS_HEADER');

    const suspiciousSnapshot = await suspiciousQuery.get();
    const suspiciousActivity = suspiciousSnapshot.size;

    // Geographic analysis
    const geoStats = {};
    const ipStats = {};

    const allSecurityEventsSnapshot = await db.collection('securityAuditLog')
      .where('timestamp', '>=', startTime.toISOString())
      .get();

    allSecurityEventsSnapshot.forEach(doc => {
      const data = doc.data();

      if (data.location?.country) {
        geoStats[data.location.country] = (geoStats[data.location.country] || 0) + 1;
      }

      if (data.ip && data.ip !== 'unknown') {
        ipStats[data.ip] = (ipStats[data.ip] || 0) + 1;
      }
    });

    // Find top threat IPs
    const topThreatIPs = Object.entries(ipStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, events: count }));

    return {
      blockedIPs,
      rateLimitViolations,
      suspiciousActivity,
      geoStats,
      topThreatIPs,
      threatLevel: calculateThreatLevel({
        rateLimitViolations,
        suspiciousActivity,
        blockedIPs
      })
    };

  } catch (error) {
    console.error('Threat intelligence error:', error);
    return {
      blockedIPs: 0,
      rateLimitViolations: 0,
      suspiciousActivity: 0,
      geoStats: {},
      topThreatIPs: [],
      threatLevel: 'unknown'
    };
  }
}

/**
 * Generate security summary
 */
function generateSummary(metrics) {
  const {
    userMetrics,
    authMetrics,
    securityEvents,
    tokenMetrics,
    deviceMetrics
  } = metrics;

  // Calculate overall security score (0-100)
  let securityScore = 100;

  // Deduct points for security issues
  if (authMetrics.failedLogins > 10) securityScore -= 10;
  if (securityEvents.critical > 0) securityScore -= 20;
  if (securityEvents.high > 5) securityScore -= 10;
  if (tokenMetrics.blacklistedTokens > 10) securityScore -= 5;
  if (parseFloat(deviceMetrics.trustRatio) < 80) securityScore -= 5;

  securityScore = Math.max(0, securityScore);

  // Determine status
  let status = 'healthy';
  if (securityScore < 70) status = 'attention_required';
  if (securityScore < 50) status = 'critical';
  if (securityEvents.critical > 0) status = 'critical';

  // Generate recommendations
  const recommendations = [];
  if (authMetrics.failedLogins > 10) {
    recommendations.push('High number of failed login attempts detected. Consider implementing additional security measures.');
  }
  if (parseFloat(authMetrics.mfaAdoption) < 50) {
    recommendations.push('MFA adoption is low. Consider encouraging users to enable two-factor authentication.');
  }
  if (deviceMetrics.untrustedDevices > deviceMetrics.trustedDevices) {
    recommendations.push('Many untrusted devices detected. Review device trust policies.');
  }

  return {
    securityScore,
    status,
    recommendations,
    keyMetrics: {
      totalUsers: userMetrics.totalUsers,
      activeUsers: userMetrics.activeUsers,
      failedLogins: authMetrics.failedLogins,
      securityEvents: securityEvents.total,
      activeTokens: tokenMetrics.activeTokens
    }
  };
}

/**
 * Helper functions
 */
async function getMfaAdoptionRate() {
  try {
    const usersSnapshot = await db.collection('users').get();
    let totalUsers = 0;
    let mfaUsers = 0;

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      totalUsers++;
      if (userData.security?.mfaEnabled) {
        mfaUsers++;
      }
    });

    return totalUsers > 0 ? (mfaUsers / totalUsers * 100).toFixed(2) : 0;
  } catch {
    return 0;
  }
}

function calculateThreatLevel(threats) {
  const { rateLimitViolations, suspiciousActivity, blockedIPs } = threats;
  const totalThreats = rateLimitViolations + suspiciousActivity + blockedIPs;

  if (totalThreats === 0) return 'low';
  if (totalThreats < 10) return 'low';
  if (totalThreats < 50) return 'medium';
  if (totalThreats < 100) return 'high';
  return 'critical';
}

async function getDocs(query) {
  try {
    return await query.get();
  } catch (error) {
    console.error('Firestore query error:', error);
    return { size: 0, forEach: () => {} };
  }
}

// Export the handler with security middleware
exports.handler = securityMiddleware({
  requireAuth: true,
  requiredPermissions: ['admin:security'],
  rateLimit: true
})(getSecurityMetrics);