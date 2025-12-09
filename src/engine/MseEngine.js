import CoreEngine from './CoreEngine';

// MSE-based playback engine for segmented streaming and future DRM
export default class MseEngine extends CoreEngine {
  constructor(audioElement, playbackToken = null) {
    super();
    if (!(audioElement instanceof HTMLAudioElement)) {
      throw new TypeError('MseEngine requires an HTMLAudioElement');
    }
    this.audio = audioElement;
    this.mediaSource = null;
    this.sourceBuffer = null;
    this.track = null;
    this.segmentIndex = 0;
    this.segmentDuration = 2;    // seconds per segment
    this.bufferAhead = 6;        // seconds to buffer ahead of playhead
    this.onTimeUnsub = null;
    this.playbackToken = playbackToken;
  }

  load(track) {
    // cleanup previous buffer and listeners
    if (this.mediaSource) {
      URL.revokeObjectURL(this.audio.src);
      if (this.onTimeUnsub) this.onTimeUnsub();
      this.mediaSource = null;
      this.sourceBuffer = null;
    }
    this.track = track;
    // Initialize MediaSource
    this.mediaSource = new MediaSource();
    this.audio.src = URL.createObjectURL(this.mediaSource);
    this.mediaSource.addEventListener('sourceopen', async () => {
      // create SourceBuffer with appropriate mime type
      const mime = 'audio/mp4; codecs="mp4a.40.2"';
      this.sourceBuffer = this.mediaSource.addSourceBuffer(mime);
      // load init segment then start buffering media segments
      await this._appendInitSegment();
      this._startBuffering();
    });
  }

  async _appendInitSegment() {
    // fetch and append init segment with JWT
    const base = this.track.streamUrl || `/music/${this.track.fileName}`;
    const initUrl = `${base}.init`;
    const resp = await fetch(initUrl, {
      headers: this.playbackToken ? { Authorization: `Bearer ${this.playbackToken}` } : {}
    });
    const data = await resp.arrayBuffer();
    await new Promise(resolve => {
      const onEnd = () => {
        this.sourceBuffer.removeEventListener('updateend', onEnd);
        resolve();
      };
      this.sourceBuffer.addEventListener('updateend', onEnd);
      this.sourceBuffer.appendBuffer(data);
    });
  }
  
  _startBuffering() {
    // begin segment buffering and subscribe to timeupdate
    this.segmentIndex = 0;
    this.onTimeUnsub = this.onTimeUpdate(() => this._scheduleBuffer());
    this._scheduleBuffer();
  }

  async _scheduleBuffer() {
    if (!this.sourceBuffer || this.sourceBuffer.updating) return;
    const cur = this.audio.currentTime;
    // find end of current buffered range
    let bufferedEnd = 0;
    for (let i = 0; i < this.audio.buffered.length; i++) {
      if (this.audio.buffered.start(i) <= cur && cur < this.audio.buffered.end(i)) {
        bufferedEnd = this.audio.buffered.end(i);
      }
    }
    const target = cur + this.bufferAhead;
    // append segments until bufferAhead achieved
    while (bufferedEnd < target) {
      bufferedEnd += this.segmentDuration;
      await this._appendSegment(this.segmentIndex++);
    }
  }

  async _appendSegment(idx) {
    const base = this.track.streamUrl || `/music/${this.track.fileName}`;
    const segUrl = `${base}.${idx}.aac`;
    const resp = await fetch(segUrl, {
      headers: this.playbackToken ? { Authorization: `Bearer ${this.playbackToken}` } : {}
    });
    const data = await resp.arrayBuffer();
    await new Promise(resolve => {
      const onEnd = () => {
        this.sourceBuffer.removeEventListener('updateend', onEnd);
        resolve();
      };
      this.sourceBuffer.addEventListener('updateend', onEnd);
      this.sourceBuffer.appendBuffer(data);
    });
  }

  play() {
    this.audio.play().catch(console.error);
  }

  pause() {
    this.audio.pause();
  }

  seek(time) {
    // MSE seek requires clearing buffer around new time
    this.audio.currentTime = time;
  }

  setVolume(volume) {
    this.audio.volume = volume;
  }

  onTimeUpdate(cb) {
    const handler = () => cb(this.audio.currentTime);
    this.audio.addEventListener('timeupdate', handler);
    return () => this.audio.removeEventListener('timeupdate', handler);
  }

  onDurationChange(cb) {
    const handler = () => cb(this.audio.duration);
    this.audio.addEventListener('durationchange', handler);
    return () => this.audio.removeEventListener('durationchange', handler);
  }

  onVolumeChange(cb) {
    const handler = () => cb(this.audio.volume);
    this.audio.addEventListener('volumechange', handler);
    return () => this.audio.removeEventListener('volumechange', handler);
  }

  onEnded(cb) {
    this.audio.addEventListener('ended', cb);
    return () => this.audio.removeEventListener('ended', cb);
  }
}
