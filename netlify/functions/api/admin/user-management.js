/**
 * Admin User Management API
 *
 * Comprehensive user management endpoints for admin dashboard
 * Includes user CRUD operations, subscription management, and security controls
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
 * Main handler for user management operations
 */
const userManagementHandler = async (event, context) => {
  const { httpMethod, path, pathParameters, queryStringParameters } = event;
  const userId = pathParameters?.userId;

  try {
    switch (`${httpMethod} ${path.split('/').slice(-1)[0]}`) {
      case 'GET users':
        return await getAllUsers(queryStringParameters);

      case 'GET user-management':
        if (userId) {
          return await getUserById(userId);
        }
        return await getAllUsers(queryStringParameters);

      case 'PUT user-management':
        return await updateUser(userId, JSON.parse(event.body || '{}'));

      case 'DELETE user-management':
        return await deleteUser(userId);

      case 'POST suspend':
        return await suspendUser(userId);

      case 'POST unsuspend':
        return await unsuspendUser(userId);

      case 'POST reset-password':
        return await resetUserPassword(userId);

      case 'POST impersonate':
        return await createImpersonationToken(userId);

      default:
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Endpoint not found' })
        };
    }
  } catch (error) {
    console.error('User management error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

/**
 * Get all users with filtering and pagination
 */
async function getAllUsers(queryParams = {}) {
  try {
    const {
      limit = '25',
      offset = '0',
      search = '',
      role = '',
      status = '',
      subscription = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = queryParams;

    let query = db.collection('users');

    // Apply filters
    if (role) {
      query = query.where('role', '==', role);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    if (subscription) {
      query = query.where('subscription.tier', '==', subscription);
    }

    // Apply sorting
    query = query.orderBy(sortBy, sortOrder);

    // Apply pagination
    if (offset !== '0') {
      const offsetDoc = await db.collection('users').doc(offset).get();
      if (offsetDoc.exists) {
        query = query.startAfter(offsetDoc);
      }
    }

    query = query.limit(parseInt(limit));

    const snapshot = await query.get();
    const users = [];

    snapshot.forEach(doc => {
      const userData = doc.data();

      // Apply text search filter if provided
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          userData.email?.toLowerCase().includes(searchLower) ||
          userData.displayName?.toLowerCase().includes(searchLower) ||
          userData.uid.toLowerCase().includes(searchLower);

        if (!matchesSearch) return;
      }

      users.push({
        id: doc.id,
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        emailVerified: userData.emailVerified,
        role: userData.role || 'user',
        status: userData.status || 'active',
        subscription: userData.subscription || { tier: 'FREE' },
        createdAt: userData.createdAt,
        lastLoginAt: userData.lastLoginAt,
        usage: userData.usage || {},
        security: {
          mfaEnabled: userData.security?.mfaEnabled || false,
          loginAttempts: userData.security?.loginAttempts || 0,
          lastPasswordChange: userData.security?.lastPasswordChange
        },
        deviceCount: userData.devices?.length || 0,
        playlistCount: userData.playlists?.length || 0
      });
    });

    // Get total count for pagination
    const totalQuery = db.collection('users');
    const totalSnapshot = await totalQuery.get();
    const totalUsers = totalSnapshot.size;

    return {
      statusCode: 200,
      body: JSON.stringify({
        users,
        pagination: {
          total: totalUsers,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: users.length === parseInt(limit)
        }
      })
    };

  } catch (error) {
    console.error('Get all users error:', error);
    throw error;
  }
}

/**
 * Get specific user by ID
 */
async function getUserById(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    const userData = userDoc.data();

    // Get additional user data
    const [auditLogs, devices, sessions] = await Promise.all([
      getRecentAuditLogs(userId),
      getUserDevices(userId),
      getUserSessions(userId)
    ]);

    const userDetails = {
      id: userDoc.id,
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      emailVerified: userData.emailVerified,
      role: userData.role || 'user',
      status: userData.status || 'active',
      subscription: userData.subscription || { tier: 'FREE' },
      preferences: userData.preferences || {},
      usage: userData.usage || {},
      security: {
        mfaEnabled: userData.security?.mfaEnabled || false,
        trustedDevices: userData.security?.trustedDevices || [],
        lastPasswordChange: userData.security?.lastPasswordChange,
        loginAttempts: userData.security?.loginAttempts || 0,
        lockedUntil: userData.security?.lockedUntil
      },
      devices: userData.devices || [],
      playlists: userData.playlists || [],
      favorites: userData.favorites || [],
      follows: userData.follows || [],
      likes: userData.likes || [],
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      lastLoginAt: userData.lastLoginAt,
      auditLogs: auditLogs.slice(0, 10), // Recent 10 entries
      activeSessions: sessions,
      metadata: {
        deviceCount: userData.devices?.length || 0,
        playlistCount: userData.playlists?.length || 0,
        favoriteCount: userData.favorites?.length || 0,
        followCount: userData.follows?.length || 0
      }
    };

    return {
      statusCode: 200,
      body: JSON.stringify(userDetails)
    };

  } catch (error) {
    console.error('Get user by ID error:', error);
    throw error;
  }
}

/**
 * Update user information
 */
async function updateUser(userId, updates) {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Validate and sanitize updates
    const allowedFields = [
      'displayName',
      'role',
      'status',
      'subscription',
      'preferences',
      'security'
    ];

    const sanitizedUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        sanitizedUpdates[key] = updates[key];
      }
    });

    // Add metadata
    sanitizedUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    // Update user document
    await userRef.update(sanitizedUpdates);

    // Log the update
    await logUserManagementAction(userId, 'USER_UPDATED', {
      updatedFields: Object.keys(sanitizedUpdates),
      updatedBy: 'admin' // Would come from authentication context
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'User updated successfully',
        updatedFields: Object.keys(sanitizedUpdates)
      })
    };

  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
}

