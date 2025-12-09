// services/billing/ledgerService.test.js
const { recordPlay } = require('./ledgerService');

describe('Ledger Service', () => {
  it('should record a play event', () => {
    recordPlay({ userId: 'user123', assetId: 'track:abc123', ts: Date.now(), playDuration: 180 });
    // No error should be thrown
  });
});
