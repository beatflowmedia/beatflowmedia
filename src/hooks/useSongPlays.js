import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, increment } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Hook to get real-time play count for a song
 * @param {string} songId - The song ID
 * @returns {number} - Number of plays
 */
export const useSongPlays = (songId) => {
  const [playCount, setPlayCount] = useState(0);

  useEffect(() => {
    if (!songId || typeof songId !== 'string') return;

    const songPlaysRef = doc(db, 'songPlays', songId);
    const unsubscribe = onSnapshot(
      songPlaysRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setPlayCount(snapshot.data()?.playCount || 0);
        } else {
          setPlayCount(0);
        }
      },
      (error) => {
        // If document doesn't exist or permission denied, just set to 0
        setPlayCount(0);
      }
    );

    return () => unsubscribe();
  }, [songId]);

  return playCount;
};

/**
 * Increment play count for a song
 * @param {string} songId - The song ID
 */
export const incrementPlayCount = async (songId) => {
  if (!songId) return;

  try {
    const songPlaysRef = doc(db, 'songPlays', songId);
    await setDoc(
      songPlaysRef,
      {
        playCount: increment(1),
        lastPlayed: new Date(),
        songId: songId
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error incrementing play count:', error);
  }
};
