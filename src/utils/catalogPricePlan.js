// src/utils/catalogPricePlan.js
//
// What the catalogue's prices SHOULD be. Pure decision, no database.
//
// WHY THIS IS SPLIT OUT
// There are two ways to repair the catalogue -- from the browser as a signed-in
// platform admin (src/utils/fixCatalogPrices.js, client SDK) and from a terminal
// with a service account (scripts/fix-catalog-prices.js, firebase-admin). They use
// different SDKs with different call signatures, so they cannot share a function
// that reads and writes.
//
// They can, and must, share the part that DECIDES. Album pricing already existed in
// four independent copies in this codebase -- the station's scrape, the submission
// approver, an Album.js literal, and pricing.js itself -- and every one of them
// mispriced something. Writing a second copy of the repair rule while cleaning up
// the first four would be the same mistake with better intentions.
//
// So this module takes plain objects in and returns a plan. It touches no SDK, which
// also makes it the only part that is worth unit testing: the adapters are I/O, and
// this is the judgement.
//
// CommonJS so the Node script can require it. Webpack resolves named imports from
// CommonJS, so the browser adapter's `import` keeps working.

const { SONG_PRICE, calculateAlbumPrice, formatPrice } = require('./pricing');

/**
 * What a single song should cost. Every song is the same price; there is no
 * per-song pricing in the domain, which is why this takes no arguments beyond the
 * record and never consults anything on it except the current value.
 */
function expectedSongPrice() {
  return SONG_PRICE;
}

/**
 * What an album should cost, or why it cannot be priced.
 *
 * `trackCount` is the only input, and a missing one is a REFUSAL rather than a
 * guess. calculateAlbumPrice(0) deliberately falls back to a single price, which is
 * the right answer for a display fallback and the wrong answer for a write: it would
 * stamp $1.99 onto an album permanently, and nothing downstream would ever flag it.
 */
function expectedAlbumPrice(album) {
  const trackCount = Number(album && album.trackCount) || 0;
  if (!trackCount) {
    return { price: null, problem: 'no trackCount, cannot price it' };
  }
  return { price: calculateAlbumPrice(trackCount), trackCount, problem: null };
}

/** A record's display name, for a plan a human has to read before approving it. */
function labelOf(record) {
  return (record && (record.title || record.name)) || (record && record.id) || '(untitled)';
}

/** Current stored price, or null when the field is absent. Distinguishes a missing
 *  field from a zero, because they mean different things and Firestore treats a
 *  missing field as excluded from any query naming it. */
function storedPriceOf(record) {
  const p = record && record.price;
  return typeof p === 'number' && Number.isFinite(p) ? p : null;
}

/**
 * Build the full repair plan for a catalogue.
 *
 * @param {object} input
 * @param {Array<object>} input.songs  - song records, each `{ id, ...fields }`
 * @param {Array<object>} input.albums - album records, each `{ id, ...fields }`
 * @returns {{
 *   songs: Array<{id, label, from, to, fromText, toText}>,
 *   albums: Array<{id, label, trackCount, from, to, fromText, toText}>,
 *   problems: Array<{kind, id, label, reason}>,
 *   summary: {songsChecked, songsWrong, albumsChecked, albumsWrong, problems}
 * }}
 *
 * Returns only the records that need to CHANGE. A plan listing correct records
 * alongside incorrect ones is a plan nobody reads carefully.
 */
function planCatalogPrices(input) {
  const songs = (input && input.songs) || [];
  const albums = (input && input.albums) || [];

  const plan = { songs: [], albums: [], problems: [] };

  const expectedSong = expectedSongPrice();

  songs.forEach((song) => {
    const from = storedPriceOf(song);
    if (from === expectedSong) return;
    plan.songs.push({
      id: song.id,
      label: labelOf(song),
      from,
      to: expectedSong,
      fromText: from === null ? '(unset)' : formatPrice(from),
      toText: formatPrice(expectedSong)
    });
  });

  albums.forEach((album) => {
    const { price, trackCount, problem } = expectedAlbumPrice(album);
    if (problem) {
      plan.problems.push({
        kind: 'album',
        id: album.id,
        label: labelOf(album),
        reason: problem
      });
      return;
    }

    const from = storedPriceOf(album);
    if (from === price) return;

    plan.albums.push({
      id: album.id,
      label: labelOf(album),
      trackCount,
      from,
      to: price,
      fromText: from === null ? '(unset)' : formatPrice(from),
      toText: formatPrice(price)
    });
  });

  plan.summary = {
    songsChecked: songs.length,
    songsWrong: plan.songs.length,
    albumsChecked: albums.length,
    albumsWrong: plan.albums.length,
    problems: plan.problems.length
  };

  return plan;
}

/**
 * Render a plan as lines a human can check before approving a write.
 *
 * Kept here rather than in either adapter so the browser console and the terminal
 * show the SAME thing. A repair that reads differently depending on where it was run
 * is a repair nobody can confirm was the one they approved.
 */
function describePlan(plan) {
  const lines = [];

  plan.songs.forEach((c) => {
    lines.push(`  song   ${c.label}: ${c.fromText} -> ${c.toText}`);
  });

  plan.albums.forEach((c) => {
    lines.push(`  album  ${c.label} (${c.trackCount} tracks): ${c.fromText} -> ${c.toText}`);
  });

  plan.problems.forEach((p) => {
    lines.push(`  SKIP   ${p.kind} ${p.label}: ${p.reason}`);
  });

  return lines;
}

module.exports = {
  expectedSongPrice,
  expectedAlbumPrice,
  planCatalogPrices,
  describePlan
};
