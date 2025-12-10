// services/analytics/collector.test.js
const { collectEvent } = require('./collector');

describe('Analytics Collector', () => {
  it('should collect an event', () => {
    const event = {
      event: 'playback_start',
      user_id: 'user123',
      asset_id: 'track:abc123',
      ts: Date.now(),
      session_id: 'session1',
      playback_token_jti: 'jwtid',
      meta: { bitrate: '256', device: 'Chrome' }
    };
    collectEvent(event);
    // No error should be thrown
  });
});
