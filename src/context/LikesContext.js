import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../firebaseConfig';
import { doc, setDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const LikesContext = createContext(null);

export const LikesProvider = ({ children }) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState([]);

  // Subscribe to user's likes separately
  useEffect(() => {
    if (!user?.uid) {
      setLikes([]);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        const data = snapshot.data();
        const newLikes = data?.likes || [];
        setLikes(newLikes);
      },
      (error) => {
        console.error('Error syncing likes:', error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Add like - completely independent
  const addLike = useCallback(async (songId) => {
    if (!user?.uid || !songId) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const songLikesRef = doc(db, 'songLikes', songId);

      await setDoc(userRef, { likes: arrayUnion(songId) }, { merge: true });
      await setDoc(songLikesRef, { likers: arrayUnion(user.uid) }, { merge: true });
    } catch (error) {
      console.error('Error adding like:', error);
      throw error;
    }
  }, [user?.uid]);

  // Remove like - completely independent
  const removeLike = useCallback(async (songId) => {
    if (!user?.uid || !songId) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const songLikesRef = doc(db, 'songLikes', songId);

      await setDoc(userRef, { likes: arrayRemove(songId) }, { merge: true });
      await setDoc(songLikesRef, { likers: arrayRemove(user.uid) }, { merge: true });
    } catch (error) {
      console.error('Error removing like:', error);
      throw error;
    }
  }, [user?.uid]);

  // Check if song is liked
  const isLiked = useCallback((songId) => {
    return likes.includes(songId);
  }, [likes]);

  const value = useMemo(() => ({
    likes,
    addLike,
    removeLike,
    isLiked
  }), [likes, addLike, removeLike, isLiked]);

  return (
    <LikesContext.Provider value={value}>
      {children}
    </LikesContext.Provider>
  );
};

export const useLikes = () => {
  const context = useContext(LikesContext);
  if (!context) {
    throw new Error('useLikes must be used within LikesProvider');
  }
  return context;
};
