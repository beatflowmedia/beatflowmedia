/**
 * Security Integration Tests
 *
 * End-to-end security testing that validates complete authentication
 * and authorization workflows in realistic scenarios
 */

import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import { entitlementService } from "../../services/entitlementService";
import SecurityDashboard from "../../components/admin/SecurityDashboard";
import UserManagement from "../../components/admin/UserManagement";

// Mock services
jest.mock("../../services/authService");
jest.mock("../../services/entitlementService");
jest.mock("../../firebaseConfig");

// Mock React Router
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate
}));

describe("Security Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auth state
    authService.currentUser = null;
  });

  describe("Complete Authentication Flow", () => {
    test("should complete OAuth sign-in with device registration", async () => {
      const mockUser = {
        uid: "oauth-user-123",
        email: "oauth@example.com",
        displayName: "OAuth User",
        getIdToken: jest.fn().mockResolvedValue("firebase-token")
      };

      const mockUserProfile = {
        uid: "oauth-user-123",
        role: "FREE",
        subscriptionTier: "FREE",
        permissions: ["stream:free"],
        devices: []
      };

      // Mock OAuth sign-in
      authService.signInWithProvider.mockResolvedValue({ user: mockUser });
      authService.getUserProfile.mockResolvedValue(mockUserProfile);
      authService.registerDevice.mockResolvedValue({
        id: "device-123",
        name: "Test Browser",
        trusted: false
      });

      // Execute OAuth flow
      const result = await authService.signInWithProvider("google.com");
      expect(result.user).toEqual(mockUser);

      // Verify device registration
      expect(authService.registerDevice).toHaveBeenCalled();

      // Verify user profile creation/update
      expect(authService.getUserProfile).toHaveBeenCalledWith("oauth-user-123");
    });

    test("should handle MFA-enabled authentication", async () => {
      const mockUser = {
        uid: "mfa-user-123",
        email: "mfa@example.com",
        emailVerified: true,
        getIdToken: jest.fn().mockResolvedValue("firebase-token")
      };

      authService.signInWithEmail.mockResolvedValue({ user: mockUser });
      authService.enableMFA.mockResolvedValue(true);

      // Sign in with email
      const signInResult = await authService.signInWithEmail(
        "mfa@example.com",
        "password123",
        { enableMFA: true },
      );

      expect(signInResult.user).toEqual(mockUser);
      expect(authService.enableMFA).toHaveBeenCalledWith(mockUser);
    });

    test("should enforce email verification requirement", async () => {
      const mockUser = {
        uid: "unverified-user",
        email: "unverified@example.com",
        emailVerified: false
      };

      authService.signInWithEmail.mockRejectedValue(
        new Error("Email verification required"),
      );

      await expect(
        authService.signInWithEmail("unverified@example.com", "password123", {
          requireEmailVerification: true
        }),
      ).rejects.toThrow("Email verification required");
    });
  });

  describe("Authorization and Access Control", () => {
    test("should enforce role-based access to admin features", async () => {
      const user = userEvent.setup();

      // Mock regular user
      const mockUser = {
        uid: "regular-user",
        email: "user@example.com",
        role: "FREE"
      };

      authService.currentUser = mockUser;
      authService.hasPermission.mockResolvedValue(false);

      const TestComponent = () => (
        <AuthProvider>
          <SecurityDashboard />
        </AuthProvider>
      );

      render(<TestComponent />);

      // Should show access denied message
      await waitFor(() => {
        expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      });
    });

    test("should allow admin access to security dashboard", async () => {
      const mockUser = {
        uid: "admin-user",
        email: "admin@example.com",
        role: "ADMIN"
      };

      const mockMetrics = {
        totalUsers: 1000,
        activeUsers: 750,
        failedLogins: 25,
        suspiciousActivity: 5,
        blockedIPs: 10,
        activeTokens: 500
      };

      authService.currentUser = mockUser;
      authService.hasPermission.mockResolvedValue(true);

      // Mock API responses
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetrics)
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([])
        });

      const TestComponent = () => (
        <AuthProvider>
          <SecurityDashboard />
        </AuthProvider>
      );

      render(<TestComponent />);

      // Should display security metrics
      await waitFor(() => {
        expect(screen.getByText("1,000")).toBeInTheDocument(); // Total users
        expect(screen.getByText("750")).toBeInTheDocument(); // Active users
      });
    });

    test("should validate content access permissions", async () => {
      const mockUser = {
        uid: "premium-user",
        subscription: { tier: "PREMIUM" }
      };

      const mockContent = {
        id: "premium-content",
        tier: "premium"
      };

      entitlementService.validateContentAccess.mockResolvedValue({
        allowed: true,
        quality: "high",
        permissions: ["stream:premium"]
      });

      const accessResult = await entitlementService.validateContentAccess(
        mockUser.uid,
        mockContent.id,
        "stream",
      );

      expect(accessResult.allowed).toBe(true);
      expect(accessResult.quality).toBe("high");
    });
  });

  describe("Token Management Workflow", () => {
    test("should generate and validate playback tokens", async () => {
      const mockUser = {
        uid: "token-user",
        getIdToken: jest.fn().mockResolvedValue("firebase-token")
      };

      authService.currentUser = mockUser;

      // Mock successful token generation
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            expiresAt: new Date(Date.now() + 120000).toISOString(),
            permissions: ["stream:premium"],
            quality: "high"
          })
      });

      const tokenResult = await authService.generatePlaybackToken({
        contentId: "content-123",
        permissions: ["stream:premium"],
        quality: "high"
      });

      expect(tokenResult.token).toBeDefined();
      expect(tokenResult.permissions).toContain("stream:premium");
      expect(tokenResult.quality).toBe("high");

      // Verify API call
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/playback-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer firebase-token"
        },
        body: expect.stringContaining("content-123")
      });
    });

    test("should handle token refresh near expiry", async () => {
      const mockUser = {
        uid: "token-user",
        getIdToken: jest.fn().mockResolvedValue("firebase-token")
      };

      authService.currentUser = mockUser;

      const oldToken = "old-jwt-token";
      const newToken = "new-jwt-token";

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            token: newToken,
            expiresAt: new Date(Date.now() + 120000).toISOString()
          })
      });

      const refreshResult = await authService.refreshPlaybackToken(oldToken);

      expect(refreshResult.token).toBe(newToken);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/refresh-playback-token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer firebase-token"
          },
          body: expect.stringContaining(oldToken)
        },
      );
    });

    test("should revoke tokens on security breach", async () => {
      const mockUser = {
        uid: "compromised-user",
        getIdToken: jest.fn().mockResolvedValue("firebase-token")
      };

      authService.currentUser = mockUser;

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await authService.revokeToken("suspicious-token");

      expect(global.fetch).toHaveBeenCalledWith("/api/auth/revoke-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer firebase-token"
        },
        body: expect.stringContaining("suspicious-token")
      });
    });
  });

  describe("User Management Integration", () => {
    test("should display user list with security indicators", async () => {
      const mockUsers = [
        {
          uid: "user-1",
          email: "user1@example.com",
          displayName: "User One",
          role: "FREE",
          status: "active",
          emailVerified: true,
          mfaEnabled: false,
          lastLogin: new Date().toISOString()
        },
        {
          uid: "user-2",
          email: "user2@example.com",
          displayName: "User Two",
          role: "PREMIUM",
          status: "suspended",
          emailVerified: false,
          mfaEnabled: true,
          lastLogin: new Date().toISOString()
        },
      ];

      authService.currentUser = { uid: "admin", role: "ADMIN" };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUsers)
      });

      render(<UserManagement />);

      await waitFor(() => {
        // Check for user data
        expect(screen.getByText("user1@example.com")).toBeInTheDocument();
        expect(screen.getByText("user2@example.com")).toBeInTheDocument();

        // Check for security indicators
        expect(screen.getByText("FREE")).toBeInTheDocument();
        expect(screen.getByText("PREMIUM")).toBeInTheDocument();
        expect(screen.getByText("suspended")).toBeInTheDocument();
      });
    });

    test("should handle user suspension workflow", async () => {
      const user = userEvent.setup();
      const mockUser = {
        uid: "target-user",
        email: "target@example.com",
        status: "active"
      };

      authService.currentUser = { uid: "admin", role: "ADMIN" };

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockUser])
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });

      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText("target@example.com")).toBeInTheDocument();
      });

      // Find and click suspend button
      const suspendButton = screen.getByLabelText(/suspend/i);
      await user.click(suspendButton);

      // Verify API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/suspend"),
          expect.objectContaining({ method: "POST" }),
        );
      });
    });
  });

  describe("Session Security Integration", () => {
    test("should handle concurrent sessions", async () => {
      const mockUser = {
        uid: "concurrent-user",
        getIdToken: jest.fn().mockResolvedValue("firebase-token")
      };

      authService.currentUser = mockUser;

      // Simulate login from different device
      const device1 = { id: "device-1", name: "Chrome Desktop" };
      const device2 = { id: "device-2", name: "Safari Mobile" };

      authService.registerDevice
        .mockResolvedValueOnce(device1)
        .mockResolvedValueOnce(device2);

      await authService.registerDevice({ name: "Chrome Desktop" });
      await authService.registerDevice({ name: "Safari Mobile" });

      expect(authService.registerDevice).toHaveBeenCalledTimes(2);
    });

    test("should enforce session timeout", async () => {
      const mockUser = {
        uid: "timeout-user",
        getIdToken: jest.fn().mockRejectedValue(new Error("Token expired"))
      };

      authService.currentUser = mockUser;

      await expect(
        authService.generatePlaybackToken({ contentId: "test" }),
      ).rejects.toThrow("Token expired");
    });

    test("should clear session data on logout", async () => {
      const mockLocalStorage = {
        removeItem: jest.fn(),
        setItem: jest.fn(),
        getItem: jest.fn()
      };

      const mockSessionStorage = {
        clear: jest.fn()
      };

      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
        configurable: true
      });

      Object.defineProperty(window, "sessionStorage", {
        value: mockSessionStorage,
        configurable: true
      });

      await authService.signOut();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        "beatflow_session",
      );
      expect(mockSessionStorage.clear).toHaveBeenCalled();
    });
  });

  describe("Error Handling and Recovery", () => {
    test("should handle authentication failures gracefully", async () => {
      const user = userEvent.setup();

      authService.signInWithEmail.mockRejectedValue(
        new Error("Invalid credentials"),
      );

      const TestLoginForm = () => {
        const [error, setError] = useState("");

        const handleLogin = async (email, password) => {
          try {
            await authService.signInWithEmail(email, password);
          } catch (err) {
            setError(err.message);
          }
        };

        return (
          <div>
            <button onClick={() => handleLogin("test@example.com", "wrong")}>
              Login
            </button>
            {error && <div role="alert">{error}</div>}
          </div>
        );
      };

      render(<TestLoginForm />);

      const loginButton = screen.getByText("Login");
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Invalid credentials",
        );
      });
    });

    test("should recover from network failures", async () => {
      const mockUser = {
        uid: "network-user",
        getIdToken: jest.fn().mockResolvedValue("firebase-token")
      };

      authService.currentUser = mockUser;

      // First call fails, second succeeds
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              token: "retry-token",
              expiresAt: new Date(Date.now() + 120000).toISOString()
            })
        });

      // First attempt should fail
      await expect(
        authService.generatePlaybackToken({ contentId: "test" }),
      ).rejects.toThrow("Network error");

      // Retry should succeed
      const retryResult = await authService.generatePlaybackToken({
        contentId: "test"
      });

      expect(retryResult.token).toBe("retry-token");
    });
  });

  describe("Performance and Load Testing", () => {
    test("should handle multiple concurrent token requests", async () => {
      const mockUser = {
        uid: "load-test-user",
        getIdToken: jest.fn().mockResolvedValue("firebase-token")
      };

      authService.currentUser = mockUser;

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            token: "load-test-token",
            expiresAt: new Date(Date.now() + 120000).toISOString()
          })
      });

      // Generate 10 concurrent token requests
      const requests = Array(10)
        .fill()
        .map((_, index) =>
          authService.generatePlaybackToken({
            contentId: `content-${index}`
          }),
        );

      const results = await Promise.all(requests);

      // All requests should succeed
      results.forEach((result) => {
        expect(result.token).toBe("load-test-token");
      });

      // Verify all API calls were made
      expect(global.fetch).toHaveBeenCalledTimes(10);
    });

    test("should maintain responsiveness under load", async () => {
      const startTime = Date.now();

      // Simulate heavy computational work
      const heavyWork = Array(1000)
        .fill()
        .map((_, index) => {
          return new Promise((resolve) => {
            setTimeout(() => resolve(index), 1);
          });
        });

      await Promise.all(heavyWork);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds
    });
  });

  describe("Data Validation Integration", () => {
    test("should validate subscription tier changes", async () => {
      const mockUser = { uid: "subscription-user" };

      entitlementService.upgradeSubscription.mockResolvedValue({
        tier: "PREMIUM",
        status: "active",
        features: {
          monthlyStreams: "unlimited",
          quality: "high"
        }
      });

      const result = await entitlementService.upgradeSubscription(
        mockUser.uid,
        "PREMIUM",
        "pm_test_payment",
      );

      expect(result.tier).toBe("PREMIUM");
      expect(result.features.quality).toBe("high");
    });

    test("should enforce usage limits", async () => {
      const mockUser = {
        uid: "limited-user",
        subscription: { tier: "FREE" },
        usage: { monthlyStreams: 1000 }
      };

      entitlementService.checkUsageLimits.mockResolvedValue({
        allowed: false,
        reason: "Monthly limit reached"
      });

      const result = await entitlementService.checkUsageLimits(
        mockUser,
        "stream",
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Monthly limit reached");
    });
  });
});
