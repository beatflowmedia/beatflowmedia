#!/usr/bin/env node
//
// scripts/verify-domains.js
//
//   npm run verify:domains
//
// Fails if the codebase points at a domain BeatFlow Media Group does not own.
//
// WHY
// `beatflowmedia.com` is not ours. `beatflowmediagroup.com` is. The names differ by
// one word and the wrong one was in four live places:
//
//   metaTagsHelper.js   SITE_URL fallback -> canonical and og: tags
//   schemaMarkup.js     SITE_URL fallback -> Schema.org, plus a support@ address
//   stripe-webhook.js   "Update Payment Method" in the payment-failure email
//   NEXT_PUBLIC_APP_URL in Netlify
//
// Three of those were FALLBACKS, which is the worst place for it: the wrong value is
// reached only when nobody has configured anything, so it survives every environment
// where someone did. REACT_APP_SITE_URL was unset in production, so the fallback was
// live.
//
// The damage is not a broken link. A canonical tag tells search engines the real page
// lives at that address, and an email sends a customer with a billing problem to a
// domain whose contents someone else decides. Neither fails loudly; both are worse
// than a 404, which at least announces itself.
//
// Checked in SOURCE, not in the built output, so it fails before a deploy rather than
// after one.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/** Domains that are not ours, as a bare hostname. */
const FOREIGN = ['beatflowmedia.com'];

/** The one we own, so the check does not fire on it. */
const OURS = 'beatflowmediagroup.com';

const SEARCH_DIRS = ['src', 'netlify', 'config', 'public'];
const SKIP_DIRS = new Set(['node_modules', 'build', '.git', 'reports']);
const EXT = /\.(js|jsx|ts|tsx|json|html|toml|md|txt)$/i;

const files = [];
for (const dir of SEARCH_DIRS) {
  const base = path.join(ROOT, dir);
  if (!fs.existsSync(base)) continue;
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (SKIP_DIRS.has(e.name)) continue;
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (EXT.test(e.name)) files.push(full);
    }
  })(base);
}

const hits = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  text.split(/\r?\n/).forEach((line, i) => {
    for (const domain of FOREIGN) {
      if (!line.includes(domain)) continue;
      // beatflowmediagroup.com contains neither "beatflowmedia.com" nor a false
      // positive for it, but guard anyway so the rule survives a rename.
      if (line.includes(OURS) && !new RegExp('(^|[^a-z])' + domain.replace('.', '\\.')).test(line)) continue;
      // A line explaining the rule is not a violation of it. This has to strip
      // TRAILING comments too, not just whole-line ones: the first version flagged
      //     email: 'support@beatflowmediagroup.com' // was beatflowmedia.com
      // which is the corrected line plus a note about what it replaced. A guard that
      // fires on the explanation of its own fix teaches people to delete explanations.
      // The `[^:]` guard is load-bearing: /\/\/.*$/ also strips the // in
      // https://, which deleted the domain from `code` and made this check pass
      // on a planted violation. Same bug as verify-links.js had, found the same
      // way -- by planting one and requiring the guard to FAIL.
      const code = line.replace(/(^|[^:])\/\/.*$/, '$1').replace(/\/\*[\s\S]*?\*\//g, '');
      if (!code.includes(domain)) continue;
      if (/^\s*(\/\/|\*|#)/.test(line)) continue;
      hits.push({ file: path.relative(ROOT, file).replace(/\\/g, '/'), line: i + 1, text: line.trim().slice(0, 100) });
    }
  });
}

console.log('files scanned        : ' + files.length);
console.log('foreign domains      : ' + FOREIGN.join(', '));
console.log('');

if (hits.length) {
  hits.forEach((h) => console.log('  ' + h.file + ':' + h.line + '\n      ' + h.text));
  console.log('');
  console.error(hits.length + ' reference(s) to a domain BFMG does not own.');
  process.exit(1);
}

console.log('No references to a domain BFMG does not own.');
process.exit(0);
