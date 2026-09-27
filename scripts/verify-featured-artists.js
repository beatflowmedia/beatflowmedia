#!/usr/bin/env node
/**
 * Guards the featured-artist parser.
 *
 *   npm run verify:featured
 *
 * WHY
 * ---
 * The four personas -- Lyle Carpenter, SYNNE, Adam Cetera, Dawn Calvin -- exist only
 * inside track titles, as "(feat. Name)". That is where the distributor registered
 * them, so the title is the canonical record and the parser is the only thing standing
 * between it and every place the store shows an artist.
 *
 * A parser that silently fails produces a page quietly missing a track. Nothing
 * errors, nothing looks broken, and the only symptom is a buyer not finding something.
 * That is exactly the failure this repo keeps turning up, so it gets a check.
 *
 * The regex is module-level with /g, which carries lastIndex between calls -- a stale
 * lastIndex makes every OTHER call skip its match. The repeat-call cases below exist
 * for that specifically.
 */
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

const {
  parseFeaturedArtists,
  titleWithoutFeature,
  featuredArtistSlug,
  titleFeatures,
  collectFeaturedArtists
} = loadEsModule('src/utils/featuredArtists.js', [
  'parseFeaturedArtists', 'titleWithoutFeature', 'featuredArtistSlug',
  'titleFeatures', 'collectFeaturedArtists'
]);

const failures = [];
const check = (label, actual, expected) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log('  PASS  ' + label);
  } else {
    console.log('  FAIL  ' + label + '\n          got ' + a + '\n          expected ' + e);
    failures.push(label);
  }
};

// The exact shape in the catalogue today -- all 52 credits look like this.
check('the live format parses',
  parseFeaturedArtists('Sunday at the Corner Store (feat. SYNNE)'), ['SYNNE']);
check('a title with no credit gives none',
  parseFeaturedArtists('Boom Bap Soul'), []);
check('empty and null are safe',
  [parseFeaturedArtists(''), parseFeaturedArtists(null), parseFeaturedArtists(undefined)],
  [[], [], []]);

// The stateful-regex trap: the same call twice must give the same answer.
check('repeated calls do not skip (regex lastIndex)',
  [parseFeaturedArtists('A (feat. SYNNE)'), parseFeaturedArtists('B (feat. SYNNE)')],
  [['SYNNE'], ['SYNNE']]);

// Variants a human will eventually type.
check('ft. parses', parseFeaturedArtists('Track (ft. Dawn Calvin)'), ['Dawn Calvin']);
check('featuring parses', parseFeaturedArtists('Track (featuring Dawn Calvin)'), ['Dawn Calvin']);
check('square brackets parse', parseFeaturedArtists('Track [feat. SYNNE]'), ['SYNNE']);
check('case is preserved, not normalised',
  parseFeaturedArtists('Track (FEAT. SYNNE)'), ['SYNNE']);

// Multiple names.
check('ampersand splits',
  parseFeaturedArtists('Track (feat. SYNNE & Dawn Calvin)'), ['SYNNE', 'Dawn Calvin']);
check('comma splits',
  parseFeaturedArtists('Track (feat. SYNNE, Dawn Calvin)'), ['SYNNE', 'Dawn Calvin']);
check('the word and splits',
  parseFeaturedArtists('Track (feat. SYNNE and Dawn Calvin)'), ['SYNNE', 'Dawn Calvin']);
check('duplicates collapse',
  parseFeaturedArtists('Track (feat. SYNNE) (feat. synne)'), ['SYNNE']);

// Title cleanup.
check('title strips its credit',
  titleWithoutFeature('Sunday at the Corner Store (feat. SYNNE)'), 'Sunday at the Corner Store');
check('a clean title is untouched',
  titleWithoutFeature('Boom Bap Soul'), 'Boom Bap Soul');

// Slugs must round-trip case-insensitively, because SYNNE is upper case in the data
// and lower case in a URL.
check('slug of SYNNE', featuredArtistSlug('SYNNE'), 'synne');
check('slug of a two-word name', featuredArtistSlug('Lyle Carpenter'), 'lyle-carpenter');
check('slug ignores punctuation', featuredArtistSlug('D.J.P.'), 'd-j-p');
check('matching is case-insensitive',
  titleFeatures('Track (feat. SYNNE)', 'synne'), true);
check('a different artist does not match',
  titleFeatures('Track (feat. SYNNE)', 'dawn-calvin'), false);

// Rollup, sorted by count then name.
check('rollup counts and orders',
  collectFeaturedArtists([
    { title: 'a (feat. SYNNE)' },
    { title: 'b (feat. SYNNE)' },
    { title: 'c (feat. Dawn Calvin)' },
    { title: 'd' }
  ]),
  [{ name: 'SYNNE', slug: 'synne', count: 2 },
   { name: 'Dawn Calvin', slug: 'dawn-calvin', count: 1 }]);
check('rollup of nothing is empty', collectFeaturedArtists([]), []);
check('rollup tolerates junk entries',
  collectFeaturedArtists([null, {}, { title: null }]), []);

console.log('');
if (failures.length) {
  console.error(failures.length + ' check(s) FAILED.');
  process.exit(1);
}
console.log('All checks passed.');
