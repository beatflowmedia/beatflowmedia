# Transcoding & Packaging Agent

## Overview
Processes transcode jobs, creates multi-bitrate HLS/DASH manifests and segments for playback.

## Key Files
- `worker.js`: Handles job processing, transcode, packaging, and manifest generation.
- `packagerWrapper.js`: Wraps packaging tools (e.g. shaka-packager, bento4).

## API Contract
- `POST /api/ingest/submit-job`: Submits transcode job.
- `GET /api/ingest/status/:jobId`: Returns job status and manifest URLs.

## Monitoring
- Track job status, failures, and segment generation times.
- Alert on job failures or slow processing.

## Testing
- Integration: submit job, verify manifest and segment outputs.
