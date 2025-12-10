// services/analytics/monitoring.js
// Monitoring hooks for Analytics Agent
const Sentry = require('sentry-sdk');

function logEventReceived(event) {
  Sentry.captureMessage(`Analytics event received: ${JSON.stringify(event)}`);
}

function logEventFailure(event, error) {
  Sentry.captureException(error, { event });
}

module.exports = { logEventReceived, logEventFailure };
