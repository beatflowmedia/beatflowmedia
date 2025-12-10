import React from 'react';
import { Box, Typography, Card, CardContent, IconButton, CircularProgress } from '@mui/material';
import { PlayArrow, Favorite, FavoriteBorder } from '@mui/icons-material';
import { useTrendingSongs } from '../hooks/useTrendingSongs';
import { usePlaySong } from '../hooks/usePlaySong';
import { useAuth } from '../context/AuthContext';
import PlayingIndicator from './PlayingIndicator';
import SongPlayCount from './SongPlayCount';
import SongLikeCount from './SongLikeCount';

/**
 * Component to display trending songs
 */
export default function TrendingSongs({ limit = 10, daysBack = 7 }) {
  const { songs, loading, error } = useTrendingSongs(limit, daysBack);
  const { playSong, isSongPlaying } = usePlaySong();
  const { user, addLike, removeLike } = useAuth();

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
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
        🔥 Trending Now
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {songs.map((song, index) => {
          const isPlaying = isSongPlaying(song);
          const isLiked = user?.likes?.includes(song.id);

          return (
            <Card key={song.id} sx={{ bgcolor: 'background.paper' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                {/* Rank */}
                <Typography
                  variant="h6"
                  sx={{
                    minWidth: 30,
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
                    width: 60,
                    height: 60,
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
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }} noWrap>
                    {song.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {song.artist}
                  </Typography>

                  {/* Stats */}
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <SongPlayCount songId={song.id} />
                    <SongLikeCount songId={song.id} />
                  </Box>
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (!user) return;
                      if (isLiked) {
                        removeLike(song.id);
                      } else {
                        addLike(song.id);
                      }
                    }}
                    sx={{
                      color: isLiked ? '#e91e63' : 'grey.400',
                      '&:hover': { color: isLiked ? '#ad1457' : '#e91e63' }
                    }}
                  >
                    {isLiked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                  </IconButton>

                  <IconButton
                    onClick={() => playSong(song)}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' }
                    }}
                  >
                    <PlayArrow />
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
