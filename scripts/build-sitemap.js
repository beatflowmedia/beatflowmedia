#!/usr/bin/env node
//
// scripts/build-sitemap.js
//
//   npm run build:sitemap
//
// GENERATES public/sitemap-static.xml FROM WHAT ACTUALLY EXISTS.
//
// WHY IT IS GENERATED AND NOT EDITED
// The file it replaces was hand-written in April and never revisited. By October it
// listed nine /studio/* pages for a stalled product, the cookie policy, two URLs that
// return 301 -- and not one collection, song or blog post. Search Console reported
// "Success, 24 discovered pages" the whole time, because a sitemap is never visibly
// wrong: it just quietly describes a site that no longer exists.
//
// THREE SOURCES, EACH ALREADY CANONICAL FOR ITS PART:
//
//   routes       src/data/indexableRoutes.js   a reviewed list, with the exclusions and
//                                              their reasons recorded beside it
//   blog posts   src/data/blogPosts.js         the same list the blog and the admin
//                                              panel render from
//   collections  Firestore                     the 23 collection pages, which are the
//                                              most valuable URLs on the site and were
//                                              entirely absent
//
// Songs are NOT here. netlify/functions/sitemap-songs.js already emits them from
// Firestore at request time, which is right for 906 rows that change: a build-time copy
// would be stale the first time the catalogue moved.
//
// IT FAILS RATHER THAN EMITTING A PARTIAL SITEMAP. If Firestore cannot be reached, the
// collections are missing, and a sitemap missing the money pages is precisely the
// failure this script exists to end -- silently, and reported as a success. Better a red
// build than a green one that publishes a lie.

const fs = require('fs');
const path = require('path');

const { loadEnv, initAdmin, assertProject } = require('./lib/admin');
const { INDEXABLE_ROUTES, EXCLUDED_ROUTES } = require('../src/data/indexableRoutes');
const { BLOG_POSTS } = require('../src/data/blogPosts');

const ROOT = path.resolve(__dirname, '..');
const SITE = process.env.REACT_APP_SITE_URL || 'https://beatflowmediagroup.com';
const OUT = path.join(ROOT, 'public', 'sitemap-static.xml');

const xmlEscape = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${xmlEscape(SITE + loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority !== undefined ? `    <priority>${priority.toFixed(1)}</priority>` : null,
    '  </url>'
  ].filter(Boolean).join('\n');
}

(async () => {
  loadEnv();
  const today = new Date().toISOString().slice(0, 10);

  console.log('\nbuild:sitemap\n');

  // --- 1. the reviewed routes ------------------------------------------------
  const routeEntries = INDEXABLE_ROUTES.map((r) => urlEntry({
    loc: r.path, lastmod: today, changefreq: r.changefreq, priority: r.priority
  }));
  console.log('  routes      : ' + INDEXABLE_ROUTES.length +
    '   (' + Object.keys(EXCLUDED_ROUTES).length + ' excluded on purpose, see indexableRoutes.js)');

  // --- 2. blog posts, from the same list the blog renders --------------------
  const blogEntries = BLOG_POSTS.map((p) => urlEntry({
    loc: `/blog/${p.slug}`, lastmod: p.publishDate, changefreq: 'yearly', priority: 0.6
  }));
  console.log('  blog posts  : ' + BLOG_POSTS.length);

  // --- 3. collections, from Firestore ----------------------------------------
  const { admin, projectId } = initAdmin();
  assertProject(projectId, 'beatflowmedia');
  const db = admin.firestore();

  const snap = await db.collection('collections').get();
  if (snap.empty) {
    // Loud, not silent. An empty collections query here means either the credentials
    // changed or the catalogue is gone, and both deserve a failed build rather than a
    // sitemap that omits the pages worth $179-$319 each.
    console.error('\n  REFUSING: the collections query returned nothing.');
    console.error('  A sitemap without the collection pages is the exact fault this');
    console.error('  script exists to fix. Check credentials before re-running.\n');
    process.exit(1);
  }

  const collectionEntries = snap.docs.map((d) => {
    const data = d.data();
    return urlEntry({
      loc: `/collection/${data.slug || d.id}`,
      lastmod: today,
      changefreq: 'monthly',
      // Higher than the footer and equal to the library hub: these are the pages a
      // commercial buyer lands on and the only ones carrying an offer in their JSON-LD.
      priority: 0.9
    });
  });
  console.log('  collections : ' + snap.size + '   <- were entirely absent before');

  // --- 4. albums, with the station's selectivity rule applied -----------------
  //
  // 161 songs link UP to an album page, and those pages were absent from the sitemap --
  // a silo with a hole in the middle: the spokes submitted, their hub not.
  //
  // THE RULE IS BORROWED FROM radio/albums.js, which says "an album in the catalogue
  // that never airs gets no page". The BFMG equivalent is that an album with nothing
  // deliverable gets no sitemap entry: a page offering a licence the checkout would
  // refuse is worse than no page, and it spends crawl budget to disappoint someone.
  const albumSnap = await db.collection('albums').get();
  const albumEntries = [];
  let skippedAlbums = 0;
  for (const doc of albumSnap.docs) {
    const songs = await db.collection('songs').where('albumId', '==', doc.id).get();
    const deliverable = songs.docs.filter((d) => d.data().previewOnly !== true).length;
    if (!deliverable) { skippedAlbums += 1; continue; }
    albumEntries.push(urlEntry({
      loc: `/album/${doc.id}`, lastmod: today, changefreq: 'monthly', priority: 0.8
    }));
  }
  console.log('  albums      : ' + albumEntries.length +
    (skippedAlbums ? '   (' + skippedAlbums + ' skipped — nothing deliverable)' : '') +
    '   <- were absent, while 161 songs linked up to them');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!--',
    '  GENERATED by scripts/build-sitemap.js. Do not edit by hand.',
    '',
    '  Sources: src/data/indexableRoutes.js (routes, with exclusions and reasons),',
    '  src/data/blogPosts.js (posts), and the Firestore collections collection.',
    '  Songs come from /sitemap-songs.xml, generated per request.',
    '',
    '  Regenerate: npm run build:sitemap     Check: npm run verify:sitemap',
    '-->',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...routeEntries,
    ...collectionEntries,
    ...albumEntries,
    ...blogEntries,
    '</urlset>',
    ''
  ].join('\n');

  fs.writeFileSync(OUT, xml, 'utf8');

  const total = routeEntries.length + collectionEntries.length +
    albumEntries.length + blogEntries.length;
  console.log('');
  console.log('  wrote public/sitemap-static.xml — ' + total + ' URLs (was 24, none of them a product)\n');
  process.exit(0);
})().catch((err) => {
  console.error('\nbuild:sitemap FAILED:', err.message, '\n');
  process.exit(1);
});
