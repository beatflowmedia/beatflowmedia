// src/data/sponsorshipTiers.js
//
// The single source of truth for BeatFlow Radio sponsorship packages.
//
// WHY THESE SELL AIRINGS AND NOT AUDIENCE
// ---------------------------------------
// BeatFlow Radio measures nothing about its listeners. No concurrent count, no
// sessions, no tune-ins. The sponsor-card beacon exists in code but points at null,
// so no view or click is ever transmitted, and there is no collector to receive one.
//
// That rules out selling IMPRESSIONS, which is what a sponsor normally buys: an
// impression is airings x listeners, and we know the first exactly and the second not
// at all. Selling impressions today would mean invoicing against a number we cannot
// produce, and the first advertiser to ask "how many people heard it?" would be owed
// a refund.
//
// But AIRINGS are exactly computable, with no logging at all. The station's schedule
// is a pure function of the wall clock -- every listener hears the same second of the
// same file -- so "your spot ran 412 times in October" is arithmetic over
// playlist.json, deterministic and auditable, not an estimate.
//
// So these packages are priced and described in airings and placement. That is a
// promise the station can keep today and prove on demand. When listener measurement
// exists, impression-based pricing becomes available and these can be revisited --
// deliberately NOT before.
//
// Nothing here claims a reach, an audience size, or a CPM. If a figure like that ever
// appears in this file or on the page, it was invented.

// PRICES ARE PROPOSALS AND NEED PERCY'S CONFIRMATION.
//
// There is no audience data to derive a rate from, so these are anchored on what a
// sponsor read is worth to a small, targeted station rather than on a CPM. They are
// in ONE place so changing them is one edit. Amounts are in CENTS, integers, for the
// same reason prices are everywhere else in this codebase: 19.99 * 100 is 1998.9999
// in floating point.
export const SPONSOR_TIERS = [
  {
    id: 'supporter',
    name: 'Supporter',
    monthlyCents: 4900,
    // Card only. No audio, so no production work and no airtime consumed.
    summary: 'Your logo and link on the sponsor card, shown in rotation to listeners.',
    includes: [
      'Sponsor card with logo, blurb and link',
      'Listed on the BeatFlow Radio sponsors page',
      'Monthly airing report',
      'Cancel any time'
    ],
    audioSpot: false,
    priceIdEnv: 'REACT_APP_STRIPE_SPONSOR_SUPPORTER_PRICE_ID'
  },
  {
    id: 'rotation',
    name: 'Rotation',
    monthlyCents: 19900,
    summary: 'A recorded spot in the regular rotation, plus the sponsor card while it airs.',
    includes: [
      'Your audio spot in the station rotation',
      'Sponsor card displayed while your spot is on air',
      'Monthly airing report with exact run counts',
      'We record the spot for you if you do not have one',
      'Cancel any time'
    ],
    audioSpot: true,
    priceIdEnv: 'REACT_APP_STRIPE_SPONSOR_ROTATION_PRICE_ID'
  },
  {
    id: 'featured',
    name: 'Featured',
    monthlyCents: 49900,
    summary: 'A larger share of the rotation and the interactive sponsor card.',
    includes: [
      'Increased share of spot rotation',
      'Interactive sponsor card',
      'Priority placement around peak-hour programming',
      'Monthly airing report with exact run counts',
      'Spot production included',
      'Cancel any time'
    ],
    audioSpot: true,
    priceIdEnv: 'REACT_APP_STRIPE_SPONSOR_FEATURED_PRICE_ID'
  }
];

/**
 * The Stripe recurring Price for a tier, or null if it has not been created yet.
 *
 * These env vars do not exist until the Prices are created in Stripe. Reading a
 * missing one gives undefined, and handing undefined to Stripe Checkout fails at the
 * network with an error that points nowhere near the cause -- so callers check this
 * FIRST and fall back to the enquiry form.
 */
export function stripePriceIdFor(tier) {
  return process.env[tier.priceIdEnv] || null;
}

/**
 * Whether a tier can be bought directly right now.
 *
 * Deliberately a runtime check rather than a build-time assumption. A missing Price
 * must degrade to "enquire" rather than to a broken checkout button: an advertiser
 * who hits an error does not email you, they leave.
 */
export function canCheckout(tier) {
  return Boolean(stripePriceIdFor(tier));
}

/** Display helper. One implementation so no page formats money its own way. */
export function formatMonthly(tier) {
  return `$${(tier.monthlyCents / 100).toFixed(0)}/month`;
}
