/**
 * RecommendedPlaylists - AI-powered personalized playlist recommendations
 *
 * Part of Phase 1: AI Playlist Recommendation System
 * Shows personalized playlist recommendations based on user listening history
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { recommendationService } from '../services/recommendationService';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  CircularProgress,
  Chip,
  Tooltip
} from '@mui/material';
import { FaRobot, FaFire } from 'react-icons/fa';

function RecommendedPlaylists({ limit = 6 }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecommendations();
  }, [user]);

  const loadRecommendations = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🤖 Loading AI playlist recommendations...');
      const recs = await recommendationService.getPlaylistRecommendationsForUser(user.uid, limit);

      setRecommendations(recs);
      console.log(`✅ Loaded ${recs.length} recommendations`);

    } catch (err) {
      console.error('❌ Error loading recommendations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaylistClick = (playlistId) => {
    navigate(`/playlist/${playlistId}`);
  };

  // Don't show section if not logged in
  if (!user) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <FaRobot size={24} color="#1DB954" />
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>
            AI Recommended Playlists
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#1DB954' }} />
        </Box>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <FaRobot size={24} color="#1DB954" />
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>
            AI Recommended Playlists
          </Typography>
        </Box>
        <Card sx={{ bgcolor: '#181818', p: 3 }}>
          <Typography sx={{ color: '#b3b3b3' }}>
            Unable to load recommendations. Please try again later.
          </Typography>
        </Card>
      </Box>
    );
  }

  // No recommendations (new user or no data)
  if (recommendations.length === 0) {
    return (
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <FaRobot size={24} color="#1DB954" />
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>
            AI Recommended Playlists
          </Typography>
        </Box>
        <Card sx={{ bgcolor: '#181818', p: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ color: '#b3b3b3', mb: 1 }}>
            Start exploring music to get personalized recommendations!
          </Typography>
          <Typography variant="body2" sx={{ color: '#808080' }}>
            Listen to songs, like tracks, and follow artists to help our AI learn your taste.
          </Typography>
        </Card>
      </Box>
    );
  }

  // Show recommendations
  return (
    <Box sx={{ py: 4 }}>
      {/* Section Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <FaRobot size={24} color="#1DB954" />
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>
          AI Recommended Playlists
        </Typography>
        <Chip
          label="BETA"
          size="small"
          sx={{
            bgcolor: 'rgba(29, 185, 84, 0.2)',
            color: '#1DB954',
            fontWeight: 'bold',
            fontSize: '0.7rem'
          }}
        />
      </Box>

      <Typography variant="body2" sx={{ color: '#b3b3b3', mb: 3 }}>
        Personalized for you based on your listening history
      </Typography>

      {/* Playlist Grid */}
      <Grid container spacing={2}>
        {recommendations.map((playlist) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={playlist.id}>
            <Card
              onClick={() => handlePlaylistClick(playlist.id)}
              sx={{
                bgcolor: '#181818',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: '#282828',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                }
              }}
            >
              {/* Playlist Cover */}
              <CardMedia
                component="img"
                height="180"
                image={playlist.coverUrl || playlist.imageUrl || '/images/default-playlist.png'}
                alt={playlist.name}
                sx={{ objectFit: 'cover' }}
              />

              <CardContent sx={{ p: 2 }}>
                {/* Playlist Name */}
                <Tooltip title={playlist.name} arrow>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 'bold',
                      color: '#fff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      mb: 0.5
                    }}
                  >
                    {playlist.name}
                  </Typography>
                </Tooltip>

                {/* Creator Name */}
                <Typography
                  variant="caption"
                  sx={{
                    color: '#b3b3b3',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    mb: 1
                  }}
                >
                  By {playlist.creatorName || 'Unknown'}
                </Typography>

                {/* Match Score Badge */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <FaFire size={12} color="#1DB954" />
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#1DB954',
                      fontWeight: 'bold'
                    }}
                  >
                    {Math.round(playlist.matchScore * 100)}% Match
                  </Typography>
                </Box>

                {/* Reason */}
                <Tooltip title={playlist.reason} arrow>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#808080',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontSize: '0.7rem'
                    }}
                  >
                    {playlist.reason}
                  </Typography>
                </Tooltip>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default RecommendedPlaylists;
