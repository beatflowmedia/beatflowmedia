// Pins the agreement registry.
//
// This module is evidence plumbing: what it returns ends up on a purchase record and
// is the thing that would be produced if a buyer ever disputed what they agreed to.
// The failure modes are all silent -- a version that quietly stops being current, a
// malformed identifier that parses into a half-object, an unwritten agreement that
// starts claiming it can be accepted -- so each one is asserted rather than trusted.

const {
  DOWNLOAD_LICENSE,
  CONTRIBUTOR_UPLOAD,
  SYNC_LICENSE,
  ALL_AGREEMENTS,
  CURRENT_VERSIONS,
  currentAgreementVersion,
  parseAgreementVersion,
  isCurrentAgreementVersion,
  agreementLabel
} = require('./agreements');

describe('currentAgreementVersion', () => {
  test('gives the buyer license a dated identifier', () => {
    const id = currentAgreementVersion(DOWNLOAD_LICENSE);
    expect(id).toBe('download-license@2026-10-15');
  });

  test('every published version is an ISO date, not a semver', () => {
    // The stored value has to answer "which text did they see that day". A date
    // does; a version number needs a lookup table that may not survive.
    Object.values(CURRENT_VERSIONS)
      .filter(Boolean)
      .forEach((version) => {
        expect(version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
  });

  test('an agreement with no written text cannot be accepted', () => {
    // A designed gap, not an oversight. Publishing a contributor agreement means setting
    // its version deliberately -- and this failing is the reminder that the UPLOAD PATH
    // still has to capture it, which is why the gap is tracked here rather than in a
    // comment nobody runs.
    expect(currentAgreementVersion(CONTRIBUTOR_UPLOAD)).toBeNull();
  });

  test('sync-license is published, which means the CHECKOUT must now capture it', () => {
    // This assertion replaced one that pinned SYNC_LICENSE to null, and that one failing
    // on 2026-10-16 was the tripwire working: publishing the text is not the same as
    // being able to sell under it.
    //
    // Text exists now, so the licence CAN be accepted. What makes it lawful to sell is
    // the subscription checkout recording `sync-license@<version>` against the
    // subscription, the way create-checkout already records the download licence against
    // a purchase. Until that is wired, a subscriber is paying for a grant with no
    // evidence they ever agreed to it -- which is the condition the download path was in
    // before the clickwrap, and the reason a dispute then has nothing to show.
    const identifier = currentAgreementVersion(SYNC_LICENSE);
    expect(identifier).toBe('sync-license@2026-10-16');

    // Deliberately left as the next tripwire: when acceptance is wired, assert the
    // recorded identifier here too, so the two can never drift.
  });

  test('an unknown agreement is null rather than a fabricated identifier', () => {
    expect(currentAgreementVersion('not-an-agreement')).toBeNull();
    expect(currentAgreementVersion(undefined)).toBeNull();
  });
});

describe('parseAgreementVersion', () => {
  test('round-trips what currentAgreementVersion produces', () => {
    ALL_AGREEMENTS.filter((a) => CURRENT_VERSIONS[a]).forEach((agreement) => {
      const parsed = parseAgreementVersion(currentAgreementVersion(agreement));
      expect(parsed).toEqual({ agreement, version: CURRENT_VERSIONS[agreement] });
    });
  });

  test('returns null for anything malformed, never a partial object', () => {
    // A partial object is the dangerous case: a caller reading .agreement off it
    // gets undefined and may treat the acceptance as merely unrecognised rather
    // than as invalid.
    [
      null, undefined, 42, {}, [],
      '', '@', 'download-license', 'download-license@', '@2026-10-15',
      'bogus@2026-10-15'
    ].forEach((input) => {
      expect(parseAgreementVersion(input)).toBeNull();
    });
  });
});

describe('isCurrentAgreementVersion', () => {
  test('accepts the version in force', () => {
    expect(isCurrentAgreementVersion('download-license@2026-10-15')).toBe(true);
  });

  test('rejects a superseded version of a real agreement', () => {
    // The one that matters. A buyer whose tab was open across a terms change
    // assented to text that is no longer the offer; binding them to either version
    // would record an agreement that never happened.
    expect(isCurrentAgreementVersion('download-license@2020-01-01')).toBe(false);
    expect(isCurrentAgreementVersion('download-license@2099-01-01')).toBe(false);
  });

  test('rejects an agreement that has no published text', () => {
    expect(isCurrentAgreementVersion('contributor-upload@2026-09-19')).toBe(false);
    expect(isCurrentAgreementVersion('sync-license@2026-09-19')).toBe(false);
  });

  test('rejects missing, malformed and invented identifiers', () => {
    [null, undefined, '', 'true', 'yes', 'accepted', 'download-license', 'x@y']
      .forEach((input) => {
        expect(isCurrentAgreementVersion(input)).toBe(false);
      });
  });
});

describe('agreementLabel', () => {
  test('names each agreement for the UI', () => {
    expect(agreementLabel(DOWNLOAD_LICENSE)).toBe('Download License Terms');
    expect(agreementLabel(CONTRIBUTOR_UPLOAD)).toBe('Contributor Upload Agreement');
  });

  test('shows an unknown value rather than going blank', () => {
    expect(agreementLabel('mystery')).toBe('mystery');
    expect(agreementLabel(null)).toBe('Agreement');
  });
});

describe('requireable from outside the bundler', () => {
  test('exports through module.exports so Netlify functions can require it', () => {
    // create-checkout.js requires this file directly, the same way it requires
    // pricing.js. If it ever becomes ESM-only the checkout stops enforcing
    // acceptance at build time rather than at review time.
    const mod = require('./agreements');
    expect(typeof mod.currentAgreementVersion).toBe('function');
    expect(typeof mod.isCurrentAgreementVersion).toBe('function');
    expect(typeof mod.parseAgreementVersion).toBe('function');
  });
});
