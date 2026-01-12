import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Hook to get real-time follower count for an artist
 * Optimized to use artistMetrics collection for consistency with engagementMetrics service
 * @param {string} artistId - The artist ID (artist name)
 * @returns {number} - Number of followers
 */
export const useArtistFollowers = (artistId) => {
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    if (!artistId || typeof artistId !== 'string') {
      setFollowerCount(0);
      return;
    }

    let unsubscribe = null;
    let mounted = true;

    try {
      // Use artistMetrics collection (same as trackFollow/trackUnfollow in engagementMetrics.js)
      const artistMetricsRef = doc(db, 'artistMetrics', artistId);
      unsubscribe = onSnapshot(
        artistMetricsRef,
        (snapshot) => {
          if (!mounted) return;
          if (snapshot.exists()) {
            setFollowerCount(snapshot.data()?.followerCount || 0);
          } else {
            setFollowerCount(0);
          }
        },
        (error) => {
          if (!mounted) return;
          // If document doesn't exist or permission denied, just set to 0
          console.debug('useArtistFollowers: Error reading followerCount, defaulting to 0', error);
          setFollowerCount(0);
        }
      );
    } catch (error) {
      console.error('useArtistFollowers: Failed to create listener', error);
      setFollowerCount(0);
    }

    return () => {
      mounted = false;
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.debug('useArtistFollowers: Error during cleanup', error);
        }
      }
    };
  }, [artistId]);

  return followerCount;
};
