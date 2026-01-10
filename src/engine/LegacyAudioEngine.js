import CoreEngine from "./CoreEngine";
import { getSignedAudioUrl } from '../services/audioService';

export default class LegacyAudioEngine extends CoreEngine {
  constructor(audioElement) {
    super();
    if (!audioElement) {
      throw new Error("LegacyAudioEngine requires a valid HTMLAudioElement");
    }
    this.audio = audioElement;
  }

  async load(track) {
    try {
      // If track has a song ID, get secure signed URL
      if (track.id) {
        const { signedUrl } = await getSignedAudioUrl(track.id);
        this.audio.src = signedUrl;
      } else {
        // Fallback for tracks without IDs (local files, legacy)
        const src = track.audioUrl || track.streamUrl || `/music/${track.fileName}`;
        this.audio.src = src;
      }
      this.audio.load();
    } catch (error) {
      console.error('Error loading audio:', error);
      // Still try to load with original URL as fallback
      const src = track.audioUrl || track.streamUrl || `/music/${track.fileName}`;
      this.audio.src = src;
      this.audio.load();
    }
  }

  play() {
    // Return the play promise to support awaiting in tests
    return this.audio.play().catch((error) => {
      // Browser autoplay policy may block playback without user interaction
      if (error.name === 'NotAllowedError') {
        console.warn('Autoplay blocked by browser. User interaction required.');
      } else {
        console.error('Playback error:', error);
      }
      throw error; // Re-throw so caller can handle
    });
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
