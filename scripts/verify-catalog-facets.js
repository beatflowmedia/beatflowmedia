#!/usr/bin/env node
//
// scripts/verify-catalog-facets.js
//
//   npm run verify:facets
//
// Guards the browse filter logic.
//
// WHY
// The sidebar was wired to nothing for its whole life, so none of this was ever
// exercised. The two rules most likely to be "simplified" back into bugs are:
//
//   - a facet is offered only when MORE THAN ONE value exists. Offering one is a
//     control that switches between everything and everything.
//   - a track MISSING the field a filter names is EXCLUDED. Keeping it would widen
//     every filter to "matches, or we do not know", which is how a 4-record BPM
//     filter would appear to work across 923 tracks.
//
// Both read like over-strictness and are the whole point, so both are pinned.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function loadEsModule(relPath, exportNames) {
  let insideImport = false;
  const body = fs
    .readFileSync(path.join(ROOT, relPath), 'utf8')
    .split(/\r?\n/)
    .filter((line) => {
      if (insideImport) {
        if (/\bfrom\s+['"].*['"]\s*;?\s*$/.test(line)) insideImport = false;
        return false;
      }
      if (/^import\b/.test(line)) {
        insideImport = !/\bfrom\s+['"].*['"]\s*;?\s*$/.test(line) && !/;\s*$/.test(line);
        return false;
      }
      return true;
    })
    .join('\n')
    .replace(/^export /gm, '');

  const mod = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('module', body + '\nmodule.exports = { ' + exportNames.join(', ') + ' };')(mod);
  return mod.exports;
}

const { facetsOf, applyFilters, isEmptyFilter, EMPTY_FILTERS } = loadEsModule(
  'src/utils/catalogFacets.js',
  ['facetsOf', 'applyFilters', 'isEmptyFilter', 'EMPTY_FILTERS']
);

const failures = [];
const check = (label, actual, expected) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) return console.log('  PASS  ' + label);
  console.log('  FAIL  ' + label + '\n          got ' + a + '\n          expected ' + e);
  failures.push(label);
};

// A catalogue shaped like the real one: duration everywhere, bpm/mood/genre on almost
// nothing. This is the case the whole design turns on.
const REALISTIC = [
  { title: 'a', duration: 120, explicit: false },
  { title: 'b', duration: 45, explicit: false },
  { title: 'c', duration: 200, explicit: false },
  { title: 'd', duration: 30, explicit: false, bpm: 120, mood: 'Chill', genre: 'Jazz', loopable: true }
];

const facets = facetsOf(REALISTIC);

check('a single genre value is NOT offered as a facet', facets.genres, ['Jazz']);
check('bpm with one value is not offered', facets.bpm, null);
check('explicit with one value is not offered', facets.explicit, false);
check('loopable with one value is not offered', facets.loopable, false);
check('duration spans a range so it IS offered', facets.duration, [30, 200]);
// Durations are 30, 45, 120 and 200. The 30 falls in 30-60s because the bucket test
// is d >= min, so NOTHING is in 15-30s and that bucket is correctly not offered.
// The first version of this check expected it and was wrong -- the expectation was
// corrected, not the code, which is the distinction that matters when a guard fails.
check('only buckets that contain tracks are offered',
  facets.durationBuckets.map((b) => b.label),
  ['30-60s', '1-3 min', '3-5 min']);

// Both answers present -> the facet becomes worth offering.
const MIXED = [
  { duration: 10, explicit: false, genre: 'Rock' },
  { duration: 20, explicit: true, genre: 'Indie' }
];
check('two genres are offered, sorted', facetsOf(MIXED).genres, ['Indie', 'Rock']);
check('explicit with both answers IS offered', facetsOf(MIXED).explicit, true);

// Applying.
check('an empty filter returns everything', applyFilters(REALISTIC, EMPTY_FILTERS).length, 4);
check('null filter returns everything', applyFilters(REALISTIC, null).length, 4);
check('isEmptyFilter recognises the empty filter', isEmptyFilter(EMPTY_FILTERS), true);

check('duration narrows',
  applyFilters(REALISTIC, { ...EMPTY_FILTERS, duration: [0, 60] }).map((t) => t.title),
  ['b', 'd']);

check('A TRACK MISSING THE FIELD IS EXCLUDED, not kept',
  applyFilters(REALISTIC, { ...EMPTY_FILTERS, bpm: [100, 140] }).map((t) => t.title),
  ['d']);

check('genre filter excludes the untagged',
  applyFilters(REALISTIC, { ...EMPTY_FILTERS, genres: ['Jazz'] }).map((t) => t.title),
  ['d']);

check('mood accepts a string field',
  applyFilters(REALISTIC, { ...EMPTY_FILTERS, moods: ['Chill'] }).map((t) => t.title),
  ['d']);

check('mood accepts an array field',
  applyFilters([{ title: 'x', mood: ['Dark', 'Chill'] }], { ...EMPTY_FILTERS, moods: ['Chill'] })
    .map((t) => t.title),
  ['x']);

check('clean-only keeps only explicit === false',
  applyFilters(MIXED, { ...EMPTY_FILTERS, explicit: false }).map((t) => t.genre),
  ['Rock']);

check('facetsOf tolerates junk', facetsOf([null, {}, undefined]).genres, []);
check('applyFilters tolerates junk', applyFilters(null, EMPTY_FILTERS), []);

console.log('');
if (failures.length) {
  console.error(failures.length + ' check(s) FAILED.');
  process.exit(1);
}
console.log('All checks passed.');
