#!/usr/bin/env node
//
// scripts/revoke-license.js
//
// Withdraw a license, or put one back.
//
//   npm run license -- --list
//   npm run license -- --license=LIC-B329B63B331B7FE9 --reason=breach-of-terms --by=percy@...
//   npm run license -- --license=LIC-... --reason=breach-of-terms --by=percy@... --apply
//   npm run license -- --license=LIC-... --reinstate --by=percy@... --apply
//
// WHAT THIS ACTUALLY DOES
// Stops future downloads for that buyer and that item. It is not a kill switch: the
// files are DRM-free and anything already downloaded stays downloaded. What changes
// is that their right to use it ends, so continued use is a breach rather than a
// licensed use -- and the platform stops handing out more copies.
//
// REVOKING AN ALBUM CASCADES to its tracks, because otherwise the buyer just
// downloads the contents one song at a time.
//
// EVERY REVOCATION IS ATTRIBUTED. --by is required. A revocation that may end up in
// front of a lawyer needs to say who decided it and why; "the system did it" is not
// a defence.
//
// Dry run by default. Asserts the project. Reads its writes back.

const path = require('path');
const fs = require('fs');

const { ROOT, loadEnv, initAdmin, assertProject, BATCH_SIZE } = require('./lib/admin');

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valueOf = (name, dflt) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : dflt;
};

const APPLY = has('--apply');
const LIST = has('--list');
const REINSTATE = has('--reinstate');
const LICENCE = valueOf('license', valueOf('license', null));
const PURCHASE_ID = valueOf('purchase', null);
const REASON = valueOf('reason', null);
const BY = valueOf('by', null);
const NOTE = valueOf('note', null);
const EXPECT_PROJECT = valueOf('project', null);




async function main() {
  loadEnv();

  const {
    ALL_REASONS, isRevoked, revocationFields, reinstatementFields, describeRevocation
  } = require(path.join(ROOT, 'src', 'utils', 'licenseRevocation.js'));

  const { admin, projectId } = initAdmin();
  const db = admin.firestore();

  if (EXPECT_PROJECT && projectId !== EXPECT_PROJECT) {
    throw new Error(`REFUSING: --project=${EXPECT_PROJECT} but credentials are for "${projectId}"`);
  }

  // ---- list --------------------------------------------------------------
  if (LIST) {
    const snap = await db.collection('purchases').get();
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    console.log('');
    console.log('  project: ' + projectId);
    console.log('  purchases: ' + rows.length);
    console.log('');
    console.log('  LICENCE ID              STATE      ITEM');
    rows.forEach((r) => {
      console.log('  ' + String(r.licenseId || '(none)').padEnd(24)
        + describeRevocation(r).padEnd(11).slice(0, 11)
        + '  ' + String(r.itemName || r.itemId || '').slice(0, 34)
        + '  [' + (r.itemType || '?') + ']');
    });
    const revoked = rows.filter(isRevoked).length;
    console.log('');
    console.log('  revoked: ' + revoked + ' of ' + rows.length);
    return 0;
  }

  // ---- locate the purchase ------------------------------------------------
  if (!LICENCE && !PURCHASE_ID) {
    console.error('  need --license=LIC-... or --purchase=<docId>, or --list');
    return 2;
  }
  if (!BY) {
    console.error('  --by is required. A revocation nobody signed cannot be defended.');
    return 2;
  }
  if (!REINSTATE && !ALL_REASONS.includes(REASON)) {
    console.error('  --reason must be one of: ' + ALL_REASONS.join(', '));
    return 2;
  }

  let doc;
  if (PURCHASE_ID) {
    const d = await db.collection('purchases').doc(PURCHASE_ID).get();
    if (d.exists) doc = { id: d.id, ...d.data() };
  } else {
    const snap = await db.collection('purchases').where('licenseId', '==', LICENCE).limit(5).get();
    if (!snap.empty) doc = { id: snap.docs[0].id, ...snap.docs[0].data() };
    if (snap.size > 1) console.warn('  WARNING: ' + snap.size + ' purchases share that license id; acting on the first');
  }
  if (!doc) {
    console.error('  no purchase found for ' + (LICENCE || PURCHASE_ID));
    return 1;
  }

  console.log('');
  console.log(APPLY ? 'APPLYING' : 'DRY RUN - nothing will be written');
  console.log('  project   : ' + projectId);
  console.log('  purchase  : ' + doc.id);
  console.log('  license   : ' + (doc.licenseId || '(none)'));
  console.log('  item      : ' + (doc.itemName || doc.itemId) + '  [' + (doc.itemType || '?') + ']');
  console.log('  buyer     : ' + (doc.userId || '(none)') + '  ' + (doc.customerEmail || ''));
  console.log('  paid      : $' + Number(doc.price || 0).toFixed(2) + '   payment status: ' + (doc.status || '?'));
  console.log('  license now: ' + describeRevocation(doc));

  if (doc.itemType === 'album') {
    console.log('');
    console.log('  NOTE: this is an ALBUM license. Revoking it also refuses every track on');
    console.log('        that album, which is the point -- otherwise the buyer takes the');
    console.log('        contents one song at a time.');
  }

  const at = admin.firestore.FieldValue.serverTimestamp();
  const fields = REINSTATE
    ? reinstatementFields({ by: BY, note: NOTE, at })
    : revocationFields({ reason: REASON, by: BY, note: NOTE, at });

  console.log('');
  console.log('  would ' + (REINSTATE ? 'REINSTATE' : 'REVOKE') + ':');
  Object.entries(fields).forEach(([k, v]) => {
    const shown = (v && typeof v === 'object') ? '<server timestamp>' : String(v);
    console.log('    ' + k.padEnd(24) + ' = ' + shown);
  });

  if (!APPLY) {
    console.log('');
    console.log('  Re-run with --apply to write this.');
    return 0;
  }

  await db.collection('purchases').doc(doc.id).update(fields);

  const after = await db.collection('purchases').doc(doc.id).get();
  const now = after.exists ? after.data() : {};
  const expected = !REINSTATE;
  if (isRevoked(now) !== expected) {
    console.error('  VERIFICATION FAILED: licenseRevoked is ' + now.licenseRevoked + ', expected ' + expected);
    return 1;
  }

  console.log('');
  console.log('  verified. license is now: ' + describeRevocation(now));
  console.log('');
  console.log('  Downloads stop immediately. Anything already downloaded stays');
  console.log('  downloaded - the files are DRM-free. What changed is their right.');
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('');
    console.error('  FAILED: ' + err.message);
    process.exit(1);
  });
