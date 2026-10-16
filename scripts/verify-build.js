#!/usr/bin/env node
/**
 * verify:build — did the build actually produce a site?
 *
 * WHY THIS EXISTS, AND IT IS EMBARRASSING
 * `npm run build` exited 0, my check for the string "Failed to compile" found none, and I
 * reported a passing build. It had written **no index.html at all**. CRA had printed:
 *
 *   Compiled with the following type errors (you may want to check these before deploying)
 *   Attempted import error: 'hasUnseenChanges' is not exported from '../data/platformChanges'
 *
 * An unresolvable import is reported as a *type error*, not as "Failed to compile", and
 * the process still exits 0. Every signal I was checking said the build was fine while
 * the output directory held last week's leftovers.
 *
 * This is the third variation of the same mistake in this project: a build reported as
 * passing from an empty log, a UI check scoring 100/100 over zero files, and now a build
 * that compiled nothing and said so quietly. The pattern is always the same -- a green
 * signal measured on the wrong thing -- so the fix is always the same: assert the
 * ARTEFACT, not the exit code.
 *
 *   npm run verify:build
 *
 * Checks that index.html exists, is not stale, references a main bundle, and that the
 * bundle it names is actually on disk.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const MAX_AGE_MIN = Number(process.env.VERIFY_BUILD_MAX_AGE_MIN || 120);

let problems = 0;
function fail(msg, detail) {
  console.error('  FAIL  ' + msg);
  if (detail) console.error('        ' + detail);
  problems++;
}
function ok(msg) {
  console.log('  ok    ' + msg);
}

console.log('\nverify:build — did the build produce a site, or just exit 0?\n');

// --- the artefact exists ------------------------------------------------------------
const indexPath = path.join(BUILD, 'index.html');
if (!fs.existsSync(indexPath)) {
  fail('build/index.html does not exist',
    'The build exited without writing a site. Look for "Attempted import error" in the\n' +
    '        build output -- an unresolvable import is reported as a type error and still exits 0.');
  console.error('\nverify:build — 1 problem.\n');
  process.exit(1);
}
ok('build/index.html exists');

// --- it is from THIS build, not a leftover ------------------------------------------
const ageMin = (Date.now() - fs.statSync(indexPath).mtimeMs) / 60000;
if (ageMin > MAX_AGE_MIN) {
  fail('build/index.html is ' + Math.round(ageMin) + ' minutes old',
    'Older than ' + MAX_AGE_MIN + ' minutes, so it is probably a leftover from an earlier\n' +
    '        build rather than the one that just ran. That is exactly how a broken build\n' +
    '        gets served and tested as if it were current.');
} else {
  ok('index.html is ' + Math.round(ageMin) + ' minute(s) old');
}

// --- it references a bundle, and that bundle is really there ------------------------
const html = fs.readFileSync(indexPath, 'utf8');
const mainRef = /\/static\/js\/(main\.[a-z0-9]+\.js)/.exec(html);
if (!mainRef) {
  fail('index.html references no main bundle',
    'A document with no script is not a working single-page app.');
} else {
  const bundle = path.join(BUILD, 'static', 'js', mainRef[1]);
  if (!fs.existsSync(bundle)) {
    fail('index.html references ' + mainRef[1] + ' which is not on disk',
      'The HTML and the assets are from different builds.');
  } else {
    const kb = Math.round(fs.statSync(bundle).size / 1024);
    if (kb < 20) {
      fail(mainRef[1] + ' is only ' + kb + 'KB', 'Too small to be a real bundle.');
    } else {
      ok(mainRef[1] + ' present (' + kb + 'KB)');
    }
  }
}

if (problems) {
  console.error('\nverify:build — ' + problems + ' problem(s). The build exit code is not evidence.\n');
  process.exit(1);
}

console.log('\nverify:build — the build produced a real site.\n');
process.exit(0);
