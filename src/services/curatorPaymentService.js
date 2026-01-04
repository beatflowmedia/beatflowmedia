// src/services/curatorPaymentService.js
// Curator-Artist escrow payment service using existing Stripe infrastructure
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, getDoc, query, where, getDocs, updateDoc, Timestamp } from 'firebase/firestore';

// Payment flow states
export const PAYMENT_STATUS = {
  ESCROW_PENDING: 'escrow_pending', // Artist paid, curator hasn't reviewed
  ESCROW_ACCEPTED: 'escrow_accepted', // Curator accepted, track not added yet
  ESCROW_VERIFIED: 'escrow_verified', // Track verified on playlist, ready to release
  PAYMENT_COMPLETE: 'payment_complete', // Curator received payment
  REFUNDED: 'refunded', // Payment refunded to artist
  DISPUTED: 'disputed' // Payment in dispute
};

// Platform fee (10% of curator earnings)
const PLATFORM_FEE_PERCENTAGE = 0.10;

class CuratorPaymentService {
  /**
   * Create a curator playlist submission with escrow payment
   * Reuses existing create-checkout infrastructure
   */
  async createPlaylistSubmission(artistId, curatorId, trackId, playlistId, budget, artistEmail) {
    try {
      console.log('🎵 Creating playlist submission with escrow payment');

      // Validate budget range ($25-$1000)
      if (budget < 25 || budget > 1000) {
        throw new Error('Budget must be between $25 and $1,000');
      }

      // Get track and playlist details
      const trackDoc = await getDoc(doc(db, 'songs', trackId));
      const playlistDoc = await getDoc(doc(db, 'playlists', playlistId));

      if (!trackDoc.exists()) {
        throw new Error('Track not found');
      }

      if (!playlistDoc.exists()) {
        throw new Error('Playlist not found');
      }

      const trackData = trackDoc.data();
      const playlistData = playlistDoc.data();

      // Create submission record in Firestore FIRST
      const submissionRef = await addDoc(collection(db, 'playlist_submissions'), {
        artistId,
        curatorId,
        trackId,
        playlistId,
        trackTitle: trackData.title,
        trackArtist: trackData.artistName,
        playlistName: playlistData.name,
        submissionBudget: budget,
        status: 'pending_payment',
        paymentStatus: 'awaiting_escrow',
        submittedAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
        metadata: {
          trackGenre: trackData.genre,
          playlistFollowers: playlistData.followerCount || 0
        }
      });

      console.log('✅ Submission created:', submissionRef.id);

      // Create Stripe checkout session using existing infrastructure
      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: artistId,
          itemId: submissionRef.id,
          itemType: 'playlist_submission',
          itemName: `Playlist Placement: ${playlistData.name}`,
          artistName: `Track: ${trackData.title}`,
          price: Math.round(budget * 100), // Convert to cents
          userEmail: artistEmail,
          metadata: {
            artistId,
            curatorId,
            trackId,
            playlistId,
            submissionId: submissionRef.id,
            paymentType: 'escrow'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId, url } = await response.json();

      // Update submission with Stripe session ID
      await updateDoc(doc(db, 'playlist_submissions', submissionRef.id), {
        stripeSessionId: sessionId,
        checkoutUrl: url
      });

      console.log('✅ Checkout session created:', sessionId);

      return {
        submissionId: submissionRef.id,
        checkoutUrl: url,
        sessionId
      };
    } catch (error) {
      console.error('❌ Error creating playlist submission:', error);
      throw error;
    }
  }

  /**
   * Curator accepts a submission
   * Payment remains in escrow until track is added to playlist
   */
  async acceptSubmission(curatorId, submissionId) {
    try {
      const submissionRef = doc(db, 'playlist_submissions', submissionId);
      const submissionDoc = await getDoc(submissionRef);

      if (!submissionDoc.exists()) {
        throw new Error('Submission not found');
      }

      const submission = submissionDoc.data();

      // Verify curator owns this submission
      if (submission.curatorId !== curatorId) {
        throw new Error('Unauthorized: You do not own this submission');
      }

      // Check if payment is in escrow
      if (submission.paymentStatus !== PAYMENT_STATUS.ESCROW_PENDING) {
        throw new Error('Invalid payment status');
      }

      // Update submission status
      await updateDoc(submissionRef, {
        status: 'accepted',
        paymentStatus: PAYMENT_STATUS.ESCROW_ACCEPTED,
        acceptedAt: Timestamp.now(),
        placementDeadline: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 days to add track
      });

      console.log(`✅ Submission ${submissionId} accepted by curator ${curatorId}`);

      return { success: true };
    } catch (error) {
      console.error('❌ Error accepting submission:', error);
      throw error;
    }
  }

