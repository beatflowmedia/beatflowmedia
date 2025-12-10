/**
 * DrmCompatibility - Browser compatibility matrix and fallback strategies
 *
 * Provides comprehensive browser support detection and fallback mechanisms for:
 * - EME (Encrypted Media Extensions) support
 * - DRM system compatibility
 * - Browser-specific limitations and workarounds
 * - Graceful degradation strategies
 */

import { DRM_SYSTEMS } from "./DrmEngine";

/**
 * Browser compatibility matrix for DRM systems
 */
export const BROWSER_DRM_SUPPORT = {
  // Chrome / Chromium-based browsers
  chrome: {
    [DRM_SYSTEMS.WIDEVINE]: {
      supported: true,
      minVersion: 35,
      limitations: [],
      features: ["hardware-secure-decoding", "persistent-license", "hdcp"]
    },
    [DRM_SYSTEMS.PLAYREADY]: {
      supported: false,
      reason: "Not supported in Chrome"
    },
    [DRM_SYSTEMS.FAIRPLAY]: {
      supported: false,
      reason: "Apple proprietary, Safari only"
    }
  },

  // Firefox
  firefox: {
    [DRM_SYSTEMS.WIDEVINE]: {
      supported: true,
      minVersion: 47,
      limitations: ["no-persistent-license", "software-decoding-only"],
      features: ["temporary-license"],
      notes: "Requires user to enable DRM in preferences"
    },
    [DRM_SYSTEMS.PLAYREADY]: {
      supported: false,
      reason: "Not supported in Firefox"
    },
    [DRM_SYSTEMS.FAIRPLAY]: {
      supported: false,
      reason: "Apple proprietary, Safari only"
    }
  },

  // Safari
  safari: {
    [DRM_SYSTEMS.WIDEVINE]: {
      supported: false,
      reason: "Not supported in Safari"
    },
    [DRM_SYSTEMS.PLAYREADY]: {
      supported: false,
      reason: "Not supported in Safari"
    },
    [DRM_SYSTEMS.FAIRPLAY]: {
      supported: true,
      minVersion: 9,
      limitations: ["hls-only", "certificate-required"],
      features: ["hardware-secure-decoding", "airplay-support"],
      notes: "Requires HLS delivery, not DASH"
    }
  },

  // Microsoft Edge
  edge: {
    [DRM_SYSTEMS.WIDEVINE]: {
      supported: true,
      minVersion: 79, // Chromium-based Edge
      limitations: [],
      features: ["hardware-secure-decoding", "persistent-license"]
    },
    [DRM_SYSTEMS.PLAYREADY]: {
      supported: true,
      minVersion: 12, // Legacy Edge
      limitations: ["legacy-edge-only"],
      features: ["hardware-secure-decoding", "persistent-license", "sl3000"],
      notes: "Full support in legacy Edge, limited in Chromium Edge"
    },
    [DRM_SYSTEMS.FAIRPLAY]: {
      supported: false,
      reason: "Apple proprietary, Safari only"
    }
  },

  // Internet Explorer (legacy support)
  ie: {
    [DRM_SYSTEMS.WIDEVINE]: {
      supported: false,
      reason: "EME not supported in IE"
    },
    [DRM_SYSTEMS.PLAYREADY]: {
      supported: false, // Requires legacy PlayReady APIs, not EME
      reason: "EME not supported, requires legacy APIs"
    },
    [DRM_SYSTEMS.FAIRPLAY]: {
      supported: false,
      reason: "Not supported"
    }
  },

  // Mobile browsers
  mobile: {
    android: {
      chrome: {
        [DRM_SYSTEMS.WIDEVINE]: {
          supported: true,
          minVersion: 35,
          limitations: ["security-level-dependent"],
          features: ["hardware-secure-decoding", "l1-l3-support"],
          notes: "Hardware security level depends on device"
        }
      },
      firefox: {
        [DRM_SYSTEMS.WIDEVINE]: {
          supported: true,
          minVersion: 47,
          limitations: ["software-decoding-only"],
          features: ["temporary-license"]
        }
      }
    },
    ios: {
      safari: {
        [DRM_SYSTEMS.FAIRPLAY]: {
          supported: true,
          minVersion: 9,
          limitations: ["hls-only"],
          features: ["hardware-secure-decoding"],
          notes: "iOS native support"
        }
      },
      chrome: {
        // Chrome on iOS uses Safari WebKit engine
        [DRM_SYSTEMS.FAIRPLAY]: {
          supported: true,
          minVersion: 9,
          limitations: ["hls-only", "webkit-engine"],
          features: ["hardware-secure-decoding"],
          notes: "Uses Safari WebKit engine"
        }
      }
    }
  }
};

