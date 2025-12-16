// src/pages/Favorites.js
// Liked songs page
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Avatar,
  Chip
} from '@mui/material';
import {
  ArrowBack,
  Favorite,
  PlayArrow,
  MoreVert,
  MusicNote
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export default function Favorites() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [likedSongs, setLikedSongs] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    loadLikedSongs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const loadLikedSongs = async () => {
    try {
      setLoading(true);

      // Load user's liked songs from user document
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        setLikedSongs([]);
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      const songIds = userData.likes || [];

      if (songIds.length === 0) {
        setLikedSongs([]);
        setLoading(false);
        return;
      }

      // Load song details - batch in groups of 10 (Firestore 'in' query limit)
      const songs = [];
      for (let i = 0; i < songIds.length; i += 10) {
        const batch = songIds.slice(i, i + 10);
        const songsQuery = query(
          collection(db, 'songs'),
          where('__name__', 'in', batch)
        );
        const songsSnapshot = await getDocs(songsQuery);
        songsSnapshot.docs.forEach(doc => {
          songs.push({ id: doc.id, ...doc.data() });
        });
      }

      setLikedSongs(songs);
    } catch (error) {
      console.error('Error loading liked songs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={() => navigate('/profile')} sx={{ mr: 2, color: 'text.primary' }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 60, height: 60, bgcolor: '#e91e63' }}>
              <Favorite sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
                Playlist
              </Typography>
              <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                Liked Songs
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {user.displayName || 'You'} • {likedSongs.length} songs
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Songs List */}
        <Card sx={{ bgcolor: 'background.paper' }}>
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : likedSongs.length > 0 ? (
              <List>
                {likedSongs.map((song, index) => (
                  <ListItem
                    key={song.id}
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 'none' },
                      '&:hover': { bgcolor: 'action.hover' },
                      cursor: 'pointer'
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {index + 1}
                      </Typography>
                    </ListItemIcon>

                    <Avatar
                      src={song.albumArt || song.coverArt}
                      alt={song.title}
                      variant="rounded"
                      sx={{ mr: 2, width: 48, height: 48 }}
                    >
                      <MusicNote />
                    </Avatar>

                    <ListItemText
                      primary={song.title}
                      secondary={song.artist || song.artistName || 'Unknown Artist'}
                      primaryTypographyProps={{ color: 'text.primary', fontWeight: 500 }}
                      secondaryTypographyProps={{ color: 'text.secondary' }}
                    />

                    {song.album && (
                      <Typography variant="body2" sx={{ color: 'text.secondary', mr: 2 }}>
                        {song.album}
                      </Typography>
                    )}

                    {song.duration && (
                      <Typography variant="body2" sx={{ color: 'text.secondary', mr: 2 }}>
                        {song.duration}
                      </Typography>
                    )}

                    <IconButton sx={{ color: 'text.secondary' }}>
                      <PlayArrow />
                    </IconButton>

                    <IconButton sx={{ color: 'text.secondary' }}>
                      <MoreVert />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Favorite sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ color: 'text.primary', mb: 1 }}>
                  No liked songs yet
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                  Songs you like will appear here
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
