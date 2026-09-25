// Pins license revocation.
//
// The clause in /terms says a license terminates on breach. These assertions are
// what makes that sentence enforceable rather than decorative, so the failure modes
// worth guarding are: a revocation that does not actually block, an unattributed one
// that cannot be defended, and a reinstatement that erases the history.

const {
  REVOCATION_REASONS, ALL_REASONS,
  isRevoked, revocationFields, reinstatementFields, describeRevocation
} = require('./licenseRevocation');

const AT = '2026-09-25T17:00:00.000Z';

describe('isRevoked', () => {
  test('only an explicit true revokes', () => {
    expect(isRevoked({ licenseRevoked: true })).toBe(true);
    expect(isRevoked({ licenseRevoked: false })).toBe(false);
    expect(isRevoked({})).toBe(false);
    expect(isRevoked(null)).toBe(false);
  });

  test('a reinstated license with revocation history reads as active', () => {
    // The history is evidence and is deliberately not erased on reinstatement, so
    // presence of revokedAt must NOT be what makes something revoked.
    expect(isRevoked({
      licenseRevoked: false,
      licenseRevokedAt: AT,
      licenseRevokedReason: REVOCATION_REASONS.BREACH_OF_TERMS
    })).toBe(false);
  });

  test('payment status and license state are independent', () => {
    // A paid purchase can be revoked; a refunded one can keep its license. Collapsing
    // these into `status` would break the entitlement check, which tests for exactly
    // 'completed'.
    expect(isRevoked({ status: 'completed', licenseRevoked: true })).toBe(true);
    expect(isRevoked({ status: 'refunded', licenseRevoked: false })).toBe(false);
  });
});

describe('revocationFields', () => {
  test('records reason, actor and time', () => {
    const f = revocationFields({
      reason: REVOCATION_REASONS.BREACH_OF_TERMS, by: 'percy@example.com', note: 'DJ set', at: AT
    });
    expect(f).toEqual({
      licenseRevoked: true,
      licenseRevokedReason: 'breach-of-terms',
      licenseRevokedBy: 'percy@example.com',
      licenseRevokedNote: 'DJ set',
      licenseRevokedAt: AT
    });
  });

  test('refuses an unattributed revocation', () => {
    // "The system revoked it" is not a defence.
    expect(() => revocationFields({ reason: REVOCATION_REASONS.FRAUD, at: AT })).toThrow(/by. is required/);
  });

  test('refuses a reason outside the vocabulary', () => {
    expect(() => revocationFields({ reason: 'because-i-said-so', by: 'x', at: AT })).toThrow(/unknown reason/);
    expect(() => revocationFields({ by: 'x', at: AT })).toThrow(/unknown reason/);
  });

  test('every reason has a label', () => {
    ALL_REASONS.forEach((r) => expect(describeRevocation({ licenseRevoked: true, licenseRevokedReason: r })).not.toMatch(/undefined/));
  });

  test('a takedown reason exists and is distinct from an ordinary removal', () => {
    // /terms promises licenses already sold survive a recording being removed, so
    // "we took it down" must not be a revocation reason by default.
    expect(ALL_REASONS).toContain(REVOCATION_REASONS.RIGHTS_WITHDRAWN);
    expect(ALL_REASONS).not.toContain('takedown');
  });
});

describe('reinstatementFields', () => {
  test('clears the flag but keeps the history', () => {
    const f = reinstatementFields({ by: 'percy@example.com', note: 'mistake', at: AT });
    expect(f.licenseRevoked).toBe(false);
    expect(f.licenseReinstatedBy).toBe('percy@example.com');
    // Crucially it does not null out the revocation fields.
    expect(Object.keys(f)).not.toContain('licenseRevokedReason');
    expect(Object.keys(f)).not.toContain('licenseRevokedAt');
  });

  test('is also attributed', () => {
    expect(() => reinstatementFields({ at: AT })).toThrow(/by. is required/);
  });

  test('round-trips: revoke then reinstate leaves an auditable record', () => {
    const purchase = { status: 'completed' };
    const revoked = { ...purchase, ...revocationFields({ reason: REVOCATION_REASONS.CHARGEBACK, by: 'a', at: AT }) };
    expect(isRevoked(revoked)).toBe(true);

    const restored = { ...revoked, ...reinstatementFields({ by: 'b', at: AT }) };
    expect(isRevoked(restored)).toBe(false);
    expect(restored.licenseRevokedReason).toBe('chargeback'); // history survives
    expect(restored.licenseReinstatedBy).toBe('b');
  });
});

describe('describeRevocation', () => {
  test('reads active when it is', () => {
    expect(describeRevocation({})).toBe('active');
  });

  test('names the reason when revoked', () => {
    expect(describeRevocation({ licenseRevoked: true, licenseRevokedReason: REVOCATION_REASONS.FRAUD }))
      .toMatch(/REVOKED.*Fraudulent/);
  });

  test('says so when a revocation has no reason recorded', () => {
    expect(describeRevocation({ licenseRevoked: true })).toMatch(/no reason recorded/);
  });
});
