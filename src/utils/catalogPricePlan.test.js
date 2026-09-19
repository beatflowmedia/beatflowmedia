// Pins the catalogue repair decision.
//
// This is the only shared part of the two repair tools, and it is the part that
// decides what a buyer will be charged. The adapters around it are I/O; this is the
// judgement, so this is what gets asserted.

const {
  expectedSongPrice,
  expectedAlbumPrice,
  planCatalogPrices,
  describePlan
} = require('./catalogPricePlan');
const { SONG_PRICE, ALBUM_PRICE_CAP, calculateAlbumPrice } = require('./pricing');

const album = (id, trackCount, price) => ({ id, title: id, trackCount, ...(price === undefined ? {} : { price }) });
const song = (id, price) => ({ id, title: id, ...(price === undefined ? {} : { price }) });

describe('expectedAlbumPrice', () => {
  test('derives from the canonical rule, never from the stored value', () => {
    expect(expectedAlbumPrice(album('a', 10, 999999)).price).toBe(calculateAlbumPrice(10));
    expect(expectedAlbumPrice(album('a', 10)).price).toBe(ALBUM_PRICE_CAP);
  });

  test('refuses to price an album with no trackCount', () => {
    // calculateAlbumPrice(0) falls back to a single price, which is correct for a
    // DISPLAY fallback and wrong for a write -- it would stamp $1.99 onto an album
    // permanently and nothing downstream would ever flag it.
    const { price, problem } = expectedAlbumPrice(album('a', 0));
    expect(price).toBeNull();
    expect(problem).toMatch(/trackCount/);
    expect(expectedAlbumPrice({ id: 'a' }).price).toBeNull();
  });
});

describe('planCatalogPrices', () => {
  test('lists only what must change', () => {
    const plan = planCatalogPrices({
      songs: [song('right', SONG_PRICE), song('wrong', 2900)],
      albums: [album('right', 10, ALBUM_PRICE_CAP), album('wrong', 10, 1990)]
    });

    expect(plan.songs.map((c) => c.id)).toEqual(['wrong']);
    expect(plan.albums.map((c) => c.id)).toEqual(['wrong']);
    expect(plan.summary).toMatchObject({
      songsChecked: 2, songsWrong: 1, albumsChecked: 2, albumsWrong: 1, problems: 0
    });
  });

  test('treats a missing price as needing repair, not as correct', () => {
    // A missing field is not a zero and not "fine". Firestore excludes a document
    // from any query naming a field it lacks, so an unpriced record is invisible to
    // exactly the checks that would catch it.
    const plan = planCatalogPrices({ songs: [song('unpriced')], albums: [album('unpriced', 12)] });
    expect(plan.songs[0]).toMatchObject({ from: null, to: SONG_PRICE, fromText: '(unset)' });
    expect(plan.albums[0]).toMatchObject({ from: null, to: ALBUM_PRICE_CAP });
  });

  test('collects unpriceable albums as problems instead of guessing', () => {
    const plan = planCatalogPrices({ songs: [], albums: [album('noTracks', 0, 1990)] });
    expect(plan.albums).toHaveLength(0);
    expect(plan.problems).toHaveLength(1);
    expect(plan.problems[0]).toMatchObject({ kind: 'album', id: 'noTracks' });
  });

  test('is idempotent — replanning after a repair finds nothing', () => {
    const songs = [song('s', 2900)];
    const albums = [album('a', 19, 3781)];

    const first = planCatalogPrices({ songs, albums });
    expect(first.summary.songsWrong).toBe(1);
    expect(first.summary.albumsWrong).toBe(1);

    const repaired = {
      songs: songs.map((r) => ({ ...r, price: first.songs[0].to })),
      albums: albums.map((r) => ({ ...r, price: first.albums[0].to }))
    };
    const second = planCatalogPrices(repaired);
    expect(second.summary.songsWrong).toBe(0);
    expect(second.summary.albumsWrong).toBe(0);
  });

  test('repairs the real catalogue shape to the capped price', () => {
    // The live catalogue: 9-19 track albums all holding their old uncapped price.
    const albums = [9, 10, 11, 12, 19].map((n, i) => album('r' + i, n, n * SONG_PRICE));
    const plan = planCatalogPrices({ songs: [], albums });

    expect(plan.albums).toHaveLength(5);
    plan.albums.forEach((c) => {
      expect(c.to).toBe(ALBUM_PRICE_CAP);
      expect(c.to).toBeLessThan(c.from); // every one is a price REDUCTION
    });
  });

  test('tolerates empty input', () => {
    const plan = planCatalogPrices({});
    expect(plan.summary).toMatchObject({ songsChecked: 0, albumsChecked: 0, problems: 0 });
    expect(describePlan(plan)).toEqual([]);
  });
});

describe('describePlan', () => {
  test('renders a line per change, readable before approving a write', () => {
    const plan = planCatalogPrices({
      songs: [song('Honey Sky', 2900)],
      albums: [album('Unseen', 9, 1791), album('broken', 0, 100)]
    });
    const lines = describePlan(plan);

    expect(lines.some((l) => l.includes('Honey Sky') && l.includes('->'))).toBe(true);
    expect(lines.some((l) => l.includes('Unseen') && l.includes('9 tracks'))).toBe(true);
    expect(lines.some((l) => l.startsWith('  SKIP') && l.includes('broken'))).toBe(true);
  });
});

describe('expectedSongPrice', () => {
  test('is the canonical single price', () => {
    expect(expectedSongPrice()).toBe(SONG_PRICE);
  });
});
