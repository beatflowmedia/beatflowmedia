// services/playbackAuth/tokenService.js
// Playback Authorization Agent: issues playback JWTs and logs audit
const jwt = require('jsonwebtoken');
const { saveAudit } = require('./auditService');
const PRIVATE_KEY = process.env.JWT_PRIVATE_KEY || 'dev_private_key';

function issuePlaybackToken(user, assetId, requestedBitrate) {
  // Entitlement check (stub, replace with real logic)
  if (!user || !assetId) throw new Error('Missing user or assetId');
  // TODO: Integrate with entitlementService.userCanPlay(user, assetId)

  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: 'beatflow-auth',
    sub: `user:${user.id}`,
    aud: 'beatflow-playback',
    asset_id: assetId,
    scopes: ['play'],
    territory: user.territory || 'US',
    exp: now + 60,
    nonce: require('crypto').randomUUID(),
  };
  const jwtToken = jwt.sign(claims, PRIVATE_KEY, { algorithm: 'HS256' });
  saveAudit({ userId: user.id, assetId, jwtId: claims.nonce, expires: claims.exp });
  return {
    jwt: jwtToken,
    manifestUrl: buildManifestURL(assetId, requestedBitrate),
  };
}

function buildManifestURL(assetId, bitrate) {
  // TODO: Replace with real CDN manifest URL logic
  return `https://cdn.example.com/track/${assetId}/manifest_${bitrate}.m3u8`;
}

module.exports = { issuePlaybackToken };
