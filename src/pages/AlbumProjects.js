// src/pages/AlbumProjects.js
// Display all album projects (complete albums available for purchase)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { PlayArrow, ShoppingCart, Album as AlbumIcon } from '@mui/icons-material';

export default function AlbumProjects() {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAlbumProjects();
  }, []);

  const loadAlbumProjects = async () => {
    try {
      setLoading(true);

      // Query albums where isAlbum: true (album projects) - simplified to avoid index
      const albumsQuery = query(
        collection(db, 'albums'),
        where('isAlbum', '==', true)
      );

      const snapshot = await getDocs(albumsQuery);
      const albumsData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        // Filter visible and sort client-side
        .filter(album => album.isVisible !== false)
        .sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || new Date(0);
          const bDate = b.createdAt?.toDate?.() || new Date(0);
          return bDate - aDate; // Newest first
        });

      setAlbums(albumsData);
    } catch (err) {
      console.error('Error loading album projects:', err);
      setError('Failed to load album projects');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAlbum = (albumId) => {
    navigate(`/album/${albumId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#121212', py: 8 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2, color: 'white' }}>
            Album Projects
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Complete albums ready for licensing. Purchase the full album and get all tracks instantly.
          </Typography>
          <Alert severity="info" sx={{ maxWidth: 800, mx: 'auto' }}>
            <strong>What's an Album Project?</strong> These are complete albums (typically 10+ tracks)
            available for purchase as a bundle. Perfect for creators who need a cohesive music collection
            for their projects, podcasts, or video series.
          </Alert>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* Albums Grid */}
        {albums.length === 0 ? (
          <Card sx={{ bgcolor: '#1e1e1e', p: 8, textAlign: 'center' }}>
            <AlbumIcon sx={{ fontSize: 80, color: '#555', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
              No album projects available yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check back soon for complete album collections
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={4}>
            {albums.map((album) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={album.id}>
                <Card
                  sx={{
                    bgcolor: '#1e1e1e',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(29, 185, 84, 0.3)'
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    height="250"
                    image={album.cover || album.coverUrl || '/images/Logo.png'}
                    alt={album.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ color: 'white', mb: 1, fontWeight: 'bold' }}>
                      {album.title || 'Untitled Album'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {album.artist || album.artistName || 'Unknown Artist'}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip
                        label={`${album.trackCount || 0} tracks`}
                        size="small"
                        sx={{ bgcolor: '#2a2a2a' }}
                      />
                      {album.genre && (
                        <Chip
                          label={album.genre}
                          size="small"
                          sx={{ bgcolor: '#2a2a2a' }}
                        />
                      )}
                    </Box>

                    {album.description && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {album.description}
                      </Typography>
                    )}
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<ShoppingCart />}
                      onClick={() => handleViewAlbum(album.id)}
                      sx={{
                        bgcolor: '#1DB954',
                        '&:hover': { bgcolor: '#1ed760' },
                        fontWeight: 'bold'
                      }}
                    >
                      View Album
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Info Section */}
        <Box sx={{ mt: 8, p: 4, bgcolor: '#1e1e1e', borderRadius: 2 }}>
          <Typography variant="h5" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
            Why Purchase Album Projects?
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="h6" sx={{ color: '#1DB954', mb: 1 }}>
                  💰 Better Value
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Get 10+ tracks for the price of ~3-4 individual songs
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="h6" sx={{ color: '#1DB954', mb: 1 }}>
                  🎵 Cohesive Sound
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Professionally curated albums with consistent style and quality
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="h6" sx={{ color: '#1DB954', mb: 1 }}>
                  ⚡ Instant Access
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Download all tracks immediately after purchase
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
