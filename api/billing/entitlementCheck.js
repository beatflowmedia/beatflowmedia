// api/billing/entitlementCheck.js
// POST /api/billing/entitlementCheck
const express = require('express');
const router = express.Router();
const { userCanPlay } = require('../../services/billing/entitlementService');

router.post('/entitlementCheck', (req, res) => {
  const { userId, assetId } = req.body;
  const entitled = userCanPlay(userId, assetId);
  res.json({ entitled });
});

module.exports = router;
