// hooks/useArtistImage.js
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Hook to get artist image with fallback to album cover
 * @param {string} artistName - Name of the artist
 * @returns {string} Image URL with fallback cascade
 */
export function useArtistImage(artistName) {
  const [imageUrl, setImageUrl] = useState('/images/Logo.png');

  useEffect(() => {
    if (!artistName) {
      setImageUrl('/images/Logo.png');
      return;
    }

    const fetchArtistImage = async () => {
      try {
        console.log('[useArtistImage] Fetching image for artist:', artistName);

        // Try to get artist profile image
        const artistQuery = query(
          collection(db, 'artists'),
          where('name', '==', artistName),
          limit(1)
        );
        const artistSnapshot = await getDocs(artistQuery);

        if (!artistSnapshot.empty) {
          const artistData = artistSnapshot.docs[0].data();
          console.log('[useArtistImage] Artist data:', { profileImage: artistData.profileImage, cover: artistData.cover });

          // Check for artist profile image or cover (must be valid non-empty string)
          if (artistData.profileImage && artistData.profileImage.trim() && artistData.profileImage !== 'undefined') {
            console.log('[useArtistImage] Using profileImage:', artistData.profileImage);
            setImageUrl(artistData.profileImage);
            return;
          }
          if (artistData.cover && artistData.cover.trim() && artistData.cover !== 'undefined') {
            console.log('[useArtistImage] Using cover:', artistData.cover);
            setImageUrl(artistData.cover);
            return;
          }
        }

        // Fallback to first album cover
        console.log('[useArtistImage] No artist image found, checking albums...');
        const albumQuery = query(
          collection(db, 'albums'),
          where('artistName', '==', artistName),
          limit(1)
        );
        const albumSnapshot = await getDocs(albumQuery);
        console.log('[useArtistImage] Found albums:', albumSnapshot.size);

        if (!albumSnapshot.empty) {
          const albumData = albumSnapshot.docs[0].data();
          console.log('[useArtistImage] Album coverUrl:', albumData.coverUrl);
          if (albumData.coverUrl && albumData.coverUrl.trim() && albumData.coverUrl !== 'undefined') {
            console.log('[useArtistImage] Using album cover:', albumData.coverUrl);
            setImageUrl(albumData.coverUrl);
            return;
          }
        }

        // Final fallback to logo
        console.log('[useArtistImage] No valid images found, using logo fallback');
        setImageUrl('/images/Logo.png');
      } catch (error) {
        console.error('[useArtistImage] Error fetching artist image:', error);
        setImageUrl('/images/Logo.png');
      }
    };

    fetchArtistImage();
  }, [artistName]);

  return imageUrl;
}

/**
 * Get artist image URL synchronously (for use in components with artist data already loaded)
 * @param {Object} artist - Artist object from Firestore
 * @param {Array} albums - Array of album objects
 * @returns {string} Image URL with fallback cascade
 */
export function getArtistImageUrl(artist, albums = []) {
  // Try artist profile image first (must be valid non-empty string)
  if (artist?.profileImage && artist.profileImage.trim() && artist.profileImage !== 'undefined') {
    return artist.profileImage;
  }
  if (artist?.cover && artist.cover.trim() && artist.cover !== 'undefined') {
    return artist.cover;
  }

  // Fallback to first album's cover art
  if (albums.length > 0 && albums[0]?.coverUrl && albums[0].coverUrl.trim() && albums[0].coverUrl !== 'undefined') {
    return albums[0].coverUrl;
  }

  // Final fallback to logo
  return '/images/Logo.png';
}
