/**
 * Entitlement Management Service
 *
 * Handles subscription tiers, content access control, licensing restrictions,
 * usage tracking, and billing integration for BeatflowMedia.
 *
 * Features:
 * - Subscription tier validation and management
 * - Pay-per-stream authorization
 * - Free trial and promotional access
 * - Content library access control
 * - Usage tracking and billing integration
 * - Territorial and licensing restrictions
 * - Rate limiting and abuse prevention
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  increment
} from "firebase/firestore";
import { db } from "../firebaseConfig";

// Subscription tiers and pricing
export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: "free",
    name: "Free",
    price: 0,
    currency: "USD",
    features: {
      monthlyStreams: 1000,
      quality: "standard",
      skipsPerHour: 6,
      offline: false,
      ads: true,
      socialFeatures: true,
      crossfade: false,
      equalizer: false
    },
    permissions: ["stream:free", "playlist:create", "social:basic"],
    restrictions: {
      skipLimits: true,
      advertisingRequired: true,
      qualityLimited: true,
      territorialRestrictions: []
    }
  },
  PREMIUM: {
    id: "premium",
    name: "Premium",
    price: 9.99,
    currency: "USD",
    features: {
      monthlyStreams: "unlimited",
      quality: "high",
      skipsPerHour: "unlimited",
      offline: true,
      ads: false,
      socialFeatures: true,
      crossfade: true,
      equalizer: true
    },
    permissions: ["stream:premium", "download", "offline:sync", "quality:high"],
    restrictions: {
      skipLimits: false,
      advertisingRequired: false,
      qualityLimited: false,
      territorialRestrictions: []
    }
  },
  PREMIUM_FAMILY: {
    id: "premium_family",
    name: "Premium Family",
    price: 14.99,
    currency: "USD",
    maxMembers: 6,
    features: {
      monthlyStreams: "unlimited",
      quality: "high",
      skipsPerHour: "unlimited",
      offline: true,
      ads: false,
      socialFeatures: true,
      crossfade: true,
      equalizer: true,
      familyMix: true
    },
    permissions: [
      "stream:premium",
      "download",
      "offline:sync",
      "quality:high",
      "family:manage",
    ],
    restrictions: {
      skipLimits: false,
      advertisingRequired: false,
      qualityLimited: false,
      territorialRestrictions: []
    }
  },
  ARTIST: {
    id: "artist",
    name: "Artist Pro",
    price: 19.99,
    currency: "USD",
    features: {
      monthlyStreams: "unlimited",
      quality: "lossless",
      skipsPerHour: "unlimited",
      offline: true,
      ads: false,
      socialFeatures: true,
      crossfade: true,
      equalizer: true,
      analytics: true,
      uploadUnlimited: true
    },
    permissions: [
      "stream:premium",
      "download",
      "upload:content",
      "analytics:view",
      "quality:lossless",
    ],
    restrictions: {
      skipLimits: false,
      advertisingRequired: false,
      qualityLimited: false,
      territorialRestrictions: []
    }
  }
};

// Content licensing types
export const LICENSING_TYPES = {
  SYNC: "sync",
  MECHANICAL: "mechanical",
  PERFORMANCE: "performance",
  MASTER: "master",
  PUBLISHING: "publishing"
};

// Territorial restrictions
export const TERRITORIES = {
  WORLDWIDE: "WW",
  US: "US",
  EU: "EU",
  UK: "GB",
  CANADA: "CA",
  AUSTRALIA: "AU",
  JAPAN: "JP"
};

class EntitlementService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Validate user entitlement for content access
   */
  async validateContentAccess(userId, contentId, accessType = "stream") {
    try {
      const [userProfile, contentMetadata] = await Promise.all([
        this.getUserProfile(userId),
        this.getContentMetadata(contentId),
      ]);

      if (!userProfile || !contentMetadata) {
        return { allowed: false, reason: "User or content not found" };
      }

      // Check subscription status
      const subscriptionValid = await this.validateSubscription(userProfile);
      if (!subscriptionValid.valid) {
        return { allowed: false, reason: subscriptionValid.reason };
      }

      // Check territorial restrictions
      const territorialCheck = await this.checkTerritorialRestrictions(
        userProfile,
        contentMetadata,
      );
      if (!territorialCheck.allowed) {
        return { allowed: false, reason: territorialCheck.reason };
      }

      // Check licensing restrictions
      const licensingCheck = await this.checkLicensingRestrictions(
        contentMetadata,
        accessType,
      );
      if (!licensingCheck.allowed) {
        return { allowed: false, reason: licensingCheck.reason };
      }

      // Check usage limits
      const usageCheck = await this.checkUsageLimits(userProfile, accessType);
      if (!usageCheck.allowed) {
        return { allowed: false, reason: usageCheck.reason };
      }

      // Check quality access
      const qualityCheck = await this.checkQualityAccess(
        userProfile,
        contentMetadata.availableQualities || ["standard"],
      );

      return {
        allowed: true,
        subscription: userProfile.subscription,
        permissions: this.getUserPermissions(userProfile),
        quality: qualityCheck.maxQuality,
        restrictions: this.getActiveRestrictions(userProfile)
      };
    } catch (error) {
      console.error("Content access validation error:", error);
      return { allowed: false, reason: "Validation error" };
    }
  }

  /**
   * Validate subscription status and payments
   */
  async validateSubscription(userProfile) {
    const subscription = userProfile.subscription;

    if (!subscription) {
      return { valid: false, reason: "No subscription found" };
    }

    // Check subscription status
    if (subscription.status !== "active") {
      return { valid: false, reason: `Subscription is ${subscription.status}` };
    }

    // Check expiration for paid tiers
    if (subscription.tier !== "FREE" && subscription.endDate) {
      const endDate = new Date(subscription.endDate);
      if (endDate < new Date()) {
        return { valid: false, reason: "Subscription expired" };
      }
    }

    // Check trial status
    if (subscription.trial) {
      const trialEnd = new Date(subscription.trialEndDate);
      if (trialEnd < new Date()) {
        // Convert to free tier
        await this.downgradeToFree(userProfile.uid);
        return { valid: true, reason: "Trial expired, downgraded to free" };
      }
    }

    return { valid: true };
  }

  /**
   * Check territorial restrictions
   */
  async checkTerritorialRestrictions(userProfile, contentMetadata) {
    const userLocation = await this.getUserLocation(userProfile.uid);
    const contentRestrictions = contentMetadata.territorialRestrictions || [];

    // If no restrictions, allow worldwide access
    if (contentRestrictions.length === 0) {
      return { allowed: true };
    }

    // Check if user's location is in allowed territories
    const isAllowed = contentRestrictions.some((territory) => {
      if (territory === TERRITORIES.WORLDWIDE) return true;
      if (territory === userLocation.country) return true;
      if (
        territory === TERRITORIES.EU &&
        this.isEUCountry(userLocation.country)
      )
        return true;
      return false;
    });

    if (!isAllowed) {
      return {
        allowed: false,
        reason: `Content not available in ${userLocation.country}`
      };
    }

    return { allowed: true };
  }

  /**
   * Check licensing restrictions
   */
  async checkLicensingRestrictions(contentMetadata, accessType) {
    const licensing = contentMetadata.licensing || {};

    switch (accessType) {
      case "stream":
        if (!licensing.streaming?.allowed) {
          return { allowed: false, reason: "Streaming not licensed" };
        }
        break;

      case "download":
        if (!licensing.download?.allowed) {
          return { allowed: false, reason: "Download not licensed" };
        }
        break;

      case "sync":
        if (!licensing.sync?.allowed) {
          return { allowed: false, reason: "Sync licensing not available" };
        }
        break;

      default:
        return { allowed: false, reason: "Unknown access type" };
    }

    return { allowed: true };
  }

  /**
   * Check usage limits and quotas
   */
  async checkUsageLimits(userProfile, accessType) {
    const tier = SUBSCRIPTION_TIERS[userProfile.subscription.tier];
    const usage = userProfile.usage || {};

    switch (accessType) {
      case "stream":
        if (tier.features.monthlyStreams !== "unlimited") {
          if (usage.monthlyStreams >= tier.features.monthlyStreams) {
            return {
              allowed: false,
              reason: "Monthly streaming limit reached"
            };
          }
        }
        break;

      case "skip":
        if (tier.features.skipsPerHour !== "unlimited") {
          const hourlySkips = await this.getHourlySkips(userProfile.uid);
          if (hourlySkips >= tier.features.skipsPerHour) {
            return {
              allowed: false,
              reason: "Hourly skip limit reached"
            };
          }
        }
        break;

      case "download":
        if (!tier.features.offline) {
          return {
            allowed: false,
            reason: "Download not available in current tier"
          };
        }
        break;
    }

    return { allowed: true };
  }

  /**
   * Check quality access based on subscription
   */
  async checkQualityAccess(userProfile, availableQualities) {
    const tier = SUBSCRIPTION_TIERS[userProfile.subscription.tier];
    const maxQuality = tier.features.quality;

    const qualityHierarchy = ["low", "standard", "high", "lossless"];
    const maxIndex = qualityHierarchy.indexOf(maxQuality);

    const allowedQualities = availableQualities.filter((quality) => {
      const qualityIndex = qualityHierarchy.indexOf(quality);
      return qualityIndex <= maxIndex;
    });

    return {
      maxQuality,
      allowedQualities,
      canUpgrade: maxQuality !== "lossless"
    };
  }

  /**
   * Track content usage for billing and analytics
   */
  async trackUsage(userId, contentId, usageType, metadata = {}) {
    try {
      const usageRecord = {
        userId,
        contentId,
        usageType,
        timestamp: new Date().toISOString(),
        metadata: {
          quality: metadata.quality || "standard",
          duration: metadata.duration || 0,
          completed: metadata.completed || false,
          deviceId: metadata.deviceId,
          sessionId: metadata.sessionId,
          ...metadata
        }
      };

      // Store usage record
      const usageRef = doc(collection(db, "usage"));
      await setDoc(usageRef, usageRecord);

      // Update user usage counters
      await this.updateUsageCounters(userId, usageType, metadata);

      // Update content analytics
      await this.updateContentAnalytics(contentId, usageType, metadata);

      return usageRecord;
    } catch (error) {
      console.error("Usage tracking error:", error);
      throw error;
    }
  }

  /**
   * Update user usage counters
   */
  async updateUsageCounters(userId, usageType, metadata) {
    const userRef = doc(db, "users", userId);

    const updates = {
      "usage.lastActivity": new Date().toISOString()
    };

    switch (usageType) {
      case "stream":
        updates["usage.totalStreams"] = increment(1);
        updates["usage.monthlyStreams"] = increment(1);
        break;

      case "download":
        updates["usage.downloadCount"] = increment(1);
        break;

      case "skip":
        updates["usage.skipsUsed"] = increment(1);
        break;
    }

    await updateDoc(userRef, updates);
  }

  /**
   * Update content analytics
   */
  async updateContentAnalytics(contentId, usageType, metadata) {
    const analyticsRef = doc(db, "contentAnalytics", contentId);

    const updates = {
      lastPlayed: new Date().toISOString()
    };

    switch (usageType) {
      case "stream":
        updates.totalPlays = increment(1);
        updates.uniqueListeners = increment(1); // This should be deduplicated
        break;

      case "skip":
        updates.totalSkips = increment(1);
        break;

      case "like":
        updates.totalLikes = increment(1);
        break;
    }

    await setDoc(analyticsRef, updates, { merge: true });
  }

  /**
   * Subscription management
   */
  async upgradeSubscription(userId, newTier, paymentMethod = null) {
    try {
      const userProfile = await this.getUserProfile(userId);
      const tier = SUBSCRIPTION_TIERS[newTier];

      if (!tier) {
        throw new Error("Invalid subscription tier");
      }

      const subscription = {
        tier: newTier,
        status: "active",
        startDate: new Date().toISOString(),
        endDate: this.calculateEndDate(tier),
        autoRenew: true,
        paymentMethod,
        price: tier.price,
        currency: tier.currency,
        features: tier.features,
        permissions: tier.permissions
      };

      // Update user profile
      await updateDoc(doc(db, "users", userId), {
        subscription,
        "usage.monthlyStreams": 0, // Reset counters
        "usage.skipsUsed": 0,
        updatedAt: new Date().toISOString()
      });

      // Track subscription change
      await this.trackSubscriptionChange(
        userId,
        userProfile.subscription.tier,
        newTier,
      );

      return subscription;
    } catch (error) {
      console.error("Subscription upgrade error:", error);
      throw error;
    }
  }

  /**
   * Trial management
   */
  async startTrial(userId, trialTier = "PREMIUM", trialDays = 30) {
    try {
      const userProfile = await this.getUserProfile(userId);

      // Check if user has already used a trial
      if (userProfile.subscription.hasUsedTrial) {
        throw new Error("Trial already used");
      }

      const tier = SUBSCRIPTION_TIERS[trialTier];
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + trialDays);

      const subscription = {
        tier: trialTier,
        status: "active",
        trial: true,
        trialStartDate: new Date().toISOString(),
        trialEndDate: trialEndDate.toISOString(),
        hasUsedTrial: true,
        autoRenew: false,
        features: tier.features,
        permissions: tier.permissions
      };

      await updateDoc(doc(db, "users", userId), {
        subscription,
        updatedAt: new Date().toISOString()
      });

      return subscription;
    } catch (error) {
      console.error("Trial start error:", error);
      throw error;
    }
  }

  /**
   * Pay-per-stream authorization
   */
  async authorizePayPerStream(userId, contentId, price) {
    try {
      const userProfile = await this.getUserProfile(userId);

      // Check if user has sufficient credits/balance
      const balance = userProfile.wallet?.balance || 0;
      if (balance < price) {
        return {
          authorized: false,
          reason: "Insufficient balance",
          required: price,
          available: balance
        };
      }

      // Create payment authorization
      const authId = this.generateAuthId();
      const authorization = {
        id: authId,
        userId,
        contentId,
        amount: price,
        currency: "USD",
        type: "pay_per_stream",
        status: "authorized",
        createdAt: new Date().toISOString(),
        expiresAt: this.calculateAuthExpiry(15), // 15 minutes
      };

      // Store authorization
      await setDoc(doc(db, "paymentAuthorizations", authId), authorization);

      return {
        authorized: true,
        authId,
        expiresAt: authorization.expiresAt
      };
    } catch (error) {
      console.error("Pay-per-stream authorization error:", error);
      throw error;
    }
  }

  /**
   * Promotional access management
   */
  async grantPromotionalAccess(userId, promotionCode, contentIds = []) {
    try {
      // Validate promotion code
      const promotion = await this.validatePromotionCode(promotionCode);
      if (!promotion.valid) {
        return { granted: false, reason: promotion.reason };
      }

      // Create promotional access record
      const accessRecord = {
        userId,
        promotionCode,
        contentIds,
        grantedAt: new Date().toISOString(),
        expiresAt: promotion.expiresAt,
        type: promotion.type,
        metadata: promotion.metadata
      };

      await setDoc(doc(collection(db, "promotionalAccess")), accessRecord);

      // Update user profile with promotional access
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        promotionalAccess: {
          active: true,
          code: promotionCode,
          expiresAt: promotion.expiresAt,
          contentIds
        }
      });

      return { granted: true, access: accessRecord };
    } catch (error) {
      console.error("Promotional access error:", error);
      throw error;
    }
  }

  /**
   * Rate limiting and abuse prevention
   */
  async checkRateLimit(userId, action, timeWindow = 3600) {
    const cacheKey = `rate_limit_${userId}_${action}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < timeWindow * 1000) {
      if (cached.count >= this.getRateLimit(action)) {
        return {
          allowed: false,
          retryAfter:
            timeWindow - Math.floor((Date.now() - cached.timestamp) / 1000)
        };
      }
      cached.count++;
    } else {
      this.cache.set(cacheKey, {
        count: 1,
        timestamp: Date.now()
      });
    }

    return { allowed: true };
  }

  /**
   * Helper methods
   */
  async getUserProfile(userId) {
    const cacheKey = `user_${userId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    this.cache.set(cacheKey, {
      data: userData,
      timestamp: Date.now()
    });

    return userData;
  }

  async getContentMetadata(contentId) {
    const cacheKey = `content_${contentId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    const contentRef = doc(db, "content", contentId);
    const contentDoc = await getDoc(contentRef);

    if (!contentDoc.exists()) {
      return null;
    }

    const contentData = contentDoc.data();
    this.cache.set(cacheKey, {
      data: contentData,
      timestamp: Date.now()
    });

    return contentData;
  }

  async getUserLocation(userId) {
    // This would integrate with your location service
    // For now, return cached or default location
    return {
      country: "US",
      region: "CA",
      city: "San Francisco"
    };
  }

  async getHourlySkips(userId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const skipsQuery = query(
      collection(db, "usage"),
      where("userId", "==", userId),
      where("usageType", "==", "skip"),
      where("timestamp", ">=", oneHourAgo),
    );

    const skipsSnapshot = await getDocs(skipsQuery);
    return skipsSnapshot.size;
  }

  isEUCountry(countryCode) {
    const euCountries = [
      "AT",
      "BE",
      "BG",
      "HR",
      "CY",
      "CZ",
      "DK",
      "EE",
      "FI",
      "FR",
      "DE",
      "GR",
      "HU",
      "IE",
      "IT",
      "LV",
      "LT",
      "LU",
      "MT",
      "NL",
      "PL",
      "PT",
      "RO",
      "SK",
      "SI",
      "ES",
      "SE",
    ];
    return euCountries.includes(countryCode);
  }

  getUserPermissions(userProfile) {
    const tier = SUBSCRIPTION_TIERS[userProfile.subscription.tier];
    return tier ? tier.permissions : [];
  }

  getActiveRestrictions(userProfile) {
    const tier = SUBSCRIPTION_TIERS[userProfile.subscription.tier];
    return tier ? tier.restrictions : {};
  }

  calculateEndDate(tier) {
    if (tier.id === "FREE") return null;

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    return endDate.toISOString();
  }

  generateAuthId() {
    return "auth_" + Math.random().toString(36).substr(2, 16);
  }

  calculateAuthExpiry(minutes) {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + minutes);
    return expiry.toISOString();
  }

  async validatePromotionCode(code) {
    // Implementation would check against promotions collection
    return {
      valid: true,
      type: "trial_access",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {}
    };
  }

  getRateLimit(action) {
    const limits = {
      stream: 100,
      download: 20,
      skip: 50,
      like: 30
    };
    return limits[action] || 10;
  }

  async trackSubscriptionChange(userId, fromTier, toTier) {
    const changeRecord = {
      userId,
      fromTier,
      toTier,
      timestamp: new Date().toISOString(),
      type: "subscription_change"
    };

    await setDoc(doc(collection(db, "subscriptionChanges")), changeRecord);
  }

  async downgradeToFree(userId) {
    const freeSubscription = {
      tier: "FREE",
      status: "active",
      features: SUBSCRIPTION_TIERS.FREE.features,
      permissions: SUBSCRIPTION_TIERS.FREE.permissions
    };

    await updateDoc(doc(db, "users", userId), {
      subscription: freeSubscription,
      updatedAt: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const entitlementService = new EntitlementService();
export default entitlementService;
