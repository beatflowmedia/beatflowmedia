// src/services/stripeService.js
// Stripe payment integration service
import { loadStripe } from '@stripe/stripe-js';
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, getDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { calculateTrackPricing } from './licenseService';
import { SONG_PRICE, calculateAlbumPrice } from '../utils/pricing';
import { authedHeaders } from '../utils/authedHeaders';

// Build checkout request headers including the caller's Firebase ID token, which
// create-checkout verifies server-side to derive the authoritative user.
//
// The previous note here said an unauthenticated call made the server "fall back to
// body userId". That stopped being true when create-checkout was hardened to require
// a verified token -- it now refuses with a 401. A comment describing the old
// behaviour beside the new code is worse than no comment.
const checkoutHeaders = () => authedHeaders();

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
  // `acceptedAgreement` is the license version the buyer ticked, e.g.
  // "download-license@2026-09-19". create-checkout re-checks it against its own
  // copy of src/utils/agreements.js and refuses the sale if it is missing or not
  // current, so this is carried, never defaulted -- a default here would let a
  // caller that never showed the terms manufacture an acceptance.
  async createSongCheckout(userId, songId, userEmail, acceptedAgreement) {
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

      const originalPrice = songData.price || SONG_PRICE;

      // Calculate subscriber discount if applicable
      const pricing = await calculateTrackPricing(userId, originalPrice);

      // Create checkout session via Cloud Function or API
      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: await checkoutHeaders(),
        body: JSON.stringify({
          userId,
          itemId: songId,
          itemType: 'song',
          acceptedAgreement,
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
        await handleCheckoutError(response);
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
  // See createSongCheckout: acceptedAgreement is carried, never defaulted.
  async createAlbumCheckout(userId, albumId, userEmail, acceptedAgreement) {
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

      const originalPrice = albumData.price || calculateAlbumPrice(albumData.trackCount || 10);

      // Calculate subscriber discount if applicable
      const pricing = await calculateTrackPricing(userId, originalPrice);

      // Create checkout session via Cloud Function or API
      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: await checkoutHeaders(),
        body: JSON.stringify({
          userId,
          itemId: albumId,
          itemType: 'album',
          acceptedAgreement,
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
        await handleCheckoutError(response);
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

  // getDownloadLink() was removed on 2026-10-09.
  //
  // It resolved a purchased download as
  //   songData.downloadUrl || fullTrackUrl || audioUrl || fileUrl
  // and no song carries the first two, so every buyer was handed the 470 KB preview
  // instead of the master they paid for. It also decided entitlement client-side and
  // then read a URL off a public document, so the permission check and the file were
  // independent of each other.
  //
  // Use getMasterDownload() from src/services/masterDownload.js, which calls
  // netlify/functions/download-master.js: that verifies the ID token, checks the
  // purchase record server-side, and presigns the private R2 object.

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


/**
 * The server refused the license version this page is offering.
 *
 * This is not a user error and the buyer cannot fix it by re-reading anything. It means
 * the page they are looking at was built against an older version of the license text
 * than the one create-checkout now requires -- a cached bundle, usually held by the
 * service worker, which serves /index.html from cache.
 *
 * Without this, the message "please accept the current license terms" sends the buyer
 * back to the SAME stale checkbox, which produces the SAME 409, forever. A loop with no
 * exit they could ever guess at, on the payment path.
 *
 * So: refresh the worker, drop its caches, and reload once. They come back on the current
 * bundle, see the current checkbox -- which now also carries the statutory
 * immediate-supply acknowledgement -- and accept THAT. Re-accepting the current text is
 * the point; silently accepting a stale version server-side would defeat the reason the
 * version is recorded at all.
 *
 * One-shot, because a reload loop is worse than the bug it fixes: if the flag is already
 * set we stop and let the message through.
 */
const STALE_RELOAD_FLAG = 'bfmg:stale-agreement-reload';

async function recoverFromStaleAgreement() {
  try {
    if (sessionStorage.getItem(STALE_RELOAD_FLAG)) return false; // already tried
    sessionStorage.setItem(STALE_RELOAD_FLAG, String(Date.now()));
  } catch (err) {
    return false; // private mode / blocked storage: fall through to the message
  }

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) await reg.update();
    }
    if (window.caches && caches.keys) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (err) {
    // Best effort. A plain reload still usually picks up a new index.html.
  }

  window.location.reload();
  return true;
}

/** Shared by both checkout paths -- one place that knows what a 409 here means. */
async function handleCheckoutError(response) {
  const errorData = await response.json().catch(() => ({}));
  console.error('Server error response:', errorData);

  if (response.status === 409 && errorData.currentAgreement) {
    const reloading = await recoverFromStaleAgreement();
    if (reloading) {
      throw new Error('Updating to the current license terms...');
    }
    throw new Error(
      'This page is showing an out-of-date version of the license terms. ' +
      'Please refresh the page and try again.'
    );
  }

  throw new Error(errorData.error || 'Failed to create checkout session');
}

export const stripeService = new StripeService();
// Export service instance
export default stripeService;
