#!/usr/bin/env node
/**
 * Create the Stripe Products and recurring Prices for BeatFlow Radio sponsorship.
 *
 *   npm run stripe:sponsor-prices           # dry run, shows what it would create
 *   npm run stripe:sponsor-prices -- --apply
 *
 * WHY A SCRIPT AND NOT THE DASHBOARD
 * ----------------------------------
 * The tiers, names and amounts live in src/data/sponsorshipTiers.js. Creating the
 * Prices by hand in the dashboard would make the dashboard a second source of truth
 * for the amount, free to drift from the page that quotes it -- and a sponsor seeing
 * $199 on the page and being charged $249 at checkout is the worst version of that
 * bug. This reads the same module the page reads.
 *
 * WHY IT PINS THE ACCOUNT
 * -----------------------
 * The Stripe CLI's stored account (acct_1U4Gfp..., "NewDevBuild") is NOT the account
 * the app's key belongs to (acct_1Bn3cB...). Anything created through a bare `stripe`
 * command would land in the wrong sandbox and the app would never find it -- and the
 * failure is silent, because the CLI happily succeeds. This uses the app's own key,
 * so what it creates is by construction what the app will look up.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
require(path.join(ROOT, 'node_modules', 'dotenv')).config({ path: path.join(ROOT, '.env') });

const APPLY = process.argv.includes('--apply');
const SK = (process.env.STRIPE_SECRET_KEY || '').trim();

// ---- Guard the write. Mechanical, not careful. -----------------------------------
// Live and test keys sit side by side in the same file and differ by four characters.
// A live Price is not catastrophic, but it is public, cannot be deleted (only
// archived), and would be the visible price of a product Percy has not signed off.
if (!SK) {
  console.error('REFUSING: STRIPE_SECRET_KEY is not set.');
  process.exit(1);
}
if (!/^(sk|rk)_test_/.test(SK)) {
  console.error('REFUSING: key is not test mode (prefix ' + SK.slice(0, 8) + '). This script never writes to live.');
  process.exit(1);
}

// ---- Single source: read the tiers the PAGE uses. --------------------------------
// sponsorshipTiers.js is ES module syntax inside a CommonJS script, so the exports
// are stripped and the body evaluated. Deliberately crude: the alternative is
// retyping the amounts here, which is the exact drift this script exists to prevent.
function loadTiers() {
  const file = path.join(ROOT, 'src', 'data', 'sponsorshipTiers.js');
  const src = fs.readFileSync(file, 'utf8').replace(/^export /gm, '');
  const mod = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('process', 'module', src + '\nmodule.exports = { SPONSOR_TIERS };')(process, mod);
  return mod.exports.SPONSOR_TIERS;
}

function api(method, urlPath, form) {
  return new Promise((resolve, reject) => {
    const body = form ? new URLSearchParams(form).toString() : null;
    const req = https.request(
      {
        host: 'api.stripe.com',
        path: urlPath,
        method,
        auth: SK + ':',
        headers: body
          ? { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
          : {}
      },
      (res) => {
        let buf = '';
        res.on('data', (d) => (buf += d));
        res.on('end', () => {
          let json;
          try { json = JSON.parse(buf); } catch { return reject(new Error('Unparseable response')); }
          if (json.error) return reject(new Error(json.error.message));
          resolve(json);
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  const account = await api('GET', '/v1/account');
  console.log('Account : ' + account.id);
  console.log('Mode    : TEST (key prefix ' + SK.slice(0, 8) + ')');
  console.log('Applying: ' + (APPLY ? 'YES' : 'no - dry run, pass --apply to write'));
  console.log('');

  const tiers = loadTiers();
  const results = [];

  for (const tier of tiers) {
    const label = 'BeatFlow Radio Sponsorship - ' + tier.name;
    console.log(tier.name.padEnd(12) + '$' + (tier.monthlyCents / 100).toFixed(2) + '/month  -> ' + tier.priceIdEnv);

    if (!APPLY) { results.push({ tier, priceId: '(dry run)' }); continue; }

    // Idempotent on re-run: reuse a Product with the same name rather than creating a
    // duplicate every time. A second Product with the same name is invisible in the
    // dashboard list and impossible to tell apart later.
    const existing = await api('GET', '/v1/products?limit=100&active=true');
    let product = (existing.data || []).find((p) => p.name === label);
    if (product) {
      console.log('              reusing product ' + product.id);
    } else {
      product = await api('POST', '/v1/products', {
        name: label,
        description: tier.summary
      });
      console.log('              created product ' + product.id);
    }

    const price = await api('POST', '/v1/prices', {
      product: product.id,
      unit_amount: String(tier.monthlyCents),
      currency: 'usd',
      'recurring[interval]': 'month',
      nickname: label
    });
    console.log('              created price   ' + price.id);
    results.push({ tier, priceId: price.id });
  }

  console.log('');
  if (!APPLY) {
    console.log('Dry run only. Re-run with --apply to create these in ' + account.id + '.');
    return;
  }

  console.log('Add these to .env:');
  console.log('');
  results.forEach((r) => console.log('  ' + r.tier.priceIdEnv + '=' + r.priceId));
})().catch((err) => {
  console.error('FAILED: ' + err.message);
  process.exit(1);
});
