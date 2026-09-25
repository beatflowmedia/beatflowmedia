// netlify/functions/download-master.js
//
// Post-purchase delivery of a lossless master.
//
// THE PAYWALL IS HERE, AT THE BYTES. create-checkout refuses to take money for an
// undeliverable record; this refuses to hand over the file to someone who has not
// paid. They are different defences and the product needs both -- a checkout guard
// does nothing about a URL, and a signed URL does nothing about a bad charge.
//
// Auth is STRICT here, deliberately unlike create-checkout.js, which verifies an ID
// token when present and otherwise trusts `userId` from the request body. That is
// defensible for starting a payment (the worst case is a session nobody completes)
// and indefensible for releasing a file: a body-supplied uid would let anyone
// download anything by typing someone else's id.

const admin = require('firebase-admin');
const { presignGetObject } = require('./lib/r2-presign');
const { resolveMasterEntitlement } = require('./lib/entitlement');
const {
  masterObjectKey,
  masterDownloadFilename,
  MASTER_URL_TTL_SECONDS
} = require('./lib/masters');

/**
 * Turn an environment-encoded PEM back into a real one.
 *
 * This function used to do `.replace(/\n/g, '\n')` -- replacing a newline with a
 * newline, which is a no-op. The escaped sequences therefore survived into the key
 * and firebase-admin threw "Invalid PEM formatted message" at MODULE LOAD, so every
 * download returned a 502 before a single line of this file's logic ran. It had
 * never worked in production; nothing had exercised it because nothing was
 * deliverable. create-checkout.js has the correct `\\n` form, which is why that
 * function worked and this one did not.
 *
 * Written as split/join rather than a regex on purpose: the bug above is one
 * backslash, invisible in review, and it fails the same way again if anyone
 * "simplifies" this back to a RegExp. Both encodings are handled -- a value that
 * already contains real newlines passes through untouched.
 */
function unescapePem(value) {
  const ESCAPED_NEWLINE = String.fromCharCode(92) + 'n';
  return String(value || '').split(ESCAPED_NEWLINE).join('\n');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: unescapePem(process.env.FIREBASE_PRIVATE_KEY)
    })
  });
}
const db = admin.firestore();

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store'
};

const fail = (statusCode, message, extra) => ({
  statusCode,
  headers: JSON_HEADERS,
  body: JSON.stringify({ error: message, ...(extra || {}) })
});

