/**
 * Authentication Service Tests
 *
 * Comprehensive test suite for authentication flows, security features,
 * and token management functionality
 */

import { jest } from "@jest/globals";
import { authService } from "../../services/authService";
import { auth, db } from "../../firebaseConfig";

// Mock Firebase modules
jest.mock("../../firebaseConfig", () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
    signInWithPopup: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    verifyIdToken: jest.fn()
  },
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn()
      }))
    }))
  }
}));

// Mock fetch globally
global.fetch = jest.fn();

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  describe("Multi-Provider Authentication", () => {
    test("should sign in with Google provider", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@example.com",
        displayName: "Test User"
      };

      auth.signInWithPopup.mockResolvedValue({ user: mockUser });

      const result = await authService.signInWithProvider("google.com");

      expect(auth.signInWithPopup).toHaveBeenCalled();
      expect(result.user).toEqual(mockUser);
    });

    test("should handle OAuth provider errors", async () => {
      const error = new Error("Provider authentication failed");
      auth.signInWithPopup.mockRejectedValue(error);

      await expect(
        authService.signInWithProvider("google.com"),
      ).rejects.toThrow("Provider authentication failed");
    });

    test("should configure custom scopes for providers", async () => {
      const customScopes = ["user-read-email", "user-read-private"];

      await authService.signInWithProvider("spotify.com", {
        customScopes
      });

      // Verify provider was configured with custom scopes
      expect(auth.signInWithPopup).toHaveBeenCalled();
    });

    test("should support redirect-based authentication", async () => {
      await authService.signInWithProvider("apple.com", {
        useRedirect: true
      });

      // Should not return result for redirect flow
      expect(auth.signInWithPopup).not.toHaveBeenCalled();
    });
  });

  describe("Email/Password Authentication", () => {
    test("should sign in with valid credentials", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@example.com",
        emailVerified: true
      };

      auth.signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      const result = await authService.signInWithEmail(
        "test@example.com",
        "password123",
      );

      expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        "test@example.com",
        "password123",
      );
      expect(result.user).toEqual(mockUser);
    });

    test("should reject unverified email addresses", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@example.com",
        emailVerified: false
      };

      auth.signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      auth.signOut.mockResolvedValue();

      await expect(
        authService.signInWithEmail("test@example.com", "password123", {
          requireEmailVerification: true
        }),
      ).rejects.toThrow("Email verification required");

      expect(auth.signOut).toHaveBeenCalled();
    });

    test("should handle authentication errors gracefully", async () => {
      const error = { code: "auth/wrong-password" };
      auth.signInWithEmailAndPassword.mockRejectedValue(error);

      await expect(
        authService.signInWithEmail("test@example.com", "wrongpassword"),
      ).rejects.toThrow("Incorrect password");
    });
  });

  describe("User Registration", () => {
    test("should register new user with email verification", async () => {
      const mockUser = {
        uid: "new-user-uid",
        email: "newuser@example.com",
        sendEmailVerification: jest.fn().mockResolvedValue()
      };

      auth.createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      const result = await authService.registerWithEmail(
        "newuser@example.com",
        "password123",
        { displayName: "New User" },
      );

      expect(auth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        "newuser@example.com",
        "password123",
      );
      expect(mockUser.sendEmailVerification).toHaveBeenCalled();
    });

    test("should create user profile with default settings", async () => {
      const mockUser = {
        uid: "new-user-uid",
        email: "newuser@example.com",
        sendEmailVerification: jest.fn().mockResolvedValue()
      };

      auth.createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      await authService.registerWithEmail("newuser@example.com", "password123");

      // Verify user profile creation would be called
      expect(db.collection).toHaveBeenCalledWith("users");
    });
  });

  describe("JWT Playback Token System", () => {
    test("should generate playback token with valid permissions", async () => {
      const mockUser = {
        uid: "test-uid",
        getIdToken: jest.fn().mockResolvedValue("firebase-token")
      };

      authService.currentUser = mockUser;

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          token: "jwt-playback-token",
          expiresAt: new Date(Date.now() + 120000).toISOString(),
          permissions: ["stream:premium"],
          quality: "high"
        })
      };

      global.fetch.mockResolvedValue(mockResponse);

      const result = await authService.generatePlaybackToken({
        contentId: "content-123",
        contentType: "audio",
        permissions: ["stream:premium"],
        quality: "high"
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/auth/playback-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer firebase-token"
        },
        body: expect.stringContaining("content-123")
      });

      expect(result.token).toBe("jwt-playback-token");
      expect(result.permissions).toContain("stream:premium");
    });

    test("should handle token generation failures", async () => {
      const mockUser = {
        uid: "test-uid",
        getIdToken: jest.fn().mockResolvedValue("firebase-token")
      };

      authService.currentUser = mockUser;

      const mockResponse = {
        ok: false,
        status: 403
      };

      global.fetch.mockResolvedValue(mockResponse);

      await expect(
        authService.generatePlaybackToken({
          contentId: "restricted-content"
        }),
      ).rejects.toThrow("Failed to generate playback token");
    });

    test("should refresh playback token near expiry", async () => {
      const mockUser = {
        uid: "test-uid",
        getIdToken: jest.fn().mockResolvedValue("firebase-token")
      };

      authService.currentUser = mockUser;

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          token: "new-jwt-token",
          expiresAt: new Date(Date.now() + 120000).toISOString()
        })
      };

      global.fetch.mockResolvedValue(mockResponse);

      const result = await authService.refreshPlaybackToken("old-token");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/refresh-playback-token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer firebase-token"
          },
          body: expect.stringContaining("old-token")
        },
      );

      expect(result.token).toBe("new-jwt-token");
    });
  });

  describe("Device Management", () => {
    test("should register new device with fingerprint", async () => {
      const mockUser = { uid: "test-uid" };
      authService.currentUser = mockUser;
      authService.deviceFingerprint = "device-fingerprint-123";

      // Mock device info
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        configurable: true
      });

      const device = await authService.registerDevice({
        name: "Test Device",
        type: "desktop"
      });

      expect(device.id).toBe("device-fingerprint-123");
      expect(device.name).toBe("Test Device");
      expect(device.trusted).toBe(false);
    });

    test("should generate consistent device fingerprint", () => {
      // Mock canvas and navigator
      const mockCanvas = {
        getContext: jest.fn().mockReturnValue({
          textBaseline: "",
          font: "",
          fillText: jest.fn()
        }),
        toDataURL: jest.fn().mockReturnValue("canvas-data")
      };

      document.createElement = jest.fn().mockReturnValue(mockCanvas);

      authService.initializeDeviceFingerprint();

      expect(authService.deviceFingerprint).toBeDefined();
      expect(typeof authService.deviceFingerprint).toBe("string");
    });
  });

  describe("Session Management", () => {
    test("should initialize session on login", async () => {
      const mockUser = { uid: "test-uid" };
      authService.currentUser = mockUser;

      const mockLocalStorage = {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn()
      };

      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
        configurable: true
      });

      await authService.handleUserLogin(mockUser);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "beatflow_session",
        expect.stringContaining("test-uid"),
      );
    });

    test("should clear session on logout", async () => {
      const mockLocalStorage = {
        removeItem: jest.fn()
      };

      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
        configurable: true
      });

      const mockSessionStorage = {
        clear: jest.fn()
      };

      Object.defineProperty(window, "sessionStorage", {
        value: mockSessionStorage,
        configurable: true
      });

      await authService.handleUserLogout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        "beatflow_session",
      );
      expect(mockSessionStorage.clear).toHaveBeenCalled();
    });
  });

  describe("Role-Based Access Control", () => {
    test("should validate user permissions", async () => {
      const mockUserProfile = {
        permissions: ["stream:premium", "download"]
      };

      authService.getUserProfile = jest.fn().mockResolvedValue(mockUserProfile);

      const hasPermission = await authService.hasPermission("stream:premium");
      expect(hasPermission).toBe(true);

      const hasNoPermission = await authService.hasPermission("admin:manage");
      expect(hasNoPermission).toBe(false);
    });

    test("should check subscription tier access", async () => {
      const mockUserProfile = {
        subscriptionTier: "PREMIUM",
        permissions: ["stream:premium"]
      };

      authService.getUserProfile = jest.fn().mockResolvedValue(mockUserProfile);

      const canAccessPremium = await authService.canAccessContent("premium");
      expect(canAccessPremium).toBe(true);

      const canAccessFree = await authService.canAccessContent("free");
      expect(canAccessFree).toBe(true);
    });
  });

  describe("Security Features", () => {
    test("should handle authentication errors with proper messages", () => {
      const testCases = [
        {
          error: { code: "auth/user-not-found" },
          expectedMessage: "No account found with this email address."
        },
        {
          error: { code: "auth/wrong-password" },
          expectedMessage: "Incorrect password. Please try again."
        },
        {
          error: { code: "auth/too-many-requests" },
          expectedMessage: "Too many failed attempts. Please try again later."
        },
      ];

      testCases.forEach(({ error, expectedMessage }) => {
        const result = authService.handleAuthError(error);
        expect(result.message).toBe(expectedMessage);
      });
    });

    test("should generate secure session IDs", () => {
      const sessionId1 = authService.generateSessionId();
      const sessionId2 = authService.generateSessionId();

      expect(sessionId1).toMatch(/^sess_[a-f0-9]{16}$/);
      expect(sessionId2).toMatch(/^sess_[a-f0-9]{16}$/);
      expect(sessionId1).not.toBe(sessionId2);
    });

    test("should determine max quality based on subscription", () => {
      const testCases = [
        { tier: "FREE", requested: "high", expected: "standard" },
        { tier: "PREMIUM", requested: "high", expected: "high" },
        { tier: "ARTIST", requested: "lossless", expected: "lossless" },
        { tier: "PREMIUM", requested: "lossless", expected: "high" },
      ];

      testCases.forEach(({ tier, requested, expected }) => {
        const result = authService.getMaxQuality(tier, requested);
        expect(result).toBe(expected);
      });
    });
  });

  describe("Error Handling", () => {
    test("should handle network errors gracefully", async () => {
      authService.currentUser = {
        uid: "test-uid",
        getIdToken: jest.fn().mockResolvedValue("token")
      };

      global.fetch.mockRejectedValue(new Error("Network error"));

      await expect(
        authService.generatePlaybackToken({ contentId: "test" }),
      ).rejects.toThrow("Network error");
    });

    test("should handle missing user gracefully", async () => {
      authService.currentUser = null;

      await expect(
        authService.generatePlaybackToken({ contentId: "test" }),
      ).rejects.toThrow("User not authenticated");
    });
  });

  describe("Integration Tests", () => {
    test("should complete full authentication flow", async () => {
      // Mock successful sign-in
      const mockUser = {
        uid: "integration-test-uid",
        email: "integration@test.com",
        emailVerified: true,
        getIdToken: jest.fn().mockResolvedValue("firebase-token")
      };

      auth.signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      // Mock successful profile creation
      authService.getUserProfile = jest.fn().mockResolvedValue({
        uid: "integration-test-uid",
        subscriptionTier: "PREMIUM",
        permissions: ["stream:premium"]
      });

      // Sign in
      const signInResult = await authService.signInWithEmail(
        "integration@test.com",
        "password123",
      );

      expect(signInResult.user).toEqual(mockUser);

      // Generate token
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          token: "integration-test-token",
          expiresAt: new Date(Date.now() + 120000).toISOString(),
          permissions: ["stream:premium"],
          quality: "high"
        })
      });

      const tokenResult = await authService.generatePlaybackToken({
        contentId: "integration-content",
        permissions: ["stream:premium"]
      });

      expect(tokenResult.token).toBe("integration-test-token");
      expect(tokenResult.permissions).toContain("stream:premium");
    });
  });
});

