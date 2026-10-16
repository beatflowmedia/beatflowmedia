/**
 * @jest-environment jsdom
 */
// src/data/platformChanges.test.js
//
// The entries on /changes are the only place a buyer on a superseded license can read
// what they agreed to. /terms promises that the version recorded against a purchase
// governs it; if an accepted version is missing from the history, that promise is
// unkeepable and nobody finds out until someone asks.
//
// So these assert the derivation is sound, the ordering is right, and the "has this been
// seen" logic fails in the safe direction.

import {
  allChanges,
  agreementChanges,
  latestChangeDate,
  hasUnseenChanges,
  formatChangeDate,
  getLastSeenChangeDate,
  markChangesSeen,
  SEEN_KEY
} from './platformChanges';

import {
  AGREEMENT_HISTORY,
  CURRENT_VERSIONS,
  DOWNLOAD_LICENSE,
  currentAgreementVersion
} from '../utils/agreements';

describe('the current version is DERIVED, so it cannot drift from the history', () => {
  test('CURRENT_VERSIONS matches the newest history entry for every agreement', () => {
    Object.keys(AGREEMENT_HISTORY).forEach((agreement) => {
      const history = AGREEMENT_HISTORY[agreement];
      const expected = history.length ? history[0].version : null;
      expect(CURRENT_VERSIONS[agreement]).toBe(expected);
    });
  });

  test('an agreement with no written text has no current version', () => {
    // null means "cannot be accepted", not "any version will do".
    expect(CURRENT_VERSIONS['contributor-upload']).toBeNull();
    expect(currentAgreementVersion('contributor-upload')).toBeNull();
  });

  test('history is newest-first, which is what "current" depends on', () => {
    Object.values(AGREEMENT_HISTORY).forEach((history) => {
      const versions = history.map((h) => h.version);
      const sorted = [...versions].sort().reverse();
      expect(versions).toEqual(sorted);
    });
  });
});

describe('every version is published, not just the one in force', () => {
  test('superseded versions still appear — they still bind someone', () => {
    const terms = agreementChanges().filter((c) => c.agreement === DOWNLOAD_LICENSE);
    expect(terms.length).toBe(AGREEMENT_HISTORY[DOWNLOAD_LICENSE].length);
    expect(terms.length).toBeGreaterThan(1);
  });

  test('exactly one download-license version is marked in force', () => {
    const inForce = agreementChanges()
      .filter((c) => c.agreement === DOWNLOAD_LICENSE && c.inForce);
    expect(inForce).toHaveLength(1);
    expect(inForce[0].identifier).toBe(currentAgreementVersion(DOWNLOAD_LICENSE));
  });

  test('every entry carries the license summary AS IT STOOD', () => {
    // Without this a buyer on an older version has a date and no text, which is the
    // gap the page was built to close.
    agreementChanges().forEach((c) => {
      expect(typeof c.summary).toBe('string');
      expect(c.summary.length).toBeGreaterThan(80);
    });
  });

  test('every entry carries the identifier recorded on a purchase', () => {
    agreementChanges().forEach((c) => {
      expect(c.identifier).toMatch(/^[a-z-]+@\d{4}-\d{2}-\d{2}$/);
    });
  });

  test('the in-force summary matches what the current version actually says', () => {
    const current = agreementChanges().find((c) => c.inForce && c.agreement === DOWNLOAD_LICENSE);
    // The 2026-10-15 change is that a license can END. If the summary still promised it
    // could not, the page would contradict the checkout.
    expect(current.summary).toMatch(/can end/i);
    expect(current.summary).toMatch(/reversed|chargeback/i);
  });
});

describe('ordering', () => {
  test('newest first', () => {
    const dates = allChanges().map((c) => c.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  test('latestChangeDate is the newest entry', () => {
    expect(latestChangeDate()).toBe(allChanges()[0].date);
  });
});

describe('hasUnseenChanges — the link must stay rare', () => {
  test('a reader who has seen the newest entry is not offered the link', () => {
    expect(hasUnseenChanges(latestChangeDate())).toBe(false);
  });

  test('a reader who has seen only an older entry IS offered it', () => {
    expect(hasUnseenChanges('2026-09-19')).toBe(true);
  });

  test('a reader who has never seen anything is offered it', () => {
    expect(hasUnseenChanges(null)).toBe(true);
  });

  test('a reader somehow ahead of us is not offered it', () => {
    expect(hasUnseenChanges('2099-01-01')).toBe(false);
  });
});

describe('seen state fails in the SAFE direction', () => {
  beforeEach(() => {
    try { window.localStorage.clear(); } catch (err) { /* ignore */ }
    jest.restoreAllMocks();
  });

  test('marking and reading round-trips', () => {
    markChangesSeen();
    expect(getLastSeenChangeDate()).toBe(latestChangeDate());
    expect(hasUnseenChanges(getLastSeenChangeDate())).toBe(false);
  });

  test('blocked storage reads as "not seen", so the link still shows', () => {
    // Private mode, or blocked site data. Showing the link to someone who already read
    // it is a mild annoyance; HIDING a license change from someone who has not is the
    // outcome this page exists to prevent. It must fail this way round.
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(getLastSeenChangeDate()).toBeNull();
    expect(hasUnseenChanges(getLastSeenChangeDate())).toBe(true);
  });

  test('blocked storage does not throw when marking', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(() => markChangesSeen()).not.toThrow();
  });

  test('uses one storage key, not a per-page invention', () => {
    markChangesSeen();
    expect(window.localStorage.getItem(SEEN_KEY)).toBe(latestChangeDate());
  });
});

describe('formatChangeDate', () => {
  test('renders a date a reader recognises', () => {
    expect(formatChangeDate('2026-10-15')).toBe('15 October 2026');
    expect(formatChangeDate('2026-09-19')).toBe('19 September 2026');
  });

  test('passes anything unparseable through rather than inventing a date', () => {
    expect(formatChangeDate('')).toBe('');
    expect(formatChangeDate('not-a-date')).toBe('not-a-date');
  });
});