/**
 * Delete user (soft delete)
 */
async function deleteUser(userId) {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Soft delete - mark as deleted instead of removing
    await userRef.update({
      status: 'deleted',
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      email: `deleted_${userId}@deleted.local`, // Anonymize email
      displayName: 'Deleted User'
    });

    // Revoke all active sessions
    await revokeAllUserSessions(userId);

    // Log the deletion
    await logUserManagementAction(userId, 'USER_DELETED', {
      deletedBy: 'admin'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'User deleted successfully'
      })
    };

  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
}

/**
 * Suspend user account
 */
async function suspendUser(userId) {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    const suspensionData = {
      status: 'suspended',
      suspendedAt: admin.firestore.FieldValue.serverTimestamp(),
      suspendedBy: 'admin', // Would come from authentication context
      suspensionReason: 'Administrative action'
    };

    await userRef.update(suspensionData);

    // Revoke all active sessions
    await revokeAllUserSessions(userId);

    // Revoke all active tokens
    await revokeAllUserTokens(userId);

    // Log the suspension
    await logUserManagementAction(userId, 'USER_SUSPENDED', suspensionData);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'User suspended successfully'
      })
    };

  } catch (error) {
    console.error('Suspend user error:', error);
    throw error;
  }
}

/**
 * Unsuspend user account
 */
async function unsuspendUser(userId) {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    const unsuspensionData = {
      status: 'active',
      unsuspendedAt: admin.firestore.FieldValue.serverTimestamp(),
      unsuspendedBy: 'admin'
    };

    await userRef.update(unsuspensionData);

    // Log the unsuspension
    await logUserManagementAction(userId, 'USER_UNSUSPENDED', unsuspensionData);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'User unsuspended successfully'
      })
    };

  } catch (error) {
    console.error('Unsuspend user error:', error);
    throw error;
  }
}

/**
 * Reset user password
 */
async function resetUserPassword(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    const userData = userDoc.data();

    // Generate password reset link
    const resetLink = await admin.auth().generatePasswordResetLink(userData.email);

    // Update user document
    await db.collection('users').doc(userId).update({
      'security.passwordResetRequestedAt': admin.firestore.FieldValue.serverTimestamp(),
      'security.passwordResetRequestedBy': 'admin'
    });

    // Log the password reset
    await logUserManagementAction(userId, 'PASSWORD_RESET_REQUESTED', {
      requestedBy: 'admin'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Password reset link generated',
        resetLink
      })
    };

  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
}

/**
 * Create impersonation token for admin access
 */
async function createImpersonationToken(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Create custom token for impersonation
    const customToken = await admin.auth().createCustomToken(userId, {
      impersonated: true,
      impersonatedBy: 'admin', // Would come from authentication context
      impersonatedAt: Date.now()
    });

    // Log the impersonation
    await logUserManagementAction(userId, 'USER_IMPERSONATED', {
      impersonatedBy: 'admin',
      tokenId: customToken.substring(0, 10) + '...'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        token: customToken,
        expiresIn: 3600 // 1 hour
      })
    };

  } catch (error) {
    console.error('Create impersonation token error:', error);
    throw error;
  }
}

/**
 * Helper functions
 */
async function getRecentAuditLogs(userId) {
  try {
    const logsQuery = db.collection('securityAuditLog')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(20);

    const snapshot = await logsQuery.get();
    const logs = [];

    snapshot.forEach(doc => {
      logs.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return logs;
  } catch (error) {
    console.error('Get audit logs error:', error);
    return [];
  }
}

async function getUserDevices(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    return userData.devices || [];
  } catch (error) {
    console.error('Get user devices error:', error);
    return [];
  }
}

async function getUserSessions(userId) {
  try {
    const sessionsQuery = db.collection('activeSessions')
      .where('userId', '==', userId);

    const snapshot = await sessionsQuery.get();
    const sessions = [];

    snapshot.forEach(doc => {
      sessions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return sessions;
  } catch (error) {
    console.error('Get user sessions error:', error);
    return [];
  }
}

async function revokeAllUserSessions(userId) {
  try {
    const sessionsQuery = db.collection('activeSessions')
      .where('userId', '==', userId);

    const snapshot = await sessionsQuery.get();
    const batch = db.batch();

    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Revoke sessions error:', error);
  }
}

async function revokeAllUserTokens(userId) {
  try {
    const tokensQuery = db.collection('activeTokens')
      .where('userId', '==', userId);

    const snapshot = await tokensQuery.get();
    const batch = db.batch();

    snapshot.forEach(doc => {
      // Move to blacklisted tokens
      const tokenData = doc.data();
      const blacklistRef = db.collection('blacklistedTokens').doc(doc.id);
      batch.set(blacklistRef, {
        ...tokenData,
        blacklistedAt: admin.firestore.FieldValue.serverTimestamp(),
        reason: 'User suspended'
      });

      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Revoke tokens error:', error);
  }
}

async function logUserManagementAction(userId, action, details) {
  try {
    await db.collection('userManagementAuditLog').add({
      userId,
      action,
      details,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      performedBy: 'admin' // Would come from authentication context
    });
  } catch (error) {
    console.error('Log user management action error:', error);
  }
}

// Export the handler with security middleware
exports.handler = securityMiddleware({
  requireAuth: true,
  requiredPermissions: ['admin:users'],
  rateLimit: true
})(userManagementHandler);