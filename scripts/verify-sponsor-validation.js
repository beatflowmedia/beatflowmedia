#!/usr/bin/env node
/**
 * Guards the sponsor application's validation contract.
 *
 *   npm run verify:sponsor
 *
 * WHY THIS EXISTS
 * ---------------
 * The sponsor wizard validates one step at a time by passing that step's field list.
 * The first step owns no fields and passes [], and the filter was written as:
 *
 *   const names = fields && fields.length ? fields : Object.keys(RULES);
 *
 * An empty array is truthy but its .length is 0, so "check nothing" and "check
 * everything" were indistinguishable. Pressing Continue on step one reported all
 * eight errors for a form the sponsor had not been shown yet.
 *
 * It is a one-character class of bug, it will be reintroduced by anyone who
 * "simplifies" the guard back to a truthiness check, and it is invisible in review
 * because the broken expression reads perfectly idiomatically. Hence a runnable
 * check rather than a comment.
 *
 * WHY NOT A JEST TEST
 * -------------------
 * The service imports Firebase, so a jest test needs mocks, and this repo's suite
 * takes an hour and is largely red -- a test added there would not be run, which is
 * worse than no test because it looks like coverage. This follows the existing
 * verify:* convention: dependency-free, sub-second, meaningful alone.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/**
 * Load an ES module's exports in plain CommonJS by stripping its import lines and
 * `export` keywords, then evaluating the body with named stand-ins supplied.
 *
 * One loader, used for both modules. It was briefly two near-identical copies, which
 * is the duplication this check is meant to be an example against.
 *
 * @param {string} relPath   module path relative to the repo root
 * @param {string[]} exportNames  bindings to hand back
 * @param {Object} [injected]     name -> value for anything the module imports
 */
function loadEsModule(relPath, exportNames, injected = {}) {
  // Strips MULTI-LINE imports as well as single-line ones. It only handled single
  // lines at first, so the moment the service's import of radioStation grew past one
  // line the remaining lines were left in the body and the loader died on `from`.
  // An import statement ends at the line carrying its `from '...'` clause.
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
        // Single-line if it already carries its `from` clause (or is a bare import).
        insideImport = !/\bfrom\s+['"].*['"]\s*;?\s*$/.test(line) && !/;\s*$/.test(line);
        return false;
      }
      return true;
    })
    .join('\n')
    .replace(/^export /gm, '');

  const mod = { exports: {} };
  const names = ['module', ...Object.keys(injected)];
  const values = [mod, ...Object.values(injected)];
  const tail = '\nmodule.exports = { ' + exportNames.join(', ') + ' };';

  // eslint-disable-next-line no-new-func
  new Function(...names, body + tail)(...values);
  return mod.exports;
}

// The whole station module, real rather than stubbed.
//
// The rules check membership of the CTA list and the creative specs, so stubs would
// make these checks pass while proving nothing. Injecting the module WHOLESALE also
// means the service can start importing another of its exports without this script
// silently breaking -- which it did once, when the specs moved here.
const STATION = loadEsModule('src/data/radioStation.js', [
  'RADIO_PROGRAMS', 'NO_PREFERENCE', 'PROGRAM_CHOICES', 'programNameFor',
  'SPOT_BLOCKS', 'CTA_OPTIONS', 'isAllowedCta',
  'AUDIO_SPEC', 'LOGO_SPEC', 'mimeTypesOf', 'megabytesOf', 'DEFAULT_SPOT_BLOCK'
]);
const { CTA_OPTIONS, AUDIO_SPEC, LOGO_SPEC } = STATION;

const SPONSOR_TIERS = [
  { id: 'supporter', audioSpot: false },
  { id: 'rotation', audioSpot: true }
];

const noop = () => {};
const { validateApplication, normalizeLandingUrl } = loadEsModule(
  'src/services/sponsorApplicationService.js',
  ['validateApplication', 'normalizeLandingUrl'],
  {
    SPONSOR_TIERS,
    ...STATION,
    // Firebase surface the module imports but the validator never touches.
    collection: noop, addDoc: noop, query: noop, where: noop, orderBy: noop,
    limit: noop, getDocs: noop, serverTimestamp: noop, ref: noop,
    uploadBytes: noop, getDownloadURL: noop, db: {}, storage: {}
  }
);

