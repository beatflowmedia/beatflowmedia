import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Slider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import VideoLibrary from '@mui/icons-material/VideoLibrary';
import Download from '@mui/icons-material/Download';
import Share from '@mui/icons-material/Share';

/**
 * VideoClipGenerator - Generate short video clips for TikTok/Reels
 * Part of 2026 Hybrid Marketing Strategy (Content-led Discovery)
 *
 * Features:
 * - Select hook section (0-60s)
 * - Add waveform visualization
 * - Add album art overlay
 * - Export as vertical video (9:16 ratio for TikTok/Reels)
 * - Generate with song metadata (title, artist)
 *
 * Note: This is a UI component. Actual video generation would require:
 * - Server-side video processing (FFmpeg)
 * - Cloud storage for generated clips
 * - This component shows the interface and parameters
 */
function VideoClipGenerator({ open, onClose, song }) {
  const [clipStart, setClipStart] = useState(0);
  const [clipDuration, setClipDuration] = useState(15); // Default 15s for TikTok/Reels
  const [visualizationType, setVisualizationType] = useState('waveform');
  const [overlayText, setOverlayText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedClipUrl, setGeneratedClipUrl] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);

    try {
      // In production, this would call a Cloud Function to:
      // 1. Extract audio segment (clipStart to clipStart + clipDuration)
      // 2. Generate visualization (waveform/spectrum)
      // 3. Overlay album art and text
      // 4. Render as 9:16 vertical video
      // 5. Upload to Cloud Storage
      // 6. Return download URL

      // Simulated delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mock generated URL
      const mockUrl = `https://storage.example.com/clips/${song.id}_${Date.now()}.mp4`;
      setGeneratedClipUrl(mockUrl);

      console.log('📹 Video clip generated:', {
        songId: song.id,
        title: song.title,
        artist: song.artistName || song.artist,
        clipStart,
        clipDuration,
        visualizationType,
        overlayText,
        outputUrl: mockUrl
      });
    } catch (error) {
      console.error('Error generating video clip:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedClipUrl) {
      // In production, trigger download
      window.open(generatedClipUrl, '_blank');
    }
  };

  const handleShareToSocial = (platform) => {
    if (!generatedClipUrl) return;

    // In production, integrate with platform SDKs
    const shareUrls = {
      tiktok: `https://www.tiktok.com/upload?video_url=${encodeURIComponent(generatedClipUrl)}`,
      instagram: `instagram://library?AssetPath=${encodeURIComponent(generatedClipUrl)}`,
      youtube: `https://www.youtube.com/upload?video_url=${encodeURIComponent(generatedClipUrl)}`
    };

    console.log(`📱 Sharing to ${platform}:`, shareUrls[platform]);
    // window.open(shareUrls[platform], '_blank');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maxClipStart = (song?.duration || 180) - clipDuration;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { bgcolor: 'grey.800', color: 'white' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VideoLibrary />
          <Typography variant="h6">Generate Video Clip for Social Media</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          Create a short video clip perfect for TikTok, Instagram Reels, or YouTube Shorts
        </Alert>

        {/* Song Info */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, p: 2, bgcolor: 'grey.900', borderRadius: 1 }}>
          <Box
            component="img"
            src={song?.coverUrl || song?.cover || '/images/Logo.png'}
            alt={song?.title}
            sx={{ width: 80, height: 80, borderRadius: 1, objectFit: 'cover' }}
          />
          <Box>
            <Typography variant="h6">{song?.title || 'Untitled'}</Typography>
            <Typography variant="body2" sx={{ color: 'grey.400' }}>
              {song?.artistName || song?.artist || 'Unknown Artist'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'grey.500' }}>
              Duration: {formatTime(song?.duration || 0)}
            </Typography>
          </Box>
        </Box>

        {/* Clip Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom>
            Select Hook Section ({formatTime(clipStart)} - {formatTime(clipStart + clipDuration)})
          </Typography>
          <Slider
            value={clipStart}
            onChange={(e, newValue) => setClipStart(newValue)}
            min={0}
            max={maxClipStart}
            step={1}
            marks={[
              { value: 0, label: '0:00' },
              { value: maxClipStart, label: formatTime(maxClipStart) }
            ]}
            sx={{
              color: '#1DB954',
              '& .MuiSlider-markLabel': { color: 'grey.400' }
            }}
          />
        </Box>

        {/* Clip Duration */}
        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom>Clip Duration</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {[15, 30, 60].map(duration => (
              <Chip
                key={duration}
                label={`${duration}s`}
                onClick={() => setClipDuration(duration)}
                sx={{
                  bgcolor: clipDuration === duration ? '#1DB954' : 'grey.700',
                  color: 'white',
                  '&:hover': {
                    bgcolor: clipDuration === duration ? '#1ed760' : 'grey.600'
                  }
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Visualization Type */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel sx={{ color: 'grey.400' }}>Visualization Style</InputLabel>
          <Select
            value={visualizationType}
            onChange={(e) => setVisualizationType(e.target.value)}
            sx={{
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.600' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.500' }
            }}
          >
            <MenuItem value="waveform">Waveform Animation</MenuItem>
            <MenuItem value="spectrum">Frequency Spectrum</MenuItem>
            <MenuItem value="particles">Particle Effect</MenuItem>
            <MenuItem value="minimal">Minimal (Album Art Only)</MenuItem>
          </Select>
        </FormControl>

        {/* Overlay Text */}
        <TextField
          fullWidth
          label="Overlay Text (Optional)"
          placeholder="e.g., 'New Single Out Now!'"
          value={overlayText}
          onChange={(e) => setOverlayText(e.target.value)}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              color: 'white',
              '& fieldset': { borderColor: 'grey.600' },
              '&:hover fieldset': { borderColor: 'grey.500' },
              '&.Mui-focused fieldset': { borderColor: '#1DB954' }
            },
            '& .MuiInputLabel-root': { color: 'grey.400' }
          }}
        />

        {/* Video Specs */}
        <Box sx={{ p: 2, bgcolor: 'rgba(29, 185, 84, 0.1)', borderRadius: 1, mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#1DB954', fontWeight: 'bold', mb: 1 }}>
            Video Specifications:
          </Typography>
          <Typography variant="caption" sx={{ color: 'grey.300', display: 'block' }}>
            • Aspect Ratio: 9:16 (vertical)
          </Typography>
          <Typography variant="caption" sx={{ color: 'grey.300', display: 'block' }}>
            • Resolution: 1080x1920
          </Typography>
          <Typography variant="caption" sx={{ color: 'grey.300', display: 'block' }}>
            • Format: MP4 (H.264)
          </Typography>
          <Typography variant="caption" sx={{ color: 'grey.300', display: 'block' }}>
            • Optimized for: TikTok, Instagram Reels, YouTube Shorts
          </Typography>
        </Box>

        {/* Generated Clip */}
        {generatedClipUrl && (
          <Box sx={{ p: 2, bgcolor: 'grey.900', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ color: '#1DB954', mb: 2 }}>
              ✅ Video clip generated successfully!
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleDownload}
                sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
              >
                Download
              </Button>
              <Button
                variant="outlined"
                startIcon={<Share />}
                onClick={() => handleShareToSocial('tiktok')}
                sx={{ borderColor: 'grey.600', color: 'white' }}
              >
                Share to TikTok
              </Button>
              <Button
                variant="outlined"
                startIcon={<Share />}
                onClick={() => handleShareToSocial('instagram')}
                sx={{ borderColor: 'grey.600', color: 'white' }}
              >
                Share to Reels
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} sx={{ color: 'grey.400' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={generating}
          sx={{
            bgcolor: '#1DB954',
            '&:hover': { bgcolor: '#1ed760' },
            minWidth: 120
          }}
        >
          {generating ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : (
            'Generate Clip'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default VideoClipGenerator;
