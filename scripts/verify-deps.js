#!/usr/bin/env node
//
// scripts/verify-deps.js
//
//   npm run verify:deps
//
// TWO QUESTIONS NOBODY WAS ASKING, both of which have already cost real time.
//
//   1. Does every bare `require()` in our own source actually RESOLVE?
//   2. Do the satellite package.json files agree with the root?
//
// WHY #1 EXISTS — IT CAUGHT ME REMOVING A PACKAGE IN USE
// Eight dependencies were removed as "unreferenced" after grepping src/, scripts/,
// netlify/, config/ and e2e/. That list looked exhaustive and was not: the repo also has
// agents/, api/, frontend/, middleware/, services/ and functions/. Four of the eight --
// commander, esprima, fluent-ffmpeg, music-metadata -- are required by agents/, and the
// removal broke `agents/cli.js`, which the PRE-COMMIT HOOK runs.
//
// The hook caught it, which is the system working. But it caught it at commit time with
// a stack trace, and only because that one directory happened to be on the hook's path.
// Nothing would have caught a removal in api/ or services/.
//
// So this does not grep for names. It walks every source file, extracts every bare
// specifier, and asks Node to RESOLVE it. A package that is required and not installed
// fails here, whatever directory it hides in and whatever the manifests claim.
//
// WHY #2 EXISTS — MANIFESTS THAT ARE READ BY NOBODY
// Three package.json files describe dependencies for code in their directory, and none
// of them has a node_modules beside it, so every require resolves from the ROOT install
// instead. They are documentation that nothing enforces, and they were already wrong:
//
//   netlify/functions/package.json   firebase-admin ^12.0.0   root: ^13.4.0   installed: 13.10.0
//   agents/package.json              declares commander + esprima, but the code there
//                                    also requires music-metadata and fluent-ffmpeg
//
// A declaration that is both authoritative-looking and inert is the worst shape a config
// value can have. This makes the disagreement visible rather than deleting files whose
// role in the Netlify build cannot be verified from here.

const fs = require('fs');
const path = require('path');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');

// Directories holding OUR source. Everything else is generated, vendored or archived.
const SOURCE_DIRS = [
  'src', 'scripts', 'netlify', 'agents', 'api', 'services',
  'middleware', 'config', 'e2e', 'test'
];

// Archived or generated trees. Their requires are not our contract.
const SKIP_DIRS = new Set([
  'node_modules', 'build', 'coverage', '__snapshots__', 'dist',
  'backup_before_cleanup', 'temp-check', 'test-results'
]);

const SATELLITE_MANIFESTS = [
  'netlify/functions/package.json',
  'agents/package.json'
  // `functions/` is the legacy Firebase Functions directory and HAS its own
  // node_modules, so it genuinely resolves on its own. netlify.toml points at
  // netlify/functions, so it is not deployed either. Deliberately not checked:
  // holding a self-contained, undeployed directory to the root's contract is noise,
  // and noise is how a reconciler earns its removal.
];

// THE RATCHET.
//
// These imports do not resolve TODAY and did not resolve before this check existed. The
// build is green, which means webpack never reaches these files -- they are dead paths,
// half-finished features and agent templates. Fixing them is real work and it is not this
// script's job.
//
// What IS this script's job is making sure the list does not GROW. A new unresolved
// import means someone removed a package something uses, or imported one they forgot to
// install, and both are caught the moment it happens rather than at the next deploy.
//
// Shrink this list by deleting the dead file or installing the package. Never add to it
// to make a commit pass -- that is the suppression this whole file argues against.
const KNOWN_UNRESOLVED = new Set([
  // Dead or unreachable app code. Present before 2026-10-18.
  '@hello-pangea/dnd',      // src/components/QueuePanel.js — queue UI, not routed
  'chart.js',               // src/components/analytics/PerformanceMonitor.js
  'react-chartjs-2',        // PerformanceMonitor.js + pages/AnalyticsDashboard.js
  'helmet',                 // src/middleware/securityMiddleware.js — express middleware in a CRA app
  'lodash-es',              // src/design/performance.ts — the design system nothing imports
  'sentry-sdk',             // services/*/monitoring.js — a PYTHON package name in JS files

  // agents/ — a code-generation toolkit whose templates import what the GENERATED
  // project would need, not what this one has.
  '@tanstack/react-query',
  'jest-axe',
  'prettier',
  'react-beautiful-dnd',
  'react-helmet',

  // scripts/ — one-off tooling
  'xml2js'                  // scripts/crawlSupport.js
]);

