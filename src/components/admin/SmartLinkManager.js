// src/components/admin/SmartLinkManager.js
// Smart Link Generator for conversion tracking (2026 Hybrid Strategy)
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../hooks/useModal';
import { db } from '../../firebaseConfig';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  where
} from 'firebase/firestore';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ContentCopy,
  OpenInNew,
  Add,
  TrendingUp,
  Link as LinkIcon
} from '@mui/icons-material';

const SITE_URL = process.env.REACT_APP_SITE_URL || 'https://beatflowmedia.com';

export default function SmartLinkManager() {
  const { user } = useAuth();
  const { showAlert } = useModal();
  const [smartLinks, setSmartLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [linkType, setLinkType] = useState('song');
  const [targetId, setTargetId] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [customSlug, setCustomSlug] = useState('');

  // Available content
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    loadSmartLinks();
    loadContent();
  }, [user]);

  const loadSmartLinks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'smartLinks'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const links = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSmartLinks(links);
    } catch (error) {
      console.error('Error loading smart links:', error);
    }
    setLoading(false);
  };

  const loadContent = async () => {
    try {
      // Load songs
      const songsSnapshot = await getDocs(collection(db, 'songs'));
      setSongs(songsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Load playlists
      const playlistsSnapshot = await getDocs(collection(db, 'playlists'));
      setPlaylists(playlistsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Load campaigns
      const campaignsSnapshot = await getDocs(collection(db, 'campaigns'));
      setCampaigns(campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Get unique artists from songs
      const uniqueArtists = [...new Set(songsSnapshot.docs.map(doc => doc.data().artist || doc.data().artistName))].filter(Boolean);
      setArtists(uniqueArtists.map(name => ({ name })));
    } catch (error) {
      console.error('Error loading content:', error);
    }
  };

  const generateSlug = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `${linkType}-${timestamp}${random}`;
  };

  const handleCreateSmartLink = async () => {
    if (!targetId) {
      await showAlert('Error', 'Please select a target', 'error');
      return;
    }

    setCreating(true);
    try {
      const slug = customSlug || generateSlug();

      // Get target name for display
      let targetName = '';
      if (linkType === 'song') {
        const song = songs.find(s => s.id === targetId);
        targetName = song?.title || 'Unknown Song';
      } else if (linkType === 'artist') {
        targetName = targetId;
      } else if (linkType === 'playlist') {
        const playlist = playlists.find(p => p.id === targetId);
        targetName = playlist?.name || 'Unknown Playlist';
      }

      const smartLinkData = {
        slug,
        url: `${SITE_URL}/link/${slug}`,
        type: linkType,
        targetId,
        targetName,
        campaignId: campaignId || null,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        // Analytics (will be updated by tracking)
        clicks: 0,
        plays: 0,
        follows: 0,
        saves: 0,
        conversions: 0
      };

      await addDoc(collection(db, 'smartLinks'), smartLinkData);

      await showAlert('Success', 'Smart link created successfully!', 'success');

      // Reset form
      setTargetId('');
      setCampaignId('');
      setCustomSlug('');

      // Reload links
      loadSmartLinks();
    } catch (error) {
      console.error('Error creating smart link:', error);
      await showAlert('Error', 'Failed to create smart link', 'error');
    }
    setCreating(false);
  };

  const handleCopyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      await showAlert('Success', 'Link copied to clipboard!', 'success');
    } catch (error) {
      console.error('Error copying link:', error);
      await showAlert('Error', 'Failed to copy link', 'error');
    }
  };

  const getConversionRate = (link) => {
    if (link.clicks === 0) return 0;
    return ((link.conversions / link.clicks) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#fff' }}>
        Smart Link Manager
      </Typography>

      <Alert severity="info" sx={{ mb: 3, bgcolor: '#0a0a0a', color: '#fff' }}>
        Create trackable smart links for songs, artists, and playlists. Monitor clicks, conversions, and campaign performance.
      </Alert>

      {/* Create Smart Link */}
      <Card sx={{ mb: 4, bgcolor: '#181818' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Add /> Create New Smart Link
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#b3b3b3' }}>Link Type</InputLabel>
                <Select
                  value={linkType}
                  onChange={(e) => {
                    setLinkType(e.target.value);
                    setTargetId('');
                  }}
                  sx={{
                    color: '#fff',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: '#404040' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1db954' }
                  }}
                >
                  <MenuItem value="song">Song</MenuItem>
                  <MenuItem value="artist">Artist</MenuItem>
                  <MenuItem value="playlist">Playlist</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#b3b3b3' }}>Target {linkType.charAt(0).toUpperCase() + linkType.slice(1)}</InputLabel>
                <Select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  sx={{
                    color: '#fff',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: '#404040' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1db954' }
                  }}
                >
                  {linkType === 'song' && songs.map(song => (
                    <MenuItem key={song.id} value={song.id}>
                      {song.title} - {song.artist || song.artistName}
                    </MenuItem>
                  ))}
                  {linkType === 'artist' && artists.map(artist => (
                    <MenuItem key={artist.name} value={artist.name}>
                      {artist.name}
                    </MenuItem>
                  ))}
                  {linkType === 'playlist' && playlists.map(playlist => (
                    <MenuItem key={playlist.id} value={playlist.id}>
                      {playlist.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#b3b3b3' }}>Campaign (Optional)</InputLabel>
                <Select
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  sx={{
                    color: '#fff',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: '#404040' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1db954' }
                  }}
                >
                  <MenuItem value="">None</MenuItem>
                  {campaigns.map(campaign => (
                    <MenuItem key={campaign.id} value={campaign.id}>
                      {campaign.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Custom Slug (Optional)"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="my-custom-link"
                sx={{
                  '& .MuiInputBase-root': { color: '#fff' },
                  '& .MuiInputLabel-root': { color: '#b3b3b3' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#404040' }
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LinkIcon sx={{ color: '#b3b3b3' }} /></InputAdornment>
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleCreateSmartLink}
                disabled={creating || !targetId}
                startIcon={creating ? <CircularProgress size={20} /> : <Add />}
                sx={{
                  bgcolor: '#1db954',
                  '&:hover': { bgcolor: '#1ed760' },
                  '&:disabled': { bgcolor: '#404040' }
                }}
              >
                {creating ? 'Creating...' : 'Create Smart Link'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Smart Links Table */}
      <Card sx={{ bgcolor: '#181818' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, color: '#fff' }}>
            Active Smart Links ({smartLinks.length})
          </Typography>

          {smartLinks.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <LinkIcon sx={{ fontSize: 64, color: '#404040', mb: 2 }} />
              <Typography variant="body1" sx={{ color: '#b3b3b3' }}>
                No smart links created yet
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ bgcolor: '#0a0a0a' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#b3b3b3', fontWeight: 'bold' }}>Target</TableCell>
                    <TableCell sx={{ color: '#b3b3b3', fontWeight: 'bold' }}>Smart Link</TableCell>
                    <TableCell sx={{ color: '#b3b3b3', fontWeight: 'bold' }}>Campaign</TableCell>
                    <TableCell sx={{ color: '#b3b3b3', fontWeight: 'bold', textAlign: 'center' }}>Clicks</TableCell>
                    <TableCell sx={{ color: '#b3b3b3', fontWeight: 'bold', textAlign: 'center' }}>Conversions</TableCell>
                    <TableCell sx={{ color: '#b3b3b3', fontWeight: 'bold', textAlign: 'center' }}>Conv. Rate</TableCell>
                    <TableCell sx={{ color: '#b3b3b3', fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {smartLinks.map((link) => (
                    <TableRow key={link.id} hover sx={{ '&:hover': { bgcolor: '#1f2937' } }}>
                      <TableCell sx={{ color: '#fff' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {link.targetName}
                          </Typography>
                          <Chip
                            label={link.type}
                            size="small"
                            sx={{
                              bgcolor: '#1db954',
                              color: '#fff',
                              fontSize: '11px',
                              mt: 0.5
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: '#9ca3af', fontFamily: 'monospace', fontSize: '12px' }}>
                        {link.url}
                      </TableCell>
                      <TableCell sx={{ color: '#9ca3af' }}>
                        {link.campaignId ? (
                          <Chip label="Linked" size="small" color="primary" />
                        ) : (
                          <Chip label="None" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell sx={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
                        {link.clicks || 0}
                      </TableCell>
                      <TableCell sx={{ color: '#1db954', textAlign: 'center', fontWeight: 'bold' }}>
                        {link.conversions || 0}
                      </TableCell>
                      <TableCell sx={{ color: '#fff', textAlign: 'center' }}>
                        {getConversionRate(link)}%
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleCopyLink(link.url)}
                            sx={{ color: '#1db954' }}
                            title="Copy link"
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            component="a"
                            href={link.url}
                            target="_blank"
                            sx={{ color: '#1db954' }}
                            title="Open link"
                          >
                            <OpenInNew fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
