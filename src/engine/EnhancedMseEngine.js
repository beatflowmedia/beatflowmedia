import CoreEngine from "./CoreEngine";
import DrmEngine from "./DrmEngine";

/**
 * EnhancedMseEngine - MSE-based playback engine with EME (DRM) support
 *
 * Extends the original MseEngine to support encrypted content through:
 * - Encrypted Media Extensions (EME)
 * - Multi-DRM support (Widevine, PlayReady, FairPlay)
 * - Automatic license acquisition
 * - Secure content playback
 *
 * Maintains backward compatibility with unencrypted content
 */
export default class EnhancedMseEngine extends CoreEngine {
  constructor(audioElement, options = {}) {
    super();

    if (!(audioElement instanceof HTMLAudioElement)) {
      throw new TypeError("EnhancedMseEngine requires an HTMLAudioElement");
    }

    this.audio = audioElement;
    this.options = options;

    // MSE-related properties
    this.mediaSource = null;
    this.sourceBuffer = null;
    this.track = null;
    this.segmentIndex = 0;
    this.segmentDuration = 2; // seconds per segment
    this.bufferAhead = 6; // seconds to buffer ahead of playhead
    this.onTimeUnsub = null;

    // DRM-related properties
    this.drmEngine = null;
    this.isEncrypted = false;
    this.drmInfo = null;

    // Error handling
    this.onError = options.onError || this._defaultErrorHandler;
    this.onDrmError = options.onDrmError || this._defaultDrmErrorHandler;

    // Debug mode
    this.debug = options.debug || false;

    this._initializeDrmEngine();
  }

  /**
   * Initialize DRM engine if EME is supported
   */
  async _initializeDrmEngine() {
    if (DrmEngine.isEmeSupported()) {
      try {
        this.drmEngine = new DrmEngine({
          licenseServerUrl: this.options.licenseServerUrl,
          certificateUrl: this.options.certificateUrl,
          authToken: this.options.authToken,
          customHeaders: this.options.customHeaders,
          debug: this.debug,
          onLicenseRequestError: this.onDrmError,
          onKeyStatusChange: this._handleKeyStatusChange.bind(this)
        });

        this._log("DRM engine initialized successfully");
      } catch (error) {
        this._log("Failed to initialize DRM engine:", error);
        // Continue without DRM support for unencrypted content
      }
    } else {
      this._log("EME not supported, DRM disabled");
    }
  }

  /**
   * Load track with support for both encrypted and unencrypted content
   */
  async load(track) {
    this._log("Loading track:", track);

    // Cleanup previous session
    await this._cleanup();

    this.track = track;
    this.isEncrypted = this._isTrackEncrypted(track);
    this.drmInfo = track.drmInfo || null;

    this._log(`Track is ${this.isEncrypted ? "encrypted" : "unencrypted"}`);

    try {
      // Initialize DRM if content is encrypted
      if (this.isEncrypted && this.drmEngine) {
        await this._initializeDrmForTrack();
      }

      // Initialize MediaSource
      await this._initializeMediaSource();
    } catch (error) {
      this._log("Failed to load track:", error);
      this.onError(error);
      throw error;
    }
  }

  /**
   * Check if track requires DRM protection
   */
  _isTrackEncrypted(track) {
    return !!(track.encrypted || track.drmInfo || track.licenseUrl);
  }

  /**
   * Initialize DRM for encrypted content
   */
  async _initializeDrmForTrack() {
    if (!this.drmEngine || !this.drmInfo) {
      throw new Error("DRM engine not available or DRM info missing");
    }

    this._log("Initializing DRM for track");

    try {
      // Update DRM engine configuration if provided in track
      if (this.drmInfo.licenseServerUrl) {
        this.drmEngine.licenseServerUrl = this.drmInfo.licenseServerUrl;
      }
      if (this.drmInfo.authToken) {
        this.drmEngine.setAuthToken(this.drmInfo.authToken);
      }
      if (this.drmInfo.customHeaders) {
        this.drmEngine.setCustomHeaders(this.drmInfo.customHeaders);
      }

      // Initialize DRM for the audio element
      await this.drmEngine.initializeForMedia(this.audio, this.drmInfo);

      this._log("DRM initialized successfully for track");
    } catch (error) {
      this._log("DRM initialization failed:", error);
      throw new Error(`DRM initialization failed: ${error.message}`);
    }
  }

