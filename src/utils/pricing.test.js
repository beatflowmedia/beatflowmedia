// Pins the pricing rule.
//
// Worth having because this file has been wrong before: two of the four JSDoc
// examples disagreed with the implementation, and the constant disagreed with the
// business-model document AND with what production charged. A comment can be wrong
// indefinitely; a test asserting the same numbers cannot.

const {
  SONG_PRICE, ALBUM_DISCOUNT, ALBUM_PRICE_FLOOR, ALBUM_PRICE_CAP,
  calculateAlbumPrice, calculateBundlePrice, formatPrice
} = require('./pricing');

describe('pricing constants', () => {
  test('are the values the station and the checkout both depend on', () => {
    expect(SONG_PRICE).toBe(199);
    // 1, not 0.75. The bundle saving comes from ALBUM_PRICE_CAP, not from a
    // per-track discount. The constant is kept rather than deleted because the
    // station reads it by name and falls back to its own 0.75 if it is absent,
    // which would silently reintroduce a 25% discount.
    expect(ALBUM_DISCOUNT).toBe(1);
  });

  test('the single clears the chart-eligibility floor for a track', () => {
    // PRD 3.3: $0.69 a single. Below it a sale still happens and simply never
    // reaches a chart, so nothing fails visibly -- hence the assertion.
    expect(SONG_PRICE).toBeGreaterThanOrEqual(69);
  });

  test('album floor and cap are the PRD and market numbers', () => {
    expect(ALBUM_PRICE_FLOOR).toBe(499);   // $4.99, PRD 3.3 chart eligibility
    expect(ALBUM_PRICE_CAP).toBe(1199);    // $11.99, iTunes/Bandcamp band
    expect(ALBUM_PRICE_FLOOR).toBeLessThan(ALBUM_PRICE_CAP);
  });
});

describe('calculateAlbumPrice', () => {
  test('matches every example in its own JSDoc', () => {
    expect(calculateAlbumPrice(1)).toBe(499);    // floor
    expect(calculateAlbumPrice(3)).toBe(597);    // per-track
    expect(calculateAlbumPrice(5)).toBe(995);    // per-track
    expect(calculateAlbumPrice(10)).toBe(1199);  // cap
    expect(calculateAlbumPrice(19)).toBe(1199);  // cap
  });

  test('is the track count at the single price, clamped to floor and cap', () => {
    // The rule, stated directly, for every plausible album size.
    for (let n = 1; n <= 40; n += 1) {
      const expected = Math.min(ALBUM_PRICE_CAP, Math.max(ALBUM_PRICE_FLOOR, n * SONG_PRICE));
      expect(calculateAlbumPrice(n)).toBe(expected);
    }
  });

  test('never prices an album outside the floor and the cap', () => {
    // The invariant the two constants exist to guarantee. A release priced under
    // the floor is unreportable to Luminate; one priced over the cap is off-market.
    for (let n = 1; n <= 200; n += 1) {
      const price = calculateAlbumPrice(n);
      expect(price).toBeGreaterThanOrEqual(ALBUM_PRICE_FLOOR);
      expect(price).toBeLessThanOrEqual(ALBUM_PRICE_CAP);
    }
  });

  test('every real release in the catalogue is chart-eligible', () => {
    // The live catalogue runs 9-19 tracks. This is the assertion that would have
    // caught the old rule pricing a 19-track album at $37.81.
    for (const n of [9, 10, 11, 12, 19]) {
      expect(calculateAlbumPrice(n)).toBeGreaterThanOrEqual(ALBUM_PRICE_FLOOR);
      expect(calculateAlbumPrice(n)).toBe(ALBUM_PRICE_CAP);
    }
  });

  test('buying the album beats buying its tracks, once it is a real album', () => {
    // The whole point of the cap. Under the previous rule this saving was exactly
    // zero at every track count, which made PurchaseOptionsDialog's
    // "Save $X vs buying separately" note unreachable code.
    for (const n of [9, 10, 12, 19]) {
      expect(calculateAlbumPrice(n)).toBeLessThan(n * SONG_PRICE);
    }
  });

  test('a 1-2 track release costs more than its tracks, knowingly', () => {
    // Documented consequence of the floor, not an oversight: at this size the
    // release is a single or an EP and should not be sold as an album at all.
    // Pinned so the inversion cannot widen unnoticed.
    expect(calculateAlbumPrice(1)).toBeGreaterThan(1 * SONG_PRICE);
    expect(calculateAlbumPrice(2)).toBeGreaterThan(2 * SONG_PRICE);
    expect(calculateAlbumPrice(3)).toBe(3 * SONG_PRICE); // parity resumes here
  });

  test('a missing or nonsensical track count falls back to a single', () => {
    expect(calculateAlbumPrice(0)).toBe(SONG_PRICE);
    expect(calculateAlbumPrice(undefined)).toBe(SONG_PRICE);
    expect(calculateAlbumPrice(null)).toBe(SONG_PRICE);
    expect(calculateAlbumPrice(-3)).toBe(SONG_PRICE);
  });
});

