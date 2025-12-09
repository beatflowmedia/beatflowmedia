// services/playbackAuth/monitoring.js
// Monitoring hooks for Playback Authorization Agent
const Sentry = require('sentry-sdk'); // Example, replace with actual Sentry setup

function logTokenIssued(userId, assetId, jwtId) {
  Sentry.captureMessage(`Token issued: user=${userId}, asset=${assetId}, jwtId=${jwtId}`);
}

function logTokenFailure(userId, assetId, error) {
  Sentry.captureException(error, { userId, assetId });
}

module.exports = { logTokenIssued, logTokenFailure };
