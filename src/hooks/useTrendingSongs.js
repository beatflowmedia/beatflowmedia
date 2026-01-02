import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Hook to get trending songs based on play counts
 * @param {number} limitCount - Number of songs to return (default 10)
 * @param {number} daysBack - Number of days to look back for trending (default 7)
 * @returns {Object} - { songs, loading, error }
 */
export const useTrendingSongs = (limitCount = 10, daysBack = 7) => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrendingSongs = async () => {
      try {
        setLoading(true);

        // Calculate date threshold for trending period
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - daysBack);

        // Get song plays ordered by play count
        const songPlaysQuery = query(
          collection(db, 'songPlays'),
          orderBy('playCount', 'desc'),
          limit(limitCount * 2) // Get more to filter by date
        );

        const songPlaysSnapshot = await getDocs(songPlaysQuery);
        const songPlaysData = [];

        songPlaysSnapshot.forEach((doc) => {
          const data = doc.data();
          // Only include songs with recent plays
          if (data.lastPlayed && data.lastPlayed.toDate() >= dateThreshold) {
            songPlaysData.push({
              songId: doc.id,
              playCount: data.playCount || 0,
              lastPlayed: data.lastPlayed
            });
          }
        });

        // Limit to requested count after filtering
        const topSongIds = songPlaysData.slice(0, limitCount).map(sp => sp.songId);

        if (topSongIds.length === 0) {
          setSongs([]);
          setLoading(false);
          return;
        }

        // Fetch actual song data
        const songsQuery = query(
          collection(db, 'songs'),
          where('__name__', 'in', topSongIds)
        );

        const songsSnapshot = await getDocs(songsQuery);
        const songsMap = {};

        songsSnapshot.forEach((doc) => {
          songsMap[doc.id] = { id: doc.id, ...doc.data() };
        });

        // Combine song data with play counts in original order
        const trendingSongs = songPlaysData
          .map(sp => ({
            ...songsMap[sp.songId],
            playCount: sp.playCount,
            lastPlayed: sp.lastPlayed
          }))
          .filter(song => song.title && song.isVisible !== false); // Filter out missing and hidden songs

        setSongs(trendingSongs);
        setError(null);
      } catch (err) {
        console.error('Error fetching trending songs:', err);
        setError(err.message);
        setSongs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingSongs();
  }, [limitCount, daysBack]);

  return { songs, loading, error };
};

/**
 * Hook to get all-time most played songs
 * @param {number} limitCount - Number of songs to return (default 10)
 * @returns {Object} - { songs, loading, error }
 */
export const useAllTimeMostPlayed = (limitCount = 10) => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMostPlayed = async () => {
      try {
        setLoading(true);

        // Get song plays ordered by play count (all time)
        const songPlaysQuery = query(
          collection(db, 'songPlays'),
          orderBy('playCount', 'desc'),
          limit(limitCount)
        );

        const songPlaysSnapshot = await getDocs(songPlaysQuery);
        const songPlaysData = [];

        songPlaysSnapshot.forEach((doc) => {
          const data = doc.data();
          songPlaysData.push({
            songId: doc.id,
            playCount: data.playCount || 0,
            lastPlayed: data.lastPlayed
          });
        });

        const topSongIds = songPlaysData.map(sp => sp.songId);

        if (topSongIds.length === 0) {
          setSongs([]);
          setLoading(false);
          return;
        }

        // Fetch actual song data
        const songsQuery = query(
          collection(db, 'songs'),
          where('__name__', 'in', topSongIds)
        );

        const songsSnapshot = await getDocs(songsQuery);
        const songsMap = {};

        songsSnapshot.forEach((doc) => {
          songsMap[doc.id] = { id: doc.id, ...doc.data() };
        });

        // Combine song data with play counts in original order
        const mostPlayedSongs = songPlaysData
          .map(sp => ({
            ...songsMap[sp.songId],
            playCount: sp.playCount,
            lastPlayed: sp.lastPlayed
          }))
          .filter(song => song.title && song.isVisible !== false);

        setSongs(mostPlayedSongs);
        setError(null);
      } catch (err) {
        console.error('Error fetching most played songs:', err);
        setError(err.message);
        setSongs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMostPlayed();
  }, [limitCount]);

  return { songs, loading, error };
};

/**
 * Get recommended songs based on a user's listening history
 * @param {string} userId - The user ID
 * @param {number} limitCount - Number of recommendations (default 10)
 * @returns {Object} - { songs, loading, error }
 */
export const useRecommendedSongs = (userId, limitCount = 10) => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setSongs([]);
      setLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        setLoading(true);

        // Get user's listening history
        const historyQuery = query(
          collection(db, 'listening_history'),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc'),
          limit(50)
        );

        const historySnapshot = await getDocs(historyQuery);
        const listenedSongIds = new Set();
        const genres = new Set();
        const artists = new Set();

        historySnapshot.forEach((doc) => {
          const data = doc.data();
          listenedSongIds.add(data.songId);
          if (data.genre) genres.add(data.genre);
          if (data.artistId) artists.add(data.artistId);
        });

        // Get trending songs to recommend
        const trendingQuery = query(
          collection(db, 'songPlays'),
          orderBy('playCount', 'desc'),
          limit(100)
        );

        const trendingSnapshot = await getDocs(trendingQuery);
        const candidateSongIds = [];

        trendingSnapshot.forEach((doc) => {
          // Exclude songs user has already listened to
          if (!listenedSongIds.has(doc.id)) {
            candidateSongIds.push(doc.id);
          }
        });

        if (candidateSongIds.length === 0) {
          setSongs([]);
          setLoading(false);
          return;
        }

        // Fetch song data for candidates
        const recommendedIds = candidateSongIds.slice(0, limitCount);
        const songsQuery = query(
          collection(db, 'songs'),
          where('__name__', 'in', recommendedIds)
        );

        const songsSnapshot = await getDocs(songsQuery);
        const recommendedSongs = [];

        songsSnapshot.forEach((doc) => {
          const songData = { id: doc.id, ...doc.data() };

          // Skip hidden songs
          if (songData.isVisible === false) return;

          // Prioritize songs with matching genres/artists
          let relevanceScore = 0;
          if (genres.has(songData.genre)) relevanceScore += 2;
          if (artists.has(songData.artistId)) relevanceScore += 3;

          recommendedSongs.push({ ...songData, relevanceScore });
        });

        // Sort by relevance, then by recommendation order
        recommendedSongs.sort((a, b) => {
          if (b.relevanceScore !== a.relevanceScore) {
            return b.relevanceScore - a.relevanceScore;
          }
          return 0;
        });

        setSongs(recommendedSongs.slice(0, limitCount));
        setError(null);
      } catch (err) {
        console.error('Error fetching recommended songs:', err);
        setError(err.message);
        setSongs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userId, limitCount]);

  return { songs, loading, error };
};
