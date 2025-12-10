import React from 'react';
import { Box, Typography } from '@mui/material';
import MusicNote from '@mui/icons-material/MusicNote';
import { useSongPlays } from '../hooks/useSongPlays';

/**
 * Displays real-time play count for a song
 */
export default function SongPlayCount({ songId }) {
  const playCount = useSongPlays(songId);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <MusicNote sx={{ fontSize: 14, color: 'grey.500' }} />
      <Typography variant="caption" sx={{ color: 'grey.500' }}>
        {playCount.toLocaleString()}
      </Typography>
    </Box>
  );
}
