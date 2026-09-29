// src/config/browseCategories.js
import { ASSET_POOLS } from '../utils/assetPools';
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

// Which catalogue each browse surface serves.
//
// Browse is where someone LICENSES music for their own work, so it shows the library
// rather than the artist releases. Those live on the listening storefront, which is
// the same component asking for a different pool.
//
// The PRD calls this "shared backend, independent surfaces" (S84) -- one component,
// one query, the pool as the parameter. A second copy of the storefront per pool is
// how the two drift apart.
export const BROWSE_CATEGORIES = {
  // Facet landing pages — the library, narrowed further by the sidebar.
  mood:    { title: 'Browse by Mood',     description: 'Find the perfect vibe for your content', pool: ASSET_POOLS.PRODUCTION_MUSIC },
  genre:   { title: 'Browse by Genre',    description: 'Explore music by style and genre',       pool: ASSET_POOLS.PRODUCTION_MUSIC },
  usecase: { title: 'Browse by Use Case', description: 'Music curated for specific content types', pool: ASSET_POOLS.PRODUCTION_MUSIC },

  // Functional music is its own market -- wellness, clinics, focus and sleep apps --
  // and assetPools.js calls it PRD sub-brand #1. Mixing it into the production grid
  // buries the thing that differentiates this catalogue from a stock library.
  functional: {
    title: 'Focus, Sleep & Somatic',
    description: 'Music that does a job: focus, sleep, calm and somatic work',
    pool: ASSET_POOLS.FUNCTIONAL_MUSIC,
  },

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
