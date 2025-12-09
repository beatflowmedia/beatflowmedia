// api/collector/events.js
// POST /api/collector/events
const express = require('express');
const router = express.Router();
const { collectEvent } = require('../../services/analytics/collector');

router.post('/events', (req, res) => {
  const events = Array.isArray(req.body) ? req.body : [req.body];
  events.forEach(collectEvent);
  res.json({ status: 'ok', received: events.length });
});

module.exports = router;
