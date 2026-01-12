import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import VideoClipGenerator from '../VideoClipGenerator';

/**
 * VideoToolsStudio - Admin dashboard tab for video clip generation
 * Part of 2026 Hybrid Marketing Strategy (Content-led Discovery)
 *
 * Provides bulk video clip generation for TikTok/Reels/YouTube Shorts
 */
export default function VideoToolsStudio() {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, color: 'white' }}>
        Video Tools Studio
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: 'grey.400' }}>
        Generate short-form video clips optimized for TikTok, Instagram Reels, and YouTube Shorts
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Select songs from your catalog to generate vertical video clips (9:16) with waveform visualizations,
        album art overlays, and custom text. Perfect for content-led discovery on social platforms.
      </Alert>

      <Alert severity="warning">
        Video generation tools coming soon. Use the ShareButton's "Create TikTok/Reels Clip" option
        on individual songs for now.
      </Alert>
    </Box>
  );
}
