// middleware/entitlementCheck.js
const { userCanPlay } = require('../services/billing/entitlementService');

function entitlementCheck(req, res, next) {
  const userId = req.user?.id;
  const assetId = req.body?.asset_id;
  if (!userCanPlay(userId, assetId)) {
    return res.status(403).json({ error: 'User not entitled to play this asset.' });
  }
  next();
}

module.exports = { entitlementCheck };
