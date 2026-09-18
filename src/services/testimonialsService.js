// src/services/testimonialsService.js
// Testimonials Service - Manage verified user testimonials
import { db } from '../firebaseConfig';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Testimonials Service
 * Manages verified user testimonials for marketing materials
 *
 * IMPORTANT: All testimonials must:
 * - Be from real users
 * - Have explicit consent
 * - Be verified by admin
 * - Have accurate stats
 */
class TestimonialsService {
  /**
   * Get featured testimonials for a specific segment
   * @param {string} segment - 'artists' | 'curators' | 'listeners' | 'all'
   * @param {number} limitCount - Number of testimonials to return
   */
  async getFeaturedTestimonials(segment = 'all', limitCount = 3) {
    try {
      let q;

      if (segment === 'all') {
        q = query(
          collection(db, 'testimonials'),
          where('featured', '==', true),
          where('verified', '==', true),
          where('status', '==', 'approved'),
          orderBy('displayOrder', 'asc'),
          limit(limitCount)
        );
      } else {
        q = query(
          collection(db, 'testimonials'),
          where('segment', '==', segment),
          where('featured', '==', true),
          where('verified', '==', true),
          where('status', '==', 'approved'),
          orderBy('displayOrder', 'asc'),
          limit(limitCount)
        );
      }

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamps to ISO strings
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString?.() || null,
        consentDate: doc.data().consentDate?.toDate?.()?.toISOString?.() || null,
        verifiedAt: doc.data().verifiedAt?.toDate?.()?.toISOString?.() || null
      }));
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      return [];
    }
  }

  /**
   * Submit a new testimonial (user-facing)
   * @param {object} testimonialData - The testimonial data
   */
  async submitTestimonial(testimonialData) {
    try {
      const {
        userId,
        userType,
        name,
        role,
        quote,
        stats,
        image,
        segment,
        location,
        website
      } = testimonialData;

      // Validation
      if (!userId || !userType || !name || !quote) {
        throw new Error('Missing required fields');
      }

      if (!testimonialData.consentGiven) {
        throw new Error('User consent is required');
      }

      // Create testimonial document
      const docRef = await addDoc(collection(db, 'testimonials'), {
        userId,
        userType,
        name,
        role: role || '',
        quote,
        stats: stats || {},
        image: image || '',
        imageUrl: '',

        // Verification & Consent
        verified: false,
        verifiedBy: null,
        verifiedAt: null,
        consentGiven: true,
        consentDate: serverTimestamp(),
        consentMethod: 'form',

        // Display Settings
        featured: false,
        displayOrder: 0,
        segment: segment || userType + 's',

        // Metadata
        status: 'pending',
        rejectionReason: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),

        // Optional
        location: location || null,
        website: website || null,
        videoUrl: null
      });

      return {
        success: true,
        id: docRef.id,
        message: 'Testimonial submitted for review'
      };
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify testimonial stats against database (admin function)
   * @param {string} testimonialId - The testimonial ID to verify
   */
  async verifyTestimonialStats(testimonialId) {
    try {
      const testimonialDoc = await getDoc(doc(db, 'testimonials', testimonialId));

      if (!testimonialDoc.exists()) {
        throw new Error('Testimonial not found');
      }

      const testimonial = testimonialDoc.data();
      const { userId, userType, stats } = testimonial;

      let verification = { verified: true, discrepancies: [] };

      // Verify artist stats
      if (userType === 'artist' && stats) {
        // Verify streams
        if (stats.streams) {
          const songsQuery = query(
            collection(db, 'songs'),
            where('uploadedBy', '==', userId)
          );
          const songsSnapshot = await getDocs(songsQuery);

          let actualStreams = 0;
          songsSnapshot.forEach(doc => {
            actualStreams += doc.data().plays || 0;
          });

          const streamsDiff = Math.abs(actualStreams - stats.streams);
          const streamsThreshold = actualStreams * 0.1; // 10% tolerance

          if (streamsDiff > streamsThreshold) {
            verification.verified = false;
            verification.discrepancies.push({
              field: 'streams',
              claimed: stats.streams,
              actual: actualStreams,
              difference: streamsDiff
            });
          }
        }

        // Verify earnings
        if (stats.earnings) {
          const payoutsQuery = query(
            collection(db, 'payouts'),
            where('artistId', '==', userId)
          );
          const payoutsSnapshot = await getDocs(payoutsQuery);

          let actualEarnings = 0;
          payoutsSnapshot.forEach(doc => {
            actualEarnings += doc.data().amount || 0;
          });

          const earningsDiff = Math.abs(actualEarnings - stats.earnings);
          const earningsThreshold = actualEarnings * 0.1; // 10% tolerance

          if (earningsDiff > earningsThreshold) {
            verification.verified = false;
            verification.discrepancies.push({
              field: 'earnings',
              claimed: stats.earnings,
              actual: actualEarnings,
              difference: earningsDiff
            });
          }
        }
      }

      // Verify curator stats
      if (userType === 'curator' && stats) {
        if (stats.playlists) {
          const playlistsQuery = query(
            collection(db, 'playlists'),
            where('createdBy', '==', userId)
          );
          const playlistsSnapshot = await getDocs(playlistsQuery);

          const actualPlaylists = playlistsSnapshot.size;

          if (actualPlaylists !== stats.playlists) {
            verification.verified = false;
            verification.discrepancies.push({
              field: 'playlists',
              claimed: stats.playlists,
              actual: actualPlaylists
            });
          }
        }
      }

      return verification;
    } catch (error) {
      console.error('Error verifying testimonial stats:', error);
      return {
        verified: false,
        error: error.message
      };
    }
  }

  /**
   * Approve testimonial (admin function)
   * @param {string} testimonialId - The testimonial ID
   * @param {string} adminUserId - The admin approving
   * @param {object} options - Additional options (featured, displayOrder)
   */
  async approveTestimonial(testimonialId, adminUserId, options = {}) {
    try {
      const { featured = false, displayOrder = 0 } = options;

      await updateDoc(doc(db, 'testimonials', testimonialId), {
        status: 'approved',
        verified: true,
        verifiedBy: adminUserId,
        verifiedAt: serverTimestamp(),
        featured,
        displayOrder,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error approving testimonial:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject testimonial (admin function)
   * @param {string} testimonialId - The testimonial ID
   * @param {string} reason - Reason for rejection
   */
  async rejectTestimonial(testimonialId, reason) {
    try {
      await updateDoc(doc(db, 'testimonials', testimonialId), {
        status: 'rejected',
        rejectionReason: reason,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error rejecting testimonial:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get pending testimonials (admin function)
   */
  async getPendingTestimonials() {
    try {
      const q = query(
        collection(db, 'testimonials'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching pending testimonials:', error);
      return [];
    }
  }

  /**
   * Revoke consent and archive testimonial
   * @param {string} testimonialId - The testimonial ID
   * @param {string} userId - The user revoking consent
   */
  async revokeConsent(testimonialId, userId) {
    try {
      const testimonialDoc = await getDoc(doc(db, 'testimonials', testimonialId));

      if (!testimonialDoc.exists()) {
        throw new Error('Testimonial not found');
      }

      // Verify user owns this testimonial
      if (testimonialDoc.data().userId !== userId) {
        throw new Error('Unauthorized');
      }

      await updateDoc(doc(db, 'testimonials', testimonialId), {
        consentGiven: false,
        status: 'archived',
        featured: false,
        updatedAt: serverTimestamp()
      });

      return { success: true, message: 'Consent revoked, testimonial archived' };
    } catch (error) {
      console.error('Error revoking consent:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const testimonialsService = new TestimonialsService();
export default testimonialsService;
