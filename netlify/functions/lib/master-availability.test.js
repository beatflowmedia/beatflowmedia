// Pins the previewOnly reconciliation.
//
// This decides which records a customer can buy. The expensive failure is not
// "catalogue stays locked" -- it is a record marked sellable with no master behind
// it, because the purchase path falls through to audioUrl and hands the buyer a
// 30-second preview. Both directions are asserted for that reason.

const {
  CLEAR, SET, isSellable, planMasterAvailability, describeMasterPlan
} = require('./master-availability');

const ISRC_A = 'USBFM2600001';
const ISRC_B = 'USBFM2600002';

const song = (id, isrc, previewOnly) => ({
  id, title: id, isrc, ...(previewOnly === undefined ? {} : { previewOnly })
});

describe('isSellable', () => {
  test('matches the station rule: only an explicit true blocks a sale', () => {
    expect(isSellable({ previewOnly: true })).toBe(false);
    expect(isSellable({ previewOnly: false })).toBe(true);
    // The one that bites: an ABSENT field means sellable, not neutral.
    expect(isSellable({})).toBe(true);
    expect(isSellable({ previewOnly: 'true' })).toBe(true); // a string is not true
  });
});

describe('planMasterAvailability', () => {
  test('unlocks a blocked record whose master exists', () => {
    const plan = planMasterAvailability({
      songs: [song('a', ISRC_A, true)],
      masterPresence: { a: true }
    });
    expect(plan.clear).toHaveLength(1);
    expect(plan.clear[0]).toMatchObject({ id: 'a', action: CLEAR, key: 'masters/' + ISRC_A + '.wav' });
    expect(plan.set).toHaveLength(0);
  });

  test('BLOCKS a sellable record with no master — the dangerous direction', () => {
    // A one-directional "unlock the catalogue" script would never look for this,
    // and this is the case that costs a refund and a complaint.
    const plan = planMasterAvailability({
      songs: [song('a', ISRC_A, false), song('b', ISRC_B)], // b has no field at all
      masterPresence: { a: false, b: false }
    });
    expect(plan.set.map((c) => c.id).sort()).toEqual(['a', 'b']);
    plan.set.forEach((c) => expect(c.action).toBe(SET));
    expect(plan.clear).toHaveLength(0);
  });

  test('leaves correct records alone in both directions', () => {
    const plan = planMasterAvailability({
      songs: [song('blockedNoMaster', ISRC_A, true), song('sellableHasMaster', ISRC_B, false)],
      masterPresence: { blockedNoMaster: false, sellableHasMaster: true }
    });
    expect(plan.clear).toHaveLength(0);
    expect(plan.set).toHaveLength(0);
    expect(plan.summary).toMatchObject({ checked: 2, toClear: 0, toSet: 0, problems: 0 });
  });

  test('an undetermined probe is NOT treated as absent', () => {
    // A timeout or a 500 must never look like "no master". If it did, one bad
    // network moment would block the whole catalogue on the next --apply.
    [undefined, null].forEach((verdict) => {
      const plan = planMasterAvailability({
        songs: [song('a', ISRC_A, false)],
        masterPresence: { a: verdict }
      });
      expect(plan.set).toHaveLength(0);
      expect(plan.clear).toHaveLength(0);
      expect(plan.problems).toHaveLength(1);
      expect(plan.problems[0].reason).toMatch(/could not be determined/);
    });
  });

  test('a record with no usable ISRC is reported, not guessed at', () => {
    const plan = planMasterAvailability({
      songs: [song('none', undefined, true), song('bad', 'NOT-AN-ISRC', true)],
      masterPresence: { none: true, bad: true }
    });
    expect(plan.clear).toHaveLength(0);
    expect(plan.problems).toHaveLength(2);
    expect(plan.problems[0].reason).toMatch(/no ISRC/);
    expect(plan.problems[1].reason).toMatch(/not well formed/);
  });

  test('accepts a Map as well as a plain object', () => {
    const plan = planMasterAvailability({
      songs: [song('a', ISRC_A, true)],
      masterPresence: new Map([['a', true]])
    });
    expect(plan.clear).toHaveLength(1);
  });

  test('is idempotent — replanning after a repair finds nothing', () => {
    const songs = [song('a', ISRC_A, true), song('b', ISRC_B, false)];
    const masterPresence = { a: true, b: false };

    const first = planMasterAvailability({ songs, masterPresence });
    expect(first.summary).toMatchObject({ toClear: 1, toSet: 1 });

    const repaired = songs.map((s) => ({ ...s, previewOnly: masterPresence[s.id] === false }));
    const second = planMasterAvailability({ songs: repaired, masterPresence });
    expect(second.summary).toMatchObject({ toClear: 0, toSet: 0, problems: 0 });
  });

  test('models the live catalogue: everything blocked, some masters present', () => {
    // 134 records seeded with a blanket previewOnly:true. Only the ones with a
    // master should unlock; nothing should be newly blocked.
    const songs = Array.from({ length: 10 }, (_, i) =>
      song('s' + i, 'USBFM26' + String(i).padStart(5, '0'), true));
    const masterPresence = {};
    songs.forEach((s, i) => { masterPresence[s.id] = i < 7; }); // 7 have masters

    const plan = planMasterAvailability({ songs, masterPresence });
    expect(plan.summary).toMatchObject({ checked: 10, toClear: 7, toSet: 0, problems: 0 });
  });

  test('tolerates empty input', () => {
    const plan = planMasterAvailability({});
    expect(plan.summary).toMatchObject({ checked: 0, toClear: 0, toSet: 0, problems: 0 });
    expect(describeMasterPlan(plan)).toEqual([]);
  });
});

describe('describeMasterPlan', () => {
  test('labels each row by what will happen to it', () => {
    const plan = planMasterAvailability({
      songs: [song('unlockMe', ISRC_A, true), song('blockMe', ISRC_B, false), song('noIsrc', null, true)],
      masterPresence: { unlockMe: true, blockMe: false, noIsrc: true }
    });
    const lines = describeMasterPlan(plan);
    expect(lines.some((l) => l.startsWith('  UNLOCK') && l.includes('unlockMe'))).toBe(true);
    expect(lines.some((l) => l.startsWith('  BLOCK') && l.includes('blockMe'))).toBe(true);
    expect(lines.some((l) => l.startsWith('  SKIP') && l.includes('noIsrc'))).toBe(true);
  });
});
