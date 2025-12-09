/**
 * AdaptiveEngine - Intelligent bitrate switching and network adaptation system
 * Provides dynamic quality adjustment based on network conditions, device capabilities,
 * and user preferences with seamless quality transitions.
 */
export default class AdaptiveEngine {
  constructor() {
    // Network monitoring configuration
    this.config = {
      measurementWindow: 10, // Number of measurements to average
      measurementInterval: 5000, // Measurement interval in ms
      switchThreshold: 0.3, // Quality change threshold (0-1)
      stabilityPeriod: 15000, // Minimum time between quality changes
      emergencyThreshold: 0.1, // Emergency downgrade threshold
      recoveryThreshold: 0.8, // Quality recovery threshold
      preloadLookahead: 10, // Seconds to preload ahead
      bufferTargets: {
        high: 15, // Target buffer for high quality
        medium: 10, // Target buffer for medium quality
        low: 5, // Target buffer for low quality
      }
    };

    // Available quality levels
    this.qualityLevels = [
      {
        id: "low",
        bitrate: 128, // kbps
        sampleRate: 44100,
        codecProfile: "he-aac",
        displayName: "Low (128 kbps)",
        bandwidth: 150, // Required bandwidth in kbps
      },
      {
        id: "medium",
        bitrate: 256,
        sampleRate: 44100,
        codecProfile: "aac-lc",
        displayName: "Medium (256 kbps)",
        bandwidth: 300
      },
      {
        id: "high",
        bitrate: 320,
        sampleRate: 48000,
        codecProfile: "aac-lc",
        displayName: "High (320 kbps)",
        bandwidth: 400
      },
      {
        id: "ultra",
        bitrate: 1411,
        sampleRate: 48000,
        codecProfile: "flac",
        displayName: "Ultra (Lossless)",
        bandwidth: 1500
      },
    ];

    // Current state
    this.state = {
      currentQuality: "high",
      targetQuality: "high",
      userPreferredQuality: "high",
      isAdaptive: true,
      isTransitioning: false,
      lastQualityChange: 0,
      networkStable: true
    };

    // Network metrics
    this.networkMetrics = {
      bandwidth: 0, // Estimated bandwidth in kbps
      latency: 0, // Round-trip time in ms
      packetLoss: 0, // Packet loss percentage
      stability: 1.0, // Network stability score (0-1)
      connectionType: "unknown", // Network connection type
      effectiveType: "4g", // Effective connection type
      measurements: []
    };

    // Performance metrics
    this.performanceMetrics = {
      bufferHealth: 1.0,
      rebufferEvents: 0,
      qualityChanges: 0,
      averageQuality: 0,
      streamingQualityScore: 1.0
    };

    // Device capabilities
    this.deviceCapabilities = {
      maxBitrate: Infinity,
      preferredCodec: "aac-lc",
      hardwareDecoding: false,
      maxConcurrentStreams: 1,
      batteryOptimized: false
    };

    // Event callbacks
    this.callbacks = {
      onQualityChange: null,
      onNetworkUpdate: null,
      onAdaptationChange: null,
      onBufferUpdate: null
    };

    // Monitoring timers
    this.timers = {
      networkMonitor: null,
      qualityAssessment: null,
      performanceCheck: null
    };

    this._initializeDeviceCapabilities();
    this._initializeNetworkMonitoring();
  }

  /**
   * Initialize device capability detection
   */
  _initializeDeviceCapabilities() {
    // Detect hardware decoding support
    this.deviceCapabilities.hardwareDecoding = this._detectHardwareDecoding();

    // Detect preferred codec
    this.deviceCapabilities.preferredCodec = this._detectPreferredCodec();

    // Battery optimization detection
    if ("getBattery" in navigator) {
      navigator.getBattery().then((battery) => {
        this.deviceCapabilities.batteryOptimized =
          !battery.charging && battery.level < 0.3;
      });
    }

    // Connection type detection
    if ("connection" in navigator) {
      const connection = navigator.connection;
      this.networkMetrics.connectionType = connection.type || "unknown";
      this.networkMetrics.effectiveType = connection.effectiveType || "4g";

      // Listen for connection changes
      connection.addEventListener("change", () => {
        this._updateConnectionInfo();
      });
    }
  }

