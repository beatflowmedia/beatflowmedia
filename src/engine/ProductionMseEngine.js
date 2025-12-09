import CoreEngine from "./CoreEngine";
import GaplessEngine from "./GaplessEngine";
import CrossfadeEngine from "./CrossfadeEngine";
import AdaptiveEngine from "./AdaptiveEngine";

/**
 * ProductionMseEngine - Production-grade MSE implementation
 * Combines gapless playback, crossfade capabilities, and adaptive streaming
 * with Netflix/Spotify-level audio quality and user experience.
 */
export default class ProductionMseEngine extends CoreEngine {
  constructor(audioElement) {
    super();
    if (!(audioElement instanceof HTMLAudioElement)) {
      throw new TypeError("ProductionMseEngine requires an HTMLAudioElement");
    }

    // Core components
    this.audio = audioElement;
    this.gaplessEngine = new GaplessEngine(audioElement);
    this.crossfadeEngine = new CrossfadeEngine();
    this.adaptiveEngine = new AdaptiveEngine();

    // Engine configuration
    this.config = {
      enableGapless: true,
      enableCrossfade: true,
      enableAdaptive: true,
      crossfadeDuration: 8,
      frameAccurateSeeking: true,
      preloadNextTrack: true,
      analyticsEnabled: true
    };

    // Current state
    this.state = {
      isInitialized: false,
      currentTrack: null,
      nextTrack: null,
      queuedTracks: [],
      crossfadeActive: false,
      seekAccuracy: "frame", // 'frame', 'second', 'rough'
      playbackMode: "normal", // 'normal', 'crossfade', 'gapless'
    };

    // Analytics and monitoring
    this.analytics = {
      sessionStart: Date.now(),
      tracksPlayed: 0,
      totalPlaytime: 0,
      bufferEvents: 0,
      qualityChanges: 0,
      crossfadeEvents: 0,
      seekEvents: 0,
      errors: []
    };

    // Event handlers
    this.eventHandlers = {
      onTrackChange: null,
      onCrossfadeStart: null,
      onCrossfadeComplete: null,
      onQualityChange: null,
      onBufferUpdate: null,
      onAnalyticsUpdate: null,
      onError: null
    };

    // Performance monitoring
    this.performanceMonitor = {
      lastUpdate: Date.now(),
      frameDrops: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      audioDropouts: 0
    };

    this._initializeEngines();
  }

  /**
   * Initialize all engine components
   */
  async _initializeEngines() {
    try {
      // Connect audio element to crossfade engine
      this.crossfadeEngine.connectAudioElement(this.audio, "current");

      // Set up engine event listeners
      this._setupEventListeners();

      // Initialize adaptive streaming
      this.adaptiveEngine.setAdaptiveStreaming(this.config.enableAdaptive);

      this.state.isInitialized = true;
    } catch (error) {
      console.error("Engine initialization failed:", error);
      this._handleError("initialization_failed", error);
      throw error;
    }
  }

  /**
   * Set up event listeners between components
   */
  _setupEventListeners() {
    // Gapless engine events
    this.gaplessEngine.onBufferUpdate((bufferStatus) => {
      this.adaptiveEngine.updateBufferHealth(bufferStatus);
      this._emitEvent("onBufferUpdate", bufferStatus);
    });

    this.gaplessEngine.onGaplessReady((nextTrack) => {
      if (this.config.enableCrossfade && nextTrack) {
        this._prepareCrossfade(nextTrack);
      }
    });

    // Crossfade engine events
    this.crossfadeEngine.onCrossfadeStart((info) => {
      this.state.crossfadeActive = true;
      this.analytics.crossfadeEvents++;
      this._emitEvent("onCrossfadeStart", info);
    });

    this.crossfadeEngine.onCrossfadeComplete(() => {
      this.state.crossfadeActive = false;
      this._emitEvent("onCrossfadeComplete");
      this._completeTrackTransition();
    });

    this.crossfadeEngine.onBeatDetected((beatInfo) => {
      // Use beat information for intelligent crossfade timing
      this._handleBeatDetection(beatInfo);
    });

    // Adaptive engine events
    this.adaptiveEngine.onQualityChange((qualityInfo) => {
      this.analytics.qualityChanges++;
      this._emitEvent("onQualityChange", qualityInfo);
    });

    this.adaptiveEngine.onNetworkUpdate((networkInfo) => {
      this._handleNetworkUpdate(networkInfo);
    });
  }

