/**
 * DrmIntegrationExample - Complete integration example showing how to use the DRM system
 *
 * This file demonstrates:
 * - Setting up DRM-protected content playback
 * - Handling multiple DRM providers
 * - Browser compatibility checking
 * - Fallback strategies
 * - Error handling and recovery
 */

import EnhancedMseEngine from "./EnhancedMseEngine";
import { DrmProviderFactory, MultiProviderDrmManager } from "./DrmProviders";
import {
  DrmCompatibilityChecker,
  FallbackStrategyManager
} from "./DrmCompatibility";
import MseEngine from "./MseEngine";
import LegacyAudioEngine from "./LegacyAudioEngine";

/**
 * DRM-enabled Player Manager
 *
 * Handles the complete lifecycle of DRM-protected content playback
 */
export class DrmPlayerManager {
  constructor(audioElement, config = {}) {
    this.audioElement = audioElement;
    this.config = {
      debug: false,
      enableFallback: true,
      autoRetry: true,
      maxRetries: 3,
      ...config
    };

    // Initialize components
    this.compatibilityChecker = new DrmCompatibilityChecker();
    this.fallbackManager = new FallbackStrategyManager({
      enableGracefulDegradation: this.config.enableFallback,
      fallbackToUnencrypted: this.config.enableFallback
    });

    this.currentEngine = null;
    this.drmProviders = null;
    this.isInitialized = false;

    // Event handlers
    this.onError = config.onError || this._defaultErrorHandler;
    this.onDrmError = config.onDrmError || this._defaultDrmErrorHandler;
    this.onFallback = config.onFallback || this._defaultFallbackHandler;

    this._log("DRM Player Manager initialized");
  }

  /**
   * Initialize the player with DRM configuration
   */
  async initialize(drmConfig) {
    try {
      this._log("Initializing DRM player...");

      // Check browser compatibility
      const compatibility = this.compatibilityChecker.getCompatibilityReport();
      this._log("Browser compatibility:", compatibility);

      // Setup DRM providers if configuration provided
      if (drmConfig && drmConfig.providers) {
        this.drmProviders = new MultiProviderDrmManager();

        for (const providerConfig of drmConfig.providers) {
          const provider = DrmProviderFactory.createProvider(
            providerConfig.type,
            providerConfig.config,
          );
          this.drmProviders.addProvider(provider);
        }

        this._log(
          "DRM providers configured:",
          this.drmProviders.getProviderStatus(),
        );
      }

      this.isInitialized = true;
      this._log("DRM player initialized successfully");
    } catch (error) {
      this._log("Failed to initialize DRM player:", error);
      throw error;
    }
  }

  /**
   * Load and play DRM-protected content
   */
  async loadTrack(track) {
    if (!this.isInitialized) {
      throw new Error("DRM player not initialized. Call initialize() first.");
    }

    this._log("Loading track:", track);

    try {
      // Determine best playback strategy
      const strategy = await this.fallbackManager.determinePlaybackStrategy({
        encrypted: track.encrypted,
        drmInfo: track.drmInfo,
        serverSideProtection: track.serverSideProtection,
        watermarkingAvailable: track.watermarkingAvailable
      });

      this._log("Playback strategy:", strategy);

      // Create appropriate engine based on strategy
      const engine = await this._createEngine(strategy);

      // Load track into engine
      await engine.load(track);

      // Store current engine
      if (this.currentEngine) {
        await this._cleanup();
      }
      this.currentEngine = engine;

      this._log("Track loaded successfully");
      return strategy;
    } catch (error) {
      this._log("Failed to load track:", error);

      // Attempt fallback if enabled
      if (this.config.enableFallback) {
        return await this._attemptFallback(track, error);
      }

      throw error;
    }
  }

  /**
   * Create engine based on playback strategy
   */
  async _createEngine(strategy) {
    const engineConfig = {
      debug: this.config.debug,
      onError: this.onError,
      onDrmError: this.onDrmError
    };

    // Add DRM provider if available
    if (this.drmProviders && strategy.type === "drm") {
      engineConfig.licenseAcquisition = async (
        request,
        drmSystem,
        metadata,
      ) => {
        return await this.drmProviders.acquireLicense(
          request,
          drmSystem,
          metadata,
        );
      };
    }

    switch (strategy.engineClass) {
      case "EnhancedMseEngine":
        return new EnhancedMseEngine(this.audioElement, engineConfig);

      case "MseEngine":
        return new MseEngine(this.audioElement);

      case "LegacyAudioEngine":
        return new LegacyAudioEngine(this.audioElement);

      default:
        throw new Error(`Unknown engine class: ${strategy.engineClass}`);
    }
  }

