// services/transcode/worker.int.test.js
const { processTranscodeJob } = require('./worker');

describe('Transcode Worker Integration', () => {
  it('should process job and output manifests for playback', () => {
    const job = {
      job_id: 'job2',
      asset_id: 'track:xyz789',
      source_url: 's3://uploads/xyz789/master.wav',
      bitrates: [128,256],
      segment_length_seconds: 2,
      outputs: {
        hls: 's3://origin/xyz789/hls/',
        dash: 's3://origin/xyz789/dash/'
      }
    };
    const result = processTranscodeJob(job);
    expect(result.status).toBe('completed');
    expect(result.manifests.hls).toContain('manifest.m3u8');
    expect(result.manifests.dash).toContain('manifest.mpd');
  });
});
