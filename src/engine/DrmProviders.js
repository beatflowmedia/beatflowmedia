/**
 * DrmProviders - Multi-DRM provider integration utilities
 *
 * Provides standardized interfaces for different DRM service providers:
 * - BuyDRM KeyOS
 * - Irdeto Control
 * - Verimatrix VCAS
 * - Custom license servers
 *
 * Features:
 * - Provider-specific license request formatting
 * - Authentication and token management
 * - Error handling and retry logic
 * - Provider failover strategies
 */

import { DRM_SYSTEMS } from "./DrmEngine";

/**
 * Base DRM Provider class
 */
export class BaseDrmProvider {
  constructor(config) {
    this.name = config.name;
    this.licenseServerUrl = config.licenseServerUrl;
    this.certificateUrl = config.certificateUrl;
    this.authToken = config.authToken;
    this.customHeaders = config.customHeaders || {};
    this.retryCount = config.retryCount || 3;
    this.timeout = config.timeout || 10000;
  }

  /**
   * Format license request for the provider
   */
  formatLicenseRequest(request, drmSystem, metadata = {}) {
    throw new Error("formatLicenseRequest must be implemented by provider");
  }

  /**
   * Process license response from the provider
   */
  processLicenseResponse(response, drmSystem) {
    throw new Error("processLicenseResponse must be implemented by provider");
  }

  /**
   * Get authentication headers for the provider
   */
  getAuthHeaders() {
    const headers = { ...this.customHeaders };

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Validate provider configuration
   */
  validateConfig() {
    if (!this.licenseServerUrl) {
      throw new Error(`${this.name}: License server URL is required`);
    }
  }
}

/**
 * BuyDRM KeyOS Provider
 */
export class BuyDrmProvider extends BaseDrmProvider {
  constructor(config) {
    super({ ...config, name: "BuyDRM KeyOS" });
    this.customerId = config.customerId;
    this.merchantId = config.merchantId;
    this.validateConfig();
  }

  validateConfig() {
    super.validateConfig();
    if (!this.customerId) {
      throw new Error("BuyDRM: Customer ID is required");
    }
  }

  formatLicenseRequest(request, drmSystem, metadata = {}) {
    const headers = {
      "Content-Type": "application/octet-stream",
      "X-AxDRM-Message": this._getAxDrmMessage(drmSystem, metadata),
      ...this.getAuthHeaders()
    };

    // Add BuyDRM specific headers
    if (this.customerId) {
      headers["customerId"] = this.customerId;
    }
    if (this.merchantId) {
      headers["merchantId"] = this.merchantId;
    }

    return {
      url: this.licenseServerUrl,
      method: "POST",
      headers,
      body: request
    };
  }

  processLicenseResponse(response, drmSystem) {
    // BuyDRM returns the license directly
    return response;
  }

  _getAxDrmMessage(drmSystem, metadata) {
    const message = {
      type: "license_request",
      version: "1.0",
      drm_system: drmSystem,
      content_id: metadata.contentId || "default",
      user_id: metadata.userId || "anonymous"
    };

    return btoa(JSON.stringify(message));
  }
}

/**
 * Irdeto Control Provider
 */
export class IrdetoProvider extends BaseDrmProvider {
  constructor(config) {
    super({ ...config, name: "Irdeto Control" });
    this.accountId = config.accountId;
    this.sessionToken = config.sessionToken;
    this.validateConfig();
  }

  validateConfig() {
    super.validateConfig();
    if (!this.accountId) {
      throw new Error("Irdeto: Account ID is required");
    }
  }

  formatLicenseRequest(request, drmSystem, metadata = {}) {
    const headers = {
      "Content-Type": "application/json",
      "X-Irdeto-Token": this.sessionToken || this.authToken,
      ...this.getAuthHeaders()
    };

    // Irdeto expects JSON-wrapped license request
    const body = JSON.stringify({
      license_request: Array.from(new Uint8Array(request)),
      drm_type: this._mapDrmSystem(drmSystem),
      account_id: this.accountId,
      content_id: metadata.contentId,
      user_info: {
        user_id: metadata.userId || "anonymous",
        device_id: metadata.deviceId || this._generateDeviceId()
      }
    });

    return {
      url: this.licenseServerUrl,
      method: "POST",
      headers,
      body
    };
  }

