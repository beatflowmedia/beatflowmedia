// src/utils/agreements.js
//
// Which agreement a person accepted, and which version of it. SINGLE SOURCE.
//
// WHY THIS EXISTS
// Publishing terms somewhere on the site is BROWSEWRAP: the claim that a buyer is
// bound because a link existed in the footer. Courts routinely refuse to enforce it,
// because nobody can show the buyer ever saw it. CLICKWRAP -- conspicuous terms, an
// affirmative act to accept them, and a stored record of that act -- is what makes
// the same text a contract.
//
// Before this module the codebase had the first half of nothing: no acceptance
// control, and no field on any purchase recording agreement. A grep across
// create-checkout.js, stripe-webhook.js and the purchase dialog for
// acceptedTerms|termsAccepted|agreedTo|consent returned zero hits. The platform
// generated a licenceId per sale -- proof a transaction happened -- with no proof of
// what the buyer agreed to.
//
// CONTRACT IS THE SHIELD, NOT COPYRIGHT.
// Whether copyright subsists in AI-assisted output is unsettled. A contract does not
// care: it binds the buyer to the restrictions they accepted regardless of who owns
// what. That is why the acceptance record matters more here than in an ordinary
// storefront -- it is the primary enforcement mechanism, not a formality.
//
// TWO DIRECTIONS, ONE REGISTRY.
// BFMG exposure runs both ways and the second direction is the dangerous one:
//
//   DOWNSTREAM  BFMG -> buyer.       Limits what a buyer may do. Live today.
//   UPSTREAM    contributor -> BFMG. Once artists, producers and bands can upload,
//                                    BFMG distributes recordings it did not make and
//                                    cannot verify. Its protection is the uploader
//                                    warranty of rights and indemnity -- exactly the
//                                    position BFMG occupies relative to its own
//                                    upstream suppliers today. You cannot grant
//                                    downstream more than you hold upstream (chain of
//                                    title), so a downstream licence is only ever as
//                                    good as the upstream warranty behind it.
//
// Both live here so there is one place that answers "what has this person agreed to",
// and so the upload path cannot quietly invent its own answer later.
//
// VERSIONS ARE DATES, DELIBERATELY.
// What has to be reconstructable years later is WHICH TEXT a person saw on the day
// they clicked. A date does that; a semver does not. The stored value is
// "<agreement>@<YYYY-MM-DD>" so a purchase record is self-describing without a join.
//
// NEVER EDIT A PUBLISHED VERSION IN PLACE. Changing the wording under an existing
// date silently rewrites what every past buyer is recorded as having accepted, which
// destroys the evidence this module exists to create. Add a new date instead.
//
// NOT LEGAL ADVICE. This is the plumbing that makes acceptance provable. Whether the
// clauses themselves hold up in New Jersey is a lawyer question, and the contributor
// agreement below has not been written yet -- see CONTRIBUTOR_UPLOAD.

/** Buyer accepts this to download a single or an album. Covers the personal,
 *  non-performance, non-derivative grant described in DownloadLicenseTerms.js. */
const DOWNLOAD_LICENSE = 'download-license';

/** An artist, producer or band accepts this to upload a recording to BFMG.
 *
 *  DELIBERATELY HAS NO CURRENT VERSION. Uploads already work -- ContentUploadInterface
 *  writes to artistSubmissions and approve-submission.js promotes them -- and an
 *  uploader currently agrees to nothing at all. That is the single largest legal gap
 *  on the platform, because accepting third-party uploads makes BFMG a distributor
 *  relying on the uploader representations.
 *
 *  Leaving the version null is the honest state: the upload path cannot claim an
 *  acceptance that no text backs. Setting a date here is a deliberate act that must
 *  follow the agreement actually being written and reviewed. It has to cover, at
 *  minimum:
 *    - warranty that the uploader owns or controls every right being granted,
 *      INCLUDING the composition, any sample, and any AI service output terms
 *    - the grant to BFMG: distribute, sell downloads, sublicense for sync, in what
 *      territory, for how long, exclusive or not
 *    - splits and accounting
 *    - indemnity running to BFMG for third-party claims -- the clause that actually
 *      moves the risk of a bad upload back to the person who made it
 *    - takedown and removal rights, and what happens to licences already sold when a
 *      recording comes down (they must survive, or BFMG breaches its own buyers)
 *    - AI provenance disclosure: which tool, which account tier, and what that tier
 *      terms permit commercially
 *
 *  THE DSP PRD MAKES SEVERAL OF THESE CONTRACTUAL RATHER THAN OPTIONAL. Its creator
 *  onboarding section requires the uploader to affirm commercial-tier ownership on
 *  the generating engine (Suno, Udio), and its rights section requires rejecting
 *  unauthorized voice clones and soundalikes. A filter can only reject what it
 *  detects; the uploader's affirmation is what makes an undetected violation the
 *  uploader's breach rather than BFMG's infringement. The PRD also mandates a
 *  track-level AI disclosure taxonomy (synthetic / AI-assisted / human master with
 *  AI remix) -- that is metadata, but the truthfulness of it is a warranty, and it
 *  feeds chart reporting, so a false disclosure has to be a breach of THIS
 *  agreement. Whoever writes the text should treat the PRD section as the checklist
 *  and a lawyer as the author. */
