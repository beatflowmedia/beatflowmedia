// api/ingest/upload-init.js
// POST /api/ingest/upload-init
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Dummy auth middleware (replace with real auth)
function authMiddleware(req, res, next) {
  req.user = { id: 'user123' }; // stub
  next();
}

// Simulate resumable upload init
router.post('/upload-init', authMiddleware, (req, res) => {
  const { filename, filesize, mimetype } = req.body;
  if (!filename || !filesize || !mimetype) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  // Generate a job ID and upload URL (stub)
  const jobId = uuidv4();
  const uploadUrl = `/uploads/${jobId}/${filename}`; // Replace with real signed URL logic
  res.json({ uploadUrl, jobId });
});

module.exports = router;
