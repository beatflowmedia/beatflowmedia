import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  Skeleton,
  Button
} from '@mui/material';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Pause from '@mui/icons-material/Pause';
import ArrowForward from '@mui/icons-material/ArrowForward';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

/**
 * DiscoverWeeklyPreview - Home page preview of algorithmic recommendations
 * Shows top 6-8 tracks from "For You" recommendations
 * Links to full /discover-weekly page
 */
function DiscoverWeeklyPreview() {
  const { state, dispatch, actions } = usePlayer();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        setLoading(true);

        // Get recent quality songs (simplified for preview)
        const previewQuery = query(
          collection(db, 'songs'),
          orderBy('createdAt', 'desc'),
          limit(8)
        );

        const snapshot = await getDocs(previewQuery);
        const songs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setRecommendations(songs);
        setLoading(false);
      } catch (err) {
        console.error('Error loading Discover Weekly preview:', err);
        setLoading(false);
      }
    };

    loadPreview();
  }, [user]);

  const handlePlayTrack = (track) => {
    dispatch({
      type: actions.SET_QUEUE,
      payload: {
        queue: recommendations,
        currentIndex: recommendations.findIndex(t => t.id === track.id)
      }
    });

    if (!state.isPlaying) {
      dispatch({ type: actions.TOGGLE_PLAY });
    }
  };

  if (loading) {
    return (
      <Box sx={{ mb: 'clamp(1.5rem, calc(1rem + 2vw), 4rem)' }}>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (!recommendations.length) return null;

  return (
    <Box sx={{ mb: 'clamp(1.5rem, calc(1rem + 2vw), 4rem)' }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 'clamp(1rem, calc(0.5rem + 1vw), 2rem)'
      }}>
        <Box>
          <Typography
            sx={{
              color: 'text.primary',
              fontSize: 'clamp(1.125rem, calc(0.875rem + 1vw), 1.75rem)',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #1DB954, #1ed760)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Discover Weekly
          </Typography>
          <Typography sx={{
            color: 'text.secondary',
            fontSize: 'clamp(0.75rem, calc(0.7rem + 0.3vw), 0.875rem)',
            mt: 0.5
          }}>
            Personalized recommendations just for you
          </Typography>
        </Box>

        <Button
          onClick={() => navigate('/discover-weekly')}
          endIcon={<ArrowForward />}
          sx={{
            color: '#1DB954',
            fontSize: 'clamp(0.75rem, calc(0.7rem + 0.3vw), 0.875rem)',
            '&:hover': { color: '#1ed760' }
          }}
        >
          See All
        </Button>
      </Box>

      {/* Track Grid */}
      <Grid container spacing={'clamp(0.5rem, calc(0.25rem + 1vw), 2rem)'}>
        {recommendations.slice(0, 6).map((track) => {
          const isCurrentTrack = state.queue[state.currentIndex]?.id === track.id;
          const isPlaying = isCurrentTrack && state.isPlaying;

          return (
            <Grid item xs={6} sm={4} md={3} lg={2} key={track.id}>
              <Card
                sx={{
                  bgcolor: '#1a1a1a',
                  '&:hover': { bgcolor: '#2a2a2a' },
                  cursor: 'pointer',
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
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
                <CardContent sx={{ p: 'clamp(0.75rem, 2vw, 1rem)' }}>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: 'clamp(0.75rem, calc(0.7rem + 0.3vw), 0.875rem)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {track.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'grey.400',
                      fontSize: 'clamp(0.625rem, calc(0.6rem + 0.2vw), 0.75rem)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {track.artistName || track.artist}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

export default DiscoverWeeklyPreview;
