#!/usr/bin/env node
/**
 * verify:env — does production hold every variable the deployed code requires?
 *
 * WHY THIS EXISTS
 * A function that needs an environment variable fails at RUNTIME, in production, on a
 * real request, long after the deploy reported success. Nothing in the build, the tests
 * or the deploy log says a variable is missing, because none of them run the code that
 * needs it. The licence certificate feature would have shipped and returned 500 on every
 * request for exactly this reason: LICENSE_CERT_SECRET existed locally and not in Netlify.
 *
 * It is the same shape as the other failures recorded in CLAUDE.md -- a value that must
 * exist in two places with nothing reconciling them. The CSP copies, the _redirects rule,
 * the setupProxy port. Here the two places are `.env` and the Netlify UI, and they are
 * DELIBERATELY different values for secrets, so the check is existence and never equality.
 *
 * NEVER PRINTS A VALUE. Names, lengths and short prefixes only -- a transcript outlives
 * the key.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * What production must have, and what breaks without it.
 *
 * `local` says whether the variable is also needed on a developer machine. A few are
 * supplied by Netlify itself in production (URL) and must NOT be set by hand.
 */
const REQUIRED = [
  ['LICENSE_CERT_SECRET', 'Licence certificates cannot be issued or verified; every request 500s.'],
  ['FIREBASE_PROJECT_ID', 'Every function that touches Firestore fails at module load.'],
  ['FIREBASE_CLIENT_EMAIL', 'Firebase Admin cannot authenticate.'],
  ['FIREBASE_PRIVATE_KEY', 'Firebase Admin cannot authenticate.'],
  ['STRIPE_SECRET_KEY', 'Checkout cannot create a session.'],
  ['STRIPE_WEBHOOK_SECRET', 'Webhook signature verification fails; every event is refused with 400.'],
  ['R2_MASTERS_ENDPOINT', 'Masters cannot be presigned; paid downloads fail.']
];

/** Supplied by the platform. Listed so nobody "fixes" their absence by hand. */
const PLATFORM_PROVIDED = ['URL'];

function productionKeys() {
  try {
    // --context production is load-bearing. Without it the CLI answers for a DIFFERENT
    // context, and a variable set only for production reads as absent -- which is exactly
    // how this script reported LICENSE_CERT_SECRET missing one minute after setting it
    // and reading it back successfully. A reconciler that asks the wrong question is
    // worse than none: it trains you to ignore it.
    const out = execSync('npx --no-install netlify env:list --context production --json', {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 10 * 1024 * 1024
    });
    return Object.keys(JSON.parse(out));
  } catch (err) {
    return null;
  }
}

function localKeys() {
  const file = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((line) => (line.match(/^\s*([A-Z0-9_]+)\s*=/) || [])[1])
    .filter(Boolean);
}

console.log('\nverify:env — does production hold what the deployed code needs?\n');

const prod = productionKeys();
if (!prod) {
  console.error('  Could not read Netlify environment variables.');
  console.error('  Needs a logged-in netlify CLI or NETLIFY_AUTH_TOKEN.');
  process.exit(2);
}

const local = localKeys();
let problems = 0;

REQUIRED.forEach(([name, consequence]) => {
  const inProd = prod.includes(name);
  const inLocal = local.includes(name);

  if (inProd) {
    console.log('  ok    ' + name.padEnd(24) + (inLocal ? 'production + local' : 'production only'));
  } else {
    console.error('  FAIL  ' + name.padEnd(24) + 'MISSING IN PRODUCTION' + (inLocal ? ' (set locally)' : ''));
    console.error('        ' + consequence);
    console.error('        Set it with: npx netlify env:set ' + name + ' <value> --context production');
    problems++;
  }
});

PLATFORM_PROVIDED.forEach((name) => {
  console.log('  --    ' + name.padEnd(24) + 'supplied by Netlify; do not set by hand');
});

if (problems) {
  console.error(
    '\nverify:env — ' + problems + ' variable(s) missing.\n\n' +
    'A missing variable fails at RUNTIME, in production, on a real request. The build\n' +
    'passes, the deploy reports success, and the first thing that tells you is a customer.\n'
  );
  process.exit(1);
}

console.log('\nverify:env — production holds every required variable.\n');
process.exit(0);
