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
// generated a licenseId per sale -- proof a transaction happened -- with no proof of
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
//                                    title), so a downstream license is only ever as
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
 *    - takedown and removal rights, and what happens to licenses already sold when a
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

/** A buyer accepts this to license a track or a collection for COMMERCIAL use,
 *  once, permanently -- the production-library product.
 *
 *  IT EXISTS BECAUSE NEITHER OF THE OTHER TWO FITS, and quietly reusing one would be
 *  the worst available outcome. The download license EXPRESSLY FORBIDS sync; recording
 *  it against a $319 collection licence would produce evidence that the buyer agreed
 *  NOT to do the thing they just paid to do. The sync licence is written throughout as
 *  "while your subscription is active", so recording it against a one-off sale
 *  describes a grant that ends -- when what was sold does not.
 *
 *  Same reasoning create-checkout already applies to submission credits: an acceptance
 *  of the wrong contract is worse than none, because it looks like diligence. */
const COMMERCIAL_LICENSE = 'commercial-license';

const AGREEMENTS = {
  DOWNLOAD_LICENSE, CONTRIBUTOR_UPLOAD, SYNC_LICENSE, COMMERCIAL_LICENSE
};

/**
 * EVERY version of each agreement, newest first. The canonical origin.
 *
 * WHY A HISTORY AND NOT JUST THE CURRENT VERSION
 * A purchase stores `download-license@<version>`, and `/terms` promises that the
 * recorded value — not any later revision of the page — governs that purchase. That
 * promise is only keepable if the superseded text still exists somewhere a buyer can
 * read. It did not: editing Terms.js on 2026-10-15 overwrote text that was, and still
 * is, in force for two purchases. `npm run verify:terms` had been saying so in as many
 * words ("the old version must stay readable, not be overwritten") and nothing
 * implemented it.
 *
 * So each entry carries the summary AS IT STOOD, and /changes renders them. A buyer on
 * an older version reads their own deal instead of asking us to email it.
 *
 * `whatChanged` is written for the buyer, not for the repo: what is different about
 * their rights, in the fewest plain words that are still true. The commit messages and
 * the DOSI ledger are where the engineering reasoning lives.
 *
 * ADDING A VERSION: prepend an entry. CURRENT_VERSIONS derives from this, so the two
 * cannot disagree — which is the point. A hand-maintained "current" beside a
 * hand-maintained history is two sources of truth and they drift on the first busy day.
 */
