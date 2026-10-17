#!/usr/bin/env node
// netlify/functions/lib/entitlement.test.js
//
// "May this user have the master of this record." The question every download answers.
//
// RUNS AGAINST AN IN-MEMORY FIRESTORE FAKE, in the manner of payment-reversal.test.js,
// and for the same reason: a test that proves entitlement by reading production is a
// test whose fixtures are somebody's real purchase.
//
// The fake reproduces the one Firestore behaviour that breaks this module for real: a
// document is EXCLUDED from a query naming a field it lacks. A fake that matched
// everything would pass a test the real database fails.
//
// WHAT THE COLLECTION CASE IS FOR. A commercial collection licence is the most expensive
// thing BFMG sells -- up to $319 for 56 tracks. Before the collection branch existed,
// resolveMasterEntitlement checked the track, then its album, then an active
// subscription, and a collection purchase matched none of those: the buyer who paid the
// most was the one refused. That failure is invisible in code review because every
// individual query is correct.

const assert = require('assert');
const { resolveMasterEntitlement } = require('./entitlement');

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
//
// Supports exactly what the module uses: collection().where().where().limit().get() on
// `purchases`, and collection().doc().get() on `users`.
function makeDb({ purchases = [], users = {} } = {}) {
  const matches = (doc, filters) =>
    filters.every(([field, , value]) => {
      // THE BEHAVIOUR THAT MATTERS: a missing field excludes the document, it does not
      // compare as undefined. This is what makes an omitted field hide a record from
      // the very query meant to find it.
      if (!(field in doc)) return false;
      return doc[field] === value;
    });

  const makeQuery = (rows, filters) => ({
    where: (field, op, value) => makeQuery(rows, filters.concat([[field, op, value]])),
    limit: (n) => makeQuery(rows, filters).then_limit(n),
    then_limit(n) {
      const self = makeQuery(rows, filters);
      return { ...self, get: async () => snapshot(rows.filter((r) => matches(r, filters)).slice(0, n)) };
    },
    get: async () => snapshot(rows.filter((r) => matches(r, filters)))
  });

  const snapshot = (rows) => ({
    empty: rows.length === 0,
    size: rows.length,
    docs: rows.map((r) => ({ id: r.__id || 'doc', data: () => r }))
  });

  return {
    collection(name) {
      if (name === 'purchases') return makeQuery(purchases, []);
      if (name === 'users') {
        return {
          doc: (id) => ({
            get: async () => ({
              exists: Object.prototype.hasOwnProperty.call(users, id),
              data: () => users[id]
            })
          })
        };
      }
      throw new Error('fake db: unexpected collection ' + name);
    }
  };
}

const PAID = { status: 'completed' };

