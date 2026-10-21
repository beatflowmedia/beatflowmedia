// src/data/blogPosts.js
//
// WHAT BLOG POSTS EXIST. The canonical list.
//
// WHY THIS EXISTS — THREE FILES, THREE DIFFERENT ANSWERS
//
// On 2026-10-21 the same blog had three descriptions of itself and no two agreed:
//
//   src/pages/Blog.js                      4 posts, the corrected titles
//   src/pages/BlogPost.js                  the bodies, keyed by slug
//   src/components/admin/BlogManager.js    3 posts, including one RETIRED that day and
//                                          one under the fabricated title "How
//                                          Independent Artists Are Earning $10K+
//                                          Monthly on BeatFlow"
//
// So the admin screen listed articles that no longer existed, under a headline that had
// already been removed for inventing an artist's income. Nothing reported the
// disagreement because each file looked internally consistent.
//
// The symptom showed up earlier the same day: correcting one post's title meant editing
// it in two places, and the second edit was missed -- Blog.js kept the excerpt
// "Discover how three independent artists turned their passion into a full-time income",
// describing people who do not exist, under a title that no longer mentioned them.
//
// METADATA HERE, BODIES IN BlogPost.js. A deliberate split rather than an oversight: the
// article bodies are thousands of lines of HTML and belong next to the component that
// renders them. What every surface needs -- which posts exist, what they are called,
// when they went out -- is small, shared, and is what was drifting.
//
// NO VIEW OR SHARE COUNTS, and that absence is the point. The removed versions carried
// views: 2847 and shares: 156 as literals, rendered to the public as "2,847 views" and
// to the admin as "4,370 Total Views". Nothing tracks a blog view -- BlogPost.js fires
// no analytics event of any kind -- so there is no number to carry. Adding `views: 0`
// would be worse than omitting it: 0 claims a measurement nobody took. See OPS-4SEC4.

/**
 * Every published post, newest first.
 *
 * `slug` is the id AND the URL. Changing one moves a page; a URL that moves loses
 * whatever it had, so treat these as fixed once published and use a 301 in
 * public/_redirects instead.
 */
const BLOG_POSTS = [
  {
    id: 'blog-001',
    slug: 'independent-artists-earning-10k-monthly',
    title: 'How to Make Money as an Independent Artist: The Real Income Streams',
    category: 'Guides',
    publishDate: '2026-01-01',
    readTime: '6 min',
    excerpt:
      'Where independent artist income actually comes from — streaming, sync licensing, ' +
      'direct sales and live — what each realistically pays, and which ones you control.',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=600&fit=crop'
  },
  {
    id: 'blog-003',
    slug: 'music-distribution-guide-2026',
    title: 'The Ultimate Guide to Music Distribution in 2026',
    category: 'Distribution Guide',
    publishDate: '2025-12-20',
    readTime: '8 min',
    excerpt:
      'Everything independent artists and labels need to know about modern music ' +
      'distribution, monetization, and maximizing reach.',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop'
  },
  {
    id: 'blog-005',
    slug: 'social-media-marketing-musicians',
    title: '10 Social Media Marketing Tips for Musicians',
    category: 'Marketing',
    publishDate: '2025-12-10',
    readTime: '7 min',
    excerpt:
      'Practical strategies for building an audience on social platforms, from someone ' +
      'who has to earn attention rather than buy it.',
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop'
  },
  {
    id: 'blog-006',
    slug: 'rise-of-independent-music-2026',
    title: 'Industry Trends: The Rise of Independent Music in 2026',
    category: 'Industry News',
    publishDate: '2025-12-05',
    readTime: '6 min',
    excerpt:
      'What changed to make independence viable, what it costs, and what the owner of a ' +
      'master actually controls that a signed artist does not.',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=600&fit=crop'
  }
];

/**
 * Posts retired on 2026-10-21, kept here so nothing re-adds them by accident.
 *
 * Neither could be made truthful by editing. One was a product announcement for an
 * analytics dashboard that has never existed; the other sold revenue strategy to
 * curators, a role removed from the platform. Both 301 in public/_redirects rather than
 * 404, because a URL that was crawled should go somewhere.
 */
const RETIRED_POSTS = {
  'new-analytics-dashboard-artists': {
    redirectTo: '/blog',
    why: 'Announced a dashboard that has never existed.'
  },
  'curators-maximize-playlist-revenue-2026': {
    redirectTo: '/blog/music-distribution-guide-2026',
    why: 'Curator revenue strategy; curators were removed from the platform.'
  }
};

/** Every category present, derived rather than listed, so a filter cannot offer an
 *  empty one. "All Posts" is prepended by the caller that needs it. */
const categoriesOf = (posts = BLOG_POSTS) =>
  [...new Set(posts.map((p) => p.category))].sort();

/** publishDate is an ISO string here so this module stays plain data; callers that need
 *  a Date construct one. A Date in a module-level constant is a mutable shared object. */
const asDate = (post) => new Date(post.publishDate);

module.exports = { BLOG_POSTS, RETIRED_POSTS, categoriesOf, asDate };
