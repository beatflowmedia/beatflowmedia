// netlify/functions/catalog-feed.js
//
// GET /api/catalog.json — what is licensable, at what price, under which license version.
//
// WHY IT EXISTS
// BeatFlow Radio needs `sellable` and `price` per recording to decide what to offer on
// its album pages and TV apps. It was holding its own copy, and that copy had drifted to
// 2900 cents ($29) — correct when `SONG_PRICE` was 2900, and a 14x overcharge after the
// move to $1.99. A copy that cannot reconcile is a second source of truth; this is the
// origin it reconciles to.
//
// PRICES ARE MINOR UNITS AND THE PAYLOAD SAYS SO IN THREE PLACES.
// `songs.price` is CENTS. 199 means $1.99. Rendered as dollars it reads $199 — a 100x
// overcharge on screen, and the kind of bug that hides because every value looks
// plausible either way. My own first draft of the station's interim file made exactly
// this mistake. So every entry carries `priceCents` (integer, authoritative) AND
// `priceDisplay` (a formatted string for anything a human sees), plus a top-level
// `priceUnits: "minor"`. A consumer that renders `priceDisplay` cannot get it wrong.
//
// (Note for anyone extending this: `purchases.price` in Firestore is in DOLLARS, unlike
// `songs.price` and `licenses.pricePaid` which are cents. Do not feed it into this.)
//
// SELLABLE IS DERIVED, NEVER A STORED FLAG THE CALLER TRUSTS.
// `previewOnly` means "cannot deliver" rather than "not permitted", and a record can
// carry a perfectly good ISRC with no master behind it. A buyer who pays and cannot
// download is worse than a record that was never listed, so `sellable` requires a price
// AND not-previewOnly AND a master key to exist.
//
// THE LICENSE VERSION IS INCLUDED DELIBERATELY. The station shows a link to /terms
// rather than copying the text, which is right — the text is changing. The version
// string lets a consumer detect that change instead of discovering it from a customer.

const admin = require('firebase-admin');
const { DOWNLOAD_LICENSE_SUMMARY } = require('../../src/utils/licenseTerms');
const {
  currentAgreementVersion,
  CURRENT_VERSIONS,
  DOWNLOAD_LICENSE
} = require('../../src/utils/agreements');

const SITE = process.env.URL || 'https://beatflowmediagroup.com';

/** Same PEM hazard as download-master.js: a `\n` -> `\n` replace is a no-op and leaves
 *  the escapes in the key, throwing at module load before any logic runs. */
function unescapePem(value) {
  return value ? value.split('\\n').join('\n') : value;
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

function money(cents) {
  return '$' + (Number(cents) / 100).toFixed(2);
}

exports.handler = async (event) => {
  if (event.httpMethod && event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const firestore = db();
    const snap = await firestore
      .collection('songs')
      .where('assetPool', '==', 'commercial-release')
      .get();

    const tracks = {};
    let sellableCount = 0;
    let skippedNoIsrc = 0;

    snap.forEach((doc) => {
      const song = doc.data();

      // No ISRC means no stable key, and this feed is keyed by ISRC. 27 records on three
      // undistributed albums are in that state; they are not licensable through here
      // until they go to distribution.
      if (!song.isrc) {
        skippedNoIsrc++;
        return;
      }

      const cents = Math.round(Number(song.price));
      const hasMaster = Boolean(song.masterPath || song.isrc);
      const sellable = song.previewOnly !== true && Number.isFinite(cents) && cents > 0 && hasMaster;
      if (sellable) sellableCount++;

      tracks[song.isrc] = {
        sellable,
        priceCents: Number.isFinite(cents) ? cents : null,
        priceDisplay: Number.isFinite(cents) ? money(cents) : null,
        currency: 'USD',
        title: song.title || null,
        artistName: song.artistName || song.artist || null,
        albumId: song.albumId || null,
        songId: doc.id,
        // The canonical link to license this recording. Short, permanent, repointable --
        // consumers should use this rather than building /song/<docId> themselves, which
        // is the opaque id that made the old TV QR codes unfixable.
        licenseUrl: SITE + '/r/' + song.isrc
      };
    });

    const body = {
      generatedAt: new Date().toISOString(),
      priceUnits: 'minor',
      priceUnitsNote: 'priceCents is CENTS. 199 = $1.99. Render priceDisplay, never priceCents.',
      currency: 'USD',
      counts: {
        total: Object.keys(tracks).length,
        sellable: sellableCount,
        skippedNoIsrc
      },
      license: {
        // Two different things that both look like "the agreement", and mixing them up
        // produced "[object Object]@null" on the first run of this feed:
        //   DOWNLOAD_LICENSE                     'download-license'  — the agreement KEY
        //   DOWNLOAD_LICENSE_SUMMARY.agreement   {scope,term,grant}  — the license SHAPE
        // And currentAgreementVersion() returns the full IDENTIFIER despite its name,
        // not the bare version, so CURRENT_VERSIONS is what gives the date alone.
        agreement: DOWNLOAD_LICENSE,
        version: CURRENT_VERSIONS[DOWNLOAD_LICENSE],
        // The exact string recorded on a purchase as `acceptedAgreement`
        // (e.g. "download-license@2026-10-15"), so a consumer can compare the two.
        identifier: currentAgreementVersion(DOWNLOAD_LICENSE),
        // scope / term / grant — what the license actually permits.
        shape: DOWNLOAD_LICENSE_SUMMARY.agreement,
        headline: DOWNLOAD_LICENSE_SUMMARY.headline,
        summary: DOWNLOAD_LICENSE_SUMMARY.summary,
        termsUrl: DOWNLOAD_LICENSE_SUMMARY.termsUrl,
        syncUrl: DOWNLOAD_LICENSE_SUMMARY.syncUrl,
        // Link, do not copy. The text is under revision -- a refund/chargeback
        // termination clause is being added -- so a snapshot taken today will be wrong
        // shortly. Watch `version` to know when.
        usage: 'Link to termsUrl. Do not copy summary text into another product; watch `version` for changes.'
      },
      tracks
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        // Public catalogue data, fetched at build time by the station and usable from a
        // browser. Nothing here is private: it is what the site already shows.
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
        // Not content. /api/ is already disallowed in robots.txt; this says the same
        // thing to a crawler that arrives without reading it.
        'X-Robots-Tag': 'noindex'
      },
      body: JSON.stringify(body, null, 2)
    };
  } catch (err) {
    console.error('[catalog-feed] failed:', err.message);
    // A consumer builds against this. An empty 200 would publish an empty catalogue and
    // silently unlist everything, so failures must be loud.
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ error: 'Catalogue feed temporarily unavailable' })
    };
  }
};