const CONTRIBUTOR_UPLOAD = 'contributor-upload';

/** A sync licensee accepts this for use in media. Not written; the sync path is
 *  gated behind a privileged account and quotes rather than self-serve checkout. */
const SYNC_LICENSE = 'sync-license';

const AGREEMENTS = { DOWNLOAD_LICENSE, CONTRIBUTOR_UPLOAD, SYNC_LICENSE };

/**
 * The version currently in force for each agreement, or null when no text exists.
 *
 * null is meaningful: it means "cannot be accepted", not "any version will do".
 * Every consumer must treat null as a hard stop rather than as a check to skip.
 */
const CURRENT_VERSIONS = {
  [DOWNLOAD_LICENSE]: '2026-09-19',
  [CONTRIBUTOR_UPLOAD]: null,
  [SYNC_LICENSE]: null
};

const AGREEMENT_LABELS = {
  [DOWNLOAD_LICENSE]: 'Download Licence Terms',
  [CONTRIBUTOR_UPLOAD]: 'Contributor Upload Agreement',
  [SYNC_LICENSE]: 'Sync Licence Agreement'
};

const ALL_AGREEMENTS = Object.values(AGREEMENTS);

const SEPARATOR = '@';

/**
 * The stored identifier for an agreement current version.
 *
 * @param {string} agreement - one of AGREEMENTS
 * @returns {string|null} e.g. "download-license@2026-09-19", or null when the
 *          agreement has no published text and therefore cannot be accepted.
 */
function currentAgreementVersion(agreement) {
  const version = CURRENT_VERSIONS[agreement];
  if (!version) return null;
  return agreement + SEPARATOR + version;
}

/**
 * Split a stored identifier back into its parts.
 *
 * Returns null rather than a partial object for anything malformed, so a caller
 * cannot accidentally treat garbage as a valid acceptance by reading .agreement off
 * it and finding undefined.
 *
 * @param {string} identifier
 * @returns {{agreement: string, version: string}|null}
 */
function parseAgreementVersion(identifier) {
  if (typeof identifier !== 'string') return null;

  const at = identifier.indexOf(SEPARATOR);
  if (at < 1 || at === identifier.length - 1) return null;

  const agreement = identifier.slice(0, at);
  const version = identifier.slice(at + 1);

  if (!ALL_AGREEMENTS.includes(agreement)) return null;
  return { agreement, version };
}

/**
 * Is this identifier the version currently being offered?
 *
 * The server checks CURRENT, not merely known. A buyer whose page was open while the
 * terms changed assented to text that is no longer the offer; accepting it would
 * record agreement to a document they were never shown. The caller job is to say
 * "reload and read the new terms", not to quietly bind them to either version.
 *
 * @param {string} identifier
 * @returns {boolean}
 */
function isCurrentAgreementVersion(identifier) {
  const parsed = parseAgreementVersion(identifier);
  if (!parsed) return false;
  return currentAgreementVersion(parsed.agreement) === identifier;
}

/** Human name for an agreement, for UI and for admin screens reading a stored
 *  record. Falls back to the raw value so an unknown agreement is visible rather
 *  than blank. */
function agreementLabel(agreement) {
  return AGREEMENT_LABELS[agreement] || agreement || 'Agreement';
}

module.exports = {
  AGREEMENTS,
  ALL_AGREEMENTS,
  CURRENT_VERSIONS,
  AGREEMENT_LABELS,
  DOWNLOAD_LICENSE,
  CONTRIBUTOR_UPLOAD,
  SYNC_LICENSE,
  currentAgreementVersion,
  parseAgreementVersion,
  isCurrentAgreementVersion,
  agreementLabel
};
