#!/usr/bin/env node
/**
 * verify:csp — reconciler for the Content Security Policy.
 *
 * config/csp.js is the single source and craco.config.js requires it directly.
 * Two consumers cannot: public/_headers is a Netlify text file and
 * public/index.html carries a <meta http-equiv>. Both are static copies, and the
 * DOSI rule for a copy is that it must reconcile back to the origin. This is that
 * reconciliation.
 *
 * Why it matters more here than for most duplication: a browser enforces the
 * INTERSECTION of every policy present. A value missing from one copy blocks the
 * request while every other copy looks correct, and the failure is silent — the
 * request simply never happens. That is exactly how App Check failed for three
 * rounds of debugging: the served HTML was demonstrably right, and a third copy in
 * craco.config.js was quietly narrowing the union.
 *
 * Reports per-directive drift rather than "they differ", because the whole problem
 * is that one missing token in one directive is invisible.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { DIRECTIVES } = require(path.join(ROOT, 'config', 'csp.js'));

/** Pull the policy text out of a file, whichever shape it is stored in. */
function extractPolicy(file) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');

  // public/_headers:  "  Content-Security-Policy: <policy>"
  const header = /Content-Security-Policy:\s*([^\n\r]+)/.exec(text);
  // public/index.html: <meta http-equiv="Content-Security-Policy" content="<policy>">
  // The value itself contains single quotes ("'self'"), so the capture must be
  // anchored to the OPENING delimiter rather than "any quote" -- otherwise it stops
  // at the first 'self' and reports every directive as missing.
  const metaDouble = /http-equiv=["']Content-Security-Policy["'][^>]*content="([^"]+)"/i.exec(text);
  const metaSingle = /http-equiv=["']Content-Security-Policy["'][^>]*content='([^']+)'/i.exec(text);
  const meta = metaDouble || metaSingle;

  const raw = (meta && meta[1]) || (header && header[1]);
  if (!raw) return null;

  const parsed = {};
  raw.split(';').map((s) => s.trim()).filter(Boolean).forEach((part) => {
    const [name, ...values] = part.split(/\s+/);
    parsed[name] = values;
  });
  return parsed;
}

const CONSUMERS = ['public/_headers', 'public/index.html'];

let problems = 0;

for (const file of CONSUMERS) {
  const actual = extractPolicy(file);
  if (!actual) {
    console.error(`  ${file}: no Content-Security-Policy found`);
    problems++;
    continue;
  }

  const issues = [];

  for (const [directive, expected] of Object.entries(DIRECTIVES)) {
    const got = actual[directive];
    if (!got) {
      issues.push(`missing directive '${directive}'`);
      continue;
    }
    // Order does not matter to a browser; membership does.
    const missing = expected.filter((v) => !got.includes(v));
    const extra = got.filter((v) => !expected.includes(v));
    if (missing.length) issues.push(`${directive}: missing ${missing.join(' ')}`);
    if (extra.length) issues.push(`${directive}: has un-canonical ${extra.join(' ')}`);
  }

  for (const directive of Object.keys(actual)) {
    if (!DIRECTIVES[directive]) issues.push(`directive '${directive}' is not in config/csp.js`);
  }

  if (issues.length) {
    console.error(`\n  ${file}`);
    issues.forEach((i) => console.error(`      ${i}`));
    problems += issues.length;
  } else {
    console.log(`  ${file} — matches config/csp.js`);
  }
}

// --- the hosts this app actually talks to must be IN the policy ---------------------
//
// Copy-drift was only half the problem. On 2026-10-15 all three copies agreed perfectly
// and the download was still blocked in production, because connect-src never listed
// Cloudflare R2 -- where every master lives. /downloads fetches the presigned URL as a
// blob, a blob fetch is connect-src, and the browser refused it. The buyer paid and saw
// "Failed to fetch".
//
// Nothing caught it because every test of that path ran in Node, which has no CSP. So
// this checks the policy against the endpoint the app is CONFIGURED to use, which is the
// one thing a Node test can assert about a browser rule.
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  const required = [
    ['R2_MASTERS_ENDPOINT', 'connect-src', 'masters are fetched from here by /downloads']
  ];
  for (const [key, directive, why] of required) {
    const m = env.match(new RegExp('^' + key + '=(.+)$', 'm'));
    if (!m) continue;
    let host;
    try { host = new URL(m[1].trim()).hostname; } catch { continue; }

    const allowed = (DIRECTIVES[directive] || []).some((entry) => {
      const v = entry.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');
      if (v === host) return true;
      if (v.startsWith('*.')) return host.endsWith(v.slice(1)); // *.foo.com matches a.foo.com
      return false;
    });

    if (!allowed) {
      console.error(`\n  ${key} resolves to ${host}`);
      console.error(`      which no ${directive} entry permits — ${why}.`);
      console.error('      The browser will refuse the request even though every copy agrees.');
      problems++;
    } else {
      console.log(`  ${directive} permits ${host}  (${key})`);
    }
  }
}

if (problems) {
  console.error(
    `\nverify:csp — ${problems} problem(s).\n` +
    'A browser enforces the INTERSECTION of every policy present, so a value missing\n' +
    'from one copy blocks the request while the others look correct. Update the copy\n' +
    'to match config/csp.js, or change config/csp.js and update every copy.'
  );
  process.exit(1);
}

console.log('\nverify:csp — all copies reconcile, and the configured hosts are permitted.');
