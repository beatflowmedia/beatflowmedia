import React from 'react';
import { Box, Typography, Card, CardContent, IconButton, CircularProgress } from '@mui/material';
import { PlayArrow, Favorite, FavoriteBorder } from '@mui/icons-material';
import { useTrendingSongs } from '../hooks/useTrendingSongs';
import { usePlaySong } from '../hooks/usePlaySong';
import { useAuth } from '../context/AuthContext';
import { useLikes } from '../context/LikesContext';
import PlayingIndicator from './PlayingIndicator';
import SongPlayCount from './SongPlayCount';
import SongLikeCount from './SongLikeCount';

/**
 * Component to display trending songs
 */
export default function TrendingSongs({ limit = 10, daysBack = 7 }) {
  const { songs, loading, error } = useTrendingSongs(limit, daysBack);
  const { playSong, isSongPlaying } = usePlaySong();
  const { user } = useAuth();
  const { addLike, removeLike, isLiked: checkIsLiked } = useLikes();

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
        <Typography color="error">Error loading trending songs: {error}</Typography>
      </Box>
    );
  }

  if (songs.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">No trending songs yet</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography sx={{
        fontSize: 'clamp(1.125rem, calc(0.875rem + 1vw), 1.75rem)',
        mb: 'clamp(1rem, calc(0.5rem + 1vw), 2rem)',
        fontWeight: 'bold'
      }}>
        🔥 Trending Now
      </Typography>

      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(0.75rem, calc(0.5rem + 0.5vw), 2rem)'
      }}>
        {songs.map((song, index) => {
          const isPlaying = isSongPlaying(song);
          const isLiked = checkIsLiked(song.id);

          return (
            <Card key={song.id} sx={{ bgcolor: 'background.paper' }}>
              <CardContent sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(0.75rem, calc(0.5rem + 0.5vw), 2rem)',
                p: 'clamp(0.75rem, calc(0.5rem + 1vw), 2rem)'
              }}>
                {/* Rank */}
                <Typography
                  sx={{
                    minWidth: 'clamp(24px, calc(1.25rem + 0.5vw), 40px)',
                    fontSize: 'clamp(1rem, calc(0.875rem + 0.5vw), 1.5rem)',
                    fontWeight: 'bold',
                    color: index < 3 ? 'primary.main' : 'text.secondary'
                  }}
                >
                  {index + 1}
                </Typography>

                {/* Album Art */}
                <Box
                  sx={{
                    position: 'relative',
                    width: 'clamp(48px, calc(2.5rem + 2vw), 72px)',
                    height: 'clamp(48px, calc(2.5rem + 2vw), 72px)',
                    borderRadius: 1,
                    overflow: 'hidden',
                    flexShrink: 0
                  }}
                >
                  <img
                    src={song.cover || '/images/default-cover.jpg'}
                    alt={song.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {isPlaying && (
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(0,0,0,0.6)'
                      }}
                    >
                      <PlayingIndicator isPlaying={isPlaying} size="small" />
                    </Box>
                  )}
                </Box>

                {/* Song Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{
                    fontWeight: 'bold',
                    fontSize: 'clamp(0.875rem, calc(0.75rem + 0.3vw), 1rem)'
                  }} noWrap>
                    {song.title}
                  </Typography>
                  <Typography sx={{
                    color: 'text.secondary',
                    fontSize: 'clamp(0.75rem, calc(0.7rem + 0.2vw), 0.875rem)'
                  }} noWrap>
                    {song.artist}
                  </Typography>

                  {/* Stats */}
                  <Box sx={{
                    display: 'flex',
                    gap: 'clamp(0.5rem, calc(0.25rem + 0.5vw), 1rem)',
                    mt: 'clamp(0.25rem, calc(0.125rem + 0.3vw), 0.5rem)'
                  }}>
                    <SongPlayCount songId={song.id} />
                    <SongLikeCount songId={song.id} />
                  </Box>
                </Box>

                {/* Actions */}
                <Box sx={{
                  display: 'flex',
                  gap: 'clamp(0.25rem, calc(0.125rem + 0.3vw), 0.5rem)'
                }}>
                  <IconButton
                    onClick={async () => {
                      if (!user) return;
                      try {
                        if (isLiked) {
                          await removeLike(song.id);
                        } else {
                          await addLike(song.id);
                        }
                      } catch (error) {
                        console.error('Error toggling like:', error);
                      }
                    }}
                    sx={{
                      minWidth: 'clamp(36px, calc(2rem + 0.5vw), 48px)',
                      minHeight: 'clamp(36px, calc(2rem + 0.5vw), 48px)',
                      color: isLiked ? '#e91e63' : 'grey.400',
                      '&:hover': { color: isLiked ? '#ad1457' : '#e91e63' }
                    }}
                  >
                    {isLiked ? <Favorite sx={{ fontSize: 'clamp(18px, calc(1rem + 0.3vw), 24px)' }} /> : <FavoriteBorder sx={{ fontSize: 'clamp(18px, calc(1rem + 0.3vw), 24px)' }} />}
                  </IconButton>

                  <IconButton
                    onClick={() => playSong(song)}
                    sx={{
                      minWidth: 'clamp(40px, calc(2.25rem + 0.5vw), 48px)',
                      minHeight: 'clamp(40px, calc(2.25rem + 0.5vw), 48px)',
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' }
                    }}
                  >
                    <PlayArrow sx={{ fontSize: 'clamp(20px, calc(1.125rem + 0.3vw), 28px)' }} />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