(async () => {
  console.log('\nentitlement — may this user have this master?\n');

  // --- the collection grant --------------------------------------------------------

  await check('a collection licence entitles a track inside that collection', async () => {
    const db = makeDb({
      purchases: [{ ...PAID, userId: 'u1', itemId: 'late-night-jazz', licenseId: 'LIC-COLL' }]
    });
    const result = await resolveMasterEntitlement(db, 'u1', 'song-41', {
      collectionId: 'late-night-jazz'
    });
    assert.strictEqual(result.entitled, true, 'should be entitled via the collection');
    assert.strictEqual(result.via, 'collection');
    assert.strictEqual(result.licenseId, 'LIC-COLL');
  });

  await check('THE REGRESSION THIS BRANCH EXISTS FOR: without it, a $319 buyer is refused', async () => {
    // Same fixture, but the song does not say which collection it belongs to -- which
    // is the state the join depends on. Proves the entitlement comes from the
    // collectionId join and not from something incidental in the fake.
    const db = makeDb({
      purchases: [{ ...PAID, userId: 'u1', itemId: 'late-night-jazz', licenseId: 'LIC-COLL' }]
    });
    const result = await resolveMasterEntitlement(db, 'u1', 'song-41', {});
    assert.strictEqual(result.entitled, false);
  });

  await check('a collection licence does NOT entitle a track from another collection', async () => {
    const db = makeDb({
      purchases: [{ ...PAID, userId: 'u1', itemId: 'late-night-jazz', licenseId: 'LIC-COLL' }]
    });
    const result = await resolveMasterEntitlement(db, 'u1', 'song-99', {
      collectionId: 'deep-sleep'
    });
    assert.strictEqual(result.entitled, false, 'buying one collection must not open another');
  });

  await check('another user\'s collection licence entitles nothing', async () => {
    const db = makeDb({
      purchases: [{ ...PAID, userId: 'someone-else', itemId: 'late-night-jazz' }]
    });
    const result = await resolveMasterEntitlement(db, 'u1', 'song-41', {
      collectionId: 'late-night-jazz'
    });
    assert.strictEqual(result.entitled, false);
  });

  await check('an UNPAID collection purchase entitles nothing', async () => {
    // `status` is the payment state. A session that was created and abandoned must not
    // hand over 56 masters.
    const db = makeDb({
      purchases: [{ status: 'pending', userId: 'u1', itemId: 'late-night-jazz' }]
    });
    const result = await resolveMasterEntitlement(db, 'u1', 'song-41', {
      collectionId: 'late-night-jazz'
    });
    assert.strictEqual(result.entitled, false);
  });

  // --- revocation cascades through the collection -----------------------------------

  await check('REVOKING A COLLECTION LICENCE CASCADES to every track in it', async () => {
    // Without this, a buyer whose $319 licence was revoked for a chargeback simply
    // downloads the collection's contents one track at a time and the revocation
    // achieves nothing. Same rule the album branch already enforced.
    const db = makeDb({
      purchases: [{
        ...PAID,
        userId: 'u1',
        itemId: 'late-night-jazz',
        licenseId: 'LIC-COLL',
        licenseRevoked: true,
        licenseRevokedReason: 'chargeback'
      }]
    });
    const result = await resolveMasterEntitlement(db, 'u1', 'song-41', {
      collectionId: 'late-night-jazz'
    });
    assert.strictEqual(result.entitled, false);
    assert.strictEqual(result.revoked, true, 'must say REVOKED, not "never bought"');
    assert.strictEqual(result.revokedReason, 'chargeback');
    assert.strictEqual(result.licenseId, 'LIC-COLL', 'the licence id is needed for support');
  });

  await check('a revoked SINGLE is still served if a good collection licence covers it', async () => {
    // Order matters. Revocation is targeted at a person and a record; a separate, valid
    // licence over the same recording must still be honoured.
    const db = makeDb({
      purchases: [
        { ...PAID, userId: 'u1', itemId: 'song-41', licenseId: 'LIC-SINGLE', licenseRevoked: true },
        { ...PAID, userId: 'u1', itemId: 'late-night-jazz', licenseId: 'LIC-COLL' }
      ]
    });
    const result = await resolveMasterEntitlement(db, 'u1', 'song-41', {
      collectionId: 'late-night-jazz'
    });
    assert.strictEqual(result.entitled, true);
    assert.strictEqual(result.via, 'collection');
  });

  await check('a revoked collection licence beats an active SUBSCRIPTION', async () => {
    // The deliberate part, inherited from the album rule: letting a subscription hand
    // back what was just withdrawn makes revocation meaningless for anyone on a plan --
    // and a subscriber is exactly who is most able to abuse the catalogue.
    const db = makeDb({
      purchases: [{
        ...PAID, userId: 'u1', itemId: 'late-night-jazz',
        licenseId: 'LIC-COLL', licenseRevoked: true, licenseRevokedReason: 'refund'
      }],
      users: { u1: { subscription: { status: 'active', tier: 'Creator' } } }
    });
    const result = await resolveMasterEntitlement(db, 'u1', 'song-41', {
      collectionId: 'late-night-jazz'
    });
    assert.strictEqual(result.entitled, false);
    assert.strictEqual(result.revoked, true);
  });

  // --- the pre-existing paths still behave ------------------------------------------

  await check('a direct purchase still entitles, and reports via: purchase', async () => {
    const db = makeDb({
      purchases: [{ ...PAID, userId: 'u1', itemId: 'song-41', licenseId: 'LIC-ONE' }]
    });
    const result = await resolveMasterEntitlement(db, 'u1', 'song-41', { collectionId: 'c1' });
    assert.strictEqual(result.entitled, true);
    assert.strictEqual(result.via, 'purchase');
  });

  await check('an album purchase still entitles, and is checked before the collection', async () => {
    const db = makeDb({
      purchases: [{ ...PAID, userId: 'u1', itemId: 'album-7', licenseId: 'LIC-ALBUM' }]
    });
    const result = await resolveMasterEntitlement(db, 'u1', 'song-41', {
      albumId: 'album-7', collectionId: 'late-night-jazz'
    });
    assert.strictEqual(result.entitled, true);
    assert.strictEqual(result.via, 'album');
  });

  await check('an active subscription still entitles when nothing was bought', async () => {
    const db = makeDb({
      users: { u1: { subscription: { status: 'active', tier: 'Creator' } } }
    });
    const result = await resolveMasterEntitlement(db, 'u1', 'song-41', { collectionId: 'c1' });
    assert.strictEqual(result.entitled, true);
    assert.strictEqual(result.via, 'subscription:creator');
  });

  await check('nothing bought and no subscription entitles nothing', async () => {
    const db = makeDb({});
    const result = await resolveMasterEntitlement(db, 'u1', 'song-41', { collectionId: 'c1' });
    assert.strictEqual(result.entitled, false);
    assert.strictEqual(result.via, null);
    assert.notStrictEqual(result.revoked, true, 'never bought is not the same as revoked');
  });

  await check('a missing userId or songId is refused rather than queried', async () => {
    const db = makeDb({ purchases: [{ ...PAID, userId: 'u1', itemId: 'song-41' }] });
    assert.strictEqual((await resolveMasterEntitlement(db, null, 'song-41', {})).entitled, false);
    assert.strictEqual((await resolveMasterEntitlement(db, 'u1', null, {})).entitled, false);
  });

  await check('a song with no metadata at all does not throw', async () => {
    // songData is read from Firestore and can be undefined when the document is gone.
    // A throw here is a 500 on a download the buyer is entitled to.
    const db = makeDb({});
    assert.strictEqual((await resolveMasterEntitlement(db, 'u1', 'song-41')).entitled, false);
    assert.strictEqual((await resolveMasterEntitlement(db, 'u1', 'song-41', null)).entitled, false);
  });

  console.log('');
  if (failures.length) {
    console.error(failures.length + ' FAILURE(S):\n  ' + failures.join('\n  ') + '\n');
    process.exit(1);
  }
  console.log('  ' + passed + ' checks passed\n');
  process.exit(0);
})();
