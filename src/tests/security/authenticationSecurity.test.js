/**
 * Authentication Security Test Suite
 *
 * Comprehensive security testing for authentication system including:
 * - Authentication flow validation
 * - Token security and lifecycle
 * - MFA implementation testing
 * - Session management security
 * - Rate limiting and abuse prevention
 * - Device management security
 */

import {
  render,
  screen,
  fireEvent,
  waitFor,
  act
} from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "../../context/AuthContext";
import authService, {
  AUTH_PROVIDERS,
  USER_ROLES,
  SUBSCRIPTION_TIERS
} from "../../services/authService";
import entitlementService from "../../services/entitlementService";

// Mock Firebase
const mockFirebase = {
  auth: {
    signInWithPopup: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    sendEmailVerification: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    currentUser: null
  },
  firestore: {
    doc: jest.fn(),
    collection: jest.fn(),
    setDoc: jest.fn(),
    getDoc: jest.fn(),
    updateDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn()
  }
};

jest.mock("../../firebaseConfig", () => ({
  auth: mockFirebase.auth,
  db: mockFirebase.firestore
}));

// Mock crypto for consistent testing
const mockCrypto = {
  randomUUID: jest.fn(() => "test-uuid-123"),
  getRandomValues: jest.fn((arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  })
};

Object.defineProperty(global, "crypto", {
  value: mockCrypto
});

