#!/usr/bin/env node
// netlify/functions/lib/payment-reversal.test.js
//
// Tests for the refund/chargeback revocation path.
//
// Runs against an in-memory Firestore fake rather than the real database, for one
// reason that matters more than speed: these assertions are about REVOKING LICENCES,
// and a test that writes to production to prove it can revoke things is a test that can
// revoke a real buyer's licence when someone runs it on the wrong day.
//
// The fake implements only what this module uses -- collection().where().limit().get(),
// doc.ref.update() -- and deliberately reproduces the one Firestore behaviour that
// breaks this code in production: A DOCUMENT IS EXCLUDED FROM A QUERY NAMING A FIELD IT
// LACKS. A fake that returned every document on any `where` would pass a test that the
// real database fails.

const assert = require('assert');
const {
  revokeForPaymentReversal,
  shouldRevokeOnRefund,
  assertReversalJoinable
} = require('./payment-reversal');
const { REVOCATION_REASONS } = require('../../../src/utils/licenseRevocation');

const SERVER_TS = '<<server-timestamp>>';

let passed = 0;
const failures = [];
function check(label, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => { passed++; console.log('  ok   ' + label); })
    .catch((err) => {
      failures.push(label + '\n         ' + err.message);
      console.log('  FAIL ' + label + '\n         ' + err.message);
    });
}

// --- the fake ----------------------------------------------------------------------
function makeDb(seed) {
  const data = JSON.parse(JSON.stringify(seed));

  function collection(name) {
    const filters = [];
    const api = {
      where(field, op, value) {
        assert.strictEqual(op, '==', 'fake db only implements == ');
        filters.push([field, value]);
        return api;
      },
      limit() { return api; },
      async get() {
        const rows = Object.entries(data[name] || {})
          // The Firestore rule this fake exists to reproduce: a document missing the
          // field is NOT a non-match, it is invisible to the query entirely.
          .filter(([, doc]) => filters.every(([f, v]) =>
            Object.prototype.hasOwnProperty.call(doc, f) && doc[f] === v))
          .map(([id, doc]) => ({
            id,
            data: () => doc,
            ref: {
              async update(patch) { Object.assign(doc, patch); }
            }
          }));
        return { empty: rows.length === 0, size: rows.length, docs: rows };
      },
      doc(id) {
        return {
          async get() {
            const doc = (data[name] || {})[id];
            return { exists: !!doc, data: () => doc };
          },
          async set(value) {
            data[name] = data[name] || {};
            data[name][id] = value;
          }
        };
      }
    };
    return api;
  }

  return { collection, _data: data };
}

/** One paid purchase with a licence row hanging off it. */
function seedPaidPurchase(overrides) {
  return {
    purchases: {
      cs_live_abc: Object.assign({
        userId: 'buyer-1',
        itemId: 'song-1',
        itemName: 'The Words That Broke The Room',
        itemType: 'song',
        status: 'completed',
        licenseId: 'LIC-AAA',
        stripePaymentIntent: 'pi_1'
      }, overrides || {})
    },
    licenses: {
      lic_perp_1: {
        userId: 'buyer-1',
        trackId: 'song-1',
        status: 'active',
        validWhileSubscribed: false,
        purchaseLicenseId: 'LIC-AAA'
      }
    }
  };
}

