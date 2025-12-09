import React, { useMemo } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { buildArtistInfo } from '../utils/buildArtistInfo';

export default function ArtistSimple() {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const { musicData = [], playSong } = useOutletContext() || {};

  // Decode artist name from URL
  const artistName = decodeURIComponent(artistId);

  // Build artist info from musicData.json using the existing utility
  const artistInfo = useMemo(
    () => buildArtistInfo(artistName, musicData),
    [artistName, musicData]
  );

  // Get songs from artist info
  const artistSongs = artistInfo?.songs || [];

  if (!musicData || musicData.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Loading music data...
        </Typography>
      </Box>
    );
  }

  if (!artistInfo || artistSongs.length === 0) {
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

  return (
    <Box sx={{ p: 4, height: '100%', overflow: 'auto', bgcolor: '#121212' }}>
      {/* Artist Header with cover image */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, alignItems: 'flex-end' }}>
        <img
          src={artistInfo.cover || '/images/Logo.png'}
          alt={artistInfo.name}
          style={{ width: 200, height: 200, borderRadius: 8, objectFit: 'cover' }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
            {artistInfo.name}
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.400', mb: 1 }}>
            {artistInfo.monthlyListeners !== 'Unknown'
              ? `${Number(artistInfo.monthlyListeners).toLocaleString()} monthly listeners`
              : 'Music Artist'
            }
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.500' }}>
            {artistSongs.length} {artistSongs.length === 1 ? 'song' : 'songs'}
          </Typography>
        </Box>
      </Box>

      {/* Biography */}
      {artistInfo.biography && artistInfo.biography !== 'No biography available.' && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            About
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.400', lineHeight: 1.6 }}>
            {artistInfo.biography}
          </Typography>
        </Box>
      )}

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