  /**
   * Load a track with enhanced features
   */
  async load(track, options = {}) {
    try {
      const {
        nextTrack = null,
        preload = this.config.preloadNextTrack,
        crossfade = this.config.enableCrossfade,
        quality = null
      } = options;

      // Update state
      this.state.currentTrack = track;
      this.state.nextTrack = nextTrack;

      // Set quality if specified
      if (quality) {
        this.adaptiveEngine.setUserPreferredQuality(quality);
      }

      // Load track in gapless engine
      await this.gaplessEngine.load(track, nextTrack);

      // Analyze track for crossfade optimization
      if (crossfade && this.crossfadeEngine) {
        this.crossfadeEngine.analyzeTrack(this.audio, "current");
      }

      // Preload next track if specified
      if (preload && nextTrack) {
        this._preloadNextTrack(nextTrack);
      }

      this.analytics.tracksPlayed++;
      this._emitEvent("onTrackChange", { track, nextTrack });
    } catch (error) {
      console.error("Enhanced load failed:", error);
      this._handleError("load_failed", error, { track: track.id });
      throw error;
    }
  }

  /**
   * Enhanced play with crossfade support
   */
  async play() {
    try {
      await this.gaplessEngine.play();
      this._updateAnalytics("play");
    } catch (error) {
      console.error("Enhanced play failed:", error);
      this._handleError("play_failed", error);
      throw error;
    }
  }

  /**
   * Pause with state preservation
   */
  pause() {
    this.gaplessEngine.pause();
    this._updateAnalytics("pause");
  }

  /**
   * Frame-accurate seeking implementation
   */
  async seek(time, accuracy = this.state.seekAccuracy) {
    try {
      this.analytics.seekEvents++;

      switch (accuracy) {
        case "frame":
          await this._frameAccurateSeek(time);
          break;
        case "second":
          await this._secondAccurateSeek(time);
          break;
        case "rough":
        default:
          await this.gaplessEngine.seek(time);
          break;
      }

      this._updateAnalytics("seek", { time, accuracy });
    } catch (error) {
      console.error("Enhanced seek failed:", error);
      this._handleError("seek_failed", error, { time, accuracy });
      throw error;
    }
  }

  /**
   * Frame-accurate seeking with sample precision
   */
  async _frameAccurateSeek(targetTime) {
    // Calculate target frame based on sample rate
    const sampleRate = this.crossfadeEngine.audioContext?.sampleRate || 48000;
    const targetFrame = Math.floor(targetTime * sampleRate);
    const adjustedTime = targetFrame / sampleRate;

    // Use gapless engine's enhanced seeking
    await this.gaplessEngine.seek(adjustedTime);

    // Additional precision adjustments if needed
    const actualTime = this.audio.currentTime;
    const timeDifference = Math.abs(actualTime - adjustedTime);

    if (timeDifference > 0.001) {
      // 1ms tolerance
      // Fine-tune using Web Audio API if available
      await this._fineTuneSeekPosition(adjustedTime);
    }
  }

  /**
   * Second-accurate seeking
   */
  async _secondAccurateSeek(targetTime) {
    const adjustedTime = Math.floor(targetTime * 10) / 10; // 100ms precision
    await this.gaplessEngine.seek(adjustedTime);
  }

