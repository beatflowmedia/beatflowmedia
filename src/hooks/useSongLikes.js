import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Hook to get real-time like count for a song
 * @param {string} songId - The song ID
 * @returns {number} - Number of likes
 */
export const useSongLikes = (songId) => {
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (!songId || typeof songId !== 'string') return;

    const songLikesRef = doc(db, 'songLikes', songId);
    const unsubscribe = onSnapshot(
      songLikesRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const likers = snapshot.data()?.likers || [];
          setLikeCount(likers.length);
        } else {
          setLikeCount(0);
        }
      },
      (error) => {
        // If document doesn't exist or permission denied, just set to 0
        setLikeCount(0);
      }
    );

    return () => unsubscribe();
  }, [songId]);

  return likeCount;
};
