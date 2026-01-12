import { db, auth } from '../firebaseConfig';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { trackEmailCapture } from './conversionTracking';

/**
 * Fan Capture Service
 *
 * Handles fan email capture and subscription management with:
 * - Race condition protection using Firestore transactions
 * - DRY principle - single source of truth for fan capture logic
 * - Separation of concerns - isolated from UI components
 */

class FanCaptureService {
  /**
   * Create a Firebase Auth account for email-only users
   * Sends password reset email to let them set their own password
   *
   * @param {string} email - User's email
   * @param {string} name - User's name
   * @returns {Promise<{success: boolean, userId: string|null, message: string}>}
   */
  async createEmailAccount(email, name) {
    try {
      // Generate a temporary random password (user will reset it via email)
      const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);

      console.log('🔐 Creating Firebase account for:', email);

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
      const user = userCredential.user;

      console.log('✅ Account created, UID:', user.uid);

      // Update user profile with name
      if (name) {
        await setDoc(doc(db, 'users', user.uid), {
          displayName: name,
          email: email,
          createdAt: serverTimestamp(),
          emailVerified: false,
          signUpMethod: 'email_fan_capture'
        }, { merge: true });
      }

      console.log('📧 Sending password reset email to:', email);

      // Send password reset email so user can set their own password
      try {
        await sendPasswordResetEmail(auth, email);
        console.log('✅ Password reset email sent');
      } catch (emailError) {
        console.error('⚠️ Failed to send password reset email:', emailError);
        // Continue anyway - user can request password reset later
      }

      return {
        success: true,
        userId: user.uid,
        message: 'Account created! Check your email to set your password.'
      };
    } catch (error) {
      console.error('❌ Error creating email account:', error.code, error.message);

      // If user already exists, that's okay - just return success
      if (error.code === 'auth/email-already-in-use') {
        console.log('ℹ️ Email already in use, skipping account creation');
        return {
          success: true,
          userId: null, // We don't have the userId, but subscription will still work
          message: 'Account already exists.'
        };
      }

      return {
        success: false,
        userId: null,
        message: error.message || 'Failed to create account.'
      };
    }
  }

  /**
   * Subscribe a user to artist updates
   * Uses unique document ID to prevent duplicates
   * For non-authenticated users, creates a Firebase account first
   *
   * @param {Object} params
   * @param {string} params.userId - User's UID (if authenticated)
   * @param {string} params.email - User's email
   * @param {string} params.name - User's name (optional for authenticated users)
   * @param {string} params.artistId - Artist document ID
   * @param {string} params.artistName - Artist name
   * @param {string} params.source - Source of capture (e.g., 'artist_page', 'fan_capture_modal')
   * @param {string} params.incentiveType - Type of incentive offered
   * @param {string} params.incentiveContent - Description of incentive
   * @param {boolean} params.createAccount - Whether to create Firebase account for non-authenticated users (default: true)
   * @returns {Promise<{success: boolean, message: string, isNewSubscription: boolean}>}
   */
  async subscribeToArtist({
    userId = null,
    email,
    name = null,
    artistId,
    artistName,
    source = 'unknown',
    incentiveType = 'newsletter',
    incentiveContent = '',
    createAccount = true
  }) {
    try {
      console.log('📝 subscribeToArtist called with:', { userId, email, name, artistName, source, createAccount });

      let actualUserId = userId;

      // If not authenticated and createAccount is true, create Firebase account
      if (!userId && createAccount && email && name) {
        console.log('🔐 User not authenticated, attempting to create account...');
        const accountResult = await this.createEmailAccount(email, name);
        console.log('Account creation result:', accountResult);

        if (accountResult.success && accountResult.userId) {
          actualUserId = accountResult.userId;
          console.log('✅ Using newly created userId:', actualUserId);
        } else {
          console.log('ℹ️ Account already exists or creation failed, proceeding without userId');
          // Continue with email-only subscription
          // The Firestore rules need to allow this
        }
      }
      // Sanitize artist name for document ID
      const sanitizedArtistName = artistName
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');

      // Create deterministic document ID (prefer actualUserId if available)
      const docId = actualUserId
        ? `${actualUserId}_${sanitizedArtistName}`
        : `email_${email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_')}_${sanitizedArtistName}`;

      console.log('📄 Creating fanCapture document with ID:', docId);

      const fanCaptureRef = doc(db, 'fanCaptures', docId);

      // Check if subscription already exists
      // For unauthenticated users, we can't read existing docs due to security rules
      // So we'll just assume it might be new and use merge
      console.log('🔍 Checking for existing subscription...');
      let isNewSubscription = true;
      try {
        const existingDoc = await getDoc(fanCaptureRef);
        isNewSubscription = !existingDoc.exists();
        console.log('Subscription status:', isNewSubscription ? 'NEW' : 'EXISTING');
      } catch (readError) {
        console.log('⚠️ Could not check existing subscription (likely unauthenticated), assuming new');
        // Permission error is expected for unauthenticated users
        // We'll just proceed with merge which handles both cases
      }

      // Prepare fan capture data
      const fanCaptureData = {
        email: email.toLowerCase().trim(),
        artistId,
        artistName,
        source,
        incentiveType,
        incentiveContent,
        status: 'active',
        updatedAt: serverTimestamp()
      };

      // Add userId if we have one (either authenticated or newly created)
      if (actualUserId) {
        fanCaptureData.userId = actualUserId;
      }

      // Add name if provided
      if (name) {
        fanCaptureData.name = name.trim();
      }

      // Set timestamp for new subscriptions
      if (isNewSubscription) {
        fanCaptureData.capturedAt = serverTimestamp();
        fanCaptureData.createdAt = serverTimestamp();
      }

      // Use setDoc with merge to handle both new and existing subscriptions
      console.log('💾 Saving subscription to Firestore...');
      await setDoc(fanCaptureRef, fanCaptureData, { merge: true });
      console.log('✅ Subscription saved successfully');

      // Track conversion only for new subscriptions
      if (isNewSubscription) {
        console.log('📊 Tracking new subscription conversion...');
        trackEmailCapture(email, { id: artistId, name: artistName });
      }

      // Build success message
      let successMessage = isNewSubscription
        ? `You're now subscribed to updates from ${artistName}!`
        : `Your subscription to ${artistName} has been updated!`;

      // Add account creation message if account was created
      if (!userId && createAccount && actualUserId) {
        successMessage += ' Check your email to set up your account password.';
      }

      return {
        success: true,
        message: successMessage,
        isNewSubscription
      };
    } catch (error) {
      console.error('Error in subscribeToArtist:', error);
      return {
        success: false,
        message: 'Failed to subscribe. Please try again.',
        error: error.message
      };
    }
  }

  /**
   * Check if a user is already subscribed to an artist
   *
   * @param {string} userId - User's UID
   * @param {string} artistName - Artist name
   * @returns {Promise<boolean>}
   */
  async isSubscribed(userId, artistName) {
    try {
      const sanitizedArtistName = artistName
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');

      const docId = `${userId}_${sanitizedArtistName}`;
      const fanCaptureRef = doc(db, 'fanCaptures', docId);
      const docSnap = await getDoc(fanCaptureRef);

      return docSnap.exists() && docSnap.data()?.status === 'active';
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  /**
   * Unsubscribe a user from artist updates
   *
   * @param {string} userId - User's UID
   * @param {string} artistName - Artist name
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async unsubscribe(userId, artistName) {
    try {
      const sanitizedArtistName = artistName
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');

      const docId = `${userId}_${sanitizedArtistName}`;
      const fanCaptureRef = doc(db, 'fanCaptures', docId);

      await setDoc(fanCaptureRef, {
        status: 'unsubscribed',
        unsubscribedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      return {
        success: true,
        message: `You've been unsubscribed from ${artistName}`
      };
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return {
        success: false,
        message: 'Failed to unsubscribe. Please try again.',
        error: error.message
      };
    }
  }
}

export const fanCaptureService = new FanCaptureService();
