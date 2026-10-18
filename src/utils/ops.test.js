// src/utils/ops.test.js
//
// The ops vocabulary. Pinned because every reader and writer of an ops item -- the
// admin page, any agent, the tests -- takes its shape from here, and the failure mode
// is drift: a dashboard and an agent that disagree about what a status MEANS, which
// surfaces as Percy approving something that never moves.
//
// The assertions worth most are the two REFUSALS. An approval gate that can be walked
// past is decoration, and a legal item that proposes an answer is this platform giving
// itself legal advice.

const Ops = require('./ops');

const base = {
  kind: 'incident',
  id: '2026-10-18-checkout-collection-price-mismatch',
  created: '2026-10-18T10:00:00Z',
  by: 'reviewer:checkout',
  area: 'checkout',
  severity: 'high',
  title: 'The collection page quotes a price Stripe does not charge',
  what: 'A buyer sees $209 on the page and is billed $219 at checkout.',
  status: 'open',
  fingerprint: 'checkout:create-checkout.js:collection-price',
  verified: true
};

describe('areas mirror BFMG, not the station', () => {
  test('the six areas are where money and rights actually move', () => {
    expect(Object.keys(Ops.AREAS).sort()).toEqual(
      ['catalogue', 'checkout', 'fulfilment', 'legal', 'quality', 'storefront']
    );
  });

  test('the station vocabulary is REFUSED, not quietly accepted', () => {
    // 'engine', 'desk', 'listener' and 'social' are the station's areas. Accepting them
    // would let an agent briefed on the wrong rulebook file against BFMG and look fine.
    ['engine', 'desk', 'listener', 'social', 'backend'].forEach((area) => {
      expect(Ops.problems({ ...base, area })).toContain(
        'area must be one of storefront, checkout, fulfilment, catalogue, legal, quality'
      );
    });
    // An EMPTY area is refused too, by the required-field check rather than the
    // area check. Both are correct refusals and the messages differ deliberately:
    // "missing area" tells an agent it forgot a field, the list tells it the field
    // was wrong. Asserted separately so neither can silently stop firing.
    expect(Ops.problems({ ...base, area: '' })).toContain('missing area');
  });

  test('every area is described, so an agent can place a finding', () => {
    Object.values(Ops.AREAS).forEach((desc) => {
      expect(typeof desc).toBe('string');
      expect(desc.length).toBeGreaterThan(20);
    });
  });

  test('every severity is defined in consequences, not adjectives', () => {
    // "High" is the word every reporter reaches for. A scale nobody shares produces a
    // queue sorted by how strongly each agent felt.
    Ops.SEVERITIES.forEach((s) => {
      expect(typeof Ops.SEVERITY_MEANS[s]).toBe('string');
    });
    expect(Ops.SEVERITY_MEANS.critical).toMatch(/money|licence|secret/i);
  });
});

describe('problems() — what makes a record fileable', () => {
  test('a well-formed incident has no problems', () => {
    expect(Ops.problems(base)).toEqual([]);
  });

  test('AN UNCONFIRMED FINDING MUST SAY SO', () => {
    // The one that protects the queue's meaning. Without it a guess and a proven fact
    // look identical, and the queue is what Percy decides from.
    const { verified, ...noFlag } = base;
    expect(Ops.problems(noFlag)).toContain(
      'verified must be true or false — an unconfirmed finding must say so'
    );
    // false is VALID and meaningful: "I could not confirm this".
    expect(Ops.problems({ ...base, verified: false })).toEqual([]);
  });

  test('A LEGAL ITEM MAY BE FLAGGED, NEVER ANSWERED', () => {
    // Three licences are published and no lawyer has read any of them. An agent
    // proposing legal wording would be this platform advising itself.
    expect(Ops.problems({ ...base, area: 'legal', proposedFix: 'Add an indemnity clause' }))
      .toContain('a legal item must set forLawyer: true rather than proposing an answer');

    expect(Ops.problems({
      ...base, area: 'legal', proposedFix: 'A lawyer should decide the wording', forLawyer: true
    })).toEqual([]);
  });

  test('every missing required field is reported, not just the first', () => {
    // An agent told only "invalid" files the same broken record again.
    const reported = Ops.problems({ kind: 'incident' });
    ['id', 'created', 'by', 'area', 'severity', 'title', 'what', 'status', 'fingerprint']
      .forEach((k) => expect(reported).toContain(`missing ${k}`));
  });

  test('the id must be date-area-slug so it sorts and cannot collide', () => {
    expect(Ops.problems({ ...base, id: 'Checkout Price Bug' }))
      .toContain('id must be date-area-slug, lowercase');
  });

  test('an unknown owner is refused rather than ignored', () => {
    expect(Ops.problems({ ...base, owner: 'claude' })).toContain('owner must be one of percy');
    expect(Ops.problems({ ...base, owner: 'percy' })).toEqual([]);
  });

  test('a CHECK is held to a different contract from an incident', () => {
    // A reconciler reports its own state and is never decided. Demanding a severity and
    // a fingerprint from `npm run verify:csp` is asking a thermometer for an opinion.
    const check = { kind: 'check', id: 'verify-csp', title: 'CSP copies reconcile', command: 'npm run verify:csp', state: 'pass' };
    expect(Ops.problems(check)).toEqual([]);
    expect(Ops.problems({ ...check, state: 'exploded' })).toContain('state must be pass, fail or unknown');
    expect(Ops.problems({ kind: 'check', id: 'x' })).toEqual(['missing title', 'missing command']);
  });
});

