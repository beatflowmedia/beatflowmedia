#!/usr/bin/env node
//
// scripts/verify-vulnerable-surface.js
//
//   npm run verify:vulns
//
// WHICH ADVISORIES ACTUALLY REACH SHIPPED CODE, and which are build tooling.
//
// WHY THIS EXISTS
// GitHub reported 396 vulnerabilities on the default branch (11 critical, 182 high) and
// `npm audit` reports 185. Neither number is actionable, because neither distinguishes a
// flaw in the webpack dev server -- which runs on a laptop and is never deployed -- from
// a flaw in the gRPC stack that firebase-admin uses inside a payment webhook. Treating
// them as one number produces two failures and both are common:
//
//   paralysis   396 is too many to act on, so nothing is acted on
//   theatre     `npm audit fix --force` is run, something breaks, and the next person
//               learns that security work breaks builds
//
// `npm audit --omit=dev` is NOT the instrument either, and finding that out is the
// reason this file exists. CRA puts `react-scripts` in `dependencies`, so npm counts
// webpack-dev-server, jest, eslint and svgo as production -- 119 of the 185. That is a
// packaging artefact, not a risk assessment.
//
// WHAT SHIPS, EXACTLY TWO SURFACES
//
//   FUNCTIONS   code in netlify/functions runs on Netlify's servers with the Stripe
//               secret key and Firebase Admin credentials. The highest-value target
//               here by a wide margin: a flaw reachable from this surface is reachable
//               by anyone who can make the site call a function.
//
//   BUNDLE      code reachable from src/ is compiled into build/ and runs in the
//               buyer's browser. Lower value than the functions, but it is the surface
//               a visitor touches without being asked.
//
// Everything else -- the build toolchain, the test runners, the CLIs -- runs on a
// developer machine from source the developer already trusts. Those advisories are real
// and they are not urgent, and saying so out loud is the point: an unexplained decline
// reads as an oversight and gets "fixed" by the next person with --force.
//
// THE TREE IS GROUND TRUTH, NOT THE ADVISORY GRAPH. An earlier version of this walked
// `effects` out of `npm audit --json` and concluded 6 advisories reached the functions.
// The real answer is larger: `effects` describes which packages an advisory invalidates,
// which is not the same as which top-level package pulls it in. protobufjs (critical)
// did not appear, and it reaches firebase-admin through
// @google-cloud/firestore -> google-gax -> @grpc/grpc-js -> @grpc/proto-loader. So this
// resolves every path from `npm ls --all` instead.

const { execFileSync } = require('child_process');

// What the deployed functions require. Derived rather than listed would be better, but
// the require() set is small, stable, and a wrong entry here fails LOUD (an unknown root
// is reported), not silent.
const FUNCTION_RUNTIME = ['firebase-admin', 'stripe', 'pdf-lib', 'qrcode'];

const SEVERITY_ORDER = { critical: 0, high: 1, moderate: 2, low: 3, info: 4 };

function run(args) {
  try {
    return execFileSync('npm', args, {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      shell: true,
      // `npm ls` prints ELSPROBLEMS for every unmet peer dependency, which is a wall of
      // red above a report that is working fine. The JSON on stdout is complete either
      // way; the warnings belong to a different problem than this script's.
      stdio: ['ignore', 'pipe', 'ignore']
    });
  } catch (err) {
    // `npm audit` exits non-zero when it finds anything, and `npm ls` exits non-zero on
    // any peer-dep complaint. Both still print valid JSON on stdout.
    if (err.stdout) return err.stdout;
    throw err;
  }
}

/**
 * Every top-level dependency that pulls `target` in, anywhere in the tree.
 *
 * Walks the whole production tree once per call rather than building an index, because
 * the tree is ~800KB and there are ~100 advisories -- fast enough that an index would be
 * optimising without a measurement, which is the thing this file is about.
 */
function topLevelRootsOf(tree, target) {
  const roots = new Set();

  const walk = (node, rootName, depth) => {
    const deps = node.dependencies || {};
    for (const [name, child] of Object.entries(deps)) {
      const asRoot = depth === 0 ? name : rootName;
      if (name === target) roots.add(asRoot);
      if (child && child.dependencies) walk(child, asRoot, depth + 1);
    }
  };

  walk(tree, null, 0);
  return roots;
}

