import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Hook to generate all personalized music sections for a user
 * @param {Object} user - The authenticated user
 * @returns {Object} - { sections, loading, error }
 */
export const usePersonalizedSections = (user) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setSections([]);
      setLoading(false);
      return;
    }

    const loadPersonalizedSections = async () => {
      try {
        setLoading(true);
        const allSections = [];

        // 1. Recently Played
        const recentlyPlayed = await fetchRecentlyPlayed(user.uid);
        if (recentlyPlayed.length > 0) {
          allSections.push({
            id: 'recently-played',
            title: 'Recently Played',
            description: 'Pick up where you left off',
            type: 'songs',
            songs: recentlyPlayed,
            icon: '🕐'
          });
        }

        // 2. Recommended for Today
        const todayRecommendations = await fetchRecommendedForToday(user);
        if (todayRecommendations.length > 0) {
          allSections.push({
            id: 'recommended-today',
            title: 'Recommended for Today',
            description: 'Fresh picks based on your taste',
            type: 'songs',
            songs: todayRecommendations,
            icon: '🌟'
          });
        }

        // 3. Your Favorite Artists
        if (user.follows && user.follows.length > 0) {
          const favoriteArtistsSongs = await fetchYourFavoriteArtists(user.follows);
          if (favoriteArtistsSongs.length > 0) {
            allSections.push({
              id: 'favorite-artists',
              title: 'Your Favorite Artists',
              description: 'Latest from artists you follow',
              type: 'songs',
              songs: favoriteArtistsSongs,
              icon: '💫'
            });
          }
        }

        // 4. You Might Like
        const youMightLike = await fetchYouMightLike(user);
        if (youMightLike.length > 0) {
          allSections.push({
            id: 'you-might-like',
            title: 'You Might Like',
            description: 'Based on what you\'ve been listening to',
            type: 'songs',
            songs: youMightLike,
            icon: '💝'
          });
        }

        // 5. More of What You Like
        const moreOfWhatYouLike = await fetchMoreOfWhatYouLike(user);
        if (moreOfWhatYouLike.length > 0) {
          allSections.push({
            id: 'more-of-what-you-like',
            title: 'More of What You Like',
            description: 'Similar to your recent favorites',
            type: 'songs',
            songs: moreOfWhatYouLike,
            icon: '🎵'
          });
        }

        // 6. Best of [Artist] - for each followed artist
        if (user.follows && user.follows.length > 0) {
          for (const artistName of user.follows.slice(0, 3)) {
            const bestOf = await fetchBestOfArtist(artistName, user.likes || []);
            if (bestOf.length > 0) {
              allSections.push({
                id: `best-of-${artistName.toLowerCase().replace(/\s+/g, '-')}`,
                title: `Best of ${artistName}`,
                description: 'Most popular tracks',
                type: 'songs',
                songs: bestOf,
                icon: '👑'
              });
            }
          }
        }

        // 7. Made For You
        const madeForYou = await fetchMadeForYou(user);
        if (madeForYou.length > 0) {
          allSections.push({
            id: 'made-for-you',
            title: 'Made For You',
            description: 'A personalized mix just for you',
            type: 'songs',
            songs: madeForYou,
            icon: '🎁'
          });
        }

        setSections(allSections);
        setError(null);
      } catch (err) {
        console.error('Error loading personalized sections:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPersonalizedSections();
  }, [user]);

  return { sections, loading, error };
};

// Helper functions

/**
 * Fetch recently played songs
 */
const fetchRecentlyPlayed = async (userId) => {
  try {
    // For now, return empty array since listening_history might not exist yet
    // This can be populated later when we implement actual listening history tracking
    return [];

    /* Commented out until listening history is implemented
    const historyQuery = query(
      collection(db, 'listening_history'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(20)
    );

    const snapshot = await getDocs(historyQuery);
    const songIds = [...new Set(snapshot.docs.map(doc => doc.data().songId))].slice(0, 12);

    if (songIds.length === 0) return [];

    const songsQuery = query(
      collection(db, 'songs'),
      where('__name__', 'in', songIds)
    );

    const songsSnapshot = await getDocs(songsQuery);
    const songsMap = {};
    songsSnapshot.forEach(doc => {
      songsMap[doc.id] = { id: doc.id, ...doc.data() };
    });

    // Return in order of recently played
    return songIds.map(id => songsMap[id]).filter(Boolean);
    */
  } catch (error) {
    console.error('Error fetching recently played:', error);
    return [];
  }
};

/**
 * Fetch recommended songs for today
 */
