// src/data/discountTiers.js
// Subscriber discount rates for per-track/per-album perpetual license purchases

/**
 * Discount rates by subscription tier
 * These discounts apply when subscribers purchase perpetual licenses for individual tracks/albums
 *
 * Business Logic:
 * - Subscribers get access to the catalog while subscribed (time-bound licenses)
 * - Additionally, they can purchase perpetual licenses at discounted rates
 * - Perpetual licenses survive subscription cancellation
 *
 * Pricing Example (for $29 track):
 * - Non-subscriber: $29.00 (full price)
 * - Student: $23.20 (20% off)
 * - Creator: $20.30 (30% off)
 * - Pro: $17.40 (40% off)
 * - Agency: $14.50 (50% off)
 */

export const DISCOUNT_RATES = {
  // No subscription = no discount
  none: 0,

  // Student tier: 20% off perpetual licenses
  student: 0.20,

  // Creator tier: 30% off perpetual licenses
  creator: 0.30,

  // Pro tier: 40% off perpetual licenses
  pro: 0.40,

  // Agency tier: 50% off perpetual licenses
  agency: 0.50
};

/**
 * Get discount rate for a subscription tier
 * @param {string} tier - Subscription tier (student, creator, pro, agency)
 * @returns {number} Discount rate (0-1)
 */
export const getDiscountRate = (tier) => {
  if (!tier) return DISCOUNT_RATES.none;

  const normalizedTier = tier.toLowerCase();
  return DISCOUNT_RATES[normalizedTier] || DISCOUNT_RATES.none;
};

/**
 * Calculate discounted price
 * @param {number} originalPrice - Original price in cents
 * @param {string} tier - Subscription tier
 * @returns {number} Discounted price in cents
 */
export const calculateDiscountedPrice = (originalPrice, tier) => {
  const discountRate = getDiscountRate(tier);
  const discount = Math.round(originalPrice * discountRate);
  return originalPrice - discount;
};

/**
 * Calculate savings amount
 * @param {number} originalPrice - Original price in cents
 * @param {string} tier - Subscription tier
 * @returns {number} Savings in cents
 */
export const calculateSavings = (originalPrice, tier) => {
  const discountRate = getDiscountRate(tier);
  return Math.round(originalPrice * discountRate);
};

/**
 * Format discount percentage for display
 * @param {string} tier - Subscription tier
 * @returns {string} Formatted discount (e.g., "30% off")
 */
export const formatDiscountPercentage = (tier) => {
  const discountRate = getDiscountRate(tier);
  if (discountRate === 0) return null;

  const percentage = Math.round(discountRate * 100);
  return `${percentage}% off`;
};

/**
 * Get discount badge text
 * @param {string} tier - Subscription tier
 * @returns {string|null} Badge text or null if no discount
 */
export const getDiscountBadge = (tier) => {
  const discountRate = getDiscountRate(tier);
  if (discountRate === 0) return null;

  const percentage = Math.round(discountRate * 100);
  return `Subscriber Discount: ${percentage}% off`;
};

/**
 * Check if user has subscriber discount eligibility
 * @param {object} subscriptionInfo - User's subscription info
 * @returns {boolean} True if user is eligible for discounts
 */
export const hasSubscriberDiscount = (subscriptionInfo) => {
  if (!subscriptionInfo) return false;
  if (!subscriptionInfo.active) return false;

  const tier = subscriptionInfo.tier?.toLowerCase();
  return DISCOUNT_RATES[tier] > 0;
};

/**
 * Get subscriber pricing info for display
 * @param {number} originalPrice - Original price in cents
 * @param {string} tier - Subscription tier
 * @returns {object} Pricing info object
 */
export const getSubscriberPricingInfo = (originalPrice, tier) => {
  const discountRate = getDiscountRate(tier);

  if (discountRate === 0) {
    return {
      hasDiscount: false,
      originalPrice,
      discountedPrice: originalPrice,
      savings: 0,
      discountPercentage: 0
    };
  }

  return {
    hasDiscount: true,
    originalPrice,
    discountedPrice: calculateDiscountedPrice(originalPrice, tier),
    savings: calculateSavings(originalPrice, tier),
    discountPercentage: Math.round(discountRate * 100)
  };
};

export default {
  DISCOUNT_RATES,
  getDiscountRate,
  calculateDiscountedPrice,
  calculateSavings,
  formatDiscountPercentage,
  getDiscountBadge,
  hasSubscriberDiscount,
  getSubscriberPricingInfo
};
