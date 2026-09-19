// Pins the definition of "net" and the split that depends on it.
//
// Terms.js publishes "70% of net sales revenue" without defining net. These
// assertions are the definition, in the only place that can be executed.

const {
  ARTIST_SHARE, PLATFORM_SHARE, STRIPE_FIXED_CENTS,
  stripeFeeCents, splitSale, netDefinition
} = require('./revenueSplit');
const { SONG_PRICE, calculateAlbumPrice } = require('./pricing');

describe('shares', () => {
  test('are the numbers Terms.js already promises', () => {
    expect(ARTIST_SHARE).toBe(0.70);
    expect(PLATFORM_SHARE).toBe(0.30);
  });
});

describe('stripeFeeCents', () => {
  test('is a percentage plus a fixed fee', () => {
    expect(stripeFeeCents(199)).toBe(Math.round(199 * 0.029) + STRIPE_FIXED_CENTS); // 36
    expect(stripeFeeCents(1199)).toBe(Math.round(1199 * 0.029) + STRIPE_FIXED_CENTS); // 65
  });

  test('the fixed fee is why bundles matter', () => {
    // 30c is ~15% of a $1.99 single and ~2.5% of an $11.99 album. That asymmetry is
    // the entire economic argument for selling albums.
    const singleFeeRatio = stripeFeeCents(199) / 199;
    const albumFeeRatio = stripeFeeCents(1199) / 1199;
    expect(singleFeeRatio).toBeGreaterThan(albumFeeRatio * 2);
  });
});

describe('splitSale', () => {
  test('net is gross less processing less the mechanical', () => {
    const r = splitSale({ grossCents: SONG_PRICE, tracks: [188], on: 2026 });
    expect(r.grossCents).toBe(199);
    expect(r.deductions.processingCents).toBe(36);
    expect(r.deductions.mechanicalCents).toBe(13);
    expect(r.netCents).toBe(199 - 36 - 13); // 150
  });

  test('the split is taken from net, not from gross', () => {
    // The whole point. On gross the artist would take $1.39 and leave BFMG 11c
    // after costs -- a quarter of what the same 70/30 yields on net.
    const r = splitSale({ grossCents: SONG_PRICE, tracks: [188], on: 2026 });
    expect(r.artistCents).toBe(105);
    expect(r.platformCents).toBe(45);
    expect(r.artistCents + r.platformCents).toBe(r.netCents);
  });

  test('pennies always balance — the platform takes the remainder', () => {
    // Rounding both shares independently can lose or invent a cent. Over a month of
    // sales that is a reconciliation failure, so the remainder is assigned.
    for (let gross = 100; gross <= 2000; gross += 7) {
      const r = splitSale({ grossCents: gross, tracks: [180], on: 2026 });
      expect(r.artistCents + r.platformCents).toBe(r.netCents);
    }
  });

  test('an album owes one mechanical per track', () => {
    const r = splitSale({
      grossCents: calculateAlbumPrice(12),
      tracks: new Array(12).fill(190),
      on: 2026
    });
    expect(r.trackCount).toBe(12);
    expect(r.deductions.mechanicalCents).toBe(157); // 12 x 13.1c
  });

  test('under a flat album cap, a longer album pays the artist LESS', () => {
    // Mechanicals scale per track; the price does not. This is a real consequence
    // of capping the album price and is pinned so it cannot change unnoticed.
    const twelve = splitSale({ grossCents: calculateAlbumPrice(12), tracks: new Array(12).fill(190), on: 2026 });
    const nineteen = splitSale({ grossCents: calculateAlbumPrice(19), tracks: new Array(19).fill(190), on: 2026 });
    expect(nineteen.grossCents).toBe(twelve.grossCents);       // both capped
    expect(nineteen.artistCents).toBeLessThan(twelve.artistCents);
  });

  test('who wrote the song decides whether the mechanical is cash out', () => {
    const owned = splitSale({ grossCents: SONG_PRICE, tracks: [188], ownsComposition: true, on: 2026 });
    const third = splitSale({ grossCents: SONG_PRICE, tracks: [188], ownsComposition: false, on: 2026 });

    // Same deduction from the splittable pool either way...
    expect(owned.netCents).toBe(third.netCents);
    expect(owned.artistCents).toBe(third.artistCents);

    // ...but when BFMG holds the composition it is paying itself, so the cash stays.
    expect(owned.platformCashCents).toBe(third.platformCashCents + owned.deductions.mechanicalCents);
    expect(owned.deductions.mechanicalIsInternalTransfer).toBe(true);
  });

  test('never returns a negative pool', () => {
    // A sale smaller than its own fees must floor at zero rather than invent a debt
    // for the artist.
    const r = splitSale({ grossCents: 10, tracks: [180], on: 2026 });
    expect(r.netCents).toBe(0);
    expect(r.artistCents).toBe(0);
    expect(r.platformCents).toBe(0);
  });

  test('tolerates a sale with no track data', () => {
    const r = splitSale({ grossCents: 199 });
    expect(r.trackCount).toBe(0);
    expect(r.deductions.mechanicalCents).toBe(0);
  });

  test('the prose definition states every deduction the code applies', () => {
    const d = netDefinition();
    expect(d).toMatch(/payment processing/i);
    expect(d).toMatch(/mechanical/i);
    expect(d).toMatch(/refund|chargeback/i);
  });
});