/**
 * Platform-specific DRM requirements
 */
export const PLATFORM_REQUIREMENTS = {
  windows: {
    [DRM_SYSTEMS.PLAYREADY]: {
      requirements: ["windows-media-foundation", "drm-enabled-hardware"],
      securityLevels: ["SL150", "SL2000", "SL3000"],
      notes: "Requires Windows Media Foundation and hardware DRM support"
    },
    [DRM_SYSTEMS.WIDEVINE]: {
      requirements: ["chrome-browser", "hardware-drm-optional"],
      securityLevels: ["L1", "L3"],
      notes: "Software fallback available for L3"
    }
  },
  macos: {
    [DRM_SYSTEMS.FAIRPLAY]: {
      requirements: ["safari-browser", "secure-element"],
      securityLevels: ["hardware"],
      notes: "Requires Safari and hardware security"
    }
  },
  android: {
    [DRM_SYSTEMS.WIDEVINE]: {
      requirements: ["android-4.4+", "mediadrm-api"],
      securityLevels: ["L1", "L3"],
      notes: "L1 requires hardware security, L3 software fallback"
    }
  },
  ios: {
    [DRM_SYSTEMS.FAIRPLAY]: {
      requirements: ["ios-9+", "secure-enclave"],
      securityLevels: ["hardware"],
      notes: "Built into iOS platform"
    }
  }
};

/**
 * Browser Detection Utility
 */
export class BrowserDetector {
  constructor() {
    this.userAgent = navigator.userAgent;
    this.browserInfo = this._detectBrowser();
    this.platformInfo = this._detectPlatform();
  }

  _detectBrowser() {
    const ua = this.userAgent;

    if (ua.includes("Chrome") && !ua.includes("Edg")) {
      const version = this._extractVersion(ua, /Chrome\/(\d+)/);
      return { name: "chrome", version, fullName: "Google Chrome" };
    }

    if (ua.includes("Firefox")) {
      const version = this._extractVersion(ua, /Firefox\/(\d+)/);
      return { name: "firefox", version, fullName: "Mozilla Firefox" };
    }

    if (ua.includes("Safari") && !ua.includes("Chrome")) {
      const version = this._extractVersion(ua, /Version\/(\d+)/);
      return { name: "safari", version, fullName: "Safari" };
    }

    if (ua.includes("Edg")) {
      const version = this._extractVersion(ua, /Edg\/(\d+)/);
      return { name: "edge", version, fullName: "Microsoft Edge" };
    }

    if (ua.includes("Trident") || ua.includes("MSIE")) {
      const version = this._extractVersion(ua, /(?:MSIE |rv:)(\d+)/);
      return { name: "ie", version, fullName: "Internet Explorer" };
    }

    return { name: "unknown", version: 0, fullName: "Unknown Browser" };
  }

  _detectPlatform() {
    const ua = this.userAgent;

    if (ua.includes("Windows")) {
      return { name: "windows", mobile: false };
    }

    if (ua.includes("Mac OS X")) {
      return { name: "macos", mobile: false };
    }

    if (ua.includes("Android")) {
      return { name: "android", mobile: true };
    }

    if (ua.includes("iPhone") || ua.includes("iPad")) {
      return { name: "ios", mobile: true };
    }

    if (ua.includes("Linux")) {
      return { name: "linux", mobile: false };
    }

    return { name: "unknown", mobile: false };
  }

