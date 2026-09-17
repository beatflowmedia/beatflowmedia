// Pins the pricing rule, including the boundary that the JSDoc previously got wrong.
//
// Two of the four documented examples disagreed with the implementation (n=1 said
// 2900 against an actual 2199; n=12 said 26099 against an actual 26199). A comment
// cannot be wrong for long if a test asserts the same numbers.

const { SONG_PRICE, ALBUM_DISCOUNT, calculateAlbumPrice, formatPrice } = require('./pricing');

describe('pricing constants', () => {
  test('are the values the station and the checkout both depend on', () => {
    expect(SONG_PRICE).toBe(2900);
    expect(ALBUM_DISCOUNT).toBe(0.75);
  });
});

describe('calculateAlbumPrice', () => {
  test('matches every example in its own JSDoc', () => {
    expect(calculateAlbumPrice(1)).toBe(2199);
    expect(calculateAlbumPrice(5)).toBe(10899);
    expect(calculateAlbumPrice(10)).toBe(21799);
    expect(calculateAlbumPrice(12)).toBe(26199);
  });

  test('always ends in 99', () => {
    for (let n = 1; n <= 40; n += 1) {
      expect(calculateAlbumPrice(n) % 100).toBe(99);
    }
  });

  test('adds the .99 when the discounted base lands on an exact dollar', () => {
    // 12 * 2900 * 0.75 = 26100 exactly. The rule prices UP to 26199, it does not
    // shave down to 26099. Changing this reprices every album, so it is asserted
    // rather than left to be rediscovered.
    expect(12 * SONG_PRICE * ALBUM_DISCOUNT).toBe(26100);
    expect(calculateAlbumPrice(12)).toBe(26199);
  });

  test('is cheaper per track than buying the tracks separately', () => {
    for (const n of [2, 5, 9, 10, 12, 19]) {
      expect(calculateAlbumPrice(n)).toBeLessThan(n * SONG_PRICE);
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
    expect(formatPrice(2900)).toBe('$29.00');
    expect(formatPrice(21799)).toBe('$217.99');
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
