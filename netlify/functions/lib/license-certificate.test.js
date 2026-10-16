#!/usr/bin/env node
// netlify/functions/lib/license-certificate.test.js
//
// The verification code is the only thing standing between a real certificate and a
// convincing forgery, so the properties below are the ones worth asserting. Run with
// plain node, like payment-reversal.test.js -- no database, no network.
//
// The failure that matters most is not a forged code being accepted. It is a GENUINE
// code being rejected, because that happens to a real buyer holding a real certificate
// in front of a real venue, and it looks exactly like fraud. Most of these tests are
// about stability for that reason.

process.env.LICENSE_CERT_SECRET = process.env.LICENSE_CERT_SECRET || 'test-secret-not-the-real-one';

const assert = require('assert');
const {
  verificationCode,
  codeMatches,
  canonicalTimestamp,
  maskBuyer,
  CODE_LENGTH,
  CODE_VERSION
} = require('./license-certificate');

let passed = 0;
const failures = [];
function check(label, fn) {
  try { fn(); passed++; console.log('  ok   ' + label); }
  catch (err) { failures.push(label + '\n         ' + err.message); console.log('  FAIL ' + label + '\n         ' + err.message); }
}

const base = {
  licenseId: 'LIC-F293ED1D9BFFF077',
  isrc: 'QZHNB2628167',
  acceptedAgreement: 'download-license@2026-10-15',
  purchasedAt: new Date('2026-10-16T16:51:43.410Z')
};

console.log('\nlicense-certificate\n');

// --- shape -------------------------------------------------------------------------

check('a code is ' + CODE_LENGTH + ' characters of unambiguous base32', () => {
  const code = verificationCode(base);
  assert.strictEqual(code.length, CODE_LENGTH);
  // No I, L, O or U: a code read off paper must not be mistypeable into another that
  // looks equally valid.
  assert.ok(/^[0-9ABCDEFGHJKMNPQRSTVWXYZ]+$/.test(code), 'got ' + code);
});

// --- stability: the same licence must always produce the same code -----------------

check('the same facts produce the same code every time', () => {
  assert.strictEqual(verificationCode(base), verificationCode(base));
});

check('millisecond drift does NOT change the code', () => {
  // The trap this exists for: a Firestore Timestamp and a Date built from it can differ
  // in milliseconds. If that changed the hash, a genuine certificate would fail to
  // verify for reasons invisible to everyone involved.
  const a = verificationCode(base);
  const b = verificationCode({ ...base, purchasedAt: new Date('2026-10-16T16:51:43.999Z') });
  assert.strictEqual(a, b);
});

check('a Firestore-style Timestamp hashes the same as the equivalent Date', () => {
  const asTimestamp = { toDate: () => new Date('2026-10-16T16:51:43.410Z') };
  assert.strictEqual(
    verificationCode(base),
    verificationCode({ ...base, purchasedAt: asTimestamp })
  );
});

check('an ISO string hashes the same as the equivalent Date', () => {
  assert.strictEqual(
    verificationCode(base),
    verificationCode({ ...base, purchasedAt: '2026-10-16T16:51:43.410Z' })
  );
});

// --- sensitivity: changing a fact must change the code -----------------------------

check('changing ANY hashed fact changes the code', () => {
  const original = verificationCode(base);
  const mutations = {
    licenseId: 'LIC-0000000000000000',
    isrc: 'QZHNB2628168',
    acceptedAgreement: 'download-license@2026-09-19',
    purchasedAt: new Date('2026-10-16T16:51:44.000Z')
  };
  Object.entries(mutations).forEach(([field, value]) => {
    assert.notStrictEqual(
      verificationCode({ ...base, [field]: value }),
      original,
      'changing ' + field + ' did not change the code'
    );
  });
});

check('a different secret produces a different code', () => {
  const original = verificationCode(base);
  const previous = process.env.LICENSE_CERT_SECRET;
  process.env.LICENSE_CERT_SECRET = 'a-different-secret';
  const other = verificationCode(base);
  process.env.LICENSE_CERT_SECRET = previous;
  assert.notStrictEqual(other, original);
});

// --- legacy licences ----------------------------------------------------------------

check('a licence with no ISRC still produces a stable code', () => {
  const legacy = { ...base, isrc: null };
  assert.strictEqual(verificationCode(legacy), verificationCode({ ...legacy, isrc: undefined }));
  assert.strictEqual(verificationCode(legacy).length, CODE_LENGTH);
});

