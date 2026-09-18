// Pins the pricing rule.
//
// Worth having because this file has been wrong before: two of the four JSDoc
// examples disagreed with the implementation, and the constant disagreed with the
// business-model document AND with what production charged. A comment can be wrong
// indefinitely; a test asserting the same numbers cannot.

const { SONG_PRICE, ALBUM_DISCOUNT, calculateAlbumPrice, formatPrice } = require('./pricing');

describe('pricing constants', () => {
  test('are the values the station and the checkout both depend on', () => {
    expect(SONG_PRICE).toBe(199);
    // 1, not 0.75. There is no bundle discount. The constant is kept rather than
    // deleted because the station reads it by name and falls back to its own 0.75
    // if it is absent, which would silently reintroduce a discount.
    expect(ALBUM_DISCOUNT).toBe(1);
  });
});

describe('calculateAlbumPrice', () => {
  test('matches every example in its own JSDoc', () => {
    expect(calculateAlbumPrice(1)).toBe(199);
    expect(calculateAlbumPrice(5)).toBe(995);
    expect(calculateAlbumPrice(10)).toBe(1990);
    expect(calculateAlbumPrice(12)).toBe(2388);
  });

  test('an album costs exactly its track count times the single price', () => {
    // The rule, stated directly. No discount, no .99 rounding: an album is its
    // tracks. Any future bundle discount is a deliberate change to ALBUM_DISCOUNT
    // and will fail here first.
    for (let n = 1; n <= 40; n += 1) {
      expect(calculateAlbumPrice(n)).toBe(n * SONG_PRICE);
    }
  });

  test('agrees with the formula the station computes independently', () => {
    // catalog.js does Math.round(n * song * albumDiscount) from these same two
    // constants. If this ever diverges, the catalogue prices records differently
    // from what the checkout charges -- which has happened before.
    for (const n of [1, 5, 9, 10, 11, 12, 19]) {
      expect(calculateAlbumPrice(n)).toBe(Math.round(n * SONG_PRICE * ALBUM_DISCOUNT));
    }
  });

  test('a missing or nonsensical track count falls back to a single', () => {
    expect(calculateAlbumPrice(0)).toBe(SONG_PRICE);
    expect(calculateAlbumPrice(undefined)).toBe(SONG_PRICE);
    expect(calculateAlbumPrice(null)).toBe(SONG_PRICE);
    expect(calculateAlbumPrice(-3)).toBe(SONG_PRICE);
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
