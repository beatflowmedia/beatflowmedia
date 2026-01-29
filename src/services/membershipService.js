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

    // Artist subscription fields (namespaced to avoid conflicts with listener premium)
    const isActive = userData.artistMembershipActive || false;
    const expiresAt = userData.artistMembershipExpiresAt?.toDate() || userData.membershipExpiresAt?.toDate() || null;
    const artistSubscriptionId = userData.artistStripeSubscriptionId || null;
    const artistSubscriptionStatus = userData.artistSubscriptionStatus || null;

    // Debug logging
    console.log('🔍 Membership check for user', userId);
    console.log('  artistMembershipActive:', userData.artistMembershipActive);
    console.log('  artistStripeSubscriptionId:', artistSubscriptionId);
    console.log('  artistSubscriptionStatus:', artistSubscriptionStatus);
    console.log('  artistMembershipExpiresAt:', userData.artistMembershipExpiresAt);
    console.log('  membershipExpiresAt (legacy):', userData.membershipExpiresAt);
    console.log('  expiresAt (computed):', expiresAt);

    // Check if has active artist subscription
    const hasActiveArtistSubscription = artistSubscriptionId && artistSubscriptionStatus === 'active';

    // Calculate days remaining (only for time-limited memberships, not subscriptions)
    let daysRemaining = null;
    if (expiresAt) {
      const now = new Date();
      const diffTime = expiresAt.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Artist is active if:
    // 1. Has active Stripe artist subscription (artistSubscriptionStatus === 'active'), OR
    // 2. Has artistMembershipActive flag AND expiresAt is in the future
    const active = hasActiveArtistSubscription || (isActive && expiresAt && expiresAt > new Date());

    return {
      active,
      expiresAt,
      daysRemaining,
      subscriptionId: artistSubscriptionId,
      subscriptionStatus: artistSubscriptionStatus
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
