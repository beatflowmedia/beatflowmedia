import React from 'react';
import { Box, Typography } from '@mui/material';
import Favorite from '@mui/icons-material/Favorite';
import { useSongLikes } from '../hooks/useSongLikes';

/**
 * Displays real-time like count for a song
 */
export default function SongLikeCount({ songId }) {
  const likeCount = useSongLikes(songId);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Favorite sx={{ fontSize: 14, color: 'grey.500' }} />
      <Typography variant="caption" sx={{ color: 'grey.500' }}>
        {likeCount.toLocaleString()}
      </Typography>
    </Box>
  );
}
