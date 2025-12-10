import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Hook to generate personalized podcast sections
 * @param {Object} user - The authenticated user
 * @returns {Object} - { sections, loading, error }
 */
export const usePodcastSections = (user) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setSections([]);
      setLoading(false);
      return;
    }

    const loadPodcastSections = async () => {
      try {
        setLoading(true);
        const allSections = [];

        // 1. Episodes You Might Like
        const episodesMightLike = await fetchEpisodesYouMightLike(user);
        if (episodesMightLike.length > 0) {
          allSections.push({
            id: 'episodes-you-might-like',
            title: 'Episodes You Might Like',
            description: 'Based on your listening history',
            type: 'episodes',
            episodes: episodesMightLike,
            icon: '🎧'
          });
        }

        // 2. Recently Played Episodes
        const recentlyPlayedEpisodes = await fetchRecentlyPlayedEpisodes(user.uid);
        if (recentlyPlayedEpisodes.length > 0) {
          allSections.push({
            id: 'recently-played-episodes',
            title: 'Recently Played Episodes',
            description: 'Continue listening',
            type: 'episodes',
            episodes: recentlyPlayedEpisodes,
            icon: '🕐'
          });
        }

        // 3. Your Favorite Podcasts
        const favoritePodcasts = await fetchYourFavoritePodcasts(user);
        if (favoritePodcasts.length > 0) {
          allSections.push({
            id: 'favorite-podcasts',
            title: 'Your Favorite Podcasts',
            description: 'Shows you follow',
            type: 'podcasts',
            episodes: favoritePodcasts,
            icon: '⭐'
          });
        }

        // 4. New Episodes from Your Shows
        const newEpisodes = await fetchNewEpisodesFromFollowedShows(user);
        if (newEpisodes.length > 0) {
          allSections.push({
            id: 'new-episodes',
            title: 'New Episodes',
            description: 'Latest from shows you follow',
            type: 'episodes',
            episodes: newEpisodes,
            icon: '🆕'
          });
        }

        // 5. Trending Podcasts
        const trendingPodcasts = await fetchTrendingPodcasts();
        if (trendingPodcasts.length > 0) {
          allSections.push({
            id: 'trending-podcasts',
            title: 'Trending Podcasts',
            description: 'Popular episodes right now',
            type: 'episodes',
            episodes: trendingPodcasts,
            icon: '🔥'
          });
        }

        // 6. Recommended Podcasts
        const recommendedPodcasts = await fetchRecommendedPodcasts(user);
        if (recommendedPodcasts.length > 0) {
          allSections.push({
            id: 'recommended-podcasts',
            title: 'Recommended For You',
            description: 'Shows you might enjoy',
            type: 'episodes',
            episodes: recommendedPodcasts,
            icon: '💡'
          });
        }

        setSections(allSections);
        setError(null);
      } catch (err) {
        console.error('Error loading podcast sections:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPodcastSections();
  }, [user]);

  return { sections, loading, error };
};

// Helper functions

/**
 * Fetch episodes the user might like based on their history
 */
const fetchEpisodesYouMightLike = async (user) => {
  try {
    // Get user's listening history for podcasts
    const historyQuery = query(
      collection(db, 'listening_history'),
      where('userId', '==', user.uid),
      where('contentType', '==', 'podcast'),
      orderBy('timestamp', 'desc'),
      firestoreLimit(10)
    );

    const historySnapshot = await getDocs(historyQuery);
    const listenedEpisodeIds = new Set();
    const categories = new Set();

    historySnapshot.forEach(doc => {
      const data = doc.data();
      listenedEpisodeIds.add(data.episodeId);
      if (data.category) categories.add(data.category);
    });

    // Get similar episodes from same categories
    if (categories.size === 0) return [];

    const episodesQuery = query(
      collection(db, 'podcast_episodes'),
      where('category', 'in', Array.from(categories).slice(0, 3)),
      orderBy('playCount', 'desc'),
      firestoreLimit(20)
    );

    const episodesSnapshot = await getDocs(episodesQuery);
    return episodesSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(episode => !listenedEpisodeIds.has(episode.id))
      .slice(0, 12);
  } catch (error) {
    console.error('Error fetching episodes you might like:', error);
    return [];
  }
};

