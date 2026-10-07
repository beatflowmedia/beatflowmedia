// scripts/verify-stripe.js
//
// Reconcile the Stripe account the CLI is pointed at against what this app declares.
//
// WHY THIS EXISTS
// On 2026-10-06 the CLI was answering happily while pointed at the wrong place twice
// over: first an account called "NewDevBuild" (acct_1U4GfpQ56HLchPg8), then an
// environment holding 9 products while the sandbox actually in use held 21. Nothing
// warned anybody. A `stripe listen` against the wrong environment forwards nothing,
// and silence is indistinguishable from "no events yet" -- which is how an afternoon
// disappears into a webhook that was never going to fire.
//
// So this does not ask "does Stripe work". It asks "is the CLI looking at the place
// this app bills against, and does that place hold what the app says it holds".
//
// Reads only. It never creates, updates or deletes anything, in either mode.
//
//   npm run verify:stripe            # the CLI's current (test/sandbox) environment
//   npm run verify:stripe -- --live  # the live environment
//
// It shells out to the Stripe CLI rather than taking an API key, so no secret is read,
// written or printed here. execFile is used instead of a shell, which also sidesteps
// the Git Bash path mangling that turns /v1/account into C:/Program Files/Git/v1/....
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LIVE = process.argv.includes('--live');

// The canonical account, asserted against the dashboard on 2026-10-06 and recorded in
// CLAUDE.md. The id is the same in test and live -- one account, two data sets -- so
// matching it proves the ACCOUNT, never the mode.
const CANONICAL_ACCOUNT = 'acct_1Bn3cBAEum2hO0KZ';

const failures = [];
const notes = [];

