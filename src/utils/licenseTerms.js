// src/utils/licenseTerms.js
//
// The vocabulary for what a license IS. Canonical for both the app and the Netlify
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
// Three axes, three names. A license is a point in all three, and any product -- a
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
// every download license, so the exclusions exist and the vocabulary did not.

const {
  DOWNLOAD_LICENSE,
  SYNC_LICENSE,
  COMMERCIAL_LICENSE
} = require('./agreements');

/** How wide the permitted use is. */
const LICENSE_SCOPE = {
  PERSONAL: 'personal',
  COMMERCIAL: 'commercial'
};

/** How long the license lasts. */
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

/**
 * What a paid subscription buys: the right to put the music in video.
 *
 * TIME-BOUND, and the distinction underneath that word is the whole product.
 *
 *   The right to PUBLISH NEW content  ends when the subscription ends.
 *   The clearance of content ALREADY PUBLISHED while subscribed does NOT.
 *
 * Those are different things and conflating them is how a music library acquires a
 * reputation. A creator with three years of videos cannot have them all become
 * infringing because they cancelled a $24 plan -- they would never subscribe in the
 * first place, and they would be right not to. Epidemic Sound and Artlist both settled
 * on the same split, and it is the only version a creator can safely build a channel on.
 *
 * `term: TIME_BOUND` therefore describes the GRANT, not the videos. The certificate and
 * /verify state the date, which is what makes "was this published while covered?"
 * answerable years later. Epidemic solves the same problem with channel safelisting;
 * the licence record answers it without asking anyone to register anything.
 */
const SUBSCRIPTION_SYNC = {
  scope: LICENSE_SCOPE.COMMERCIAL,
  term: LICENSE_TERM.TIME_BOUND,
  grant: LICENSE_GRANT.SYNC
};

/**
 * What a one-off COMMERCIAL licence buys: the production-library product.
 *
 * PERPETUAL AND COMMERCIAL AT THE SAME TIME, which neither other product is, and the
 * combination is what a buyer is actually paying for. A video editor cutting a client's
 * brand film cannot accept "licensed while you keep paying" -- the film outlives the
 * subscription and the client owns it. One payment, no renewal date, no expiry.
 *
 * `grant: SYNC` rather than DOWNLOAD, and the file arriving is incidental. The download
 * licence also delivers a file and expressly forbids pairing it with moving image; this
 * is sold for exactly that. Same bytes, different product, roughly 15x the price -- which
 * is why the two must never share an acceptance record.
 *
 * SCOPED TO THE RECORDINGS ON THE LICENCE, not the catalogue. Buying a 24-track
 * collection licenses 24 recordings permanently; it does not license the other 300.
 */
