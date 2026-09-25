// scripts/lib/admin.js
//
// The boilerplate every admin script needs, once. SINGLE SOURCE.
//
// WHY THIS EXISTS
// Five scripts and one Netlify function each grew their own copy of loadEnv(),
// initAdmin() and unescapePem(). Six copies of the same twenty lines, and each copy
// carried a comment pointing at another copy -- which is duplication with a note
// admitting it. Rule-of-three says extract on the third repeat; this was the sixth.
//
// It is not merely untidy. unescapePem is the function that has ALREADY been written
// wrong once in this codebase: download-master.js shipped `.replace(/\n/g, '\n')`,
// replacing a newline with a newline, and every download returned a 502 for as long
// as that function existed. Six hand-written copies of a function with a one-
// character failure mode is six chances to make the same mistake. One copy, tested,
// is the fix.

const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..', '..');

/**
 * Load .env.local then .env, matching how CRA and Netlify resolve them, so a
 * developer pointing at a scratch project is not silently overridden.
 */
function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    const file = path.join(ROOT, name);
    if (!fs.existsSync(file)) continue;
    try {
      require(path.join(ROOT, 'node_modules', 'dotenv')).config({ path: file });
    } catch {
      // dotenv absent is fine when the vars are already exported.
    }
  }
}

/**
 * Turn an environment-encoded PEM back into a real one.
 *
 * Plain split/join, never a RegExp. `new RegExp("\\" + "n")` compiles to the NEWLINE
 * escape rather than to a literal backslash-n, so it matches nothing in a .env value
 * and hands firebase-admin an unusable key. That surfaces as "Invalid PEM formatted
 * message", which reads like a bad credential and sends you looking in the wrong
 * place. A value that already contains real newlines passes through untouched.
 */
function unescapePem(value) {
  const ESCAPED_NEWLINE = String.fromCharCode(92) + 'n';
  return String(value || '').split(ESCAPED_NEWLINE).join('\n');
}

/**
 * Initialise firebase-admin from whatever credentials are available.
 *
 * Prefers GOOGLE_APPLICATION_CREDENTIALS pointing at the console's own JSON, because
 * that is the format nobody can mis-transcribe. Falls back to the split FIREBASE_*
 * variables, which is what Netlify holds.
 *
 * @param {object} [options]
 * @param {string} [options.storageBucket]
 * @returns {{admin: object, projectId: string, via: string}}
 */
function initAdmin(options = {}) {
  const admin = require(path.join(ROOT, 'node_modules', 'firebase-admin'));

  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyFile && fs.existsSync(keyFile)) {
    const sa = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(sa),
      ...(options.storageBucket ? { storageBucket: options.storageBucket } : {})
    });
    return {
      admin,
      projectId: sa.project_id,
      via: 'GOOGLE_APPLICATION_CREDENTIALS (' + path.basename(keyFile) + ')'
    };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = unescapePem(process.env.FIREBASE_PRIVATE_KEY);

  const missing = [
    !projectId && 'FIREBASE_PROJECT_ID',
    !clientEmail && 'FIREBASE_CLIENT_EMAIL',
    !privateKey && 'FIREBASE_PRIVATE_KEY'
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(
      'missing credentials: ' + missing.join(', ') + '\n' +
      '      Set them in .env, or point GOOGLE_APPLICATION_CREDENTIALS at a service-account JSON.'
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    ...(options.storageBucket ? { storageBucket: options.storageBucket } : {})
  });
  return { admin, projectId, via: '.env (FIREBASE_* vars)' };
}

/**
 * Refuse to act on a project other than the one asked for.
 *
 * A key that works proves only that SOME project accepted it, which is exactly how a
 * repair lands in the wrong environment.
 */
function assertProject(actual, expected) {
  if (expected && actual !== expected) {
    throw new Error('REFUSING: --project=' + expected + ' but credentials are for "' + actual + '"');
  }
}

/** Minimal argv helpers, so five scripts stop each defining their own. */
function args(argv = process.argv.slice(2)) {
  return {
    has: (flag) => argv.includes(flag),
    value: (name, dflt) => {
      const hit = argv.find((a) => a.startsWith('--' + name + '='));
      return hit ? hit.slice(name.length + 3) : dflt;
    }
  };
}

/** Firestore caps a batch at 500. 400 leaves room and keeps a failure attributable. */
const BATCH_SIZE = 400;

module.exports = { ROOT, loadEnv, unescapePem, initAdmin, assertProject, args, BATCH_SIZE };