function sourceFiles(dir, acc = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return acc; }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, acc);
    else if (/\.(jsx?|mjs|cjs|tsx?)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

/** Remove comments and strings-that-are-whole-lines so documentation is not read as code. */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Bare package specifiers only: './x' and '/x' are relative, 'node:x' is built in. */
function bareSpecifiers(text) {
  const out = new Set();
  const patterns = [
    /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bfrom\s+['"]([^'"]+)['"]/g,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(text)) !== null) {
      const spec = m[1];
      if (!spec || spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('node:')) continue;
      if (/^[a-zA-Z]:[\\/]/.test(spec)) continue;   // windows absolute path
      if (spec.includes('${')) continue;             // inside a generated-code template
      if (/[+()]/.test(spec)) continue;              // string concatenation inside a template
      if (spec.startsWith('@/')) continue;           // a path ALIAS, resolved by the bundler
      if (/^https?:/.test(spec)) continue;           // URL import
      // KEPT WHOLE, not reduced to the package name. `firebase` has no root export --
      // only subpaths like firebase/app and firebase/firestore -- so reducing
      // 'firebase/firestore' to 'firebase' and resolving THAT reported 99 files as
      // broken when every one of them was fine. Resolve exactly what the code asks for.
      out.add(spec);
    }
  }
  return out;
}

function resolves(spec, fromFile) {
  if (Module.builtinModules.includes(spec)) return true;
  try {
    Module.createRequire(fromFile).resolve(spec);
    return true;
  } catch (err) {
    return false;
  }
}

(function main() {
  console.log('\nverify:deps — does every require resolve, and do the manifests agree?\n');

  // ---- 1. every bare specifier resolves -------------------------------------------
  const missing = new Map(); // spec -> Set(files)
  let scanned = 0;

  for (const dir of SOURCE_DIRS) {
    for (const file of sourceFiles(path.join(ROOT, dir))) {
      scanned += 1;
      const text = stripComments(fs.readFileSync(file, 'utf8'));
      for (const spec of bareSpecifiers(text)) {
        if (resolves(spec, file)) continue;
        if (!missing.has(spec)) missing.set(spec, new Set());
        missing.get(spec).add(path.relative(ROOT, file));
      }
    }
  }

  const unexpected = [...missing].filter(([spec]) => !KNOWN_UNRESOLVED.has(spec));
  const healed = [...KNOWN_UNRESOLVED].filter((spec) => !missing.has(spec));

  console.log('  REQUIRES THAT DO NOT RESOLVE   (' + scanned + ' source files scanned)');
  if (!unexpected.length) {
    console.log('     none that are new — ' + (missing.size) + ' known, see KNOWN_UNRESOLVED');
  } else {
    console.log('     NEW, and these are the ones that matter:');
    for (const [spec, files] of unexpected.sort()) {
      console.log('       ' + spec);
      [...files].slice(0, 4).forEach((f) => console.log('          ' + f));
      if (files.size > 4) console.log('          … and ' + (files.size - 4) + ' more');
    }
  }
  if (healed.length) {
    console.log('');
    console.log('     RESOLVES NOW — remove from KNOWN_UNRESOLVED so the ratchet tightens:');
    healed.forEach((s2) => console.log('       ' + s2));
  }

  // ---- 2. satellite manifests agree with the root ----------------------------------
  const root = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const rootDeps = Object.assign({}, root.dependencies, root.devDependencies);

  console.log('');
  console.log('  SATELLITE MANIFESTS vs THE ROOT');
  let disagreements = 0;

  for (const rel of SATELLITE_MANIFESTS) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) { console.log('     ' + rel + ' — absent'); continue; }
    const pkg = JSON.parse(fs.readFileSync(full, 'utf8'));
    const deps = pkg.dependencies || {};
    const hasOwnModules = fs.existsSync(path.join(path.dirname(full), 'node_modules'));

    console.log('     ' + rel + (hasOwnModules ? '  (has its own node_modules)' : '  (resolves from the ROOT)'));

    for (const [name, range] of Object.entries(deps)) {
      const rootRange = rootDeps[name];
      if (!rootRange && Module.builtinModules.includes(name)) {
        // A manifest declaring `events` is asking for the npm POLYFILL of a Node
        // builtin, for bundling. `require('events')` resolves natively either way, so
        // the root not carrying it is correct, not a disagreement. Reporting it would
        // be a permanent red line with no action behind it.
        console.log('        ok       ' + name + ' ' + range + '  (polyfill for a Node builtin)');
      } else if (!rootRange) {
        console.log('        MISSING  ' + name + ' ' + range + '  — not in the root at all');
        disagreements += 1;
      } else if (rootRange !== range) {
        console.log('        DIFFERS  ' + name + '  here: ' + range + '   root: ' + rootRange);
        disagreements += 1;
      } else {
        console.log('        ok       ' + name + ' ' + range);
      }
    }
  }

  console.log('');
  const failed = unexpected.length > 0;
  if (failed) {
    console.log('  ' + unexpected.length + ' NEW package(s) imported but not installed. Install them,');
    console.log('  or remove the import. This is the check that catches a dependency');
    console.log('  removed as "unused" by a search that missed a directory.\n');
    process.exit(1);
  }
  if (disagreements) {
    // NOT fatal, and that is deliberate. These manifests are inert -- nothing reads them
    // at build time -- so a mismatch is a documentation defect, not a broken build. Made
    // fatal it would block every commit until someone deletes the check.
    console.log('  Every require resolves. ' + disagreements + ' manifest disagreement(s) above');
    console.log('  are documentation defects, not build failures — see the ledger.\n');
    process.exit(0);
  }
  console.log('  Every require resolves and every manifest agrees.\n');
  process.exit(0);
})();
