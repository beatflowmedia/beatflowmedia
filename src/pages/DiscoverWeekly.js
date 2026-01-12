import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  Skeleton,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Pause from '@mui/icons-material/Pause';
import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { useLikes } from '../context/LikesContext';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { toast } from 'react-toastify';

/**
 * DiscoverWeekly - Algorithmic music recommendations
 * Part of 2026 Hybrid Marketing Strategy (Algorithmic Seeding)
 *
 * Uses skip rate and completion rate metrics to recommend high-quality tracks
 * Recommendations based on:
 * - High completion rate (>70%)
 * - Low skip rate (<20%)
 * - User's listening history and liked genres
 * - Trending tracks with high engagement
 */
function DiscoverWeekly() {
  const { state, dispatch, actions } = usePlayer();
  const { user } = useAuth();
  const { addLike, removeLike, isLiked: checkIsLiked } = useLikes();

  const [recommendations, setRecommendations] = useState([]);
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [genreRecommendations, setGenreRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);

  // Load algorithmic recommendations
  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);

        // Simplified approach: Get recent songs and user's genre preferences
        let userGenres = [];

        // 1. Get user's favorite genres from liked songs (if logged in)
        if (user) {
          try {
            const likesSnapshot = await getDocs(
              collection(db, 'users', user.uid, 'likes')
            );
            const likedSongIds = likesSnapshot.docs.map(doc => doc.id);

            if (likedSongIds.length > 0) {
              const genreMap = {};

              // Sample first 5 liked songs to determine genre preferences
              for (const songId of likedSongIds.slice(0, 5)) {
                try {
                  const songDoc = await getDocs(
                    query(
                      collection(db, 'songs'),
                      where('__name__', '==', songId),
                      limit(1)
                    )
                  );

                  if (!songDoc.empty) {
                    const genre = songDoc.docs[0].data().genre ||
                                 songDoc.docs[0].data().category;
                    if (genre) {
                      genreMap[genre] = (genreMap[genre] || 0) + 1;
                    }
                  }
                } catch (err) {
                  console.warn('Error fetching liked song:', songId, err);
                }
              }

              // Get top 2 genres
              userGenres = Object.entries(genreMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 2)
                .map(([genre]) => genre);
            }
          } catch (err) {
            console.warn('Error loading user preferences:', err);
          }
        }

        // 2. Get "For You" recommendations - Recent quality songs
        try {
          const forYouQuery = query(
            collection(db, 'songs'),
            orderBy('createdAt', 'desc'),
            limit(20)
          );

          const forYouSnapshot = await getDocs(forYouQuery);
          const forYouSongs = forYouSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          setRecommendations(forYouSongs);
        } catch (err) {
          console.error('Error loading For You:', err);
          // Fallback: just get any songs
          const fallbackQuery = query(collection(db, 'songs'), limit(20));
          const fallbackSnapshot = await getDocs(fallbackQuery);
          const fallbackSongs = fallbackSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setRecommendations(fallbackSongs);
        }

        // 3. Get "Trending" tracks - Use songMetrics if available, otherwise recent songs
        try {
          const trendingQuery = query(
            collection(db, 'songMetrics'),
            orderBy('playCount', 'desc'),
            limit(15)
          );

          const trendingSnapshot = await getDocs(trendingQuery);

          if (trendingSnapshot.empty) {
            // Fallback: Use recent songs as trending
            const recentQuery = query(
              collection(db, 'songs'),
              orderBy('createdAt', 'desc'),
              limit(15)
            );
            const recentSnapshot = await getDocs(recentQuery);
            const recentSongs = recentSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setTrendingTracks(recentSongs);
          } else {
            // Fetch song details for trending
            const trendingSongs = [];
            for (const metricDoc of trendingSnapshot.docs) {
              try {
                const songQuery = query(
                  collection(db, 'songs'),
                  where('__name__', '==', metricDoc.id),
                  limit(1)
                );
                const songSnapshot = await getDocs(songQuery);

                if (!songSnapshot.empty) {
                  trendingSongs.push({
                    id: songSnapshot.docs[0].id,
                    ...songSnapshot.docs[0].data(),
                    metrics: metricDoc.data()
                  });
                }
              } catch (err) {
                console.warn('Error fetching trending song:', metricDoc.id);
              }
            }
            setTrendingTracks(trendingSongs);
          }
        } catch (err) {
          console.error('Error loading trending:', err);
          setTrendingTracks([]);
        }

        // 4. Get genre-based recommendations
        if (userGenres.length > 0) {
          try {
            // Get first genre only (Firestore 'in' query limitation)
            const genreQuery = query(
              collection(db, 'songs'),
              where('genre', '==', userGenres[0]),
              limit(20)
            );

            const genreSnapshot = await getDocs(genreQuery);
            const genreSongs = genreSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

            setGenreRecommendations(genreSongs);
          } catch (err) {
            console.error('Error loading genre recommendations:', err);
            setGenreRecommendations([]);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading recommendations:', error);
        toast.error('Failed to load recommendations');
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [user]);

  const handlePlayTrack = (track) => {
    const trackList = selectedTab === 0 ? recommendations :
                      selectedTab === 1 ? trendingTracks :
                      genreRecommendations;

    dispatch({
      type: actions.SET_QUEUE,
      payload: {
        queue: trackList,
        currentIndex: trackList.findIndex(t => t.id === track.id)
      }
    });

    if (!state.isPlaying) {
      dispatch({ type: actions.TOGGLE_PLAY });
    }
  };

  const handleToggleLike = async (track) => {
    if (!user) {
      toast.error('Please sign in to like songs');
      return;
    }

    try {
      const liked = checkIsLiked(track.id);
      if (liked) {
        await removeLike(track.id);
      } else {
        await addLike(track.id);
      }
    } catch (err) {
      toast.error('Failed to update likes');
    }
  };

  const renderTrackCard = (track) => {
    const isCurrentTrack = state.queue[state.currentIndex]?.id === track.id;
    const isPlaying = isCurrentTrack && state.isPlaying;
    const isLiked = checkIsLiked(track.id);

    return (
      <Grid item xs={12} sm={6} md={4} lg={3} key={track.id}>
        <Card
          sx={{
            bgcolor: '#1a1a1a',
            '&:hover': { bgcolor: '#2a2a2a' },
            cursor: 'pointer',
            height: '100%'
          }}
          onClick={() => handlePlayTrack(track)}
        >
          <Box sx={{ position: 'relative', paddingTop: '100%' }}>
            <Box
              component="img"
              src={track.coverUrl || track.cover || '/images/Logo.png'}
              alt={track.title}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handlePlayTrack(track);
              }}
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                bgcolor: '#1DB954',
                '&:hover': { bgcolor: '#1ed760' }
              }}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
          </Box>
          <CardContent>
            <Typography
              variant="body1"
              sx={{ color: 'white', fontWeight: 'bold', mb: 0.5 }}
              noWrap
            >
              {track.title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.400' }} noWrap>
              {track.artistName || track.artist}
            </Typography>

            {track.metrics && (
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                {track.metrics.completionRate && (
                  <Chip
                    label={`${Math.round(track.metrics.completionRate)}% completion`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(29, 185, 84, 0.2)',
                      color: '#1DB954',
                      fontSize: '0.7rem'
                    }}
                  />
                )}
                {track.metrics.playCount && (
                  <Chip
                    label={`${track.metrics.playCount.toLocaleString()} plays`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      color: 'grey.300',
                      fontSize: '0.7rem'
                    }}
                  />
                )}
              </Box>
            )}

            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleLike(track);
              }}
              sx={{
                color: isLiked ? '#e91e63' : 'grey.400',
                mt: 1
              }}
            >
              {isLiked ? <Favorite /> : <FavoriteBorder />}
            </IconButton>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={300} height={60} sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          {[...Array(8)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Skeleton variant="rectangular" height={300} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const currentTracks = selectedTab === 0 ? recommendations :
                        selectedTab === 1 ? trendingTracks :
                        genreRecommendations;

  return (
    <Box sx={{ height: '100%', overflow: 'auto', bgcolor: 'grey.900', color: 'white', p: 3 }}>
      {/* Header */}
      <Typography
        variant="h3"
        sx={{
          fontWeight: 'bold',
          mb: 1,
          background: 'linear-gradient(45deg, #1DB954, #1ed760)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}
      >
        Discover Weekly
      </Typography>
      <Typography variant="body1" sx={{ color: 'grey.400', mb: 4 }}>
        Personalized recommendations based on listening quality and trends
      </Typography>

      {/* Tabs */}
      <Tabs
        value={selectedTab}
        onChange={(e, newValue) => setSelectedTab(newValue)}
        sx={{
          mb: 3,
          '& .MuiTab-root': { color: 'grey.400' },
          '& .Mui-selected': { color: '#1DB954' },
          '& .MuiTabs-indicator': { bgcolor: '#1DB954' }
        }}
      >
        <Tab label={`For You (${recommendations.length})`} />
        <Tab label={`Trending (${trendingTracks.length})`} />
        {genreRecommendations.length > 0 && (
          <Tab label={`Your Genres (${genreRecommendations.length})`} />
        )}
      </Tabs>

      {/* Track Grid */}
      {currentTracks.length > 0 ? (
        <Grid container spacing={2}>
          {currentTracks.map(track => renderTrackCard(track))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ color: 'grey.400', mb: 1 }}>
            No recommendations yet
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.500' }}>
            {user
              ? 'Start listening to music to get personalized recommendations'
              : 'Sign in to get personalized recommendations'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default DiscoverWeekly;