const AGREEMENT_HISTORY = {
  [DOWNLOAD_LICENSE]: [
    {
      version: '2026-10-15',
      headline: 'Your license can now end if the payment is reversed.',
      whatChanged: [
        'If you get a full refund, or your bank reverses the charge, the license for that recording ends. You must stop using it.',
        'A partial refund does not end your license.',
        'At checkout you now confirm two things before paying: that you want the download straight away, and that asking for it straight away means you give up the right to cancel.',
        'We added a section explaining your cancellation rights, and said plainly that we do not ask you to give up your right to dispute a charge with your bank.'
      ],
      summary:
        'You are licensing a personal download: there is no time limit on it and it does ' +
        'not expire. It can end in two cases — if you breach these terms, or if the payment ' +
        'is later reversed by a refund or a chargeback. It does not cover putting the music ' +
        'in a video, film, game or advert, playing it to an audience, broadcasting it, ' +
        'remixing or editing it, including it in a compilation, resharing the file, or using ' +
        'it to train an AI model. Anything beyond personal listening needs a separate license.'
    },
    {
      version: '2026-09-19',
      headline: 'The first published version of the download license.',
      whatChanged: [
        'Before this, the limits on what a download license covers were not written down in one place.',
        'This version set out what you get, and what needs a separate license: public performance, DJ use, broadcast, sync, remixes, compilations, resharing, and AI training.'
      ],
      summary:
        'You are licensing a personal download: you may keep the recording permanently and ' +
        'it does not expire. It does not cover putting the music in a video, film, game or ' +
        'advert, playing it to an audience, broadcasting it, remixing or editing it, ' +
        'including it in a compilation, resharing the file, or using it to train an AI ' +
        'model. Anything beyond personal listening needs a separate license.'
    }
  ],
  // No text written, so no versions. See the note on CONTRIBUTOR_UPLOAD above: an empty
  // history is the honest state, and it is what makes CURRENT_VERSIONS null below.
  [CONTRIBUTOR_UPLOAD]: [],

  // The subscription sync licence. Published 2026-10-16, which is what makes the paid
  // tiers sellable -- they have advertised "commercial use" and "YouTube, TikTok,
  // Instagram, podcasts" since before any text existed to back it. Nobody had subscribed,
  // so the promise was latent rather than broken, and this closes it before it was not.
  //
  // NOT REVIEWED BY A LAWYER. Written to describe what the software does and what the
  // platform can actually deliver. docs/sync-license-draft.md carries the longer text and
  // the questions for whoever reviews it.
  [SYNC_LICENSE]: [
    {
      version: '2026-10-16',
      headline: 'Put our music in your videos, for as long as you subscribe.',
      whatChanged: [
        'This is the first published version of the subscription sync license.',
        'While your subscription is active you can put our recordings in videos and publish them, including monetised content.',
        'Anything you publish while subscribed stays licensed permanently. Cancelling does not put videos you have already published at risk.',
        'What ends when the subscription ends is the right to publish NEW content using our music.',
        'Broadcast TV and radio, cinema, paid advertising campaigns, video games, reselling the music on its own, and AI training are not covered and need a separate license.',
        'Our catalogue is not registered with YouTube Content ID or Meta Rights Manager, so we do not claim or mute our own subscribers’ videos.'
      ],
      summary:
        'While your subscription is active you may synchronise our recordings with video ' +
        'and publish it on platforms such as YouTube, TikTok, Instagram, Facebook and ' +
        'podcasts, including monetised content. Anything you publish while subscribed stays ' +
        'licensed permanently — cancelling does not put your back catalogue at risk. What ' +
        'ends with the subscription is the right to publish NEW content using our music. ' +
        'The licence is worldwide, non-exclusive and non-transferable. It does not cover ' +
        'broadcast television or radio, cinema, paid advertising campaigns, video games, ' +
        'reselling the music on its own, or using it to train an AI model — those need a ' +
        'separate licence.'
    }
  ],

  // The one-off commercial licence. Published 2026-10-17, the day the commercial price
  // curve was wired to checkout -- deliberately the same day, because a price with no
  // text behind it is the condition the subscription tiers were in for months.
  //
  // DIFFERS FROM THE SUBSCRIPTION SYNC LICENCE IN ONE WORD THAT CHANGES EVERYTHING:
  // perpetual. A subscriber's right to publish NEW work ends with the subscription; this
  // does not end at all. That makes it the more dangerous document of the two, because
  // there is no renewal date at which a mistake can be corrected.
  //
  // NOT REVIEWED BY A LAWYER. docs/commercial-license-draft.md carries the long text and
  // the questions for whoever reviews it.
  [COMMERCIAL_LICENSE]: [
    {
      version: '2026-10-17',
      headline: 'Use these recordings commercially, permanently, for one payment.',
      whatChanged: [
        'This is the first published version of the one-off commercial license.',
        'You may put the recordings you licensed into videos, podcasts, apps, games, presentations and client work, and publish them worldwide, including monetised content.',
        'It does not expire and there is nothing to renew. It covers the specific recordings on your license, not the rest of the catalogue.',
        'It is non-exclusive: we license the same recordings to other people too.',
        'Broadcast TV and radio, cinema, paid advertising campaigns, reselling the music on its own, and AI training are not covered and need a separate license.',
        'Our catalogue is not registered with YouTube Content ID or Meta Rights Manager, so we do not claim or mute your videos.'
      ],
      summary:
        'You are licensing these recordings for commercial use, permanently and worldwide. ' +
        'You may synchronise them with video, use them in podcasts, apps, games, ' +
        'presentations and work you deliver to your own clients, and publish the result ' +
        'including monetised content. The licence does not expire and there is nothing to ' +
        'renew. It is non-exclusive and non-transferable, and it covers the recordings named ' +
        'on your licence rather than the catalogue. It does not cover broadcast television or ' +
        'radio, cinema, paid advertising campaigns, reselling the music on its own, or using ' +
        'it to train an AI model — those need a separate licence.'
    }
  ]
};

/**
 * The version currently in force for each agreement, or null when no text exists.
 *
 * DERIVED from AGREEMENT_HISTORY rather than written out, so a new version cannot be
 * published without also recording what it says and what changed. The failure this
 * prevents is specific: bumping a version while the superseded text goes unarchived,
 * which is exactly what happened on 2026-10-15 and left two buyers governed by words
 * nobody could produce.
 *
 * null is meaningful: it means "cannot be accepted", not "any version will do".
 * Every consumer must treat null as a hard stop rather than as a check to skip.
 */
const CURRENT_VERSIONS = ALL_AGREEMENT_KEYS().reduce((acc, agreement) => {
  const history = AGREEMENT_HISTORY[agreement] || [];
  acc[agreement] = history.length ? history[0].version : null;
  return acc;
}, {});

/** Declared as a function so it can be used above its own definition order. */
function ALL_AGREEMENT_KEYS() {
  return [DOWNLOAD_LICENSE, CONTRIBUTOR_UPLOAD, SYNC_LICENSE, COMMERCIAL_LICENSE];
}

const AGREEMENT_LABELS = {
  [DOWNLOAD_LICENSE]: 'Download License Terms',
  [CONTRIBUTOR_UPLOAD]: 'Contributor Upload Agreement',
  [SYNC_LICENSE]: 'Sync License Agreement',
  [COMMERCIAL_LICENSE]: 'Commercial License Agreement'
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
  AGREEMENT_HISTORY,
  AGREEMENT_LABELS,
  DOWNLOAD_LICENSE,
  CONTRIBUTOR_UPLOAD,
  SYNC_LICENSE,
  COMMERCIAL_LICENSE,
  currentAgreementVersion,
  parseAgreementVersion,
  isCurrentAgreementVersion,
  agreementLabel
};