/** Refuse loudly at boot rather than presigning with undefined and 403-ing later. */
function r2Config() {
  const cfg = {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    endpoint: process.env.R2_MASTERS_ENDPOINT,
    bucket: process.env.R2_MASTERS_BUCKET
  };
  const missing = Object.keys(cfg).filter((k) => !cfg[k]);
  if (missing.length) {
    const err = new Error('Master delivery is not configured: missing ' + missing.join(', '));
    err.statusCode = 503;
    throw err;
  }
  return cfg;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...JSON_HEADERS, 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
  }
  if (event.httpMethod !== 'POST') return fail(405, 'Method not allowed');

  try {
    // ---- identity: verified token only ------------------------------------
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return fail(401, 'Sign in to download your purchase.');
    }
    let userId;
    try {
      const decoded = await admin.auth().verifyIdToken(authHeader.slice(7));
      userId = decoded.uid;
    } catch (err) {
      return fail(401, 'Your session has expired. Sign in again.');
    }

    // ---- request ----------------------------------------------------------
    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch (err) { return fail(400, 'Malformed request body.'); }

    const songId = body.songId;
    if (!songId) return fail(400, 'songId is required.');

    // ---- the record -------------------------------------------------------
    const snap = await db.collection('songs').doc(songId).get();
    // 400 not 404: Netlify's redirect engine treats a function 404 as unhandled and
    // falls through to the SPA catch-all, so a 404 never reaches the client.
    if (!snap.exists) return fail(400, 'Track not found.');
    const song = snap.data();

    // ---- entitlement ------------------------------------------------------
    const entitlement = await resolveMasterEntitlement(db, userId, songId, song);
    if (!entitlement.entitled) {
      return fail(403, 'You have not licensed this track.');
    }

    // ---- locate the master ------------------------------------------------
    //
    // TWO BACKENDS, ONE CONTRACT. Both end in a short-lived signed URL for a file
    // the buyer has paid for; they differ only in where the bytes live.
    //
    //   masterPath  -> Firebase Storage. An explicit object path written onto the
    //                  record by scripts/link-masters.js. Preferred when present,
    //                  because an explicit pointer beats a derived one: it says
    //                  which file, not which file we would expect.
    //   isrc        -> Cloudflare R2 at masters/<ISRC>.wav, the seeded convention.
    //
    // The path is stored on a WORLD-READABLE record, which is safe only because
    // storage.rules restricts admin-uploads/** to isPlatformAdmin(). The path grants
    // nothing on its own; the signature does. If those rules are ever loosened, this
    // stops being safe and the field has to move.
    let key;
    let filename;
    let url;

    const storedPath = typeof song.masterPath === 'string' ? song.masterPath.trim() : '';
    // Which store the path refers to. Defaults to firebase so the 33 records linked
    // before R2 existed keep working without a backfill -- an absent discriminator
    // must never mean "guess", and firebase was the only possibility at the time.
    const backend = song.masterBackend === 'r2' ? 'r2' : 'firebase';

    if (storedPath && backend === 'r2') {
      // ---- Cloudflare R2, explicit path -------------------------------------
      // Distinct from the ISRC branch below: that DERIVES masters/<ISRC>.wav from a
      // convention, this uses a path something actually saw in the bucket. An
      // explicit pointer beats a derived one whenever both exist.
      key = storedPath;
      const ext = (storedPath.split('.').pop() || 'mp3').toLowerCase();
      filename = masterDownloadFilename(song.title, song.isrc).replace(/\.[a-z0-9]+$/i, '.' + ext);

      const cfg = r2Config();
      const probeUrl = presignGetObject({ ...cfg, key, expiresIn: 60, method: 'HEAD' });
      let probe;
      try {
        probe = await fetch(probeUrl, { method: 'HEAD' });
      } catch (err) {
        console.error('[download-master] R2 unreachable:', err.message);
        return fail(503, 'Downloads are temporarily unavailable. Please try again shortly.');
      }
      if (probe.status === 404) {
        console.warn('[download-master] no R2 object at', key, 'for', song.title);
        return fail(409, 'The master file for this track is not available yet.');
      }
      if (!probe.ok) {
        console.error('[download-master] R2 HEAD returned', probe.status, 'for', key);
        return fail(502, 'Could not prepare your download.');
      }

      url = presignGetObject({
        ...cfg,
        key,
        expiresIn: MASTER_URL_TTL_SECONDS,
        responseContentDisposition: 'attachment; filename="' + filename + '"'
      });
    } else if (storedPath) {
      // ---- Firebase Storage -------------------------------------------------
      key = storedPath;
      const ext = (storedPath.split('.').pop() || 'mp3').toLowerCase();
      filename = masterDownloadFilename(song.title, song.isrc).replace(/\.[a-z0-9]+$/i, '.' + ext);

      const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'beatflowmedia.firebasestorage.app';
      const file = admin.storage().bucket(bucketName).file(storedPath);

      // Same reasoning as the R2 HEAD below: a recorded path is not a promise the
      // object is still there. A 404 AFTER paying is the outcome this path exists
      // to prevent, and one existence check is cheap next to a refund.
      let exists = false;
      try {
        [exists] = await file.exists();
      } catch (err) {
        console.error('[download-master] storage unreachable:', err.message);
        return fail(503, 'Downloads are temporarily unavailable. Please try again shortly.');
      }
      if (!exists) {
        console.warn('[download-master] no object at', storedPath, 'for', song.title);
        return fail(409, 'The master file for this track is not available yet.');
      }

      try {
        [url] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + MASTER_URL_TTL_SECONDS * 1000,
          responseDisposition: 'attachment; filename="' + filename + '"'
        });
      } catch (err) {
        console.error('[download-master] could not sign', storedPath, err.message);
        return fail(502, 'Could not prepare your download.');
      }
    } else {
      // ---- Cloudflare R2 ----------------------------------------------------
      // Throws 422 when the record has no valid ISRC. Four test uploads are in that
      // state; they are not part of the seeded catalogue and have no lossless master.
      try {
        key = masterObjectKey(song.isrc);
      } catch (err) {
        console.warn('[download-master] no ISRC and no masterPath for song', songId, song.title);
        return fail(err.statusCode || 422, err.message);
      }

      const cfg = r2Config();

      // A valid ISRC is not a promise that a file was pushed. Records can have a
      // perfectly good identifier and no master anywhere -- masterObjectKey() cannot
      // catch that, because there is nothing wrong with the identifier.
      const probeUrl = presignGetObject({ ...cfg, key, expiresIn: 60, method: 'HEAD' });
      let probe;
      try {
        probe = await fetch(probeUrl, { method: 'HEAD' });
      } catch (err) {
        console.error('[download-master] master bucket unreachable:', err.message);
        return fail(503, 'Downloads are temporarily unavailable. Please try again shortly.');
      }
      if (probe.status === 404) {
        console.warn('[download-master] no master object at', key, 'for', song.title);
        return fail(409, 'A lossless master is not available for this track yet.');
      }
      if (!probe.ok) {
        console.error('[download-master] HEAD returned', probe.status, 'for', key);
        return fail(502, 'Could not prepare your download.');
      }

      filename = masterDownloadFilename(song.title, song.isrc);
      url = presignGetObject({
        ...cfg,
        key,
        expiresIn: MASTER_URL_TTL_SECONDS,
        // Make the browser save it under a human name rather than the ISRC.
        responseContentDisposition: 'attachment; filename="' + filename + '"'
      });
    }

    // ---- audit ------------------------------------------------------------
    // Non-fatal: a buyer who paid gets their file even if logging fails.
    try {
      await db.collection('downloads').add({
        userId,
        itemId: songId,
        itemType: 'song',
        itemName: song.title || null,
        isrc: song.isrc || null,
        objectKey: key,
        grantedVia: entitlement.via,
        licenseId: entitlement.licenseId,
        downloadedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (err) {
      console.warn('[download-master] audit write failed:', err.message);
    }

    return {
      statusCode: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        url,
        filename,
        expiresIn: MASTER_URL_TTL_SECONDS,
        expiresAt: new Date(Date.now() + MASTER_URL_TTL_SECONDS * 1000).toISOString(),
        grantedVia: entitlement.via
      })
    };
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error('[download-master]', err);
    return fail(status, status >= 500 ? 'Could not prepare your download.' : err.message);
  }
};
