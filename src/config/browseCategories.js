// src/config/browseCategories.js
// Single source of truth for the /browse/:category pages (CategoryNav -> BrowseByCategory).
//
// Each entry:
//   title, description        — shown on the page header
//   match?(song) => boolean   — client-side predicate; omit for a facet LANDING page
//                               (mood/genre/usecase) which shows everything and is
//                               narrowed via sub-routes / the BrowseFilters sidebar.
//   soft?: true               — if `match` yields zero results, fall back to showing all.
//                               Used for aspirational facets whose song data isn't
//                               populated yet (so we never ship an empty storefront).
//
// FUTURE-PROOFING:
//  - Platform matching reads song.platforms — a field that doesn't exist on songs yet.
//    Until the uploader tags tracks (a `platforms` multi-select, like the existing
//    `mood` picker), `soft` keeps these pages showing all tracks. The day tracks are
//    tagged, filtering activates with zero code change here.
//  - At larger scale, client-side filtering can be swapped for server-side Firestore
//    `where` queries. Add { field, operator, value } to an entry and build the query
//    from it — the mapping stays centralized in this one file.

const hasPlatform = (song, platform) =>
  Array.isArray(song.platforms) && song.platforms.includes(platform);

// Shared platform options. `value` is the browse slug — so tags written by the
// uploader / admin editor always line up with the /browse/:slug routes below.
export const PLATFORM_OPTIONS = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
];

export const BROWSE_CATEGORIES = {
  // Facet landing pages — show everything; narrowing happens elsewhere.
  mood:    { title: 'Browse by Mood',     description: 'Find the perfect vibe for your content' },
  genre:   { title: 'Browse by Genre',    description: 'Explore music by style and genre' },
  usecase: { title: 'Browse by Use Case', description: 'Music curated for specific content types' },

  // Platform pages — filter to tracks tagged for that platform (soft until tagged).
  tiktok: {
    title: 'Music for TikTok',
    description: '7-15 second loops perfect for TikTok',
    match: (s) => hasPlatform(s, 'tiktok'),
    soft: true,
  },
  instagram: {
    title: 'Music for Instagram',
    description: 'Music optimized for Instagram Reels and Stories',
    match: (s) => hasPlatform(s, 'instagram'),
    soft: true,
  },
  youtube: {
    title: 'Music for YouTube',
    description: 'Tracks licensed for YouTube monetization',
    match: (s) => hasPlatform(s, 'youtube'),
    soft: true,
  },
};

export const getBrowseCategory = (slug) => BROWSE_CATEGORIES[slug] || null;
