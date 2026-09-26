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
// Every tier carries audio, because card-only sponsorship cannot be rendered by the
// station -- see the Supporter comment below. `audioSpot` is kept rather than deleted
// as an always-true flag because the validator and the form both branch on it, so a
// future card-only tier would be caught by those branches instead of quietly shipping
// a package the player cannot display.
export const SPONSOR_TIERS = [
  {
    id: 'supporter',
    name: 'Supporter',
    monthlyCents: 4900,
    // WAS card-only, with no audio spot. That tier could not be delivered and was
    // withdrawn rather than repriced.
    //
    // The station's sponsor card renders in exactly two states: the advertiser whose
    // spot is currently playing, or the station's own house ad between records. There
    // is no third path -- no card rotation, no idle slot, no persistent "brought to
    // you by". A sponsor with no audio therefore has no moment at which their card
    // can appear, so $49/month bought something the player would never show.
    //
    // Worse, it would have failed SILENTLY. Nothing rejects a promo with no airings:
    // not the desk, not validate.js. It would sit in playlist.json, valid, and simply
    // never render -- discovered only when the sponsor asked why they had not seen
    // themselves.
    //
    // Card rotation is also not merely unbuilt, it was deliberately REMOVED: cycling
    // cards once put BeatFlow's own mark above "Brought to you by Perrice Consulting",
    // two advertisers in one box with the wrong one on top.
    //
    // So the cheap tier is now the smallest thing the machine actually does: a short
    // spot in one programme. That uses the path that exists, consumes countable
    // inventory, and the card comes with it.
    summary: 'A :15 spot in one programme, with your sponsor card while it airs.',
    includes: [
      'A :15 spot in one programme, agreed with you',
      'Sponsor card with your logo, blurb and link while it airs',
      'Monthly airing report with exact run counts',
      'Cancel any time'
    ],
    audioSpot: true,
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
      // Was "Priority placement around peak-hour programming". Deleted, not reworded.
      // Nothing counts listeners, so there is no evidence any hour carries more of
      // them than another -- "peak hour" asserted an audience distribution the
      // station cannot observe, and a sponsor who disputed it could not be answered.
      // Choice of PROGRAMME is the true version: the eight programmes are named, have
      // distinct music, and carry ad loads the desk actually enforces.
      'Your choice of programme, including the busiest ones',
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
  // The DYNAMIC lookup works here only because Create React App's DefinePlugin
  // replaces the whole `process.env` expression with an object literal of every
  // REACT_APP_* value, so indexing it at runtime indexes that literal.
  //
  // Most bundlers do NOT do this -- Vite and Next replace only static
  // `process.env.SOME_NAME` references and leave a computed index undefined. If this
  // project ever changes build tool, every tier silently becomes "not buyable" and
  // the page quietly falls back to the enquiry form with nothing in the console.
  // Verified by grepping the built bundle for the price IDs, not assumed.
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
