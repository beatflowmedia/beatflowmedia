#!/usr/bin/env node
//
// scripts/verify-no-fixtures.js
//
//   npm run verify:no-fixtures
//
// FIXTURE DATA MUST NOT REACH A SCREEN.
//
// WHY THIS EXISTS — FOUR DISCOVERIES IN TWO DAYS, ALL THE SAME SHAPE
//
//   2026-10-20  the Marketing bulk generator waited two seconds, reported `success` for
//               every row, and named files it had never written
//   2026-10-21  the Landing Page Manager showed "1,247 Total Views" and "89 Conversions"
//               from literals, on a platform with six users and four purchases
//   2026-10-21  the Blog Content Manager showed "4,370 Total Views" the same way
//   2026-10-21  a LIVE blog post named "Sarah Chen" and claimed she earned $12,500 a
//               month uploading to a platform that has never accepted uploads
//
// Each was found by Percy opening a screen and asking whether the numbers were real.
// That is not a process. The common cause is a UI shell built over fixtures and shipped
// before the data existed, and nothing in the build, the tests or the linter can tell a
// fixture from a fact — they are both just values.
//
// WHAT IT CHECKS, AND THE LINE IT DRAWS
//
// Fixtures are legitimate in tests and in Storybook: that is what they are for. They are
// legitimate in a service module while a feature is being built. What they must never be
// is RENDERED, because a number on a screen is read as a measurement whatever the
// comment above it says.
//
// So this scans the directories whose output a person sees — src/pages and
// src/components — for the markers that have actually preceded every incident above,
// and ignores the directories where fixtures belong.
//
// A RATCHET, NOT A WALL. Twenty-odd files carry these markers today, and most are
// harmless: a `placeholder` prop, a comment about future work. Failing on all of them
// would be red forever and get deleted within a week — which is how a reconciler dies,
// and the reason verify:vulns deliberately ignores build tooling. KNOWN_FIXTURES records
// the baseline; only NEW ones fail.
//
// Shrink the list by wiring the screen to real data, the way LandingPageManager was.
// Never add to it to get a commit through: that is the suppression this file argues
// against, and an entry with no reason beside it reads as an oversight to the next
// person.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Where rendering code lives. Everything a user can see comes from these.
const RENDERED_DIRS = ['src/pages', 'src/components'];

// Where fixtures BELONG. Not scanned.
const EXEMPT = [
  /\.stories\.[jt]sx?$/,      // Storybook: fixtures are the entire point
  /\.test\.[jt]sx?$/,         // tests
  /__mocks__/,
  /\.md$/
];

/**
 * The markers. Each has drawn blood, which is why it is here rather than a guess at
 * what bad code looks like.
 */
const MARKERS = [
  { re: /\bmock[A-Z]\w*\s*=/, why: 'a mock<Thing> fixture assigned in rendering code' },
  { re: /\/\/\s*Simulated? data/i, why: '"Simulated data" comment' },
  { re: /\/\/\s*Simulate /i, why: '"Simulate ..." comment — the bulk generator said this' },
  { re: /in production,? (this would|fetch|replace)/i, why: '"in production, ..." — a promise the build cannot keep' },
  { re: /in real implementation/i, why: '"in real implementation" — the bulk generator said this too' },
  { re: /\bhardcoded\b/i, why: 'self-declared hardcoded value' },
  { re: /\bfor now,? using\b/i, why: '"for now, using ..." — BlogPost.js said this above invented people' }
];

/**
 * THE BASELINE. Files carrying a marker as of 2026-10-21, with what is actually in them.
 *
 * Being listed is not approval. It is "this existed before the check did". The two that
 * matter most carry their incident number, so nobody has to re-derive why they are here.
 */
