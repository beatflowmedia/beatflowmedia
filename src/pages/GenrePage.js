// src/pages/GenrePage.js
// Spotify-inspired genre page with sections for popular and new releases
import { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  IconButton,
  Chip
} from '@mui/material';
import PlayArrow from '@mui/icons-material/PlayArrow';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import PlayingIndicator from '../components/PlayingIndicator';
import { usePlaySong } from '../hooks/usePlaySong';

export default function GenrePage() {
  const { genre } = useParams();
  const navigate = useNavigate();
  const { dispatch, actions } = usePlayer();
  const { user } = useAuth();
  const { playSong: playSelectedSong, isSongPlaying } = usePlaySong();

  const [popularSongs, setPopularSongs] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Format genre for display
  const formatGenre = (genreSlug) => {
    return genreSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        const genreFormatted = formatGenre(genre);

        // Fetch popular songs (by play count)
        const popularQuery = query(
          collection(db, 'songs'),
          where('genre', '==', genreFormatted),
          orderBy('playCount', 'desc'),
          limit(12)
        );

        const popularSnapshot = await getDocs(popularQuery);
        const popularData = popularSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(song => song.isVisible !== false); // Filter out hidden songs
        setPopularSongs(popularData);

        // Fetch new releases (by release date)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newReleasesQuery = query(
          collection(db, 'songs'),
          where('genre', '==', genreFormatted),
          where('releaseDate', '>', thirtyDaysAgo),
          orderBy('releaseDate', 'desc'),
          limit(12)
        );

        const newReleasesSnapshot = await getDocs(newReleasesQuery);
        const newReleasesData = newReleasesSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(song => song.isVisible !== false); // Filter out hidden songs
        setNewReleases(newReleasesData);

      } catch (error) {
        console.error('Error fetching songs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, [genre]);

  const handlePlaySong = (song) => {
    playSelectedSong(song);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  const SongCard = ({ song }) => {
    const isPlaying = isSongPlaying(song);

    return (
      <Card
        sx={{
          bgcolor: 'background.paper',
          position: 'relative',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 3,
            '& .play-overlay': {
              opacity: 1
            }
          }
        }}
      >
        <Box sx={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
          <CardMedia
            component="img"
            image={song.coverUrl || song.cover || '/default-song-cover.jpg'}
            alt={song.title}
            sx={{
              cursor: 'pointer',
              width: '100%',
              height: 'auto',
              aspectRatio: '1 / 1',
              objectFit: 'cover'
            }}
            onClick={() => navigate(`/song/${song.id}`)}
          />

          {/* Play Overlay */}
          <Box
            className="play-overlay"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isPlaying ? 1 : 0,
              transition: 'opacity 0.3s',
              cursor: 'pointer'
            }}
            onClick={() => handlePlaySong(song)}
          >
            {isPlaying ? (
              <PlayingIndicator isPlaying={isPlaying} size="large" />
            ) : (
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
            )}
          </Box>
        </Box>

        <CardContent sx={{ p: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{
              color: 'text.primary',
              fontWeight: 'bold',
              cursor: 'pointer',
              '&:hover': { color: 'primary.main' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            onClick={() => navigate(`/song/${song.id}`)}
          >
            {song.title}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              cursor: 'pointer',
              '&:hover': { color: 'primary.main' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {song.artistName || song.artist}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  // Genre-specific hero images
  const genreHeroImages = {
    'blues': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1600&h=400&fit=crop',
    'hip-hop': 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=1600&h=400&fit=crop',
    'rock': 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=1600&h=400&fit=crop',
    'pop': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1600&h=400&fit=crop',
    'country': 'https://images.unsplash.com/photo-1520262454473-a1a82276a574?w=1600&h=400&fit=crop',
    'rnb': 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=1600&h=400&fit=crop',
    'dance-electronic': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1600&h=400&fit=crop'
  };

  const heroImage = genreHeroImages[genre] || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1600&h=400&fit=crop';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Banner */}
      <Box
        sx={{
          position: 'relative',
          height: '400px',
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'flex-end',
          mb: 4
        }}
      >
        {/* Gradient Overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)'
          }}
        />

        {/* Hero Content */}
        <Box sx={{ position: 'relative', p: 4, zIndex: 1 }}>
          <Typography
            variant="h2"
            sx={{
              color: 'white',
              fontWeight: 'bold',
              textShadow: '2px 2px 8px rgba(0,0,0,0.8)'
            }}
          >
            {formatGenre(genre)}
          </Typography>
        </Box>
      </Box>

      {/* Content Container */}
      <Box sx={{ px: 3, pb: 3 }}>

      {/* Popular Section */}
      {popularSongs.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h5"
            sx={{ color: 'text.primary', fontWeight: 'bold', mb: 3 }}
          >
            Popular {formatGenre(genre)}
          </Typography>
          <Grid container spacing={2}>
            {popularSongs.map((song) => (
              <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={song.id}>
                <SongCard song={song} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* New Releases Section */}
      {newReleases.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h5"
            sx={{ color: 'text.primary', fontWeight: 'bold', mb: 3 }}
          >
            New {formatGenre(genre)} Releases
          </Typography>
          <Grid container spacing={2}>
            {newReleases.map((song) => (
              <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={song.id}>
                <SongCard song={song} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

        {/* Empty State */}
        {popularSongs.length === 0 && newReleases.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              No songs found in this genre yet.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              Check back soon for new releases!
            </Typography>
          </Box>
        )}
      </Box>
      <Footer />
    </Box>
  );
}