  /**
   * Initialize network quality monitoring
   */
  _initializeNetworkMonitoring() {
    this.timers.networkMonitor = setInterval(() => {
      this._measureNetworkQuality();
    }, this.config.measurementInterval);

    this.timers.qualityAssessment = setInterval(() => {
      this._assessQualityNeed();
    }, this.config.measurementInterval / 2);

    this.timers.performanceCheck = setInterval(() => {
      this._updatePerformanceMetrics();
    }, 10000);
  }

  /**
   * Measure current network quality
   */
  async _measureNetworkQuality() {
    try {
      const measurement = await this._performNetworkTest();
      this.networkMetrics.measurements.push(measurement);

      // Keep only recent measurements
      if (
        this.networkMetrics.measurements.length > this.config.measurementWindow
      ) {
        this.networkMetrics.measurements.shift();
      }

      // Calculate average metrics
      this._calculateNetworkAverages();

      // Update stability score
      this._calculateNetworkStability();

      if (this.callbacks.onNetworkUpdate) {
        this.callbacks.onNetworkUpdate({
          bandwidth: this.networkMetrics.bandwidth,
          latency: this.networkMetrics.latency,
          stability: this.networkMetrics.stability,
          effectiveType: this.networkMetrics.effectiveType
        });
      }
    } catch (error) {
      console.warn("Network measurement failed:", error);
    }
  }

  /**
   * Perform network speed test
   */
  async _performNetworkTest() {
    const testStart = performance.now();
    const testSize = 100 * 1024; // 100KB test

    try {
      // Use a small segment download for speed testing
      const testUrl = this._generateTestUrl(testSize);
      const response = await fetch(testUrl, {
        cache: "no-cache",
        headers: { Range: `bytes=0-${testSize - 1}` }
      });

      const testEnd = performance.now();
      const duration = testEnd - testStart;
      const bandwidth = (testSize * 8) / (duration / 1000) / 1000; // kbps

      return {
        bandwidth,
        latency: duration,
        timestamp: Date.now(),
        success: true
      };
    } catch (error) {
      return {
        bandwidth: 0,
        latency: Infinity,
        timestamp: Date.now(),
        success: false
      };
    }
  }

  /**
   * Generate test URL for bandwidth measurement
   */
  _generateTestUrl(size) {
    // Use a real endpoint or generate test data
    return `/api/network-test?size=${size}&t=${Date.now()}`;
  }

  /**
   * Calculate network averages from measurements
   */
  _calculateNetworkAverages() {
    const validMeasurements = this.networkMetrics.measurements.filter(
      (m) => m.success,
    );

    if (validMeasurements.length === 0) {
      this.networkMetrics.bandwidth = 0;
      this.networkMetrics.latency = Infinity;
      return;
    }

    // Calculate bandwidth average (harmonic mean for more conservative estimate)
    const bandwidthSum = validMeasurements.reduce(
      (sum, m) => sum + 1 / m.bandwidth,
      0,
    );
    this.networkMetrics.bandwidth = validMeasurements.length / bandwidthSum;

    // Calculate latency average
    this.networkMetrics.latency =
      validMeasurements.reduce((sum, m) => sum + m.latency, 0) /
      validMeasurements.length;
  }

