// api/ingest/status.js
// GET /api/ingest/status/:jobId
const express = require('express');
const router = express.Router();

// Dummy job status store
const jobStatusStore = {};

router.get('/status/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const status = jobStatusStore[jobId] || { status: 'unknown' };
  res.json(status);
});

module.exports = router;
