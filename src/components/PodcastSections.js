import React from 'react';
import { Box, Typography, Card, CardContent, CardMedia, IconButton, CircularProgress, Chip } from '@mui/material';
import { PlayArrow, Favorite, FavoriteBorder, Bookmark, BookmarkBorder } from '@mui/icons-material';
import { usePodcastSections } from '../hooks/usePodcastSections';
import { useAuth } from '../context/AuthContext';

/**
 * Component to display podcast sections
 */
export default function PodcastSections() {
  const { user } = useAuth();
  const { sections, loading, error } = usePodcastSections(user);

  if (!user) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Sign in to see personalized podcast recommendations
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Error loading podcast content: {error}</Typography>
      </Box>
    );
  }

  if (sections.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Start listening to podcasts to get personalized recommendations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Save shows and episodes to build your podcast library
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {sections.map((section) => (
        <Box key={section.id} sx={{ mb: 6 }}>
          {/* Section Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="h3" sx={{ mr: 1.5, fontSize: 32 }}>
              {section.icon}
            </Typography>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                {section.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {section.description}
              </Typography>
            </Box>
          </Box>

          {/* Horizontal Scrollable Grid */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              pb: 2,
              '&::-webkit-scrollbar': {
                height: 8
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'background.paper',
                borderRadius: 1
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'grey.600',
                borderRadius: 1,
                '&:hover': {
                  bgcolor: 'grey.500'
                }
              }
            }}
          >
            {section.episodes.map((episode) => (
              <Card
                key={episode.id}
                sx={{
                  minWidth: 280,
                  maxWidth: 280,
                  bgcolor: 'background.paper',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                {/* Episode Art */}
                <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                  <CardMedia
                    component="img"
                    image={episode.cover || episode.showCover || '/images/default-podcast-cover.jpg'}
                    alt={episode.title}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />

                  {/* Play Button Overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'rgba(0,0,0,0.4)',
                      opacity: 0,
                      transition: 'opacity 0.3s',
                      '&:hover': { opacity: 1 }
                    }}
                  >
                    <IconButton
                      size="large"
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.light', transform: 'scale(1.1)' }
                      }}
                    >
                      <PlayArrow />
                    </IconButton>
                  </Box>

                  {/* Duration Badge */}
                  {episode.duration && (
                    <Chip
                      label={formatDuration(episode.duration)}
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 20
                      }}
                    />
                  )}
                </Box>

                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  {/* Show Name */}
                  {episode.showName && (
                    <Typography
                      variant="caption"
                      color="primary"
                      sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}
                      noWrap
                    >
                      {episode.showName}
                    </Typography>
                  )}

                  {/* Episode Title */}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 'bold',
                      mb: 0.5,
                      fontSize: '0.875rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                    title={episode.title}
                  >
                    {episode.title}
                  </Typography>

                  {/* Description */}
                  {episode.description && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mb: 1
                      }}
                    >
                      {episode.description}
                    </Typography>
                  )}

                  {/* Category Tag */}
                  {episode.category && (
                    <Chip
                      label={episode.category}
                      size="small"
                      sx={{ mb: 1, height: 20, fontSize: '0.65rem' }}
                    />
                  )}

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      sx={{
                        color: 'grey.400',
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      <BookmarkBorder fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 */
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};
