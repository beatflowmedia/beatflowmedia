// services/transcode/monitoring.js
// Monitoring hooks for Transcoding & Packaging Agent
const Sentry = require('sentry-sdk');

function logJobStarted(jobId) {
  Sentry.captureMessage(`Transcode job started: jobId=${jobId}`);
}

function logJobCompleted(jobId, manifests) {
  Sentry.captureMessage(`Transcode job completed: jobId=${jobId}, manifests=${JSON.stringify(manifests)}`);
}

function logJobFailure(jobId, error) {
  Sentry.captureException(error, { jobId });
}

module.exports = { logJobStarted, logJobCompleted, logJobFailure };
