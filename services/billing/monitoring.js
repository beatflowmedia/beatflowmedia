// services/billing/monitoring.js
// Monitoring hooks for Entitlement & Billing Agent
const Sentry = require('sentry-sdk');

function logEntitlementChecked(userId, assetId, entitled) {
  Sentry.captureMessage(`Entitlement checked: user=${userId}, asset=${assetId}, entitled=${entitled}`);
}

function logLedgerEntry(userId, assetId, playDuration) {
  Sentry.captureMessage(`Ledger entry: user=${userId}, asset=${assetId}, playDuration=${playDuration}`);
}

function logEntitlementError(userId, assetId, error) {
  Sentry.captureException(error, { userId, assetId });
}

module.exports = { logEntitlementChecked, logLedgerEntry, logEntitlementError };
