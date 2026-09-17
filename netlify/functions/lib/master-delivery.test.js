// Pins the two things in master delivery that fail SILENTLY if they drift:
// the signature arithmetic, and the object key both repos must agree on.

const { presignGetObject, encodePath } = require('./r2-presign');
const { masterObjectKey, masterDownloadFilename, isValidIsrc, normaliseIsrc } = require('./masters');

describe('SigV4 presigning', () => {
  // AWS's published example for query-string request authentication. If this
  // fails the implementation is wrong, whatever else passes -- R2 would simply
  // return 403 and the buyer would see "access denied" after paying.
  test('matches the AWS published test vector', () => {
    const url = presignGetObject({
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      endpoint: 'https://examplebucket.s3.amazonaws.com',
      bucket: null,
      key: 'test.txt',
      expiresIn: 86400,
      region: 'us-east-1',
      now: new Date(Date.UTC(2013, 4, 24, 0, 0, 0))
    });
    expect(url).toContain(
      'X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404'
    );
  });

  test('path style keeps the bucket in the path and preserves separators', () => {
    const url = presignGetObject({
      accessKeyId: 'AK', secretAccessKey: 'SK',
      endpoint: 'https://acct.r2.cloudflarestorage.com',
      bucket: 'bfmg-masters', key: 'masters/QZRP42560757.wav',
      expiresIn: 900, now: new Date(Date.UTC(2026, 8, 17))
    });
    expect(url).toContain('/bfmg-masters/masters/QZRP42560757.wav?');
  });

  test('a different key produces a different signature', () => {
    const base = {
      accessKeyId: 'AK', secretAccessKey: 'SK',
      endpoint: 'https://acct.r2.cloudflarestorage.com',
      bucket: 'b', expiresIn: 900, now: new Date(Date.UTC(2026, 8, 17))
    };
    const a = presignGetObject({ ...base, key: 'masters/AAAA00000001.wav' });
    const b = presignGetObject({ ...base, key: 'masters/AAAA00000002.wav' });
    expect(a).not.toEqual(b);
  });

  test('HEAD is signed differently from GET, so an existence probe is a real probe', () => {
    // download-master HEADs the object before releasing a URL. If HEAD reused the
    // GET signature the probe would be meaningless, or R2 would reject it and every
    // legitimate download would 502.
    const base = {
      accessKeyId: 'AK', secretAccessKey: 'SK',
      endpoint: 'https://acct.r2.cloudflarestorage.com',
      bucket: 'b', key: 'masters/QZRP42560757.wav',
      expiresIn: 60, now: new Date(Date.UTC(2026, 8, 17))
    };
    const get = presignGetObject(base);
    const head = presignGetObject({ ...base, method: 'HEAD' });
    expect(head).not.toEqual(get);
    expect(head).toContain('/b/masters/QZRP42560757.wav?');
  });

  test('refuses to sign without credentials rather than emitting a broken URL', () => {
    expect(() => presignGetObject({
      endpoint: 'https://x', key: 'k', expiresIn: 60
    })).toThrow(/credentials/);
  });

  test('encodes reserved characters AWS requires and encodeURIComponent misses', () => {
    expect(encodePath("/a b/c'd(e)")).toBe('/a%20b/c%27d%28e%29');
  });
});

describe('master object key', () => {
  test('derives from ISRC, normalising separators and case', () => {
    expect(masterObjectKey('QZRP42560757')).toBe('masters/QZRP42560757.wav');
    expect(masterObjectKey('qz-rp4-25-60757')).toBe('masters/QZRP42560757.wav');
  });

  test('refuses an absent or malformed ISRC instead of guessing a key', () => {
    // A guessed key is a 404 the buyer meets AFTER paying.
    expect(() => masterObjectKey('')).toThrow();
    expect(() => masterObjectKey(null)).toThrow();
    expect(() => masterObjectKey('NOPE')).toThrow();
    expect(() => masterObjectKey('QZRP4256075')).toThrow();  // 11 chars
    expect(() => masterObjectKey('QZRP425607577')).toThrow(); // 13 chars
  });

  test('ISRC validity matches the standard shape', () => {
    expect(isValidIsrc('USRC17607839')).toBe(true);
    expect(isValidIsrc('US-RC1-76-07839')).toBe(true);
    expect(isValidIsrc('1SRC17607839')).toBe(false); // country must be alpha
    expect(normaliseIsrc(' qz rp4 25 60757 ')).toBe('QZRP42560757');
  });

  test('download filename is filesystem-safe and carries the ISRC', () => {
    const name = masterDownloadFilename('Broke but Happy / Mix #2', 'QZRP42560757');
    expect(name).toBe('Broke but Happy  Mix 2 [QZRP42560757].wav');
    // Windows-illegal filename characters, listed rather than pattern-matched so
    // no escaping can quietly turn the assertion into a different one.
    const illegal = ['/', String.fromCharCode(92), ':', '*', '?', '"', '<', '>', '|'];
    illegal.forEach((ch) => expect(name).not.toContain(ch));
  });
});
