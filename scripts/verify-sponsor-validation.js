#!/usr/bin/env node
/**
 * Guards validateApplication's field-filter contract.
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
 * It is a one-character class of bug that will be reintroduced by anyone who
 * "simplifies" the guard back to a truthiness check, and it is invisible in review
 * because the expression looks idiomatic. Hence a runnable check rather than a note.
 *
 * WHY NOT A JEST TEST
 * -------------------
 * The service imports Firebase, so a jest test needs mocks, and this repo's suite
 * currently takes an hour and is largely red -- a new test would not be run. This
 * follows the existing verify:* convention instead: fast, dependency-free, and
 * meaningful on its own.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SERVICE = path.join(ROOT, 'src', 'services', 'sponsorApplicationService.js');

// Load the module with its ESM syntax stripped and its imports stubbed, so the
// validation rules can be exercised without Firebase.
function loadValidator() {
  const src = fs
    .readFileSync(SERVICE, 'utf8')
    .split(/\r?\n/)
    .filter((line) => !/^import /.test(line))
    .join('\n')
    .replace(/^export /gm, '');

  const SPONSOR_TIERS = [
    { id: 'supporter', audioSpot: false },
    { id: 'rotation', audioSpot: true }
  ];

  const stub = () => {};
  const mod = { exports: {} };
  const names = ['SPONSOR_TIERS', 'module', 'collection', 'addDoc', 'query', 'where',
    'orderBy', 'limit', 'getDocs', 'serverTimestamp', 'ref', 'uploadBytes',
    'getDownloadURL', 'db', 'storage'];
  const values = [SPONSOR_TIERS, mod, stub, stub, stub, stub, stub, stub, stub, stub,
    stub, stub, stub, {}, {}];

  // eslint-disable-next-line no-new-func
  new Function(...names, src + '\nmodule.exports = { validateApplication };')(...values);
  return mod.exports.validateApplication;
}

const validateApplication = loadValidator();

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
  }
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

console.log('');
if (failed) {
  console.error(failed + ' of ' + CASES.length + ' checks FAILED.');
  process.exit(1);
}
console.log('All ' + CASES.length + ' checks passed.');
