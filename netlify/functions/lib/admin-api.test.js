#!/usr/bin/env node
// netlify/functions/lib/admin-api.test.js
//
// THE firebase-admin API THE DEPLOYED FUNCTIONS ACTUALLY CALL.
//
// WHY THIS EXISTS — `npm audit` RECOMMENDED AN UPGRADE THAT BREAKS CHECKOUT
//
// On 2026-10-18 `npm audit` reported firebase-admin advisories with
// `fixAvailable: { name: 'firebase-admin', version: '14.5.0' }`. Taking that at face
// value installs a version whose ROOT EXPORT NO LONGER HAS THE LEGACY NAMESPACE:
//
//     v13   require('firebase-admin')  ->  { apps, credential, firestore, auth, storage, … }
//     v14   require('firebase-admin')  ->  { initializeApp, cert, getApps, … }   // app module ONLY
//
// Every function in this directory opens with
//
//     admin.initializeApp({ credential: admin.credential.cert({ … }) })
//
// so on v14 `admin.credential` is undefined and the function throws AT MODULE LOAD.
// Not on an edge case -- on every invocation, including stripe-webhook, which is the
// one that runs at the moment a buyer pays. The failure would have been: checkout
// succeeds, Stripe charges the card, the webhook 500s, no purchase is recorded, and
// the buyer has paid for a licence that does not exist.
//
// That is the exact shape of the "theatre" failure that dependency hygiene is supposed
// to prevent: run the recommended fix, ship it, break the thing that takes money.
//
// SO THIS ASSERTS THE SURFACE RATHER THAN THE VERSION. Pinning a version number would
// say "do not upgrade", which is the wrong lesson and ages badly. This says "whatever
// version you install, these calls must still exist" -- which an upgrade is free to
// satisfy, and a migration to the modular API (firebase-admin/app, /firestore, /auth,
// /storage) would satisfy by making this file's list shrink to nothing.
//
// MIGRATING IS THE REAL FIX and is deliberately not done here. It touches every
// function including the payment path, so it is its own piece of work with its own
// testing. Until then, firebase-admin stays on 13.x and this is the tripwire.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Read rather than require: firebase-admin's `exports` map does not expose
// './package.json', so require('firebase-admin/package.json') throws
// ERR_PACKAGE_PATH_NOT_EXPORTED. Found by running this file, which is the point.
function installedVersion() {
  try {
    const p = path.join(__dirname, '..', '..', '..', 'node_modules', 'firebase-admin', 'package.json');
    return JSON.parse(fs.readFileSync(p, 'utf8')).version;
  } catch (err) {
    return 'unknown';
  }
}

let passed = 0;
const failures = [];
function check(label, fn) {
  try {
    fn();
    passed += 1;
    console.log('  ok   ' + label);
  } catch (err) {
    failures.push(label + '\n         ' + err.message);
    console.log('  FAIL ' + label + '\n         ' + err.message);
  }
}

console.log('\nfirebase-admin — the API the deployed functions call\n');
console.log('  installed: ' + installedVersion() + '\n');

// --- initialisation, in every function's first ten lines --------------------------

check('admin.apps is an array (the "already initialised?" guard)', () => {
  // `if (!admin.apps.length) admin.initializeApp(...)`. On v14 this is undefined and
  // throws reading .length before any credential work happens.
  assert.ok(Array.isArray(admin.apps), 'admin.apps is not an array');
});

check('admin.initializeApp is callable', () => {
  assert.strictEqual(typeof admin.initializeApp, 'function');
});

check('admin.credential.cert is callable', () => {
  // THE ONE THAT BREAKS FIRST on v14. Every function builds its credential this way
  // from FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY.
  assert.ok(admin.credential, 'admin.credential is undefined');
  assert.strictEqual(typeof admin.credential.cert, 'function');
});

// --- Firestore: reads and writes on every purchase path ---------------------------

check('admin.firestore() returns a database handle', () => {
  assert.strictEqual(typeof admin.firestore, 'function');
});

check('admin.firestore.FieldValue.serverTimestamp exists', () => {
  // Stamps purchasedAt / createdAt on every purchase and licence row. A client clock
  // on a record that may be disputed is worth nothing, so this is not optional.
  assert.strictEqual(typeof admin.firestore.FieldValue.serverTimestamp, 'function');
});

check('admin.firestore.FieldValue.arrayUnion exists', () => {
  // users/{id}.purchasedItems
  assert.strictEqual(typeof admin.firestore.FieldValue.arrayUnion, 'function');
});

check('admin.firestore.FieldValue.increment exists', () => {
  assert.strictEqual(typeof admin.firestore.FieldValue.increment, 'function');
});

check('admin.firestore.Timestamp.fromDate exists', () => {
  // Subscription period ends.
  assert.strictEqual(typeof admin.firestore.Timestamp.fromDate, 'function');
});

// --- auth: the gate in front of every paid action ---------------------------------

check('admin.auth() is callable', () => {
  // require-auth.js verifies the caller's ID token with this. Without it,
  // create-checkout cannot tell who is buying, and the acceptance record this
  // platform depends on would name nobody.
  assert.strictEqual(typeof admin.auth, 'function');
});

// --- storage: master delivery -----------------------------------------------------

check('admin.storage() is callable', () => {
  assert.strictEqual(typeof admin.storage, 'function');
});

console.log('');
if (failures.length) {
  console.error(failures.length + ' FAILURE(S):\n  ' + failures.join('\n  ') + '\n');
  console.error('  firebase-admin no longer exposes the API these functions call.');
  console.error('  If this followed an upgrade, the upgrade BREAKS CHECKOUT AND THE');
  console.error('  PAYMENT WEBHOOK at module load. Either revert it, or migrate every');
  console.error('  function to the modular API (firebase-admin/app, /firestore, /auth,');
  console.error('  /storage) and shrink the list above.\n');
  process.exit(1);
}
console.log('  ' + passed + ' checks passed\n');
process.exit(0);
