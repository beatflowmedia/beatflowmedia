// src/services/audioService.js
// Secure audio streaming service using signed URLs

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseConfig';

// Cache for signed URLs to prevent excessive function calls
const urlCache = new Map();

/**
 * Get a secure, time-limited signed URL for audio streaming
 * @param {string} songId - The song ID to stream
 * @returns {Promise<{signedUrl: string, expiresAt: number}>}
 */
export async function getSignedAudioUrl(songId) {
  // Check cache first
  const cached = urlCache.get(songId);
  if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) { // 5 min buffer
    return cached;
  }

  try {
    // Call Cloud Function to get signed URL
    const getSignedUrl = httpsCallable(functions, 'getSignedAudioUrl');
    const result = await getSignedUrl({ songId });

    const { signedUrl, expiresAt } = result.data;

    // Cache the signed URL
    urlCache.set(songId, { signedUrl, expiresAt });

    // Auto-clear cache when URL expires
    setTimeout(() => {
      urlCache.delete(songId);
    }, expiresAt - Date.now());

    return { signedUrl, expiresAt };
  } catch (error) {
    console.error('Error getting signed audio URL:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      stack: error.stack
    });

    // Provide user-friendly error messages
    if (error.code === 'unauthenticated' || error.message?.includes('Authentication required')) {
      throw new Error('Please sign in to stream audio.');
    } else if (error.message?.includes('Purchase required')) {
      throw new Error('Purchase this song to stream it.');
    } else if (error.message?.includes('Song not found') || error.message?.includes('not found')) {
      throw new Error('Song not available.');
    } else if (error.code === 'internal' || error.message?.includes('INTERNAL')) {
      // Firebase internal error - likely permissions or configuration issue
      console.error('Firebase INTERNAL error - check Cloud Function logs and service account permissions');
      throw new Error('Audio streaming temporarily unavailable. Please try again later.');
    } else {
      throw new Error(`Failed to load audio: ${error.message || 'Please try again.'}`);
    }
  }
}

/**
 * Clear the URL cache for a specific song
 * @param {string} songId - The song ID to clear from cache
 */
export function clearAudioUrlCache(songId) {
  if (songId) {
    urlCache.delete(songId);
  } else {
    urlCache.clear();
  }
}
