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
// A NOTE ON `soft`, since it is the thing that hid a real problem for months:
// it was introduced so an untagged facet would never ship an empty storefront. What it
// actually did was make three platform pages indistinguishable from /browse/library
// while each carried a heading claiming it was narrowed. `soft` is honest for a facet
// whose data is *arriving*; it is a disguise for one whose data is never coming. Before
// adding it, check that the tags are on their way.
//
// FUTURE-PROOFING:
//  - At larger scale, client-side filtering can be swapped for server-side Firestore
//    `where` queries. Add { field, operator, value } to an entry and build the query
//    from it — the mapping stays centralized in this one file.

// Shared platform options for the uploader and the admin editor.
//
// These are KEPT even though only YouTube has a browse route. They describe what a track
// is suited to, which is real metadata worth recording now so it exists the day there
// are short edits to sell -- deleting the tags would mean re-adding them later and
// re-tagging from scratch.
//
// So `value` is no longer guaranteed to be a /browse/:slug route. It was, and the old
// comment here promised it; that promise is what made three routes exist for a field
// nothing populated. A tag is a description of the track, a route is a page we can fill.
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
  // The LIBRARY itself: everything licensable, unfaceted. This is the top-level
  // destination for someone who wants music for their own work, as distinct from
  // someone browsing Percy's releases. The facets below narrow it.
  library: {
    title: 'Production Library',
    description: 'Music to license for video, podcasts, ads and games',
    pool: ASSET_POOLS.PRODUCTION_MUSIC,
  },

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

  // THE PLATFORM PAGES ARE GONE -- all three of them.
  //
  // TikTok, Instagram and YouTube were `soft: true` filtering on song.platforms, a field
  // present on 0 of 562 library records, so each returned the identical set as
  // /browse/library. Three tabs, one answer -- the same fault as the All/Music chips on
  // the home page, three times over.
  //
  // TIKTOK AND INSTAGRAM: the catalogue cannot supply them, which no amount of tagging
  // fixes. Durations across the 562 production tracks:
  //
  //     < 15s      2        1-3 min   193
  //     15-30s    11        3-5 min   318
  //     30-60s     9        5+ min     29        loopable === true: 0
  //
  // 511 of 562 run 1-5 minutes. This library is beds and cues, not short-form hooks, so
  // "Music for TikTok" is a 2-track shelf however it is filtered.
  //
  // YOUTUBE WENT TOO, and keeping it briefly was an inconsistency worth recording. The
  // argument for removing the other two was that platform is not a property of a track;
  // a YouTube page with no `match` then has no way to differ from /browse/library except
  // its heading, which is the fault it was meant to escape. An argument that only
  // applies to two of three cases was not the real argument.
  //
  // RENAMING WAS CONSIDERED AND REJECTED. "Social Media" over the same unfiltered list
  // returns the same 562 tracks under a vaguer promise; filtering it honestly on
  // duration yields 22. A better word for a page that cannot answer its own question is
  // still a page that cannot answer it -- the I caveat, exactly: a name that no longer
  // matches the domain is a deletion candidate, not a rename candidate.
  //
  // The real control already exists and is honest: the duration facet in BrowseFilters,
  // derived from data that is actually present. These pages return when there are short
  // edits to sell, which is a product decision about cutting 15s and 30s versions, not a
  // browse bug. All three 301 to /browse/library in public/_redirects -- a removed URL
  // goes to its closest live equivalent rather than 404ing.
};

export const getBrowseCategory = (slug) => BROWSE_CATEGORIES[slug] || null;