describe('calculateBundlePrice — the production library', () => {
  test('refuses to price a bundle without an explicit discount', () => {
    // The rate is a business decision. A default would be that decision made
    // silently by whoever wrote the call, which is how the album rule ended up with
    // a discount of 1 that nobody had chosen.
    expect(() => calculateBundlePrice(10)).toThrow(TypeError);
    expect(() => calculateBundlePrice(10, 0)).toThrow(TypeError);
    expect(() => calculateBundlePrice(10, 1.5)).toThrow(TypeError);
    expect(() => calculateBundlePrice(10, -0.5)).toThrow(TypeError);
  });

  test('applies the discount it is given', () => {
    expect(calculateBundlePrice(10, 1)).toBe(1990);
    expect(calculateBundlePrice(10, 0.75)).toBe(1493);
    expect(calculateBundlePrice(20, 0.5)).toBe(1990);
  });

  test('the CONSUMER album cap does not leak into library pricing', () => {
    // The assertion that matters. $11.99 is what a listener pays for an album; a
    // production-library pack is a commercial-use license and its ceiling is set by
    // Epidemic and Artlist, not iTunes. If the cap ever reached this function it
    // would underprice every large pack, and underpricing fails silently -- every
    // sale still succeeds.
    expect(calculateBundlePrice(50, 1)).toBeGreaterThan(ALBUM_PRICE_CAP);
    expect(calculateBundlePrice(100, 0.6)).toBeGreaterThan(ALBUM_PRICE_CAP);
    expect(calculateBundlePrice(20, 1)).toBe(20 * SONG_PRICE);
  });

  test('a bigger pack always costs at least as much as a smaller one', () => {
    for (let n = 2; n <= 60; n += 1) {
      expect(calculateBundlePrice(n, 0.75)).toBeGreaterThanOrEqual(
        calculateBundlePrice(n - 1, 0.75)
      );
    }
  });

  test('still respects the chart-eligibility floor', () => {
    expect(calculateBundlePrice(1, 0.5)).toBe(ALBUM_PRICE_FLOOR);
  });
});

describe('formatPrice', () => {
  test('renders cents as dollars with two decimals', () => {
    expect(formatPrice(199)).toBe('$1.99');
    expect(formatPrice(1990)).toBe('$19.90');
    expect(formatPrice(0)).toBe('$0.00');
  });
});

describe('requireable from outside the bundler', () => {
  test('exports through module.exports so the station can require it', () => {
    // The station repo requires this file directly rather than regex-scraping it.
    // If this module ever goes back to ESM-only, the station silently falls back to
    // its own copy of the formula and the catalogue drifts from the checkout again.
    const mod = require('./pricing');
    expect(typeof mod.calculateAlbumPrice).toBe('function');
    expect(typeof mod.formatPrice).toBe('function');
    expect(typeof mod.SONG_PRICE).toBe('number');
    expect(typeof mod.ALBUM_DISCOUNT).toBe('number');
  });
});