  /**
   * Calculate network stability score
   */
  _calculateNetworkStability() {
    if (this.networkMetrics.measurements.length < 3) {
      this.networkMetrics.stability = 0.5;
      return;
    }

    const bandwidths = this.networkMetrics.measurements
      .filter((m) => m.success)
      .map((m) => m.bandwidth);

    if (bandwidths.length < 2) {
      this.networkMetrics.stability = 0.5;
      return;
    }

    // Calculate coefficient of variation
    const mean = bandwidths.reduce((sum, b) => sum + b, 0) / bandwidths.length;
    const variance =
      bandwidths.reduce((sum, b) => sum + Math.pow(b - mean, 2), 0) /
      bandwidths.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;

    // Convert to stability score (lower CV = higher stability)
    this.networkMetrics.stability = Math.max(0, Math.min(1, 1 - cv));
    this.state.networkStable = this.networkMetrics.stability > 0.7;
  }

  /**
   * Assess if quality change is needed
   */
  _assessQualityNeed() {
    if (!this.state.isAdaptive || this.state.isTransitioning) {
      return;
    }

    const now = Date.now();
    const timeSinceLastChange = now - this.state.lastQualityChange;

    // Respect stability period
    if (timeSinceLastChange < this.config.stabilityPeriod) {
      return;
    }

    const currentLevel = this._getQualityLevel(this.state.currentQuality);
    const optimalQuality = this._calculateOptimalQuality();

    if (optimalQuality !== this.state.currentQuality) {
      // Check if change is significant enough
      const newLevel = this._getQualityLevel(optimalQuality);
      const qualityDifference =
        Math.abs(newLevel.bitrate - currentLevel.bitrate) /
        currentLevel.bitrate;

      if (
        qualityDifference >= this.config.switchThreshold ||
        this._isEmergencyDowngrade(optimalQuality)
      ) {
        this._initiateQualityChange(optimalQuality);
      }
    }
  }

  /**
   * Calculate optimal quality based on current conditions
   */
  _calculateOptimalQuality() {
    const availableBandwidth = this.networkMetrics.bandwidth * 0.8; // Leave 20% headroom
    const networkStability = this.networkMetrics.stability;

    // Start with user preference
    let targetQuality = this.state.userPreferredQuality;
    let targetLevel = this._getQualityLevel(targetQuality);

    // Check bandwidth constraints
    while (targetLevel && targetLevel.bandwidth > availableBandwidth) {
      const lowerQuality = this._getLowerQuality(targetQuality);
      if (!lowerQuality) break;

      targetQuality = lowerQuality;
      targetLevel = this._getQualityLevel(targetQuality);
    }

    // Apply stability adjustments
    if (networkStability < 0.5 && targetQuality !== "low") {
      targetQuality = this._getLowerQuality(targetQuality) || targetQuality;
    }

    // Battery optimization
    if (this.deviceCapabilities.batteryOptimized && targetQuality === "ultra") {
      targetQuality = "high";
    }

    return targetQuality;
  }

  /**
   * Check if emergency quality downgrade is needed
   */
  _isEmergencyDowngrade(suggestedQuality) {
    const currentLevel = this._getQualityLevel(this.state.currentQuality);
    const suggestedLevel = this._getQualityLevel(suggestedQuality);

    // Emergency downgrade if bandwidth drops significantly below requirements
    const bandwidthRatio =
      this.networkMetrics.bandwidth / currentLevel.bandwidth;
    return (
      bandwidthRatio < this.config.emergencyThreshold &&
      suggestedLevel.bitrate < currentLevel.bitrate
    );
  }

  /**
   * Initiate quality change
   */
  async _initiateQualityChange(newQuality) {
    if (this.state.isTransitioning) return;

    this.state.isTransitioning = true;
    this.state.targetQuality = newQuality;

    try {
      // Notify about quality change start
      if (this.callbacks.onQualityChange) {
        this.callbacks.onQualityChange({
          from: this.state.currentQuality,
          to: newQuality,
          reason: this._getQualityChangeReason(newQuality),
          phase: "start"
        });
      }

      // Execute quality transition
      await this._executeQualityTransition(newQuality);

      // Update state
      this.state.currentQuality = newQuality;
      this.state.lastQualityChange = Date.now();
      this.performanceMetrics.qualityChanges++;

      // Notify about completion
      if (this.callbacks.onQualityChange) {
        this.callbacks.onQualityChange({
          from: this.state.currentQuality,
          to: newQuality,
          reason: this._getQualityChangeReason(newQuality),
          phase: "complete"
        });
      }
    } catch (error) {
      console.error("Quality change failed:", error);

      // Revert target quality
      this.state.targetQuality = this.state.currentQuality;
    } finally {
      this.state.isTransitioning = false;
    }
  }

