// src/services/stripeService.js
// Stripe payment integration service
import { loadStripe } from '@stripe/stripe-js';
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, getDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { calculateTrackPricing } from './licenseService';

// Initialize Stripe with your publishable key - lazy load to prevent blocking
let stripePromise = null;
const getStripePromise = () => {
  if (!stripePromise) {
    const key = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (key) {
      stripePromise = loadStripe(key).catch(err => {
        console.warn('Stripe failed to load:', err);
        return null;
      });
    }
  }
  return stripePromise;
};

// Default prices (in cents - Stripe format)
const DEFAULT_SONG_PRICE = 199;  // $1.99
const DEFAULT_ALBUM_PRICE = 1499; // $14.99

class StripeService {
  /**
   * Check if user has purchased a song
   */
  async hasPurchasedSong(userId, songId) {
    try {
      console.log('🔍 [StripeService] hasPurchasedSong called');
      console.log('[StripeService] Checking purchase for:', { userId, songId });

      if (!userId || !songId) {
        console.warn('[StripeService] Missing userId or songId:', { userId, songId });
        return false;
      }

      const q = query(
        collection(db, 'purchases'),
        where('userId', '==', userId),
        where('itemId', '==', songId),
        where('itemType', '==', 'song'),
        where('status', '==', 'completed')
      );

      console.log('[StripeService] Executing Firestore query...');
      const snapshot = await getDocs(q);
      console.log('[StripeService] Purchase check result:', {
        found: !snapshot.empty,
        count: snapshot.size,
        purchases: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      });

      return !snapshot.empty;
    } catch (error) {
      console.error('❌ [StripeService] Error checking song purchase:', error);
      return false;
    }
  }

  /**
   * Check if user has purchased an album
   */
  async hasPurchasedAlbum(userId, albumId) {
    try {
      const q = query(
        collection(db, 'purchases'),
        where('userId', '==', userId),
        where('itemId', '==', albumId),
        where('itemType', '==', 'album'),
        where('status', '==', 'completed')
      );

      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking album purchase:', error);
      return false;
    }
  }

  /**
   * Check if user can download a song (purchased song or purchased album containing the song)
   */
  async canDownloadSong(userId, songId) {
    try {
      // Check if song was purchased directly
      const songPurchased = await this.hasPurchasedSong(userId, songId);
      if (songPurchased) return true;

      // Check if the song is part of any purchased album
      const songDoc = await getDoc(doc(db, 'songs', songId));
      if (!songDoc.exists()) return false;

      const albumId = songDoc.data().albumId;
      if (!albumId) return false;

      return await this.hasPurchasedAlbum(userId, albumId);
    } catch (error) {
      console.error('Error checking download permission:', error);
      return false;
    }
  }

  /**
   * Get all songs in an album
   */
  async getAlbumSongs(albumId) {
    try {
      const q = query(
        collection(db, 'songs'),
        where('albumId', '==', albumId)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching album songs:', error);
      return [];
    }
  }

  /**
   * Create a Stripe checkout session for purchasing a song
   */
  async createSongCheckout(userId, songId, userEmail) {
    try {
      // Get song details
      const songDoc = await getDoc(doc(db, 'songs', songId));
      if (!songDoc.exists()) {
        throw new Error('Song not found');
      }

      const songData = songDoc.data();

      // Prevent artists from purchasing their own content
      const artistUserId = songData.artistId || songData.uploadedBy;
      if (artistUserId && userId === artistUserId) {
        throw new Error('You cannot purchase your own music');
      }

      const originalPrice = songData.price || DEFAULT_SONG_PRICE;

      // Calculate subscriber discount if applicable
      const pricing = await calculateTrackPricing(userId, originalPrice);

      // Create checkout session via Cloud Function or API
      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          itemId: songId,
          itemType: 'song',
          itemName: songData.title || 'Song',
          artistName: songData.artistName || 'Unknown Artist',
          price: Math.round(pricing.discountedPrice), // Use discounted price
          originalPrice: Math.round(pricing.originalPrice), // Store original for reference
          userEmail,
          metadata: {
            userId,
            songId,
            itemType: 'song',
            subscriberTier: pricing.tier || 'none',
            originalPrice: pricing.originalPrice.toString(),
            discountApplied: pricing.hasDiscount,
            savings: pricing.savings.toString()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const stripe = await getStripePromise();
      if (!stripe) throw new Error('Stripe failed to initialize');
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error creating song checkout:', error);
      throw error;
    }
  }

  /**
   * Create a Stripe checkout session for purchasing an album
   */
  async createAlbumCheckout(userId, albumId, userEmail) {
    try {
      // Get album details
      const albumDoc = await getDoc(doc(db, 'albums', albumId));
      if (!albumDoc.exists()) {
        throw new Error('Album not found');
      }

      const albumData = albumDoc.data();

      // Prevent artists from purchasing their own content
      const artistUserId = albumData.artistId || albumData.uploadedBy;
      if (artistUserId && userId === artistUserId) {
        throw new Error('You cannot purchase your own music');
      }

      const originalPrice = albumData.price || DEFAULT_ALBUM_PRICE;

      // Calculate subscriber discount if applicable
      const pricing = await calculateTrackPricing(userId, originalPrice);

      // Create checkout session via Cloud Function or API
      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          itemId: albumId,
          itemType: 'album',
          itemName: albumData.title || 'Album',
          artistName: albumData.artistName || 'Unknown Artist',
          price: Math.round(pricing.discountedPrice), // Use discounted price
          originalPrice: Math.round(pricing.originalPrice), // Store original for reference
          userEmail,
          metadata: {
            userId,
            albumId,
            itemType: 'album',
            subscriberTier: pricing.tier || 'none',
            originalPrice: pricing.originalPrice.toString(),
            discountApplied: pricing.hasDiscount,
            savings: pricing.savings.toString()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const stripe = await getStripePromise();
      if (!stripe) throw new Error('Stripe failed to initialize');
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error creating album checkout:', error);
      throw error;
    }
  }

  /**
   * Get user's purchase history
   */
  async getUserPurchases(userId) {
    try {
      const q = query(
        collection(db, 'purchases'),
        where('userId', '==', userId),
        where('status', '==', 'completed')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        purchasedAt: doc.data().purchasedAt?.toDate?.() || new Date()
      }));
    } catch (error) {
      console.error('Error fetching user purchases:', error);
      return [];
    }
  }

  /**
   * Generate a temporary download link for a purchased song
   */
  async getDownloadLink(userId, songId) {
    try {
      // Verify user has permission to download
      const canDownload = await this.canDownloadSong(userId, songId);
      if (!canDownload) {
        throw new Error('You must purchase this song before downloading');
      }

      // Get song details
      const songDoc = await getDoc(doc(db, 'songs', songId));
      if (!songDoc.exists()) {
        throw new Error('Song not found');
      }

      const songData = songDoc.data();

      // Return the download URL (this could be a Cloud Storage signed URL)
      // For now, return the file URL directly
      return {
        url: songData.fileUrl || songData.audioUrl,
        filename: `${songData.title}.mp3`,
        expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes
      };
    } catch (error) {
      console.error('Error getting download link:', error);
      throw error;
    }
  }

  /**
   * Record a download event
   */
  async recordDownload(userId, songId) {
    try {
      await addDoc(collection(db, 'downloads'), {
        userId,
        songId,
        downloadedAt: Timestamp.now(),
        ipAddress: null // Could be captured server-side
      });
    } catch (error) {
      console.error('Error recording download:', error);
    }
  }
}

export const stripeService = new StripeService();
export { DEFAULT_SONG_PRICE, DEFAULT_ALBUM_PRICE };
