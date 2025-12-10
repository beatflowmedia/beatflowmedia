/**
 * Enhanced Authentication Service
 *
 * Comprehensive authentication and authorization service that supports:
 * - Multi-provider OAuth2/OIDC authentication
 * - JWT playback tokens with scoped permissions
 * - Multi-factor authentication (MFA)
 * - Device management and trust
 * - Session management with refresh tokens
 * - Role-based access control (RBAC)
 */

import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  onAuthStateChanged
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

// Authentication providers configuration
export const AUTH_PROVIDERS = {
  GOOGLE: "google.com",
  FACEBOOK: "facebook.com",
  APPLE: "apple.com",
  SPOTIFY: "spotify.com",
  TWITTER: "twitter.com",
  GITHUB: "github.com",
  EMAIL: "password"
};

// User roles and permissions
export const USER_ROLES = {
  ADMIN: "admin",
  CURATOR: "curator",
  ARTIST: "artist",
  PREMIUM: "premium",
  FREE: "free",
  TRIAL: "trial"
};

// Content access permissions
export const PERMISSIONS = {
  STREAM_PREMIUM: "stream:premium",
  STREAM_FREE: "stream:free",
  DOWNLOAD: "download",
  UPLOAD_CONTENT: "upload:content",
  MANAGE_USERS: "manage:users",
  MODERATE_CONTENT: "moderate:content",
  VIEW_ANALYTICS: "view:analytics",
  MANAGE_BILLING: "manage:billing"
};

// Subscription tiers with permissions
export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: "Free",
    permissions: [PERMISSIONS.STREAM_FREE],
    limits: {
      skips: 6,
      quality: "standard",
      offline: false,
      ads: true
    }
  },
  PREMIUM: {
    name: "Premium",
    permissions: [PERMISSIONS.STREAM_PREMIUM, PERMISSIONS.DOWNLOAD],
    limits: {
      skips: "unlimited",
      quality: "high",
      offline: true,
      ads: false
    }
  },
  ARTIST: {
    name: "Artist",
    permissions: [
      PERMISSIONS.STREAM_PREMIUM,
      PERMISSIONS.UPLOAD_CONTENT,
      PERMISSIONS.VIEW_ANALYTICS,
    ],
    limits: {
      skips: "unlimited",
      quality: "high",
      offline: true,
      ads: false,
      uploads: "unlimited"
    }
  }
};

class AuthService {
  constructor() {
    this.auth = auth;
    this.currentUser = null;
    this.authStateListeners = [];
    this.deviceFingerprint = null;

    // Initialize auth state listener
    this.initializeAuthStateListener();

    // Initialize device fingerprinting
    this.initializeDeviceFingerprint();
  }

  /**
   * Initialize authentication state listener
   */
  initializeAuthStateListener() {
    onAuthStateChanged(this.auth, async (user) => {
      this.currentUser = user;

      if (user) {
        await this.handleUserLogin(user);
      } else {
        await this.handleUserLogout();
      }

      // Notify all listeners
      this.authStateListeners.forEach((listener) => listener(user));
    });
  }