function stripeGet(resource, params = {}) {
  const args = ['get', resource];
  Object.entries(params).forEach(([k, v]) => args.push('-d', `${k}=${v}`));
  if (LIVE) args.push('--live');
  let out;
  try {
    out = execFileSync('stripe', args, {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch (err) {
    // A CLI that has never been logged in prints an interactive prompt rather than
    // JSON. Say so plainly instead of letting JSON.parse throw something cryptic.
    const text = (err.stdout || '') + (err.stderr || err.message || '');
    if (/not configured API keys|stripe login/i.test(text)) {
      console.error('The Stripe CLI is not authenticated for this mode.');
      console.error('Run `stripe login` with the intended sandbox active in the browser.');
      process.exit(2);
    }
    console.error('stripe CLI call failed: ' + text.split('\n')[0].slice(0, 200));
    process.exit(2);
  }
  try {
    return JSON.parse(out);
  } catch (err) {
    console.error('Stripe returned something that is not JSON:');
    console.error(out.split('\n').slice(0, 3).join('\n').slice(0, 300));
    process.exit(2);
  }
}

// ---------------------------------------------------------------- 1. the account
const account = stripeGet('/v1/account');
if (account.error) {
  console.error('Could not read the account: ' + account.error.message);
  process.exit(2);
}
if (account.id !== CANONICAL_ACCOUNT) {
  failures.push(
    'WRONG ACCOUNT. The CLI is pointed at ' + account.id + ' (' +
    (account.settings?.dashboard?.display_name || 'no display name') + '),\n' +
    '      but this app bills against ' + CANONICAL_ACCOUNT + ' (BeatFlowMediaGroup).\n' +
    '      Anything derived from the CLI right now -- webhook secrets, forwarded events,\n' +
    '      triggered fixtures -- belongs to the other account. Run `stripe login`.'
  );
}

// ---------------------------------------------------------------- 2. the tier plans
// The app's canonical tier pricing. Required here rather than retyped, so a price
// changed in the product cannot leave this script asserting a stale number.
//
// pricingPlans.js is ESM and this is a CommonJS script, so the numbers are read out of
// the source rather than imported. Fragile to reformatting and deliberately so: it
// fails loudly if the shape changes, instead of silently checking nothing.
const fs = require('fs');
const plansSrc = fs.readFileSync(path.join(ROOT, 'src/data/pricingPlans.js'), 'utf8');
const declaredTiers = [];
const TIER_RE = /id:\s*'([a-z]+)'[\s\S]{0,400}?price:\s*(\d+)/g;
let m;
while ((m = TIER_RE.exec(plansSrc))) {
  if (['student', 'creator', 'pro', 'agency'].includes(m[1])) {
    declaredTiers.push({ id: m[1], amount: Number(m[2]) });
  }
}
if (declaredTiers.length !== 4) {
  failures.push(
    'Could not read all four tiers out of src/data/pricingPlans.js (found ' +
    declaredTiers.length + ').\n      The file shape changed; this check is no longer ' +
    'reading what it thinks it is.'
  );
}

// Dashboard names for the tiers, as a LIST per tier, because the two environments do not
// agree: the `pro` product is named "Professional" in the sandbox and "Pro" in live. A
// single expected name made this check report "no active price" for a price that was
// sitting right there -- the lookup silently returning nothing is exactly the failure
// mode this file is supposed to catch, not produce.
const TIER_PRODUCT_NAMES = {
  student: ['Student'],
  creator: ['Creator'],
  pro: ['Pro', 'Professional'],
  agency: ['Agency']
};

const prices = stripeGet('/v1/prices', { limit: 100, 'expand[]': 'data.product', active: 'true' });
const priceList = prices.data || [];

declaredTiers.forEach((tier) => {
  const wantNames = TIER_PRODUCT_NAMES[tier.id] || [];
  const matches = priceList.filter((p) => {
    const prod = p.product && typeof p.product === 'object' ? p.product : null;
    return prod && wantNames.includes(prod.name);
  });

  if (!matches.length) {
    failures.push(
      'Tier "' + tier.id + '" (' + wantNames.join('/') + ', $' + (tier.amount / 100).toFixed(2) +
      '/month) has no active price in this environment.\n' +
      '      The app offers this plan. Checkout for it cannot succeed here.'
    );
    return;
  }
  const exact = matches.find((p) => p.unit_amount === tier.amount);
  if (!exact) {
    failures.push(
      'Tier "' + tier.id + '" price MISMATCH.\n' +
      '      app declares : $' + (tier.amount / 100).toFixed(2) + '\n' +
      '      Stripe has   : ' + matches.map((p) => '$' + ((p.unit_amount || 0) / 100).toFixed(2)).join(', ') +
      '\n      A customer is charged the Stripe amount; the page shows the app amount.'
    );
  } else if (exact.recurring?.interval !== 'month') {
    failures.push(
      'Tier "' + tier.id + '" is priced at the right amount but is not monthly ' +
      '(interval: ' + (exact.recurring?.interval || 'one-off') + ').'
    );
  }
});

// ------------------------------------------- 2b. the id the app would actually send
//
// The tier check above proves a correctly-priced price EXISTS. It does not prove the app
// would send that one, and on 2026-10-07 it did not: the REACT_APP_STRIPE_*_PRICE_ID vars
// were unset in Netlify, ExplorePremium.js carried hardcoded fallbacks, and the deployed
// bundle billed "Beat Household" $18.00 for a plan advertised at $149.
//
// So this resolves the id the app is configured with and checks what it charges. An
// existing-but-unused correct price is exactly the gap that hid this for months.
const configuredIds = {
  student: process.env.REACT_APP_STRIPE_STUDENT_PRICE_ID,
  creator: process.env.REACT_APP_STRIPE_CREATOR_PRICE_ID,
  pro: process.env.REACT_APP_STRIPE_PRO_PRICE_ID,
  agency: process.env.REACT_APP_STRIPE_AGENCY_PRICE_ID
};

declaredTiers.forEach((tier) => {
  const configured = configuredIds[tier.id];
  if (!configured) {
    // Not a failure by itself -- this is how a dev machine looks, and the UI now refuses
    // to offer an unconfigured plan rather than inventing one. It is reported so a
    // production run says so out loud.
    notes.push(
      `No price id configured for tier "${tier.id}" (REACT_APP_STRIPE_${tier.id.toUpperCase()}_PRICE_ID). ` +
      'The plan will show as unavailable rather than being sold at the wrong price.'
    );
    return;
  }
  const match = priceList.find((p) => p.id === configured);
  if (!match) {
    failures.push(
      'Tier "' + tier.id + '" is configured with ' + configured + ', which is not an active price\n' +
      '      in this environment. Checkout would fail, or bill from the wrong mode.'
    );
    return;
  }
  if (match.unit_amount !== tier.amount) {
    const prodName = match.product && typeof match.product === 'object' ? match.product.name : '?';
    failures.push(
      'Tier "' + tier.id + '" ADVERTISES $' + (tier.amount / 100).toFixed(2) +
      ' and would CHARGE $' + ((match.unit_amount || 0) / 100).toFixed(2) + ' (' + prodName + ').\n' +
      '      The configured price id is ' + configured + '.\n' +
      '      A page that quotes one amount and bills another is the worst of the failures this\n' +
      '      script exists to catch -- it looks like it is working.'
    );
  }
});

// ---------------------------------------------------------------- 3. webhooks
const hooks = stripeGet('/v1/webhook_endpoints', { limit: 100 });
const hookList = (hooks.data || []).filter((h) => h.status === 'enabled');
const ourHooks = hookList.filter((h) => /beatflowmediagroup\.com/.test(h.url || ''));

if (!hookList.length) {
  notes.push('No enabled webhook endpoints in this environment. Purchases will be taken ' +
    'but stripe-webhook will never run, so nothing is recorded and no artist is credited.');
} else if (!ourHooks.length) {
  notes.push('Enabled webhook endpoints exist, but none point at beatflowmediagroup.com:\n' +
    hookList.map((h) => '        ' + h.url).join('\n'));
}

// ---------------------------------------------------------------- 4. scaffolding
// Products are read through the PRICES expansion, not from /v1/products.
//
// /v1/products under-reports here: it returned 9 while the account plainly holds more,
// and `has_more` was false, so a caller that trusts it concludes the tiers are missing
// and goes looking for the wrong problem. That is exactly the trip taken on
// 2026-10-06. The expansion returns the product attached to every active price, which
// is the set that actually matters -- a product with no active price cannot be sold.
const prodByName = new Map();
priceList.forEach((p) => {
  if (p.product && typeof p.product === 'object' && p.product.name) {
    prodByName.set(p.product.name, p.product);
  }
});
const prodList = [...prodByName.values()];
const junk = prodList.filter((p) => /^myproduct$|^test|^untitled/i.test(p.name || ''));

console.log('mode                 : ' + (LIVE ? 'LIVE' : 'test / sandbox'));
console.log('account              : ' + account.id +
  (account.id === CANONICAL_ACCOUNT ? '  (BeatFlowMediaGroup)' : '  <-- NOT the canonical account'));
console.log("products (via prices) : " + prodList.length);
console.log('active prices        : ' + priceList.length);
console.log('enabled webhooks     : ' + hookList.length + ' (' + ourHooks.length + ' ours)');
console.log('tiers declared       : ' + declaredTiers.map((t) => t.id).join(', '));
console.log('');

if (junk.length) {
  console.log('  ' + junk.length + ' product(s) look like scaffolding: ' +
    junk.map((p) => p.name).join(', '));
  console.log('      Harmless in a sandbox. Worth checking none of it exists in live.');
  console.log('');
}

notes.forEach((n) => console.log('  NOTE: ' + n + '\n'));

if (failures.length) {
  failures.forEach((f) => console.log('  ' + f + '\n'));
  console.error(failures.length + ' Stripe configuration problem(s).');
  process.exit(1);
}

console.log('Stripe matches what the app declares.');
process.exit(0);
