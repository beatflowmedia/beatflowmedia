// services/billing/ledgerService.int.test.js
const { recordPlay } = require('./ledgerService');

describe('Ledger Service Integration', () => {
  it('should record multiple play events', () => {
    recordPlay({ userId: 'user1', assetId: 'track:1', ts: Date.now(), playDuration: 120 });
    recordPlay({ userId: 'user2', assetId: 'track:2', ts: Date.now(), playDuration: 200 });
    // No error should be thrown
  });
});