const EMPTY = {
  tierId: '', company: '', blurb: '', cta: '', contactName: '', email: '',
  landingUrl: '', describe: '', wantsProduction: false, audioFile: null, logoFile: null
};

const CASES = [
  {
    label: 'empty field list checks NOTHING (wizard step one)',
    run: () => validateApplication(EMPTY, []),
    valid: true,
    errors: 0
  },
  {
    label: 'named field checks only that field',
    run: () => validateApplication(EMPTY, ['tierId']),
    valid: false,
    errors: 1
  },
  {
    label: 'omitted field list checks EVERYTHING (final submit)',
    run: () => validateApplication(EMPTY),
    valid: false,
    errors: 8
  },
  {
    label: 'unknown field names are ignored, not thrown on',
    run: () => validateApplication(EMPTY, ['notARealField']),
    valid: true,
    errors: 0
  },
  {
    label: 'card-only tier does not demand audio',
    run: () => validateApplication({ ...EMPTY, tierId: 'supporter' }, ['audioFile']),
    valid: true,
    errors: 0
  },
  {
    label: 'audio tier demands audio unless we produce it',
    run: () => validateApplication({ ...EMPTY, tierId: 'rotation' }, ['audioFile']),
    valid: false,
    errors: 1
  },
  {
    label: 'button label must come from the fixed list, not free text',
    run: () => validateApplication({ ...EMPTY, cta: 'Click here to claim your prize' }, ['cta']),
    valid: false,
    errors: 1
  },
  {
    label: 'a listed button label is accepted',
    run: () => validateApplication({ ...EMPTY, cta: CTA_OPTIONS[0] }, ['cta']),
    valid: true,
    errors: 0
  },
  {
    label: 'a bare domain is accepted (https added for them)',
    run: () => validateApplication({ ...EMPTY, landingUrl: 'example.com' }, ['landingUrl']),
    valid: true,
    errors: 0
  },
  {
    label: 'a bare www domain is accepted',
    run: () => validateApplication({ ...EMPTY, landingUrl: 'www.example.co.uk' }, ['landingUrl']),
    valid: true,
    errors: 0
  },
  {
    label: 'an existing scheme is preserved, not doubled',
    run: () => validateApplication({ ...EMPTY, landingUrl: 'http://example.com' }, ['landingUrl']),
    valid: true,
    errors: 0
  },
  {
    label: 'a blank landing url is still rejected',
    run: () => validateApplication({ ...EMPTY, landingUrl: '   ' }, ['landingUrl']),
    valid: false,
    errors: 1
  },
  {
    label: 'text that is not a domain is still rejected',
    run: () => validateApplication({ ...EMPTY, landingUrl: 'my shop' }, ['landingUrl']),
    valid: false,
    errors: 1
  }
];

// Normalisation itself, separately from validation: these are the exact strings the
// sponsor card will link to, so a wrong one sends listeners somewhere the advertiser
// never agreed to.
const URL_CASES = [
  ['example.com', 'https://example.com'],
  ['  example.com  ', 'https://example.com'],
  ['www.example.com/shop', 'https://www.example.com/shop'],
  ['http://example.com', 'http://example.com'],
  ['https://example.com', 'https://example.com'],
  ['HTTPS://Example.com', 'HTTPS://Example.com'],
  ['', ''],
  ['   ', '']
];

let failed = 0;
CASES.forEach((testCase) => {
  const result = testCase.run();
  const ok = result.isValid === testCase.valid && result.errors.length === testCase.errors;
  if (!ok) failed += 1;
  console.log(
    (ok ? '  PASS  ' : '  FAIL  ') + testCase.label +
    (ok
      ? ''
      : `\n          got valid=${result.isValid} errors=${result.errors.length}` +
        `, expected valid=${testCase.valid} errors=${testCase.errors}`)
  );
});

URL_CASES.forEach(([input, expected]) => {
  const got = normalizeLandingUrl(input);
  const ok = got === expected;
  if (!ok) failed += 1;
  console.log(
    (ok ? '  PASS  ' : '  FAIL  ') +
    `normalise ${JSON.stringify(input)} -> ${JSON.stringify(got)}` +
    (ok ? '' : `   EXPECTED ${JSON.stringify(expected)}`)
  );
});

const total = CASES.length + URL_CASES.length;
console.log('');
if (failed) {
  console.error(failed + ' of ' + total + ' checks FAILED.');
  process.exit(1);
}
console.log('All ' + total + ' checks passed.');
