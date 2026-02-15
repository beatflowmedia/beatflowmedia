// src/services/licenseService.js
// License tracking and validation service for Hybrid Model
import { db } from '../firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getDiscountRate, calculateDiscountedPrice, getSubscriberPricingInfo } from '../data/discountTiers';

/**
 * License Service
 * Manages time-bound licenses for the Hybrid Model
 *
 * Key Concepts:
 * - Downloads while subscribed = can use in projects
 * - Published content while subscribed = licensed forever
 * - Subscription ends = can't use downloads in NEW projects
 * - Published content retains license even after cancellation
 */

/**
 * Create a license record when user downloads a track
 * @param {string} userId - User ID
 * @param {string} trackId - Track ID
 * @param {string} subscriptionId - Stripe subscription ID
 * @param {string} tier - Subscription tier (student, creator, pro, agency)
 * @returns {Promise<string>} License ID
 */
export const createDownloadLicense = async (userId, trackId, subscriptionId, tier) => {
  try {
    const licenseId = `lic_${userId}_${trackId}_${Date.now()}`;

    const licenseData = {
      licenseId,
      userId,
      trackId,
      subscriptionId,
      tier,
      licenseType: 'time-bound', // Can be 'time-bound' or 'perpetual'
      status: 'active', // active, expired, revoked
      downloadedAt: serverTimestamp(),
      validWhileSubscribed: true,
      publishedProjects: [], // Array of registered project URLs
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'licenses', licenseId), licenseData);

    console.log(`✓ License created: ${licenseId}`);
    return licenseId;
  } catch (error) {
    console.error('Error creating license:', error);
    throw new Error(`Failed to create license: ${error.message}`);
  }
};

/**
 * Register a published project to lock in perpetual license for that content
 * @param {string} userId - User ID
 * @param {string} projectUrl - URL of published content (YouTube, etc.)
 * @param {string[]} trackIds - Array of track IDs used in project
 * @param {string} subscriptionId - Current subscription ID
 * @returns {Promise<string>} Project registration ID
 */
export const registerPublishedProject = async (userId, projectUrl, trackIds, subscriptionId) => {
  try {
    const projectId = `proj_${userId}_${Date.now()}`;

    const projectData = {
      projectId,
      userId,
      projectUrl,
      trackIds,
      subscriptionId,
      platform: detectPlatform(projectUrl),
      registeredAt: serverTimestamp(),
      licenseLockedIn: true, // This project retains license forever
      status: 'active',
      createdAt: serverTimestamp()
    };

    // Create project registration
    await setDoc(doc(db, 'publishedProjects', projectId), projectData);

    // Update license records to include this project
    for (const trackId of trackIds) {
      await addProjectToLicense(userId, trackId, projectId, projectUrl);
    }

    console.log(`✓ Project registered: ${projectId}`);
    return projectId;
  } catch (error) {
    console.error('Error registering project:', error);
    throw new Error(`Failed to register project: ${error.message}`);
  }
};

/**
 * Add a published project to a license record
 * @param {string} userId - User ID
 * @param {string} trackId - Track ID
 * @param {string} projectId - Project ID
 * @param {string} projectUrl - Project URL
 */