  /**
   * Initialize MediaSource for both encrypted and unencrypted content
   */
  async _initializeMediaSource() {
    this.mediaSource = new MediaSource();
    this.audio.src = URL.createObjectURL(this.mediaSource);

    return new Promise((resolve, reject) => {
      const onSourceOpen = async () => {
        this.mediaSource.removeEventListener("sourceopen", onSourceOpen);

        try {
          // Determine MIME type based on track format
          const mimeType = this._getMimeType();
          this._log("Using MIME type:", mimeType);

          // Create SourceBuffer
          this.sourceBuffer = this.mediaSource.addSourceBuffer(mimeType);

          // Setup SourceBuffer event listeners
          this._setupSourceBufferListeners();

          // Load initialization segment and start buffering
          await this._appendInitSegment();
          this._startBuffering();

          resolve();
        } catch (error) {
          this._log("MediaSource initialization failed:", error);
          reject(error);
        }
      };

      const onSourceError = (error) => {
        this.mediaSource.removeEventListener("error", onSourceError);
        this._log("MediaSource error:", error);
        reject(new Error("MediaSource initialization failed"));
      };

      this.mediaSource.addEventListener("sourceopen", onSourceOpen);
      this.mediaSource.addEventListener("error", onSourceError);
    });
  }

  /**
   * Get appropriate MIME type for the track
   */
  _getMimeType() {
    const track = this.track;

    // Check track-specific codec information
    if (track.mimeType) {
      return track.mimeType;
    }

    // Determine from file extension or format
    const format =
      track.format || track.fileName?.split(".").pop()?.toLowerCase();

    switch (format) {
      case "mp4":
      case "m4a":
      case "aac":
        return 'audio/mp4; codecs="mp4a.40.2"';
      case "webm":
        return 'audio/webm; codecs="opus"';
      case "ogg":
        return 'audio/ogg; codecs="vorbis"';
      default:
        // Default to MP4/AAC for encrypted content
        return 'audio/mp4; codecs="mp4a.40.2"';
    }
  }

  /**
   * Setup SourceBuffer event listeners
   */
  _setupSourceBufferListeners() {
    if (!this.sourceBuffer) return;

    this.sourceBuffer.addEventListener("error", (event) => {
      this._log("SourceBuffer error:", event);
      this.onError(new Error("SourceBuffer error occurred"));
    });

    this.sourceBuffer.addEventListener("abort", (event) => {
      this._log("SourceBuffer aborted:", event);
    });
  }

  /**
   * Append initialization segment (supports both encrypted and unencrypted)
   */
  async _appendInitSegment() {
    const base = this.track.streamUrl || `/music/${this.track.fileName}`;
    const initUrl = this.isEncrypted
      ? `${base}.encrypted.init`
      : `${base}.init`;

    try {
      this._log("Fetching init segment:", initUrl);
      const response = await this._fetchWithRetry(initUrl);
      const data = await response.arrayBuffer();

      await this._appendBufferWithPromise(data);
      this._log("Init segment appended successfully");
    } catch (error) {
      this._log("Failed to append init segment:", error);
      throw new Error(
        `Failed to load initialization segment: ${error.message}`,
      );
    }
  }

  /**
   * Start buffering media segments
   */
  _startBuffering() {
    this.segmentIndex = 0;
    this.onTimeUnsub = this.onTimeUpdate(() => this._scheduleBuffer());
    this._scheduleBuffer();
  }

  /**
   * Schedule buffer maintenance based on current playback position
   */
  async _scheduleBuffer() {
    if (!this.sourceBuffer || this.sourceBuffer.updating) return;

    const currentTime = this.audio.currentTime;
    const bufferedEnd = this._getBufferedEnd(currentTime);
    const targetBuffer = currentTime + this.bufferAhead;

    // Append segments until buffer target is reached
    while (bufferedEnd < targetBuffer && !this.sourceBuffer.updating) {
      try {
        await this._appendSegment(this.segmentIndex++);
        // Update bufferedEnd after successful append
        bufferedEnd = this._getBufferedEnd(currentTime);
      } catch (error) {
        this._log("Failed to append segment:", error);
        // Stop buffering on error to prevent infinite loop
        break;
      }
    }
  }

