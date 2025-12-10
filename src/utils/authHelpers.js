// src/utils/authHelpers.js

import React from 'react';

/**
 * Authentication and JWT utilities for secure music streaming
 */

class AuthError extends Error {
  constructor(message, code, statusCode = 401) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

class TokenManager {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.playbackToken = null;
    this.tokenExpiry = null;
    this.refreshPromise = null;
    this.listeners = new Set();
  }

  // Event listeners for token changes
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach((callback) => {
      try {
        callback(event, data);
      } catch (error) {
        console.error("Token listener error:", error);
      }
    });
  }

  // Set tokens from login response
  setTokens({ access_token, refresh_token, playback_token, expires_in }) {
    this.accessToken = access_token;
    this.refreshToken = refresh_token;
    this.playbackToken = playback_token;
    this.tokenExpiry = Date.now() + expires_in * 1000;

    // Store in localStorage for persistence
    try {
      localStorage.setItem(
        "auth_tokens",
        JSON.stringify({
          accessToken: this.accessToken,
          refreshToken: this.refreshToken,
          playbackToken: this.playbackToken,
          tokenExpiry: this.tokenExpiry
        }),
      );
    } catch (error) {
      console.warn("Failed to store tokens:", error);
    }

    this.notifyListeners("tokens_updated", {
      hasTokens: true,
      expiresAt: this.tokenExpiry
    });
  }

  // Load tokens from localStorage
  loadTokens() {
    try {
      const stored = localStorage.getItem("auth_tokens");
      if (stored) {
        const tokens = JSON.parse(stored);
        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
        this.playbackToken = tokens.playbackToken;
        this.tokenExpiry = tokens.tokenExpiry;

        // Check if tokens are expired
        if (this.tokenExpiry && Date.now() >= this.tokenExpiry) {
          this.clearTokens();
          return false;
        }

        this.notifyListeners("tokens_loaded", {
          hasTokens: true,
          expiresAt: this.tokenExpiry
        });

        return true;
      }
    } catch (error) {
      console.warn("Failed to load tokens:", error);
      this.clearTokens();
    }
    return false;
  }

  // Clear all tokens
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.playbackToken = null;
    this.tokenExpiry = null;

    try {
      localStorage.removeItem("auth_tokens");
    } catch (error) {
      console.warn("Failed to clear stored tokens:", error);
    }

    this.notifyListeners("tokens_cleared", { hasTokens: false });
  }

  // Get access token with auto-refresh
  async getAccessToken() {
    if (!this.accessToken) {
      throw new AuthError("No access token available", "NO_TOKEN");
    }

    // Check if token is about to expire (refresh 5 minutes before expiry)
    if (this.tokenExpiry && Date.now() >= this.tokenExpiry - 300000) {
      return await this.refreshAccessToken();
    }

    return this.accessToken;
  }

  // Get playback token with auto-refresh
  async getPlaybackToken() {
    if (!this.playbackToken) {
      throw new AuthError("No playback token available", "NO_PLAYBACK_TOKEN");
    }

    // Ensure access token is valid (playback token depends on it)
    await this.getAccessToken();

    return this.playbackToken;
  }

  // Refresh access token
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new AuthError("No refresh token available", "NO_REFRESH_TOKEN");
    }

    // Prevent multiple concurrent refresh requests
    if (this.refreshPromise) {
      return await this.refreshPromise;
    }

    this.refreshPromise = this._performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      this.refreshPromise = null;
      return result;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  async _performTokenRefresh() {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          refresh_token: this.refreshToken
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Refresh token is invalid, clear all tokens
          this.clearTokens();
          throw new AuthError(
            "Refresh token expired",
            "REFRESH_TOKEN_EXPIRED",
            401,
          );
        }
        throw new AuthError(
          "Failed to refresh token",
          "REFRESH_FAILED",
          response.status,
        );
      }

      const data = await response.json();
      this.setTokens(data);

      return this.accessToken;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        "Network error during token refresh",
        "NETWORK_ERROR",
        0,
      );
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!(
      this.accessToken &&
      this.tokenExpiry &&
      Date.now() < this.tokenExpiry
    );
  }

  // Get time until token expiry
  getTimeUntilExpiry() {
    if (!this.tokenExpiry) return 0;
    return Math.max(0, this.tokenExpiry - Date.now());
  }
}