  /**
   * Curator rejects a submission
   * Triggers automatic refund to artist
   */
  async rejectSubmission(curatorId, submissionId, reason) {
    try {
      const submissionRef = doc(db, 'playlist_submissions', submissionId);
      const submissionDoc = await getDoc(submissionRef);

      if (!submissionDoc.exists()) {
        throw new Error('Submission not found');
      }

      const submission = submissionDoc.data();

      // Verify curator owns this submission
      if (submission.curatorId !== curatorId) {
        throw new Error('Unauthorized: You do not own this submission');
      }

      // Update submission status
      await updateDoc(submissionRef, {
        status: 'rejected',
        paymentStatus: 'pending_refund',
        rejectedAt: Timestamp.now(),
        rejectionReason: reason
      });

      // Trigger refund via Netlify function
      await fetch('/.netlify/functions/process-submission-refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          reason: 'curator_rejected'
        })
      });

      console.log(`✅ Submission ${submissionId} rejected, refund initiated`);

      return { success: true, refundStatus: 'pending' };
    } catch (error) {
      console.error('❌ Error rejecting submission:', error);
      throw error;
    }
  }

  /**
   * Verify track has been added to playlist and release payment
   * Called after curator adds track to their playlist
   */
  async verifyPlacementAndReleaseFunds(submissionId) {
    try {
      const submissionRef = doc(db, 'playlist_submissions', submissionId);
      const submissionDoc = await getDoc(submissionRef);

      if (!submissionDoc.exists()) {
        throw new Error('Submission not found');
      }

      const submission = submissionDoc.data();

      // Check if payment is in accepted state
      if (submission.paymentStatus !== PAYMENT_STATUS.ESCROW_ACCEPTED) {
        throw new Error('Invalid payment status for release');
      }

      // TODO: In production, verify track is actually on playlist via Spotify API
      // For now, we'll trust curator confirmation

      // Calculate curator payout (budget minus platform fee)
      const curatorPayout = submission.submissionBudget * (1 - PLATFORM_FEE_PERCENTAGE);
      const platformFee = submission.submissionBudget * PLATFORM_FEE_PERCENTAGE;

      // Update submission status
      await updateDoc(submissionRef, {
        paymentStatus: PAYMENT_STATUS.ESCROW_VERIFIED,
        verifiedAt: Timestamp.now(),
        curatorPayout,
        platformFee
      });

      // Release funds to curator via existing Stripe Connect infrastructure
      await fetch('/.netlify/functions/release-curator-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          curatorId: submission.curatorId,
          amount: curatorPayout,
          platformFee
        })
      });

      console.log(`✅ Payment released for submission ${submissionId}: $${curatorPayout} to curator`);

      return {
        success: true,
        curatorPayout,
        platformFee
      };
    } catch (error) {
      console.error('❌ Error releasing payment:', error);
      throw error;
    }
  }

  /**
   * Get curator's pending submissions (inbox)
   */
  async getCuratorSubmissions(curatorId, status = 'all') {
    try {
      let q = query(
        collection(db, 'playlist_submissions'),
        where('curatorId', '==', curatorId)
      );

      if (status !== 'all') {
        q = query(q, where('status', '==', status));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate?.() || new Date(),
        acceptedAt: doc.data().acceptedAt?.toDate?.() || null
      }));
    } catch (error) {
      console.error('❌ Error fetching curator submissions:', error);
      return [];
    }
  }

  /**
   * Get artist's submitted campaigns
   */
  async getArtistSubmissions(artistId) {
    try {
      const q = query(
        collection(db, 'playlist_submissions'),
        where('artistId', '==', artistId)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate?.() || new Date()
      }));
    } catch (error) {
      console.error('❌ Error fetching artist submissions:', error);
      return [];
    }
  }

  /**
   * Get curator's total earnings (lifetime, pending, completed)
   */
  async getCuratorEarnings(curatorId) {
    try {
      const q = query(
        collection(db, 'playlist_submissions'),
        where('curatorId', '==', curatorId)
      );

      const snapshot = await getDocs(q);

      let totalEarnings = 0;
      let pendingEarnings = 0;
      let completedEarnings = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const curatorPayout = data.submissionBudget * (1 - PLATFORM_FEE_PERCENTAGE);

        if (data.paymentStatus === PAYMENT_STATUS.PAYMENT_COMPLETE) {
          completedEarnings += curatorPayout;
          totalEarnings += curatorPayout;
        } else if (
          data.paymentStatus === PAYMENT_STATUS.ESCROW_PENDING ||
          data.paymentStatus === PAYMENT_STATUS.ESCROW_ACCEPTED ||
          data.paymentStatus === PAYMENT_STATUS.ESCROW_VERIFIED
        ) {
          pendingEarnings += curatorPayout;
        }
      });

      return {
        totalEarnings,
        pendingEarnings,
        completedEarnings,
        placementCount: snapshot.size
      };
    } catch (error) {
      console.error('❌ Error fetching curator earnings:', error);
      return {
        totalEarnings: 0,
        pendingEarnings: 0,
        completedEarnings: 0,
        placementCount: 0
      };
    }
  }

  /**
   * Calculate suggested pricing for curator based on playlist metrics
   */
  calculateSuggestedPricing(followerCount, avgStreams, engagementRate) {
    // Pricing tiers based on CuratorAgent recommendations
    const tiers = {
      emerging: { min: 25, max: 75, followers: 1000 },
      growing: { min: 75, max: 200, followers: 10000 },
      established: { min: 200, max: 500, followers: 50000 },
      premium: { min: 500, max: 1000, followers: Infinity }
    };

    let tier;
    if (followerCount < tiers.emerging.followers) {
      tier = tiers.emerging;
    } else if (followerCount < tiers.growing.followers) {
      tier = tiers.growing;
    } else if (followerCount < tiers.established.followers) {
      tier = tiers.established;
    } else {
      tier = tiers.premium;
    }

    // Adjust based on engagement rate
    const engagementMultiplier = engagementRate > 0.05 ? 1.2 : 1.0;

    const suggestedMin = Math.round(tier.min * engagementMultiplier);
    const suggestedMax = Math.round(tier.max * engagementMultiplier);

    return {
      suggestedMin,
      suggestedMax,
      tierName: Object.keys(tiers).find(key => tiers[key] === tier)
    };
  }
}

export const curatorPaymentService = new CuratorPaymentService();
export { PLATFORM_FEE_PERCENTAGE };
