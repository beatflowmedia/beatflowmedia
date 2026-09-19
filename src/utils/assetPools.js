// src/utils/assetPools.js
//
// Which catalogue a record belongs to. Single source.
//
// The PRD (§14) names the root problem: "the catalog is actually three distinct
// products for three distinct markets ... all being sold through the same
// undifferentiated storefront." §81: "Asset pool = sub-brand." §84: "Shared
// backend, independent surfaces."
//
// The primitive that makes one backend serve several storefronts is a
// DISCRIMINATOR -- a field saying which pool a record is in. There wasn't one. The
// only type-ish field in the whole songs collection was `fileType`, which is
// "audio/wav" on everything. Without it every reader has to INFER the pool, which
// is why 138 records with two different schemas and two different buyers were all
// rendered through the same grid.
//
// NAMES ARE THE INDUSTRY'S, NOT OURS. Percy asked for searchable vocabulary
// rather than invented labels, and these are the terms the licensing industry
// actually uses -- so they match what a buyer would search for, what a supervisor
// would call it, and what any future integration will expect.

/** Music written to be licensed into other people's media. The library-music trade
 *  calls this production music; Epidemic Sound and Artlist sell exactly this.
 *  Searchable metadata is the point: mood, bpm, loopable, platforms, territory. */
const PRODUCTION_MUSIC = 'production-music';

/** Fully-produced songs released as an artist -- front-line catalogue. Sync
 *  material for supervisors, not stock music for creators browsing by mood.
 *  Identified by release metadata: ISRC, UPC, track number, release date. */
const COMMERCIAL_RELEASE = 'commercial-release';

/** Music that does a job to the listener's nervous system rather than being
 *  listened to as a work: binaural, somatic, sleep, focus. PRD sub-brand #1. */
const FUNCTIONAL_MUSIC = 'functional-music';

/** Loops, one-shots and construction kits, sold as raw material. PRD's "sound
 *  packs". */
const SAMPLE_PACK = 'sample-pack';

const ASSET_POOLS = {
  PRODUCTION_MUSIC,
  COMMERCIAL_RELEASE,
  FUNCTIONAL_MUSIC,
  SAMPLE_PACK
};

const POOL_LABELS = {
  [PRODUCTION_MUSIC]: 'Production music',
  [COMMERCIAL_RELEASE]: 'Commercial release',
  [FUNCTIONAL_MUSIC]: 'Functional music',
  [SAMPLE_PACK]: 'Sample pack'
};

const ALL_POOLS = Object.values(ASSET_POOLS);

/**
 * Which pool a record is in.
 *
 * Reads the stored `assetPool` first, because a record's pool is a decision, not a
 * property to be re-derived on every render. The inference below exists only to
 * classify the records that predate the field, and it infers from the WRITER that
 * created them, which is the one thing that reliably differs:
 *
 *   ISRC + trackNumber + previewOnly   the station's catalog.js seeded it as part
 *                                      of a release -> commercial release
 *   mood / bpm / loopable              the upload path captured licensing metadata
 *                                      -> production music
 *
 * Returns null rather than guessing when neither holds. A wrong pool puts a record
 * in the wrong storefront in front of the wrong buyer, which is worse than an
 * unclassified record that a human has to look at.
 */
function assetPoolOf(record) {
  if (!record || typeof record !== 'object') return null;

  if (record.assetPool && ALL_POOLS.includes(record.assetPool)) return record.assetPool;

  const hasLicensingMetadata =
    record.mood != null || record.bpm != null || record.loopable != null;
  const hasReleaseMetadata =
    !!record.isrc && (record.trackNumber != null || record.previewOnly != null);

  // Release metadata is checked FIRST: the seeded records are the larger set and
  // the more confidently identified. A record with both is a release.
  if (hasReleaseMetadata) return COMMERCIAL_RELEASE;
  if (hasLicensingMetadata) return PRODUCTION_MUSIC;

  return null;
}

/** Human label for a pool, for UI. Falls back to the raw value rather than an
 *  empty string, so an unknown pool is visible instead of silently blank. */
function poolLabel(pool) {
  return POOL_LABELS[pool] || pool || 'Unclassified';
}

module.exports = {
  ASSET_POOLS,
  ALL_POOLS,
  POOL_LABELS,
  PRODUCTION_MUSIC,
  COMMERCIAL_RELEASE,
  FUNCTIONAL_MUSIC,
  SAMPLE_PACK,
  assetPoolOf,
  poolLabel
};