describe('transition() — the approval gate', () => {
  test('ONLY PERCY CAN APPROVE, DECLINE OR MERGE-APPROVE', () => {
    // The whole point of the desk. A gate an agent can walk past is decoration.
    ['approved', 'declined'].forEach((to) => {
      expect(() => Ops.transition(base, to, 'fixer')).toThrow(/only Percy/);
      expect(() => Ops.transition(base, to, 'reviewer:checkout')).toThrow(/only Percy/);
      expect(Ops.transition(base, to, 'percy').status).toBe(to);
    });
  });

  test('an agent may not touch an item Percy owns', () => {
    const mine = { ...base, owner: 'percy' };
    expect(() => Ops.transition(mine, 'resolved', 'fixer')).toThrow(/Percy's own item/);
    expect(Ops.transition(mine, 'resolved', 'percy').status).toBe('resolved');
  });

  test('an illegal move is refused with the reason', () => {
    expect(() => Ops.transition(base, 'merged', 'percy')).toThrow(/cannot go from open to merged/);
    expect(() => Ops.transition(base, 'invented', 'percy')).toThrow(/unknown status/);
  });

  test('merged is terminal — nothing escapes it', () => {
    expect(Ops.NEXT.merged).toEqual([]);
  });

  test('every status is reachable, so none is a dead letter', () => {
    const reachable = new Set(Object.values(Ops.NEXT).flat());
    Object.keys(Ops.STATUSES).forEach((s) => {
      if (s === 'open') return; // the entry point
      expect(reachable.has(s)).toBe(true);
    });
  });

  test('history is appended, never replaced — it is the audit trail', () => {
    const once = Ops.transition(base, 'approved', 'percy', 'go ahead');
    const twice = Ops.transition(once, 'fixing', 'fixer');
    expect(twice.history).toHaveLength(2);
    expect(twice.history[0]).toMatchObject({ status: 'approved', by: 'percy', note: 'go ahead' });
    expect(twice.history[1]).toMatchObject({ status: 'fixing', by: 'fixer' });
    // And the original is untouched: a caller that keeps the old object still sees the
    // old state rather than a mutated one.
    expect(base.history).toBeUndefined();
  });
});

describe('sort() and needsPercy() — what the desk shows first', () => {
  test('sorted by DOES THIS NEED YOU, not by how bad it is', () => {
    // A critical Percy already approved is being handled. A low nobody has looked at is
    // still a question for him.
    const approvedCritical = { ...base, id: 'a', severity: 'critical', status: 'approved' };
    const openLow = { ...base, id: 'b', severity: 'low', status: 'open' };
    expect(Ops.sort([approvedCritical, openLow])[0].id).toBe('b');
  });

  test('among undecided items, the worst comes first', () => {
    const low = { ...base, id: 'b', severity: 'low' };
    const critical = { ...base, id: 'a', severity: 'critical' };
    expect(Ops.sort([low, critical])[0].id).toBe('a');
  });

  test('needsPercy covers all three kinds', () => {
    expect(Ops.needsPercy(base)).toBe(true);                                    // open
    expect(Ops.needsPercy({ ...base, status: 'fixing' })).toBe(false);          // in hand
    expect(Ops.needsPercy({ ...base, status: 'fix-ready' })).toBe(true);        // his review
    expect(Ops.needsPercy({ ...base, owner: 'percy', status: 'open' })).toBe(true);
    expect(Ops.needsPercy({ ...base, owner: 'percy', status: 'resolved' })).toBe(false);
    expect(Ops.needsPercy({ kind: 'check', state: 'fail' })).toBe(true);
    expect(Ops.needsPercy({ kind: 'check', state: 'pass' })).toBe(false);
    expect(Ops.needsPercy(null)).toBe(false);
  });
});

describe('requireable from outside the bundler', () => {
  test('exports through module.exports so an agent under node can validate', () => {
    // An agent must be able to check a record BEFORE writing it. If this becomes
    // ESM-only, that check breaks at run time rather than at review time.
    const mod = require('./ops');
    ['problems', 'transition', 'idFor', 'sort', 'needsPercy'].forEach((fn) => {
      expect(typeof mod[fn]).toBe('function');
    });
  });
});

describe('referenceFor() — the short name you say out loud', () => {
  // These codes end up in commit messages, in chat, and written down. Changing the
  // function renumbers every incident anyone ever referenced, so it is as close to a
  // published contract as a pure function gets.

  test('is STABLE for a given id', () => {
    expect(Ops.referenceFor(base.id)).toBe(Ops.referenceFor(base.id));
    // Pinned, so a refactor of the hash cannot silently renumber history.
    expect(Ops.referenceFor('2026-10-18-legal-lawyer-review-three-licences')).toBe('OPS-VW9CK');
  });

  test('uses the certificate alphabet — no I, L, O or U', () => {
    // A code read aloud or off a screen must not be mistypeable into a different
    // valid-looking one. license-certificate.js established this alphabet; a second
    // scheme would be two things to learn and two to get wrong.
    for (let i = 0; i < 400; i += 1) {
      const ref = Ops.referenceFor(`2026-10-18-checkout-finding-${i}`);
      expect(ref).toMatch(/^OPS-[0-9ABCDEFGHJKMNPQRSTVWXYZ]{5}$/);
      expect(ref.slice(4)).not.toMatch(/[ILOU]/);
    }
  });

  test('DOES NOT COLLIDE across a realistic volume', () => {
    // The one failure this field cannot have: two incidents sharing a reference. Five
    // characters was chosen by measuring — four collided 17 times over this same set.
    const areas = ['storefront', 'checkout', 'fulfilment', 'catalogue', 'legal', 'quality'];
    const seen = new Set();
    for (let i = 0; i < 5000; i += 1) {
      const id = `2026-${String(1 + (i % 12)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}-${areas[i % 6]}-finding-number-${i}`;
      seen.add(Ops.referenceFor(id));
    }
    expect(seen.size).toBe(5000);
  });

  test('a missing or non-string id has no reference, rather than a fake one', () => {
    [null, undefined, '', 42, {}].forEach((bad) => {
      expect(Ops.referenceFor(bad)).toBeNull();
    });
  });

  test('every seeded backlog item gets a distinct reference', () => {
    const { BACKLOG } = require('../data/opsBacklog');
    const refs = BACKLOG.map((b) => Ops.referenceFor(b.id));
    expect(refs.every((r) => /^OPS-[0-9A-Z]{5}$/.test(r))).toBe(true);
    expect(new Set(refs).size).toBe(BACKLOG.length);
  });
});

describe('findByReference() — quoting a code back', () => {
  const items = [base, { ...base, id: '2026-10-18-legal-lawyer-review-three-licences' }];

  test('finds the item by its exact reference', () => {
    const ref = Ops.referenceFor(base.id);
    expect(Ops.findByReference(items, ref).id).toBe(base.id);
  });

  test('tolerates lower case and a missing prefix, because that is how people type', () => {
    const ref = Ops.referenceFor(base.id);
    expect(Ops.findByReference(items, ref.toLowerCase()).id).toBe(base.id);
    expect(Ops.findByReference(items, ref.replace('OPS-', '')).id).toBe(base.id);
    expect(Ops.findByReference(items, `  ${ref}  `).id).toBe(base.id);
  });

  test('returns null rather than a wrong item when nothing matches', () => {
    expect(Ops.findByReference(items, 'OPS-ZZZZZ')).toBeNull();
    expect(Ops.findByReference(items, '')).toBeNull();
    expect(Ops.findByReference(null, 'OPS-VW9CK')).toBeNull();
  });
});
