// api/ingest/submit-job.js
// POST /api/ingest/submit-job
const express = require('express');
const router = express.Router();
const { processTranscodeJob } = require('../../services/transcode/worker');

router.post('/submit-job', async (req, res) => {
  const job = req.body;
  // TODO: Validate job payload
  try {
    const result = processTranscodeJob(job);
    res.json({ status: result.status, manifests: result.manifests });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