const ONE_OFF_COMMERCIAL = {
  scope: LICENSE_SCOPE.COMMERCIAL,
  term: LICENSE_TERM.PERPETUAL,
  grant: LICENSE_GRANT.SYNC
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
 * The fields to persist for a license, given a product definition.
 *
 * `licenseType` is still written, and deliberately: existing records carry it and
 * stripe-webhook queries `where('licenseType','==','time-bound')` to find expiring
 * subscription licenses. It is set to the TERM, because that is what every stored
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

/**
 * Plain-language summary of the one-off download license, for surfaces OUTSIDE the
 * checkout that have to tell someone what they are about to license.
 *
 * It exists so there is one wording rather than several. BeatFlow Radio needs it for a
 * terms-confirmation popup before a listener leaves for BFMG, and the alternative --
 * the station keeping its own copy -- drifts the moment the license changes here. The
 * failure is silent and only surfaces in a dispute, which is the worst time to discover
 * that two systems described the same license differently.
 *
 * `catalog.js` pulls this with the rest of the catalogue, the same way it already pulls
 * storeUrl. Consumers should render it and link `termsUrl`; they must not paraphrase it.
 *
 * It is a SUMMARY. `termsUrl` section 4 is what binds, and every exclusion listed in
 * DownloadLicenseTerms.js is represented here by category -- synchronisation, public
 * performance, broadcast, alteration, compilation, redistribution, AI/ML training and
 * sublicensing. Checked against Terms.js section 4 on 2026-10-09; AI training included.
 *
 * NOT LEGAL ADVICE and not a substitute for the Terms. Needs a lawyer's review.
 */
// "kept for good" and "it does not expire" were promises the software stopped keeping
// on 2026-10-15, when refunds and chargebacks began terminating a license automatically
// (netlify/functions/lib/payment-reversal.js). A summary that says a license cannot end,
// shown on the screen where the buyer gives their assent, next to code that ends it, is
// the worst version of this mistake: it is the exact document produced in a dispute.
//
// "Does not expire" is still true and is a real distinction worth keeping -- there is no
// clock on it, unlike a subscription license. What is now stated alongside is that it can
// be ENDED, and the two conditions under which it is.
const DOWNLOAD_LICENSE_SUMMARY = {
  agreement: ONE_OFF_DOWNLOAD,
  headline: 'A personal download license, yours to keep.',
  summary:
    'You are licensing a personal download: there is no time limit on it and it does ' +
    'not expire. It can end in two cases — if you breach these terms, or if the payment ' +
    'is later reversed by a refund or a chargeback. It does not cover putting the music ' +
    'in a video, film, game or advert, playing it to an audience, broadcasting it, ' +
    'remixing or editing it, including it in a compilation, resharing the file, or using ' +
    'it to train an AI model. Anything beyond personal listening needs a separate license.',
  termsUrl: 'https://beatflowmediagroup.com/terms',
  syncUrl: 'https://beatflowmediagroup.com/sync-licensing'
};

// The subscription licence. NOT LEGAL ADVICE and not reviewed by a lawyer -- written to
// describe exactly what the software does and what the platform can actually deliver,
// which is the part that can be verified. See docs/sync-license-draft.md for the longer
// text and the questions a reviewer should be asked.
//
// WHAT MAKES THIS DELIVERABLE AT ALL
// A sync licence is only worth buying if the music does not get claimed or muted. BFMG
// can promise that because none of its catalogue is enrolled in YouTube Content ID or
// Meta Rights Manager -- those come bundled in DistroKid's Social Media Pack, which has
// never been purchased for any release. Enrolling would earn pennies from strangers'
// videos and claim paying subscribers' videos at the same time, so it stays off. If that
// ever changes, this summary becomes false on the day it changes.
//
// The residual risk is stated rather than hidden: AI-generated music can occasionally
// trip a false match from an unrelated rights holder. Rare, outside our control, and not
// something to paper over with the word "guaranteed".
const SUBSCRIPTION_SYNC_SUMMARY = {
  agreement: SUBSCRIPTION_SYNC,
  headline: 'Put our music in your videos, for as long as you subscribe.',
  summary:
    'While your subscription is active you may synchronise our recordings with video ' +
    'and publish it on platforms such as YouTube, TikTok, Instagram, Facebook and ' +
    'podcasts, including monetised content. Anything you publish while subscribed stays ' +
    'licensed permanently — cancelling does not put your back catalogue at risk. What ' +
    'ends with the subscription is the right to publish NEW content using our music. ' +
    'The licence is worldwide, non-exclusive and non-transferable. It does not cover ' +
    'broadcast television or radio, cinema, paid advertising campaigns, video games, ' +
    'reselling the music on its own, or using it to train an AI model — those need a ' +
    'separate licence.',
  // The promise that distinguishes this from a file you downloaded somewhere.
  claimSupport:
    'Our catalogue is not registered with YouTube Content ID or Meta Rights Manager, so ' +
    'we do not claim or mute our subscribers’ videos. If a third party claims one ' +
    'anyway, your account provides a dispute pack — your licence number, its verification ' +
    'link, and a statement you can submit to the platform. We log every claim.',
  termsUrl: 'https://beatflowmediagroup.com/terms',
  syncUrl: 'https://beatflowmediagroup.com/sync-licensing'
};

// The one-off commercial licence. NOT LEGAL ADVICE and not reviewed by a lawyer. See
// docs/commercial-license-draft.md for the long text and the reviewer's questions.
//
// The claim support is WORD FOR WORD the subscription's, and deliberately so: it rests on
// the same fact (nothing is enrolled in Content ID or Rights Manager because DistroKid's
// Social Media Pack has never been bought) and if that fact changes, both become false on
// the same day. Two paraphrases of one fact would let one get updated and not the other.
const COMMERCIAL_LICENSE_SUMMARY = {
  agreement: ONE_OFF_COMMERCIAL,
  headline: 'Commercial use of these recordings, permanently, for one payment.',
  summary:
    'You are licensing these recordings for commercial use, permanently and worldwide. ' +
    'You may synchronise them with video, use them in podcasts, apps, games, ' +
    'presentations and work you deliver to your own clients, and publish the result ' +
    'including monetised content. The licence does not expire and there is nothing to ' +
    'renew. It is non-exclusive and non-transferable, and it covers the recordings named ' +
    'on your licence rather than the catalogue. It does not cover broadcast television or ' +
    'radio, cinema, paid advertising campaigns, reselling the music on its own, or using ' +
    'it to train an AI model — those need a separate licence.',
  claimSupport: SUBSCRIPTION_SYNC_SUMMARY.claimSupport,
  termsUrl: 'https://beatflowmediagroup.com/terms',
  syncUrl: 'https://beatflowmediagroup.com/sync-licensing'
};

/**
 * WHICH AGREEMENT GOVERNS WHICH PRODUCT. The canonical mapping.
 *
 * It exists because create-checkout was asking the wrong question. Its gate called
 * `isCurrentAgreementVersion(acceptedAgreement)`, which answers "is this SOME current
 * agreement" -- so a client could present `download-license@...` for a $319 commercial
 * collection and be waved through. Harmless while one product existed; a hole the moment
 * a second one did. The gate now asks for the identifier of THIS product's agreement.
 *
 * Keyed by grant+term because that is what distinguishes the products: download/perpetual
 * is the $1.99 sale, sync/perpetual is the library sale, sync/time-bound is the
 * subscription. Scope is not in the key -- it never varies independently of them.
 */
const PRODUCT_AGREEMENTS = [
  { product: ONE_OFF_DOWNLOAD, agreement: DOWNLOAD_LICENSE, summary: DOWNLOAD_LICENSE_SUMMARY },
  { product: ONE_OFF_COMMERCIAL, agreement: COMMERCIAL_LICENSE, summary: COMMERCIAL_LICENSE_SUMMARY },
  { product: SUBSCRIPTION_SYNC, agreement: SYNC_LICENSE, summary: SUBSCRIPTION_SYNC_SUMMARY }
];

/** The agreement key a product is sold under, or null if the product is unknown.
 *  null is a hard stop, never a check to skip -- same contract as CURRENT_VERSIONS. */
function agreementForProduct(product) {
  if (!product) return null;
  const match = PRODUCT_AGREEMENTS.find(
    (e) => e.product.grant === product.grant && e.product.term === product.term
  );
  return match ? match.agreement : null;
}

/** The plain-language summary for a product, for any surface that has to tell someone
 *  what they are about to license. Render it; never paraphrase it. */
function summaryForProduct(product) {
  const match = PRODUCT_AGREEMENTS.find(
    (e) => e.product.grant === product?.grant && e.product.term === product?.term
  );
  return match ? match.summary : null;
}

/**
 * The product a checkout request is for.
 *
 * SINGLE SOURCE for "what is actually being sold here", which three files were each
 * deciding for themselves. Returns null for a combination that is not a product, and the
 * caller must refuse rather than fall back -- the fallback case is the one that sells a
 * commercial licence at the consumer price.
 *
 * @param {string} itemType  'song' | 'album' | 'collection'
 * @param {string} licenseType  'personal' | 'commercial'
 */
function productForSale(itemType, licenseType) {
  if (licenseType === LICENSE_SCOPE.COMMERCIAL) {
    return ['song', 'album', 'collection'].includes(itemType) ? ONE_OFF_COMMERCIAL : null;
  }
  if (licenseType === LICENSE_SCOPE.PERSONAL || licenseType === undefined || licenseType === null) {
    // A collection has no personal price and no personal product: it is a production
    // library, and a personal licence covers a track or an album.
    return ['song', 'album'].includes(itemType) ? ONE_OFF_DOWNLOAD : null;
  }
  return null;
}

/**
 * The product a completed Stripe session was for, read back off its metadata.
 *
 * WHY THE WEBHOOK CANNOT JUST ASSUME. Both webhooks wrote
 * `licenseFields(ONE_OFF_DOWNLOAD)` unconditionally, which was correct while a download
 * was the only thing on sale. A commercial sale recorded that way produces a licence
 * document saying `scope: personal, grant: download` for a purchase whose whole point is
 * commercial sync -- and that document is the evidence, both for a buyer proving their
 * right and for BFMG proving its limits. It would contradict the sale it records.
 *
 * FALLS BACK TO ONE_OFF_DOWNLOAD, deliberately. Sessions created before these metadata
 * fields existed carry none, and every one of them was a personal download; defaulting
 * any other way would relabel real history. An INVALID value falls back too rather than
 * throwing, because the alternative is a paid webhook that 500s forever and a buyer with
 * no licence at all -- but it logs, because a reached fallback means the writer changed.
 *
 * @param {object} meta  session.metadata
 * @param {function} [warn]  injected so a function bundle can route the log
 */
function productFromMetadata(meta, warn = console.warn) {
  const m = meta || {};
  const candidate = {
    scope: m.licenseScope,
    term: m.licenseTerm,
    grant: m.licenseGrant
  };

  const anyPresent = candidate.scope || candidate.term || candidate.grant;
  if (!anyPresent) return ONE_OFF_DOWNLOAD;

  // VALIDATED AGAINST THE PRODUCTS ON SALE, not merely against the axes.
  //
  // Checking the three axes alone was not enough, and a test caught it: `broadcast` is
  // a legitimate member of LICENSE_GRANT -- Terms.js section 4 names it as an exclusion
  // -- so { commercial, perpetual, broadcast } passed every axis check and came back as
  // a product. It is not one. Nothing sells a broadcast licence self-serve; it is
  // quoted. The webhook would have written licenseGrant: 'broadcast' onto a licence row,
  // granting on paper the most expensive right in the catalogue.
  //
  // Axis-valid is a spelling check. Being a product is a different question, and
  // PRODUCT_AGREEMENTS is the only place that answers it.
  const axesWellFormed = isValidScope(candidate.scope)
    && isValidTerm(candidate.term)
    && isValidGrant(candidate.grant);
  if (axesWellFormed) {
    const known = PRODUCT_AGREEMENTS.find(
      (e) => e.product.scope === candidate.scope
        && e.product.term === candidate.term
        && e.product.grant === candidate.grant
    );
    if (known) return known.product;
  }

  warn('productFromMetadata: license axes present but invalid, falling back to a ' +
    'personal download license. got:', JSON.stringify(candidate));
  return ONE_OFF_DOWNLOAD;
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
  ONE_OFF_COMMERCIAL,
  SUBSCRIPTION_SYNC,
  DOWNLOAD_LICENSE_SUMMARY,
  SUBSCRIPTION_SYNC_SUMMARY,
  COMMERCIAL_LICENSE_SUMMARY,
  PRODUCT_AGREEMENTS,
  agreementForProduct,
  summaryForProduct,
  productForSale,
  productFromMetadata,
  isValidScope,
  isValidTerm,
  isValidGrant,
  licenseFields
};