const fetchRecommendedForToday = async (user) => {
  try {
    // Get user's liked songs to understand preferences
    const likedSongs = await fetchLikedSongs(user.likes || []);
    const genres = extractGenres(likedSongs);
    const artists = extractArtists(likedSongs);

    // Get trending songs from user's favorite genres
    let recommendations = [];

    if (genres.length > 0) {
      const genreSongsQuery = query(
        collection(db, 'songs'),
        where('genre', 'in', genres.slice(0, 3)),
        orderBy('playCount', 'desc'),
        firestoreLimit(30)
      );

      const snapshot = await getDocs(genreSongsQuery);
      recommendations = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(song => !(user.likes || []).includes(song.id));
    }

    // Shuffle and return subset
    return shuffleArray(recommendations).slice(0, 12);
  } catch (error) {
    console.error('Error fetching recommended for today:', error);
    return [];
  }
};

/**
 * Fetch songs from favorite artists
 */
const fetchYourFavoriteArtists = async (followedArtists) => {
  try {
    const songsQuery = query(
      collection(db, 'songs'),
      where('artist', 'in', followedArtists.slice(0, 10)),
      orderBy('releaseDate', 'desc'),
      firestoreLimit(12)
    );

    const snapshot = await getDocs(songsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching favorite artists songs:', error);
    return [];
  }
};

/**
 * Fetch "You Might Like" recommendations
 */
const fetchYouMightLike = async (user) => {
  try {
    const likedSongs = await fetchLikedSongs(user.likes || []);
    const genres = extractGenres(likedSongs);

    if (genres.length === 0) return [];

    const songsQuery = query(
      collection(db, 'songs'),
      where('genre', 'in', genres.slice(0, 3)),
      firestoreLimit(30)
    );

    const snapshot = await getDocs(songsQuery);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(song => !(user.likes || []).includes(song.id))
      .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
      .slice(0, 12);
  } catch (error) {
    console.error('Error fetching you might like:', error);
    return [];
  }
};

/**
 * Fetch "More of What You Like"
 */
const fetchMoreOfWhatYouLike = async (user) => {
  try {
    const likedSongs = await fetchLikedSongs(user.likes || []);
    const artists = extractArtists(likedSongs);

    if (artists.length === 0) return [];

    const songsQuery = query(
      collection(db, 'songs'),
      where('artist', 'in', artists.slice(0, 5)),
      firestoreLimit(30)
    );

    const snapshot = await getDocs(songsQuery);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(song => !(user.likes || []).includes(song.id))
      .slice(0, 12);
  } catch (error) {
    console.error('Error fetching more of what you like:', error);
    return [];
  }
};

/**
 * Fetch best songs from a specific artist
 */
const fetchBestOfArtist = async (artistName, excludeIds = []) => {
  try {
    const songsQuery = query(
      collection(db, 'songs'),
      where('artist', '==', artistName),
      orderBy('playCount', 'desc'),
      firestoreLimit(12)
    );

    const snapshot = await getDocs(songsQuery);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(song => !excludeIds.includes(song.id));
  } catch (error) {
    console.error('Error fetching best of artist:', error);
    return [];
  }
};

/**
 * Fetch "Made For You" personalized mix
 */
const fetchMadeForYou = async (user) => {
  try {
    const likedSongs = await fetchLikedSongs(user.likes || []);
    const genres = extractGenres(likedSongs);
    const artists = extractArtists(likedSongs);

    // Mix of genres and artists
    const recommendations = [];

    // Add some from favorite genres
    if (genres.length > 0) {
      const genreQuery = query(
        collection(db, 'songs'),
        where('genre', 'in', genres.slice(0, 2)),
        firestoreLimit(20)
      );
      const genreSnapshot = await getDocs(genreQuery);
      recommendations.push(...genreSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }

    // Filter out already liked songs and shuffle
    return shuffleArray(
      recommendations.filter(song => !(user.likes || []).includes(song.id))
    ).slice(0, 12);
  } catch (error) {
    console.error('Error fetching made for you:', error);
    return [];
  }
};

// Utility functions

const fetchLikedSongs = async (likedIds) => {
  if (!likedIds || likedIds.length === 0) return [];

  try {
    const songsQuery = query(
      collection(db, 'songs'),
      where('__name__', 'in', likedIds.slice(0, 10))
    );
    const snapshot = await getDocs(songsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching liked songs:', error);
    return [];
  }
};

const extractGenres = (songs) => {
  const genreCounts = {};
  songs.forEach(song => {
    if (song.genre) {
      genreCounts[song.genre] = (genreCounts[song.genre] || 0) + 1;
    }
  });
  return Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);
};

const extractArtists = (songs) => {
  const artistCounts = {};
  songs.forEach(song => {
    if (song.artist) {
      artistCounts[song.artist] = (artistCounts[song.artist] || 0) + 1;
    }
  });
  return Object.keys(artistCounts).sort((a, b) => artistCounts[b] - artistCounts[a]);
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
