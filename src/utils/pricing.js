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
 * Kept at 1 because the per-track rate is not where the bundle saving comes from
 * any more -- ALBUM_PRICE_CAP below is. Deleting it is NOT safe: the station's
 * catalog.js reads it BY NAME out of this file and falls back to its own hardcoded
 * 0.75 when it cannot find one, so removing it would silently restore a 25%
 * discount on the station's side while this file said otherwise.
 */
const ALBUM_DISCOUNT = 1;

/**
 * Lowest price an album may carry, in cents. $4.99.
 *
 * This is a CHART ELIGIBILITY threshold, not a margin decision. The DSP PRD sets
 * minimum prices for a direct sale to be reportable to Luminate ($0.69 a single,
 * $4.99 an album); a release priced below it still sells, it just never counts
 * toward a chart. That is the worst kind of failure -- the transaction succeeds and
 * the thing it was supposed to achieve silently does not happen.
 *
 * It does not bind anything in the catalogue today: all 12 releases run 9-19 tracks
 * and clear it comfortably. It exists for the first 1- or 2-track release, which is
 * exactly when nobody will be thinking about Luminate.
 *
 * KNOWN CONSEQUENCE: at 1 or 2 tracks the floor makes the "album" cost MORE than
 * buying the tracks separately ($4.99 vs $1.99/$3.98). That inversion is accepted
 * rather than fixed, because a 1-2 track release is a single or an EP, and the
 * honest fix is to stop calling it an album -- a classification decision, not a
 * pricing one.
 */
const ALBUM_PRICE_FLOOR = 499;

/**
 * Highest price an album may carry, in cents. $11.99.
 *
 * THIS is the bundle discount, and it is a cap rather than a percentage on purpose.
 *
 * Under the old rule an album cost exactly its tracks, so the saving for buying the
 * album was always exactly zero and a buyer had no reason to ever choose it --
 * PurchaseOptionsDialog's "Save $X vs buying separately" note was unreachable code.
 * A percentage would have fixed that for a 10-track album and still left a 19-track
 * album at $22.69, roughly twice what a digital album sells for anywhere.
 *
 * A cap fixes both ends at once: it puts every substantial album at the market rate
 * (iTunes and Bandcamp both sit in the $9.99-$11.99 band) and it makes the saving
 * grow with the size of the release, which is the correct incentive -- $7.91 on a
 * 10-track album, $25.82 on a 19-track one.
 */
const ALBUM_PRICE_CAP = 1199;

/**
 * Album license price in cents: the track count at the single price, held between
 * the chart-eligibility floor and the market cap.
 *
 * COMMERCIAL RELEASES ONLY -- the COMMERCIAL_RELEASE pool in assetPools.js, which is
 * 134 of the 138 records. Production-library packs are priced by
 * calculateBundlePrice below, because the cap here is a CONSUMER ceiling and would
 * underprice a commercial-use licence.
 *
 *     clamp(trackCount x SONG_PRICE, ALBUM_PRICE_FLOOR, ALBUM_PRICE_CAP)
 *
 * Every number is derived from the three constants above. An earlier rule rounded up
 * to the nearest .99, which is why a 10-track album once came out at $217.99; that
 * is gone, and nothing here is typed by hand.
 *
 * THE STATION DOES NOT USE THIS FUNCTION UNLESS IT REQUIRES IT. catalog.js scrapes
 * SONG_PRICE and ALBUM_DISCOUNT out of this file with a regex and recomputes
 * Math.round(n * song * albumDiscount) itself, which has no floor and no cap. That
 * was harmless while the rule was a bare multiplication and is not harmless now:
 * the station seeds the `price` field, create-checkout charges the STORED price, so
 * a scraping station would quietly sell a 19-track album for $37.81 while this file
 * said $11.99. The station has been changed to require calculateAlbumPrice directly;
 * if that ever regresses, `npx jest src/utils/pricing.test.js` will not catch it --
 * `node catalog.js diff` in the station repo will.
 *
 * @param {number} trackCount - Number of tracks in the album
 * @returns {number} Price in cents
 *
 * @example
 * calculateAlbumPrice(1)  // 499   ($4.99)  floor
 * calculateAlbumPrice(3)  // 597   ($5.97)  per-track
 * calculateAlbumPrice(5)  // 995   ($9.95)  per-track
 * calculateAlbumPrice(10) // 1199  ($11.99) cap
 * calculateAlbumPrice(19) // 1199  ($11.99) cap
 */
function calculateAlbumPrice(trackCount) {
  if (!trackCount || trackCount < 1) {
    // No track count is not an album, so this is not clamped to the album floor --
    // it falls back to a single, which is what an unknown release is cheapest
    // treated as. Distinct from calculateAlbumPrice(1), which IS an album.
    return SONG_PRICE;
  }

  const perTrack = Math.round(trackCount * SONG_PRICE * ALBUM_DISCOUNT);
  return Math.min(ALBUM_PRICE_CAP, Math.max(ALBUM_PRICE_FLOOR, perTrack));
}

/**
 * Price for a PRODUCTION LIBRARY bundle -- a pack of library tracks licensed to a
 * creator -- in cents.
 *
 * SEPARATE FROM calculateAlbumPrice ON PURPOSE, and the reason is the cap.
 *
 * ALBUM_PRICE_CAP is a CONSUMER ceiling: $11.99 is what a listener pays for an album
 * they will listen to, and it is anchored to what iTunes and Bandcamp charge. A
 * production-library pack is not that. It is a commercial-use licence sold to
 * someone who will put the music in their own product, and the ceiling on that is
 * set by Epidemic and Artlist, not by iTunes. Routing a library pack through
 * calculateAlbumPrice would silently cap a commercial licence at a consumer price --
 * the most expensive kind of mistake this file can make, because it underprices
 * quietly and every sale looks successful.
 *
 * So there is a floor here and deliberately NO cap: a bigger pack costs more.
 *
 * THE DISCOUNT IS A REQUIRED ARGUMENT, not a constant with a default. A bundle
 * discount on the library is permitted, but the rate is a business decision that has
 * not been made, and a default would be that decision made silently by whoever wrote
 * the line. Callers must pass one, which forces the question to a person.
 *
 * @param {number} trackCount   - tracks in the pack
 * @param {number} discount     - multiplier in (0, 1]; 1 means no bundle discount,
 *                                0.75 means 25% off. Required.
 * @returns {number} Price in cents
 *
 * @example
 * calculateBundlePrice(10, 1)     // 1990  ($19.90) no discount
 * calculateBundlePrice(10, 0.75)  // 1493  ($14.93) 25% off
 * calculateBundlePrice(50, 0.6)   // 5970  ($59.70) no consumer cap applies
 */
function calculateBundlePrice(trackCount, discount) {
  if (!Number.isFinite(discount) || discount <= 0 || discount > 1) {
    throw new TypeError(
      'calculateBundlePrice requires an explicit discount multiplier in (0, 1]. ' +
      'Pass 1 for no discount. There is no default because the rate is a pricing ' +
      'decision, not an implementation detail.'
    );
  }

  if (!trackCount || trackCount < 1) return SONG_PRICE;

  const raw = Math.round(trackCount * SONG_PRICE * discount);
  // Floor only. The consumer album cap is intentionally not applied here.
  return Math.max(ALBUM_PRICE_FLOOR, raw);
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
  ALBUM_PRICE_FLOOR,
  ALBUM_PRICE_CAP,
  calculateAlbumPrice,
  calculateBundlePrice,
  formatPrice
};