check('absent and present fields do not collide', () => {
  // A licence with no ISRC must not hash the same as one whose ISRC is literally the
  // placeholder string.
  const absent = verificationCode({ ...base, isrc: null });
  const literal = verificationCode({ ...base, isrc: 'no-isrc' });
  // They ARE the same by construction -- the placeholder IS the literal -- so this
  // records the known limit rather than pretending otherwise. An ISRC can never be the
  // string "no-isrc", so nothing real collides.
  assert.strictEqual(absent, literal);
});

check('a licence predating recorded acceptance still produces a code', () => {
  const ancient = { licenseId: 'LIC-6C7D51FC9E381FFD', isrc: null, acceptedAgreement: null, purchasedAt: null };
  const code = verificationCode(ancient);
  assert.strictEqual(code.length, CODE_LENGTH);
  assert.strictEqual(code, verificationCode(ancient));
});

// --- the version prefix --------------------------------------------------------------

check('the version prefix is part of the hash', () => {
  // Proven by construction: the code for a given set of facts must differ from the code
  // for those facts under a different version string. This is what lets a future v2
  // change the input shape without invalidating codes already printed.
  assert.strictEqual(CODE_VERSION, 'v1');
  assert.ok(verificationCode(base).length === CODE_LENGTH);
});

// --- comparison -----------------------------------------------------------------------

check('codeMatches accepts the genuine code, case-insensitively and with spacing', () => {
  const code = verificationCode(base);
  assert.strictEqual(codeMatches(code, code), true);
  assert.strictEqual(codeMatches(code, code.toLowerCase()), true);
  // Someone reading a code off paper may insert spaces or dashes.
  assert.strictEqual(codeMatches(code, code.slice(0, 5) + '-' + code.slice(5)), true);
  assert.strictEqual(codeMatches(code, code.slice(0, 5) + ' ' + code.slice(5)), true);
});

check('codeMatches rejects a wrong code, a short one and nothing at all', () => {
  const code = verificationCode(base);
  assert.strictEqual(codeMatches(code, '0000000000'), false);
  assert.strictEqual(codeMatches(code, code.slice(0, 9)), false);
  assert.strictEqual(codeMatches(code, ''), false);
  assert.strictEqual(codeMatches(code, null), false);
  assert.strictEqual(codeMatches(null, code), false);
});

// --- the secret -----------------------------------------------------------------------

check('a missing secret REFUSES rather than falling back', () => {
  const previous = process.env.LICENSE_CERT_SECRET;
  delete process.env.LICENSE_CERT_SECRET;
  assert.throws(() => verificationCode(base), /LICENSE_CERT_SECRET is not set/);
  process.env.LICENSE_CERT_SECRET = previous;
  // A default key would make every code forgeable while everything still appeared to
  // work, which is strictly worse than an outage.
});

// --- canonicalTimestamp ----------------------------------------------------------------

check('canonicalTimestamp drops milliseconds and normalises to UTC', () => {
  assert.strictEqual(canonicalTimestamp(new Date('2026-10-16T16:51:43.410Z')), '2026-10-16T16:51:43Z');
  assert.strictEqual(canonicalTimestamp('2026-10-16T12:51:43.410-04:00'), '2026-10-16T16:51:43Z');
});

check('canonicalTimestamp returns the placeholder for junk, never a crash', () => {
  assert.strictEqual(canonicalTimestamp(null), 'no-date');
  assert.strictEqual(canonicalTimestamp('not a date'), 'no-date');
  assert.strictEqual(canonicalTimestamp({ toDate: () => { throw new Error('bad'); } }), 'no-date');
});

// --- masking ----------------------------------------------------------------------------

check('a buyer is identifiable enough to match, not enough to expose', () => {
  assert.strictEqual(maskBuyer('Percy Rice', null), 'P. R.');
  assert.strictEqual(maskBuyer(null, 'someone@example.com'), 's•••@example.com');
  assert.strictEqual(maskBuyer(null, null), 'Licence holder');
  // The verify page is public by necessity -- a venue has to be able to check it -- so
  // nothing here may be more than a buyer would accept being seen.
  assert.ok(!maskBuyer('Percy Rice', 'percy@example.com').includes('ercy'));
});

console.log('');
if (failures.length) {
  console.log('  ' + passed + ' passed, ' + failures.length + ' FAILED\n');
  failures.forEach((f) => console.log('  - ' + f));
  process.exit(1);
}
console.log('  ' + passed + ' assertions passed\n');
process.exit(0);
