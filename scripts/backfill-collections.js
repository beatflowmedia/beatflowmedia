#!/usr/bin/env node
//
// scripts/backfill-collections.js
//
//   npm run backfill:collections            # dry run
//   npm run backfill:collections -- --apply
//
// Turns the production library's 24 collections into first-class records.
//
// WHY
// The library was imported BY FOLDER, and the folders were already collections --
// Percy's curation, done before any of this existed. The ingest kept the folder name,
// writing it to `album` and `albumTitle` on every track. It survived: 24 distinct
// values across 754 tracks, none missing.
//
// What did NOT survive is the join. Measured before this script:
//
//     library tracks with albumId          0 of 754
//     collections backed by a document     none
//
// So a collection is a string in a field nothing joins on. It cannot be linked to,
// priced, put in a cart, or granted -- which is why /browse/library shows 562
// undifferentiated tracks when the data holds 24 named ones, and why a venue product
// has nothing to sell.
//
// The ingest script's own comment names this exact risk -- "six loose tracks with a
// shared string in a field nothing joins on" -- and acts on it for the 4 release
// folders, giving them albums/ documents. The 24 collections were left as text.
//
// THE NAME IS `collection`, AND THAT IS A DECISION
// Percy calls them collections. The ingest script calls them collections
// (`item.collection`, `byCollection`, "scope to one collection"). Only the database
// field says `album`. Two of the three places that name this thing already agree.
//
//   - NOT `channel`, though that is the industry word for the venue product a
//     collection will be sold through. A collection is what the thing IS; a channel is
//     what it is SOLD AS. Naming the entity after a tier that does not exist yet bakes
//     one product's vocabulary into something that must also serve browse and licensing.
//   - NOT a rename of `album`, which keeps meaning RELEASE -- what it already means for
//     the 16 albums and the 4 release folders.
//
// `album` IS LEFT POPULATED, DELIBERATELY.
// The honest end state is that a library track has a collection and not an album. But
// EnhancedAudioPlayer renders `currentTrack.album` as the now-playing secondary line,
// so clearing it blanks that line for 754 tracks. A write that breaks a visible surface
// is worse than a field carrying a loose meaning. The join moves to collectionId; the
// display string stays until its consumers are moved, which is a separate change.
//
// IDEMPOTENT: the document id is the slug, so re-running updates rather than
// duplicating. A second run after new tracks land is the intended way to use it.

const { initAdmin } = require('./lib/admin');

const APPLY = process.argv.includes('--apply');

const LIBRARY_POOLS = ['production-music', 'functional-music'];

/** Stable id from a title. Must not change once written -- it is the document id. */
const slugify = (s) =>
  String(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    // Em dash and friends become a separator rather than vanishing, so
    // "After Hours at the Library — Vol. I" does not collapse into one word.
    .replace(/[‐-―]/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

(async () => {
  const { admin, projectId } = initAdmin();
  const db = admin.firestore();

  console.log('project: ' + projectId + (APPLY ? '   MODE: APPLY' : '   MODE: dry run'));
  console.log('');

  const snap = await db
    .collection('songs')
    .where('assetPool', 'in', LIBRARY_POOLS)
    .get();

  // Group by the folder name the ingest preserved.
  const groups = new Map();
  let untitled = 0;

  snap.docs.forEach((doc) => {
    const data = doc.data();
    const title = data.album || data.albumTitle;
    if (!title) {
      untitled += 1;
      return;
    }
    const slug = slugify(title);
    if (!groups.has(slug)) {
      groups.set(slug, { slug, title, pools: new Set(), docs: [], coverUrl: null });
    }
    const g = groups.get(slug);
    g.title = title;
    g.pools.add(data.assetPool);
    g.docs.push(doc);
    // First cover art wins -- every track in a folder shares the same artwork, so this
    // is a pick, not a merge.
    if (!g.coverUrl && data.coverUrl) g.coverUrl = data.coverUrl;
  });

  console.log('library tracks : ' + snap.size);
  console.log('collections    : ' + groups.size);
  if (untitled) console.log('NO album value : ' + untitled + '  (skipped -- nothing to group on)');
  console.log('');

  const rows = [...groups.values()].sort((a, b) => b.docs.length - a.docs.length);

  for (const g of rows) {
    // A collection whose tracks span pools is a classification error upstream, not
    // something to average away. Report it rather than picking a winner silently.
    const pools = [...g.pools];
    const poolNote = pools.length > 1 ? '  ** SPANS POOLS: ' + pools.join(',') + ' **' : '';
    console.log(
      String(g.docs.length).padStart(4) +
        '  ' + g.slug.padEnd(50).slice(0, 50) + ' ' +
        (g.coverUrl ? 'art' : 'NO ART') +
        poolNote
    );
  }
  console.log('');

  if (!APPLY) {
    console.log('Dry run. Re-run with --apply to write.');
    console.log('Would create/update ' + rows.length + ' collections/ documents');
    console.log('and set collectionId + collectionTitle on ' + snap.size + ' songs.');
    process.exit(0);
  }

  let cols = 0;
  let songs = 0;

  for (const g of rows) {
    const pools = [...g.pools];
    await db.collection('collections').doc(g.slug).set(
      {
        slug: g.slug,
        title: g.title,
        // Single-pool collections carry their pool so a surface can filter without
        // reading every track. A spanning one records all of them rather than lying
        // with the first.
        assetPool: pools.length === 1 ? pools[0] : null,
        assetPools: pools,
        trackCount: g.docs.length,
        coverUrl: g.coverUrl || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
    cols += 1;

    // Firestore caps a batch at 500 writes; the largest collection is 56, so one batch
    // per collection is always safe and keeps a failure scoped to one collection.
    const batch = db.batch();
    g.docs.forEach((doc) => {
      batch.update(doc.ref, { collectionId: g.slug, collectionTitle: g.title });
    });
    await batch.commit();
    songs += g.docs.length;

    console.log('  OK  ' + g.slug + '  (' + g.docs.length + ' tracks)');
  }

  console.log('');
  console.log('collections written : ' + cols);
  console.log('songs updated       : ' + songs);
  process.exit(0);
})().catch((err) => {
  console.error('FAILED: ' + err.message);
  process.exit(1);
});
