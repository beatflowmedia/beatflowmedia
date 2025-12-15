import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../firebaseConfig';
import { doc, setDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);

  // Subscribe to user's favorites
  useEffect(() => {
    if (!user?.uid) {
      setFavorites([]);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        const data = snapshot.data();
        const newFavorites = data?.favorites || [];
        setFavorites(newFavorites);
      },
      (error) => {
        console.error('Error syncing favorites:', error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Add favorite
  const addFavorite = useCallback(async (songId) => {
    if (!user?.uid || !songId) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const songFavoritesRef = doc(db, 'songFavorites', songId);

      await setDoc(userRef, { favorites: arrayUnion(songId) }, { merge: true });
      await setDoc(songFavoritesRef, { favoriters: arrayUnion(user.uid) }, { merge: true });
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }, [user?.uid]);

  // Remove favorite
  const removeFavorite = useCallback(async (songId) => {
    if (!user?.uid || !songId) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const songFavoritesRef = doc(db, 'songFavorites', songId);

      await setDoc(userRef, { favorites: arrayRemove(songId) }, { merge: true });
      await setDoc(songFavoritesRef, { favoriters: arrayRemove(user.uid) }, { merge: true });
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }, [user?.uid]);

  // Check if song is favorited
  const isFavorited = useCallback((songId) => {
    return favorites.includes(songId);
  }, [favorites]);

  const value = useMemo(() => ({
    favorites,
    addFavorite,
    removeFavorite,
    isFavorited
  }), [favorites, addFavorite, removeFavorite, isFavorited]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};