(function main() {
  const audit = JSON.parse(run(['audit', '--json']));
  const tree = JSON.parse(run(['ls', '--omit=dev', '--all', '--json']));

  const vulns = audit.vulnerabilities || {};
  const counts = (audit.metadata && audit.metadata.vulnerabilities) || {};

  const shipped = [];
  const toolingOnly = [];
  const absentFromProd = [];

  for (const [name, info] of Object.entries(vulns)) {
    const roots = topLevelRootsOf(tree, name);

    if (roots.size === 0) {
      // Not in the production tree at all -- a devDependency, pure build/test tooling.
      absentFromProd.push({ name, severity: info.severity });
      continue;
    }

    const viaFunctions = [...roots].filter((r) => FUNCTION_RUNTIME.includes(r));
    // `react-scripts` in the prod tree is the CRA packaging artefact described above.
    // Anything reaching prod ONLY through it is build tooling wearing a production label.
    const realRoots = [...roots].filter((r) => r !== 'react-scripts');

    if (viaFunctions.length) {
      shipped.push({ name, severity: info.severity, surface: 'FUNCTIONS', roots: viaFunctions, fix: info.fixAvailable });
    } else if (realRoots.length) {
      shipped.push({ name, severity: info.severity, surface: 'bundle?', roots: realRoots, fix: info.fixAvailable });
    } else {
      toolingOnly.push({ name, severity: info.severity });
    }
  }

  const bySeverity = (a, b) =>
    (SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]) || a.name.localeCompare(b.name);

  console.log('\nverify:vulns — which advisories reach code that actually ships\n');
  console.log('  npm audit total : ' + (counts.total || 0) +
    '  (critical ' + (counts.critical || 0) + ', high ' + (counts.high || 0) +
    ', moderate ' + (counts.moderate || 0) + ', low ' + (counts.low || 0) + ')');
  console.log('');

  const fns = shipped.filter((s) => s.surface === 'FUNCTIONS').sort(bySeverity);
  const bundle = shipped.filter((s) => s.surface !== 'FUNCTIONS').sort(bySeverity);

  console.log('  REACHES THE DEPLOYED FUNCTIONS — Stripe secret + Firebase Admin live here');
  if (!fns.length) console.log('     none');
  fns.forEach((s) => {
    console.log('     ' + pad(s.severity, 9) + pad(s.name, 24) + ' via ' + s.roots.join(',') +
      (s.fix === true ? '   (fix available)' : ''));
  });

  console.log('');
  console.log('  REACHES THE BROWSER BUNDLE (if the module is actually imported)');
  if (!bundle.length) console.log('     none');
  bundle.forEach((s) => {
    console.log('     ' + pad(s.severity, 9) + pad(s.name, 24) + ' via ' + s.roots.join(','));
  });

  console.log('');
  console.log('  BUILD/TEST TOOLING ONLY — runs on a developer machine, never deployed');
  console.log('     ' + (toolingOnly.length + absentFromProd.length) + ' advisories' +
    '  (' + toolingOnly.length + ' via react-scripts, ' + absentFromProd.length + ' devDependencies)');

  console.log('');
  console.log('  shipped surface total : ' + shipped.length +
    '   of ' + Object.keys(vulns).length + ' advisories');
  console.log('');

  // EXITS NON-ZERO ONLY ON THE SURFACE THAT MATTERS. A reconciler that fails on build
  // tooling would be red permanently and get removed, which is how a ratchet dies. This
  // one goes red when a HIGH or CRITICAL becomes reachable from the functions.
  const blocking = fns.filter((s) => s.severity === 'critical' || s.severity === 'high');
  if (blocking.length) {
    console.log('  ' + blocking.length + ' HIGH/CRITICAL advisory(ies) reach the deployed functions.');
    console.log('  See the vulnerability ledger in CLAUDE.md before suppressing any of them.\n');
    process.exit(1);
  }
  console.log('  No high or critical advisory reaches the deployed functions.\n');
  process.exit(0);
})();

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s + ' ' : s + ' '.repeat(n - s.length);
}
