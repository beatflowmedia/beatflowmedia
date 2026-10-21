// src/data/blogPosts.test.js
//
// THE CONSUMERS AND THE DATA MUST AGREE.
//
// WHY THIS EXISTS — THE SAME CRASH, TWICE IN TWO DAYS
//
// Removing fabricated view counts broke two screens, in the same way both times:
//
//   2026-10-21  BlogPost.js   "Cannot read properties of undefined (reading
//                             'toLocaleString')" — post.views was gone, the render
//                             still read it
//   2026-10-21  BlogManager   the identical error, from the per-post list, after the
//                             totals had already been fixed
//
// Deleting a field is easy to verify; finding everyone who READ it is not, and a render
// that reads a missing field does not fail at build, or at lint, or in any test that
// does not mount it. It fails as a white screen in front of whoever opened the page --
// which is how Percy found it, twice.
//
// So this does not mount anything. It reads the consumer SOURCE, extracts every
// `post.<field>` it touches, and asserts the canonical list provides it. That is cheap
// enough to run on every commit and it catches the exact class: a field removed from
// the data while something still renders it.

const fs = require('fs');
const path = require('path');

const { BLOG_POSTS, RETIRED_POSTS, categoriesOf, asDate } = require('./blogPosts');

const ROOT = path.join(__dirname, '..', '..');

// Every file that renders a post. Adding a consumer means adding it here, which is the
// point: a new screen reading this data gets the same guarantee.
const CONSUMERS = [
  'src/pages/Blog.js',
  'src/components/admin/BlogManager.js'
];

// Fields supplied by the consumer rather than the data module.
const SUPPLIED_AT_RENDER = ['status'];

// Not fields — array and string methods that happen to match the pattern.
const NOT_FIELDS = ['map', 'filter', 'length', 'slice', 'forEach', 'find'];

/** Strip comments so a note ABOUT a removed field is not read as a use of it. */
const stripComments = (text) => text
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('every field a consumer renders is provided by the data', () => {
  const provided = new Set([...Object.keys(BLOG_POSTS[0]), ...SUPPLIED_AT_RENDER]);

  CONSUMERS.forEach((rel) => {
    test(`${rel} reads nothing the posts do not have`, () => {
      const src = stripComments(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
      const used = [...new Set([...src.matchAll(/\bpost\.([a-zA-Z]+)/g)].map((m) => m[1]))]
        .filter((f) => !NOT_FIELDS.includes(f));

      const missing = used.filter((f) => !provided.has(f));
      // Named, not counted: "2 missing fields" sends someone hunting.
      expect(missing).toEqual([]);
    });
  });

  test('EVERY post has every field, not just the first', () => {
    // `provided` is derived from BLOG_POSTS[0]. If a later post is missing a field, the
    // consumer crashes on that post only -- which is worse than crashing on all of them,
    // because it looks like a content problem rather than a code one.
    const keys = Object.keys(BLOG_POSTS[0]);
    BLOG_POSTS.forEach((post) => {
      keys.forEach((k) => {
        expect(post[k]).toBeDefined();
      });
    });
  });
});

describe('the posts themselves', () => {
  test('slugs are unique — a slug is the URL', () => {
    const slugs = BLOG_POSTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test('no post uses a retired slug', () => {
    // Re-adding one would shadow its 301 and resurrect a page removed for being false.
    BLOG_POSTS.forEach((p) => {
      expect(Object.keys(RETIRED_POSTS)).not.toContain(p.slug);
    });
  });

  test('every retired post says where it goes and why', () => {
    Object.entries(RETIRED_POSTS).forEach(([slug, info]) => {
      expect(info.redirectTo).toMatch(/^\//);
      expect(typeof info.why).toBe('string');
      expect(info.why.length).toBeGreaterThan(20);
    });
  });

  test('NO VIEW OR SHARE COUNTS — nothing measures them', () => {
    // The fabricated figures that started all of this. Re-adding one is how "4,370
    // Total Views" comes back, and it would be read as a measurement.
    BLOG_POSTS.forEach((p) => {
      expect(p.views).toBeUndefined();
      expect(p.shares).toBeUndefined();
      expect(p.likes).toBeUndefined();
    });
  });

  test('publishDate is an ISO string, not a Date', () => {
    // A Date in a module-level constant is one mutable object every consumer shares;
    // anything calling setHours on it changes the date for the whole app. asDate()
    // builds a fresh one per caller.
    BLOG_POSTS.forEach((p) => {
      expect(typeof p.publishDate).toBe('string');
      expect(p.publishDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(asDate(p) instanceof Date).toBe(true);
      expect(Number.isNaN(asDate(p).getTime())).toBe(false);
    });
  });

  test('categories are derived from the posts, so none is ever empty', () => {
    // The hardcoded list offered five filters that returned nothing — Artist Tips,
    // Platform Updates, Success Stories, Music Marketing, Revenue Optimization.
    const cats = categoriesOf();
    cats.forEach((c) => {
      expect(BLOG_POSTS.some((p) => p.category === c)).toBe(true);
    });
    expect(cats).not.toContain('Platform Updates');
  });

  test('no post carries a fabricated earnings claim in its title or excerpt', () => {
    // The original headline was "How Independent Artists Are Earning $10K+ Monthly on
    // BeatFlow". A figure in a title implies a typical result, which is the regulated
    // part, and the names were people who do not exist.
    BLOG_POSTS.forEach((p) => {
      const text = `${p.title} ${p.excerpt}`;
      expect(text).not.toMatch(/\$[\d,]+K?\+?\s*(a|per|\/)\s*month/i);
      expect(text).not.toMatch(/Sarah Chen|Marcus Rodriguez|Luna Park/);
    });
  });
});
