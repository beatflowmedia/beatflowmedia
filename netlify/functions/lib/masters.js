// netlify/functions/lib/masters.js
//
// THE CONTRACT FOR PAID MASTER DELIVERY. Single source.
//
// The station repo (C:/Users/percy/RadioStation/radio) reads THIS file rather than
// keeping its own copy of the key convention, the same way its catalog.js already
// reads BFMG's pricing.js and firebaseConfig.js. A second copy of a key convention
// is how one system starts writing objects the other cannot find while both look
// correct and nothing errors.
//
// WHY ISRC AND NOT THE AUDIO FILENAME
//   The station knows a record as `audio/WildFireHeart.mp3`; BFMG knows it as a
//   Firestore document id. Neither survives the other system being rewritten, and a
//   filename does not survive a re-cut (objects are immutable, so a re-cut needs a
//   new name). The ISRC is the only identifier here assigned by a standards body
//   rather than by one of the two platforms. catalog.js already joins on it, so
//   reusing it means there is ONE join key between these systems, not two that drift.
//
// WHY A SEPARATE, PRIVATE BUCKET
//   The station's bucket must be publicly readable: an <audio> element cannot
//   refresh a signed URL mid-record, so the streaming copy can never be gated. That
//   is correct for the station and fatal for a store. The same object cannot be both
//   freely streamable and paywalled, so there are two:
//
//     public  R2 -- 320k MP3s. Free, immutable, range-served. Station + previews.
//     private R2 -- lossless WAV masters. No public access. Presigned GET only.
//
//   Verified 2026-09-17: the public bucket returns HTTP 200 and the full
//   Content-Length for any master, with no credential. Anything placed there is
//   published, whatever Firestore says about it.

const MASTER_PREFIX = 'masters';
const MASTER_EXTENSION = 'wav';

// Long enough for a slow connection to start a ~60MB file, short enough that a
// leaked link is worthless by the time it is shared.
const MASTER_URL_TTL_SECONDS = 900; // 15 minutes

// ISRC: 2-letter country, 3-char registrant, 2-digit year, 5-digit designation.
// Stored and compared without separators.
const ISRC_PATTERN = /^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/;

