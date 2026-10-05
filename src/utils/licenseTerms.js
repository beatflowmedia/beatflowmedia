// src/utils/licenseTerms.js
//
// The vocabulary for what a licence IS. Canonical for both the app and the Netlify
// functions, in the manner of utils/pricing.js.
//
// WHY THIS EXISTS
// One field, `licenseType`, was answering three different questions:
//
//   create-checkout.js   licenseType: 'personal'    -> how WIDE the grant is
//   stripe-webhook.js    licenseType: 'perpetual'   -> how LONG it lasts
//   pricingPlans.js      licenseType: 'time-bound'  -> how long it lasts
//   entitlementService   LICENSING_TYPES: sync, performance, mechanical, master
//                                                   -> WHICH RIGHT is granted
//
// The first two are written for the SAME transaction, which made them look like a
// contradiction -- DownloadLicenseTerms.js records it as one. They never were. They
// are correct answers to different questions sharing a name, and that is worse than a
// contradiction, because nothing can detect it. A reader comparing 'personal' with
// 'perpetual' cannot tell whether the system disagrees with itself or they simply are
// not comparable.
//
// Three axes, three names. A licence is a point in all three, and any product -- a
// $1.99 download, a Creator subscription, a venue tier -- is defined by naming one
// value from each.
//
//   SCOPE   who may use it and for what         personal | commercial
//   TERM    how long it lasts                   perpetual | time-bound
//   GRANT   which right it conveys              download | sync | performance | broadcast
//
// GRANT is the axis the catalogue has never modelled, and it is the one the money
// turns on. A download and a sync of the same recording are different products at
// different prices; Terms.js already excludes sync, performance and broadcast from
// every download licence, so the exclusions exist and the vocabulary did not.

/** How wide the permitted use is. */
const LICENSE_SCOPE = {
  PERSONAL: 'personal',
  COMMERCIAL: 'commercial'
};

/** How long the licence lasts. */
const LICENSE_TERM = {
  /** Does not expire. What a one-off download purchase buys. */
  PERPETUAL: 'perpetual',
  /** Valid while a subscription is active. Published work stays licensed; see
   *  pricingPlans.js, where every tier is time-bound. */
  TIME_BOUND: 'time-bound'
};

/** Which right is conveyed. Mirrors Terms.js section 4, which is the document that
 *  actually grants them -- this is the vocabulary, not the grant. */
const LICENSE_GRANT = {
  /** Download and keep the recording. The only one sold self-serve today. */
  DOWNLOAD: 'download',
  /** Pair with moving image. Quoted per project at /sync-licensing. */
  SYNC: 'sync',
  /** Play to an audience or in a commercial space. Quoted; no product yet. */
  PERFORMANCE: 'performance',
  /** Radio, television, webcast. Quoted. */
  BROADCAST: 'broadcast'
};

/**
 * What a one-off track or album purchase buys, in all three axes.
 *
 * Stated once so create-checkout and stripe-webhook cannot describe the same sale
 * differently. It matches DownloadLicenseTerms.js, which is the text the buyer reads
 * and ticks -- if this and that text ever disagree, the buyer has been shown one deal
 * and bound to another.
 */
const ONE_OFF_DOWNLOAD = {
  scope: LICENSE_SCOPE.PERSONAL,
  term: LICENSE_TERM.PERPETUAL,
  grant: LICENSE_GRANT.DOWNLOAD
};

const SCOPES = Object.values(LICENSE_SCOPE);
const TERMS = Object.values(LICENSE_TERM);
const GRANTS = Object.values(LICENSE_GRANT);

/** True when a value is a member of its axis. Used by the guard, and by writers that
 *  would otherwise persist a typo no reader could distinguish from a policy. */
const isValidScope = (v) => SCOPES.includes(v);
const isValidTerm = (v) => TERMS.includes(v);
const isValidGrant = (v) => GRANTS.includes(v);

/**
 * The fields to persist for a licence, given a product definition.
 *
 * `licenseType` is still written, and deliberately: existing records carry it and
 * stripe-webhook queries `where('licenseType','==','time-bound')` to find expiring
 * subscription licences. It is set to the TERM, because that is what every stored
 * value means today -- the two records in `licenses` both read 'perpetual'. The
 * 'personal' that create-checkout wrote to `purchases` was the odd one out, and it
 * appears in zero stored documents.
 */
function licenseFields({ scope, term, grant }) {
  if (!isValidScope(scope)) throw new Error(`licenseFields: unknown scope "${scope}"`);
  if (!isValidTerm(term)) throw new Error(`licenseFields: unknown term "${term}"`);
  if (!isValidGrant(grant)) throw new Error(`licenseFields: unknown grant "${grant}"`);
  return {
    licenseScope: scope,
    licenseTerm: term,
    licenseGrant: grant,
    // Legacy. Carries the TERM. Remove once nothing queries it.
    licenseType: term
  };
}

// CommonJS, matching utils/pricing.js and utils/agreements.js -- the two files the
// Netlify functions already import. Webpack interops this fine for the app side; the
// reverse is not reliably true inside a function bundle, and a module that resolves
// locally and not at deploy is the worst shape available.
module.exports = {
  LICENSE_SCOPE,
  LICENSE_TERM,
  LICENSE_GRANT,
  ONE_OFF_DOWNLOAD,
  isValidScope,
  isValidTerm,
  isValidGrant,
  licenseFields
};
