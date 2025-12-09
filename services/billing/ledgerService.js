// services/billing/ledgerService.js
// Entitlement/Billing Agent: ledger for royalty/accounting
const ledger = [];

function recordPlay({ userId, assetId, ts, playDuration }) {
  ledger.push({ userId, assetId, ts, playDuration });
  // TODO: Persist to DB for royalty/accounting
}

module.exports = { recordPlay };
