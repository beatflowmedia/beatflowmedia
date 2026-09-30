// src/config/comingSoon.js
//
// Content types the platform intends to sell but has not launched.
//
// WHY THIS EXISTS
// The home page advertised Podcasts and Audiobooks chips, and /audiobooks sold
// "Audiobooks Access" at $12.99/month. Measured against the live database:
//
//   podcast_episodes   0 documents
//   audiobooks         0 documents
//
// and NOTHING in the repo writes to either collection. The repo already knew:
// purgeFirebase.js lists both with `// Not implemented`. So a cleanup script and a
// storefront disagreed about whether the product existed, and the storefront was the
// one customers could see.
//
// These are NOT deletion candidates -- they are planned. That is the whole reason this
// is a flag and not a `git rm`: a name that no longer matches the domain gets deleted,
// but a name that matches a domain we have not reached yet gets HIDDEN, so launching it
// is one edit rather than an archaeology exercise.
//
// TO LAUNCH ONE: delete its entry here. Nothing else gates it. Every surface that could
// show it reads this file, so there is no second list to remember -- which is exactly
// the failure that let a dead chip and a live price page coexist for months.
export const COMING_SOON = {
  podcasts: {
    label: 'Podcasts',
    collection: 'podcast_episodes'
  },
  audiobooks: {
    label: 'Audiobooks',
    collection: 'audiobooks',
    // The marketing page at /audiobooks quotes a real monthly price. It stays gated
    // until there is inventory to sell -- a price on screen is an offer, and an offer
    // the catalogue cannot fill is a different order of problem than an empty shelf.
    route: '/audiobooks'
  }
};

/** True when this content type has not launched yet and must not be offered. */
export const isComingSoon = (id) => Boolean(COMING_SOON[id]);

/** True when it has launched. The positive form, for surfaces that read better that way. */
export const hasLaunched = (id) => !COMING_SOON[id];
