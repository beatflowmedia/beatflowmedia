/**
 * DrmEngine - Digital Rights Management engine for EME (Encrypted Media Extensions)
 *
 * Handles multi-DRM support including:
 * - Widevine (Chrome/Android)
 * - PlayReady (Edge/Windows)
 * - FairPlay (Safari/iOS via HLS)
 *
 * Features:
 * - License acquisition and management
 * - Key storage and rotation
 * - Session persistence
 * - Multi-DRM fallback strategies
 */

// DRM System identifiers
export const DRM_SYSTEMS = {
  WIDEVINE: "com.widevine.alpha",
  PLAYREADY: "com.microsoft.playready",
  FAIRPLAY: "com.apple.fps",
  CLEARKEY: "org.w3.clearkey", // For testing
};

// DRM Configuration templates
export const DRM_CONFIGS = {
  [DRM_SYSTEMS.WIDEVINE]: {
    audioCapabilities: [
      { contentType: 'audio/mp4; codecs="mp4a.40.2"' },
      { contentType: 'audio/webm; codecs="opus"' },
    ],
    videoCapabilities: [
      { contentType: 'video/mp4; codecs="avc1.42E01E"' },
      { contentType: 'video/webm; codecs="vp9"' },
    ],
    initDataTypes: ["cenc"],
    sessionTypes: ["temporary", "persistent-license"],
    label: "Widevine"
  },
  [DRM_SYSTEMS.PLAYREADY]: {
    audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }],
    videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
    initDataTypes: ["cenc"],
    sessionTypes: ["temporary", "persistent-license"],
    label: "PlayReady"
  },
  [DRM_SYSTEMS.FAIRPLAY]: {
    audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }],
    videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
    initDataTypes: ["sinf", "skd"],
    sessionTypes: ["temporary"],
    label: "FairPlay"
  }
};

export default class DrmEngine {
  constructor(options = {}) {
    this.licenseServerUrl = options.licenseServerUrl;
    this.certificateUrl = options.certificateUrl;
    this.authToken = options.authToken;
    this.customHeaders = options.customHeaders || {};
    this.retryCount = options.retryCount || 3;
    this.retryDelay = options.retryDelay || 1000;

    // Internal state
    this.mediaKeys = null;
    this.keySession = null;
    this.supportedDrmSystems = [];
    this.selectedDrmSystem = null;
    this.serverCertificate = null;

    // Event handlers
    this.onLicenseRequestError =
      options.onLicenseRequestError || this._defaultErrorHandler;
    this.onKeyStatusChange =
      options.onKeyStatusChange || this._defaultKeyStatusHandler;

    // Debug mode
    this.debug = options.debug || false;

    this._initializeSupportedSystems();
  }

  /**
   * Initialize and detect supported DRM systems
   */
  async _initializeSupportedSystems() {
    if (!navigator.requestMediaKeySystemAccess) {
      throw new Error(
        "EME (Encrypted Media Extensions) not supported in this browser",
      );
    }

    // Test each DRM system for support
    const systems = Object.keys(DRM_SYSTEMS);
    const supportPromises = systems.map(async (systemKey) => {
      const systemId = DRM_SYSTEMS[systemKey];
      const config = DRM_CONFIGS[systemId];

      try {
        const access = await navigator.requestMediaKeySystemAccess(systemId, [
          config,
        ]);
        return { systemId, systemKey, access, config };
      } catch (error) {
        this._log(`DRM system ${systemKey} not supported:`, error.message);
        return null;
      }
    });

    const results = await Promise.allSettled(supportPromises);
    this.supportedDrmSystems = results
      .filter(
        (result) => result.status === "fulfilled" && result.value !== null,
      )
      .map((result) => result.value);

    this._log(
      "Supported DRM systems:",
      this.supportedDrmSystems.map((s) => s.systemKey),
    );

    if (this.supportedDrmSystems.length === 0) {
      throw new Error("No supported DRM systems found");
    }
  }

  /**
   * Initialize DRM for a media element
   */
  async initializeForMedia(mediaElement, drmInfo) {
    if (!mediaElement || !drmInfo) {
      throw new Error("Media element and DRM info are required");
    }

    // Select best available DRM system
    this.selectedDrmSystem = this._selectBestDrmSystem(
      drmInfo.supportedSystems,
    );

    if (!this.selectedDrmSystem) {
      throw new Error("No compatible DRM system found for this content");
    }

    this._log(`Initializing DRM with ${this.selectedDrmSystem.systemKey}`);

    try {
      // Create MediaKeys
      this.mediaKeys = await this.selectedDrmSystem.access.createMediaKeys();

      // Set server certificate if required (mainly for FairPlay)
      if (
        this.certificateUrl &&
        this.selectedDrmSystem.systemId === DRM_SYSTEMS.FAIRPLAY
      ) {
        await this._setServerCertificate();
      }

      // Set MediaKeys on the media element
      await mediaElement.setMediaKeys(this.mediaKeys);

      // Listen for encrypted events
      this._setupEncryptedEventListener(mediaElement);

      this._log("DRM initialization complete");
      return true;
    } catch (error) {
      this._log("DRM initialization failed:", error);
      throw new Error(`Failed to initialize DRM: ${error.message}`);
    }
  }

  /**
   * Set server certificate (required for FairPlay)
   */
  async _setServerCertificate() {
    if (!this.certificateUrl) return;

    try {
      const response = await fetch(this.certificateUrl);
      const certificate = await response.arrayBuffer();
      await this.mediaKeys.setServerCertificate(certificate);
      this.serverCertificate = certificate;
      this._log("Server certificate set successfully");
    } catch (error) {
      this._log("Failed to set server certificate:", error);
      throw error;
    }
  }

