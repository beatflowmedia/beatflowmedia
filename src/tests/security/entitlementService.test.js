/**
 * Entitlement Service Tests
 *
 * Comprehensive test suite for subscription management, content access control,
 * licensing restrictions, and usage tracking
 */

import { jest } from "@jest/globals";
import { entitlementService } from "../../services/entitlementService";
import { db } from "../../firebaseConfig";

// Mock Firestore
jest.mock("../../firebaseConfig", () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn()
      })),
      where: jest.fn(),
      orderBy: jest.fn(),
      limit: jest.fn()
    }))
  }
}));

describe("EntitlementService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    entitlementService.cache.clear();
  });

  describe("Content Access Validation", () => {
    test("should allow access for premium user to premium content", async () => {
      const mockUserProfile = {
        uid: "premium-user",
        subscription: {
          tier: "PREMIUM",
          status: "active",
          endDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString()
        }
      };

      const mockContentMetadata = {
        id: "premium-content",
        tier: "premium",
        territorialRestrictions: [],
        licensing: {
          streaming: { allowed: true }
        },
        availableQualities: ["standard", "high"]
      };

      entitlementService.getUserProfile = jest
        .fn()
        .mockResolvedValue(mockUserProfile);
      entitlementService.getContentMetadata = jest
        .fn()
        .mockResolvedValue(mockContentMetadata);
      entitlementService.getUserLocation = jest
        .fn()
        .mockResolvedValue({ country: "US" });

      const result = await entitlementService.validateContentAccess(
        "premium-user",
        "premium-content",
        "stream",
      );

      expect(result.allowed).toBe(true);
      expect(result.quality).toBe("high");
      expect(result.subscription.tier).toBe("PREMIUM");
    });

    test("should deny access for free user to premium content", async () => {
      const mockUserProfile = {
        uid: "free-user",
        subscription: {
          tier: "FREE",
          status: "active"
        }
      };

      const mockContentMetadata = {
        id: "premium-content",
        tier: "premium",
        territorialRestrictions: [],
        licensing: {
          streaming: { allowed: true }
        }
      };

      entitlementService.getUserProfile = jest
        .fn()
        .mockResolvedValue(mockUserProfile);
      entitlementService.getContentMetadata = jest
        .fn()
        .mockResolvedValue(mockContentMetadata);
      entitlementService.checkUsageLimits = jest
        .fn()
        .mockResolvedValue({ allowed: false, reason: "Monthly limit reached" });

      const result = await entitlementService.validateContentAccess(
        "free-user",
        "premium-content",
        "stream",
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Monthly limit reached");
    });

    test("should handle territorial restrictions", async () => {
      const mockUserProfile = {
        uid: "restricted-user",
        subscription: { tier: "PREMIUM", status: "active" }
      };

      const mockContentMetadata = {
        id: "restricted-content",
        territorialRestrictions: ["US", "CA"],
        licensing: { streaming: { allowed: true } }
      };

      entitlementService.getUserProfile = jest
        .fn()
        .mockResolvedValue(mockUserProfile);
      entitlementService.getContentMetadata = jest
        .fn()
        .mockResolvedValue(mockContentMetadata);
      entitlementService.getUserLocation = jest
        .fn()
        .mockResolvedValue({ country: "DE" });

      const result = await entitlementService.validateContentAccess(
        "restricted-user",
        "restricted-content",
        "stream",
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("not available in DE");
    });

    test("should validate licensing restrictions", async () => {
      const mockUserProfile = {
        uid: "test-user",
        subscription: { tier: "PREMIUM", status: "active" }
      };

      const mockContentMetadata = {
        id: "unlicensed-content",
        territorialRestrictions: [],
        licensing: {
          streaming: { allowed: false },
          download: { allowed: true }
        }
      };

      entitlementService.getUserProfile = jest
        .fn()
        .mockResolvedValue(mockUserProfile);
      entitlementService.getContentMetadata = jest
        .fn()
        .mockResolvedValue(mockContentMetadata);

      const streamResult = await entitlementService.validateContentAccess(
        "test-user",
        "unlicensed-content",
        "stream",
      );

      const downloadResult = await entitlementService.validateContentAccess(
        "test-user",
        "unlicensed-content",
        "download",
      );

      expect(streamResult.allowed).toBe(false);
      expect(streamResult.reason).toBe("Streaming not licensed");
      expect(downloadResult.allowed).toBe(true);
    });
  });

  describe("Subscription Validation", () => {
    test("should validate active subscription", async () => {
      const userProfile = {
        subscription: {
          tier: "PREMIUM",
          status: "active",
          endDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString()
        }
      };

      const result = await entitlementService.validateSubscription(userProfile);

      expect(result.valid).toBe(true);
    });

    test("should reject expired subscription", async () => {
      const userProfile = {
        subscription: {
          tier: "PREMIUM",
          status: "active",
          endDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      };

      const result = await entitlementService.validateSubscription(userProfile);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Subscription expired");
    });

    test("should handle trial subscriptions", async () => {
      const userProfile = {
        subscription: {
          tier: "PREMIUM",
          status: "active",
          trial: true,
          trialEndDate: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString()
        }
      };

      const result = await entitlementService.validateSubscription(userProfile);

      expect(result.valid).toBe(true);
    });

    test("should downgrade expired trial to free", async () => {
      const userProfile = {
        uid: "trial-user",
        subscription: {
          tier: "PREMIUM",
          status: "active",
          trial: true,
          trialEndDate: new Date(
            Date.now() - 24 * 60 * 60 * 1000,
          ).toISOString()
        }
      };

      entitlementService.downgradeToFree = jest.fn().mockResolvedValue();

      const result = await entitlementService.validateSubscription(userProfile);

      expect(result.valid).toBe(true);
      expect(result.reason).toContain("downgraded to free");
      expect(entitlementService.downgradeToFree).toHaveBeenCalledWith(
        "trial-user",
      );
    });
  });

  describe("Usage Limits and Quotas", () => {
    test("should enforce monthly streaming limits for free users", async () => {
      const userProfile = {
        subscription: { tier: "FREE" },
        usage: { monthlyStreams: 1000 }
      };

      const result = await entitlementService.checkUsageLimits(
        userProfile,
        "stream",
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Monthly streaming limit reached");
    });

    test("should allow unlimited streaming for premium users", async () => {
      const userProfile = {
        subscription: { tier: "PREMIUM" },
        usage: { monthlyStreams: 5000 }
      };

      const result = await entitlementService.checkUsageLimits(
        userProfile,
        "stream",
      );

      expect(result.allowed).toBe(true);
    });

    test("should enforce hourly skip limits", async () => {
      const userProfile = {
        uid: "test-user",
        subscription: { tier: "FREE" }
      };

      entitlementService.getHourlySkips = jest.fn().mockResolvedValue(6);

      const result = await entitlementService.checkUsageLimits(
        userProfile,
        "skip",
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Hourly skip limit reached");
    });

    test("should restrict downloads for free users", async () => {
      const userProfile = {
        subscription: { tier: "FREE" }
      };

      const result = await entitlementService.checkUsageLimits(
        userProfile,
        "download",
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Download not available in current tier");
    });
  });

  describe("Quality Access Control", () => {
    test("should return appropriate quality levels based on subscription", async () => {
      const testCases = [
        {
          subscription: "FREE",
          available: ["low", "standard", "high"],
          expected: {
            maxQuality: "standard",
            allowedQualities: ["low", "standard"]
          }
        },
        {
          subscription: "PREMIUM",
          available: ["low", "standard", "high", "lossless"],
          expected: {
            maxQuality: "high",
            allowedQualities: ["low", "standard", "high"]
          }
        },
        {
          subscription: "ARTIST",
          available: ["low", "standard", "high", "lossless"],
          expected: {
            maxQuality: "lossless",
            allowedQualities: ["low", "standard", "high", "lossless"]
          }
        },
      ];

      testCases.forEach(async ({ subscription, available, expected }) => {
        const userProfile = { subscription: { tier: subscription } };
        const result = await entitlementService.checkQualityAccess(
          userProfile,
          available,
        );

        expect(result.maxQuality).toBe(expected.maxQuality);
        expect(result.allowedQualities).toEqual(expected.allowedQualities);
      });
    });
  });

  describe("Usage Tracking", () => {
    test("should track streaming usage", async () => {
      const mockDoc = {
        set: jest.fn().mockResolvedValue()
      };

      const mockCollection = {
        doc: jest.fn().mockReturnValue(mockDoc)
      };

      db.collection.mockReturnValue(mockCollection);

      entitlementService.updateUsageCounters = jest.fn().mockResolvedValue();
      entitlementService.updateContentAnalytics = jest.fn().mockResolvedValue();

      const result = await entitlementService.trackUsage(
        "user-123",
        "content-456",
        "stream",
        { quality: "high", duration: 180, completed: true },
      );

      expect(result.userId).toBe("user-123");
      expect(result.contentId).toBe("content-456");
      expect(result.usageType).toBe("stream");
      expect(result.metadata.quality).toBe("high");

      expect(mockDoc.set).toHaveBeenCalled();
      expect(entitlementService.updateUsageCounters).toHaveBeenCalledWith(
        "user-123",
        "stream",
        expect.objectContaining({ quality: "high" }),
      );
    });

    test("should update user usage counters", async () => {
      const mockDoc = {
        update: jest.fn().mockResolvedValue()
      };

      db.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc)
      });

      await entitlementService.updateUsageCounters("user-123", "stream", {});

      expect(mockDoc.update).toHaveBeenCalledWith({
        "usage.lastActivity": expect.any(String),
        "usage.totalStreams": expect.any(Object),
        "usage.monthlyStreams": expect.any(Object)
      });
    });
  });

  describe("Subscription Management", () => {
    test("should upgrade user subscription", async () => {
      const mockDoc = {
        update: jest.fn().mockResolvedValue()
      };

      db.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc)
      });

      entitlementService.getUserProfile = jest.fn().mockResolvedValue({
        uid: "user-123",
        subscription: { tier: "FREE" }
      });

      entitlementService.trackSubscriptionChange = jest
        .fn()
        .mockResolvedValue();

      const result = await entitlementService.upgradeSubscription(
        "user-123",
        "PREMIUM",
        "pm_test_payment_method",
      );

      expect(result.tier).toBe("PREMIUM");
      expect(result.status).toBe("active");
      expect(result.price).toBe(9.99);
      expect(result.paymentMethod).toBe("pm_test_payment_method");

      expect(mockDoc.update).toHaveBeenCalled();
      expect(entitlementService.trackSubscriptionChange).toHaveBeenCalledWith(
        "user-123",
        "FREE",
        "PREMIUM",
      );
    });

    test("should start trial subscription", async () => {
      const mockDoc = {
        update: jest.fn().mockResolvedValue()
      };

      db.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc)
      });

      entitlementService.getUserProfile = jest.fn().mockResolvedValue({
        uid: "user-123",
        subscription: { tier: "FREE", hasUsedTrial: false }
      });

      const result = await entitlementService.startTrial(
        "user-123",
        "PREMIUM",
        30,
      );

      expect(result.tier).toBe("PREMIUM");
      expect(result.trial).toBe(true);
      expect(result.hasUsedTrial).toBe(true);
      expect(result.trialEndDate).toBeDefined();

      expect(mockDoc.update).toHaveBeenCalled();
    });

    test("should reject trial for users who already used it", async () => {
      entitlementService.getUserProfile = jest.fn().mockResolvedValue({
        uid: "user-123",
        subscription: { tier: "FREE", hasUsedTrial: true }
      });

      await expect(
        entitlementService.startTrial("user-123", "PREMIUM", 30),
      ).rejects.toThrow("Trial already used");
    });
  });

  describe("Pay-Per-Stream Authorization", () => {
    test("should authorize pay-per-stream with sufficient balance", async () => {
      entitlementService.getUserProfile = jest.fn().mockResolvedValue({
        uid: "user-123",
        wallet: { balance: 10.0 }
      });

      const mockDoc = {
        set: jest.fn().mockResolvedValue()
      };

      db.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc)
      });

      const result = await entitlementService.authorizePayPerStream(
        "user-123",
        "content-456",
        2.99,
      );

      expect(result.authorized).toBe(true);
      expect(result.authId).toBeDefined();
      expect(result.expiresAt).toBeDefined();

      expect(mockDoc.set).toHaveBeenCalled();
    });

    test("should reject pay-per-stream with insufficient balance", async () => {
      entitlementService.getUserProfile = jest.fn().mockResolvedValue({
        uid: "user-123",
        wallet: { balance: 1.0 }
      });

      const result = await entitlementService.authorizePayPerStream(
        "user-123",
        "content-456",
        2.99,
      );

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe("Insufficient balance");
      expect(result.required).toBe(2.99);
      expect(result.available).toBe(1.0);
    });
  });

  describe("Promotional Access", () => {
    test("should grant promotional access with valid code", async () => {
      entitlementService.validatePromotionCode = jest.fn().mockResolvedValue({
        valid: true,
        type: "trial_access",
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString()
      });

      const mockDoc = {
        set: jest.fn().mockResolvedValue(),
        update: jest.fn().mockResolvedValue()
      };

      const mockCollection = {
        doc: jest.fn().mockReturnValue(mockDoc)
      };

      db.collection.mockReturnValue(mockCollection);

      const result = await entitlementService.grantPromotionalAccess(
        "user-123",
        "PROMO2024",
        ["content-1", "content-2"],
      );

      expect(result.granted).toBe(true);
      expect(result.access.promotionCode).toBe("PROMO2024");
      expect(result.access.contentIds).toEqual(["content-1", "content-2"]);

      expect(mockDoc.set).toHaveBeenCalled();
      expect(mockDoc.update).toHaveBeenCalled();
    });

    test("should reject invalid promotion code", async () => {
      entitlementService.validatePromotionCode = jest.fn().mockResolvedValue({
        valid: false,
        reason: "Promotion code expired"
      });

      const result = await entitlementService.grantPromotionalAccess(
        "user-123",
        "EXPIRED_PROMO",
      );

      expect(result.granted).toBe(false);
      expect(result.reason).toBe("Promotion code expired");
    });
  });

  describe("Rate Limiting and Abuse Prevention", () => {
    test("should allow requests within rate limits", async () => {
      entitlementService.cache.set("rate_limit_user-123_stream", {
        count: 50,
        timestamp: Date.now()
      });

      const result = await entitlementService.checkRateLimit(
        "user-123",
        "stream",
      );

      expect(result.allowed).toBe(true);
    });

    test("should block requests exceeding rate limits", async () => {
      entitlementService.cache.set("rate_limit_user-123_stream", {
        count: 100,
        timestamp: Date.now()
      });

      const result = await entitlementService.checkRateLimit(
        "user-123",
        "stream",
      );

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
    });

    test("should reset rate limit after time window", async () => {
      entitlementService.cache.set("rate_limit_user-123_stream", {
        count: 100,
        timestamp: Date.now() - 3700000, // More than 1 hour ago
      });

      const result = await entitlementService.checkRateLimit(
        "user-123",
        "stream",
      );

      expect(result.allowed).toBe(true);
    });
  });

  describe("Caching and Performance", () => {
    test("should cache user profiles", async () => {
      const mockUserData = {
        uid: "cached-user",
        subscription: { tier: "PREMIUM" }
      };

      const mockDoc = {
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => mockUserData
        })
      };

      db.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc)
      });

      // First call should hit database
      const result1 = await entitlementService.getUserProfile("cached-user");
      expect(mockDoc.get).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await entitlementService.getUserProfile("cached-user");
      expect(mockDoc.get).toHaveBeenCalledTimes(1);

      expect(result1).toEqual(mockUserData);
      expect(result2).toEqual(mockUserData);
    });

    test("should expire cache after timeout", async () => {
      const mockUserData = {
        uid: "expired-cache-user",
        subscription: { tier: "PREMIUM" }
      };

      // Set cache with expired timestamp
      entitlementService.cache.set("user_expired-cache-user", {
        data: mockUserData,
        timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago (> 5 minute expiry)
      });

      const mockDoc = {
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => mockUserData
        })
      };

      db.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc)
      });

      // Should hit database due to expired cache
      await entitlementService.getUserProfile("expired-cache-user");
      expect(mockDoc.get).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Handling", () => {
    test("should handle user profile not found", async () => {
      const result = await entitlementService.validateContentAccess(
        "nonexistent-user",
        "content-123",
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("User or content not found");
    });

    test("should handle content metadata not found", async () => {
      entitlementService.getUserProfile = jest.fn().mockResolvedValue({
        uid: "user-123",
        subscription: { tier: "PREMIUM" }
      });

      entitlementService.getContentMetadata = jest.fn().mockResolvedValue(null);

      const result = await entitlementService.validateContentAccess(
        "user-123",
        "nonexistent-content",
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("User or content not found");
    });

    test("should handle database errors gracefully", async () => {
      entitlementService.getUserProfile = jest
        .fn()
        .mockRejectedValue(new Error("Database connection failed"));

      const result = await entitlementService.validateContentAccess(
        "user-123",
        "content-456",
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Validation error");
    });
  });
});
