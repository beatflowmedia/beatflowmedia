/**
 * Firestore Integration Module for BeatFlow Agents
 *
 * Provides real-time connection to Firestore for:
 * - Analytics event collection
 * - User profile management
 * - Content metadata storage
 * - Recommendation tracking
 * - Moderation results
 * - Notification history
 */

const { Firestore } = require('@google-cloud/firestore');
const admin = require('firebase-admin');

class FirestoreIntegration {
  constructor(config = {}) {
    this.config = config;
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize Firestore connection
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize Firebase Admin if not already initialized
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          ...this.config.firebaseConfig
        });
      }

      this.db = admin.firestore();
      this.initialized = true;

      console.log('✅ Firestore connection established');
    } catch (error) {
      console.error('❌ Firestore initialization failed:', error.message);
      throw error;
    }
  }

  // ==========================================
  // Analytics Events
  // ==========================================

  /**
   * Store analytics event
   */
  async storeAnalyticsEvent(event) {
    await this.ensureInitialized();

    const eventData = {
      ...event,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString()
    };

    const docRef = await this.db.collection('analytics_events').add(eventData);
    return docRef.id;
  }

  /**
   * Query analytics events
   */
  async queryAnalyticsEvents(options = {}) {
    await this.ensureInitialized();

    let query = this.db.collection('analytics_events');

    // Apply filters
    if (options.category) {
      query = query.where('category', '==', options.category);
    }

    if (options.startDate) {
      query = query.where('timestamp', '>=', options.startDate);
    }

    if (options.endDate) {
      query = query.where('timestamp', '<=', options.endDate);
    }

    if (options.userId) {
      query = query.where('userId', '==', options.userId);
    }

    // Apply ordering
    query = query.orderBy('timestamp', 'desc');

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(timeRange = '24h') {
    await this.ensureInitialized();

    const startDate = this.getStartDate(timeRange);

    const events = await this.queryAnalyticsEvents({
      startDate,
      limit: 10000
    });

    // Aggregate statistics
    const summary = {
      totalEvents: events.length,
      byCategory: {},
      byType: {},
      timeRange
    };

    events.forEach(event => {
      // Count by category
      summary.byCategory[event.category] =
        (summary.byCategory[event.category] || 0) + 1;

      // Count by type
      summary.byType[event.type] =
        (summary.byType[event.type] || 0) + 1;
    });

    return summary;
  }

  // ==========================================
  // User Profiles
  // ==========================================

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    await this.ensureInitialized();

    const docRef = this.db.collection('users').doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data()
    };
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, data) {
    await this.ensureInitialized();

    const docRef = this.db.collection('users').doc(userId);
    await docRef.set(data, { merge: true });

    return { success: true, userId };
  }

  /**
   * Get user listening history
   */
  async getUserListeningHistory(userId, limit = 100) {
    await this.ensureInitialized();

    const snapshot = await this.db
      .collection('listening_history')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId) {
    await this.ensureInitialized();

    const docRef = this.db.collection('user_preferences').doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      // Return default preferences
      return {
        notifications: {
          email: true,
          sms: false,
          push: true,
          inApp: true
        },
        categories: {
          playback: true,
          content: true,
          account: true,
          revenue: true,
          promotional: false
        }
      };
    }

    return doc.data();
  }

  // ==========================================
  // Content & Metadata
  // ==========================================

  /**
   * Store content metadata
   */
  async storeContentMetadata(contentId, metadata) {
    await this.ensureInitialized();

    const docRef = this.db.collection('content_metadata').doc(contentId);
    await docRef.set({
      ...metadata,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { success: true, contentId };
  }

  /**
   * Get content metadata
   */
  async getContentMetadata(contentId) {
    await this.ensureInitialized();

    const docRef = this.db.collection('content_metadata').doc(contentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data()
    };
  }

  /**
   * Query content catalog
   */
  async queryContentCatalog(options = {}) {
    await this.ensureInitialized();

    let query = this.db.collection('content_metadata');

    if (options.genre) {
      query = query.where('genre', '==', options.genre);
    }

    if (options.artist) {
      query = query.where('artist', '==', options.artist);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  // ==========================================
  // Recommendations
  // ==========================================

  /**
   * Store recommendation results
   */
  async storeRecommendations(userId, recommendations) {
    await this.ensureInitialized();

    const docRef = await this.db.collection('recommendations').add({
      userId,
      recommendations,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString()
    });

    return docRef.id;
  }

  /**
   * Track recommendation interaction
   */
  async trackRecommendationInteraction(userId, trackId, interactionType) {
    await this.ensureInitialized();

    await this.db.collection('recommendation_interactions').add({
      userId,
      trackId,
      interactionType,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  }

  /**
   * Get recommendation metrics
   */
  async getRecommendationMetrics(userId, timeRange = '7d') {
    await this.ensureInitialized();

    const startDate = this.getStartDate(timeRange);

    const interactions = await this.db
      .collection('recommendation_interactions')
      .where('userId', '==', userId)
      .where('timestamp', '>=', startDate)
      .get();

    const metrics = {
      totalInteractions: interactions.size,
      byType: {}
    };

    interactions.forEach(doc => {
      const data = doc.data();
      metrics.byType[data.interactionType] =
        (metrics.byType[data.interactionType] || 0) + 1;
    });

    return metrics;
  }

  // ==========================================
  // Moderation
  // ==========================================

  /**
   * Store moderation result
   */
  async storeModerationResult(contentId, result) {
    await this.ensureInitialized();

    const docRef = this.db.collection('moderation_results').doc(contentId);
    await docRef.set({
      ...result,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: new Date().toISOString()
    });

    // Update content status
    await this.db.collection('content_metadata').doc(contentId).update({
      moderationStatus: result.decision,
      moderatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, contentId };
  }

  /**
   * Get moderation queue
   */
  async getModerationQueue(status = 'flagged', limit = 50) {
    await this.ensureInitialized();

    const snapshot = await this.db
      .collection('moderation_results')
      .where('decision', '==', status)
      .where('reviewRequired', '==', true)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  // ==========================================
  // Notifications
  // ==========================================

  /**
   * Store notification
   */
  async storeNotification(notification) {
    await this.ensureInitialized();

    const docRef = await this.db.collection('notifications').add({
      ...notification,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString()
    });

    // Also store in user's notification inbox
    const recipients = Array.isArray(notification.recipients)
      ? notification.recipients
      : [notification.recipients];

    const batch = this.db.batch();
    recipients.forEach(userId => {
      const userNotifRef = this.db
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .doc();

      batch.set(userNotifRef, {
        notificationId: docRef.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();

    return docRef.id;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, unreadOnly = false, limit = 50) {
    await this.ensureInitialized();

    let query = this.db
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .orderBy('timestamp', 'desc')
      .limit(limit);

    if (unreadOnly) {
      query = query.where('read', '==', false);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(userId, notificationId) {
    await this.ensureInitialized();

    const docRef = this.db
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .doc(notificationId);

    await docRef.update({
      read: true,
      readAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  }

  // ==========================================
  // Utilities
  // ==========================================

  /**
   * Get start date for time range
   */
  getStartDate(timeRange) {
    const now = new Date();
    const match = timeRange.match(/^(\d+)([hdw])$/);

    if (!match) {
      throw new Error(`Invalid time range: ${timeRange}`);
    }

    const [, value, unit] = match;
    const amount = parseInt(value);

    switch (unit) {
      case 'h': // hours
        now.setHours(now.getHours() - amount);
        break;
      case 'd': // days
        now.setDate(now.getDate() - amount);
        break;
      case 'w': // weeks
        now.setDate(now.getDate() - (amount * 7));
        break;
    }

    return admin.firestore.Timestamp.fromDate(now);
  }

  /**
   * Ensure initialized
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Batch write operations
   */
  async batchWrite(operations) {
    await this.ensureInitialized();

    const batch = this.db.batch();

    operations.forEach(op => {
      const ref = this.db.collection(op.collection).doc(op.id);

      switch (op.type) {
        case 'set':
          batch.set(ref, op.data, op.options || {});
          break;
        case 'update':
          batch.update(ref, op.data);
          break;
        case 'delete':
          batch.delete(ref);
          break;
      }
    });

    await batch.commit();
    return { success: true, count: operations.length };
  }

  /**
   * Close connection
   */
  async close() {
    if (this.initialized) {
      // Firestore doesn't require explicit closing
      this.initialized = false;
      console.log('✅ Firestore connection closed');
    }
  }
}

module.exports = FirestoreIntegration;
