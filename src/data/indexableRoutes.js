// src/data/indexableRoutes.js
//
// WHICH ROUTES BELONG IN THE SITEMAP. The canonical list.
//
// WHY THIS EXISTS
// public/sitemap-static.xml was hand-written in April 2026 against an earlier product
// and never revisited. On 2026-10-23 it listed 24 URLs and not one of them was a thing
// BFMG sells:
//
//   nine /studio/* pages      a stalled product
//   /legal /cookies /terms    the footer
//   /jobs /developers         hiring and docs
//   /investors /vendors       BOTH 301 -- a crawl-budget leak pointed at on purpose
//
// and it contained NO collection pages, NO songs, NO blog posts, and neither
// /browse/library nor /sync-licensing. Google was being told to crawl the terms of
// service and told nothing about the 23 collections that are for sale.
//
// A sitemap is never VISIBLY wrong. Nothing errors, Search Console reports "Success",
// and the only symptom is pages that quietly do not get indexed. That is why this is a
// reviewed list in code with a reconciler against it, rather than a file someone edits.
//
// THE RULE FOR BEING HERE: the page is public, it returns 200, and a stranger arriving
// from a search result would get something they wanted. Everything else is either
// Disallowed in robots.txt or simply not worth crawl budget.
//
// CLAUDE.md's SEO section is explicit that crawl budget is finite and that thin or
// auth-gated routes soak it up in place of real content. A sitemap is the strongest
// statement of what matters; listing the cookie policy beside the catalogue says they
// are equally important.

/**
 * `changefreq` and `priority` are hints, and weak ones -- Google has said for years it
 * largely ignores them. They are kept because they cost nothing and other crawlers do
 * read them, and because the ORDER of this list is the honest statement of what matters.
 */
const INDEXABLE_ROUTES = [
  // --- what BFMG sells. These come first because they are the point. -------------
  { path: '/', priority: 1.0, changefreq: 'weekly', why: 'The hub.' },
  // The PILLAR, and the only route above 0.9 besides the hub. CLAUDE.md asks for "a few
  // deep pillar pages (the definitive treatment of a core topic)" with hubs routing to
  // them; /browse/library and /sync-licensing both sat directly under Home with nothing
  // tying the licensing story together, which is a cluster with no centre.
  { path: '/commercial-music-licensing', priority: 0.9, changefreq: 'monthly', why: 'The pillar — what a commercial licence covers, costs, excludes, and how claims work. /browse/library and /sync-licensing link into it.' },
  { path: '/browse/library', priority: 0.9, changefreq: 'weekly', why: 'The production library hub — routes to every collection.' },
  { path: '/sync-licensing', priority: 0.9, changefreq: 'monthly', why: 'What a commercial licence covers, and the quote form for what is not self-serve.' },
  { path: '/browse', priority: 0.8, changefreq: 'weekly', why: 'Browse hub.' },
  { path: '/explore-premium', priority: 0.7, changefreq: 'monthly', why: 'Subscription tiers.' },

  // --- content ------------------------------------------------------------------
  { path: '/blog', priority: 0.8, changefreq: 'weekly', why: 'Blog index. Individual posts are added from src/data/blogPosts.js.' },
  { path: '/for-the-record', priority: 0.5, changefreq: 'monthly', why: 'Editorial.' },

  // --- who BFMG is. A buyer spending $319 checks these. --------------------------
  { path: '/about', priority: 0.6, changefreq: 'monthly', why: 'Credibility. A licence buyer wants to know who they are buying from.' },
  { path: '/contact', priority: 0.5, changefreq: 'yearly', why: 'The only published route to a person.' },
  { path: '/support', priority: 0.5, changefreq: 'monthly', why: 'Answers questions a buyer has before paying.' },

  // --- the documents a licence buyer actually reads ------------------------------
  //
  // Kept, unlike the rest of the footer, because they are load-bearing for this
  // product: /terms carries the licence a buyer accepts, and /changes is where a
  // superseded version stays readable, which is a promise /terms makes.
  { path: '/terms', priority: 0.6, changefreq: 'monthly', why: 'Carries the licence text a buyer accepts at checkout.' },
  { path: '/changes', priority: 0.4, changefreq: 'monthly', why: '/terms promises every superseded version stays readable. This is where.' }
];

/**
 * ROUTES DELIBERATELY NOT IN THE SITEMAP, with the reason.
 *
 * Recorded rather than simply absent, because an unexplained omission reads as an
 * oversight and gets "fixed" by the next person — the same discipline as the DOSI
 * ledger and the declined-trend notes.
 */
const EXCLUDED_ROUTES = {
  '/admin/*': 'Disallowed in robots.txt. Auth-gated; no search value.',
  '/downloads': 'Disallowed. A signed-in buyer\'s own files.',
  '/settings': 'Disallowed. Auth-gated.',
  '/profile': 'Disallowed. Auth-gated.',
  '/r/*': 'Disallowed. Licence QR short links; they 301 and exist for scanning, not reading.',
  '/verify/*': 'Disallowed. One page per licence — thin by nature and not for strangers.',
  '/purchase/success': 'A checkout callback. Indexing it would put a receipt page in search results.',
  '/purchase/cancelled': 'As above.',
  '/studio/*': 'The studio product is stalled. Nine URLs for something not selling is the crawl budget that should reach collections.',
  '/investors': 'Returns 301. A sitemap pointing at a redirect is a documented crawl-budget leak.',
  '/vendors': 'Returns 301, and the vendor segment has no product.',
  '/jobs': 'Hiring. Real, but not what BFMG wants found.',
  '/developers': 'No public API is offered yet.',
  '/legal': 'Superseded by /terms for anything a buyer needs.',
  '/cookies': 'Required to exist, not required to be found.',
  '/privacy-center': 'As above. /privacy-policy is the one that matters and is linked from every page.',
  '/search': 'A search results page. Indexing one is thin-content by definition.',
  '/favorites': 'Per-user.',
  '/playlists': 'Per-user.',
  '/debug-song-price': 'A developer tool that should probably not be routed at all.'
};

module.exports = { INDEXABLE_ROUTES, EXCLUDED_ROUTES };
