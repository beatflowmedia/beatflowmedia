#!/usr/bin/env node
//
// scripts/verify-terms.js
//
// Who is on a superseded version of the terms.
//
//   npm run verify:terms          # summary
//   npm run verify:terms -- --who # list the buyers who need telling
//
// WHY THIS EXISTS
// src/utils/agreements.js says a published version must never be edited in place --
// a new date is added instead. That is correct, and it creates an obligation nobody
// was tracking: the moment a new version is published, every existing buyer is on an
// old one, and a contract changed without telling the other side is a weak contract.
//
// Until now that obligation lived only in a comment. This makes it a number you can
// run, which is the difference between a rule and a hope. Today it reports zero,
// because there is one published version -- and reporting zero is the point: it is
// the baseline that makes the first non-zero mean something.
//
// IT DOES NOT NOTIFY ANYBODY. Detection only. What to send, and whether continued
// use counts as acceptance of new terms, is a decision for a person and probably a
// lawyer; building the sending half before that decision exists would bake in an
// answer nobody chose.
//
// WHY A PURCHASE AND NOT A USER is the unit: acceptance is recorded per purchase,
// because that is what makes it evidence -- this buyer agreed to this text at this
// moment for this item. A user who bought three times under two versions is two
// different agreements, and rolling them into one loses exactly the distinction that
// would matter in a dispute.

const path = require('path');

const { loadEnv, initAdmin, assertProject, args } = require('./lib/admin');
const { AGREEMENT_HISTORY, parseAgreementVersion } = require('../src/utils/agreements');

const { has, value } = args();
const SHOW_WHO = has('--who');
const EXPECT_PROJECT = value('project', null);

async function main() {
  loadEnv();

  const {
    currentAgreementVersion, parseAgreementVersion, agreementLabel,
    DOWNLOAD_LICENSE, CURRENT_VERSIONS
  } = require(path.join(__dirname, '..', 'src', 'utils', 'agreements.js'));

  const { admin, projectId } = initAdmin();
  assertProject(projectId, EXPECT_PROJECT);

  const current = currentAgreementVersion(DOWNLOAD_LICENSE);
  const db = admin.firestore();
  const snap = await db.collection('purchases').get();
  const purchases = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const onCurrent = [];
  const superseded = [];
  const preClickwrap = [];

  purchases.forEach((p) => {
    const accepted = p.acceptedAgreement;
    if (!accepted) { preClickwrap.push(p); return; }
    if (accepted === current) { onCurrent.push(p); return; }
    superseded.push(p);
  });

  console.log('');
  console.log('  project          : ' + projectId);
  console.log('  current version  : ' + current);
  console.log('  published        : ' + Object.entries(CURRENT_VERSIONS)
    .filter(([, v]) => v).map(([k, v]) => k + '@' + v).join(', '));
  console.log('');
  console.log('  purchases            : ' + purchases.length);
  console.log('  on the current terms : ' + onCurrent.length);
  console.log('  on SUPERSEDED terms  : ' + superseded.length + (superseded.length ? '   <- these buyers need telling' : ''));
  console.log('  predate the clickwrap: ' + preClickwrap.length + (preClickwrap.length ? '   <- no acceptance was ever recorded' : ''));

  if (superseded.length) {
    const byVersion = {};
    superseded.forEach((p) => {
      byVersion[p.acceptedAgreement] = (byVersion[p.acceptedAgreement] || 0) + 1;
    });
    console.log('');
    console.log('  superseded versions still in force for somebody:');
    Object.entries(byVersion)
      .sort((a, b) => b[1] - a[1])
      .forEach(([v, n]) => {
        const parsed = parseAgreementVersion(v);
        const label = parsed ? agreementLabel(parsed.agreement) : v;
        console.log('    ' + String(n).padStart(4) + '  ' + v + '   (' + label + ')');
      });
    console.log('');
    console.log('  Those purchases remain governed by the version they accepted.');
    console.log('  Publishing a new version does not retroactively change their deal --');
    console.log('  which is why the old version must stay readable, not be overwritten.');
  }

  if (SHOW_WHO && (superseded.length || preClickwrap.length)) {
    console.log('');
    console.log('  WHO:');
    [...superseded, ...preClickwrap].forEach((p) => {
      const when = p.purchasedAt && p.purchasedAt.toDate
        ? p.purchasedAt.toDate().toISOString().slice(0, 10) : '(no date)';
      console.log('    ' + when
        + '  ' + String(p.customerEmail || p.userId || '(unknown)').slice(0, 34).padEnd(36)
        + (p.acceptedAgreement || '(no acceptance recorded)'));
    });
  } else if (superseded.length || preClickwrap.length) {
    console.log('');
    console.log('  Re-run with --who to list them.');
  }

  if (!superseded.length) {
    console.log('');
    console.log('  Nothing to notify. This stays zero until a new version is published in');
    console.log('  src/utils/agreements.js -- at which point every existing buyer lands here.');
  }

  // --- can every accepted version still be READ? ------------------------------------
  //
  // The stronger obligation, and the one that was silently broken on 2026-10-15.
  // /terms promises that the version recorded against a purchase governs it. That is
  // only keepable while the text of that version still exists somewhere a buyer can
  // reach. Editing Terms.js in place overwrote wording that was, and remains, in force
  // for two purchases -- and the only warning was this script's own sentence about the
  // old version staying readable, which nothing enforced.
  //
  // AGREEMENT_HISTORY is now that somewhere, and /changes renders it. This asserts the
  // two have not come apart: every version any real buyer accepted must be present.
  const accepted = new Set();
  [...superseded, ...onCurrent].forEach((p) => {
    if (p.acceptedAgreement) accepted.add(p.acceptedAgreement);
  });

  const unreadable = [];
  accepted.forEach((identifier) => {
    const parsed = parseAgreementVersion(identifier);
    if (!parsed) { unreadable.push([identifier, 'unparseable identifier']); return; }
    const history = AGREEMENT_HISTORY[parsed.agreement] || [];
    if (!history.some((h) => h.version === parsed.version)) {
      unreadable.push([identifier, 'no entry in AGREEMENT_HISTORY']);
    }
  });

  console.log('');
  console.log('  versions a buyer accepted : ' + accepted.size);
  if (unreadable.length) {
    console.error('  UNREADABLE                : ' + unreadable.length);
    unreadable.forEach(([id, why]) => console.error('      ' + id + '  -- ' + why));
    console.error('');
    console.error('  A buyer holds a license under text nobody can produce. /terms says that');
    console.error('  version governs their purchase, so this is a promise the platform cannot');
    console.error('  currently keep. Add the version to AGREEMENT_HISTORY in');
    console.error('  src/utils/agreements.js, with the summary as it stood at the time.');
  } else {
    console.log('  all readable at /changes  : yes');
  }

  // Non-zero exit when somebody is on superseded terms, so this can gate a release
  // or run in CI. Pre-clickwrap purchases are NOT an error: they are historical and
  // cannot be retrofitted, only noted.
  //
  // An unreadable version is a harder failure than a superseded one: superseded means
  // somebody needs telling, unreadable means we cannot say what they agreed to.
  if (unreadable.length) return 1;
  return superseded.length ? 1 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('');
    console.error('  FAILED: ' + err.message);
    process.exit(2);
  });