  processLicenseResponse(response, drmSystem) {
    // Parse JSON response and extract license
    const data = JSON.parse(response);
    if (data.error) {
      throw new Error(`Irdeto license error: ${data.error.message}`);
    }

    // Convert license array back to ArrayBuffer
    return new Uint8Array(data.license).buffer;
  }

  _mapDrmSystem(drmSystem) {
    const mapping = {
      [DRM_SYSTEMS.WIDEVINE]: "widevine",
      [DRM_SYSTEMS.PLAYREADY]: "playready",
      [DRM_SYSTEMS.FAIRPLAY]: "fairplay"
    };
    return mapping[drmSystem] || "unknown";
  }

  _generateDeviceId() {
    // Generate a simple device ID based on browser fingerprint
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("Device fingerprint", 2, 2);

    const fingerprint = canvas.toDataURL();
    return btoa(fingerprint).substring(0, 32);
  }
}

/**
 * Verimatrix VCAS Provider
 */
export class VerimatrixProvider extends BaseDrmProvider {
  constructor(config) {
    super({ ...config, name: "Verimatrix VCAS" });
    this.operatorId = config.operatorId;
    this.serviceId = config.serviceId;
    this.validateConfig();
  }

  validateConfig() {
    super.validateConfig();
    if (!this.operatorId) {
      throw new Error("Verimatrix: Operator ID is required");
    }
  }

  formatLicenseRequest(request, drmSystem, metadata = {}) {
    const headers = {
      "Content-Type": "application/octet-stream",
      "X-VmxToken": this.authToken,
      "X-VmxOperator": this.operatorId,
      "X-VmxService": this.serviceId || "default",
      ...this.getAuthHeaders()
    };

    // Add metadata as URL parameters for Verimatrix
    const url = new URL(this.licenseServerUrl);
    if (metadata.contentId) {
      url.searchParams.set("contentId", metadata.contentId);
    }
    if (metadata.userId) {
      url.searchParams.set("userId", metadata.userId);
    }

    return {
      url: url.toString(),
      method: "POST",
      headers,
      body: request
    };
  }

  processLicenseResponse(response, drmSystem) {
    // Verimatrix returns the license directly in binary format
    return response;
  }
}

/**
 * Custom/Generic DRM Provider
 */
export class CustomDrmProvider extends BaseDrmProvider {
  constructor(config) {
    super({ ...config, name: config.name || "Custom DRM" });
    this.requestFormatter = config.requestFormatter;
    this.responseProcessor = config.responseProcessor;
  }

  formatLicenseRequest(request, drmSystem, metadata = {}) {
    if (this.requestFormatter) {
      return this.requestFormatter(request, drmSystem, metadata, this);
    }

    // Default implementation
    return {
      url: this.licenseServerUrl,
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        ...this.getAuthHeaders()
      },
      body: request
    };
  }

  processLicenseResponse(response, drmSystem) {
    if (this.responseProcessor) {
      return this.responseProcessor(response, drmSystem, this);
    }

    // Default implementation - assume response is the license
    return response;
  }
}

/**
 * DRM Provider Factory
 */
export class DrmProviderFactory {
  static createProvider(type, config) {
    switch (type.toLowerCase()) {
      case "buydrm":
      case "keyos":
        return new BuyDrmProvider(config);

      case "irdeto":
      case "control":
        return new IrdetoProvider(config);

      case "verimatrix":
      case "vcas":
        return new VerimatrixProvider(config);

      case "custom":
      case "generic":
        return new CustomDrmProvider(config);

      default:
        throw new Error(`Unknown DRM provider type: ${type}`);
    }
  }

  static getSupportedProviders() {
    return [
      {
        id: "buydrm",
        name: "BuyDRM KeyOS",
        description: "BuyDRM KeyOS license server"
      },
      {
        id: "irdeto",
        name: "Irdeto Control",
        description: "Irdeto Control DRM platform"
      },
      {
        id: "verimatrix",
        name: "Verimatrix VCAS",
        description: "Verimatrix VCAS solution"
      },
      {
        id: "custom",
        name: "Custom Provider",
        description: "Custom DRM license server"
      },
    ];
  }
}

