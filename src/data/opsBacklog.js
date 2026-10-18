// src/data/opsBacklog.js
//
// PERCY'S OWN TO-DOS. The things no agent and no fixer can do for him.
//
// WHY THIS FILE EXISTS
// Every one of these is currently recorded as a sentence inside a 4,000-line CLAUDE.md,
// under a heading like "Still open". That is a fine place to EXPLAIN something and a
// useless place to TRACK it: nothing surfaces it, nothing counts it, and the only way
// to find out what is outstanding is to read the whole ledger looking for the word
// "open". Three of these have been outstanding for days for exactly that reason.
//
// SEEDED IN CODE RATHER THAN WRITTEN STRAIGHT TO FIRESTORE, deliberately. A seed in the
// repository is reviewable in a pull request, survives a database being reset, and
// carries its reasoning in a comment. Firestore holds the STATUS -- done, declined,
// still open -- because that is what changes. The text is editorial and belongs with
// the code that explains it.
//
// The merge rule is in opsStore.js: these supply the text, Firestore supplies the
// state, and a seed that has been resolved stays resolved. Deleting a line here does
// NOT resurrect it.
//
// NONE OF THESE ARE CODE. If something here turns out to be code, it should be filed as
// an incident against an area instead, and this line deleted -- a to-do that an agent
// could have done is a to-do that should not have been Percy's.

const BACKLOG = [
  {
    id: '2026-10-18-legal-lawyer-review-three-licences',
    area: 'legal',
    severity: 'high',
    title: 'Get three published licences reviewed by a lawyer',
    what:
      'Three licences are live and selling, and no lawyer has read any of them: the ' +
      'download licence, the subscription sync licence, and the one-off commercial ' +
      'licence published on 2026-10-17. Each was written to describe exactly what the ' +
      'software does, which is the part that can be verified. Whether any of it is ' +
      'enforceable has not been assessed by anyone qualified.',
    where: [
      'docs/sync-license-draft.md',
      'docs/commercial-license-draft.md',
      'src/pages/Terms.js'
    ],
    // The specific questions are already written down, so a review is a reading task
    // rather than a drafting one. That matters for what it costs.
    note:
      'The drafts carry the questions for a reviewer: 6 for the sync licence, 7 for the ' +
      'commercial one. The sharpest are whether "permanent" needs qualifying when a ' +
      'payment reversal ends a licence, and whether permitting client delivery without ' +
      'licensing the end client holds up.',
    forLawyer: true,
    effort: 'days'
  },
  {
    id: '2026-10-18-checkout-subscription-price-24-to-12',
    area: 'checkout',
    severity: 'medium',
    title: 'Change the Creator subscription price from $24 to $12 in Stripe',
    what:
      'The decision was made to move the Creator tier to $12/month. A Stripe Price ' +
      'object cannot be edited, so a new one has to be created in the Dashboard and the ' +
      'id swapped in. Until then the site advertises one number and Stripe charges the ' +
      'other, which is the same class of fault as the collection price mismatch.',
    where: ['src/data/pricingPlans.js'],
    note: 'Dashboard task: create the new Price, then tell Claude the id to wire in.',
    effort: 'hours'
  },
  {
    id: '2026-10-18-catalogue-run-collections-backfill',
    area: 'catalogue',
    severity: 'low',
    title: 'Run the collections backfill so verify:collections goes green',
    what:
      'The collection "game-show-walk-on" stores trackCount 27 while 30 songs carry its ' +
      'id. NOT load-bearing -- checkout prices from the songs query and never trusts ' +
      'the stored field -- but the reconciler stays red until it is run, and a check ' +
      'that is permanently red is a check people learn to ignore.',
    where: ['scripts/backfill-collections.js'],
    note: 'npm run backfill:collections -- --apply   (idempotent; re-derives from the songs)',
    effort: 'hours'
  },
  {
    id: '2026-10-18-quality-who-locked-production',
    area: 'quality',
    severity: 'medium',
    title: 'Find out who locked the production deploy on 2026-10-15',
    what:
      'Production was pinned to an old build at 08:09Z on 2026-10-15, which is why a ' +
      'deploy appeared to succeed while the site did not change. Publishing an old ' +
      'deploy from the Netlify UI locks the site. It is unlocked now, but nobody knows ' +
      'who did it, so nothing stops it happening again.',
    where: ['scripts/verify-published.js'],
    note: 'Netlify dashboard: Deploys, check the activity log around that timestamp.',
    effort: 'hours'
  },
  {
    id: '2026-10-18-fulfilment-confirm-stripe-webhook-endpoint',
    area: 'fulfilment',
    severity: 'high',
    title: 'Confirm which webhook URL Stripe actually posts to',
    what:
      'Two near-identical handlers exist -- netlify/functions/webhook.js and ' +
      'stripe-webhook.js -- and which one Stripe calls is set in the Stripe Dashboard, ' +
      'not in this repository. It cannot be read from here: listing endpoints with the ' +
      'test key returns none, and listing the live ones needs the live key. Until it is ' +
      'confirmed, every change to purchase recording has to be made twice.',
    where: [
      'netlify/functions/webhook.js',
      'netlify/functions/stripe-webhook.js'
    ],
    note: 'Stripe Dashboard: Developers, Webhooks. Note the exact URL and tell Claude.',
    effort: 'hours'
  },
  {
    id: '2026-10-18-fulfilment-migrate-firebase-admin-modular',
    area: 'fulfilment',
    severity: 'medium',
    title: 'Decide whether to migrate the functions to the modular firebase-admin API',
    what:
      'firebase-admin stays on 13.x because v14 removes the namespace every function ' +
      'uses, and installing it breaks checkout and the payment webhook at module load. ' +
      'Two high advisories sit on the function runtime and cannot be cleared without ' +
      'either this migration or an overrides pin. The migration touches the payment ' +
      'path, so it is a decision about appetite, not a task to slot in.',
    where: ['netlify/functions/lib/admin-api.test.js'],
    note:
      'Guarded either way: npm run test:lib fails if the API the functions call ever ' +
      'stops existing. No urgency, but it does not get smaller.',
    effort: 'days'
  }
];

module.exports = { BACKLOG };
