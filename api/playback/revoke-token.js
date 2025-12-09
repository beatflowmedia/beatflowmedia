// api/playback/revoke-token.js
// POST /api/playback/revoke-token
const express = require('express');
const router = express.Router();
const revokedTokens = new Set(); // In-memory store for demo; use DB in production

// Dummy auth middleware
function authMiddleware(req, res, next) {
  req.user = { id: 'user123' };
  next();
}

router.post('/revoke-token', authMiddleware, (req, res) => {
  const { playback_token } = req.body;
  if (!playback_token) {
    return res.status(400).json({ error: 'Missing playback_token' });
  }
  revokedTokens.add(playback_token);
  // TODO: Log audit event (user, token, timestamp)
  res.json({ revoked: true });
});

// Helper for token validation (to be used in license/token endpoints)
function isTokenRevoked(token) {
  return revokedTokens.has(token);
}

module.exports = { router, isTokenRevoked };
