#!/usr/bin/env node
/**
 * verify:price-units — catch a price stored in the wrong unit before it reaches a screen.
 *
 * WHY THIS EXISTS
 * The same concept is stored in two different units across three collections, and
 * nothing in the field names warns a reader:
 *
 *   songs.price            199     CENTS
 *   licenses.pricePaid     199     CENTS
 *   purchases.price        1.99    DOLLARS   (webhook.js divides amount_total by 100)
 *
 * A reader assuming cents renders $1.99 as $199. A reader assuming dollars renders $29
 * as 29c. Found 2026-10-15 while generating a catalogue file for BeatFlow Radio -- the
 * first draft of that file would have published `199` as a dollar price onto a
 * television. It was caught only because someone looked, and the reason it is easy to
 * miss is that every track costs $1.99, so BOTH readings look plausible.
 *
 * This does not change any data. Normalising the collections is a decision about money
 * records with history behind them, and that belongs to the owner, not to a cleanup
 * script. What this does is make the inconsistency VISIBLE and fail loudly if a value
 * appears in a unit its collection does not use.
 *
 * WHAT IT CHECKS
 *   songs.price         must be a positive INTEGER (cents). 1.99 here means someone
 *                       wrote dollars into a cents field -- a 100x UNDERCHARGE.
 *   licenses.pricePaid  same rule.
 *   purchases.price     expected to be dollars. An integer >= 100 here is suspicious:
 *                       it is either a genuine large sale or cents leaking in, and the
 *                       two are indistinguishable without the Stripe record, so it is
 *                       reported rather than failed.
 *
 * Read-only. Safe to run against production, and that is the point.
 */

const { loadEnv, initAdmin } = require('./lib/admin.js');

loadEnv();
const { admin } = initAdmin();
const db = admin.firestore();

const money = (cents) => '$' + (Number(cents) / 100).toFixed(2);

let problems = 0;
const notes = [];

/** A cents field must hold a positive integer. Anything fractional is dollars in disguise. */
async function checkCentsField(collection, field, label) {
  const snap = await db.collection(collection).get();
  const bad = [];
  let checked = 0;

  snap.forEach((doc) => {
    const value = doc.data()[field];
    if (value === undefined || value === null) return;
    checked++;
    const n = Number(value);

    if (!Number.isFinite(n)) {
      bad.push([doc.id, value, 'not a number']);
      return;
    }
    if (!Number.isInteger(n)) {
      // The expensive one: 1.99 in a cents field charges two cents.
      bad.push([doc.id, value, 'FRACTIONAL — dollars written into a cents field (100x undercharge)']);
      return;
    }
    if (n < 0) bad.push([doc.id, value, 'negative']);
  });

  console.log(`  ${label}`);
  console.log(`     checked : ${checked} document(s) with a ${field}`);

  if (bad.length) {
    console.error(`     PROBLEMS: ${bad.length}`);
    bad.slice(0, 10).forEach(([id, v, why]) => {
      console.error(`       ${id}  ${field}=${v}  ${why}`);
    });
    problems += bad.length;
  } else {
    console.log('     all integer, all positive — consistent with CENTS');
  }
  console.log('');
}

/** purchases.price is the odd one out. Report, do not fail: a $199 sale is legal. */
async function reportDollarsField() {
  const snap = await db.collection('purchases').get();
  const suspicious = [];
  let checked = 0;

  snap.forEach((doc) => {
    const p = doc.data();
    if (p.price === undefined || p.price === null) return;
    checked++;
    const n = Number(p.price);
    if (!Number.isFinite(n)) return;
    // A whole number >= 100 in a dollars field is either a large genuine sale or cents
    // that leaked in. Indistinguishable from here, so it is surfaced, not failed.
    if (Number.isInteger(n) && n >= 100) {
      suspicious.push([doc.id, n, p.itemName || '?']);
    }
  });

  console.log('  purchases.price — stored in DOLLARS (the odd one out)');
  console.log(`     checked : ${checked} document(s)`);
  if (suspicious.length) {
    console.log(`     worth a look: ${suspicious.length} whole number(s) >= 100`);
    suspicious.slice(0, 10).forEach(([id, n, name]) => {
      console.log(`       ${id}  price=${n}  (${name}) — $${n}.00, or ${money(n)} if this is really cents?`);
    });
    notes.push(`${suspicious.length} purchase(s) have a whole-number price >= 100; confirm against Stripe.`);
  } else {
    console.log('     nothing ambiguous');
  }
  console.log('');
}

/** The catalogue feed and anything else crossing a boundary must carry explicit units. */
async function checkFeedContract() {
  const fs = require('fs');
  const path = require('path');
  const feed = path.join(__dirname, '..', 'netlify', 'functions', 'catalog-feed.js');
  if (!fs.existsSync(feed)) return;

  const src = fs.readFileSync(feed, 'utf8');
  const required = ['priceCents', 'priceDisplay', 'priceUnits'];
  const missing = required.filter((k) => !src.includes(k));

  console.log('  catalog-feed.js — the boundary where units escape the codebase');
  if (missing.length) {
    console.error(`     MISSING: ${missing.join(', ')}`);
    console.error('     A consumer given a bare `price` will guess, and half the guesses are 100x wrong.');
    problems += missing.length;
  } else {
    console.log('     carries priceCents + priceDisplay + priceUnits — a consumer cannot guess wrong');
  }
  console.log('');
}

(async () => {
  console.log('\nverify:price-units — money is stored in two units; this checks each stays in its own\n');

  await checkCentsField('songs', 'price', 'songs.price — CENTS');
  await checkCentsField('licenses', 'pricePaid', 'licenses.pricePaid — CENTS');
  await reportDollarsField();
  await checkFeedContract();

  if (notes.length) {
    console.log('  Notes:');
    notes.forEach((n) => console.log('    - ' + n));
    console.log('');
  }

  if (problems) {
    console.error(
      `verify:price-units — ${problems} problem(s).\n\n` +
      'A fractional value in a cents field undercharges by 100x; an integer rendered as\n' +
      'dollars overcharges by 100x. Neither throws, and both look plausible when every\n' +
      'price happens to be $1.99. Fix the value, or fix the reader.\n'
    );
    process.exit(1);
  }

  console.log('verify:price-units — every stored price is in the unit its collection uses.\n');
  process.exit(0);
})().catch((err) => {
  console.error('verify:price-units failed to run:', err.message);
  process.exit(1);
});
