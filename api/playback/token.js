// api/playback/token.js
// POST /api/playback/token
const express = require('express');
const router = express.Router();
const { issuePlaybackToken } = require('../../services/playbackAuth/tokenService');

// Dummy auth middleware (replace with real auth)
function authMiddleware(req, res, next) {
  req.user = { id: 'user123', territory: 'US' }; // stub
  next();
}

router.post('/token', authMiddleware, async (req, res) => {
  const { asset_id, bitrate } = req.body;
  try {
    const { jwt, manifestUrl } = issuePlaybackToken(req.user, asset_id, bitrate);
    res.json({ playback_token: jwt, expires_in: 60, manifest_url: manifestUrl });
  } catch (e) {
    res.status(403).json({ error: e.message });
  }
});

module.exports = router;
