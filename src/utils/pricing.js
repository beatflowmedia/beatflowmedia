// src/utils/pricing.js
//
// Pricing for songs and albums. SINGLE SOURCE for both this app and the station.
//
// CommonJS on purpose. The station repo (C:/Users/percy/RadioStation/radio) seeds
// this catalogue and has to price what it seeds, so it needs the same arithmetic.
// It previously regex-scraped the constants out of this file and reimplemented the
// formula, which silently priced every album differently from what this file said --
// a catalogue disagreeing with a checkout. Exporting through module.exports lets it
// `require` this file instead of reading it.
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
 * Album multiplier.
 *
 * An album costs its track count times the single price. There is no bundle
 * discount, so this is 1.
 *
 * The constant is kept rather than deleted because the station's catalog.js reads
 * it BY NAME and falls back to its own hardcoded 0.75 when it cannot find one.
 * Removing it here would silently restore a 25% discount on the station's side
 * while this file said otherwise -- the exact class of drift this module exists to
 * end.
 */
const ALBUM_DISCOUNT = 1;

/**
 * Album license price in cents: track count x the single price.
 *
 * No rounding. An earlier rule rounded up to the nearest .99, which is why a
 * 10-track album came out at $217.99 rather than a round multiple of its tracks.
 * That rule is gone: an album now costs exactly what its tracks cost.
 *
 * The station computes Math.round(trackCount * song * albumDiscount) from these same
 * two constants, which equals this for every whole track count -- so both systems
 * agree without the station needing any change.
 *
 * @param {number} trackCount - Number of tracks in the album
 * @returns {number} Price in cents
 *
 * @example
 * calculateAlbumPrice(1)  // 199   ($1.99)
 * calculateAlbumPrice(5)  // 995   ($9.95)
 * calculateAlbumPrice(10) // 1990  ($19.90)
 * calculateAlbumPrice(12) // 2388  ($23.88)
 */
function calculateAlbumPrice(trackCount) {
  if (!trackCount || trackCount < 1) {
    return SONG_PRICE; // No track count is not an album; fall back to a single.
  }

  return Math.round(trackCount * SONG_PRICE * ALBUM_DISCOUNT);
}

/**
 * Format a price in cents for display.
 * @param {number} priceInCents
 * @returns {string} e.g. "$19.90"
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
