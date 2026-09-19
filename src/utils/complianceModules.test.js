// Pins the three statutory modules.
//
// These encode obligations, not preferences, so the failure modes are all of the
// "quietly wrong forever" kind: a rate that silently goes stale, a registration
// claim that asserts authorship nobody had, a safe-harbour check that reports
// protection the platform has not actually earned.

const {
  STATUTORY_RATES, LATEST_RATE_YEAR,
  rateForYear, mechanicalRoyaltySubcents, mechanicalRoyaltyForTracks,
  subcentsToCents, formatSubcents, streamingNote
} = require('./mechanicalRoyalty');

const {
  SYNTHETIC, AI_ASSISTED, HUMAN_MASTER_AI_REMIX, HUMAN_ONLY,
  HUMAN_CONTRIBUTIONS, aiDisclosureOf, hasDisclosure, disclosureLabel,
  registrationClaim, compilationClaim
} = require('./aiDisclosure');

const {
  DESIGNATED_AGENT, REPEAT_INFRINGER_POLICY, STRIKE_STATUS,
  repeatInfringerStatus, safeHarborStatus
} = require('./dmcaSafeHarbor');

// ---------------------------------------------------------------- § 115

describe('mechanical royalty — 17 U.S.C. § 115', () => {
  test('2026 rate is the CRB figure', () => {
    // 13.1c per work, 2.52c per minute. Held in hundredths of a cent so both are
    // integers and no float rounding can touch money owed to a songwriter.
    expect(STATUTORY_RATES[2026]).toEqual({ perWork: 1310, perMinute: 252 });
    expect(STATUTORY_RATES[2025].perWork).toBe(1270);
  });

  test('a short track pays the flat per-work rate', () => {
    const r = mechanicalRoyaltySubcents(3 * 60 + 8, { on: 2026 }); // 3:08
    expect(r).toMatchObject({ subcents: 1310, basis: 'per-work', rateYear: 2026 });
  });

  test('a long track pays per minute, counting a part minute as whole', () => {
    // 6:10 -> seven minutes "or fraction thereof" -> 7 x 2.52c = 17.64c,
    // which beats the 13.1c flat rate.
    const r = mechanicalRoyaltySubcents(6 * 60 + 10, { on: 2026 });
    expect(r).toMatchObject({ subcents: 7 * 252, basis: 'per-minute' });
    expect(r.subcents).toBeGreaterThan(STATUTORY_RATES[2026].perWork);
  });

  test('exactly five minutes still takes the flat rate', () => {
    // 5 x 2.52 = 12.60c < 13.10c. The crossover is just past five minutes, so this
    // is the boundary most likely to be coded wrong.
    const r = mechanicalRoyaltySubcents(300, { on: 2026 });
    expect(r).toMatchObject({ subcents: 1310, basis: 'per-work' });
  });

  test('an unknown duration falls back to the statutory minimum, not to zero', () => {
    [0, null, undefined, NaN, -5].forEach((d) => {
      expect(mechanicalRoyaltySubcents(d, { on: 2026 }).subcents).toBe(1310);
    });
  });

  test('the rate is the one in force on the date of the sale', () => {
    // Recomputing an old sale at today's rate misstates what was owed.
    expect(mechanicalRoyaltySubcents(180, { on: 2025 }).subcents).toBe(1270);
    expect(mechanicalRoyaltySubcents(180, { on: new Date('2025-06-01T00:00:00Z') }).subcents).toBe(1270);
  });

  test('a year past the table is flagged stale rather than silently billed', () => {
    const r = rateForYear(LATEST_RATE_YEAR + 5);
    expect(r.stale).toBe(true);
    expect(r.year).toBe(LATEST_RATE_YEAR);
    expect(rateForYear(2026).stale).toBe(false);
  });

  test('an album sums before rounding, not after', () => {
    // Twelve 3-minute tracks: 12 x 1310 = 15720 subcents = $1.572.
    // Rounding each to 13c first would give $1.56 -- a cent lost per album.
    const r = mechanicalRoyaltyForTracks(new Array(12).fill(180), { on: 2026 });
    expect(r.subcents).toBe(15720);
    expect(r.trackCount).toBe(12);
    expect(subcentsToCents(r.subcents)).toBe(157);
    expect(formatSubcents(r.subcents)).toBe('$1.572');
  });

  test('accepts track objects as well as raw seconds', () => {
    const a = mechanicalRoyaltyForTracks([{ duration: 180 }, { durationSeconds: 200 }], { on: 2026 });
    expect(a.subcents).toBe(2620);
  });

  test('refuses to price interactive streaming', () => {
    // The penny rates do not apply to streams; the CRB uses a revenue formula.
    expect(streamingNote()).toMatch(/not per-copy penny rates/i);
  });
});

