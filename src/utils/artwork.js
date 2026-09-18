// src/utils/artwork.js
//
// ONE answer to "what is the artwork URL for this thing".
//
// Before this existed there were at least four answers in the codebase, and they
// disagreed in ways that were invisible until you compared two panes of the same
// screen:
//
//   NowPlayingBar   coverUrl -> cover           (worked)
//   SongPage        cover -> coverUrl           (worked by luck)
//   TrendingSongs   cover                       (broken for every song)
//   HomeStorefront  coverUrl -> cover -> albumCover
//
// Twelve components read `cover` and nothing else. No song document in the
// catalogue has a `cover` field -- all 138 carry `coverUrl` -- so those components
// render a placeholder for every track, for ever, and it looks like missing data
// rather than a missing fallback.
//
// WHY coverUrl WINS
// `cover` is not reliably a URL. src/services/ingestionService.js writes
// `cover: coverFile.name` -- a bare local filename like "art.jpg" -- so a reader
// that prefers `cover` can pick a string that can never resolve, while the correct
// URL sits in the next field along. Preferring `coverUrl` is not alphabetical
// taste; it is preferring the field whose contents are a URL.

const { getPlaceholderImage } = require('./placeholders');

// Ordered by how trustworthy the field is, not by how common it is.
const ARTWORK_KEYS = [
  'coverUrl',    // canonical: written by the catalogue seeder for every record
  'cover',       // legacy; MAY hold a bare filename, so never preferred
  'albumCover',
  'showCover',   // podcast episodes inherit the show's art
  'artworkUrl',
  'imageUrl',
  'profileImage',
  'image'
];

/**
 * A value is only usable as an <img src> if it is an absolute URL, a root-relative
 * path, or a data URI. A bare filename ("art.jpg") resolves against the current
 * route and 404s, which is the failure this guards.
 */
function isUsableImageRef(value) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v) return false;
  if (v.startsWith('data:')) return true;
  if (v.startsWith('http://') || v.startsWith('https://')) return true;
  if (v.startsWith('//')) return true;
  if (v.startsWith('/')) return true;
  return false;
}

/**
 * Artwork URL for a song, album, playlist or artist.
 *
 * Always returns something renderable: when no field holds a usable reference it
 * returns the inline data-URI placeholder, which cannot 404. Callers therefore do
 * not need their own `|| placeholder` tail, and should not add one -- that is how
 * the precedences drifted apart in the first place.
 *
 * @param {object|null|undefined} entity
 * @param {{width?: number, height?: number, label?: string}} [options]
 * @returns {string}
 */
function artworkUrl(entity, options = {}) {
  const { width = 300, height = 300, label = 'No Image' } = options;

  if (entity && typeof entity === 'object') {
    for (const key of ARTWORK_KEYS) {
      if (isUsableImageRef(entity[key])) return entity[key].trim();
    }
  }

  return getPlaceholderImage(width, height, label);
}

/**
 * onError handler for an <img>, so a URL that 404s degrades to the placeholder
 * instead of showing the alt text. Clears onerror first to avoid a loop if the
 * placeholder itself ever fails.
 */
function artworkFallback(options = {}) {
  const { width = 300, height = 300, label = 'No Image' } = options;
  return (event) => {
    const img = event && event.target;
    if (!img) return;
    img.onerror = null;
    img.src = getPlaceholderImage(width, height, label);
  };
}

module.exports = {
  artworkUrl,
  artworkFallback,
  isUsableImageRef,
  ARTWORK_KEYS
};