  /**
   * Attempt fallback strategy when primary method fails
   */
  async _attemptFallback(track, originalError) {
    this._log("Attempting fallback for track:", track);

    try {
      // Notify about fallback attempt
      this.onFallback({
        type: "attempt",
        originalError,
        track
      });

      // Create unencrypted version of track
      const fallbackTrack = {
        ...track,
        encrypted: false,
        drmInfo: null,
        streamUrl:
          track.fallbackUrl || track.streamUrl?.replace(".encrypted", ".clear")
      };

      // Determine fallback strategy
      const fallbackStrategy =
        await this.fallbackManager.determinePlaybackStrategy({
          encrypted: false,
          serverSideProtection: track.serverSideProtection
        });

      this._log("Fallback strategy:", fallbackStrategy);

      // Create fallback engine
      const fallbackEngine = await this._createEngine(fallbackStrategy);
      await fallbackEngine.load(fallbackTrack);

      // Store fallback engine
      if (this.currentEngine) {
        await this._cleanup();
      }
      this.currentEngine = fallbackEngine;

      // Notify about successful fallback
      this.onFallback({
        type: "success",
        strategy: fallbackStrategy,
        track: fallbackTrack
      });

      this._log("Fallback successful");
      return fallbackStrategy;
    } catch (fallbackError) {
      this._log("Fallback failed:", fallbackError);

      // Notify about fallback failure
      this.onFallback({
        type: "failure",
        originalError,
        fallbackError,
        track
      });

      throw fallbackError;
    }
  }

  /**
   * Control methods
   */
  async play() {
    if (!this.currentEngine) {
      throw new Error("No track loaded");
    }
    return await this.currentEngine.play();
  }

  pause() {
    if (!this.currentEngine) {
      throw new Error("No track loaded");
    }
    this.currentEngine.pause();
  }

  seek(time) {
    if (!this.currentEngine) {
      throw new Error("No track loaded");
    }
    this.currentEngine.seek(time);
  }

  setVolume(volume) {
    if (!this.currentEngine) {
      throw new Error("No track loaded");
    }
    this.currentEngine.setVolume(volume);
  }

  /**
   * Event subscription methods
   */
  onTimeUpdate(callback) {
    if (!this.currentEngine) {
      throw new Error("No track loaded");
    }
    return this.currentEngine.onTimeUpdate(callback);
  }

  onDurationChange(callback) {
    if (!this.currentEngine) {
      throw new Error("No track loaded");
    }
    return this.currentEngine.onDurationChange(callback);
  }

  onVolumeChange(callback) {
    if (!this.currentEngine) {
      throw new Error("No track loaded");
    }
    return this.currentEngine.onVolumeChange(callback);
  }

  onEnded(callback) {
    if (!this.currentEngine) {
      throw new Error("No track loaded");
    }
    return this.currentEngine.onEnded(callback);
  }

  /**
   * Get status information
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      hasTrack: !!this.currentEngine,
      compatibility: this.compatibilityChecker.getCompatibilityReport(),
      drmProviders: this.drmProviders
        ? this.drmProviders.getProviderStatus()
        : null,
      currentEngine: this.currentEngine
        ? this.currentEngine.constructor.name
        : null
    };
  }

  /**
   * Update DRM configuration
   */
  updateDrmConfig(config) {
    if (this.currentEngine && this.currentEngine.updateDrmConfig) {
      this.currentEngine.updateDrmConfig(config);
    }

    if (this.drmProviders) {
      // Update provider configurations
      config.providers?.forEach((providerConfig, index) => {
        const provider = this.drmProviders.providers[index];
        if (provider) {
          Object.assign(provider, providerConfig.config);
        }
      });
    }
  }

