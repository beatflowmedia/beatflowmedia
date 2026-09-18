#!/usr/bin/env node
/**
 * verify:assets — reconciler for locally-referenced image paths.
 *
 * DOSI/S caveat: a copy that never reconciles is a second source of truth.
 * Every string literal in src/ that looks like a root-relative image path is a
 * claim that public/<path> exists. This asserts the claim instead of trusting it.
 *
 * Exits non-zero on the first missing asset so it can gate a build or a hook.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const PUBLIC = path.join(__dirname, '..', 'public');
const IMAGE_LITERAL = /['"](\/[A-Za-z0-9_.\-/ ]*\.(?:jpg|jpeg|png|webp|svg|gif|avif))['"]/gi;

/** Paths that are generated or served by something other than public/. */
const EXEMPT = [
  /^\/static\//,          // CRA build output
  /^\/%PUBLIC_URL%/,      // index.html templating
];

/**
 * Tests, stories and fixtures reference deliberately fake URLs -- /broken-image.jpg
 * exists precisely so it can 404. Asserting they resolve would be coverage that
 * tests nothing (DOSI/I caveat), so they are out of scope.
 */
const NOT_RENDERING_CODE = new RegExp("\\.test\\.|\\.spec\\.|\\.stories\\.|/tests?/|/__tests__/");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__mocks__') continue;
      walk(full, out);
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name) && !NOT_RENDERING_CODE.test(full.split(path.sep).join("/"))) {
      out.push(full);
    }
  }
  return out;
}

const refs = new Map(); // assetPath -> [{ file, line }]

for (const file of walk(SRC)) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((text, i) => {
    for (const match of text.matchAll(IMAGE_LITERAL)) {
      const assetPath = match[1];
      if (EXEMPT.some((re) => re.test(assetPath))) continue;
      // A path inside a comment is prose, not a render claim.
      const trimmed = text.trimStart();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
      // A COMPARISON against a path is not a claim that the file exists. The
      // repair scripts check whether a record still holds a known-dead value;
      // asserting that value resolves would be backwards, since the entire
      // point of the check is that it does not.
      const pre = text.slice(0, match.index).trimEnd();
      if (pre.endsWith("==") || pre.endsWith("!=")) continue;
      if (!refs.has(assetPath)) refs.set(assetPath, []);
      refs.get(assetPath).push({ file: path.relative(SRC, file).split(path.sep).join('/'), line: i + 1 });
    }
  });
}

const missing = [...refs.entries()]
  .filter(([assetPath]) => !fs.existsSync(path.join(PUBLIC, assetPath)))
  .sort((a, b) => b[1].length - a[1].length);

const checked = refs.size;
if (missing.length === 0) {
  console.log(`verify:assets — ${checked} referenced image paths, all present in public/.`);
  process.exit(0);
}

console.error(`verify:assets — ${missing.length} of ${checked} referenced image paths are MISSING from public/:\n`);
for (const [assetPath, sites] of missing) {
  console.error(`  ${assetPath}  (${sites.length} reference${sites.length === 1 ? '' : 's'})`);
  for (const site of sites.slice(0, 4)) console.error(`      src/${site.file}:${site.line}`);
  if (sites.length > 4) console.error(`      … and ${sites.length - 4} more`);
}
console.error(`\nA fallback image that 404s is not a fallback. Use getPlaceholderImage() from src/utils/placeholders.js`);
console.error(`for placeholders — it is an inline data URI and cannot fail.`);
process.exit(1);
