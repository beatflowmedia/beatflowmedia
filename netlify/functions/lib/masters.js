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

module.exports = {
  MASTER_PREFIX,
  MASTER_EXTENSION,
  MASTER_URL_TTL_SECONDS,
  ISRC_PATTERN,
  normaliseIsrc,
  isValidIsrc,
  masterObjectKey,
  masterDownloadFilename
};
