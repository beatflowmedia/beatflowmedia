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
  Edit,
  Star,
  ManageAccounts
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { stripeService } from '../services/stripeService';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';

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
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

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

  const handleManageSubscription = async () => {
    try {
      // Call Netlify function to create customer portal session
      const response = await fetch('/.netlify/functions/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      alert('Failed to open subscription management. Please try again.');
    }
  };

  const loadUserStats = async () => {
    try {
      setLoading(true);

      // Load subscription info from user document
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.premiumActive) {
          setSubscriptionInfo({
            active: true,
            tier: userData.premiumTier || 'individual',
            stripeCustomerId: userData.stripeCustomerId
          });
        }
      }
      setLoadingSubscription(false);

      // Load purchases
      const purchases = await stripeService.getUserPurchases(user.uid);
      setRecentPurchases(purchases.slice(0, 5));

      // Load playlists count from subcollection
      let playlistsCount = 0;
      try {
        const playlistsRef = collection(db, 'users', user.uid, 'playlists');
        const playlistsSnapshot = await getDocs(playlistsRef);
        playlistsCount = playlistsSnapshot.size;
      } catch (error) {
        console.error('Error loading playlists:', error);
      }

      // Load favorites count from user document
      let favoritesCount = 0;
      if (userDoc.exists()) {
        const userData = userDoc.data();
        favoritesCount = userData.likes?.length || 0;
      }

      // Load listening history count
      let historyCount = 0;
      try {
        const historyQuery = query(
          collection(db, 'listening_history'),
          where('userId', '==', user.uid),
          limit(100)
        );
        const historySnapshot = await getDocs(historyQuery);
        historyCount = historySnapshot.size;
      } catch (error) {
        console.error('Error loading listening history:', error);
      }

      setStats({
        totalPurchases: purchases.length,
        totalFavorites: favoritesCount,
        totalPlaylists: playlistsCount,
        recentlyPlayed: historyCount
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
                  icon={<PlayCircle />}
                  label={`${stats.recentlyPlayed} Played`}
                  color="success"
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

        {/* Subscription Info */}
        {!loadingSubscription && subscriptionInfo?.active && (
          <Paper sx={{ p: 3, mb: 4, bgcolor: 'background.paper', borderLeft: '4px solid #1DB954' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Star sx={{ fontSize: 40, color: '#1DB954' }} />
                <Box>
                  <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                    BeatFlow Premium {subscriptionInfo.tier.charAt(0).toUpperCase() + subscriptionInfo.tier.slice(1)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Active subscription • Cancel anytime
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                startIcon={<ManageAccounts />}
                onClick={handleManageSubscription}
                sx={{ borderColor: '#1DB954', color: '#1DB954', '&:hover': { borderColor: '#1ed760', bgcolor: 'rgba(29, 185, 84, 0.1)' } }}
              >
                Manage Subscription
              </Button>
            </Box>
          </Paper>
        )}

        {/* Upgrade to Premium Banner */}
        {!loadingSubscription && !subscriptionInfo?.active && (
          <Paper sx={{ p: 3, mb: 4, bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Unlock BeatFlow Premium
                </Typography>
                <Typography variant="body2">
                  Ad-free music, unlimited downloads, and high-quality audio
                </Typography>
              </Box>
              <Button
                variant="contained"
                onClick={() => navigate('/explore-premium')}
                sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
              >
                Explore Plans
              </Button>
            </Box>
          </Paper>
        )}

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
