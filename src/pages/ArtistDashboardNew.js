import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CloudUpload,
  MusicNote,
  Album as AlbumIcon,
  TrendingUp,
  AttachMoney,
  Edit,
  Delete,
  MoreVert,
  Visibility,
  ThumbUp,
  PlayArrow
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { checkMembershipStatus } from '../services/membershipService';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ paddingTop: 24 }}>
      {value === index && children}
    </div>
  );
}

export default function ArtistDashboardNew() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSongs: 0,
    totalAlbums: 0,
    totalPlays: 0,
    totalLikes: 0,
    totalRevenue: 0
  });
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [checkingMembership, setCheckingMembership] = useState(true);

  // Check membership status
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setCheckingMembership(false);
        return;
      }

      try {
        const status = await checkMembershipStatus(user.uid);
        setMembershipStatus(status);
      } catch (error) {
        console.error('Error checking membership:', error);
      } finally {
        setCheckingMembership(false);
      }
    };

    checkAccess();
  }, [user]);

  // Redirect to pricing if no active membership
  useEffect(() => {
    if (!checkingMembership && (!membershipStatus || !membershipStatus.active)) {
      navigate('/artist-pricing');
    }
  }, [checkingMembership, membershipStatus, navigate]);

  // Load artist data
  useEffect(() => {
    if (!user) return;
    if (role && role !== 'artist') return; // Don't load data for non-artists

    const loadArtistData = async () => {
      try {
        setLoading(true);

        // Load songs
        const songsQuery = query(
          collection(db, 'songs'),
          where('uploadedBy', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const songsSnap = await getDocs(songsQuery);
        const songsData = songsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSongs(songsData);

        // Load albums
        const albumsQuery = query(
          collection(db, 'albums'),
          where('uploadedBy', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const albumsSnap = await getDocs(albumsQuery);
        const albumsData = albumsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAlbums(albumsData);

        // Calculate stats
        const totalPlays = songsData.reduce((sum, song) => sum + (song.playCount || 0), 0);
        const totalLikes = songsData.reduce((sum, song) => sum + (song.likeCount || 0), 0);
        const totalRevenue = songsData.reduce((sum, song) => sum + (song.revenue || 0), 0);

        setStats({
          totalSongs: songsData.length,
          totalAlbums: albumsData.length,
          totalPlays,
          totalLikes,
          totalRevenue
        });

      } catch (error) {
        console.error('Error loading artist data:', error);
        toast.error('Failed to load your data');
      } finally {
        setLoading(false);
      }
    };

    loadArtistData();
  }, [user, role]);

  const handleMenuOpen = (event, item) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    // Navigate to edit page
    if (selectedItem) {
      navigate(`/edit-song/${selectedItem.id}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    if (window.confirm(`Are you sure you want to delete "${selectedItem.title}"?`)) {
      try {
        await deleteDoc(doc(db, 'songs', selectedItem.id));
        setSongs(songs.filter(s => s.id !== selectedItem.id));
        toast.success('Song deleted successfully');
      } catch (error) {
        console.error('Error deleting song:', error);
        toast.error('Failed to delete song');
      }
    }
    handleMenuClose();
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100);
  };

  if (!user) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>Please sign in to access your dashboard</Typography>
        <Button variant="contained" onClick={() => navigate('/for-artists')} sx={{ mt: 2 }}>
          Sign In
        </Button>
      </Container>
    );
  }

  return (
    <>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
            Artist Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {user.displayName || 'Artist'}
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Card sx={{ bgcolor: 'grey.900', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MusicNote sx={{ color: '#1DB954', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">Total Songs</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                  {stats.totalSongs}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Card sx={{ bgcolor: 'grey.900', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AlbumIcon sx={{ color: '#1DB954', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">Total Albums</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                  {stats.totalAlbums}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Card sx={{ bgcolor: 'grey.900', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PlayArrow sx={{ color: '#1DB954', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">Total Plays</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                  {formatNumber(stats.totalPlays)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Card sx={{ bgcolor: 'grey.900', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ThumbUp sx={{ color: '#1DB954', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">Total Likes</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                  {formatNumber(stats.totalLikes)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Card sx={{ bgcolor: 'grey.900', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AttachMoney sx={{ color: '#1DB954', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                  {formatCurrency(stats.totalRevenue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Upload Button */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<CloudUpload />}
            onClick={() => navigate('/for-artists')}
            sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
          >
            Upload New Music
          </Button>
        </Box>

        {/* Tabs */}
        <Card sx={{ bgcolor: 'grey.900' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Songs" />
            <Tab label="Albums" />
            <Tab label="Analytics" />
            <Tab label="Revenue" />
          </Tabs>

          {/* Songs Tab */}
          <TabPanel value={activeTab} index={0}>
            {loading ? (
              <LinearProgress />
            ) : songs.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No songs uploaded yet</Typography>
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  onClick={() => navigate('/for-artists')}
                  sx={{ mt: 2 }}
                >
                  Upload Your First Song
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Plays</TableCell>
                      <TableCell align="right">Likes</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {songs.map((song) => (
                      <TableRow key={song.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <img
                              src={song.coverUrl || song.cover || '/images/Logo.png'}
                              alt={song.title}
                              style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }}
                            />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {song.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {song.genre || 'Unknown'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={song.status || 'Published'}
                            size="small"
                            color={song.status === 'Published' ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell align="right">{formatNumber(song.playCount || 0)}</TableCell>
                        <TableCell align="right">{formatNumber(song.likeCount || 0)}</TableCell>
                        <TableCell align="right">{formatCurrency(song.revenue || 0)}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, song)}
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* Albums Tab */}
          <TabPanel value={activeTab} index={1}>
            {loading ? (
              <LinearProgress />
            ) : albums.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No albums created yet</Typography>
              </Box>
            ) : (
              <Grid container spacing={2} sx={{ p: 2 }}>
                {albums.map((album) => (
                  <Grid item xs={12} sm={6} md={4} key={album.id}>
                    <Card sx={{ bgcolor: 'grey.800' }}>
                      <Box sx={{ position: 'relative', paddingTop: '100%' }}>
                        <img
                          src={album.coverUrl || '/images/Logo.png'}
                          alt={album.title}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </Box>
                      <CardContent>
                        <Typography variant="h6" noWrap>{album.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {album.trackCount || 0} tracks
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* Analytics Tab */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ p: 3 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Advanced analytics coming soon! Track your growth, audience demographics, and more.
              </Alert>
              <Typography color="text.secondary">
                Premium analytics features will be available soon.
              </Typography>
            </Box>
          </TabPanel>

          {/* Revenue Tab */}
          <TabPanel value={activeTab} index={3}>
            <Box sx={{ p: 3 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Revenue tracking and payout management coming soon!
              </Alert>
              <Typography color="text.secondary">
                View your earnings and request payouts directly from your dashboard.
              </Typography>
            </Box>
          </TabPanel>
        </Card>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEdit}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={() => navigate(`/artist/${selectedItem?.artist}`)}>
            <Visibility fontSize="small" sx={{ mr: 1 }} />
            View Public Page
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>
      </Container>
    </Box>
    </>
  );
}
