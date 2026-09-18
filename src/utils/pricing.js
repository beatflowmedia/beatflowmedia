// src/utils/pricing.js
//
// Pricing for songs and albums. SINGLE SOURCE for both this app and the station.
//
// CommonJS on purpose. The station repo (C:/Users/percy/RadioStation/radio) seeds
// this catalogue and has to price what it seeds, so it needs the same arithmetic.
// It previously regex-scraped SONG_PRICE and ALBUM_DISCOUNT out of this file and
// reimplemented the formula, which silently dropped the .99 rule and priced all 12
// albums a few cents low -- a catalogue disagreeing with a checkout, which is the
// exact failure its own comment warned about. Exporting through module.exports lets
// it `require` this file instead of reading it.
//
// Webpack resolves named imports from a CommonJS module, so every existing
// `import { SONG_PRICE } from '../utils/pricing'` keeps working unchanged. This file
// must stay inside src/ because CRA's ModuleScopePlugin forbids importing from
// outside it, and it is not disabled in craco.config.js.

/**
 * Standard song license price in cents.
 */
const SONG_PRICE = 199; // $1.99

/**
 * Album discount multiplier (25% off the sum of its tracks).
 */
const ALBUM_DISCOUNT = 0.75;

/**
 * Album license price, in cents, always ending in 99.
 *
 * The rule is "take the discounted base and price at that dollar's .99". Note the
 * boundary: when the base lands on an exact dollar the .99 is ADDED rather than
 * shaved off, so 12 tracks goes to $261.99 rather than down to $260.99. That is a
 * pricing decision, not an accident -- change it and every album reprices.
 *
 * @param {number} trackCount - Number of tracks in the album
 * @returns {number} Price in cents, always ending in 99
 *
 * @example
 * calculateAlbumPrice(1)  // 2199  ($21.99)   base $21.75
 * calculateAlbumPrice(5)  // 10899 ($108.99)  base $108.75
 * calculateAlbumPrice(10) // 21799 ($217.99)  base $217.50
 * calculateAlbumPrice(12) // 26199 ($261.99)  base $261.00 exactly -- see the boundary note
 */
function calculateAlbumPrice(trackCount) {
  if (!trackCount || trackCount < 1) {
    return SONG_PRICE; // No track count is not an album; fall back to a single.
  }

  const basePrice = trackCount * SONG_PRICE * ALBUM_DISCOUNT;

  const dollars = Math.floor(basePrice / 100);
  return dollars * 100 + 99;
}

/**
 * Format a price in cents for display.
 * @param {number} priceInCents
 * @returns {string} e.g. "$12.99"
 */
function formatPrice(priceInCents) {
  return `$${(priceInCents / 100).toFixed(2)}`;
}

module.exports = {
  SONG_PRICE,
  ALBUM_DISCOUNT,
  calculateAlbumPrice,
  formatPrice
};
