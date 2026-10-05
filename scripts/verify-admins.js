// scripts/verify-admins.js
//
// Reconcile the admin list that firestore.rules carries against the canonical one in
// src/utils/platformAdmins.js.
//
// firestore.rules cannot import JavaScript, so its copy of the admin addresses is a
// genuine second copy. A copy with a reconciler is a copy; a copy with a promise to
// remember is a second source of truth. This is that reconciler.
//
// It also fails on the trap that made the list worth centralising in the first place:
// firestore.rules guards submissions with `request.auth.token.admin == true`, and
// `setCustomUserClaims` is called nowhere in this repo. That rule does not grant narrow
// access -- it grants none to everybody, which is why approve-submission.js existed as
// an unauthenticated Netlify function using the admin SDK. If someone adds another
// token.admin rule without ever granting the claim, this says so.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RULES = path.join(ROOT, 'firestore.rules');

const { PLATFORM_ADMIN_EMAILS } = require(path.join(ROOT, 'src/utils/platformAdmins.js'));

const failures = [];

const rules = fs.readFileSync(RULES, 'utf8');

// --- 1. every canonical address appears in the rules ------------------------------
const canonical = PLATFORM_ADMIN_EMAILS.map((e) => e.toLowerCase());
const missing = canonical.filter((e) => !rules.toLowerCase().includes(e));
if (missing.length) {
  failures.push(
    'firestore.rules is missing ' + missing.length + ' canonical admin address(es):\n' +
    missing.map((e) => '      ' + e).join('\n') +
    '\n      Add them to isPlatformAdmin() in firestore.rules.'
  );
}

// --- 2. the rules grant admin to nobody the canonical list does not ---------------
// Any quoted email in firestore.rules that is not canonical is an admin this repo
// does not know about -- the exact drift this script exists to catch.
const quoted = [...rules.matchAll(/['"]([^'"\s]+@[^'"\s]+)['"]/g)].map((m) => m[1].toLowerCase());
const extra = [...new Set(quoted)].filter((e) => !canonical.includes(e));
if (extra.length) {
  failures.push(
    'firestore.rules grants admin to ' + extra.length + ' address(es) not in platformAdmins.js:\n' +
    extra.map((e) => '      ' + e).join('\n') +
    '\n      Either add them to src/utils/platformAdmins.js or remove them from the rules.'
  );
}

// --- 3. no rule depends on a custom claim that is never granted -------------------
const claimRules = rules
  .split(/\r?\n/)
  .map((line, i) => ({ line: line.trim(), n: i + 1 }))
  .filter(({ line }) => /token\.admin/.test(line) && !/^\/\//.test(line));

if (claimRules.length) {
  // Scanned here rather than trusted: if someone adds a script that grants the claim,
  // these rules become legitimate and this check should stop failing on its own.
  const SKIP = /node_modules|[\\/]build|\.git|build\.stale|build_devbak/;

  // Two guards, both learned the hard way. This file names setCustomUserClaims in its
  // own source, so without the self-exclusion the scan finds itself and the check
  // passes on a repo that grants the claim nowhere -- which is exactly what it did on
  // the first run. And a bare substring match counts a mention in a comment as a
  // grant, so the pattern requires a call.
  const SELF = path.resolve(__filename);
  const GRANT = /setCustomUserClaims\s*\(/;

  let grantsClaim = false;
  ['src', 'scripts', 'netlify', 'functions'].forEach((dir) => {
    const base = path.join(ROOT, dir);
    if (!fs.existsSync(base) || grantsClaim) return;
    (function walk(d) {
      if (grantsClaim) return;
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const f = path.join(d, e.name);
        if (SKIP.test(f)) continue;
        if (e.isDirectory()) walk(f);
        else if (/\.(js|jsx|ts|tsx|mjs|cjs)$/.test(e.name)) {
          if (path.resolve(f) === SELF) continue;
          if (GRANT.test(fs.readFileSync(f, 'utf8'))) { grantsClaim = true; return; }
        }
      }
    })(base);
  });

  if (!grantsClaim) {
    failures.push(
      claimRules.length + ' firestore.rules line(s) require `token.admin`, but ' +
      'setCustomUserClaims is called nowhere in this repo,\n' +
      '      so that claim is never true for anybody. These rules grant access to NO ONE:\n' +
      claimRules.map(({ line, n }) => '      firestore.rules:' + n + '  ' + line.slice(0, 80)).join('\n') +
      '\n      Either grant the claim, or change the rule to isPlatformAdmin().'
    );
  }
}

console.log('canonical admins     : ' + canonical.length + ' (src/utils/platformAdmins.js)');
console.log('emails in rules      : ' + [...new Set(quoted)].length);
console.log('token.admin rules    : ' + claimRules.length);
console.log('');

if (failures.length) {
  failures.forEach((f) => console.log('  ' + f + '\n'));
  console.error(failures.length + ' admin-list problem(s).');
  process.exit(1);
}

console.log('firestore.rules agrees with src/utils/platformAdmins.js.');
process.exit(0);
