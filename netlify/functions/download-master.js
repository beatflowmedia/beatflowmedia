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

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n')
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
    // Throws 422 when the record has no valid ISRC. Four test uploads are in that
    // state; they are not part of the seeded catalogue and have no lossless master.
    let key;
    try {
      key = masterObjectKey(song.isrc);
    } catch (err) {
      console.warn('[download-master] no ISRC for song', songId, song.title);
      return fail(err.statusCode || 422, err.message);
    }

    const cfg = r2Config();

    // ---- does the master actually exist? ----------------------------------
    // A valid ISRC is not a promise that a file was pushed. Ten records (all of
    // "The Best Nights Of Our Lives") have perfectly good ISRCs and no lossless
    // master anywhere -- masterObjectKey() cannot catch that, because there is
    // nothing wrong with the identifier. Handing out a signed URL anyway gives the
    // buyer a 404 AFTER paying, which is the one outcome this whole path exists to
    // prevent. One HEAD is cheap next to a refund.
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

    const filename = masterDownloadFilename(song.title, song.isrc);
    const url = presignGetObject({
      ...cfg,
      key,
      expiresIn: MASTER_URL_TTL_SECONDS,
      // Make the browser save it under a human name rather than the ISRC.
      responseContentDisposition: 'attachment; filename="' + filename + '"'
    });

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
