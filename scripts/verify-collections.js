#!/usr/bin/env node
//
// scripts/verify-collections.js
//
//   npm run verify:collections
//
// Reconciles the collections/ documents against the songs they claim.
//
// WHY A RECONCILER RATHER THAN A PROMISE
// `trackCount` and `coverUrl` on a collection are DERIVED COPIES -- the truth is the
// set of songs carrying that collectionId. A copy that never reconciles is a second
// source of truth, so this is the thing that makes the copy legitimate rather than a
// liability. Run it after any ingest.
//
// Every check here corresponds to a way the library has actually broken before:
//
//   - a track with no collectionId is invisible in the new browse structure while
//     still counting toward the pool, which is how Percy's albums ended up at rank
//     783 of 923 -- present in the data, absent from every surface.
//   - a collectionId pointing at no document renders an empty page rather than an
//     error, the same silent shape as the missing composite index.
//   - a stale trackCount is a number on a card that contradicts the page behind it.

const { initAdmin } = require('./lib/admin');

const LIBRARY_POOLS = ['production-music', 'functional-music'];

(async () => {
  const { admin, projectId } = initAdmin();
  const db = admin.firestore();

  const failures = [];
  const warn = [];

  const cols = await db.collection('collections').get();
  const songs = await db
    .collection('songs')
    .where('assetPool', 'in', LIBRARY_POOLS)
    .get();

  console.log('project: ' + projectId);
  console.log('collections: ' + cols.size + '   library songs: ' + songs.size);
  console.log('');

  // Actual membership, from the songs themselves.
  const actual = new Map();
  const noCollection = [];

  songs.docs.forEach((d) => {
    const id = d.data().collectionId;
    if (!id) {
      noCollection.push(d.data().title || d.id);
      return;
    }
    if (!actual.has(id)) actual.set(id, []);
    actual.get(id).push(d);
  });

  if (noCollection.length) {
    failures.push(
      noCollection.length + ' library song(s) have no collectionId — invisible in browse. ' +
      'First: ' + noCollection.slice(0, 3).join(', ')
    );
  }

  const declaredIds = new Set(cols.docs.map((d) => d.id));

  // Songs pointing at a collection that does not exist.
  for (const id of actual.keys()) {
    if (!declaredIds.has(id)) {
      failures.push(
        'collectionId "' + id + '" is on ' + actual.get(id).length +
        ' song(s) but has no collections/ document — the page would render empty'
      );
    }
  }

  // Each declared collection against its real membership.
  cols.docs.forEach((d) => {
    const c = d.data();
    const mine = actual.get(d.id) || [];

    if (mine.length === 0) {
      failures.push('collection "' + d.id + '" claims ' + c.trackCount + ' tracks and has 0');
      return;
    }

    if (c.trackCount !== mine.length) {
      failures.push(
        'collection "' + d.id + '" trackCount is ' + c.trackCount +
        ' but ' + mine.length + ' songs carry it — stale derived copy, re-run the backfill'
      );
    }

    if (!c.slug) failures.push('collection "' + d.id + '" has no slug — the route reads it');
    if (c.slug && c.slug !== d.id) {
      failures.push('collection "' + d.id + '" slug is "' + c.slug + '" — must equal the doc id');
    }

    // A collection whose tracks span pools is an upstream classification error. It
    // does not break a page, so it warns rather than fails.
    const pools = [...new Set(mine.map((s) => s.data().assetPool))];
    if (pools.length > 1) {
      warn.push('collection "' + d.id + '" spans pools: ' + pools.join(', '));
    } else if (c.assetPool && c.assetPool !== pools[0]) {
      failures.push(
        'collection "' + d.id + '" declares pool ' + c.assetPool +
        ' but its songs are ' + pools[0] + ' — it would appear on the wrong landing page'
      );
    }

    // The card renders this; an empty one is a broken tile, not a missing nicety.
    if (!c.coverUrl) warn.push('collection "' + d.id + '" has no coverUrl');
  });

  const covered = [...actual.values()].reduce((n, arr) => n + arr.length, 0);
  console.log('songs with a collectionId : ' + covered + ' of ' + songs.size);
  console.log('distinct collectionIds    : ' + actual.size);
  console.log('');

  warn.forEach((w) => console.log('  WARN  ' + w));
  failures.forEach((f) => console.log('  FAIL  ' + f));

  console.log('');
  if (failures.length) {
    console.error(failures.length + ' check(s) FAILED.');
    process.exit(1);
  }
  console.log('All checks passed.' + (warn.length ? '  (' + warn.length + ' warning(s))' : ''));
  process.exit(0);
})().catch((err) => {
  console.error('FAILED: ' + err.message);
  process.exit(1);
});
