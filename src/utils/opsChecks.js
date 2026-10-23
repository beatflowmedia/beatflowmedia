// src/utils/opsChecks.js
//
// THE RECONCILERS, described for a reader rather than for a terminal.
//
// BFMG owns twenty `npm run verify:*` scripts. Each one answers a question that would
// otherwise fail silently, and every one of them currently reports into a terminal
// nobody is watching. That is the gap this file exists to close: the ops desk can show
// what the checks are FOR, which of them last failed, and when anybody last looked.
//
// WHY A COPY, AND WHY THAT IS ALLOWED. The canonical list of checks is the `scripts`
// block of package.json -- that is what actually runs. This file adds what package.json
// cannot hold: which area a check belongs to, and what BREAKS IF IT IS WRONG, written
// for Percy rather than for a developer. A browser cannot read package.json, so a copy
// is the only way to show this on a page.
//
// It is the Single Source caveat exactly: a local copy is fine PROVIDED something
// reconciles it. `src/utils/opsChecks.test.js` fails if package.json gains a verify:*
// script that is not described here, or if this file describes one that no longer
// exists. A copy with a reconciler is a cache; a copy without one is a second truth.
//
// `protects` IS THE LOAD-BEARING FIELD. "verify:csp — checks the CSP" tells a reader
// nothing they could not guess from the name. "the three copies of the policy have
// drifted and a third-party script is now blocked in production" tells them whether to
// care. A check nobody can explain the value of gets skipped the first time it is slow.

/**
 * Every reconciler, keyed by its npm script suffix.
 *
 * `area` uses the vocabulary in src/utils/ops.js so a failing check can be filed as an
 * incident without re-deciding where it belongs.
 */
const CHECKS = {
  a11y: {
    title: 'No file gains an accessibility issue',
    area: 'storefront',
    protects: 'The pre-commit gate judged staged files WHOLE, so a one-line change to a legacy file presented its entire debt for review -- 23 findings for moving one JSON-LD tag in Playlist.js. A gate that fails on debt you did not create is how --no-verify becomes normal, which already happened here once.'
  },
  admins: {
    title: 'Admin list matches the security rules',
    area: 'quality',
    protects: 'Someone removed from the admin list in code but left in firestore.rules keeps database access.'
  },
  assets: {
    title: 'Referenced images exist',
    area: 'storefront',
    protects: 'A missing image renders its alt text, not a placeholder, so a page looks broken rather than empty.'
  },
  build: {
    title: 'The build produced a real site',
    area: 'quality',
    protects: 'CRA reports an unresolvable import as a "type error" and still exits 0, leaving no index.html. A green build that shipped nothing.'
  },
  collections: {
    title: 'Collection track counts match their tracks',
    area: 'catalogue',
    protects: 'A stale trackCount prices a collection. One currently stores 27 while 30 songs carry its id.'
  },
  csp: {
    title: 'Content Security Policy copies reconcile',
    area: 'storefront',
    protects: 'The policy lives in three files. When they drift, a third-party script is blocked in production only.'
  },
  deps: {
    title: 'Every require resolves, and satellite manifests agree',
    area: 'quality',
    protects: 'A dependency removed as "unused" that something actually imports. Caught exactly this on 2026-10-18.'
  },
  domains: {
    title: 'Domain and DNS configuration',
    area: 'storefront',
    protects: 'A domain pointing at the wrong place, or an expired certificate.'
  },
  env: {
    title: 'Required environment variables are set',
    area: 'fulfilment',
    protects: 'A missing key makes a function fail at run time, after a buyer has already paid.'
  },
  facets: {
    title: 'Browse facets match the catalogue',
    area: 'catalogue',
    protects: 'A filter that returns nothing because the facet no longer matches any record.'
  },
  featured: {
    title: 'Featured artists resolve',
    area: 'storefront',
    protects: 'A featured slot pointing at an artist who is gone, rendering an empty card.'
  },
  links: {
    title: 'No dead internal links',
    area: 'storefront',
    protects: 'A link to a route that does not exist. Costs crawl budget and loses the reader.'
  },
  masters: {
    title: 'previewOnly is derived from the real masters',
    area: 'catalogue',
    protects: 'Selling a licence for a file that cannot be delivered. previewOnly means "cannot deliver", not "not permitted".'
  },
  'price-units': {
    title: 'Prices stay in their own units',
    area: 'checkout',
    protects: 'songs.price and licenses.pricePaid are CENTS while purchases.price is DOLLARS. Mixing them is a 100x error.'
  },
  published: {
    title: 'Production serves the newest successful build',
    area: 'quality',
    protects: 'A locked or stale deploy. Production sat on an old build for a day on 2026-10-15.'
  },
  radio: {
    title: 'The radio sync contract holds',
    area: 'catalogue',
    protects: 'catalog.js parses this repo by shape. A refactor silently breaks the station’s catalogue sync.'
  },
  sponsor: {
    title: 'Sponsor application validation',
    area: 'storefront',
    protects: 'A form that accepts submissions nothing can process.'
  },
  stripe: {
    title: 'Stripe configuration',
    area: 'checkout',
    protects: 'Keys, prices and the account id. A key that "works" only proves SOME account accepted it.'
  },
  'stripe-profile': {
    title: 'Stripe account profile is complete',
    area: 'checkout',
    protects: 'An incomplete profile blocks payouts without blocking checkout, so money arrives and never leaves.'
  },
  terms: {
    title: 'Every accepted licence version is still readable',
    area: 'legal',
    protects: 'A buyer is governed by the version they accepted. If that text is gone, the deal cannot be produced in a dispute.'
  },
  'no-fixtures': {
    title: 'No fabricated data reaches a screen',
    area: 'quality',
    protects: 'Four screens shipped showing invented numbers — 1,247 views, 4,370 views, $2.5m revenue, and a blog post naming an artist who earned $12,500 a month. A number on a screen is read as a measurement.'
  },
  'radio-links': {
    title: 'BFMG links back to the station only where a page exists',
    area: 'storefront',
    protects: 'The station is selective — three of fifteen albums have no page there — so a slug built in a component would produce dead off-site links that verify:links cannot see.'
  },
  sitemap: {
    title: 'The sitemap describes a site that exists',
    area: 'storefront',
    protects: 'sitemap-songs.xml returned the SPA shell with HTTP 200 for six months, so 906 songs were never submitted. A sitemap is never visibly wrong — the only symptom is pages quietly not getting indexed.'
  },
  vulns: {
    title: 'No high or critical advisory reaches the deployed functions',
    area: 'quality',
    protects: 'The functions hold the Stripe secret key and Firebase Admin credentials. Build-tooling advisories are reported but do not fail.'
  }
};

/** The npm command a reader can copy and run. One place builds this string. */
const commandFor = (key) => `npm run verify:${key}`;

/** Every check as an ops `check` item, with no state until something runs them. */
function checkItems(states = {}) {
  return Object.entries(CHECKS).map(([key, meta]) => ({
    kind: 'check',
    id: `verify-${key}`,
    title: meta.title,
    area: meta.area,
    protects: meta.protects,
    command: commandFor(key),
    // `unknown` is honest and is NOT the same as `pass`. A check nobody has run is not
    // a check that passed, and colouring it green would be the dashboard lying in the
    // most comfortable direction.
    state: states[key]?.state || 'unknown',
    lastRun: states[key]?.lastRun || null,
    detail: states[key]?.detail || null
  }));
}

module.exports = { CHECKS, commandFor, checkItems };