/**
 * Multi-Provider DRM Manager
 * Handles failover between multiple DRM providers
 */
export class MultiProviderDrmManager {
  constructor(providers = []) {
    this.providers = providers;
    this.currentProviderIndex = 0;
    this.failoverEnabled = true;
    this.maxRetries = 2;
  }

  addProvider(provider) {
    this.providers.push(provider);
  }

  getCurrentProvider() {
    return this.providers[this.currentProviderIndex];
  }

  async acquireLicense(request, drmSystem, metadata = {}, retryCount = 0) {
    const provider = this.getCurrentProvider();

    if (!provider) {
      throw new Error("No DRM providers configured");
    }

    try {
      console.log(
        `[MultiProviderDrmManager] Attempting license acquisition with ${provider.name}`,
      );

      // Format request for current provider
      const licenseRequest = provider.formatLicenseRequest(
        request,
        drmSystem,
        metadata,
      );

      // Make license request
      const response = await this._makeRequest(licenseRequest);

      // Process response
      const license = provider.processLicenseResponse(response, drmSystem);

      console.log(
        `[MultiProviderDrmManager] License acquired successfully from ${provider.name}`,
      );
      return license;
    } catch (error) {
      console.error(
        `[MultiProviderDrmManager] License acquisition failed with ${provider.name}:`,
        error,
      );

      // Try failover if enabled and providers available
      if (
        this.failoverEnabled &&
        this.providers.length > 1 &&
        retryCount < this.maxRetries
      ) {
        console.log(
          `[MultiProviderDrmManager] Attempting failover (retry ${retryCount + 1})`,
        );

        // Move to next provider
        this.currentProviderIndex =
          (this.currentProviderIndex + 1) % this.providers.length;

        // Retry with next provider
        return this.acquireLicense(
          request,
          drmSystem,
          metadata,
          retryCount + 1,
        );
      }

      throw error;
    }
  }

  async _makeRequest(licenseRequest) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.getCurrentProvider().timeout,
    );

    try {
      const response = await fetch(licenseRequest.url, {
        method: licenseRequest.method,
        headers: licenseRequest.headers,
        body: licenseRequest.body,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Return response based on content type
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return await response.text(); // Return as text for JSON processing
      } else {
        return await response.arrayBuffer();
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  setFailoverEnabled(enabled) {
    this.failoverEnabled = enabled;
  }

  resetProviderIndex() {
    this.currentProviderIndex = 0;
  }

  getProviderStatus() {
    return this.providers.map((provider, index) => ({
      name: provider.name,
      url: provider.licenseServerUrl,
      active: index === this.currentProviderIndex,
      index
    }));
  }
}

/**
 * DRM Configuration Helper
 */
export class DrmConfigHelper {
  static validateConfig(config) {
    const errors = [];

    if (!config.providers || !Array.isArray(config.providers)) {
      errors.push("DRM providers array is required");
    }

    if (config.providers) {
      config.providers.forEach((provider, index) => {
        try {
          DrmProviderFactory.createProvider(provider.type, provider.config);
        } catch (error) {
          errors.push(`Provider ${index}: ${error.message}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static createProvidersFromConfig(config) {
    const validation = this.validateConfig(config);

    if (!validation.valid) {
      throw new Error(
        `DRM configuration invalid: ${validation.errors.join(", ")}`,
      );
    }

    return config.providers.map((provider) =>
      DrmProviderFactory.createProvider(provider.type, provider.config),
    );
  }

  static getDefaultConfig() {
    return {
      providers: [
        {
          type: "custom",
          config: {
            name: "Default License Server",
            licenseServerUrl: "/api/drm/license",
            authToken: null,
            customHeaders: {},
            retryCount: 3,
            timeout: 10000
          }
        },
      ],
      failoverEnabled: true,
      debug: false
    };
  }
}

export default {
  BaseDrmProvider,
  BuyDrmProvider,
  IrdetoProvider,
  VerimatrixProvider,
  CustomDrmProvider,
  DrmProviderFactory,
  MultiProviderDrmManager,
  DrmConfigHelper
};
