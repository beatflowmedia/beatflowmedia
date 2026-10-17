// src/utils/pricing.commercial.test.js
//
// The commercial volume curve.
//
// The property worth most here is MONOTONICITY. A price list where buying one more
// track costs less is not a rounding bug, it is a contradiction a customer can see, and
// it is exactly what flat per-band rates produce: 4 tracks at $29 is $116, 5 at $22 is
// $110. A power curve cannot do that by construction, and this proves it across a range
// wider than the catalogue so it stays true if a collection grows.
//
// The second property is INDEPENDENCE from SONG_PRICE. A personal download and a
// commercial sync licence are different products; tying them would mean a change to the
// $1.99 consumer price silently repricing the commercial catalogue.

const {
  calculateCommercialPrice,
  calculateAlbumPrice,
  COMMERCIAL_TRACK_PRICE,
  COMMERCIAL_RELEASE_TRACK_PRICE,
  SONG_PRICE,
  ALBUM_PRICE_CAP
} = require('./pricing');

describe('calculateCommercialPrice — the volume curve', () => {
  test('a single track is the base rate exactly', () => {
    expect(calculateCommercialPrice(1)).toBe(COMMERCIAL_TRACK_PRICE);
    expect(calculateCommercialPrice(1, COMMERCIAL_RELEASE_TRACK_PRICE))
      .toBe(COMMERCIAL_RELEASE_TRACK_PRICE);
  });

  test('MORE TRACKS ALWAYS COSTS MORE — no cliffs anywhere in 1..300', () => {
    let previous = 0;
    for (let n = 1; n <= 300; n += 1) {
      const price = calculateCommercialPrice(n);
      expect(price).toBeGreaterThanOrEqual(previous);
      previous = price;
    }
  });

  test('the per-track rate falls as the licence grows', () => {
    // NOT asserted between ADJACENT counts, and the reason is a deliberate trade.
    //
    // Rounding to a trailing 9 moves the total by up to $9, which at small counts is
    // enough to nudge the per-track rate up a fraction: 21 tracks works out at $8.52
    // against $8.45 at 20. Measured across 1..300 there are 76 such wobbles and the
    // worst is 9.2 CENTS per track.
    //
    // The guarantee a customer can actually see is that the TOTAL never falls, and that
    // is asserted above without exception. Per-track rate is a derived figure nobody is
    // quoted; buying the trailing-9 price list costs 9 cents of smoothness in a number
    // that appears on no invoice.
    //
    // So this asserts the real property -- the discount is genuine and substantial over
    // any interval a buyer would compare.
    const perTrack = (n) => calculateCommercialPrice(n) / n;

    expect(perTrack(10)).toBeLessThan(perTrack(1));
    expect(perTrack(25)).toBeLessThan(perTrack(10));
    expect(perTrack(50)).toBeLessThan(perTrack(25));
    expect(perTrack(100)).toBeLessThan(perTrack(50));

    // And never wobbles by more than a few cents, so the trade above stays small.
    let worst = 0;
    let previous = Infinity;
    for (let n = 1; n <= 300; n += 1) {
      const rate = perTrack(n);
      if (rate > previous) worst = Math.max(worst, rate - previous);
      previous = rate;
    }
    expect(worst).toBeLessThan(15); // cents
  });

  test('a licence never costs less than one track', () => {
    for (let n = 1; n <= 60; n += 1) {
      expect(calculateCommercialPrice(n)).toBeGreaterThanOrEqual(COMMERCIAL_TRACK_PRICE);
    }
  });

  test('the real collections land where the pricing decision said they would', () => {
    // These are the numbers Percy agreed to, pinned so a change to the exponent or the
    // rounding cannot quietly move the price list.
    expect(calculateCommercialPrice(56)).toBe(31900); // Jazz-Infused Neo-Soul
    expect(calculateCommercialPrice(48)).toBe(28900); // Interstellar Soundtrack and four others
    expect(calculateCommercialPrice(24)).toBe(18900); // every functional collection
    expect(calculateCommercialPrice(21)).toBe(17900); // Best of House
  });

  test('prices land on whole dollars ending in 9', () => {
    // A price list a buyer reads should not contain $318.47.
    [1, 3, 7, 12, 24, 37, 56, 90, 150].forEach((n) => {
      const price = calculateCommercialPrice(n);
      expect(price % 100).toBe(0);
      const dollars = price / 100;
      if (dollars > 9) expect(dollars % 10).toBe(9);
    });
  });

  test('a released song costs more than a bed at every size', () => {
    [1, 5, 11, 20, 50].forEach((n) => {
      expect(calculateCommercialPrice(n, COMMERCIAL_RELEASE_TRACK_PRICE))
        .toBeGreaterThan(calculateCommercialPrice(n));
    });
  });
});

describe('independence from the consumer price', () => {
  test('the commercial base is not derived from SONG_PRICE', () => {
    // If these were tied, changing the $1.99 download price would silently reprice
    // every commercial licence in the catalogue.
    expect(COMMERCIAL_TRACK_PRICE % SONG_PRICE).not.toBe(0);
    expect(COMMERCIAL_TRACK_PRICE).toBeGreaterThan(SONG_PRICE * 10);
  });

  test('the consumer album cap does NOT apply to a commercial licence', () => {
    // calculateAlbumPrice clamps to $11.99 because that is a consumer album. A
    // commercial licence for 56 tracks capped at $11.99 would be the catalogue sold
    // for the price of one album.
    expect(calculateAlbumPrice(56)).toBe(ALBUM_PRICE_CAP);
    expect(calculateCommercialPrice(56)).toBeGreaterThan(ALBUM_PRICE_CAP * 20);
  });

  test('calculateAlbumPrice is untouched by any of this', () => {
    // The station requires this function directly and create-checkout charges the
    // stored price, so a change here sells albums at the wrong price.
    expect(calculateAlbumPrice(1)).toBe(499);
    expect(calculateAlbumPrice(3)).toBe(597);
    expect(calculateAlbumPrice(10)).toBe(1199);
    expect(calculateAlbumPrice(19)).toBe(1199);
  });
});

describe('bad input is refused rather than guessed', () => {
  test('a missing or nonsense track count falls back to one track', () => {
    expect(calculateCommercialPrice(0)).toBe(COMMERCIAL_TRACK_PRICE);
    expect(calculateCommercialPrice(-5)).toBe(COMMERCIAL_TRACK_PRICE);
    expect(calculateCommercialPrice(null)).toBe(COMMERCIAL_TRACK_PRICE);
    expect(calculateCommercialPrice(undefined)).toBe(COMMERCIAL_TRACK_PRICE);
    expect(calculateCommercialPrice('not a number')).toBe(COMMERCIAL_TRACK_PRICE);
  });

  test('a bad base rate throws rather than producing a free licence', () => {
    expect(() => calculateCommercialPrice(10, 0)).toThrow(/positive number of cents/);
    expect(() => calculateCommercialPrice(10, -100)).toThrow(/positive number of cents/);
    expect(() => calculateCommercialPrice(10, 'free')).toThrow(/positive number of cents/);
  });
});
