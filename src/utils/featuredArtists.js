/**
 * Featured artists, derived from the track title.
 *
 * WHY DERIVED AND NOT STORED
 * --------------------------
 * 52 of the 138 tracks carry a credit like "Something (feat. SYNNE)". Four personas
 * appear across them: Lyle Carpenter, SYNNE, Adam Cetera and Dawn Calvin. Percy Rice
 * is the producer and album artist on every release; the personas are featured
 * artists, which is exactly how the releases are registered with the distributor.
 *
 * So the TITLE is the canonical record -- it is what was filed at distribution and
 * what the DSPs display. Adding a `featuring` field to Firestore would create a
 * second copy of a fact that already exists, free to drift from the title the moment
 * one is edited and the other is not. Deriving costs nothing and cannot disagree with
 * itself.
 *
 * The practical consequence this exists to fix: those personas are a public artist
 * identity -- someone finds a track as "SYNNE" on Spotify or the radio -- but in the
 * store they were plain text inside a title. Searchable, because search matches on
 * title, but not navigable: no page, no filter, nothing to click. 38% of the
 * catalogue had an identity the storefront could not be browsed by.
 *
 * TOLERANT ON PURPOSE
 * -------------------
 * Every credit in the catalogue today is the single form "(feat. Name)". The parser
 * accepts ft./featuring, square brackets, and multiple names separated by comma,
 * ampersand or "and" anyway -- not speculative generality, but because the next track
 * is typed by a person, and a credit that silently fails to parse produces a page
 * that is quietly missing a track rather than an error anyone would notice.
 */

// Matches "(feat. X)" / "[ft. X]" / "(featuring X)", capturing the names inside.
//
// LONGEST ALTERNATIVE FIRST. Regex alternation is first-match-wins, not
// longest-match-wins, so `feat\.?|ft\.?|featuring` matched "feat" inside "featuring"
// and then began capturing at "uring Dawn Calvin". Ordering featuring ahead of feat
// is the whole fix, and it is invisible unless you test the variant.
const FEATURE_PATTERN = /[([]\s*(?:featuring|feat\.?|ft\.?)\s*([^)\]]+)[)\]]/gi;

// Splits "A, B & C" or "A and B" into separate names.
const NAME_SEPARATOR = /\s*(?:,|&|\band\b)\s*/i;

/**
 * Every featured artist named in a title, in order, de-duplicated.
 * Returns [] for a title with no credit.
 */
export function parseFeaturedArtists(title) {
  const text = String(title || '');
  const found = [];

  // matchAll would be cleaner but the regex is stateful with /g, so reset it: a
  // module-level regex with /g carries lastIndex between calls and would skip
  // matches on every other invocation.
  FEATURE_PATTERN.lastIndex = 0;
  let match = FEATURE_PATTERN.exec(text);
  while (match) {
    match[1]
      .split(NAME_SEPARATOR)
      .map((name) => name.trim())
      .filter(Boolean)
      .forEach((name) => {
        if (!found.some((existing) => existing.toLowerCase() === name.toLowerCase())) {
          found.push(name);
        }
      });
    match = FEATURE_PATTERN.exec(text);
  }

  return found;
}

/** The title with its featured credit removed, for places that show the credit separately. */
export function titleWithoutFeature(title) {
  FEATURE_PATTERN.lastIndex = 0;
  return String(title || '')
    .replace(FEATURE_PATTERN, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * URL-safe form of an artist name.
 *
 * Deliberately lossy and matched back case-insensitively rather than stored: these
 * names are display strings, not identifiers, and there is no artists collection to
 * hold an id. "SYNNE" and "synne" must reach the same page.
 */
export function featuredArtistSlug(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Whether a title credits this artist, comparing on slug so case and spacing do not matter. */
export function titleFeatures(title, slug) {
  return parseFeaturedArtists(title).some((name) => featuredArtistSlug(name) === slug);
}

/**
 * Roll a list of songs up into the featured artists across them.
 * Returns [{ name, slug, count }], most credits first.
 */
export function collectFeaturedArtists(songs) {
  const byslug = new Map();

  (songs || []).forEach((song) => {
    parseFeaturedArtists(song && song.title).forEach((name) => {
      const slug = featuredArtistSlug(name);
      if (!slug) return;
      const existing = byslug.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        byslug.set(slug, { name, slug, count: 1 });
      }
    });
  });

  return [...byslug.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );
}