function normaliseIsrc(isrc) {
  return String(isrc == null ? '' : isrc).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function isValidIsrc(isrc) {
  return ISRC_PATTERN.test(normaliseIsrc(isrc));
}

/**
 * Object key for a record's lossless master in the PRIVATE bucket.
 * Throws rather than returning a guess: a wrong key here is a 404 the buyer sees
 * after paying, which is worse than a refusal before.
 */
function masterObjectKey(isrc) {
  const normalised = normaliseIsrc(isrc);
  if (!isValidIsrc(normalised)) {
    const err = new Error('Record has no valid ISRC, so its master cannot be located.');
    err.statusCode = 422;
    throw err;
  }
  return MASTER_PREFIX + '/' + normalised + '.' + MASTER_EXTENSION;
}

/** Filename the buyer sees. Title is cosmetic; the ISRC is what makes it unique. */
function masterDownloadFilename(title, isrc) {
  const safe = String(title || 'master').replace(/[^A-Za-z0-9 ._-]/g, '').trim() || 'master';
  return safe + ' [' + normaliseIsrc(isrc) + '].' + MASTER_EXTENSION;
}

/**
 * Default Firebase Storage bucket, in one place rather than in every caller.
 *
 * READ LAZILY, and that is not a style choice. As a module-level constant it was
 * evaluated at require() time, which in the scripts is BEFORE lib/admin.js loads .env.
 * The name came out as the empty project id plus a suffix -- ".firebasestorage.app" --
 * an invalid bucket against which every existence probe is meaningless. A verifier
 * that writes, pointed at a bucket that cannot exist, is how a correction becomes the
 * next outage.
 */
function firebaseMasterBucket() {
  return process.env.FIREBASE_STORAGE_BUCKET
    || (process.env.FIREBASE_PROJECT_ID ? process.env.FIREBASE_PROJECT_ID + '.firebasestorage.app' : '')
    || 'beatflowmedia.firebasestorage.app';
}

/**
 * The R2 key a record's master SHOULD live at. One rule, so a migration and a lookup
 * cannot disagree about where a file was put.
 *
 * TWO KEY SHAPES, because the catalogue has two kinds of record:
 *
 *   masters/<ISRC>.<ext>       a commercial release. ISRC is an industry identifier
 *                              that already uniquely names the recording, and it
 *                              survives a re-import, a retitle and a re-encode.
 *   masters/id/<docId>.<ext>   everything else. 772 of the 834 Firebase-backed
 *                              masters are production-library cues with no ISRC and
 *                              never will have one -- they are not distributed.
 *
 * The Firestore document id is the right fallback precisely because it is opaque. The
 * paths being replaced were built from titles, which is how "What We Don't Say" became
 * `audio/What We Don&apos;t Say.mp3` -- an HTML entity encoded into a storage key,
 * pointing at a file that does not exist. A key derived from a display string inherits
 * every quoting bug that display string ever passes through.
 *
 * THE EXTENSION IS CARRIED, NOT ASSUMED. MASTER_EXTENSION is 'wav' and the catalogue's
 * masters are 822 mp3 to 12 wav, averaging 7.6MB -- a four-minute WAV is nearer 40MB.
 * Writing them all to `.wav` would put a false statement in the canonical key forever.
 *
 * @param {object} song   needs id, and isrc when it has one
 * @param {string} ext    real extension of the file being stored, without the dot
 */
function masterKeyFor(song, ext) {
  const clean = String(ext || '').replace(/^\./, '').toLowerCase() || MASTER_EXTENSION;
  const isrc = normaliseIsrc(song && song.isrc);
  if (isValidIsrc(isrc)) return MASTER_PREFIX + '/' + isrc + '.' + clean;
  if (!song || !song.id) {
    const err = new Error('Record has neither a valid ISRC nor an id; its master cannot be keyed.');
    err.statusCode = 422;
    throw err;
  }
  return MASTER_PREFIX + '/id/' + song.id + '.' + clean;
}

/**
 * WHERE A RECORD'S MASTER LIVES. The single answer to that question.
 *
 * WHY THIS EXISTS
 * The rule was implemented twice. download-master.js resolved a master from either
 * backend; verify-masters.js had its own version that knew only about R2 and ISRCs.
 * The verifier therefore judged every Firebase-backed record undeliverable, and
 * because it writes, it set previewOnly on 62 perfectly sellable tracks -- whole
 * albums turned "Preview only" on the storefront while their masters sat untouched in
 * admin-uploads/station-recovered/ and artist-uploads/full/.
 *
 * A guard that models the system differently from the code it guards does not just
 * miss faults. It invents them, and this one invented them with a write.
 *
 * So the resolution order is stated once, here, and both the delivery path and the
 * verifier read it. Adding a third backend is one edit, and nothing can be taught
 * about it in only half the places.
 *
 *   1. masterPath + masterBackend 'r2'  -> R2 at that exact key
 *   2. masterPath                       -> Firebase Storage at that exact path
 *   3. isrc                             -> R2 at masters/<ISRC>.wav, by convention
 *
 * An explicit pointer beats a derived one whenever both exist: it says WHICH file,
 * not which file we would expect. And an absent masterBackend means firebase, never
 * "guess" -- the records linked before R2 existed carry no discriminator, and that
 * was the only possibility at the time.
 *
 * @param {object} song
 * @returns {{backend:'r2'|'firebase', key:string, derived:boolean, bucket?:string}|null}
 *          null when the record names no master at all.
 */
function resolveMasterSource(song) {
  if (!song || typeof song !== 'object') return null;

  const storedPath = typeof song.masterPath === 'string' ? song.masterPath.trim() : '';
  const backend = song.masterBackend === 'r2' ? 'r2' : 'firebase';

  if (storedPath) {
    return backend === 'r2'
      ? { backend: 'r2', key: storedPath, derived: false }
      : { backend: 'firebase', key: storedPath, derived: false, bucket: firebaseMasterBucket() };
  }

  // No explicit pointer: fall back to the seeded convention, which needs a valid ISRC.
  if (!isValidIsrc(normaliseIsrc(song.isrc))) return null;
  return { backend: 'r2', key: masterObjectKey(song.isrc), derived: true };
}

module.exports = {
  MASTER_PREFIX,
  MASTER_EXTENSION,
  MASTER_URL_TTL_SECONDS,
  firebaseMasterBucket,
  ISRC_PATTERN,
  normaliseIsrc,
  isValidIsrc,
  masterObjectKey,
  masterDownloadFilename,
  masterKeyFor,
  resolveMasterSource
};
