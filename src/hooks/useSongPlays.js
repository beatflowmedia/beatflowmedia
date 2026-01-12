import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Hook to get real-time play count for a song
 * Optimized to use songMetrics collection for consistency with engagementMetrics service
 * @param {string} songId - The song ID
 * @returns {number} - Number of plays
 */
export const useSongPlays = (songId) => {
  const [playCount, setPlayCount] = useState(0);

  useEffect(() => {
    if (!songId || typeof songId !== 'string') {
      setPlayCount(0);
      return;
    }

    let unsubscribe = null;
    let mounted = true;

    try {
      // Use songMetrics collection (same as trackPlay in engagementMetrics.js)
      const songMetricsRef = doc(db, 'songMetrics', songId);
      unsubscribe = onSnapshot(
        songMetricsRef,
        (snapshot) => {
          if (!mounted) return;
          if (snapshot.exists()) {
            setPlayCount(snapshot.data()?.playCount || 0);
          } else {
            setPlayCount(0);
          }
        },
        (error) => {
          if (!mounted) return;
          // If document doesn't exist or permission denied, just set to 0
          console.debug('useSongPlays: Error reading playCount, defaulting to 0', error);
          setPlayCount(0);
        }
      );
    } catch (error) {
      console.error('useSongPlays: Failed to create listener', error);
      setPlayCount(0);
    }

    return () => {
      mounted = false;
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.debug('useSongPlays: Error during cleanup', error);
        }
      }
    };
  }, [songId]);

  return playCount;
};

/**
 * Increment play count for a song
 * @deprecated Use trackPlay from engagementMetrics.js instead for proper analytics
 * This function is kept for backward compatibility but should not be used directly
 * @param {string} songId - The song ID
 */
export const incrementPlayCount = async (songId) => {
  console.warn('incrementPlayCount is deprecated. Use trackPlay from engagementMetrics.js instead');
  // Function kept for backward compatibility but logs warning
  // All play tracking should go through trackPlay() for proper analytics
};
