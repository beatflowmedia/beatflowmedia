// netlify/functions/redirect-isrc.js
//
// /r/<ISRC> -> the page for that recording.
//
// WHY A REDIRECT AND NOT A DIRECT LINK
// This exists for the licence QR codes on the Roku and Fire TV apps. A QR code is the
// one artefact here that cannot be recalled: the TV app regenerates it on every deploy,
// but a viewer can photograph it, and that photograph outlives the deploy, the app
// release, and any id we might change. So the code encodes a short URL WE control and
// can repoint forever, never a final destination.
//
// WHAT IT MUST NEVER ENCODE, and what the TV codes used to encode: a Firestore document
// id. `beatflowmediagroup.com/album/MKCJ3EB06UKgLkDrFroN` is an opaque key that changes
// if a record is ever re-imported, and a photographed URL pointing at a dead doc id is a
// URL nobody can fix. An ISRC is permanent by definition, is already the join key
// between the station and this catalogue (134 of 134 resolve), and means something to a
// human reading a support ticket.
//
// NEVER 404, which is the other half of the contract. A scanned code that dead-ends is
// worse than one that lands somewhere useful but imprecise, and a 404 on a URL that may
// be printed in a photograph is a permanent dead end. A removed record falls back to its
// album, then its artist, then the catalogue -- Percy's standing rule that a removed URL
// 301s to its closest live equivalent rather than simply 404ing.
//
// 301 rather than 302 on a hit: the mapping from an ISRC to its track page is permanent,
// and a 301 lets the destination accumulate the link signal instead of this hop. The
// FALLBACKS are 302, deliberately -- "this record is not available right now" is a
// temporary statement, and a cached-forever 301 would strand the ISRC on the album page
// even after the record came back.

const admin = require('firebase-admin');

const SITE = process.env.URL || 'https://beatflowmediagroup.com';

/** Unescape an env-encoded PEM. Same hazard as download-master.js: a `\n` -> `\n`
 *  no-op left the escapes in the key and firebase-admin threw at module load, so every
 *  request 502'd before any logic ran. Split/join rather than a regex on purpose. */
function unescapePem(value) {
  if (!value) return value;
  return value.split('\\n').join('\n');
}

function db() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: unescapePem(process.env.FIREBASE_PRIVATE_KEY)
      })
    });
  }
  return admin.firestore();
}

/**
 * An ISRC is 12 characters: 2-letter country, 3-char registrant, 2-digit year, 5-digit
 * designation. Validated before it reaches Firestore so that a scanner artefact or a
 * crawler probing /r/ cannot turn into a database read, and so the fallback for
 * "nonsense" is the same as for "unknown" rather than an error page.
 */
const ISRC_RE = /^[A-Z]{2}[A-Z0-9]{3}\d{2}\d{5}$/;

function normaliseIsrc(raw) {
  if (!raw) return null;
  const cleaned = String(raw).trim().toUpperCase().replace(/[\s-]/g, '');
  return ISRC_RE.test(cleaned) ? cleaned : null;
}

/**
 * Turn `?src=tv` into the analytics parameters the site reads.
 *
 * The whole point of accepting a short `src` and expanding it HERE is that the TV apps
 * ship a frozen string. The old codes baked `utm_medium=tv-license` into the QR itself,
 * which meant the attribution scheme was welded into an artefact that needs an app
 * release to change. Expanding server-side means we can change campaign naming whenever
 * we like and every code already in the wild follows.
 */
function attributionFor(src) {
  if (!src) return {};
  const known = {
    tv: { utm_source: 'beatflow-radio', utm_medium: 'tv', utm_campaign: 'tv-license-qr' }
  };
  return known[String(src).toLowerCase()] || { utm_source: String(src).slice(0, 40) };
}

function destination(path, params) {
  const url = new URL(path, SITE);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

function redirect(location, status) {
  return {
    statusCode: status,
    headers: {
      Location: location,
      // A permanent hop may be cached hard; a fallback must not be, or a record that
      // comes back stays stranded on its album page in every browser that saw it.
      'Cache-Control': status === 301 ? 'public, max-age=86400' : 'no-store',
      // This URL is a hop, not content. Keeps it out of the index even for a crawler
      // that reached it without consulting robots.txt.
      'X-Robots-Tag': 'noindex'
    },
    body: ''
  };
}

exports.handler = async (event) => {
  // `/r/QZMEQ2609273` -- take the last non-empty segment so the function works whether
  // it is reached through the redirect rule or called directly.
  const segments = (event.path || '').split('/').filter(Boolean);
  const raw = segments[segments.length - 1];
  const params = (event.queryStringParameters) || {};
  const attribution = attributionFor(params.src);

  const isrc = normaliseIsrc(raw);
  if (!isrc) {
    console.warn('[r] not an ISRC:', String(raw).slice(0, 40));
    return redirect(destination('/browse', attribution), 302);
  }

  let firestore;
  try {
    firestore = db();
  } catch (err) {
    // A credential failure must still land the viewer somewhere real. They scanned a
    // code off a television; an error page is the one outcome with no recovery.
    console.error('[r] firestore init failed:', err.message);
    return redirect(destination('/browse', attribution), 302);
  }

  try {
    const snap = await firestore
      .collection('songs')
      .where('isrc', '==', isrc)
      .limit(1)
      .get();

    if (!snap.empty) {
      const doc = snap.docs[0];
      const song = doc.data();

      // Not sellable -> its album. The viewer still gets the record in context and can
      // see what else is on it, which is the useful thing when this one is not for sale.
      const sellable = song.previewOnly !== true && song.price > 0;
      if (!sellable && song.albumId) {
        console.log('[r]', isrc, '-> album (not sellable)');
        return redirect(destination('/album/' + song.albumId, attribution), 302);
      }

      console.log('[r]', isrc, '-> song', doc.id, params.src ? '(src=' + params.src + ')' : '');
      return redirect(destination('/song/' + doc.id, attribution), 301);
    }

    // --- the record is gone -------------------------------------------------------
    // Album, then artist, then catalogue. Checked against the licences we have sold,
    // because a withdrawn record that someone holds a licence for still has an album
    // worth landing on.
    const licence = await firestore
      .collection('licenses')
      .where('isrc', '==', isrc)
      .limit(1)
      .get();

    if (!licence.empty) {
      const l = licence.docs[0].data();
      if (l.albumId) {
        console.log('[r]', isrc, '-> album (record withdrawn)');
        return redirect(destination('/album/' + l.albumId, attribution), 302);
      }
      if (l.artistId) {
        console.log('[r]', isrc, '-> artist (record withdrawn)');
        return redirect(destination('/artist/' + l.artistId, attribution), 302);
      }
    }

    console.log('[r]', isrc, '-> browse (unknown)');
    return redirect(destination('/browse', attribution), 302);
  } catch (err) {
    console.error('[r] lookup failed for', isrc, err.message);
    return redirect(destination('/browse', attribution), 302);
  }
};