  _extractVersion(ua, regex) {
    const match = ua.match(regex);
    return match ? parseInt(match[1], 10) : 0;
  }

  getBrowserInfo() {
    return this.browserInfo;
  }

  getPlatformInfo() {
    return this.platformInfo;
  }

  isMobile() {
    return this.platformInfo.mobile;
  }
}

/**
 * DRM Compatibility Checker
 */
export class DrmCompatibilityChecker {
  constructor() {
    this.detector = new BrowserDetector();
    this.browserInfo = this.detector.getBrowserInfo();
    this.platformInfo = this.detector.getPlatformInfo();
  }

  /**
   * Check if EME is supported in the current browser
   */
  isEmeSupported() {
    return !!(navigator.requestMediaKeySystemAccess && window.MediaKeys);
  }

  /**
   * Check if a specific DRM system is supported
   */
  isDrmSystemSupported(drmSystem) {
    if (!this.isEmeSupported()) {
      return {
        supported: false,
        reason: "EME not supported in this browser"
      };
    }

    const browserSupport = this._getBrowserDrmSupport();
    const systemSupport = browserSupport[drmSystem];

    if (!systemSupport) {
      return {
        supported: false,
        reason: `DRM system ${drmSystem} not found in compatibility matrix`
      };
    }

    if (!systemSupport.supported) {
      return {
        supported: false,
        reason: systemSupport.reason || "Not supported"
      };
    }

    // Check minimum version requirement
    if (
      systemSupport.minVersion &&
      this.browserInfo.version < systemSupport.minVersion
    ) {
      return {
        supported: false,
        reason: `Requires ${this.browserInfo.fullName} version ${systemSupport.minVersion} or higher`
      };
    }

    return {
      supported: true,
      limitations: systemSupport.limitations || [],
      features: systemSupport.features || [],
      notes: systemSupport.notes
    };
  }

  /**
   * Get the best DRM system for the current browser
   */
  getBestDrmSystem() {
    const systems = Object.values(DRM_SYSTEMS);
    const supportedSystems = [];

    for (const system of systems) {
      const support = this.isDrmSystemSupported(system);
      if (support.supported) {
        supportedSystems.push({
          system,
          support,
          priority: this._getDrmSystemPriority(system)
        });
      }
    }

    // Sort by priority (higher is better)
    supportedSystems.sort((a, b) => b.priority - a.priority);

    return supportedSystems.length > 0 ? supportedSystems[0] : null;
  }

  /**
   * Get comprehensive compatibility report
   */
  getCompatibilityReport() {
    const report = {
      browser: this.browserInfo,
      platform: this.platformInfo,
      eme: {
        supported: this.isEmeSupported(),
        api: !!navigator.requestMediaKeySystemAccess
      },
      drmSystems: {},
      recommendations: []
    };

    // Check each DRM system
    Object.values(DRM_SYSTEMS).forEach((system) => {
      report.drmSystems[system] = this.isDrmSystemSupported(system);
    });

    // Add recommendations
    report.recommendations = this._generateRecommendations(report);

    return report;
  }

