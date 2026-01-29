import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../firebaseConfig';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
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

    console.log('FavoritesContext: Setting up listener for user:', user.uid);
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        const data = snapshot.data();
        const newFavorites = data?.favorites || [];
        console.log('FavoritesContext: Received favorites update:', newFavorites);
        setFavorites(newFavorites);
      },
      (error) => {
        console.error('FavoritesContext: Error syncing favorites:', error);
      }
    );

    return () => {
      console.log('FavoritesContext: Cleaning up listener for user:', user.uid);
      unsubscribe();
    };
  }, [user?.uid]);

  // Add favorite
  const addFavorite = useCallback(async (songId) => {
    if (!user?.uid || !songId) {
      console.warn('Cannot add favorite: missing user or songId', { userId: user?.uid, songId });
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      const songFavoritesRef = doc(db, 'songFavorites', songId);

      console.log('Adding favorite:', { userId: user.uid, songId });
      
      // Try updateDoc first, if document doesn't exist it will fail
      try {
        await updateDoc(userRef, { favorites: arrayUnion(songId) });
        console.log('Updated user favorites array');
      } catch (updateError) {
        // If document doesn't exist, create it
        console.log('Document may not exist, creating with setDoc');
        await setDoc(userRef, { favorites: arrayUnion(songId) }, { merge: true });
      }

      // Same for songFavorites
      try {
        await updateDoc(songFavoritesRef, { favoriters: arrayUnion(user.uid) });
        console.log('Updated song favoriters array');
      } catch (updateError) {
        console.log('Song doc may not exist, creating with setDoc');
        await setDoc(songFavoritesRef, { favoriters: arrayUnion(user.uid) }, { merge: true });
      }

      console.log('Successfully added favorite:', { userId: user.uid, songId });
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }, [user?.uid]);

  // Remove favorite
  const removeFavorite = useCallback(async (songId) => {
    if (!user?.uid || !songId) {
      console.warn('Cannot remove favorite: missing user or songId', { userId: user?.uid, songId });
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      const songFavoritesRef = doc(db, 'songFavorites', songId);

      console.log('Removing favorite:', { userId: user.uid, songId });
      
      // Try updateDoc first
      try {
        await updateDoc(userRef, { favorites: arrayRemove(songId) });
        console.log('Removed from user favorites array');
      } catch (updateError) {
        // If document doesn't exist, create it
        console.log('User doc may not exist, creating with setDoc');
        await setDoc(userRef, { favorites: arrayRemove(songId) }, { merge: true });
      }

      // Same for songFavorites
      try {
        await updateDoc(songFavoritesRef, { favoriters: arrayRemove(user.uid) });
        console.log('Removed user from song favoriters');
      } catch (updateError) {
        console.log('Song doc may not exist, creating with setDoc');
        await setDoc(songFavoritesRef, { favoriters: arrayRemove(user.uid) }, { merge: true });
      }

      console.log('Successfully removed favorite:', { userId: user.uid, songId });
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