  /**
   * Cleanup resources
   */
  async _cleanup() {
    if (this.currentEngine && this.currentEngine._cleanup) {
      await this.currentEngine._cleanup();
    }
    this.currentEngine = null;
  }

  async destroy() {
    await this._cleanup();
    this.drmProviders = null;
    this.isInitialized = false;
    this._log("DRM player destroyed");
  }

  /**
   * Utility methods
   */
  _log(...args) {
    if (this.config.debug) {
      console.log("[DrmPlayerManager]", ...args);
    }
  }

  _defaultErrorHandler(error) {
    console.error("[DrmPlayerManager] Error:", error);
  }

  _defaultDrmErrorHandler(error) {
    console.error("[DrmPlayerManager] DRM Error:", error);
  }

  _defaultFallbackHandler(event) {
    console.log("[DrmPlayerManager] Fallback:", event);
  }
}

/**
 * Configuration Examples
 */
export const DRM_CONFIG_EXAMPLES = {
  // Single provider configuration
  singleProvider: {
    providers: [
      {
        type: "buydrm",
        config: {
          licenseServerUrl: "https://license.buydrm.com/widevine",
          customerId: "your-customer-id",
          authToken: "your-auth-token"
        }
      },
    ]
  },

  // Multi-provider with failover
  multiProvider: {
    providers: [
      {
        type: "buydrm",
        config: {
          licenseServerUrl: "https://license.buydrm.com/widevine",
          customerId: "your-customer-id",
          authToken: "your-auth-token"
        }
      },
      {
        type: "irdeto",
        config: {
          licenseServerUrl: "https://license.irdeto.com/v1/license",
          accountId: "your-account-id",
          sessionToken: "your-session-token"
        }
      },
    ]
  },

  // Custom provider
  customProvider: {
    providers: [
      {
        type: "custom",
        config: {
          name: "My Custom DRM",
          licenseServerUrl: "https://my-license-server.com/license",
          authToken: "custom-token",
          customHeaders: {
            "X-Client-Version": "1.0.0"
          },
          requestFormatter: (request, drmSystem, metadata, provider) => ({
            url: provider.licenseServerUrl,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...provider.getAuthHeaders()
            },
            body: JSON.stringify({
              license_request: Array.from(new Uint8Array(request)),
              content_id: metadata.contentId,
              user_id: metadata.userId
            })
          }),
          responseProcessor: (response, drmSystem) => {
            const data = JSON.parse(response);
            return new Uint8Array(data.license).buffer;
          }
        }
      },
    ]
  }
};

/**
 * Usage Example
 */
export function createDrmPlayerExample() {
  // Example usage of the DRM player
  const audioElement = document.getElementById("audio-player");

  const player = new DrmPlayerManager(audioElement, {
    debug: true,
    enableFallback: true,
    onError: (error) => console.error("Player error:", error),
    onDrmError: (error) => console.error("DRM error:", error),
    onFallback: (event) => console.log("Fallback event:", event)
  });

  return {
    async init() {
      await player.initialize(DRM_CONFIG_EXAMPLES.multiProvider);
    },

    async loadProtectedTrack() {
      const track = {
        id: "track-123",
        title: "Protected Song",
        artist: "Artist Name",
        encrypted: true,
        streamUrl: "/protected/track-123.encrypted",
        fallbackUrl: "/clear/track-123.clear",
        drmInfo: {
          supportedSystems: ["com.widevine.alpha"],
          contentId: "track-123",
          licenseServerUrl: "https://license.example.com/widevine"
        }
      };

      const strategy = await player.loadTrack(track);
      console.log("Loaded with strategy:", strategy);
    },

    async loadClearTrack() {
      const track = {
        id: "track-456",
        title: "Clear Song",
        artist: "Artist Name",
        encrypted: false,
        streamUrl: "/clear/track-456"
      };

      const strategy = await player.loadTrack(track);
      console.log("Loaded with strategy:", strategy);
    },

    // Control methods
    play: () => player.play(),
    pause: () => player.pause(),
    seek: (time) => player.seek(time),
    setVolume: (volume) => player.setVolume(volume),

    // Status
    getStatus: () => player.getStatus(),

    // Cleanup
    destroy: () => player.destroy()
  };
}

export default DrmPlayerManager;
