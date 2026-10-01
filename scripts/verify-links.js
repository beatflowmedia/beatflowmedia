#!/usr/bin/env node
//
// scripts/verify-links.js
//
//   npm run verify:links
//
// Every internal link target in src/ must resolve to a declared route or a redirect.
//
// WHY
// A signed-out visitor pressing "License Track" was sent to /login, a route that has
// never existed -- sign-in here is a Google popup, not a page. They got a 404 at the
// exact moment of purchase intent. Nothing caught it because a dead <Link> is not a
// type error, not a lint error, and not a test failure: it compiles, renders, and
// fails only when a human clicks it.
//
// An audit at the time found one more, /admin/panel, which had presumably been broken
// for as long. Two is a pattern, and the cost of finding the next one by hand is a
// customer leaving. So this runs instead of remembering.
//
// SCOPE, deliberately narrow: STRING LITERALS only -- to="/foo" and navigate('/foo').
// A computed target like `/song/${id}` cannot be checked without running the app, and
// pretending otherwise would mean either false alarms or a guard nobody trusts. The
// literals are where the typos live.
//
// Route params match positionally: /song/:id accepts /song/anything. That is as far as
// a static check can honestly go.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const norm = (p) => p.replace(/^\/+|\/+$/g, '').replace(/:[^/]+/g, '*');

// Declared routes.
const routesSrc = fs.readFileSync(path.join(ROOT, 'src/AppRoutes.js'), 'utf8');
const declared = new Set(
  [...routesSrc.matchAll(/path="([^"]+)"/g)]
    .map((m) => norm(m[1]))
    // THE CATCH-ALL IS EXCLUDED, and leaving it in made this guard worthless.
    //
    // AppRoutes ends with <Route path="*"> rendering "404 - Page Not Found". That
    // normalises to a single wildcard segment, and the matcher below treats a wildcard
    // as matching any segment -- so EVERY one-segment link resolved, including the
    // /login that started all this. The first version of this script reported "No dead
    // internal links" against a tree that still contained the bug it was written for.
    //
    // Caught only because the guard was tested by re-introducing the known fault
    // instead of being trusted because it was green. A guard that has never failed has
    // not been shown to work.
    //
    // Filtering here was ALSO not enough -- see dropCatchAlls() below. The second
    // source of '*' is public/_redirects, whose SPA fallback is `/* /index.html 200`.
    // Fixing one source and re-testing is what surfaced the other.
);
declared.add(''); // the index route

// Redirects count as resolvable -- a 301 is a live destination, not a dead end.
const redirectsFile = path.join(ROOT, 'public/_redirects');
if (fs.existsSync(redirectsFile)) {
  fs.readFileSync(redirectsFile, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .forEach((l) => {
      const from = l.split(/\s+/)[0];
      if (from && from.startsWith('/')) declared.add(norm(from));
    });
}

// Remove every catch-all, from BOTH sources, once the set is assembled.
//
// Two different files contribute one: <Route path="*"> in AppRoutes, and the SPA
// fallback `/* /index.html 200` in public/_redirects. Either one alone makes every
// single-segment link resolve and turns this script into a green light that checks
// nothing. Dropping them at the point they are USED, rather than at each source, is
// what makes a third source -- a netlify.toml redirect, say -- harmless.
//
// A catch-all is precisely not a destination: path="*" renders the 404, and the SPA
// fallback hands back index.html so the router can render that same 404. Treating
// either as "the link resolves" asserts the opposite of what they mean.
for (const route of [...declared]) {
  if (route.split('/').every((seg) => seg === '*')) declared.delete(route);
}

const resolves = (target) => {
  const segs = norm(target).split('/');
  for (const route of declared) {
    const rs = route.split('/');
    if (rs.length !== segs.length) continue;
    if (rs.every((r, i) => r === segs[i] || r === '*')) return true;
  }
  return false;
};

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    // Stories and tests link to fixtures, not to this app's routes.
    else if (/\.(js|jsx)$/.test(entry.name) && !/\.(test|stories)\./.test(entry.name)) {
      files.push(full);
    }
  }
})(path.join(ROOT, 'src'));

const PATTERNS = [
  /to="(\/[^"{}]*)"/g,
  /navigate\(\s*'(\/[^'{}]*)'/g,
  /navigate\(\s*"(\/[^"{}]*)"/g
];

// Comments are stripped before scanning.
//
// Without this, the comment in HomeStorefront explaining why navigate('/login') was
// removed is itself reported as a dead link to /login -- the guard failing the very
// fix it exists to protect. That is the kind of false positive that gets a check
// disabled rather than understood, so it is worth the crude regex: these are link
// literals in JSX, not a problem that needs a parser.
//
// The `[^:]` guard before // keeps it from eating the `//` in an https:// URL.
const stripComments = (text) =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const dead = [];
let checked = 0;

for (const file of files) {
  const text = stripComments(fs.readFileSync(file, 'utf8'));
  for (const pattern of PATTERNS) {
    for (const m of text.matchAll(pattern)) {
      checked += 1;
      // A bare query or hash target is not a route.
      if (/^\/[?#]/.test(m[1])) continue;
      // The route is the path; a query string and a hash are arguments to it.
      // /for-artists?membership=active resolves exactly as /for-artists does, and
      // comparing the whole string reported it dead.
      const target = m[1].split(/[?#]/)[0];
      if (!resolves(target)) {
        dead.push({ target: m[1], file: path.relative(ROOT, file).replace(/\\/g, '/') });
      }
    }
  }
}

console.log('internal link targets checked: ' + checked);
console.log('declared routes + redirects  : ' + declared.size);
console.log('');

if (dead.length) {
  dead.forEach((d) => console.log('  DEAD  ' + d.target.padEnd(32) + '  ' + d.file));
  console.log('');
  console.error(dead.length + ' dead internal link(s). Add the route, fix the target, or add a 301.');
  process.exit(1);
}

console.log('No dead internal links.');
process.exit(0);