// ---------------------------------------- AI authorship / Circular 56A

describe('AI disclosure and registrability', () => {
  test('an undisclosed record is null, never assumed synthetic', () => {
    // Guessing provenance writes a fabricated fact into a field that feeds a
    // federal application.
    expect(aiDisclosureOf({})).toBeNull();
    expect(aiDisclosureOf({ aiDisclosure: 'made-up' })).toBeNull();
    expect(hasDisclosure({})).toBe(false);
    expect(hasDisclosure({ aiDisclosure: SYNTHETIC })).toBe(true);
  });

  test('fully synthetic is not registrable in either copyright', () => {
    const c = registrationClaim({ aiDisclosure: SYNTHETIC, humanContributions: [HUMAN_CONTRIBUTIONS.LYRICS] });
    expect(c.composition.registrable).toBe(false);
    expect(c.soundRecording.registrable).toBe(false);
    expect(c.mustDisclaim).toBe(true);
  });

  test('AI-assisted splits the two copyrights', () => {
    // Human lyrics over AI performance: the WRITTEN work is registrable, the
    // recording is not. Collapsing them is how a registration goes wrong.
    const c = registrationClaim({
      aiDisclosure: AI_ASSISTED,
      humanContributions: [HUMAN_CONTRIBUTIONS.LYRICS, HUMAN_CONTRIBUTIONS.MELODY]
    });
    expect(c.composition.registrable).toBe(true);
    expect(c.composition.claim).toEqual([HUMAN_CONTRIBUTIONS.LYRICS, HUMAN_CONTRIBUTIONS.MELODY]);
    expect(c.soundRecording.registrable).toBe(false);
    expect(c.mustDisclaim).toBe(true);
  });

  test('a claimed contribution must match the copyright it belongs to', () => {
    // Claiming a performance on a composition application is a category error.
    const c = registrationClaim({
      aiDisclosure: AI_ASSISTED,
      humanContributions: [HUMAN_CONTRIBUTIONS.PERFORMANCE]
    });
    expect(c.composition.claim).toEqual([]);
    expect(c.composition.registrable).toBe(false);
  });

  test('a human master with AI remix keeps the recording claim', () => {
    const c = registrationClaim({
      aiDisclosure: HUMAN_MASTER_AI_REMIX,
      humanContributions: [HUMAN_CONTRIBUTIONS.PERFORMANCE, HUMAN_CONTRIBUTIONS.LYRICS]
    });
    expect(c.soundRecording.registrable).toBe(true);
    expect(c.composition.registrable).toBe(true);
    expect(c.mustDisclaim).toBe(true);
  });

  test('a human-only record disclaims nothing', () => {
    const c = registrationClaim({ aiDisclosure: HUMAN_ONLY, humanContributions: [HUMAN_CONTRIBUTIONS.LYRICS] });
    expect(c.mustDisclaim).toBe(false);
    expect(c.composition.registrable).toBe(true);
  });

  test('an undisclosed record yields no claim at all', () => {
    const c = registrationClaim({ humanContributions: [HUMAN_CONTRIBUTIONS.LYRICS] });
    expect(c.composition.registrable).toBe(false);
    expect(c.composition.reason).toMatch(/not disclosed/);
  });

  test('a sequenced album carries a thin compilation claim even when fully synthetic', () => {
    // For a synthetic catalogue this may be the only copyright that exists.
    const c = compilationClaim({ trackCount: 12, humanSequenced: true });
    expect(c.registrable).toBe(true);
    expect(c.thin).toBe(true);
    expect(c.claim).toContain(HUMAN_CONTRIBUTIONS.SELECTION_AND_SEQUENCE);
  });

  test('one track, or an unsequenced release, has nothing to compile', () => {
    expect(compilationClaim({ trackCount: 1, humanSequenced: true }).registrable).toBe(false);
    expect(compilationClaim({ trackCount: 12 }).registrable).toBe(false);
  });

  test('labels an unknown disclosure visibly rather than blank', () => {
    expect(disclosureLabel(SYNTHETIC)).toMatch(/Synthetic/);
    expect(disclosureLabel(null)).toBe('Undisclosed');
  });
});

