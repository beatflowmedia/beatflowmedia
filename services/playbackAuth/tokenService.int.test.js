// services/playbackAuth/tokenService.int.test.js
const { issuePlaybackToken } = require('./tokenService');
const { userCanPlay } = require('../billing/entitlementService');

describe('Playback Token Integration', () => {
  it('should issue token only if user is entitled', () => {
    const user = { id: 'user123', territory: 'US' };
    const assetId = 'track:abc123';
    const bitrate = '256';
    if (userCanPlay(user.id, assetId)) {
      const result = issuePlaybackToken(user, assetId, bitrate);
      expect(result.jwt).toBeDefined();
    } else {
      expect(() => issuePlaybackToken(user, assetId, bitrate)).toThrow();
    }
  });
});
