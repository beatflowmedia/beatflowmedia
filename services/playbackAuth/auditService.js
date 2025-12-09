// services/playbackAuth/auditService.js
// Simple audit log for playback token issuance
const auditLog = [];

function saveAudit({ userId, assetId, jwtId, expires }) {
  auditLog.push({ userId, assetId, jwtId, expires, ts: Date.now() });
  // TODO: Persist to DB in production
}

module.exports = { saveAudit };
