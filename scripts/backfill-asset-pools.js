#!/usr/bin/env node
//
// scripts/backfill-asset-pools.js
//
//   npm run backfill:pools            # dry run
//   npm run backfill:pools -- --apply
//
// Gives every record an assetPool, so the storefronts can be separated.
//
// WHY IT IS URGENT
// The production-library ingest added 782 records with today's createdAt. Every
// listener-facing query in the app orders by createdAt desc, so the newest 500 became
// 472 production tracks and 28 album tracks -- and Percy's original 141 commercial
// releases now sit at rank 783 of 923, BEYOND the storefront's limit(500). His actual
// albums are invisible on his own storefront. That is a regression the ingest caused.
//
// Raising the limit is not the fix. The PRD (§14) already names the problem: "the
// catalog is actually three distinct products for three distinct markets ... all being
// sold through the same undifferentiated storefront", and §81 "Asset pool = sub-brand".
// The discriminator exists, assetPools.js defines it, and nothing reads it. Filtering
// by pool is the fix; this backfill is what makes filtering possible.
//
// TWO CORRECTIONS IT MAKES
//
// 1. The original 141 records have NO assetPool at all. They are commercial releases --
//    they carry ISRCs, track numbers and release dates, which is exactly how
//    assetPools.js says a release is identified. Tagged accordingly.
//
// 2. 336 of the ingested records were tagged production-music and are FUNCTIONAL
//    music. assetPools.js defines that pool as "music that does a job to the
//    listener's nervous system rather than being listened to as a work: binaural,
//    somatic, sleep, focus -- PRD sub-brand #1". Deep Focus, Deep Sleep, Sleep
//    Transition and Ambient Sitar for Calm & Sleep are that by definition, and filing
//    them as generic production music buries the sub-brand the PRD leads with.
//
// The 8D and After Hours collections are Percy's judgement and are NOT moved here --
// they are listed at the end as candidates so he can decide rather than find them
// re-filed.

const { loadEnv, initAdmin, assertProject, args, BATCH_SIZE } = require('./lib/admin');

const { has, value } = args();
const APPLY = has('--apply');
const EXPECT_PROJECT = value('project', null);

const COMMERCIAL_RELEASE = 'commercial-release';
const PRODUCTION_MUSIC = 'production-music';
const FUNCTIONAL_MUSIC = 'functional-music';

// Named explicitly rather than pattern-matched. A regex for /focus|sleep/ would also
// catch a jazz record called "Sleepwalk", and the cost of a wrong pool is a track in
// the wrong storefront in front of the wrong buyer.
const FUNCTIONAL_COLLECTIONS = new Set([
  'Deep Focus Mind Lab',
  'Deep Focus Work Flow',
  'Deep Work Focus',
  'Mental Reset Deep Focus',
  'Baseline Restore Deep Focus',
  'Deep Sleep',
  'Sleep Transition',
  'Ambient Sitar for Calm & Sleep'
]);

// Percy's call, deliberately left alone. 8D is a spatial treatment, which may be
// somatic or may just be an effect on music meant to be listened to; "After Hours at
// the Library" is study music, which is arguably functional and arguably just quiet.
const NEEDS_A_DECISION = new Set([
  '8d Music - Dragon Burial',
  'Vintage 8D Soul',
  'After Hours at the Library — Vol. I The Reading Room',
  'After Hours at the Library — Vol. II The Exam Hall'
]);

(async () => {
  loadEnv();
  const { admin, projectId, via } = initAdmin();
  const db = admin.firestore();
  assertProject(projectId, EXPECT_PROJECT);

  console.log('Project  : ' + projectId + '  (via ' + via + ')');
  console.log('Applying : ' + (APPLY ? 'YES' : 'no - dry run, pass --apply to write'));
  console.log('');

  const snapshot = await db.collection('songs').get();

  const toCommercial = [];
  const toFunctional = [];
  const undecided = {};
  let unchanged = 0;

  snapshot.forEach((doc) => {
    const song = doc.data();
    const pool = song.assetPool;
    const collection = song.album || song.albumTitle || '';

    if (!pool) {
      // No pool at all: the original catalogue. Releases, by their own metadata.
      toCommercial.push({ id: doc.id, title: song.title, hasIsrc: Boolean(song.isrc) });
      return;
    }

    if (pool === PRODUCTION_MUSIC && FUNCTIONAL_COLLECTIONS.has(collection)) {
      toFunctional.push({ id: doc.id, title: song.title, collection });
      return;
    }

    if (pool === PRODUCTION_MUSIC && NEEDS_A_DECISION.has(collection)) {
      undecided[collection] = (undecided[collection] || 0) + 1;
    }

    unchanged += 1;
  });

  const withoutIsrc = toCommercial.filter((s) => !s.hasIsrc).length;

  console.log('WOULD CHANGE');
  console.log('  ' + String(toCommercial.length).padStart(4) + '  untagged -> commercial-release' +
    (withoutIsrc ? '   (' + withoutIsrc + ' of them have no ISRC - check these)' : ''));
  console.log('  ' + String(toFunctional.length).padStart(4) + '  production-music -> functional-music');
  console.log('  ' + String(unchanged).padStart(4) + '  left alone');

  if (toFunctional.length) {
    console.log('');
    console.log('  moving to functional-music:');
    const byCollection = {};
    toFunctional.forEach((s) => { byCollection[s.collection] = (byCollection[s.collection] || 0) + 1; });
    Object.entries(byCollection).sort((a, b) => b[1] - a[1])
      .forEach(([c, n]) => console.log('    ' + String(n).padStart(4) + '  ' + c));
  }

  if (Object.keys(undecided).length) {
    console.log('');
    console.log('  LEFT AS production-music, awaiting Percy\'s decision:');
    Object.entries(undecided).sort((a, b) => b[1] - a[1])
      .forEach(([c, n]) => console.log('    ' + String(n).padStart(4) + '  ' + c));
  }

  if (!APPLY) {
    console.log('');
    console.log('Dry run only. Re-run with --apply.');
    return;
  }

  async function writeAll(items, pool) {
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = db.batch();
      items.slice(i, i + BATCH_SIZE).forEach((item) => {
        batch.update(db.collection('songs').doc(item.id), { assetPool: pool });
      });
      await batch.commit();
      console.log('  ' + pool + ': committed ' + Math.min(i + BATCH_SIZE, items.length) + '/' + items.length);
    }
  }

  await writeAll(toCommercial, COMMERCIAL_RELEASE);
  await writeAll(toFunctional, FUNCTIONAL_MUSIC);

  console.log('');
  console.log('Done. ' + (toCommercial.length + toFunctional.length) + ' records updated.');
})().catch((err) => {
  console.error('FAILED: ' + err.message);
  process.exit(1);
});