const addProjectToLicense = async (userId, trackId, projectId, projectUrl) => {
  try {
    // Find the license for this user/track combination
    const licensesRef = collection(db, 'licenses');
    const q = query(
      licensesRef,
      where('userId', '==', userId),
      where('trackId', '==', trackId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn(`No active license found for user ${userId}, track ${trackId}`);
      return;
    }

    // Update the first matching license (should only be one)
    const licenseDoc = snapshot.docs[0];
    const currentProjects = licenseDoc.data().publishedProjects || [];

    await updateDoc(doc(db, 'licenses', licenseDoc.id), {
      publishedProjects: [
        ...currentProjects,
        {
          projectId,
          projectUrl,
          registeredAt: serverTimestamp()
        }
      ],
      updatedAt: serverTimestamp()
    });

    console.log(`✓ Added project to license: ${licenseDoc.id}`);
  } catch (error) {
    console.error('Error adding project to license:', error);
  }
};

/**
 * Check if a user can use a track in a new project
 * @param {string} userId - User ID
 * @param {string} trackId - Track ID
 * @returns {Promise<Object>} License status and details
 */
export const validateLicense = async (userId, trackId) => {
  try {
    // Get user's active subscription
    const subscription = await getUserActiveSubscription(userId);

    // Find license for this track
    const licensesRef = collection(db, 'licenses');
    const q = query(
      licensesRef,
      where('userId', '==', userId),
      where('trackId', '==', trackId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return {
        isValid: false,
        reason: 'no-license',
        message: 'Track not downloaded. Subscribe to download and use this track.'
      };
    }

    const license = snapshot.docs[0].data();

    // Check license type
    if (license.licenseType === 'perpetual') {
      return {
        isValid: true,
        reason: 'perpetual-license',
        message: 'You own a perpetual license for this track.'
      };
    }

    // Time-bound license - check subscription status
    if (!subscription || subscription.status !== 'active') {
      return {
        isValid: false,
        reason: 'subscription-inactive',
        message: 'Active subscription required to use this track in new projects. Published content stays licensed.',
        publishedProjects: license.publishedProjects || []
      };
    }

    return {
      isValid: true,
      reason: 'active-subscription',
      message: 'You can use this track in new projects while your subscription is active.',
      subscription
    };
  } catch (error) {
    console.error('Error validating license:', error);
    return {
      isValid: false,
      reason: 'error',
      message: 'Error checking license. Please contact support.'
    };
  }
};

/**
 * Get user's active subscription from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Subscription object or null
 */
const getUserActiveSubscription = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    const subscription = userData.subscription;

    if (!subscription) {
      return null;
    }

    // Check if subscription is active
    if (subscription.status !== 'active') {
      return null;
    }

    // Check if subscription is expired
    if (subscription.currentPeriodEnd) {
      const endDate = subscription.currentPeriodEnd.toDate();
      if (endDate < new Date()) {
        return null;
      }
    }

    return subscription;
  } catch (error) {
    console.error('Error getting subscription:', error);
    return null;
  }
};

/**
 * Handle subscription cancellation - mark licenses as published-only
 * Called from Stripe webhook when subscription is cancelled
 * @param {string} userId - User ID
 * @param {string} subscriptionId - Stripe subscription ID
 */