  /**
   * Execute seamless quality transition
   */
  async _executeQualityTransition(newQuality) {
    // This would be implemented in conjunction with the MSE engine
    // to seamlessly switch between quality levels
    return new Promise((resolve) => {
      // Simulate transition time
      setTimeout(resolve, 1000);
    });
  }

  /**
   * Get reason for quality change
   */
  _getQualityChangeReason(newQuality) {
    const currentLevel = this._getQualityLevel(this.state.currentQuality);
    const newLevel = this._getQualityLevel(newQuality);

    if (newLevel.bitrate > currentLevel.bitrate) {
      return "network_improved";
    } else if (this.networkMetrics.stability < 0.5) {
      return "network_unstable";
    } else if (this.networkMetrics.bandwidth < currentLevel.bandwidth) {
      return "insufficient_bandwidth";
    } else if (this.deviceCapabilities.batteryOptimized) {
      return "battery_optimization";
    } else {
      return "optimization";
    }
  }

  /**
   * Get quality level configuration
   */
  _getQualityLevel(qualityId) {
    return this.qualityLevels.find((level) => level.id === qualityId);
  }

  /**
   * Get next lower quality level
   */
  _getLowerQuality(currentQuality) {
    const currentIndex = this.qualityLevels.findIndex(
      (level) => level.id === currentQuality,
    );
    return currentIndex > 0 ? this.qualityLevels[currentIndex - 1].id : null;
  }

  /**
   * Get next higher quality level
   */
  _getHigherQuality(currentQuality) {
    const currentIndex = this.qualityLevels.findIndex(
      (level) => level.id === currentQuality,
    );
    return currentIndex < this.qualityLevels.length - 1
      ? this.qualityLevels[currentIndex + 1].id
      : null;
  }

  /**
   * Update connection information
   */
  _updateConnectionInfo() {
    if ("connection" in navigator) {
      const connection = navigator.connection;
      this.networkMetrics.connectionType = connection.type || "unknown";
      this.networkMetrics.effectiveType = connection.effectiveType || "4g";

      // Adjust quality based on connection type
      if (
        connection.effectiveType === "slow-2g" ||
        connection.effectiveType === "2g"
      ) {
        this.setUserPreferredQuality("low");
      } else if (connection.effectiveType === "3g") {
        this.setUserPreferredQuality("medium");
      }
    }
  }

  /**
   * Detect hardware decoding capabilities
   */
  _detectHardwareDecoding() {
    // Basic detection - in production, this would be more sophisticated
    return "MediaSource" in window && "SourceBuffer" in window;
  }

  /**
   * Detect preferred codec
   */
  _detectPreferredCodec() {
    const codecs = ["aac-lc", "he-aac", "opus", "mp3"];

    for (const codec of codecs) {
      if (this._isCodecSupported(codec)) {
        return codec;
      }
    }

    return "aac-lc";
  }

  /**
   * Check codec support
   */
  _isCodecSupported(codec) {
    const mimeTypes = {
      "aac-lc": 'audio/mp4; codecs="mp4a.40.2"',
      "he-aac": 'audio/mp4; codecs="mp4a.40.5"',
      opus: 'audio/webm; codecs="opus"',
      mp3: "audio/mpeg"
    };

    const mimeType = mimeTypes[codec];
    return mimeType && MediaSource.isTypeSupported(mimeType);
  }

