// src/utils/pricing.js
// Pricing utilities for songs and albums

/**
 * Standard song price in cents
 */
export const SONG_PRICE = 199; // $1.99

/**
 * Album discount multiplier (25% off)
 */
export const ALBUM_DISCOUNT = 0.75;

/**
 * Calculate album price with .99 rounding
 * Albums are priced at (trackCount × $1.99 × 0.75) rounded up to nearest .99
 *
 * @param {number} trackCount - Number of tracks in the album
 * @returns {number} Price in cents, always ending in 99
 *
 * @example
 * calculateAlbumPrice(1)  // 199 ($1.99)
 * calculateAlbumPrice(5)  // 799 ($7.99) instead of 746 ($7.46)
 * calculateAlbumPrice(10) // 1499 ($14.99) instead of 1493 ($14.93)
 * calculateAlbumPrice(12) // 1799 ($17.99) instead of 1791 ($17.91)
 */
export function calculateAlbumPrice(trackCount) {
  if (!trackCount || trackCount < 1) {
    return SONG_PRICE; // Default to single song price
  }

  // Calculate base price with album discount
  const basePrice = trackCount * SONG_PRICE * ALBUM_DISCOUNT;

  // Round up to nearest .99
  const dollars = Math.floor(basePrice / 100);
  return dollars * 100 + 99;
}

/**
 * Format price in cents to display string
 * @param {number} priceInCents - Price in cents
 * @returns {string} Formatted price (e.g., "$12.99")
 */
export function formatPrice(priceInCents) {
  return `$${(priceInCents / 100).toFixed(2)}`;
}
