import React from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';

export default function ArtistSimple() {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const { musicData = [], playSong } = useOutletContext() || {};

  // Decode artist name from URL
  const artistName = decodeURIComponent(artistId);

  // Filter songs by artist
  const artistSongs = musicData.filter(song => song.artist === artistName);

  if (!musicData || musicData.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Loading music data...
        </Typography>
      </Box>
    );
  }

  if (artistSongs.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error" sx={{ mb: 2 }}>
          Artist "{artistName}" not found
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </Box>
    );
  }

  const firstSong = artistSongs[0];

  return (
    <Box sx={{ p: 4, height: '100%', overflow: 'auto', bgcolor: '#121212' }}>
      {/* Artist Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
          {artistName}
        </Typography>
        <Typography variant="body1" sx={{ color: 'grey.400', mb: 1 }}>
          {firstSong.category || 'Music Artist'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'grey.500' }}>
          {artistSongs.length} {artistSongs.length === 1 ? 'song' : 'songs'}
        </Typography>
      </Box>

      {/* Play All Button */}
      <Button
        variant="contained"
        startIcon={<PlayArrow />}
        onClick={() => playSong && playSong(artistSongs[0])}
        sx={{
          bgcolor: '#1db954',
          color: 'white',
          mb: 4,
          '&:hover': { bgcolor: '#1ed760' }
        }}
      >
        Play All
      </Button>

      {/* Songs List */}
      <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
        Songs
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {artistSongs.map((song, index) => (
          <Card
            key={song.id}
            sx={{
              bgcolor: '#1a1a1a',
              '&:hover': { bgcolor: '#2a2a2a' },
              cursor: 'pointer'
            }}
            onClick={() => playSong && playSong(song)}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
              <Typography sx={{ color: 'grey.500', minWidth: 30 }}>
                {index + 1}
              </Typography>
              <img
                src={song.cover || '/images/Logo.png'}
                alt={song.title}
                style={{ width: 40, height: 40, borderRadius: 4 }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: 'white', fontWeight: 500 }}>
                  {song.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'grey.400' }}>
                  {song.artist}
                </Typography>
              </Box>
              <Button
                size="small"
                startIcon={<PlayArrow />}
                sx={{ color: '#1db954' }}
                onClick={(e) => {
                  e.stopPropagation();
                  playSong && playSong(song);
                }}
              >
                Play
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
