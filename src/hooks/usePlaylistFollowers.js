import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Hook to get real-time follower count for a playlist
 * Optimized to use playlistMetrics collection for consistency with engagementMetrics service
 * @param {string} playlistId - The playlist ID
 * @returns {number} - Number of followers
 */
export const usePlaylistFollowers = (playlistId) => {
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    if (!playlistId || typeof playlistId !== 'string') {
      setFollowerCount(0);
      return;
    }

    let unsubscribe = null;
    let mounted = true;

    try {
      // Use playlistMetrics collection (same as trackPlaylistFollow/trackPlaylistUnfollow in engagementMetrics.js)
      const playlistMetricsRef = doc(db, 'playlistMetrics', playlistId);
      unsubscribe = onSnapshot(
        playlistMetricsRef,
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
          console.debug('usePlaylistFollowers: Error reading followerCount, defaulting to 0', error);
          setFollowerCount(0);
        }
      );
    } catch (error) {
      console.error('usePlaylistFollowers: Failed to create listener', error);
      setFollowerCount(0);
    }

    return () => {
      mounted = false;
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.debug('usePlaylistFollowers: Error during cleanup', error);
        }
      }
    };
  }, [playlistId]);

  return followerCount;
};
