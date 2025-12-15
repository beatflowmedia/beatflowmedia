// src/pages/Profile.js
// User profile page with purchases, stats, and quick links
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Download,
  Settings,
  Favorite,
  PlayCircle,
  QueueMusic,
  History,
  ShoppingCart,
  Logout,
  Edit
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { stripeService } from '../services/stripeService';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export default function Profile() {
  const { user, signOutUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalFavorites: 0,
    totalPlaylists: 0,
    recentlyPlayed: 0
  });
  const [recentPurchases, setRecentPurchases] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const loadStats = async () => {
      await loadUserStats();
    };

    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const loadUserStats = async () => {
    try {
      setLoading(true);

      // Load purchases
      const purchases = await stripeService.getUserPurchases(user.uid);
      setRecentPurchases(purchases.slice(0, 5));

      // Load listening history count
      const historyQuery = query(
        collection(db, 'listening_history'),
        where('userId', '==', user.uid),
        limit(100)
      );
      const historySnapshot = await getDocs(historyQuery);

      // Load playlists count
      const playlistsQuery = query(
        collection(db, 'playlists'),
        where('creatorId', '==', user.uid)
      );
      const playlistsSnapshot = await getDocs(playlistsQuery);

      setStats({
        totalPurchases: purchases.length,
        totalFavorites: user.likes?.length || 0,
        totalPlaylists: playlistsSnapshot.size,
        recentlyPlayed: historySnapshot.size
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
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
        {/* Profile Header */}
        <Paper sx={{ p: 4, mb: 4, bgcolor: 'background.paper' }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                src={user.photoURL}
                alt={user.displayName}
                sx={{ width: 120, height: 120 }}
              />
            </Grid>
            <Grid item xs>
              <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 1 }}>
                {user.displayName || 'Music Lover'}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                {user.email}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  icon={<ShoppingCart />}
                  label={`${stats.totalPurchases} Purchases`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  icon={<Favorite />}
                  label={`${stats.totalFavorites} Favorites`}
                  color="error"
                  variant="outlined"
                />
                <Chip
                  icon={<QueueMusic />}
                  label={`${stats.totalPlaylists} Playlists`}
                  color="success"
                  variant="outlined"
                />
              </Box>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => navigate('/settings')}
              >
                Edit Profile
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'background.paper' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'text.primary', mb: 2, fontWeight: 'bold' }}>
                  Quick Actions
                </Typography>
                <List>
                  <ListItemButton onClick={() => navigate('/downloads')}>
                    <ListItemIcon>
                      <Download sx={{ color: '#1DB954' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="My Downloads"
                      secondary={`${stats.totalPurchases} items`}
                      primaryTypographyProps={{ color: 'text.primary' }}
                      secondaryTypographyProps={{ color: 'text.secondary' }}
                    />
                  </ListItemButton>

                  <ListItemButton onClick={() => navigate('/favorites')}>
                    <ListItemIcon>
                      <Favorite sx={{ color: '#e91e63' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Liked Songs"
                      secondary={`${stats.totalFavorites} songs`}
                      primaryTypographyProps={{ color: 'text.primary' }}
                      secondaryTypographyProps={{ color: 'text.secondary' }}
                    />
                  </ListItemButton>

                  <ListItemButton onClick={() => navigate('/playlists')}>
                    <ListItemIcon>
                      <QueueMusic sx={{ color: '#1DB954' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="My Playlists"
                      secondary={`${stats.totalPlaylists} playlists`}
                      primaryTypographyProps={{ color: 'text.primary' }}
                      secondaryTypographyProps={{ color: 'text.secondary' }}
                    />
                  </ListItemButton>

                  <Divider sx={{ my: 1 }} />

                  <ListItemButton onClick={() => navigate('/settings')}>
                    <ListItemIcon>
                      <Settings sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Settings"
                      primaryTypographyProps={{ color: 'text.primary' }}
                    />
                  </ListItemButton>

                  <ListItemButton onClick={signOutUser}>
                    <ListItemIcon>
                      <Logout sx={{ color: 'error.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Sign Out"
                      primaryTypographyProps={{ color: 'text.primary' }}
                    />
                  </ListItemButton>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Purchases */}
          <Grid item xs={12} md={8}>
            <Card sx={{ bgcolor: 'background.paper' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                    Recent Purchases
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => navigate('/downloads')}
                    sx={{ color: 'primary.main' }}
                  >
                    View All
                  </Button>
                </Box>

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : recentPurchases.length > 0 ? (
                  <List>
                    {recentPurchases.map((purchase) => (
                      <ListItem
                        key={purchase.id}
                        sx={{
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:last-child': { borderBottom: 'none' }
                        }}
                      >
                        <ListItemIcon>
                          <ShoppingCart sx={{ color: '#1DB954' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={purchase.itemName}
                          secondary={`${purchase.artistName} • ${new Date(purchase.purchasedAt).toLocaleDateString()}`}
                          primaryTypographyProps={{ color: 'text.primary' }}
                          secondaryTypographyProps={{ color: 'text.secondary' }}
                        />
                        <Chip
                          label={`$${purchase.price.toFixed(2)}`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <ShoppingCart sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                      No purchases yet
                    </Typography>
                    <Button
                      variant="contained"
                      sx={{ mt: 2, bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
                      onClick={() => navigate('/')}
                    >
                      Browse Music
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Listening Stats */}
            <Card sx={{ bgcolor: 'background.paper', mt: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'text.primary', mb: 2, fontWeight: 'bold' }}>
                  Listening Stats
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.900', borderRadius: 2 }}>
                      <PlayCircle sx={{ fontSize: 40, color: '#1DB954', mb: 1 }} />
                      <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                        {stats.recentlyPlayed}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Songs Played
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.900', borderRadius: 2 }}>
                      <History sx={{ fontSize: 40, color: '#1DB954', mb: 1 }} />
                      <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                        {Math.floor(stats.recentlyPlayed * 3.5)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Minutes Listened
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
