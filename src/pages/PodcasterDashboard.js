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
  Chip,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  CloudUpload,
  Podcast,
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
import { useModal } from '../hooks/useModal';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ paddingTop: 24 }}>
      {value === index && children}
    </div>
  );
}

export default function PodcasterDashboard() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { showConfirm, showAlert } = useModal();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEpisodes: 0,
    totalSeries: 0,
    totalPlays: 0,
    totalLikes: 0,
    totalRevenue: 0
  });
  const [podcasts, setPodcasts] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Redirect non-podcasters
  useEffect(() => {
    if (role && role !== 'podcaster') {
      navigate('/');
      toast.error('Access denied. Podcaster account required.');
    }
  }, [role, navigate]);

  // Load podcaster data
  useEffect(() => {
    if (!user) return;

    const loadPodcasterData = async () => {
      try {
        setLoading(true);

        // Load podcasts
        const podcastsQuery = query(
          collection(db, 'podcasts'),
          where('uploadedBy', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const podcastsSnap = await getDocs(podcastsQuery);
        const podcastsData = podcastsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPodcasts(podcastsData);

        // Calculate stats
        const totalPlays = podcastsData.reduce((sum, podcast) => sum + (podcast.playCount || 0), 0);
        const totalLikes = podcastsData.reduce((sum, podcast) => sum + (podcast.likeCount || 0), 0);
        const totalRevenue = podcastsData.reduce((sum, podcast) => sum + (podcast.revenue || 0), 0);

        setStats({
          totalEpisodes: podcastsData.length,
          totalSeries: 0, // TODO: Implement series counting
          totalPlays,
          totalLikes,
          totalRevenue
        });

      } catch (error) {
        console.error('Error loading podcaster data:', error);
        toast.error('Failed to load your data');
      } finally {
        setLoading(false);
      }
    };

    loadPodcasterData();
  }, [user]);

  const handleMenuOpen = (event, item) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    const confirmed = await showConfirm('Confirm Delete', `Are you sure you want to delete "${selectedItem.title}"?`, 'warning');
    if (confirmed) {
      try {
        await deleteDoc(doc(db, 'podcasts', selectedItem.id));
        setPodcasts(podcasts.filter(p => p.id !== selectedItem.id));
        toast.success('Episode deleted successfully');
      } catch (error) {
        console.error('Error deleting episode:', error);
        toast.error('Failed to delete episode');
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
        <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Sign In
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
            Podcaster Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {user.displayName || 'Podcaster'}
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Podcast sx={{ color: '#1DB954', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">Total Episodes</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {stats.totalEpisodes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PlayArrow sx={{ color: '#1DB954', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">Total Plays</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {formatNumber(stats.totalPlays)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ThumbUp sx={{ color: '#1DB954', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">Total Likes</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {formatNumber(stats.totalLikes)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AttachMoney sx={{ color: '#1DB954', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {(stats.totalRevenue !== undefined && stats.totalRevenue !== null) ? formatCurrency(stats.totalRevenue) : '$0.00'}
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
            sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
            disabled
          >
            Upload New Episode (Coming Soon)
          </Button>
        </Box>

        {/* Tabs */}
        <Card sx={{ bgcolor: 'grey.900' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Episodes" />
            <Tab label="Analytics" />
            <Tab label="Revenue" />
          </Tabs>

          {/* Episodes Tab */}
          <TabPanel value={activeTab} index={0}>
            {loading ? (
              <LinearProgress />
            ) : podcasts.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No episodes uploaded yet</Typography>
                <Alert severity="info" sx={{ mt: 2 }}>
                  Podcast upload functionality coming soon!
                </Alert>
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
                    {podcasts.map((podcast) => (
                      <TableRow key={podcast.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {podcast.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={podcast.status || 'Published'}
                            size="small"
                            color={podcast.status === 'Published' ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell align="right">{formatNumber(podcast.playCount || 0)}</TableCell>
                        <TableCell align="right">{formatNumber(podcast.likeCount || 0)}</TableCell>
                        <TableCell align="right">{formatCurrency(podcast.revenue || 0)}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, podcast)}
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

          {/* Analytics Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ p: 3 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Advanced podcast analytics coming soon!
              </Alert>
            </Box>
          </TabPanel>

          {/* Revenue Tab */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ p: 3 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Revenue tracking and payout management coming soon!
              </Alert>
            </Box>
          </TabPanel>
        </Card>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
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
  );
}