const KNOWN_FIXTURES = {
  'src/components/admin/SocialMediaManager.js': 'Comment only — "Simulate progress for UX", a setTimeout loop over a REAL upload.',
  'src/components/admin/StudioProjectsManager.js': 'Comment only. Unreviewed.',
  'src/components/analytics/PerformanceMonitor.js': 'Comment only. Unreviewed.',
  'src/components/investor/InvestorPortalExample.jsx': 'Named *Example*. Confirm nothing routes to it.',
  'src/components/admin/BlogManager.js': 'OPS-4SEC4 — 4,370 views and 245 shares are literals. Wire or remove.',
  'src/components/admin/LandingPageManager.js': 'Comment only; the fixtures were removed on 2026-10-21 and it reads Firestore.',
  'src/components/admin/AppealsReview.js': 'Marker present; reads Firestore. Confirm before clearing.',
  'src/components/AgentLogViewer.js': 'Developer tool, not a customer surface.',
  'src/components/BrowseFilters.js': 'Marker is a `placeholder` prop, not fixture data.',
  'src/components/ExplorePremium.js': 'Review: public page, two numeric claims.',
  'src/components/StripeButton.js': 'Marker only; no rendered fixture found.',
  'src/components/VideoClipGenerator.js': 'Unreviewed.',
  'src/pages/Blog.js': 'Comment only; the fabricated posts and view counts were removed 2026-10-21.',
  'src/pages/BlogPost.js': 'Comment only; see above. The remaining markers explain what was deleted.',
  'src/pages/BrowseByCategory.js': 'Marker is a `placeholder` prop.',
  'src/pages/HomeStorefront.js': 'Marker is a `placeholder` prop.'
};

function walk(dir, acc = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return acc; }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full, acc); continue; }
    if (!/\.[jt]sx?$/.test(entry.name)) continue;
    if (EXEMPT.some((re) => re.test(full))) continue;
    acc.push(full);
  }
  return acc;
}

/** Strip comments so a file DOCUMENTING a removed fixture is not reported as having one. */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

(function main() {
  console.log('\nverify:no-fixtures — can a made-up number reach a screen?\n');

  const found = new Map();

  for (const dir of RENDERED_DIRS) {
    for (const file of walk(path.join(ROOT, dir))) {
      const rel = path.relative(ROOT, file).split(path.sep).join('/');
      const raw = fs.readFileSync(file, 'utf8');

      // Comments are checked separately from code. A comment saying "the fixtures were
      // removed" must not count as a fixture, but a comment saying "in production this
      // would fetch" is exactly the promise that preceded every incident, so BOTH are
      // reported -- just only the code ones can be new failures.
      const code = stripComments(raw);

      for (const marker of MARKERS) {
        const inCode = marker.re.test(code);
        const inComment = !inCode && marker.re.test(raw);
        if (!inCode && !inComment) continue;
        if (!found.has(rel)) found.set(rel, []);
        found.get(rel).push({ why: marker.why, inCode });
      }
    }
  }

  const neu = [...found.keys()].filter((f) => !(f in KNOWN_FIXTURES));
  const healed = Object.keys(KNOWN_FIXTURES).filter((f) => !found.has(f));

  console.log('  RENDERING FILES CARRYING A FIXTURE MARKER: ' + found.size);
  console.log('  known from before this check             : ' + (found.size - neu.length));
  console.log('');

  if (neu.length) {
    console.log('  NEW — these are the ones that matter:');
    for (const f of neu.sort()) {
      const liveCode = found.get(f).some((h) => h.inCode);
      console.log('     ' + f + (liveCode ? '   [IN CODE]' : '   [in a comment]'));
      [...new Set(found.get(f).map((h) => h.why))].forEach((w) => console.log('        ' + w));
    }
    console.log('');
  } else {
    console.log('  No rendering file has gained a fixture marker. ');
    console.log('');
  }

  if (healed.length) {
    console.log('  CLEARED — remove from KNOWN_FIXTURES so the ratchet tightens:');
    healed.forEach((f) => console.log('     ' + f));
    console.log('');
  }

  // Only a NEW marker fails, and only one in live code. A new comment is worth seeing
  // and is not worth blocking a commit over.
  const blocking = neu.filter((f) => found.get(f).some((h) => h.inCode));
  if (blocking.length) {
    console.log('  ' + blocking.length + ' rendering file(s) gained fixture data.');
    console.log('  A number on a screen is read as a measurement whatever the comment');
    console.log('  above it says. Wire it to real data, or do not render it.\n');
    process.exit(1);
  }
  console.log('  Nothing new reaches a screen.\n');
  process.exit(0);
})();