// ---------------------------------------------------------------- § 512

describe('DMCA safe harbour — 17 U.S.C. § 512(c)', () => {
  test('the designated agent is unregistered, and the module says so', () => {
    // This is the honest current state. When it changes, this test changes with it
    // deliberately -- which is the point.
    expect(DESIGNATED_AGENT.registeredWithCopyrightOffice).toBeNull();
  });

  test('refuses to claim a safe harbour it has not earned', () => {
    const s = safeHarborStatus({ acceptsUserUploads: false });
    expect(s.eligible).toBe(false);
    expect(s.gaps.join(' ')).toMatch(/not registered with the U.S. Copyright Office/);
  });

  test('the gap becomes urgent only once third parties can upload', () => {
    expect(safeHarborStatus({ acceptsUserUploads: false }).urgent).toBe(false);
    expect(safeHarborStatus({ acceptsUserUploads: true }).urgent).toBe(true);
  });

  test('three strikes in the window requires termination', () => {
    const now = new Date('2026-09-19T00:00:00Z');
    const recent = (days) => ({ at: new Date(now.getTime() - days * 86400000) });
    const r = repeatInfringerStatus([recent(10), recent(20), recent(30)], now);
    expect(r.status).toBe(STRIKE_STATUS.TERMINATE);
    expect(r.mustTerminate).toBe(true);
    expect(r.activeStrikes).toBe(3);
  });

  test('strikes age out of the rolling window', () => {
    // A policy that never forgets is a permanent record, not a repeat-infringer
    // policy.
    const now = new Date('2026-09-19T00:00:00Z');
    const old = { at: new Date(now.getTime() - 400 * 86400000) };
    const r = repeatInfringerStatus([old, old, old], now);
    expect(r.activeStrikes).toBe(0);
    expect(r.status).toBe(STRIKE_STATUS.CLEAR);
  });

  test('a withdrawn strike does not count', () => {
    const now = new Date('2026-09-19T00:00:00Z');
    const s = (w) => ({ at: now, withdrawn: w });
    expect(repeatInfringerStatus([s(true), s(true), s(false)], now).activeStrikes).toBe(1);
  });

  test('the counter-notice wait is the statutory 10-14 business days', () => {
    expect(REPEAT_INFRINGER_POLICY.counterNoticeWaitBusinessDaysMin).toBe(10);
    expect(REPEAT_INFRINGER_POLICY.counterNoticeWaitBusinessDaysMax).toBe(14);
  });

  test('tolerates no strike history', () => {
    expect(repeatInfringerStatus(undefined).status).toBe(STRIKE_STATUS.CLEAR);
    expect(repeatInfringerStatus([]).strikesRemaining).toBe(3);
  });
});
