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
    console.log('[LegacyAudioEngine] Loading track:', track);

    // Try to get secure signed URL if song has an ID
    if (track.id) {
      try {
        console.log('[LegacyAudioEngine] Fetching signed URL for song:', track.id);
        const { signedUrl } = await getSignedAudioUrl(track.id);
        console.log('[LegacyAudioEngine] Got signed URL, loading audio');

        return new Promise((resolve, reject) => {
          this._setupAudioLoad(signedUrl, resolve, reject);
        });
      } catch (error) {
        console.error('[LegacyAudioEngine] Error getting signed URL:', error);

        // If it's an auth/permission error, re-throw so UI can show proper message
        if (error.message?.includes('sign in') || error.message?.includes('Purchase required')) {
          throw error;
        }

        // For other errors, fall back to direct URL
        console.warn('[LegacyAudioEngine] Falling back to direct URL');
      }
    }

    // Fallback: Use direct URL from track data
    const src = track.audioUrl || track.streamUrl || `/music/${track.fileName}`;
    console.log('[LegacyAudioEngine] Loading audio from direct URL:', src);

    return new Promise((resolve, reject) => {
      this._setupAudioLoad(src, resolve, reject);
    });
  }

  _setupAudioLoad(src, resolve, reject) {
    // Pause current playback before loading new track to prevent stuttering
    this.audio.pause();

    // Store current time in case we need it
    // Removed unused: const wasPlaying

    // Add one-time event listeners
    const handleLoadedMetadata = () => {
      console.log('[LegacyAudioEngine] Metadata loaded successfully:', {
        duration: this.audio.duration,
        readyState: this.audio.readyState,
        src: this.audio.src
      });
      cleanup();
      resolve();
    };

    const handleError = (e) => {
      console.error('[LegacyAudioEngine] Audio loading error:', {
        error: e.target.error,
        code: e.target.error?.code,
        message: e.target.error?.message,
        networkState: this.audio.networkState,
        readyState: this.audio.readyState,
        src: this.audio.src
      });
      cleanup();
      reject(new Error(`Failed to load audio: ${e.target.error?.message || 'Unknown error'}`));
    };

    const handleCanPlay = () => {
      console.log('[LegacyAudioEngine] Audio can play:', {
        duration: this.audio.duration,
        readyState: this.audio.readyState
      });
    };

    const cleanup = () => {
      this.audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      this.audio.removeEventListener('error', handleError);
      this.audio.removeEventListener('canplay', handleCanPlay);
    };

    // Add event listeners
    this.audio.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
    this.audio.addEventListener('error', handleError, { once: true });
    this.audio.addEventListener('canplay', handleCanPlay, { once: true });

    // Set source and load
    // Only call load() if src has changed to avoid unnecessary buffering reset
    if (this.audio.src !== src) {
      this.audio.src = src;
      this.audio.load();
    } else {
      // Same source, just reset to beginning
      this.audio.currentTime = 0;
      resolve();
    }

    // Timeout after 15 seconds (increased from 10 for slower connections)
    setTimeout(() => {
      if (this.audio.readyState < 1) {
        console.warn('[LegacyAudioEngine] Load timeout - metadata not loaded after 15s');
        cleanup();
        reject(new Error('Audio loading timeout'));
      }
    }, 15000);
  }

  play() {
    console.log('[LegacyAudioEngine] play() called, readyState:', this.audio.readyState, 'src:', this.audio.src);
    // Return the play promise to support awaiting in tests
    return this.audio.play().catch((error) => {
      // Browser autoplay policy may block playback without user interaction
      if (error.name === 'NotAllowedError') {
        console.warn('[LegacyAudioEngine] Autoplay blocked by browser. User interaction required.');
      } else {
        console.error('[LegacyAudioEngine] Playback error:', error);
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