  /**
   * Update performance metrics
   */
  _updatePerformanceMetrics() {
    // Calculate average quality score
    const currentLevel = this._getQualityLevel(this.state.currentQuality);
    const maxBitrate = Math.max(...this.qualityLevels.map((l) => l.bitrate));
    const qualityScore = currentLevel.bitrate / maxBitrate;

    this.performanceMetrics.averageQuality =
      this.performanceMetrics.averageQuality * 0.9 + qualityScore * 0.1;

    // Calculate streaming quality score
    const stabilityScore = this.networkMetrics.stability;
    const bufferScore = this.performanceMetrics.bufferHealth;
    const rebufferPenalty = Math.max(
      0,
      1 - this.performanceMetrics.rebufferEvents * 0.1,
    );

    this.performanceMetrics.streamingQualityScore =
      qualityScore * 0.4 +
      stabilityScore * 0.3 +
      bufferScore * 0.2 +
      rebufferPenalty * 0.1;
  }

  // Public API methods

  /**
   * Set user preferred quality
   */
  setUserPreferredQuality(quality) {
    if (!this._getQualityLevel(quality)) {
      throw new Error(`Invalid quality level: ${quality}`);
    }

    this.state.userPreferredQuality = quality;

    if (this.state.isAdaptive) {
      this._assessQualityNeed();
    } else {
      this._initiateQualityChange(quality);
    }
  }

  /**
   * Enable or disable adaptive streaming
   */
  setAdaptiveStreaming(enabled) {
    this.state.isAdaptive = enabled;

    if (this.callbacks.onAdaptationChange) {
      this.callbacks.onAdaptationChange({ adaptive: enabled });
    }

    if (enabled) {
      this._assessQualityNeed();
    } else {
      // Switch to user preferred quality
      if (this.state.currentQuality !== this.state.userPreferredQuality) {
        this._initiateQualityChange(this.state.userPreferredQuality);
      }
    }
  }

  /**
   * Get current streaming state
   */
  getStreamingState() {
    return {
      currentQuality: this.state.currentQuality,
      availableQualities: this.qualityLevels.map((l) => ({
        id: l.id,
        displayName: l.displayName,
        bitrate: l.bitrate
      })),
      isAdaptive: this.state.isAdaptive,
      networkMetrics: {
        bandwidth: this.networkMetrics.bandwidth,
        latency: this.networkMetrics.latency,
        stability: this.networkMetrics.stability,
        connectionType: this.networkMetrics.effectiveType
      },
      performanceMetrics: this.performanceMetrics
    };
  }

  /**
   * Force quality change (for testing or manual override)
   */
  forceQualityChange(quality) {
    if (!this._getQualityLevel(quality)) {
      throw new Error(`Invalid quality level: ${quality}`);
    }

    this.state.lastQualityChange = 0; // Reset cooldown
    this._initiateQualityChange(quality);
  }

  /**
   * Update buffer health (called by MSE engine)
   */
  updateBufferHealth(bufferInfo) {
    this.performanceMetrics.bufferHealth = bufferInfo.bufferHealth || 1.0;

    if (bufferInfo.rebufferEvent) {
      this.performanceMetrics.rebufferEvents++;
    }

    if (this.callbacks.onBufferUpdate) {
      this.callbacks.onBufferUpdate(bufferInfo);
    }
  }

  // Event handlers
  onQualityChange(callback) {
    this.callbacks.onQualityChange = callback;
  }

  onNetworkUpdate(callback) {
    this.callbacks.onNetworkUpdate = callback;
  }

  onAdaptationChange(callback) {
    this.callbacks.onAdaptationChange = callback;
  }

  onBufferUpdate(callback) {
    this.callbacks.onBufferUpdate = callback;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    // Clear timers
    Object.values(this.timers).forEach((timer) => {
      if (timer) clearInterval(timer);
    });

    // Clear callbacks
    Object.keys(this.callbacks).forEach((key) => {
      this.callbacks[key] = null;
    });
  }
}