  /**
   * Get fallback strategies for unsupported scenarios
   */
  getFallbackStrategies() {
    const strategies = [];

    if (!this.isEmeSupported()) {
      strategies.push({
        type: "no-eme",
        description: "Use unencrypted content delivery",
        implementation: "Serve clear/unencrypted media files",
        limitations: ["No content protection", "Piracy risk"]
      });

      strategies.push({
        type: "server-side",
        description: "Server-side access control",
        implementation: "Use token-based authentication and time-limited URLs",
        limitations: ["Limited protection", "URL sharing risk"]
      });

      return strategies;
    }

    // Browser-specific fallbacks
    const browserSupport = this._getBrowserDrmSupport();

    Object.entries(browserSupport).forEach(([system, support]) => {
      if (!support.supported) {
        switch (system) {
          case DRM_SYSTEMS.FAIRPLAY:
            if (this.browserInfo.name !== "safari") {
              strategies.push({
                type: "fairplay-fallback",
                description: "Use Widevine for non-Safari browsers",
                implementation:
                  "Detect Safari and serve FairPlay, otherwise use Widevine",
                limitations: [
                  "Requires dual-encoding",
                  "Different license servers",
                ]
              });
            }
            break;

          case DRM_SYSTEMS.PLAYREADY:
            strategies.push({
              type: "playready-fallback",
              description: "Use Widevine as fallback for PlayReady",
              implementation:
                "Detect Edge legacy and serve PlayReady, otherwise use Widevine",
              limitations: ["Limited PlayReady support in modern browsers"]
            });
            break;
        }
      }
    });

    return strategies;
  }

  /**
   * Helper methods
   */
  _getBrowserDrmSupport() {
    const platformKey = this.platformInfo.mobile
      ? `mobile.${this.platformInfo.name}.${this.browserInfo.name}`
      : this.browserInfo.name;

    // Navigate the support matrix
    let support = BROWSER_DRM_SUPPORT;
    const keys = platformKey.split(".");

    for (const key of keys) {
      support = support[key];
      if (!support) break;
    }

    return support || {};
  }

  _getDrmSystemPriority(system) {
    // Priority based on security and platform optimization
    const priorities = {
      [DRM_SYSTEMS.FAIRPLAY]: this.browserInfo.name === "safari" ? 10 : 0,
      [DRM_SYSTEMS.WIDEVINE]: this.browserInfo.name === "chrome" ? 9 : 7,
      [DRM_SYSTEMS.PLAYREADY]:
        this.browserInfo.name === "edge" && this.browserInfo.version < 79
          ? 8
          : 5
    };

    return priorities[system] || 0;
  }

  _generateRecommendations(report) {
    const recommendations = [];

    // EME not supported
    if (!report.eme.supported) {
      recommendations.push({
        type: "critical",
        message: "EME not supported - consider fallback to unencrypted content",
        action:
          "Implement server-side access control or browser upgrade prompts"
      });
      return recommendations;
    }

    // No DRM systems supported
    const supportedSystems = Object.values(report.drmSystems).filter(
      (s) => s.supported,
    );
    if (supportedSystems.length === 0) {
      recommendations.push({
        type: "critical",
        message: "No DRM systems supported in this browser",
        action: "Implement graceful degradation to unencrypted content"
      });
      return recommendations;
    }

    // Browser-specific recommendations
    switch (report.browser.name) {
      case "safari":
        recommendations.push({
          type: "info",
          message: "Safari detected - use FairPlay DRM with HLS delivery",
          action: "Ensure content is packaged for HLS with FairPlay encryption"
        });
        break;

      case "firefox":
        if (report.drmSystems[DRM_SYSTEMS.WIDEVINE].supported) {
          recommendations.push({
            type: "warning",
            message: "Firefox requires user consent for DRM",
            action: "Provide clear instructions for enabling DRM in Firefox"
          });
        }
        break;

      case "edge":
        if (report.browser.version >= 79) {
          recommendations.push({
            type: "info",
            message: "Modern Edge detected - use Widevine DRM",
            action:
              "Use Widevine instead of PlayReady for better compatibility"
          });
        }
        break;
    }

    return recommendations;
  }
}

/**
 * Fallback Strategy Manager
 */
export class FallbackStrategyManager {
  constructor(options = {}) {
    this.compatibilityChecker = new DrmCompatibilityChecker();
    this.enableGracefulDegradation =
      options.enableGracefulDegradation !== false;
    this.fallbackToUnencrypted = options.fallbackToUnencrypted !== false;
  }