  /**
   * Get the end time of the buffered range containing current time
   */
  _getBufferedEnd(currentTime) {
    const buffered = this.audio.buffered;
    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= currentTime && currentTime < buffered.end(i)) {
        return buffered.end(i);
      }
    }
    return 0;
  }

  /**
   * Append media segment (supports both encrypted and unencrypted)
   */
  async _appendSegment(segmentIndex) {
    const base = this.track.streamUrl || `/music/${this.track.fileName}`;
    const segmentUrl = this.isEncrypted
      ? `${base}.encrypted.${segmentIndex}.m4s`
      : `${base}.${segmentIndex}.aac`;

    try {
      this._log(`Fetching segment ${segmentIndex}:`, segmentUrl);
      const response = await this._fetchWithRetry(segmentUrl);
      const data = await response.arrayBuffer();

      await this._appendBufferWithPromise(data);
      this._log(`Segment ${segmentIndex} appended successfully`);
    } catch (error) {
      this._log(`Failed to append segment ${segmentIndex}:`, error);
      throw error;
    }
  }

  /**
   * Fetch with retry logic for network resilience
   */
  async _fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response;
      } catch (error) {
        this._log(`Fetch attempt ${i + 1} failed for ${url}:`, error);
        if (i === retries - 1) throw error;
        await this._delay(1000 * Math.pow(2, i)); // Exponential backoff
      }
    }
  }

  /**
   * Promisify SourceBuffer.appendBuffer operation
   */
  _appendBufferWithPromise(data) {
    return new Promise((resolve, reject) => {
      const onUpdateEnd = () => {
        this.sourceBuffer.removeEventListener("updateend", onUpdateEnd);
        this.sourceBuffer.removeEventListener("error", onError);
        resolve();
      };

      const onError = (event) => {
        this.sourceBuffer.removeEventListener("updateend", onUpdateEnd);
        this.sourceBuffer.removeEventListener("error", onError);
        reject(new Error("SourceBuffer append failed"));
      };

      this.sourceBuffer.addEventListener("updateend", onUpdateEnd);
      this.sourceBuffer.addEventListener("error", onError);

      try {
        this.sourceBuffer.appendBuffer(data);
      } catch (error) {
        this.sourceBuffer.removeEventListener("updateend", onUpdateEnd);
        this.sourceBuffer.removeEventListener("error", onError);
        reject(error);
      }
    });
  }

  /**
   * Handle key status changes from DRM engine
   */
  _handleKeyStatusChange(keyId, status) {
    this._log(`Key status change: ${status}`);

    switch (status) {
      case "usable":
        this._log("Keys are ready for playback");
        break;
      case "expired":
        this._log("Keys have expired, requesting new license");
        this.onDrmError(new Error("DRM keys expired"));
        break;
      case "output-restricted":
        this._log("Output is restricted due to DRM policy");
        this.onDrmError(new Error("Playback restricted by DRM policy"));
        break;
      case "internal-error":
        this._log("Internal DRM error occurred");
        this.onDrmError(new Error("DRM internal error"));
        break;
      default:
        this._log(`Unknown key status: ${status}`);
    }
  }

  /**
   * Enhanced seek operation that handles encrypted content
   */
  seek(time) {
    this._log(`Seeking to ${time}s`);

    // For encrypted content, we may need to clear buffers and re-acquire licenses
    if (this.isEncrypted && this.sourceBuffer) {
      try {
        // Clear buffered ranges around seek point
        const buffered = this.audio.buffered;
        for (let i = 0; i < buffered.length; i++) {
          const start = buffered.start(i);
          const end = buffered.end(i);
          if (start < time && time < end) {
            // Clear buffer ranges that contain the seek point
            this.sourceBuffer.remove(start, end);
            break;
          }
        }
      } catch (error) {
        this._log("Buffer clear failed during seek:", error);
      }
    }

    this.audio.currentTime = time;

    // Restart buffering from new position
    if (this.sourceBuffer && !this.sourceBuffer.updating) {
      this.segmentIndex = Math.floor(time / this.segmentDuration);
      this._scheduleBuffer();
    }
  }

  /**
   * Get DRM information and status
   */
  getDrmInfo() {
    if (!this.drmEngine) {
      return { supported: false };
    }

    return {
      supported: true,
      systems: this.drmEngine.getSupportedSystems(),
      currentSystem: this.drmEngine.selectedDrmSystem,
      isEncrypted: this.isEncrypted,
      keyStatus: this.drmEngine.keySession?.keyStatuses || null
    };
  }

  /**
   * Update DRM configuration
   */
  updateDrmConfig(config) {
    if (!this.drmEngine) {
      throw new Error("DRM engine not available");
    }

    if (config.authToken) {
      this.drmEngine.setAuthToken(config.authToken);
    }
    if (config.customHeaders) {
      this.drmEngine.setCustomHeaders(config.customHeaders);
    }
    if (config.licenseServerUrl) {
      this.drmEngine.licenseServerUrl = config.licenseServerUrl;
    }
  }

  /**
   * Cleanup resources
   */
  async _cleanup() {
    // Clean up previous session
    if (this.mediaSource) {
      try {
        URL.revokeObjectURL(this.audio.src);
      } catch (error) {
        this._log("Failed to revoke object URL:", error);
      }

      if (this.onTimeUnsub) {
        this.onTimeUnsub();
        this.onTimeUnsub = null;
      }

      this.mediaSource = null;
      this.sourceBuffer = null;
    }

    // Clean up DRM session
    if (this.drmEngine) {
      try {
        await this.drmEngine.cleanup();
      } catch (error) {
        this._log("DRM cleanup failed:", error);
      }
    }
  }

  /**
   * Utility methods
   */
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  _log(...args) {
    if (this.debug) {
      console.log("[EnhancedMseEngine]", ...args);
    }
  }

  _defaultErrorHandler(error) {
    console.error("[EnhancedMseEngine] Error:", error);
  }

  _defaultDrmErrorHandler(error) {
    console.error("[EnhancedMseEngine] DRM Error:", error);
  }

  // Implement CoreEngine interface
  play() {
    return this.audio.play().catch(this.onError);
  }

  pause() {
    this.audio.pause();
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
    this.audio.addEventListener("durationchange", handler);
    return () => this.audio.removeEventListener("durationchange", handler);
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