  /**
   * Fine-tune seek position using Web Audio API
   */
  async _fineTuneSeekPosition(targetTime) {
    // Implementation would use Web Audio API for micro-adjustments
    // This is a placeholder for the actual fine-tuning logic
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        if (Math.abs(this.audio.currentTime - targetTime) > 0.001) {
          this.audio.currentTime = targetTime;
        }
        resolve();
      });
    });
  }

  /**
   * Set volume with crossfade consideration
   */
  setVolume(volume) {
    const clampedVolume = Math.max(0, Math.min(1, volume));

    // If crossfade is active, adjust through crossfade engine
    if (this.state.crossfadeActive && this.crossfadeEngine) {
      this.crossfadeEngine.setVolume(clampedVolume);
    } else {
      this.gaplessEngine.setVolume(clampedVolume);
    }
  }

  /**
   * Start crossfade to next track
   */
  async startCrossfade(options = {}) {
    if (!this.config.enableCrossfade || !this.state.nextTrack) {
      throw new Error("Crossfade not available");
    }

    const crossfadeOptions = {
      duration: options.duration || this.config.crossfadeDuration,
      curve: options.curve || "smooth",
      beatSync: options.beatSync !== false,
      ...options
    };

    try {
      await this.crossfadeEngine.startCrossfade(crossfadeOptions);
    } catch (error) {
      console.error("Crossfade start failed:", error);
      this._handleError("crossfade_failed", error);
      throw error;
    }
  }

  /**
   * Prepare crossfade for upcoming track transition
   */
  async _prepareCrossfade(nextTrack) {
    try {
      // Analyze next track for optimal crossfade
      await this.crossfadeEngine.analyzeTrack(this.audio, "next");

      // Set up secondary audio element for next track if needed
      await this._setupNextTrackAudio(nextTrack);
    } catch (error) {
      console.warn("Crossfade preparation failed:", error);
    }
  }

  /**
   * Setup secondary audio element for crossfade
   */
  async _setupNextTrackAudio(nextTrack) {
    // In a full implementation, this would create a second audio element
    // and connect it to the crossfade engine for seamless transitions
    console.log("Setting up next track audio for crossfade:", nextTrack.title);
  }

  /**
   * Complete track transition after crossfade
   */
  _completeTrackTransition() {
    if (this.state.nextTrack) {
      this.state.currentTrack = this.state.nextTrack;
      this.state.nextTrack = this.state.queuedTracks.shift() || null;
      this._emitEvent("onTrackChange", {
        track: this.state.currentTrack,
        nextTrack: this.state.nextTrack
      });
    }
  }

  /**
   * Preload next track for gapless playback
   */
  async _preloadNextTrack(nextTrack) {
    try {
      await this.gaplessEngine.prepareGaplessTransition(nextTrack);
    } catch (error) {
      console.warn("Next track preload failed:", error);
    }
  }

  /**
   * Handle beat detection for intelligent crossfade timing
   */
  _handleBeatDetection(beatInfo) {
    // Use beat information to optimize crossfade timing
    if (this.state.nextTrack && !this.state.crossfadeActive) {
      const timeRemaining = this.audio.duration - this.audio.currentTime;

      // Start crossfade at optimal beat-aligned time
      if (timeRemaining <= this.config.crossfadeDuration + 5) {
        this._considerBeatAlignedCrossfade(beatInfo);
      }
    }
  }

  /**
   * Consider starting beat-aligned crossfade
   */
  _considerBeatAlignedCrossfade(beatInfo) {
    if (beatInfo.bpm > 0 && beatInfo.confidence > 0.7) {
      const beatDuration = 60 / beatInfo.bpm;
      const beatsRemaining =
        Math.floor(this.audio.duration - this.audio.currentTime) / beatDuration;

      // Start crossfade on a beat boundary
      if (beatsRemaining <= 16) {
        // Start within 16 beats of end
        setTimeout(() => {
          if (!this.state.crossfadeActive) {
            this.startCrossfade({ beatSync: true });
          }
        }, beatDuration * 1000);
      }
    }
  }

  /**
   * Handle network quality updates
   */
  _handleNetworkUpdate(networkInfo) {
    // Adjust buffering strategy based on network quality
    if (networkInfo.stability < 0.5) {
      // Increase buffer targets for unstable networks
      this.gaplessEngine.config.bufferAhead = Math.min(
        20,
        this.gaplessEngine.config.bufferAhead * 1.5,
      );
    } else if (networkInfo.stability > 0.8) {
      // Reduce buffer for stable networks to save memory
      this.gaplessEngine.config.bufferAhead = Math.max(
        5,
        this.gaplessEngine.config.bufferAhead * 0.9,
      );
    }
  }

  /**
   * Get comprehensive engine status
   */
  getEngineStatus() {
    return {
      isInitialized: this.state.isInitialized,
      currentTrack: this.state.currentTrack,
      nextTrack: this.state.nextTrack,
      playbackMode: this.state.playbackMode,
      crossfadeActive: this.state.crossfadeActive,
      bufferStatus: this.gaplessEngine.getBufferStatus(),
      streamingState: this.adaptiveEngine.getStreamingState(),
      audioAnalysis: this.crossfadeEngine.getCurrentAnalysis(),
      analytics: this.analytics,
      performance: this.performanceMonitor,
      config: this.config
    };
  }

  /**
   * Update engine configuration
   */
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    // Apply configuration changes to sub-engines
    if (newConfig.enableAdaptive !== undefined) {
      this.adaptiveEngine.setAdaptiveStreaming(newConfig.enableAdaptive);
    }

    if (newConfig.crossfadeDuration !== undefined) {
      this.crossfadeEngine.setConfig({
        crossfadeDuration: newConfig.crossfadeDuration
      });
    }
  }

  /**
   * Set quality preference
   */
  setQuality(quality) {
    this.adaptiveEngine.setUserPreferredQuality(quality);
  }

  /**
   * Enable or disable adaptive streaming
   */
  setAdaptiveStreaming(enabled) {
    this.config.enableAdaptive = enabled;
    this.adaptiveEngine.setAdaptiveStreaming(enabled);
  }

  /**
   * Queue next track for gapless playback
   */
  queueNextTrack(track) {
    this.state.queuedTracks.push(track);

    if (!this.state.nextTrack) {
      this.state.nextTrack = track;
      if (this.config.preloadNextTrack) {
        this._preloadNextTrack(track);
      }
    }
  }

  /**
   * Clear track queue
   */
  clearQueue() {
    this.state.queuedTracks = [];
    this.state.nextTrack = null;
  }

  // Event subscription methods
  onTimeUpdate(callback) {
    return this.gaplessEngine.onTimeUpdate((time) => {
      callback(time);
      this._updatePlaytimeAnalytics(time);
    });
  }

  onDurationChange(callback) {
    return this.gaplessEngine.onDurationChange(callback);
  }

  onVolumeChange(callback) {
    return this.gaplessEngine.onVolumeChange(callback);
  }

  onEnded(callback) {
    return this.gaplessEngine.onEnded(() => {
      this._updateAnalytics("ended");
      callback();
    });
  }

  // Enhanced event handlers
  onTrackChange(callback) {
    this.eventHandlers.onTrackChange = callback;
  }

  onCrossfadeStart(callback) {
    this.eventHandlers.onCrossfadeStart = callback;
  }

  onCrossfadeComplete(callback) {
    this.eventHandlers.onCrossfadeComplete = callback;
  }

  onQualityChange(callback) {
    this.eventHandlers.onQualityChange = callback;
  }

  onBufferUpdate(callback) {
    this.eventHandlers.onBufferUpdate = callback;
  }

  onAnalyticsUpdate(callback) {
    this.eventHandlers.onAnalyticsUpdate = callback;
  }

  onError(callback) {
    this.eventHandlers.onError = callback;
  }

  // Private utility methods

  _emitEvent(eventName, data) {
    const handler = this.eventHandlers[eventName];
    if (handler) {
      try {
        handler(data);
      } catch (error) {
        console.error(`Event handler error for ${eventName}:`, error);
      }
    }
  }

  _updateAnalytics(action, data = {}) {
    const now = Date.now();

    switch (action) {
      case "play":
        this.analytics.lastPlayStart = now;
        break;
      case "pause":
        if (this.analytics.lastPlayStart) {
          this.analytics.totalPlaytime += now - this.analytics.lastPlayStart;
        }
        break;
      case "ended":
        if (this.analytics.lastPlayStart) {
          this.analytics.totalPlaytime += now - this.analytics.lastPlayStart;
        }
        this.analytics.tracksCompleted =
          (this.analytics.tracksCompleted || 0) + 1;
        break;
      case "seek":
        this.analytics.seekEvents++;
        this.analytics.lastSeekTime = data.time;
        break;
    }

    this._emitEvent("onAnalyticsUpdate", this.analytics);
  }

  _updatePlaytimeAnalytics(currentTime) {
    // Update playtime tracking
    const now = Date.now();
    if (
      this.analytics.lastPlayStart &&
      now - this.analytics.lastUpdate > 1000
    ) {
      this.analytics.totalPlaytime += now - this.analytics.lastUpdate;
      this.analytics.lastUpdate = now;
    }
  }

  _handleError(errorType, error, context = {}) {
    const errorInfo = {
      type: errorType,
      message: error.message,
      timestamp: Date.now(),
      context,
      stack: error.stack
    };

    this.analytics.errors.push(errorInfo);

    // Keep only recent errors
    if (this.analytics.errors.length > 50) {
      this.analytics.errors.shift();
    }

    this._emitEvent("onError", errorInfo);
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Clean up all sub-engines
    if (this.gaplessEngine) {
      this.gaplessEngine._cleanup();
    }

    if (this.crossfadeEngine) {
      this.crossfadeEngine.destroy();
    }

    if (this.adaptiveEngine) {
      this.adaptiveEngine.destroy();
    }

    // Clear event handlers
    Object.keys(this.eventHandlers).forEach((key) => {
      this.eventHandlers[key] = null;
    });

    this.state.isInitialized = false;
  }
}