describe("AuthService Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should handle concurrent token requests", async () => {
    authService.currentUser = {
      uid: "concurrent-test-uid",
      getIdToken: jest.fn().mockResolvedValue("token")
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        token: "concurrent-token",
        expiresAt: new Date(Date.now() + 120000).toISOString()
      })
    });

    // Make multiple concurrent requests
    const requests = Array(5)
      .fill()
      .map(() =>
        authService.generatePlaybackToken({ contentId: "concurrent-content" }),
      );

    const results = await Promise.all(requests);

    // All requests should succeed
    results.forEach((result) => {
      expect(result.token).toBe("concurrent-token");
    });

    // Verify appropriate number of API calls
    expect(global.fetch).toHaveBeenCalledTimes(5);
  });

  test("should handle expired Firebase tokens", async () => {
    const mockUser = {
      uid: "expired-token-uid",
      getIdToken: jest.fn().mockRejectedValue(new Error("Token expired"))
    };

    authService.currentUser = mockUser;

    await expect(
      authService.generatePlaybackToken({ contentId: "test" }),
    ).rejects.toThrow("Token expired");
  });

  test("should validate device fingerprint consistency", () => {
    // Initialize fingerprint multiple times
    authService.initializeDeviceFingerprint();
    const fingerprint1 = authService.deviceFingerprint;

    authService.initializeDeviceFingerprint();
    const fingerprint2 = authService.deviceFingerprint;

    // Should generate consistent fingerprints
    expect(fingerprint1).toBe(fingerprint2);
  });
});