/**
 * Fetch recently played podcast episodes
 */
const fetchRecentlyPlayedEpisodes = async (userId) => {
  try {
    const historyQuery = query(
      collection(db, 'listening_history'),
      where('userId', '==', userId),
      where('contentType', '==', 'podcast'),
      orderBy('timestamp', 'desc'),
      firestoreLimit(15)
    );

    const snapshot = await getDocs(historyQuery);
    const episodeIds = [...new Set(snapshot.docs.map(doc => doc.data().episodeId))].slice(0, 12);

    if (episodeIds.length === 0) return [];

    const episodesQuery = query(
      collection(db, 'podcast_episodes'),
      where('__name__', 'in', episodeIds)
    );

    const episodesSnapshot = await getDocs(episodesQuery);
    const episodesMap = {};
    episodesSnapshot.forEach(doc => {
      episodesMap[doc.id] = { id: doc.id, ...doc.data() };
    });

    // Return in order of recently played
    return episodeIds.map(id => episodesMap[id]).filter(Boolean);
  } catch (error) {
    console.error('Error fetching recently played episodes:', error);
    return [];
  }
};

/**
 * Fetch user's favorite podcasts
 */
const fetchYourFavoritePodcasts = async (user) => {
  try {
    // Assume user has a favoriteShows array
    if (!user.favoriteShows || user.favoriteShows.length === 0) return [];

    const episodesQuery = query(
      collection(db, 'podcast_episodes'),
      where('showId', 'in', user.favoriteShows.slice(0, 10)),
      orderBy('publishDate', 'desc'),
      firestoreLimit(12)
    );

    const snapshot = await getDocs(episodesQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching favorite podcasts:', error);
    return [];
  }
};

/**
 * Fetch new episodes from shows user follows
 */
const fetchNewEpisodesFromFollowedShows = async (user) => {
  try {
    if (!user.favoriteShows || user.favoriteShows.length === 0) return [];

    // Get episodes from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const episodesQuery = query(
      collection(db, 'podcast_episodes'),
      where('showId', 'in', user.favoriteShows.slice(0, 10)),
      where('publishDate', '>', sevenDaysAgo),
      orderBy('publishDate', 'desc'),
      firestoreLimit(12)
    );

    const snapshot = await getDocs(episodesQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching new episodes:', error);
    return [];
  }
};

/**
 * Fetch trending podcast episodes
 */
const fetchTrendingPodcasts = async () => {
  try {
    const episodesQuery = query(
      collection(db, 'podcast_episodes'),
      orderBy('playCount', 'desc'),
      firestoreLimit(12)
    );

    const snapshot = await getDocs(episodesQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching trending podcasts:', error);
    return [];
  }
};

/**
 * Fetch recommended podcast episodes
 */
const fetchRecommendedPodcasts = async (user) => {
  try {
    // Get user's listening history to understand preferences
    const historyQuery = query(
      collection(db, 'listening_history'),
      where('userId', '==', user.uid),
      where('contentType', '==', 'podcast'),
      firestoreLimit(20)
    );

    const historySnapshot = await getDocs(historyQuery);
    const listenedEpisodeIds = new Set();

    historySnapshot.forEach(doc => {
      listenedEpisodeIds.add(doc.data().episodeId);
    });

    // Get popular episodes they haven't listened to
    const episodesQuery = query(
      collection(db, 'podcast_episodes'),
      orderBy('playCount', 'desc'),
      firestoreLimit(30)
    );

    const episodesSnapshot = await getDocs(episodesQuery);
    return episodesSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(episode => !listenedEpisodeIds.has(episode.id))
      .slice(0, 12);
  } catch (error) {
    console.error('Error fetching recommended podcasts:', error);
    return [];
  }
};
