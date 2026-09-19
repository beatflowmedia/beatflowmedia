// src/utils/aiDisclosure.js
//
// How much of a recording a human made, and what can therefore be registered.
// SINGLE SOURCE for AI provenance.
//
// TWO OBLIGATIONS MEET HERE, AND THEY ARE NOT THE SAME OBLIGATION.
//
//   1. The DSP PRD requires a track-level AI disclosure tag on ingestion, and feeds
//      it to chart reporting. That is a METADATA duty owed to Luminate.
//   2. The Copyright Office requires that AI-generated material be disclosed and
//      DISCLAIMED on a registration application, with the claim limited to the
//      human-authored parts. That is a LEGAL duty owed to the Register.
//
// The same fact serves both, which is why it lives in one module. Storing it twice
// would let a record be reported to a chart as one thing and registered as another,
// and the second of those is a false statement on a federal application.
//
// THE GOVERNING RULE (Copyright Office, AI authorship guidance):
// A work containing AI-generated material may be registered WHERE IT EMBODIES
// MEANINGFUL HUMAN AUTHORSHIP. Protection extends only to the human-authored
// expression. AI-generated material must be excluded from the claim where it is more
// than de minimis. Prompting alone -- however elaborate -- is not authorship.
//
// TWO COPYRIGHTS, NOT ONE (Circular 56A). Every recorded song is a COMPOSITION (the
// song as written) and a SOUND RECORDING (one fixed performance of it). They are
// separate works, separately registrable, and AI can touch them independently: human
// lyrics over AI instrumentation means a registrable composition and an
// unregistrable master. Anything that collapses the two will get a registration
// wrong, so this module answers for each separately.
//
// NOT LEGAL ADVICE. This encodes published guidance so the platform can produce an
// honest claim. Whether a particular contribution is "meaningful" is a judgement the
// Register makes, and a lawyer should review any claim before it is filed.

/** 100% machine-generated. No meaningful human authorship, so nothing to register. */
const SYNTHETIC = 'synthetic';

/** Human composition or lyrics, AI vocal or instrumentation. The human-authored
 *  layer is registrable; the generated audio is disclaimed. */
const AI_ASSISTED = 'ai-assisted';

/** A human recording, with AI used to remix, extend or process it. The underlying
 *  human performance is registrable. */
const HUMAN_MASTER_AI_REMIX = 'human-master-ai-remix';

/** No AI involvement at all. Included so the field is never ambiguous by absence --
 *  "no tag" must not be readable as "no AI". */
const HUMAN_ONLY = 'human-only';

const AI_DISCLOSURES = { SYNTHETIC, AI_ASSISTED, HUMAN_MASTER_AI_REMIX, HUMAN_ONLY };
const ALL_DISCLOSURES = Object.values(AI_DISCLOSURES);

const DISCLOSURE_LABELS = {
  [SYNTHETIC]: 'Synthetic (fully AI-generated)',
  [AI_ASSISTED]: 'AI-assisted (human writing, AI performance)',
  [HUMAN_MASTER_AI_REMIX]: 'Human master with AI remix',
  [HUMAN_ONLY]: 'No AI involvement'
};

/**
 * Which human contributions the Copyright Office has said can carry a claim.
 * Used to build the "Author Created" field of an application.
 */
const HUMAN_CONTRIBUTIONS = {
  LYRICS: 'lyrics',
  MELODY: 'melody',
  CHORD_PROGRESSION: 'chord-progression',
  PERFORMANCE: 'vocal-or-instrumental-performance',
  SUBSTANTIVE_EDITS: 'substantive-edits-to-generated-audio',
  SELECTION_AND_SEQUENCE: 'selection-and-sequencing'
};

/** Contributions that are authorship of the COMPOSITION (the written work). */
const COMPOSITION_CONTRIBUTIONS = [
  HUMAN_CONTRIBUTIONS.LYRICS,
  HUMAN_CONTRIBUTIONS.MELODY,
  HUMAN_CONTRIBUTIONS.CHORD_PROGRESSION
];

/** Contributions that are authorship of the SOUND RECORDING (the fixed performance). */
const RECORDING_CONTRIBUTIONS = [
  HUMAN_CONTRIBUTIONS.PERFORMANCE,
  HUMAN_CONTRIBUTIONS.SUBSTANTIVE_EDITS
];

/**
 * The disclosure recorded against a record.
 *
 * Returns null when nothing is stored. NOT defaulted to SYNTHETIC, tempting as that
 * is for this catalogue: an unstated provenance is unknown, and writing a guess into
 * a field that feeds a federal application is worse than an empty one a human has to
 * resolve.
 */
function aiDisclosureOf(record) {
  if (!record || typeof record !== 'object') return null;
  const value = record.aiDisclosure || record.aiAttribution || null;
  return ALL_DISCLOSURES.includes(value) ? value : null;
}

/** Human label for a disclosure, falling back to the raw value so an unknown tag is
 *  visible rather than blank. */
