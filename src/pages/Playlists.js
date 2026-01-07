// src/pages/Playlists.js
// User playlists page
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useModal } from '../hooks/useModal';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  Grid,
  CircularProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  ArrowBack,
  QueueMusic,
  Add,
  PlayArrow,
  MoreVert
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Playlists() {
  const { user } = useAuth();
  const { showAlert } = useModal();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    loadPlaylists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const loadPlaylists = async () => {
    try {
      setLoading(true);

      // Playlists are stored in users/{userId}/playlists subcollection
      const playlistsRef = collection(db, 'users', user.uid, 'playlists');
      const playlistsSnapshot = await getDocs(playlistsRef);

      const playlistsData = playlistsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setPlaylists(playlistsData);
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      setCreating(true);

      // Create playlist in users/{userId}/playlists subcollection
      await addDoc(collection(db, 'users', user.uid, 'playlists'), {
        name: newPlaylistName,
        songs: [],
        imageUrl: null,
        createdAt: serverTimestamp()
      });

      setNewPlaylistName('');
      setCreateDialogOpen(false);
      await loadPlaylists();
    } catch (error) {
      console.error('Error creating playlist:', error);
      await showAlert('Error', 'Failed to create playlist', 'error');
    } finally {
      setCreating(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigate('/profile')} sx={{ mr: 2, color: 'text.primary' }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              Your Playlists
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
          >
            Create Playlist
          </Button>
        </Box>

        {/* Playlists Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : playlists.length > 0 ? (
          <Grid container spacing={3}>
            {playlists.map((playlist) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={playlist.id}>
                <Card
                  sx={{
                    bgcolor: 'background.paper',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      bgcolor: 'action.hover'
                    }
                  }}
                  onClick={() => navigate(`/playlist/${playlist.id}`)}
                >
                  <CardContent>
                    <Box sx={{ position: 'relative', mb: 2 }}>
                      <Avatar
                        variant="rounded"
                        sx={{ width: '100%', height: 200, bgcolor: 'grey.800' }}
                      >
                        <QueueMusic sx={{ fontSize: 80, color: 'text.secondary' }} />
                      </Avatar>
                      <IconButton
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          bgcolor: '#1DB954',
                          '&:hover': { bgcolor: '#1ed760' }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Play playlist
                        }}
                      >
                        <PlayArrow />
                      </IconButton>
                    </Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 1 }}>
                      {playlist.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {playlist.songs?.length || 0} songs
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <QueueMusic sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'text.primary', mb: 1 }}>
              No playlists yet
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Create your first playlist to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
            >
              Create Playlist
            </Button>
          </Box>
        )}

        {/* Create Playlist Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
            Create New Playlist
          </DialogTitle>
          <DialogContent sx={{ bgcolor: 'background.paper', mt: 2 }}>
            <TextField
              autoFocus
              fullWidth
              label="Playlist Name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newPlaylistName.trim()) {
                  handleCreatePlaylist();
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ bgcolor: 'background.paper', p: 2 }}>
            <Button onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreatePlaylist}
              disabled={!newPlaylistName.trim() || creating}
              sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
            >
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