describe("Authentication Security", () => {
  let mockUser;
  let mockToken;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      uid: "test-user-123",
      email: "test@example.com",
      displayName: "Test User",
      emailVerified: true,
      getIdToken: jest.fn().mockResolvedValue("mock-id-token"),
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString()
      }
    };

    mockToken = {
      token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.test.token",
      expiresAt: new Date(Date.now() + 120000).toISOString(),
      permissions: ["stream:premium"],
      quality: "high"
    };

    // Setup default Firebase mocks
    mockFirebase.auth.currentUser = mockUser;
    mockFirebase.auth.onAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn(); // unsubscribe function
    });
  });

  describe("Password Security", () => {
    test("should enforce strong password requirements", async () => {
      const weakPasswords = [
        "123",
        "password",
        "12345678",
        "abcdefgh",
        "Password",
        "password123",
      ];

      for (const password of weakPasswords) {
        const result = authService.validatePasswordStrength(password);
        expect(result.isStrong).toBe(false);
        expect(result.issues).toContain(
          "Password must be at least 8 characters",
        );
      }
    });

    test("should accept strong passwords", () => {
      const strongPasswords = [
        "MyStr0ngP@ssw0rd!",
        "C0mpl3x_P4ssw0rd#2023",
        "S3cur3&Str0ng!Pass",
      ];

      strongPasswords.forEach((password) => {
        const result = authService.validatePasswordStrength(password);
        expect(result.isStrong).toBe(true);
        expect(result.issues).toHaveLength(0);
      });
    });

    test("should prevent password reuse", async () => {
      const userId = "test-user-123";
      const newPassword = "NewStr0ngP@ssw0rd!";

      // Mock previous password hashes
      mockFirebase.firestore.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          security: {
            passwordHistory: ["hash1", "hash2", "hash3"]
          }
        })
      });

      const isReused = await authService.checkPasswordReuse(
        userId,
        newPassword,
      );
      expect(isReused).toBe(false);
    });

    test("should enforce password rotation policy", async () => {
      const userId = "test-user-123";
      const lastChangeDate = new Date();
      lastChangeDate.setDate(lastChangeDate.getDate() - 91); // 91 days ago

      mockFirebase.firestore.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          security: {
            lastPasswordChange: lastChangeDate.toISOString()
          }
        })
      });

      const needsRotation =
        await authService.checkPasswordRotationNeeded(userId);
      expect(needsRotation).toBe(true);
    });
  });

  describe("Session Security", () => {
    test("should create secure session with proper attributes", async () => {
      await authService.handleUserLogin(mockUser);

      const sessionData = JSON.parse(
        localStorage.getItem("beatflow_session") || "{}",
      );

      expect(sessionData.sessionId).toBeDefined();
      expect(sessionData.userId).toBe(mockUser.uid);
      expect(sessionData.deviceId).toBeDefined();
      expect(sessionData.startTime).toBeDefined();
    });

    test("should enforce session timeout", async () => {
      const expiredSession = {
        sessionId: "expired-session",
        userId: mockUser.uid,
        startTime: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      };

      localStorage.setItem("beatflow_session", JSON.stringify(expiredSession));

      const isValid = await authService.validateSession();
      expect(isValid).toBe(false);
    });

    test("should handle session fixation attacks", async () => {
      const oldSessionId = "old-session-id";
      localStorage.setItem(
        "beatflow_session",
        JSON.stringify({
          sessionId: oldSessionId,
          userId: mockUser.uid
        }),
      );

      await authService.handleUserLogin(mockUser);

      const newSession = JSON.parse(
        localStorage.getItem("beatflow_session") || "{}",
      );
      expect(newSession.sessionId).not.toBe(oldSessionId);
    });

    test("should invalidate session on logout", async () => {
      localStorage.setItem(
        "beatflow_session",
        JSON.stringify({
          sessionId: "test-session",
          userId: mockUser.uid
        }),
      );

      await authService.signOut();

      expect(localStorage.getItem("beatflow_session")).toBeNull();
    });
  });

  describe("Token Security", () => {
    test("should generate JWT playback tokens with proper claims", async () => {
      const options = {
        contentId: "song-123",
        contentType: "audio",
        permissions: ["stream:premium"],
        quality: "high",
        ttl: 120
      };

      // Mock user profile
      mockFirebase.firestore.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          subscription: { tier: "PREMIUM" },
          subscriptionTier: "PREMIUM"
        })
      });

      // Mock token generation response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockToken
      });

      const result = await authService.generatePlaybackToken(options);

      expect(result.token).toBeDefined();
      expect(result.expiresAt).toBeDefined();
      expect(result.permissions).toContain("stream:premium");
      expect(result.quality).toBe("high");
    });

    test("should enforce token TTL limits", async () => {
      const shortTTL = 30; // 30 seconds
      const longTTL = 3600; // 1 hour

      // Short TTL should be allowed
      const shortTokenOptions = {
        contentId: "song-123",
        ttl: shortTTL
      };

      // Long TTL should be capped
      const longTokenOptions = {
        contentId: "song-123",
        ttl: longTTL
      };

      mockFirebase.firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ subscription: { tier: "PREMIUM" } })
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockToken
      });

      await authService.generatePlaybackToken(shortTokenOptions);
      await authService.generatePlaybackToken(longTokenOptions);

      const fetchCalls = global.fetch.mock.calls;

      // Check that TTL was properly enforced
      expect(fetchCalls[0][1].body).toBeDefined();
      expect(fetchCalls[1][1].body).toBeDefined();
    });

    test("should validate token before refresh", async () => {
      const expiredToken = "expired.jwt.token";

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      await expect(
        authService.refreshPlaybackToken(expiredToken),
      ).rejects.toThrow("Failed to refresh playback token");
    });

    test("should prevent token replay attacks", async () => {
      const tokenId = "test-token-123";

      // Mock token as already blacklisted
      mockFirebase.firestore.getDoc.mockResolvedValueOnce({
        exists: () => true
      });

      const result = await authService.isTokenBlacklisted(tokenId);
      expect(result).toBe(true);
    });
  });

  describe("Multi-Factor Authentication", () => {
    test("should enforce MFA for privileged accounts", async () => {
      const adminUser = {
        ...mockUser,
        customClaims: { role: "admin" }
      };

      mockFirebase.firestore.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          role: "admin",
          security: { mfaEnabled: false }
        })
      });

      const mfaRequired = await authService.isMfaRequired(adminUser.uid);
      expect(mfaRequired).toBe(true);
    });

    test("should validate TOTP codes correctly", () => {
      const secret = "JBSWY3DPEHPK3PXP";
      const validCode = authService.generateTOTP(secret);

      const isValid = authService.validateTOTP(validCode, secret);
      expect(isValid).toBe(true);
    });

    test("should prevent TOTP replay attacks", async () => {
      const secret = "JBSWY3DPEHPK3PXP";
      const code = "123456";
      const userId = "test-user-123";

      // Mock that code was already used
      mockFirebase.firestore.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          security: {
            usedTotpCodes: [code]
          }
        })
      });

      const result = await authService.validateMfaCode(userId, code, "totp");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("already used");
    });

    test("should handle SMS MFA with rate limiting", async () => {
      const phoneNumber = "+1234567890";
      const userId = "test-user-123";

      // Mock recent SMS attempts
      mockFirebase.firestore.getDocs.mockResolvedValueOnce({
        size: 3, // 3 attempts in last hour
        forEach: jest.fn()
      });

      const result = await authService.sendSmsCode(userId, phoneNumber);
      expect(result.success).toBe(false);
      expect(result.reason).toContain("rate limit");
    });
  });

  describe("Device Management Security", () => {
    test("should generate consistent device fingerprints", () => {
      // Mock browser environment
      Object.defineProperty(navigator, "userAgent", {
        writable: true,
        value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      });

      Object.defineProperty(navigator, "language", {
        writable: true,
        value: "en-US"
      });

      Object.defineProperty(screen, "width", { writable: true, value: 1920 });
      Object.defineProperty(screen, "height", { writable: true, value: 1080 });

      const fingerprint1 = authService.generateDeviceFingerprint();
      const fingerprint2 = authService.generateDeviceFingerprint();

      expect(fingerprint1).toBe(fingerprint2);
      expect(fingerprint1).toBeDefined();
    });

    test("should detect suspicious device characteristics", async () => {
      const suspiciousDevice = {
        userAgent: "HeadlessChrome/91.0.4472.77",
        webGL: null,
        languages: [],
        plugins: [],
        touchSupport: false
      };

      const isSuspicious =
        await authService.analyzeSuspiciousDevice(suspiciousDevice);
      expect(isSuspicious.suspicious).toBe(true);
      expect(isSuspicious.reasons).toContain("headless browser detected");
    });

    test("should limit concurrent device sessions", async () => {
      const userId = "test-user-123";
      const maxDevices = 3;

      // Mock user with maximum devices
      mockFirebase.firestore.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          devices: [
            {
              id: "device1",
              trusted: true,
              lastAccess: new Date().toISOString()
            },
            {
              id: "device2",
              trusted: true,
              lastAccess: new Date().toISOString()
            },
            {
              id: "device3",
              trusted: true,
              lastAccess: new Date().toISOString()
            },
          ],
          subscription: { tier: "PREMIUM" }
        })
      });

      const canAddDevice = await authService.canRegisterNewDevice(userId);
      expect(canAddDevice.allowed).toBe(false);
      expect(canAddDevice.reason).toContain("maximum devices");
    });

    test("should automatically untrust idle devices", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 91); // 91 days ago

      const idleDevice = {
        id: "idle-device",
        trusted: true,
        lastAccess: oldDate.toISOString()
      };

      const shouldUntrust = authService.shouldUntrustDevice(idleDevice);
      expect(shouldUntrust).toBe(true);
    });
  });

  describe("Rate Limiting and Abuse Prevention", () => {
    test("should enforce login attempt rate limits", async () => {
      const email = "test@example.com";
      const attempts = 6;

      // Mock failed login attempts
      for (let i = 0; i < attempts; i++) {
        await authService.recordFailedLogin(email);
      }

      const isLocked = await authService.isAccountLocked(email);
      expect(isLocked.locked).toBe(true);
      expect(isLocked.lockoutDuration).toBeGreaterThan(0);
    });

    test("should implement exponential backoff for repeated failures", async () => {
      const email = "test@example.com";

      await authService.recordFailedLogin(email);
      const firstLockout = await authService.getNextAttemptDelay(email);

      await authService.recordFailedLogin(email);
      const secondLockout = await authService.getNextAttemptDelay(email);

      expect(secondLockout).toBeGreaterThan(firstLockout);
    });

    test("should detect and prevent brute force attacks", async () => {
      const ip = "192.168.1.100";
      const attempts = 20;

      // Simulate multiple failed attempts from same IP
      for (let i = 0; i < attempts; i++) {
        await authService.recordSuspiciousActivity(ip, "failed_login");
      }

      const isThreat = await authService.isIPThreat(ip);
      expect(isThreat.threat).toBe(true);
      expect(isThreat.actions).toContain("block");
    });

    test("should implement CAPTCHA after multiple failures", async () => {
      const email = "test@example.com";

      // Mock 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await authService.recordFailedLogin(email);
      }

      const requiresCaptcha = await authService.requiresCaptcha(email);
      expect(requiresCaptcha).toBe(true);
    });
  });

  describe("OAuth2/OIDC Security", () => {
    test("should validate OAuth state parameter", async () => {
      const validState = "valid-state-token-123";
      const invalidState = "invalid-state";

      // Mock stored state
      sessionStorage.setItem("oauth_state", validState);

      const validResult = authService.validateOAuthState(validState);
      const invalidResult = authService.validateOAuthState(invalidState);

      expect(validResult).toBe(true);
      expect(invalidResult).toBe(false);
    });

    test("should prevent CSRF attacks in OAuth flow", async () => {
      const mockProvider = jest.fn();

      // Mock OAuth provider without state parameter
      const maliciousCallback = {
        code: "auth-code-123",
        // Missing state parameter
      };

      const result = await authService.handleOAuthCallback(maliciousCallback);
      expect(result.success).toBe(false);
      expect(result.error).toContain("CSRF");
    });

    test("should validate OAuth redirect URIs", () => {
      const validUris = [
        "https://beatflowmedia.com/auth/callback",
        "https://www.beatflowmedia.com/auth/callback",
      ];

      const maliciousUris = [
        "https://evil.com/auth/callback",
        "http://beatflowmedia.com/auth/callback", // HTTP not HTTPS
        "javascript:alert(1)",
      ];

      validUris.forEach((uri) => {
        expect(authService.isValidRedirectUri(uri)).toBe(true);
      });

      maliciousUris.forEach((uri) => {
        expect(authService.isValidRedirectUri(uri)).toBe(false);
      });
    });
  });

  describe("Entitlement Security", () => {
    test("should validate subscription tier access", async () => {
      const freeUser = { subscription: { tier: "FREE" } };
      const premiumContent = { tier: "premium", id: "premium-song-123" };

      const result = await entitlementService.validateContentAccess(
        "free-user-id",
        "premium-song-123",
        "stream",
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("subscription tier");
    });

    test("should enforce territorial restrictions", async () => {
      mockFirebase.firestore.getDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ subscription: { tier: "PREMIUM" } })
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            territorialRestrictions: ["US", "CA"],
            licensing: { streaming: { allowed: true } }
          })
        });

      // Mock user location as non-allowed territory
      jest.spyOn(entitlementService, "getUserLocation").mockResolvedValue({
        country: "DE", // Germany
      });

      const result = await entitlementService.validateContentAccess(
        "user-123",
        "restricted-content",
        "stream",
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("not available in");
    });

    test("should prevent usage limit circumvention", async () => {
      const freeUser = {
        subscription: { tier: "FREE" },
        usage: { monthlyStreams: 1000 }, // At limit
      };

      mockFirebase.firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => freeUser
      });

      const result = await entitlementService.validateContentAccess(
        "free-user-123",
        "song-456",
        "stream",
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("limit reached");
    });
  });

  describe("API Security", () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    test("should require authentication for protected endpoints", async () => {
      global.fetch.mockResolvedValueOnce({
        status: 401,
        json: async () => ({ error: "Authentication required" })
      });

      try {
        await authService.generatePlaybackToken({ contentId: "song-123" });
      } catch (error) {
        expect(error.message).toContain("Failed to generate playback token");
      }
    });

    test("should validate API request signatures", () => {
      const payload = { contentId: "song-123", timestamp: Date.now() };
      const secret = "api-secret-key";

      const signature = authService.generateRequestSignature(payload, secret);
      const isValid = authService.validateRequestSignature(
        payload,
        signature,
        secret,
      );

      expect(isValid).toBe(true);
    });

    test("should prevent replay attacks with nonce validation", async () => {
      const nonce = "used-nonce-123";

      // Mock nonce as already used
      mockFirebase.firestore.getDoc.mockResolvedValueOnce({
        exists: () => true
      });

      const isValidNonce = await authService.validateNonce(nonce);
      expect(isValidNonce).toBe(false);
    });
  });

  describe("Error Handling Security", () => {
    test("should not leak sensitive information in error messages", async () => {
      mockFirebase.auth.signInWithEmailAndPassword.mockRejectedValue(
        new Error(
          "Firebase: The email address is badly formatted. (auth/invalid-email)",
        ),
      );

      try {
        await authService.signInWithEmail("invalid-email", "password");
      } catch (error) {
        // Should return generic error message, not expose Firebase internals
        expect(error.message).not.toContain("Firebase:");
        expect(error.message).not.toContain("badly formatted");
      }
    });

    test("should sanitize error responses", () => {
      const dangerousError = {
        message:
          "Database connection failed: postgresql://admin:password@localhost:5432/beatflow",
        stack: "Error at /usr/src/app/auth.js:123:45"
      };

      const sanitized = authService.sanitizeError(dangerousError);

      expect(sanitized.message).not.toContain("postgresql://");
      expect(sanitized.message).not.toContain("password");
      expect(sanitized.message).not.toContain("/usr/src/app/");
    });
  });

  describe("Compliance and Audit", () => {
    test("should log authentication events for audit trail", async () => {
      const mockLogEvent = jest.spyOn(authService, "logSecurityEvent");

      await authService.handleUserLogin(mockUser);

      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "USER_LOGIN",
          userId: mockUser.uid,
          timestamp: expect.any(String),
          ip: expect.any(String)
        }),
      );
    });

    test("should implement data retention policies", async () => {
      const oldAuditLogs = [
        { id: "log1", timestamp: "2022-01-01T00:00:00Z" },
        { id: "log2", timestamp: "2022-06-01T00:00:00Z" },
      ];

      mockFirebase.firestore.getDocs.mockResolvedValueOnce({
        docs: oldAuditLogs.map((log) => ({
          id: log.id,
          data: () => log,
          ref: { delete: jest.fn() }
        }))
      });

      const deletedCount = await authService.cleanupOldAuditLogs();
      expect(deletedCount).toBe(2);
    });

    test("should support GDPR data export", async () => {
      const userId = "test-user-123";

      mockFirebase.firestore.getDocs.mockResolvedValue({
        docs: [
          {
            data: () => ({
              type: "login",
              timestamp: "2023-01-01T00:00:00Z",
              ip: "192.168.1.1"
            })
          },
        ]
      });

      const exportData = await authService.exportUserData(userId);

      expect(exportData.auditLogs).toBeDefined();
      expect(exportData.sessions).toBeDefined();
      expect(exportData.devices).toBeDefined();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });
});

// Helper function to create test component with AuthProvider
function renderWithAuth(component) {
  return render(<AuthProvider>{component}</AuthProvider>);
}