// Global token manager instance
export const tokenManager = new TokenManager();

/**
 * Auth-aware fetch wrapper
 */
export async function authenticatedFetch(url, options = {}) {
  try {
    const token = await tokenManager.getAccessToken();

    const authOptions = {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers
      }
    };

    const response = await fetch(url, authOptions);

    // Handle 401 responses by attempting token refresh
    if (response.status === 401) {
      try {
        const newToken = await tokenManager.refreshAccessToken();
        const retryOptions = {
          ...authOptions,
          headers: {
            ...authOptions.headers,
            Authorization: `Bearer ${newToken}`
          }
        };

        return await fetch(url, retryOptions);
      } catch (refreshError) {
        // If refresh fails, the user needs to log in again
        tokenManager.clearTokens();
        throw new AuthError("Authentication required", "AUTH_REQUIRED", 401);
      }
    }

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError("Request failed", "REQUEST_FAILED", 0);
  }
}

/**
 * Playback-specific authenticated fetch
 */
export async function playbackFetch(url, options = {}) {
  try {
    const playbackToken = await tokenManager.getPlaybackToken();

    const playbackOptions = {
      ...options,
      headers: {
        Authorization: `Bearer ${playbackToken}`,
        "Content-Type": "application/json",
        ...options.headers
      }
    };

    const response = await fetch(url, playbackOptions);

    if (response.status === 401) {
      // Try refreshing tokens and retry
      try {
        await tokenManager.refreshAccessToken();
        const newPlaybackToken = await tokenManager.getPlaybackToken();
        const retryOptions = {
          ...playbackOptions,
          headers: {
            ...playbackOptions.headers,
            Authorization: `Bearer ${newPlaybackToken}`
          }
        };

        return await fetch(url, retryOptions);
      } catch (refreshError) {
        tokenManager.clearTokens();
        throw new AuthError(
          "Playback authentication required",
          "PLAYBACK_AUTH_REQUIRED",
          401,
        );
      }
    }

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      "Playback request failed",
      "PLAYBACK_REQUEST_FAILED",
      0,
    );
  }
}

/**
 * Login function
 */
export async function login(email, password) {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AuthError(
        error.message || "Login failed",
        error.code || "LOGIN_FAILED",
        response.status,
      );
    }

    const data = await response.json();
    tokenManager.setTokens(data);

    return data.user;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError("Login request failed", "LOGIN_REQUEST_FAILED", 0);
  }
}

/**
 * Logout function
 */
export async function logout() {
  try {
    if (tokenManager.refreshToken) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          refresh_token: tokenManager.refreshToken
        })
      });
    }
  } catch (error) {
    console.warn("Logout request failed:", error);
  } finally {
    tokenManager.clearTokens();
  }
}

/**
 * Check authentication status
 */
export function checkAuthStatus() {
  // Try to load tokens from storage
  const hasStoredTokens = tokenManager.loadTokens();

  if (hasStoredTokens && tokenManager.isAuthenticated()) {
    return {
      isAuthenticated: true,
      timeUntilExpiry: tokenManager.getTimeUntilExpiry()
    };
  } else {
    tokenManager.clearTokens();
    return {
      isAuthenticated: false,
      timeUntilExpiry: 0
    };
  }
}

/**
 * React hook for authentication state
 */