function disclosureLabel(disclosure) {
  return DISCLOSURE_LABELS[disclosure] || disclosure || 'Undisclosed';
}

/** Is this record's provenance stated at all? The PRD makes disclosure mandatory at
 *  ingestion, so this is the check an upload gate should run. */
function hasDisclosure(record) {
  return aiDisclosureOf(record) !== null;
}

/**
 * What a registration application could claim, and what it must disclaim.
 *
 * Returns the two copyrights separately, because they are separate applications and
 * AI can affect them independently.
 *
 * @param {object} record - may carry `humanContributions: string[]`
 * @returns {{
 *   disclosure: string|null,
 *   composition: {registrable: boolean, claim: string[], reason: string},
 *   soundRecording: {registrable: boolean, claim: string[], reason: string},
 *   mustDisclaim: boolean
 * }}
 */
function registrationClaim(record) {
  const disclosure = aiDisclosureOf(record);
  const stated = Array.isArray(record && record.humanContributions)
    ? record.humanContributions
    : [];

  const claimed = (allowed) => stated.filter((c) => allowed.includes(c));

  if (disclosure === null) {
    const reason = 'provenance not disclosed; cannot build a claim';
    return {
      disclosure: null,
      composition: { registrable: false, claim: [], reason },
      soundRecording: { registrable: false, claim: [], reason },
      mustDisclaim: false
    };
  }

  if (disclosure === HUMAN_ONLY) {
    return {
      disclosure,
      composition: { registrable: true, claim: claimed(COMPOSITION_CONTRIBUTIONS), reason: 'no AI material' },
      soundRecording: { registrable: true, claim: claimed(RECORDING_CONTRIBUTIONS), reason: 'no AI material' },
      mustDisclaim: false
    };
  }

  if (disclosure === SYNTHETIC) {
    // The Office's position applied directly: no meaningful human authorship means
    // nothing to protect. Prompting does not change this, however detailed.
    const reason = 'fully AI-generated; no meaningful human authorship to claim';
    return {
      disclosure,
      composition: { registrable: false, claim: [], reason },
      soundRecording: { registrable: false, claim: [], reason },
      mustDisclaim: true
    };
  }

  if (disclosure === AI_ASSISTED) {
    const composition = claimed(COMPOSITION_CONTRIBUTIONS);
    return {
      disclosure,
      composition: {
        registrable: composition.length > 0,
        claim: composition,
        reason: composition.length
          ? 'human-authored written work; AI performance disclaimed'
          : 'no human composition contribution recorded'
      },
      soundRecording: {
        registrable: false,
        claim: [],
        reason: 'performance is AI-generated'
      },
      mustDisclaim: true
    };
  }

  // HUMAN_MASTER_AI_REMIX
  const recording = claimed(RECORDING_CONTRIBUTIONS);
  const composition = claimed(COMPOSITION_CONTRIBUTIONS);
  return {
    disclosure,
    composition: {
      registrable: composition.length > 0,
      claim: composition,
      reason: composition.length ? 'human-authored written work' : 'no human composition contribution recorded'
    },
    soundRecording: {
      registrable: recording.length > 0,
      claim: recording,
      reason: recording.length
        ? 'human performance; AI-generated additions disclaimed'
        : 'no human performance contribution recorded'
    },
    mustDisclaim: true
  };
}

/**
 * The compilation claim for a release.
 *
 * The Office treats "selection and ordering of AI-generated elements reflecting human
 * creative judgement" as protectable authorship. So an album of otherwise
 * unregistrable synthetic tracks can still carry a THIN compilation copyright in its
 * sequence. Thin, but real, and for a fully synthetic catalogue it may be the only
 * copyright there is -- which makes it worth asserting rather than overlooking.
 *
 * Requires more than one track: there is no selection in a set of one.
 */
function compilationClaim(release) {
  const trackCount = Number(release && (release.trackCount ?? (release.tracks || []).length)) || 0;
  const humanSequenced = !!(release && release.humanSequenced);

  if (trackCount < 2) {
    return { registrable: false, reason: 'a single track has no selection or ordering to claim' };
  }
  if (!humanSequenced) {
    return { registrable: false, reason: 'sequence not recorded as a human editorial decision' };
  }
  return {
    registrable: true,
    claim: [HUMAN_CONTRIBUTIONS.SELECTION_AND_SEQUENCE],
    reason: 'human selection and ordering of ' + trackCount + ' tracks',
    thin: true
  };
}

module.exports = {
  AI_DISCLOSURES,
  ALL_DISCLOSURES,
  DISCLOSURE_LABELS,
  HUMAN_CONTRIBUTIONS,
  COMPOSITION_CONTRIBUTIONS,
  RECORDING_CONTRIBUTIONS,
  SYNTHETIC,
  AI_ASSISTED,
  HUMAN_MASTER_AI_REMIX,
  HUMAN_ONLY,
  aiDisclosureOf,
  disclosureLabel,
  hasDisclosure,
  registrationClaim,
  compilationClaim
};