(async () => {
  console.log('\npayment-reversal\n');

  // === shouldRevokeOnRefund ========================================================

  await check('a full refund revokes', () => {
    const d = shouldRevokeOnRefund({ refunded: true, amount: 199, amount_refunded: 199 });
    assert.strictEqual(d.revoke, true, d.why);
  });

  await check('a PARTIAL refund does not revoke (price adjustment, not fraud)', () => {
    const d = shouldRevokeOnRefund({ refunded: true, amount: 1199, amount_refunded: 200 });
    assert.strictEqual(d.revoke, false);
    assert.ok(/partial/i.test(d.why), 'reason should name the partial refund, got: ' + d.why);
  });

  await check('keep_license=true in refund metadata does not revoke', () => {
    const d = shouldRevokeOnRefund({
      refunded: true, amount: 199, amount_refunded: 199,
      refunds: { data: [{ metadata: { keep_license: 'true' } }] }
    });
    assert.strictEqual(d.revoke, false);
  });

  await check('a charge not marked refunded does not revoke', () => {
    assert.strictEqual(shouldRevokeOnRefund({ refunded: false, amount: 199, amount_refunded: 0 }).revoke, false);
    assert.strictEqual(shouldRevokeOnRefund(null).revoke, false);
  });

  // === the join ====================================================================

  await check('a purchase with no stripePaymentIntent is reported unjoinable', () => {
    assert.strictEqual(assertReversalJoinable({ status: 'completed' }).joinable, false);
    assert.strictEqual(assertReversalJoinable({ stripePaymentIntent: 'pi_1' }).joinable, true);
  });

  await check('a purchase missing stripePaymentIntent survives a chargeback — the silent failure', async () => {
    const db = makeDb(seedPaidPurchase({ stripePaymentIntent: undefined }));
    delete db._data.purchases.cs_live_abc.stripePaymentIntent;
    const r = await revokeForPaymentReversal(db, {
      paymentIntentId: 'pi_1', reason: REVOCATION_REASONS.CHARGEBACK, at: SERVER_TS
    });
    // This is the documented hazard, asserted so it cannot be mistaken for working.
    assert.strictEqual(r.revoked, 0, 'should find nothing to revoke');
    assert.strictEqual(db._data.purchases.cs_live_abc.licenseRevoked, undefined,
      'the row is unreachable, so it keeps its licence — this is why verify:reversal exists');
  });

  // === revocation ==================================================================

  await check('a chargeback revokes the purchase AND ends the licence row', async () => {
    const db = makeDb(seedPaidPurchase());
    const r = await revokeForPaymentReversal(db, {
      paymentIntentId: 'pi_1', reason: REVOCATION_REASONS.CHARGEBACK, note: 'dispute dp_1', at: SERVER_TS
    });

    assert.strictEqual(r.revoked, 1, 'one purchase revoked');
    assert.strictEqual(r.licencesEnded, 1, 'one licence row ended');

    const p = db._data.purchases.cs_live_abc;
    assert.strictEqual(p.licenseRevoked, true);
    assert.strictEqual(p.licenseRevokedReason, REVOCATION_REASONS.CHARGEBACK);
    assert.strictEqual(p.licenseRevokedBy, 'system:stripe-webhook');
    assert.strictEqual(p.licenseRevokedAt, SERVER_TS);
    // The payment state must NOT be touched: entitlement.js tests for exactly
    // 'completed', and overloading it would silently break every other purchase path.
    assert.strictEqual(p.status, 'completed', 'payment status is a separate axis and must be left alone');

    const l = db._data.licenses.lic_perp_1;
    assert.strictEqual(l.status, 'revoked');
    assert.strictEqual(l.validWhileSubscribed, false);
  });

  await check('a refund revokes with reason=refund', async () => {
    const db = makeDb(seedPaidPurchase());
    await revokeForPaymentReversal(db, {
      paymentIntentId: 'pi_1', reason: REVOCATION_REASONS.REFUND, at: SERVER_TS
    });
    assert.strictEqual(db._data.purchases.cs_live_abc.licenseRevokedReason, REVOCATION_REASONS.REFUND);
  });

  await check('an UNPAID purchase is still revoked if its payment is reversed', async () => {
    // The query does not filter on status, deliberately: a pending or failed purchase
    // whose payment was reversed should not be left holding a licence either.
    const db = makeDb(seedPaidPurchase({ status: 'pending' }));
    const r = await revokeForPaymentReversal(db, {
      paymentIntentId: 'pi_1', reason: REVOCATION_REASONS.REFUND, at: SERVER_TS
    });
    assert.strictEqual(r.revoked, 1);
  });

  // === idempotency, because Stripe redelivers ======================================

  await check('redelivery of the same event does not re-stamp the timestamp', async () => {
    const db = makeDb(seedPaidPurchase());
    await revokeForPaymentReversal(db, {
      paymentIntentId: 'pi_1', reason: REVOCATION_REASONS.CHARGEBACK, at: 'FIRST'
    });
    const second = await revokeForPaymentReversal(db, {
      paymentIntentId: 'pi_1', reason: REVOCATION_REASONS.CHARGEBACK, at: 'SECOND'
    });
    assert.strictEqual(second.revoked, 0, 'nothing new to revoke');
    assert.strictEqual(second.skipped, 1);
    assert.strictEqual(db._data.purchases.cs_live_abc.licenseRevokedAt, 'FIRST',
      'the original revocation time is the one a dispute turns on and must not move');
  });

  await check('a refund that becomes a chargeback ESCALATES the reason', async () => {
    const db = makeDb(seedPaidPurchase());
    await revokeForPaymentReversal(db, {
      paymentIntentId: 'pi_1', reason: REVOCATION_REASONS.REFUND, at: 'FIRST'
    });
    const second = await revokeForPaymentReversal(db, {
      paymentIntentId: 'pi_1', reason: REVOCATION_REASONS.CHARGEBACK, at: 'SECOND'
    });
    assert.strictEqual(second.revoked, 1, 'escalation is a real write, not a no-op');
    assert.strictEqual(db._data.purchases.cs_live_abc.licenseRevokedReason, REVOCATION_REASONS.CHARGEBACK);
  });

  await check('a chargeback is never DOWNGRADED to a refund', async () => {
    const db = makeDb(seedPaidPurchase());
    await revokeForPaymentReversal(db, {
      paymentIntentId: 'pi_1', reason: REVOCATION_REASONS.CHARGEBACK, at: 'FIRST'
    });
    const second = await revokeForPaymentReversal(db, {
      paymentIntentId: 'pi_1', reason: REVOCATION_REASONS.REFUND, at: 'SECOND'
    });
    assert.strictEqual(second.revoked, 0);
    assert.strictEqual(db._data.purchases.cs_live_abc.licenseRevokedReason, REVOCATION_REASONS.CHARGEBACK,
      'the more serious fact must stand');
  });

  // === things that must not happen ==================================================

  await check('an unrelated payment is left completely alone', async () => {
    const db = makeDb(seedPaidPurchase());
    const r = await revokeForPaymentReversal(db, {
      paymentIntentId: 'pi_SOMEONE_ELSE', reason: REVOCATION_REASONS.CHARGEBACK, at: SERVER_TS
    });
    assert.strictEqual(r.revoked, 0);
    assert.strictEqual(db._data.purchases.cs_live_abc.licenseRevoked, undefined);
    assert.strictEqual(db._data.licenses.lic_perp_1.status, 'active');
  });

  await check('another buyer\'s licence row is not ended', async () => {
    const seed = seedPaidPurchase();
    seed.licenses.lic_other = {
      userId: 'buyer-2', status: 'active', purchaseLicenseId: 'LIC-ZZZ'
    };
    const db = makeDb(seed);
    const r = await revokeForPaymentReversal(db, {
      paymentIntentId: 'pi_1', reason: REVOCATION_REASONS.CHARGEBACK, at: SERVER_TS
    });
    assert.strictEqual(r.licencesEnded, 1, 'only the matching licence');
    assert.strictEqual(db._data.licenses.lic_other.status, 'active');
  });

  await check('a bogus reason is refused rather than written', async () => {
    const db = makeDb(seedPaidPurchase());
    await assert.rejects(
      () => revokeForPaymentReversal(db, { paymentIntentId: 'pi_1', reason: 'because-i-said-so', at: SERVER_TS }),
      /reason must be/
    );
    await assert.rejects(
      () => revokeForPaymentReversal(db, { paymentIntentId: 'pi_1', reason: 'breach-of-terms', at: SERVER_TS }),
      /reason must be/,
      'even a VALID revocation reason is refused here — this path is only for payment reversals'
    );
  });

  await check('a missing paymentIntentId throws rather than matching everything', async () => {
    const db = makeDb(seedPaidPurchase());
    await assert.rejects(
      () => revokeForPaymentReversal(db, { reason: REVOCATION_REASONS.REFUND, at: SERVER_TS }),
      /paymentIntentId is required/
    );
  });

  // --- report ----------------------------------------------------------------------
  console.log('');
  if (failures.length) {
    console.log('  ' + passed + ' passed, ' + failures.length + ' FAILED\n');
    failures.forEach((f) => console.log('  - ' + f));
    process.exit(1);
  }
  console.log('  ' + passed + ' assertions passed\n');
  process.exit(0);
})();
