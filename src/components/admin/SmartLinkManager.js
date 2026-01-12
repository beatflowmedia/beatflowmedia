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
  where,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { checkMembershipStatus } from '../../services/membershipService';
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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material';
import {
  ContentCopy,
  OpenInNew,
  Add,
  TrendingUp,
  Link as LinkIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const SITE_URL = process.env.REACT_APP_SITE_URL || 'https://beatflowmediagroup.com';

export default function SmartLinkManager({ artistOnly = false }) {
  const { user } = useAuth();
  const { showAlert } = useModal();
  const [smartLinks, setSmartLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [checkingMembership, setCheckingMembership] = useState(true);

  // Form state
  const [linkType, setLinkType] = useState('song');
  const [targetId, setTargetId] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [customSlug, setCustomSlug] = useState('');

  // Edit/Delete state
  const [editingLink, setEditingLink] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Available content
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    loadSmartLinks();
    loadContent();
    checkPremiumStatus();
  }, [user]);

  const checkPremiumStatus = async () => {
    if (!user) {
      setCheckingMembership(false);
      return;
    }
    setCheckingMembership(true);
    try {
      const status = await checkMembershipStatus(user.uid);
      setIsPremium(status.active);
    } catch (error) {
      console.error('Error checking premium status:', error);
      setIsPremium(false);
    }
    setCheckingMembership(false);
  };

  const loadSmartLinks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Filter smart links by creator if artistOnly mode
      let q;
      if (artistOnly) {
        q = query(
          collection(db, 'smartLinks'),
          where('createdBy', '==', user.uid)
        );
      } else {
        q = query(
          collection(db, 'smartLinks'),
          orderBy('createdAt', 'desc')
        );
      }
      const snapshot = await getDocs(q);
      let links = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort in memory if artistOnly (to avoid composite index requirement)
      if (artistOnly) {
        links = links.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime; // desc order
        });
      }

      setSmartLinks(links);
    } catch (error) {
      console.error('Error loading smart links:', error);
    }
    setLoading(false);
  };

  const loadContent = async () => {
    try {
      if (artistOnly && !user) return;

      // Load songs - filter by artist if artistOnly mode
      let songsQuery = collection(db, 'songs');
      if (artistOnly) {
        songsQuery = query(songsQuery, where('uploadedBy', '==', user.uid));
      }
      const songsSnapshot = await getDocs(songsQuery);
      setSongs(songsSnapshot.docs.map(doc => {
        const data = doc.data();
        const { id: _, ...restData } = data; // Remove id field from data if it exists
        return { id: doc.id, ...restData }; // Use document ID
      }));

      // Load artists - only current artist if artistOnly mode
      if (artistOnly) {
        const artistDoc = await getDocs(query(collection(db, 'artists'), where('__name__', '==', user.uid)));
        setArtists(artistDoc.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.data().artistName || doc.id,
          ...doc.data()
        })));
      } else {
        const artistsSnapshot = await getDocs(collection(db, 'artists'));
        setArtists(artistsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.data().artistName || doc.id,
          ...doc.data()
        })));
      }

      // Load albums - filter by artist if artistOnly mode
      let albumsQuery = collection(db, 'albums');
      if (artistOnly) {
        albumsQuery = query(albumsQuery, where('artistId', '==', user.uid));
      }
      const albumsSnapshot = await getDocs(albumsQuery);
      setAlbums(albumsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Load playlists - filter by artist if artistOnly mode
      let playlistsQuery = collection(db, 'playlists');
      if (artistOnly) {
        playlistsQuery = query(playlistsQuery, where('createdBy', '==', user.uid));
      }
      const playlistsSnapshot = await getDocs(playlistsQuery);
      setPlaylists(playlistsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Load campaigns - filter by artist if artistOnly mode
      let campaignsQuery = collection(db, 'campaigns');
      if (artistOnly) {
        campaignsQuery = query(campaignsQuery, where('artistId', '==', user.uid));
      }
      const campaignsSnapshot = await getDocs(campaignsQuery);
      setCampaigns(campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
      } else if (linkType === 'album') {
        const album = albums.find(a => a.id === targetId);
        targetName = album?.albumTitle || album?.title || 'Unknown Album';
      } else if (linkType === 'artist') {
        const artist = artists.find(a => a.id === targetId);
        targetName = artist?.name || 'Unknown Artist';
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
      setSnackbar({ open: true, message: 'Link copied to clipboard!', severity: 'success' });
    } catch (error) {
      console.error('Error copying link:', error);
      setSnackbar({ open: true, message: 'Failed to copy link', severity: 'error' });
    }
  };

  const handleEditClick = (link) => {
    setEditingLink(link);
    setLinkType(link.type);
    setTargetId(link.targetId);
    setCampaignId(link.campaignId || '');
    setCustomSlug(link.slug);
  };

  const handleCancelEdit = () => {
    setEditingLink(null);
    setLinkType('song');
    setTargetId('');
    setCampaignId('');
    setCustomSlug('');
  };

  const handleUpdateSmartLink = async () => {
    if (!targetId) {
      setSnackbar({ open: true, message: 'Please select a target', severity: 'error' });
      return;
    }

    setCreating(true);
    try {
      // Get target name for display
      let targetName = '';
      if (linkType === 'song') {
        const song = songs.find(s => s.id === targetId);
        targetName = song?.title || 'Unknown Song';
      } else if (linkType === 'album') {
        const album = albums.find(a => a.id === targetId);
        targetName = album?.albumTitle || album?.title || 'Unknown Album';
      } else if (linkType === 'artist') {
        const artist = artists.find(a => a.id === targetId);
        targetName = artist?.name || 'Unknown Artist';
      } else if (linkType === 'playlist') {
        const playlist = playlists.find(p => p.id === targetId);
        targetName = playlist?.name || 'Unknown Playlist';
      }

      const updateData = {
        type: linkType,
        targetId,
        targetName,
        campaignId: campaignId || null,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'smartLinks', editingLink.id), updateData);

      setSnackbar({ open: true, message: 'Smart link updated successfully!', severity: 'success' });

      // Reset form
      handleCancelEdit();

      // Reload links
      loadSmartLinks();
    } catch (error) {
      console.error('Error updating smart link:', error);
      setSnackbar({ open: true, message: 'Failed to update smart link', severity: 'error' });
    }
    setCreating(false);
  };

  const handleDeleteClick = (link) => {
    setLinkToDelete(link);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!linkToDelete) return;

    try {
      await deleteDoc(doc(db, 'smartLinks', linkToDelete.id));
      setSnackbar({ open: true, message: 'Smart link deleted successfully!', severity: 'success' });
      setDeleteConfirmOpen(false);
      setLinkToDelete(null);
      loadSmartLinks();
    } catch (error) {
      console.error('Error deleting smart link:', error);
      setSnackbar({ open: true, message: 'Failed to delete smart link', severity: 'error' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setLinkToDelete(null);
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

      {/* Create/Edit Smart Link */}
      <Card sx={{ mb: 4, bgcolor: '#181818' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
            {editingLink ? <EditIcon /> : <Add />} {editingLink ? 'Edit Smart Link' : 'Create New Smart Link'}
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel shrink sx={{ color: '#b3b3b3', bgcolor: '#181818', px: 1 }}>Link Type</InputLabel>
                <Select
                  value={linkType}
                  onChange={(e) => {
                    setLinkType(e.target.value);
                    setTargetId('');
                  }}
                  notched
                  sx={{
                    color: '#fff',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: '#404040' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1db954' }
                  }}
                >
                  <MenuItem value="song">Song</MenuItem>
                  <MenuItem value="album">Album</MenuItem>
                  <MenuItem value="artist">Artist</MenuItem>
                  <MenuItem value="playlist">Playlist</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel shrink sx={{ color: '#b3b3b3', bgcolor: '#181818', px: 1 }}>Target {linkType.charAt(0).toUpperCase() + linkType.slice(1)}</InputLabel>
                <Select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  notched
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 400,
                      },
                    },
                  }}
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
                  {linkType === 'album' && albums.map(album => (
                    <MenuItem key={album.id} value={album.id}>
                      {album.albumTitle || album.title} - {album.artistName || album.artist}
                    </MenuItem>
                  ))}
                  {linkType === 'artist' && artists.map(artist => (
                    <MenuItem key={artist.id} value={artist.id}>
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
              <FormControl fullWidth disabled={!isPremium}>
                <InputLabel shrink sx={{ color: '#b3b3b3', bgcolor: '#181818', px: 1 }}>
                  Campaign {!isPremium && '(Premium Only)'}
                </InputLabel>
                <Select
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  notched
                  sx={{
                    color: '#fff',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: '#404040' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1db954' }
                  }}
                >
                  <MenuItem value="">None</MenuItem>
                  {isPremium && campaigns.map(campaign => (
                    <MenuItem key={campaign.id} value={campaign.id}>
                      {campaign.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {!isPremium && (
                <Alert severity="info" sx={{ mt: 1, bgcolor: '#0a0a0a', fontSize: '0.75rem', py: 0 }}>
                  Upgrade to Premium to create and track campaigns
                </Alert>
              )}
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Custom Slug (Optional)"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="my-custom-link"
                disabled={!!editingLink}
                sx={{
                  '& .MuiInputBase-root': { color: '#fff' },
                  '& .MuiInputLabel-root': { color: '#b3b3b3' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#404040' }
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LinkIcon sx={{ color: '#b3b3b3' }} /></InputAdornment>
                }}
                helperText={editingLink ? "Slug cannot be changed" : ""}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={editingLink ? handleUpdateSmartLink : handleCreateSmartLink}
                  disabled={creating || !targetId}
                  startIcon={creating ? <CircularProgress size={20} /> : (editingLink ? <EditIcon /> : <Add />)}
                  sx={{
                    bgcolor: '#1db954',
                    '&:hover': { bgcolor: '#1ed760' },
                    '&:disabled': { bgcolor: '#404040' }
                  }}
                >
                  {creating ? (editingLink ? 'Updating...' : 'Creating...') : (editingLink ? 'Update Smart Link' : 'Create Smart Link')}
                </Button>
                {editingLink && (
                  <Button
                    variant="outlined"
                    onClick={handleCancelEdit}
                    sx={{
                      borderColor: '#404040',
                      color: '#fff',
                      '&:hover': { borderColor: '#1db954', bgcolor: 'rgba(29, 185, 84, 0.1)' }
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </Box>
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
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(link)}
                            sx={{ color: '#3b82f6' }}
                            title="Edit smart link"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(link)}
                            sx={{ color: '#ef4444' }}
                            title="Delete smart link"
                          >
                            <DeleteIcon fontSize="small" />
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: { bgcolor: '#181818', color: '#fff' }
        }}
      >
        <DialogTitle>Delete Smart Link?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this smart link?
          </Typography>
          {linkToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#0a0a0a', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                <strong>Target:</strong> {linkToDelete.targetName}
              </Typography>
              <Typography variant="body2" sx={{ color: '#b3b3b3', mt: 1, wordBreak: 'break-all' }}>
                <strong>URL:</strong> {linkToDelete.url}
              </Typography>
            </Box>
          )}
          <Alert severity="warning" sx={{ mt: 2, bgcolor: '#0a0a0a' }}>
            This action cannot be undone. The link will stop working immediately.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} sx={{ color: '#fff' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{
              bgcolor: '#ef4444',
              '&:hover': { bgcolor: '#dc2626' }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for success/error messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