export function useAuth() {
  const [authState, setAuthState] = React.useState(() => checkAuthStatus());

  React.useEffect(() => {
    // Listen for token changes
    const unsubscribe = tokenManager.addListener((event, data) => {
      switch (event) {
        case "tokens_updated":
        case "tokens_loaded":
          setAuthState({
            isAuthenticated: true,
            timeUntilExpiry: tokenManager.getTimeUntilExpiry()
          });
          break;
        case "tokens_cleared":
          setAuthState({
            isAuthenticated: false,
            timeUntilExpiry: 0
          });
          break;
        default:
          // Handle unknown events gracefully
          break;
      }
    });

    // Set up auto-refresh timer
    let refreshTimer;
    const scheduleRefresh = () => {
      const timeUntilExpiry = tokenManager.getTimeUntilExpiry();
      if (timeUntilExpiry > 300000) {
        // More than 5 minutes
        refreshTimer = setTimeout(() => {
          if (tokenManager.isAuthenticated()) {
            tokenManager.refreshAccessToken().catch(console.error);
          }
        }, timeUntilExpiry - 300000); // Refresh 5 minutes before expiry
      }
    };

    if (authState.isAuthenticated) {
      scheduleRefresh();
    }

    return () => {
      unsubscribe();
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, [authState.isAuthenticated]);

  return {
    ...authState,
    login,
    logout,
    tokenManager
  };
}

/**
 * Error handler for auth-related errors
 */
export function handleAuthError(error, options = {}) {
  const { onAuthRequired, onNetworkError, onUnknownError } = options;

  if (error instanceof AuthError) {
    switch (error.code) {
      case "NO_TOKEN":
      case "NO_REFRESH_TOKEN":
      case "REFRESH_TOKEN_EXPIRED":
      case "AUTH_REQUIRED":
      case "PLAYBACK_AUTH_REQUIRED":
        onAuthRequired?.(error);
        break;
      case "NETWORK_ERROR":
        onNetworkError?.(error);
        break;
      default:
        onUnknownError?.(error);
        break;
    }
  } else {
    onUnknownError?.(error);
  }
}

/**
 * Enhanced MSE Engine with JWT integration
 */
export class AuthenticatedMseEngine {
  constructor(audioElement) {
    this.engine = new (require("../engine/MseEngine").default)(audioElement);
    this.loadPromises = new Map();
  }

  async load(track) {
    const trackId = track.id;

    // Prevent duplicate loads
    if (this.loadPromises.has(trackId)) {
      return await this.loadPromises.get(trackId);
    }

    const loadPromise = this._loadWithAuth(track);
    this.loadPromises.set(trackId, loadPromise);

    try {
      const result = await loadPromise;
      this.loadPromises.delete(trackId);
      return result;
    } catch (error) {
      this.loadPromises.delete(trackId);
      throw error;
    }
  }

  async _loadWithAuth(track) {
    try {
      const playbackToken = await tokenManager.getPlaybackToken();

      // Create authenticated engine with playback token
      const authenticatedEngine = new (require("../engine/MseEngine").default)(
        this.engine.audio,
        playbackToken,
      );

      // Copy engine methods
      Object.setPrototypeOf(this, Object.getPrototypeOf(authenticatedEngine));
      Object.assign(this, authenticatedEngine);

      // Load track with authentication
      return await authenticatedEngine.load(track);
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError("Failed to load track", "TRACK_LOAD_FAILED", 0);
    }
  }

  // Proxy other engine methods
  play() {
    return this.engine.play();
  }
  pause() {
    return this.engine.pause();
  }
  seek(time) {
    return this.engine.seek(time);
  }
  setVolume(volume) {
    return this.engine.setVolume(volume);
  }
  onTimeUpdate(cb) {
    return this.engine.onTimeUpdate(cb);
  }
  onDurationChange(cb) {
    return this.engine.onDurationChange(cb);
  }
  onVolumeChange(cb) {
    return this.engine.onVolumeChange(cb);
  }
  onEnded(cb) {
    return this.engine.onEnded(cb);
  }
}

export { AuthError };
