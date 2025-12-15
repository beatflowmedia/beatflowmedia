import CoreEngine from "./CoreEngine";

export default class LegacyAudioEngine extends CoreEngine {
  constructor(audioElement) {
    super();
    if (!audioElement) {
      throw new Error("LegacyAudioEngine requires a valid HTMLAudioElement");
    }
    this.audio = audioElement;
  }

  load(track) {
    const src = track.audioUrl || track.streamUrl || `/music/${track.fileName}`;
    this.audio.src = src;
    this.audio.load();
  }

  play() {
    // Return the play promise to support awaiting in tests
    return this.audio.play().catch(console.error);
  }

  pause() {
    this.audio.pause();
  }

  seek(time) {
    this.audio.currentTime = time;
  }

  setVolume(volume) {
    this.audio.volume = volume;
  }

  onTimeUpdate(cb) {
    const handler = () => cb(this.audio.currentTime);
    this.audio.addEventListener("timeupdate", handler);
    return () => this.audio.removeEventListener("timeupdate", handler);
  }

  onDurationChange(cb) {
    const handler = () => cb(this.audio.duration);
    this.audio.addEventListener("loadedmetadata", handler);
    return () => this.audio.removeEventListener("loadedmetadata", handler);
  }

  onVolumeChange(cb) {
    const handler = () => cb(this.audio.volume);
    this.audio.addEventListener("volumechange", handler);
    return () => this.audio.removeEventListener("volumechange", handler);
  }

  onEnded(cb) {
    this.audio.addEventListener("ended", cb);
    return () => this.audio.removeEventListener("ended", cb);
  }
}
