import React, { useCallback, useState } from 'react';
import { Box, Typography, Card, CardContent, CardMedia, IconButton, CircularProgress, Menu, MenuItem } from '@mui/material';
import { PlayArrow, Favorite, FavoriteBorder, ThumbUp, ThumbUpOffAlt, PlaylistAdd } from '@mui/icons-material';
import { usePersonalizedSections } from '../hooks/usePersonalizedSections';
import { useAuth } from '../context/AuthContext';
import { useLikes } from '../context/LikesContext';
import { useFavorites } from '../context/FavoritesContext';
import { usePlaySong } from '../hooks/usePlaySong';
import { usePlaylistManager } from '../hooks/usePlaylistManager';
import PlayingIndicator from './PlayingIndicator';
import SongPlayCount from './SongPlayCount';
import SongLikeCount from './SongLikeCount';

// Memoized song card to prevent unnecessary re-renders
const SongCard = React.memo(({ song, isPlaying, onPlay, onToggleLike, onToggleFavorite }) => {
  const { isLiked } = useLikes();
  const { isFavorited } = useFavorites();
  const { playlists, addSong } = usePlaylistManager();
  const liked = isLiked(song.id);
  const favorited = isFavorited(song.id);
  const [anchorEl, setAnchorEl] = useState(null);

  const handlePlayClick = useCallback(() => {
    onPlay(song);
  }, [onPlay, song]);

  const handleLikeClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleLike(song.id, liked);
  }, [onToggleLike, song.id, liked]);

  const handleFavoriteClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(song.id, favorited);
  }, [onToggleFavorite, song.id, favorited]);

  const handlePlaylistMenuOpen = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  }, []);

  const handlePlaylistMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleAddToPlaylist = useCallback(async (playlistId) => {
    try {
      await addSong(playlistId, song);
      console.log(`✅ Added "${song.title}" to playlist`);
      handlePlaylistMenuClose();
    } catch (error) {
      if (error.message === 'Song already in playlist') {
        console.log(`ℹ️ "${song.title}" is already in this playlist`);
      } else {
        console.error('❌ Failed to add song to playlist:', error);
      }
      handlePlaylistMenuClose();
    }
  }, [addSong, song, handlePlaylistMenuClose]);

  return (
    <Card
      sx={{
        minWidth: 180,
        maxWidth: 180,
        bgcolor: 'background.paper',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        },
        position: 'relative'
      }}
    >
      {/* Album Art */}
      <Box sx={{ position: 'relative', paddingTop: '100%' }}>
        <CardMedia
          component="img"
          image={song.cover || '/images/default-cover.jpg'}
          alt={song.title}
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
          {isPlaying ? (
            <PlayingIndicator isPlaying={isPlaying} size="large" />
          ) : (
            <IconButton
              type="button"
              size="large"
              onClick={handlePlayClick}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.light', transform: 'scale(1.1)' }
              }}
            >
              <PlayArrow />
            </IconButton>
          )}
        </Box>
      </Box>

      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* Song Title */}
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '0.875rem' }}
          noWrap
          title={song.title}
        >
          {song.title}
        </Typography>

        {/* Artist */}
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          title={song.artist}
          sx={{ display: 'block', mb: 1 }}
        >
          {song.artist}
        </Typography>

        {/* Stats */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <SongPlayCount songId={song.id} />
          <SongLikeCount songId={song.id} />
        </Box>

        {/* Like, Favorite, and Add to Playlist Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 0.5 }}>
          <IconButton
            type="button"
            size="small"
            onClick={handleLikeClick}
            sx={{
              color: liked ? '#1DB954' : 'grey.400',
              '&:hover': { color: liked ? '#1ed760' : '#1DB954' }
            }}
            title={liked ? 'Unlike' : 'Like'}
          >
            {liked ? <ThumbUp fontSize="small" /> : <ThumbUpOffAlt fontSize="small" />}
          </IconButton>
          <IconButton
            type="button"
            size="small"
            onClick={handleFavoriteClick}
            sx={{
              color: favorited ? '#e91e63' : 'grey.400',
              '&:hover': { color: favorited ? '#f06292' : '#e91e63' }
            }}
            title={favorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            {favorited ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
          </IconButton>
          <IconButton
            type="button"
            size="small"
            onClick={handlePlaylistMenuOpen}
            sx={{
              color: 'grey.400',
              '&:hover': { color: '#1DB954' }
            }}
            title="Add to playlist"
          >
            <PlaylistAdd fontSize="small" />
          </IconButton>
        </Box>

        {/* Playlist Selection Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handlePlaylistMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          {playlists.length === 0 ? (
            <MenuItem disabled>No playlists available</MenuItem>
          ) : (
            playlists.map((playlist) => (
              <MenuItem
                key={playlist.id}
                onClick={() => handleAddToPlaylist(playlist.id)}
              >
                {playlist.name}
              </MenuItem>
            ))
          )}
        </Menu>
      </CardContent>
    </Card>
  );
});

/**
 * Component to display all personalized sections
 */
export default function PersonalizedSections() {
  const { user } = useAuth();
  const { addLike, removeLike } = useLikes();
  const { addFavorite, removeFavorite } = useFavorites();
  const { sections, loading, error } = usePersonalizedSections(user);
  const { playSong, isSongPlaying } = usePlaySong();

  // Create stable handlers that don't recreate on every render
  const handleToggleLike = useCallback((songId, isLiked) => {
    if (!songId) return;
    if (isLiked) {
      removeLike(songId);
    } else {
      addLike(songId);
    }
  }, [addLike, removeLike]);

  const handleToggleFavorite = useCallback((songId, isFavorited) => {
    if (!songId) return;
    if (isFavorited) {
      removeFavorite(songId);
    } else {
      addFavorite(songId);
    }
  }, [addFavorite, removeFavorite]);

  const handlePlay = useCallback((song) => {
    playSong(song);
  }, [playSong]);

  if (!user) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Sign in to see personalized recommendations
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
        <Typography color="error">Error loading personalized content: {error}</Typography>
      </Box>
    );
  }

  if (sections.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Start exploring music to get personalized recommendations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Like songs and follow artists to help us curate content for you
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
            {section.songs.reduce((uniqueSongs, song) => {
              // Only add if we haven't seen this cover art before
              if (!uniqueSongs.some(s => (s.cover || s.coverUrl) === (song.cover || song.coverUrl))) {
                uniqueSongs.push(song);
              }
              return uniqueSongs;
            }, []).map((song) => {
              const isPlaying = isSongPlaying(song);

              return (
                <SongCard
                  key={song.id}
                  song={song}
                  isPlaying={isPlaying}
                  onPlay={handlePlay}
                  onToggleLike={handleToggleLike}
                  onToggleFavorite={handleToggleFavorite}
                />
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
