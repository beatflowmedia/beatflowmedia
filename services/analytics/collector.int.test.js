// services/analytics/collector.int.test.js
const { collectEvent } = require('./collector');

describe('Analytics Collector Integration', () => {
  it('should collect multiple events and not throw', () => {
    const events = [
      { event: 'playback_start', user_id: 'user1', asset_id: 'track:1', ts: Date.now(), session_id: 's1', playback_token_jti: 'j1', meta: {} },
      { event: 'play_pause', user_id: 'user1', asset_id: 'track:1', ts: Date.now(), session_id: 's1', playback_token_jti: 'j1', meta: {} }
    ];
    events.forEach(collectEvent);
  });
});
