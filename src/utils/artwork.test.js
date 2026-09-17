// Pins the precedence, because every bug this module exists to fix was a
// precedence disagreement between two components nobody compared side by side.

const { artworkUrl, isUsableImageRef } = require('./artwork');

const REMOTE = 'https://firebasestorage.googleapis.com/v0/b/x/o/songs%2Fcovers%2F1.jpg?alt=media';

describe('isUsableImageRef', () => {
  test('accepts things a browser can actually fetch', () => {
    expect(isUsableImageRef(REMOTE)).toBe(true);
    expect(isUsableImageRef('/images/Logo.png')).toBe(true);
    expect(isUsableImageRef('data:image/svg+xml,%3Csvg%3E')).toBe(true);
    expect(isUsableImageRef('//cdn.example.com/a.jpg')).toBe(true);
  });

  test('rejects a bare filename, which is what the ingestion path writes', () => {
    // ingestionService.js does `cover: coverFile.name`. Resolved against the
    // current route that 404s, and the real URL is in the next field along.
    expect(isUsableImageRef('art.jpg')).toBe(false);
    expect(isUsableImageRef('Say the Words.wav')).toBe(false);
    expect(isUsableImageRef('')).toBe(false);
    expect(isUsableImageRef('   ')).toBe(false);
    expect(isUsableImageRef(null)).toBe(false);
    expect(isUsableImageRef(undefined)).toBe(false);
    expect(isUsableImageRef(42)).toBe(false);
  });
});

describe('artworkUrl precedence', () => {
  test('coverUrl beats cover, because cover may not be a URL', () => {
    expect(artworkUrl({ cover: 'art.jpg', coverUrl: REMOTE })).toBe(REMOTE);
    expect(artworkUrl({ cover: '/images/Logo.png', coverUrl: REMOTE })).toBe(REMOTE);
  });

  test('falls through to cover when it is genuinely usable', () => {
    expect(artworkUrl({ cover: '/images/Logo.png' })).toBe('/images/Logo.png');
  });

  test('skips unusable values rather than returning them', () => {
    // The old readers would have returned "art.jpg" here and rendered a broken img.
    expect(artworkUrl({ cover: 'art.jpg', albumCover: REMOTE })).toBe(REMOTE);
  });

  test('a real catalogue document resolves to its cover', () => {
    // Shape as the station actually seeds it: coverUrl present, cover absent.
    const song = { id: 'x', title: 'Wildfire Heart', coverUrl: REMOTE, isrc: 'QZHN92644105' };
    expect(artworkUrl(song)).toBe(REMOTE);
  });

  test('always returns something renderable, never undefined', () => {
    for (const input of [null, undefined, {}, { cover: '' }, { cover: 'nope.jpg' }, 'not an object', 7]) {
      const out = artworkUrl(input);
      expect(typeof out).toBe('string');
      expect(out.startsWith('data:image/svg+xml,')).toBe(true);
    }
  });

  test('placeholder honours size and label', () => {
    const out = artworkUrl(null, { width: 56, height: 56, label: 'note' });
    expect(out).toContain('56');
    expect(decodeURIComponent(out)).toContain('note');
  });
});
