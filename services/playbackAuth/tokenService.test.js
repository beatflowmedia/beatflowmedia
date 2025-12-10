// services/playbackAuth/tokenService.test.js
const { issuePlaybackToken } = require('./tokenService');

describe('Playback Token Service', () => {
  it('should issue a valid JWT and manifest URL', () => {
    const user = { id: 'user123', territory: 'US' };
    const assetId = 'track:abc123';
    const bitrate = '256';
    const result = issuePlaybackToken(user, assetId, bitrate);
    expect(result.jwt).toBeDefined();
    expect(result.manifestUrl).toContain(assetId);
  });

  it('should throw error if user or assetId missing', () => {
    expect(() => issuePlaybackToken(null, 'track:abc123', '256')).toThrow();
    expect(() => issuePlaybackToken({ id: 'user123' }, null, '256')).toThrow();
  });
});
