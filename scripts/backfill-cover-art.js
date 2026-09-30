#!/usr/bin/env node
//
// scripts/backfill-cover-art.js
//
//   npm run backfill:covers
//   npm run backfill:covers -- --apply
//
// Gives the 29 library tracks that have no artwork the cover of their own collection.
//
// WHY INHERIT RATHER THAN UPLOAD
// Every one of the 29 sits in a collection whose OTHER tracks have artwork -- 8 in
// Jazz-Infused Neo-Soul Instrumentals, 7 in Arabic Deep House, 6 in Balearic and so
// on. They are missing a cover because no image happened to sit beside them on disk,
// not because the collection has no identity.
//
// A production-library collection is a coherent set generated from one prompt. Its
// artwork describes the set, so a track without its own can honestly wear its
// neighbour's -- which is what a compilation does anyway. The alternative is a grey
// placeholder on a storefront tile, which reads as a broken product rather than a
// deliberate one.
//
// It POINTS AT AN EXISTING OBJECT rather than copying the file. Uploading a duplicate
// image per track would store the same bytes 29 times and create a second copy that
// can drift from the original if the artwork is ever replaced. One object, several
// records referencing it, is the same reasoning that keeps the master in one place.
//
// The donor is the FIRST cover in the collection sorted by title, so a re-run picks
// the same one. An arbitrary choice that changes between runs would make the
// storefront shuffle its own artwork for no reason.

const { loadEnv, initAdmin, assertProject, args, BATCH_SIZE } = require('./lib/admin');

const { has, value } = args();
const APPLY = has('--apply');
const EXPECT_PROJECT = value('project', null);

(async () => {
  loadEnv();
  const { admin, projectId, via } = initAdmin();
  const db = admin.firestore();
  assertProject(projectId, EXPECT_PROJECT);

  console.log('Project  : ' + projectId + '  (via ' + via + ')');
  console.log('Applying : ' + (APPLY ? 'YES' : 'no - dry run, pass --apply to write'));
  console.log('');

  const snapshot = await db.collection('songs').get();

  // Best available cover per collection: first by title, so the choice is stable.
  const coverByCollection = new Map();
  const missing = [];

  const records = snapshot.docs.map((doc) => ({
    id: doc.id,
    title: doc.get('title') || '',
    collection: doc.get('album') || doc.get('albumTitle') || '',
    coverUrl: doc.get('coverUrl') || ''
  }));

  records
    .filter((r) => r.coverUrl && r.collection)
    .sort((a, b) => a.title.localeCompare(b.title))
    .forEach((r) => {
      if (!coverByCollection.has(r.collection)) coverByCollection.set(r.collection, r.coverUrl);
    });

  records.filter((r) => !r.coverUrl).forEach((r) => {
    const donor = coverByCollection.get(r.collection);
    missing.push({ ...r, donor: donor || null });
  });

  const fixable = missing.filter((m) => m.donor);
  const orphans = missing.filter((m) => !m.donor);

  const byCollection = {};
  fixable.forEach((m) => { byCollection[m.collection] = (byCollection[m.collection] || 0) + 1; });

  console.log('  ' + missing.length + ' tracks have no coverUrl');
  console.log('  ' + fixable.length + ' can inherit their collection\'s artwork:');
  Object.entries(byCollection).sort((a, b) => b[1] - a[1])
    .forEach(([c, n]) => console.log('    ' + String(n).padStart(3) + '  ' + c));

  if (orphans.length) {
    console.log('');
    console.log('  ' + orphans.length + ' have NO cover anywhere in their collection - left for a human:');
    orphans.slice(0, 10).forEach((o) => console.log('    ' + o.collection + ' / ' + o.title));
  }

  if (!APPLY) {
    console.log('');
    console.log('Dry run only. Re-run with --apply.');
    return;
  }

  for (let i = 0; i < fixable.length; i += BATCH_SIZE) {
    const batch = db.batch();
    fixable.slice(i, i + BATCH_SIZE).forEach((m) => {
      batch.update(db.collection('songs').doc(m.id), { coverUrl: m.donor });
    });
    await batch.commit();
    console.log('  committed ' + Math.min(i + BATCH_SIZE, fixable.length) + '/' + fixable.length);
  }

  console.log('');
  console.log('Done. ' + fixable.length + ' records given their collection artwork.');
})().catch((err) => {
  console.error('FAILED: ' + err.message);
  process.exit(1);
});