  /**
   * Determine the best playback strategy for the current environment
   */
  async determinePlaybackStrategy(contentInfo) {
    const report = this.compatibilityChecker.getCompatibilityReport();

    // If EME is not supported
    if (!report.eme.supported) {
      return this._getUnencryptedFallback(contentInfo);
    }

    // Find the best supported DRM system
    const bestDrm = this.compatibilityChecker.getBestDrmSystem();

    if (bestDrm) {
      return {
        type: "drm",
        drmSystem: bestDrm.system,
        engineClass: "EnhancedMseEngine",
        limitations: bestDrm.support.limitations,
        features: bestDrm.support.features,
        contentFormat: this._getContentFormat(bestDrm.system),
        fallbackAvailable: this.fallbackToUnencrypted
      };
    }

    // No DRM support - fallback strategies
    if (this.enableGracefulDegradation) {
      return this._getGracefulDegradationStrategy(contentInfo);
    }

    throw new Error(
      "No compatible DRM system found and graceful degradation disabled",
    );
  }

  _getUnencryptedFallback(contentInfo) {
    if (!this.fallbackToUnencrypted) {
      throw new Error("Unencrypted fallback disabled");
    }

    return {
      type: "unencrypted",
      drmSystem: null,
      engineClass: "MseEngine", // Use original MSE engine
      limitations: ["no-content-protection"],
      features: ["basic-playback"],
      contentFormat: "clear",
      fallbackAvailable: false
    };
  }

  _getGracefulDegradationStrategy(contentInfo) {
    // Strategy 1: Server-side protection
    if (contentInfo.serverSideProtection) {
      return {
        type: "server-protected",
        drmSystem: null,
        engineClass: "MseEngine",
        limitations: ["limited-protection", "url-based-access"],
        features: ["token-authentication", "time-limited-access"],
        contentFormat: "clear",
        fallbackAvailable: false
      };
    }

    // Strategy 2: Watermarked content
    if (contentInfo.watermarkingAvailable) {
      return {
        type: "watermarked",
        drmSystem: null,
        engineClass: "MseEngine",
        limitations: ["visible-watermark", "user-tracking"],
        features: ["forensic-watermarking", "user-identification"],
        contentFormat: "clear",
        fallbackAvailable: false
      };
    }

    // Strategy 3: Preview/teaser content
    return {
      type: "preview",
      drmSystem: null,
      engineClass: "LegacyAudioEngine",
      limitations: ["preview-only", "limited-duration"],
      features: ["sample-playback"],
      contentFormat: "preview",
      fallbackAvailable: false
    };
  }

  _getContentFormat(drmSystem) {
    switch (drmSystem) {
      case DRM_SYSTEMS.FAIRPLAY:
        return "hls"; // FairPlay requires HLS
      case DRM_SYSTEMS.WIDEVINE:
      case DRM_SYSTEMS.PLAYREADY:
        return "dash"; // DASH with CENC
      default:
        return "dash";
    }
  }

  /**
   * Generate user-friendly compatibility message
   */
  getCompatibilityMessage() {
    const report = this.compatibilityChecker.getCompatibilityReport();

    if (!report.eme.supported) {
      return {
        type: "error",
        message: "Your browser does not support protected content playback.",
        suggestion:
          "Please update to a modern browser or use the unencrypted version."
      };
    }

    const supportedSystems = Object.entries(report.drmSystems).filter(
      ([_, support]) => support.supported,
    ).length;

    if (supportedSystems === 0) {
      return {
        type: "warning",
        message: "Protected content may not play in your current browser.",
        suggestion:
          "Try using Chrome, Firefox, Safari, or Edge for best compatibility."
      };
    }

    return {
      type: "success",
      message: "Your browser supports protected content playback.",
      suggestion: null
    };
  }
}

// Export all utilities
export default {
  BROWSER_DRM_SUPPORT,
  PLATFORM_REQUIREMENTS,
  BrowserDetector,
  DrmCompatibilityChecker,
  FallbackStrategyManager
};