  /**
   * Setup encrypted event listener for automatic license acquisition
   */
  _setupEncryptedEventListener(mediaElement) {
    mediaElement.addEventListener("encrypted", async (event) => {
      this._log("Encrypted event received:", event);

      try {
        await this._handleEncryptedEvent(event);
      } catch (error) {
        this._log("Failed to handle encrypted event:", error);
        this.onLicenseRequestError(error);
      }
    });
  }

  /**
   * Handle encrypted media event and acquire license
   */
  async _handleEncryptedEvent(event) {
    const { initDataType, initData } = event;

    // Create key session
    const sessionType = "temporary"; // Could be 'persistent-license' for offline content
    this.keySession = this.mediaKeys.createSession(sessionType);

    // Setup session event listeners
    this._setupSessionEventListeners();

    // Generate license request
    await this.keySession.generateRequest(initDataType, initData);
  }

  /**
   * Setup event listeners for the key session
   */
  _setupSessionEventListeners() {
    if (!this.keySession) return;

    // Handle license request messages
    this.keySession.addEventListener("message", async (event) => {
      this._log("License request message received");

      try {
        const license = await this._acquireLicense(event.message);
        await this.keySession.update(license);
        this._log("License applied successfully");
      } catch (error) {
        this._log("License acquisition failed:", error);
        this.onLicenseRequestError(error);
      }
    });

    // Handle key status changes
    this.keySession.addEventListener("keystatuseschange", (event) => {
      this._log("Key status changed");
      const keyStatuses = Array.from(this.keySession.keyStatuses);

      keyStatuses.forEach(([keyId, status]) => {
        this._log(`Key ${this._arrayBufferToHex(keyId)}: ${status}`);
        this.onKeyStatusChange(keyId, status);

        // Handle specific key statuses
        if (status === "expired" || status === "internal-error") {
          this._log(`Key error detected: ${status}`);
          this.onLicenseRequestError(new Error(`Key status error: ${status}`));
        }
      });
    });
  }

  /**
   * Acquire license from license server
   */
  async _acquireLicense(licenseRequest, retryCount = 0) {
    if (!this.licenseServerUrl) {
      throw new Error("License server URL not configured");
    }

    const headers = {
      "Content-Type": "application/octet-stream",
      ...this.customHeaders
    };

    // Add authentication if provided
    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(this.licenseServerUrl, {
        method: "POST",
        headers,
        body: licenseRequest
      });

      if (!response.ok) {
        throw new Error(
          `License server error: ${response.status} ${response.statusText}`,
        );
      }

      const license = await response.arrayBuffer();
      this._log("License acquired successfully");
      return license;
    } catch (error) {
      this._log(`License acquisition attempt ${retryCount + 1} failed:`, error);

      // Retry logic
      if (retryCount < this.retryCount) {
        await this._delay(this.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        return this._acquireLicense(licenseRequest, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Select the best available DRM system based on content requirements and browser support
   */
  _selectBestDrmSystem(contentSupportedSystems = []) {
    // Priority order: FairPlay (Safari), Widevine (Chrome), PlayReady (Edge)
    const priorityOrder = [
      DRM_SYSTEMS.FAIRPLAY,
      DRM_SYSTEMS.WIDEVINE,
      DRM_SYSTEMS.PLAYREADY,
    ];

    // If content specifies supported systems, filter by those
    let candidateSystems = this.supportedDrmSystems;
    if (contentSupportedSystems.length > 0) {
      candidateSystems = this.supportedDrmSystems.filter((system) =>
        contentSupportedSystems.includes(system.systemId),
      );
    }

    // Select based on priority order
    for (const systemId of priorityOrder) {
      const system = candidateSystems.find((s) => s.systemId === systemId);
      if (system) {
        return system;
      }
    }

    // Fallback to first available system
    return candidateSystems[0] || null;
  }

  /**
   * Get information about supported DRM systems
   */
  getSupportedSystems() {
    return this.supportedDrmSystems.map((system) => ({
      id: system.systemId,
      name: system.systemKey,
      label: system.config.label
    }));
  }

  /**
   * Check if a specific DRM system is supported
   */
  isSystemSupported(systemId) {
    return this.supportedDrmSystems.some((s) => s.systemId === systemId);
  }

  /**
   * Update authentication token
   */
  setAuthToken(token) {
    this.authToken = token;
  }

  /**
   * Update custom headers
   */
  setCustomHeaders(headers) {
    this.customHeaders = { ...headers };
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.keySession) {
      try {
        await this.keySession.close();
      } catch (error) {
        this._log("Error closing key session:", error);
      }
      this.keySession = null;
    }

    this.mediaKeys = null;
    this.selectedDrmSystem = null;
  }

  /**
   * Utility methods
   */
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  _arrayBufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  _log(...args) {
    if (this.debug) {
      console.log("[DrmEngine]", ...args);
    }
  }

  _defaultErrorHandler(error) {
    console.error("[DrmEngine] License request error:", error);
  }

  _defaultKeyStatusHandler(keyId, status) {
    console.log(
      `[DrmEngine] Key status: ${this._arrayBufferToHex(keyId)} -> ${status}`,
    );
  }

  /**
   * Static method to check EME support
   */
  static isEmeSupported() {
    return !!(navigator.requestMediaKeySystemAccess && window.MediaKeys);
  }

  /**
   * Static method to get browser DRM capabilities
   */
  static async getBrowserCapabilities() {
    if (!DrmEngine.isEmeSupported()) {
      return { supported: false, systems: [] };
    }

    const engine = new DrmEngine({ debug: false });
    await engine._initializeSupportedSystems();

    return {
      supported: true,
      systems: engine.getSupportedSystems()
    };
  }
}
