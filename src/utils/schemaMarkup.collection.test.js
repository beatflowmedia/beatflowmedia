// src/utils/schemaMarkup.collection.test.js
//
// Structured data for a collection page.
//
// WHY THIS IS TESTED AND MOST MARKUP IS NOT
// CLAUDE.md's SEO section is blunt about the failure mode: markup must describe the page
// AS IT IS, and `aggregateRating` with no reviews, `FAQPage` with no FAQ or
// `VideoObject` with no video is structured-data spam that risks a manual action
// stripping rich results SITEWIDE. The blast radius of getting this wrong is every page,
// not this one.
//
// The second risk is cheaper to describe and just as real: `offers` is the figure a
// search engine shows in a result. A price here that checkout does not charge sends a
// buyer who was already sold to a page that asks for more.

const {
  generateCollectionSchema,
  generateAlbumSchema
} = require('./schemaMarkup');
const { calculateCollectionPrice } = require('./pricing');

const collection = {
  slug: 'deep-sleep',
  title: 'Deep Sleep',
  coverUrl: 'https://example.test/cover.jpg',
  assetPool: 'production-music',
  trackCount: 24
};

describe('generateCollectionSchema — what it says about the page', () => {
  const schema = generateCollectionSchema(collection, {
    priceCents: calculateCollectionPrice(24, 'production-music'),
    trackCount: 24
  });

  test('is a MusicAlbum at the collection URL, not the album URL', () => {
    // generateAlbumSchema hardcodes /album/<id>. A collection lives at
    // /collection/<slug>, and an @id pointing at a 404 is a page claiming to be
    // somewhere it is not.
    expect(schema['@type']).toBe('MusicAlbum');
    expect(schema.url).toBe('https://beatflowmediagroup.com/collection/deep-sleep');
    expect(schema['@id']).toBe(schema.url);
  });

  test('declares itself a COMPILATION, which is what it is', () => {
    // These are curated sets of library cues. Saying StudioAlbum would describe a
    // release that was never made.
    expect(schema.albumProductionType).toBe('https://schema.org/CompilationAlbum');
    expect(generateAlbumSchema({ id: 'x', title: 'y' }).albumProductionType)
      .toContain('StudioAlbum');
  });

  test('NO aggregateRating, NO review, NO FAQ — none of those are on the page', () => {
    // The one that protects every other page on the site. Four purchases and no reviews
    // exist; inventing a rating is the spam Google issues manual actions for.
    expect(schema.aggregateRating).toBeUndefined();
    expect(schema.review).toBeUndefined();
    expect(schema.mainEntity).toBeUndefined();
    expect(JSON.stringify(schema)).not.toMatch(/FAQPage|VideoObject|aggregateRating/);
  });

  test('the offer price is what checkout actually charges', () => {
    // Derived from the same function create-checkout prices with, so the two cannot
    // drift into a search result quoting a number the buyer is not charged.
    expect(schema.offers.price).toBe('189.00');
    expect(calculateCollectionPrice(24, 'production-music')).toBe(18900);
    expect(schema.offers.priceCurrency).toBe('USD');
    expect(schema.offers.availability).toBe('https://schema.org/InStock');
    expect(schema.offers.url).toBe(schema.url);
  });

  test('NO offers at all when the price is not known', () => {
    // The collection page prices from the DELIVERABLE track count, which arrives after
    // the grid loads. An `offers` block built on a guess is worse than none: it is the
    // figure shown in a result, and a buyer who clicks a wrong price arrives misled.
    const pending = generateCollectionSchema(collection, { trackCount: 24 });
    expect(pending.offers).toBeUndefined();
    expect(generateCollectionSchema(collection, { priceCents: 0 }).offers).toBeUndefined();
    expect(generateCollectionSchema(collection, { priceCents: NaN }).offers).toBeUndefined();
  });

  test('carries the track count and the cover a reader can see', () => {
    expect(schema.numTracks).toBe(24);
    expect(schema.image).toBe('https://example.test/cover.jpg');
    expect(schema.name).toBe('Deep Sleep');
  });

  test('attributes the collection to BFMG, which holds the masters', () => {
    expect(schema.byArtist['@type']).toBe('MusicGroup');
    expect(schema.byArtist.name).toBe('BeatFlow Media');
  });

  test('returns null rather than half a record for a collection it cannot identify', () => {
    // A schema missing its @id is invalid, and emitting one tells a crawler the page is
    // broken rather than that it is unannotated.
    expect(generateCollectionSchema(null)).toBeNull();
    expect(generateCollectionSchema({})).toBeNull();
    expect(generateCollectionSchema({ title: 'No slug' })).toBeNull();
  });

  test('the description mentions commercial use, since that is what is sold', () => {
    expect(schema.description).toMatch(/commercial/i);
  });
});
