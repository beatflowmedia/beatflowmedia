// services/transcode/worker.test.js
const { processTranscodeJob } = require('./worker');

describe('Transcode Worker', () => {
  it('should process a transcode job and return manifests', () => {
    const job = {
      job_id: 'job1',
      asset_id: 'track:abc123',
      source_url: 's3://uploads/abc123/master.wav',
      bitrates: [64,128,256,320],
      segment_length_seconds: 2,
      outputs: {
        hls: 's3://origin/abc123/hls/',
        dash: 's3://origin/abc123/dash/'
      }
    };
    const result = processTranscodeJob(job);
    expect(result.status).toBe('completed');
    expect(result.manifests.hls).toContain('manifest.m3u8');
    expect(result.manifests.dash).toContain('manifest.mpd');
  });
});
