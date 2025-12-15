// src/services/membershipService.js
// Service for managing artist membership status

import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Check if user has an active artist membership
 * @param {string} userId
 * @returns {Promise<{active: boolean, expiresAt: Date|null, daysRemaining: number|null}>}
 */
export async function checkMembershipStatus(userId) {
  if (!userId) {
    return { active: false, expiresAt: null, daysRemaining: null };
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      return { active: false, expiresAt: null, daysRemaining: null };
    }

    const userData = userDoc.data();
    const isActive = userData.artistMembershipActive || false;
    const expiresAt = userData.membershipExpiresAt?.toDate() || null;

    // Calculate days remaining
    let daysRemaining = null;
    if (expiresAt) {
      const now = new Date();
      const diffTime = expiresAt.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      active: isActive && (expiresAt ? expiresAt > new Date() : false),
      expiresAt,
      daysRemaining,
      subscriptionId: userData.stripeSubscriptionId || null
    };
  } catch (error) {
    console.error('Error checking membership status:', error);
    return { active: false, expiresAt: null, daysRemaining: null };
  }
}

/**
 * Get membership details for display
 * @param {string} userId
 * @returns {Promise<object>}
 */
export async function getMembershipDetails(userId) {
  if (!userId) return null;

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) return null;

    const userData = userDoc.data();

    return {
      active: userData.artistMembershipActive || false,
      type: userData.membershipType || null,
      startedAt: userData.membershipStartedAt?.toDate() || null,
      expiresAt: userData.membershipExpiresAt?.toDate() || null,
      subscriptionId: userData.stripeSubscriptionId || null,
      customerId: userData.stripeCustomerId || null,
      status: userData.subscriptionStatus || null
    };
  } catch (error) {
    console.error('Error getting membership details:', error);
    return null;
  }
}

/**
 * Check if user needs to renew membership soon (within 30 days)
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function needsRenewalSoon(userId) {
  const status = await checkMembershipStatus(userId);
  return status.active && status.daysRemaining !== null && status.daysRemaining <= 30;
}