export const handleSubscriptionCancellation = async (userId, subscriptionId) => {
  try {
    // Find all licenses for this subscription
    const licensesRef = collection(db, 'licenses');
    const q = query(
      licensesRef,
      where('userId', '==', userId),
      where('subscriptionId', '==', subscriptionId),
      where('licenseType', '==', 'time-bound')
    );

    const snapshot = await getDocs(q);

    console.log(`Processing ${snapshot.size} licenses for cancelled subscription ${subscriptionId}`);

    // Update each license
    const updatePromises = snapshot.docs.map(async (licenseDoc) => {
      const license = licenseDoc.data();

      await updateDoc(doc(db, 'licenses', licenseDoc.id), {
        status: 'published-only', // Can't use in new projects
        validWhileSubscribed: false,
        subscriptionEndedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        note: 'Subscription cancelled. Published projects retain license. Cannot use in new projects.'
      });

      console.log(`✓ Updated license ${licenseDoc.id} to published-only`);
    });

    await Promise.all(updatePromises);

    console.log(`✓ Processed cancellation for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
    throw error;
  }
};

/**
 * Get all licenses for a user (for dashboard display)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of license objects
 */
export const getUserLicenses = async (userId) => {
  try {
    const licensesRef = collection(db, 'licenses');
    const q = query(licensesRef, where('userId', '==', userId));

    const snapshot = await getDocs(q);

    const licenses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return licenses;
  } catch (error) {
    console.error('Error getting user licenses:', error);
    return [];
  }
};

/**
 * Get all published projects for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of project objects
 */
export const getUserPublishedProjects = async (userId) => {
  try {
    const projectsRef = collection(db, 'publishedProjects');
    const q = query(projectsRef, where('userId', '==', userId));

    const snapshot = await getDocs(q);

    const projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return projects;
  } catch (error) {
    console.error('Error getting published projects:', error);
    return [];
  }
};

/**
 * Detect platform from URL
 * @param {string} url - Project URL
 * @returns {string} Platform name
 */
const detectPlatform = (url) => {
  if (!url) return 'unknown';

  const urlLower = url.toLowerCase();

  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'youtube';
  }
  if (urlLower.includes('tiktok.com')) {
    return 'tiktok';
  }
  if (urlLower.includes('instagram.com')) {
    return 'instagram';
  }
  if (urlLower.includes('vimeo.com')) {
    return 'vimeo';
  }
  if (urlLower.includes('spotify.com')) {
    return 'spotify';
  }
  if (urlLower.includes('soundcloud.com')) {
    return 'soundcloud';
  }

  return 'other';
};

/**
 * Upgrade a time-bound license to perpetual
 * For users who purchase the perpetual upgrade ($499/year)
 * @param {string} userId - User ID
 * @param {string[]} trackIds - Array of track IDs to upgrade (or 'all')
 * @param {string} paymentId - Stripe payment ID for the upgrade
 */
export const upgradeToPerpetualLicense = async (userId, trackIds, paymentId) => {
  try {
    const licensesRef = collection(db, 'licenses');
    let q;

    if (trackIds === 'all') {
      // Upgrade all user's licenses
      q = query(licensesRef, where('userId', '==', userId));
    } else {
      // Upgrade specific tracks
      q = query(
        licensesRef,
        where('userId', '==', userId),
        where('trackId', 'in', trackIds)
      );
    }

    const snapshot = await getDocs(q);

    const updatePromises = snapshot.docs.map(async (licenseDoc) => {
      await updateDoc(doc(db, 'licenses', licenseDoc.id), {
        licenseType: 'perpetual',
        status: 'active',
        validWhileSubscribed: false, // No longer dependent on subscription
        upgradedToPerpetual: true,
        perpetualUpgradePaymentId: paymentId,
        perpetualUpgradeDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
        note: 'Upgraded to perpetual license. Use in unlimited projects forever.'
      });
    });

    await Promise.all(updatePromises);

    console.log(`✓ Upgraded ${snapshot.size} licenses to perpetual for user ${userId}`);
    return snapshot.size;
  } catch (error) {
    console.error('Error upgrading to perpetual:', error);
    throw error;
  }
};

/**
 * Create a perpetual license for a purchased track
 * Used when subscribers purchase individual tracks at discounted rates
 * @param {string} userId - User ID
 * @param {string} trackId - Track ID
 * @param {string} purchaseId - Stripe payment intent or session ID
 * @param {string} tier - Subscription tier at time of purchase (for record keeping)
 * @param {number} price - Price paid in cents
 * @returns {Promise<string>} License ID
 */
export const createPerpetualLicense = async (userId, trackId, purchaseId, tier = null, price = null) => {
  try {
    const licenseId = `lic_perp_${userId}_${trackId}_${Date.now()}`;

    const licenseData = {
      licenseId,
      userId,
      trackId,
      purchaseId,
      tier: tier || 'none', // Track what tier user had when purchasing
      licenseType: 'perpetual',
      status: 'active',
      purchasedAt: serverTimestamp(),
      validWhileSubscribed: false, // Not tied to subscription
      pricePaid: price,
      note: 'Perpetual license via individual track purchase',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'licenses', licenseId), licenseData);
    console.log(`✓ Created perpetual license ${licenseId} for track ${trackId}`);
    return licenseId;
  } catch (error) {
    console.error('Error creating perpetual license:', error);
    throw error;
  }
};

/**
 * Get subscriber discount info for a user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Discount info { tier, discountRate, hasDiscount }
 */
export const getSubscriberDiscount = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      return { tier: null, discountRate: 0, hasDiscount: false };
    }

    const userData = userDoc.data();
    const subscription = userData.subscription;

    // Check if user has active subscription
    if (!subscription || subscription.status !== 'active') {
      return { tier: null, discountRate: 0, hasDiscount: false };
    }

    const tier = subscription.tier?.toLowerCase();
    const discountRate = getDiscountRate(tier);

    return {
      tier,
      discountRate,
      hasDiscount: discountRate > 0,
      subscription
    };
  } catch (error) {
    console.error('Error getting subscriber discount:', error);
    return { tier: null, discountRate: 0, hasDiscount: false };
  }
};

/**
 * Calculate discounted price for a track purchase
 * @param {string} userId - User ID
 * @param {number} originalPrice - Original price in cents
 * @returns {Promise<object>} Pricing info
 */
export const calculateTrackPricing = async (userId, originalPrice) => {
  const discountInfo = await getSubscriberDiscount(userId);

  if (!discountInfo.hasDiscount) {
    return {
      originalPrice,
      discountedPrice: originalPrice,
      savings: 0,
      tier: null,
      hasDiscount: false
    };
  }

  return {
    originalPrice,
    discountedPrice: calculateDiscountedPrice(originalPrice, discountInfo.tier),
    savings: originalPrice - calculateDiscountedPrice(originalPrice, discountInfo.tier),
    tier: discountInfo.tier,
    hasDiscount: true,
    discountRate: discountInfo.discountRate
  };
};

export default {
  createDownloadLicense,
  registerPublishedProject,
  validateLicense,
  handleSubscriptionCancellation,
  getUserLicenses,
  getUserPublishedProjects,
  upgradeToPerpetualLicense,
  createPerpetualLicense,
  getSubscriberDiscount,
  calculateTrackPricing
};