  /**
   * Add auth state change listener
   */
  onAuthStateChanged(callback) {
    this.authStateListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Enhanced OAuth2/OIDC sign-in with multiple providers
   */
  async signInWithProvider(providerName, options = {}) {
    const {
      useRedirect = false,
      customScopes = [],
      mfaRequired = false
    } = options;

    try {
      let provider;

      switch (providerName) {
        case AUTH_PROVIDERS.GOOGLE:
          provider = new GoogleAuthProvider();
          provider.addScope("email");
          provider.addScope("profile");
          break;

        case AUTH_PROVIDERS.FACEBOOK:
          provider = new FacebookAuthProvider();
          provider.addScope("email");
          break;

        case AUTH_PROVIDERS.APPLE:
          provider = new OAuthProvider("apple.com");
          provider.addScope("email");
          provider.addScope("name");
          break;

        case AUTH_PROVIDERS.SPOTIFY:
          provider = new OAuthProvider("spotify.com");
          provider.addScope("user-read-email");
          provider.addScope("user-read-private");
          break;

        case AUTH_PROVIDERS.TWITTER:
          provider = new TwitterAuthProvider();
          break;

        case AUTH_PROVIDERS.GITHUB:
          provider = new GithubAuthProvider();
          provider.addScope("user:email");
          break;

        default:
          throw new Error(`Unsupported provider: ${providerName}`);
      }

      // Add custom scopes
      customScopes.forEach((scope) => provider.addScope(scope));

      // Configure provider for enhanced security
      provider.setCustomParameters({
        prompt: "select_account"
      });

      let result;
      if (useRedirect) {
        await signInWithRedirect(this.auth, provider);
        return null; // Will be handled by redirect callback
      } else {
        result = await signInWithPopup(this.auth, provider);
      }

      // Handle MFA if required
      if (mfaRequired && result.user) {
        await this.enableMFA(result.user);
      }

      return result;
    } catch (error) {
      console.error("Provider sign-in error:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Email/password authentication with enhanced security
   */
  async signInWithEmail(email, password, options = {}) {
    const { requireEmailVerification = true, enableMFA = false } = options;

    try {
      const result = await signInWithEmailAndPassword(
        this.auth,
        email,
        password,
      );

      // Check email verification if required
      if (requireEmailVerification && !result.user.emailVerified) {
        await this.signOut();
        throw new Error(
          "Email verification required. Please check your email.",
        );
      }

      // Enable MFA if requested
      if (enableMFA) {
        await this.enableMFA(result.user);
      }

      return result;
    } catch (error) {
      console.error("Email sign-in error:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Enhanced user registration with security features
   */
  async registerWithEmail(email, password, userData = {}) {
    try {
      // Create user account
      const result = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password,
      );

      // Send email verification
      await sendEmailVerification(result.user);

      // Create user profile with default permissions
      await this.createUserProfile(result.user, {
        email,
        ...userData,
        role: USER_ROLES.FREE,
        subscriptionTier: "FREE",
        emailVerified: false,
        mfaEnabled: false,
        devices: []
      });

      return result;
    } catch (error) {
      console.error("Registration error:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Multi-factor authentication setup
   */
  async enableMFA(user, phoneNumber) {
    try {
      const multiFactorUser = multiFactor(user);

      // Initialize reCAPTCHA verifier
      const recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            console.log("reCAPTCHA solved");
          }
        },
        this.auth,
      );

      // Create phone auth credential
      const phoneAuthCredential = PhoneAuthProvider.credential(
        await PhoneAuthProvider.verifyPhoneNumber(
          phoneNumber,
          recaptchaVerifier,
        ),
        verificationCode,
      );

      const multiFactorAssertion =
        PhoneMultiFactorGenerator.assertion(phoneAuthCredential);

      // Enable MFA
      await multiFactorUser.enroll(multiFactorAssertion, "Primary phone");

      // Update user profile
      await this.updateUserProfile({ mfaEnabled: true });

      return true;
    } catch (error) {
      console.error("MFA setup error:", error);
      throw error;
    }
  }

  /**
   * Device registration and trust management
   */
  async registerDevice(deviceInfo = {}) {
    if (!this.currentUser) return null;

    try {
      const device = {
        id: this.deviceFingerprint,
        name: deviceInfo.name || this.getDeviceName(),
        type: deviceInfo.type || this.getDeviceType(),
        browser: this.getBrowserInfo(),
        trusted: false,
        lastAccess: new Date().toISOString(),
        ipAddress: await this.getIPAddress(),
        location: await this.getLocation(),
        registeredAt: new Date().toISOString()
      };

      const userRef = doc(db, "users", this.currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      const devices = userData.devices || [];
      const existingDeviceIndex = devices.findIndex((d) => d.id === device.id);

      if (existingDeviceIndex > -1) {
        devices[existingDeviceIndex] = {
          ...devices[existingDeviceIndex],
          ...device
        };
      } else {
        devices.push(device);
      }

      await updateDoc(userRef, { devices });

      return device;
    } catch (error) {
      console.error("Device registration error:", error);
      throw error;
    }
  }

  /**
   * Generate JWT playback token with scoped permissions
   */
  async generatePlaybackToken(options = {}) {
    if (!this.currentUser) {
      throw new Error("User not authenticated");
    }

    const {
      contentId,
      contentType = "audio",
      territoryRestrictions = [],
      ttl = 120, // 2 minutes default
      permissions = [],
      quality = "standard"
    } = options;

    try {
      const userProfile = await this.getUserProfile();
      const subscription =
        SUBSCRIPTION_TIERS[userProfile.subscriptionTier] ||
        SUBSCRIPTION_TIERS.FREE;

      // Validate permissions against user's subscription
      const allowedPermissions = permissions.filter((permission) =>
        subscription.permissions.includes(permission),
      );

      const tokenPayload = {
        userId: this.currentUser.uid,
        contentId,
        contentType,
        permissions: allowedPermissions,
        quality: this.getMaxQuality(userProfile.subscriptionTier, quality),
        territoryRestrictions,
        deviceId: this.deviceFingerprint,
        sessionId: this.generateSessionId(),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + ttl,
        aud: "beatflow-streaming",
        iss: "beatflow-auth"
      };

      // Call backend to generate signed JWT
      const response = await fetch("/api/auth/playback-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await this.currentUser.getIdToken()}`
        },
        body: JSON.stringify(tokenPayload)
      });

      if (!response.ok) {
        throw new Error("Failed to generate playback token");
      }

      const { token, expiresAt } = await response.json();

      return {
        token,
        expiresAt,
        permissions: allowedPermissions,
        quality: tokenPayload.quality
      };
    } catch (error) {
      console.error("Playback token generation error:", error);
      throw error;
    }
  }

  /**
   * Validate and refresh playback token
   */
  async refreshPlaybackToken(currentToken) {
    try {
      const response = await fetch("/api/auth/refresh-playback-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await this.currentUser.getIdToken()}`
        },
        body: JSON.stringify({ token: currentToken })
      });

      if (!response.ok) {
        throw new Error("Failed to refresh playback token");
      }

      return await response.json();
    } catch (error) {
      console.error("Token refresh error:", error);
      throw error;
    }
  }

  /**
   * Enhanced user profile management
   */
  async createUserProfile(user, additionalData = {}) {
    const userProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      role: USER_ROLES.FREE,
      subscriptionTier: "FREE",
      permissions: SUBSCRIPTION_TIERS.FREE.permissions,
      preferences: {
        audioQuality: "standard",
        downloadQuality: "high",
        crossfadeEnabled: false,
        crossfadeDuration: 5,
        volumeNormalization: true,
        explicitContent: false
      },
      usage: {
        monthlyStreams: 0,
        totalStreams: 0,
        skipsUsed: 0,
        downloadCount: 0
      },
      security: {
        mfaEnabled: false,
        trustedDevices: [],
        lastPasswordChange: new Date().toISOString(),
        loginAttempts: 0,
        lockedUntil: null
      },
      subscription: {
        tier: "FREE",
        status: "active",
        startDate: new Date().toISOString(),
        endDate: null,
        autoRenew: false,
        paymentMethod: null
      },
      devices: [],
      playlists: [],
      favorites: [],
      follows: [],
      likes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...additionalData
    };

    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, userProfile, { merge: true });

    return userProfile;
  }

  /**
   * Get user profile with permissions
   */
  async getUserProfile() {
    if (!this.currentUser) return null;

    const userRef = doc(db, "users", this.currentUser.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return await this.createUserProfile(this.currentUser);
    }

    return userDoc.data();
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates) {
    if (!this.currentUser) throw new Error("User not authenticated");

    const userRef = doc(db, "users", this.currentUser.uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Role-based access control
   */
  async hasPermission(permission) {
    const userProfile = await this.getUserProfile();
    return userProfile?.permissions?.includes(permission) || false;
  }

  /**
   * Check subscription tier access
   */
  async canAccessContent(contentTier) {
    const userProfile = await this.getUserProfile();
    const userTier =
      SUBSCRIPTION_TIERS[userProfile?.subscriptionTier] ||
      SUBSCRIPTION_TIERS.FREE;

    return (
      userTier.permissions.includes(PERMISSIONS.STREAM_PREMIUM) ||
      contentTier === "free"
    );
  }

  /**
   * Handle user login
   */
  async handleUserLogin(user) {
    try {
      // Register/update device
      await this.registerDevice();

      // Update last login
      await this.updateUserProfile({
        lastLoginAt: new Date().toISOString(),
        lastLoginDevice: this.deviceFingerprint
      });

      // Initialize session
      await this.initializeSession();
    } catch (error) {
      console.error("Login handling error:", error);
    }
  }

  /**
   * Handle user logout
   */
  async handleUserLogout() {
    try {
      // Clear session data
      await this.clearSession();

      // Clear local storage
      localStorage.removeItem("beatflow_session");
      sessionStorage.clear();
    } catch (error) {
      console.error("Logout handling error:", error);
    }
  }

  /**
   * Enhanced sign out with cleanup
   */
  async signOut() {
    try {
      await this.handleUserLogout();
      await signOut(this.auth);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  }

  /**
   * Utility methods
   */
  initializeDeviceFingerprint() {
    // Generate device fingerprint based on browser characteristics
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("Device fingerprint", 2, 2);

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
    ].join("|");

    this.deviceFingerprint = this.hashString(fingerprint);
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  getDeviceName() {
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;

    if (userAgent.includes("iPhone")) return "iPhone";
    if (userAgent.includes("iPad")) return "iPad";
    if (userAgent.includes("Android")) return "Android Device";
    if (platform.includes("Mac")) return "Mac";
    if (platform.includes("Win")) return "Windows PC";
    if (platform.includes("Linux")) return "Linux";

    return "Unknown Device";
  }

  getDeviceType() {
    const userAgent = navigator.userAgent;

    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return "tablet";
    if (
      /mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(
        userAgent,
      )
    )
      return "mobile";

    return "desktop";
  }

  getBrowserInfo() {
    const userAgent = navigator.userAgent;

    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";

    return "Unknown";
  }

  async getIPAddress() {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch {
      return "unknown";
    }
  }

  async getLocation() {
    try {
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();
      return {
        country: data.country_name,
        region: data.region,
        city: data.city
      };
    } catch {
      return { country: "unknown", region: "unknown", city: "unknown" };
    }
  }

  getMaxQuality(subscriptionTier, requestedQuality) {
    const tier =
      SUBSCRIPTION_TIERS[subscriptionTier] || SUBSCRIPTION_TIERS.FREE;
    const maxQuality = tier.limits.quality;

    const qualityHierarchy = ["low", "standard", "high", "lossless"];
    const maxIndex = qualityHierarchy.indexOf(maxQuality);
    const requestedIndex = qualityHierarchy.indexOf(requestedQuality);

    return requestedIndex <= maxIndex ? requestedQuality : maxQuality;
  }

  generateSessionId() {
    return "sess_" + Math.random().toString(36).substr(2, 16);
  }

  async initializeSession() {
    const sessionData = {
      sessionId: this.generateSessionId(),
      userId: this.currentUser.uid,
      deviceId: this.deviceFingerprint,
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    localStorage.setItem("beatflow_session", JSON.stringify(sessionData));
  }

  async clearSession() {
    localStorage.removeItem("beatflow_session");
  }

  handleAuthError(error) {
    const errorMessages = {
      "auth/user-not-found": "No account found with this email address.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/email-already-in-use": "An account with this email already exists.",
      "auth/weak-password": "Password should be at least 6 characters.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/too-many-requests":
        "Too many failed attempts. Please try again later.",
      "auth/network-request-failed":
        "Network error. Please check your connection.",
      "auth/popup-closed-by-user": "Sign-in was cancelled.",
      "auth/cancelled-popup-request": "Sign-in was cancelled."
    };

    const message =
      errorMessages[error.code] ||
      error.message ||
      "An authentication error occurred.";

    return new Error(message);
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
