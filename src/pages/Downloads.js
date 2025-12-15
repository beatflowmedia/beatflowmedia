// src/pages/Downloads.js
// User downloads page - shows all purchased content with download licenses
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  LinearProgress
} from '@mui/material';
import {
  Download,
  Home,
  Receipt,
  MusicNote,
  Album as AlbumIcon,
  Info
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { stripeService } from '../services/stripeService';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import JSZip from 'jszip';

export default function Downloads() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState(null);
  const [albumDownloadDialog, setAlbumDownloadDialog] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const loadData = async () => {
      await loadPurchases();
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user's purchases
      const purchasesQuery = query(
        collection(db, 'purchases'),
        where('userId', '==', user.uid),
        where('status', '==', 'completed')
      );

      const purchasesSnapshot = await getDocs(purchasesQuery);

      // Enrich purchase data with item details
      const enrichedPurchases = await Promise.all(
        purchasesSnapshot.docs.map(async (purchaseDoc) => {
          const purchaseData = { id: purchaseDoc.id, ...purchaseDoc.data() };

          // Get item details (song or album)
          let itemDetails = null;
          if (purchaseData.itemType === 'song') {
            const songDoc = await getDoc(doc(db, 'songs', purchaseData.itemId));
            if (songDoc.exists()) {
              itemDetails = { id: songDoc.id, ...songDoc.data() };
            }
          } else if (purchaseData.itemType === 'album') {
            const albumDoc = await getDoc(doc(db, 'albums', purchaseData.itemId));
            if (albumDoc.exists()) {
              itemDetails = { id: albumDoc.id, ...albumDoc.data() };

              // Get all songs in album
              const songsQuery = query(
                collection(db, 'songs'),
                where('albumId', '==', purchaseData.itemId)
              );
              const songsSnapshot = await getDocs(songsQuery);
              itemDetails.songs = songsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
            }
          }

          return {
            ...purchaseData,
            itemDetails,
            purchasedAt: purchaseData.purchasedAt?.toDate?.() || new Date()
          };
        })
      );

      // Sort by purchase date (newest first)
      enrichedPurchases.sort((a, b) => b.purchasedAt - a.purchasedAt);

      setPurchases(enrichedPurchases);
    } catch (err) {
      console.error('Error loading purchases:', err);
      setError('Failed to load your purchases');
    } finally {
      setLoading(false);
    }
  };

  const downloadFileAsBlob = async (url, filename) => {
    // Fetch the file as a blob to force download instead of opening in browser
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch file');
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the blob URL
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
  };

  const handleDownload = async (purchase) => {
    try {
      setDownloading(purchase.id);

      if (purchase.itemType === 'song') {
        // Download single song
        const downloadData = await stripeService.getDownloadLink(user.uid, purchase.itemId);
        await stripeService.recordDownload(user.uid, purchase.itemId);

        // Fetch and download as blob to force download instead of opening in browser
        await downloadFileAsBlob(downloadData.url, downloadData.filename);

        toast.success('Download started!');
      } else if (purchase.itemType === 'album') {
        // For albums, show confirmation dialog
        setAlbumDownloadDialog(purchase);
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download: ${error.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleAlbumDownload = async () => {
    const purchase = albumDownloadDialog;
    if (!purchase || !purchase.itemDetails?.songs) {
      toast.error('Album songs not found');
      setAlbumDownloadDialog(null);
      return;
    }

    try {
      setDownloading(purchase.id);
      const songs = purchase.itemDetails.songs.sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));
      setDownloadProgress({ current: 0, total: songs.length });

      // Create a new ZIP file
      const zip = new JSZip();
      const albumFolder = zip.folder(purchase.itemDetails.title || 'Album');

      // Download all songs and add to ZIP
      for (let i = 0; i < songs.length; i++) {
        const song = songs[i];
        setDownloadProgress({ current: i + 1, total: songs.length });

        try {
          // Get download link for each song
          const downloadData = await stripeService.getDownloadLink(user.uid, song.id);
          await stripeService.recordDownload(user.uid, song.id);

          // Fetch the song file as blob
          const response = await fetch(downloadData.url);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${song.title}`);
          }
          const blob = await response.blob();

          // Add to ZIP with track number prefix
          const trackNumber = String(song.trackNumber || i + 1).padStart(2, '0');
          const filename = `${trackNumber} - ${song.title}.mp3`;
          albumFolder.file(filename, blob);

        } catch (songError) {
          console.error(`Error downloading song ${song.title}:`, songError);
          toast.error(`Failed to add ${song.title} to download`);
        }
      }

      // Generate the ZIP file
      toast.info('Creating ZIP file...');
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Download the ZIP file
      const zipFilename = `${purchase.itemDetails.title || 'Album'} - ${purchase.itemDetails.artistName || 'Unknown'}.zip`;
      const blobUrl = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = zipFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success(`Downloaded album with ${songs.length} songs!`);
      setAlbumDownloadDialog(null);
      setDownloadProgress({ current: 0, total: 0 });
    } catch (error) {
      console.error('Album download error:', error);
      toast.error(`Failed to download album: ${error.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const generateLicenseId = (purchase) => {
    // Generate a unique license ID based on purchase data
    const timestamp = purchase.purchasedAt.getTime();
    const hash = btoa(`${user.uid}-${purchase.itemId}-${timestamp}`).substring(0, 16);
    return `LIC-${hash.toUpperCase()}`;
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#121212', color: 'white', py: 8 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              My Downloads
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Home />}
              onClick={() => navigate('/')}
              sx={{ color: 'white', borderColor: 'grey.600' }}
            >
              Home
            </Button>
          </Box>
          <Typography variant="body1" color="grey.400">
            Access all your purchased music and download licenses
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Statistics */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <Card sx={{ bgcolor: '#1a1a1a', flex: 1 }}>
            <CardContent>
              <Typography variant="body2" color="grey.400" gutterBottom>
                Total Purchases
              </Typography>
              <Typography variant="h4" sx={{ color: 'white' }}>
                {purchases.length}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ bgcolor: '#1a1a1a', flex: 1 }}>
            <CardContent>
              <Typography variant="body2" color="grey.400" gutterBottom>
                Songs Owned
              </Typography>
              <Typography variant="h4" sx={{ color: 'white' }}>
                {purchases.filter(p => p.itemType === 'song').length}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ bgcolor: '#1a1a1a', flex: 1 }}>
            <CardContent>
              <Typography variant="body2" color="grey.400" gutterBottom>
                Albums Owned
              </Typography>
              <Typography variant="h4" sx={{ color: 'white' }}>
                {purchases.filter(p => p.itemType === 'album').length}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {purchases.length === 0 ? (
          <Card sx={{ bgcolor: '#1a1a1a', p: 6, textAlign: 'center' }}>
            <MusicNote sx={{ fontSize: 80, color: 'grey.600', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No purchases yet
            </Typography>
            <Typography variant="body1" color="grey.400" sx={{ mb: 3 }}>
              Start building your music collection today!
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
            >
              Browse Music
            </Button>
          </Card>
        ) : (
          <TableContainer component={Paper} sx={{ bgcolor: '#1a1a1a' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#282828' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Item</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Artist</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Price</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Purchased</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>License ID</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow
                    key={purchase.id}
                    sx={{
                      '&:hover': { bgcolor: '#282828' },
                      borderBottom: '1px solid #282828'
                    }}
                  >
                    <TableCell>
                      <Chip
                        icon={purchase.itemType === 'song' ? <MusicNote /> : <AlbumIcon />}
                        label={purchase.itemType}
                        size="small"
                        sx={{
                          bgcolor: purchase.itemType === 'song' ? '#1DB954' : '#1E88E5',
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography
                          onClick={() => navigate(`/${purchase.itemType}/${purchase.itemId}`)}
                          sx={{
                            color: 'white',
                            fontWeight: 500,
                            cursor: 'pointer',
                            '&:hover': {
                              textDecoration: 'underline',
                              color: '#1DB954'
                            }
                          }}
                        >
                          {purchase.itemDetails?.title || purchase.itemName || 'Unknown'}
                        </Typography>
                        {purchase.itemType === 'album' && purchase.itemDetails?.songs && (
                          <Typography variant="caption" color="grey.400">
                            {purchase.itemDetails.songs.length} songs
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: 'grey.400' }}>
                        {purchase.itemDetails?.artistName || purchase.artistName || 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: 'white', fontWeight: 500 }}>
                        ${purchase.price.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="grey.400">
                        {purchase.purchasedAt.toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Click to copy license ID">
                        <Chip
                          label={generateLicenseId(purchase)}
                          size="small"
                          icon={<Receipt />}
                          onClick={() => {
                            navigator.clipboard.writeText(generateLicenseId(purchase));
                            toast.success('License ID copied to clipboard!');
                          }}
                          sx={{
                            bgcolor: '#2a2a2a',
                            color: 'grey.400',
                            cursor: 'pointer',
                            fontFamily: 'monospace'
                          }}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={downloading === purchase.id ? <CircularProgress size={16} /> : <Download />}
                        onClick={() => handleDownload(purchase)}
                        disabled={downloading === purchase.id}
                        sx={{
                          bgcolor: '#1DB954',
                          '&:hover': { bgcolor: '#1ed760' }
                        }}
                      >
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* License Information */}
        {purchases.length > 0 && (
          <Card sx={{ bgcolor: '#1a1a1a', mt: 4, p: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Info sx={{ color: '#1DB954', mt: 0.5 }} />
              <Box>
                <Typography variant="h6" gutterBottom>
                  About Your Download Licenses
                </Typography>
                <Typography variant="body2" color="grey.400" paragraph>
                  Each purchase includes a unique license ID that proves your right to download and use this content.
                  Keep your license IDs for your records.
                </Typography>
                <Typography variant="body2" color="grey.400">
                  • Downloads are DRM-free<br />
                  • You can re-download anytime from this page<br />
                  • License IDs are generated based on your purchase transaction
                </Typography>
              </Box>
            </Box>
          </Card>
        )}

        {/* Album Download Dialog */}
        <Dialog
          open={!!albumDownloadDialog}
          onClose={() => !downloading && setAlbumDownloadDialog(null)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { bgcolor: '#1a1a1a', color: 'white' }
          }}
        >
          <DialogTitle>Download Album</DialogTitle>
          <DialogContent>
            {downloadProgress.total > 0 ? (
              <Box>
                <Typography variant="body2" color="grey.400" gutterBottom>
                  Adding song {downloadProgress.current} of {downloadProgress.total} to ZIP...
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(downloadProgress.current / downloadProgress.total) * 100}
                  sx={{
                    mt: 2,
                    bgcolor: '#2a2a2a',
                    '& .MuiLinearProgress-bar': { bgcolor: '#1DB954' }
                  }}
                />
                <Typography variant="caption" color="grey.400" sx={{ mt: 1, display: 'block' }}>
                  {Math.round((downloadProgress.current / downloadProgress.total) * 100)}% complete
                </Typography>
                <Typography variant="caption" color="grey.500" sx={{ mt: 1, display: 'block' }}>
                  Please wait, creating your album download...
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="body1" gutterBottom>
                  {albumDownloadDialog?.itemDetails?.title}
                </Typography>
                <Typography variant="body2" color="grey.400" gutterBottom>
                  by {albumDownloadDialog?.itemDetails?.artistName}
                </Typography>
                <Typography variant="body2" color="grey.400" sx={{ mt: 2 }}>
                  This will download all {albumDownloadDialog?.itemDetails?.songs?.length} songs as a single ZIP file.
                  Perfect for mobile devices and easy organization!
                </Typography>
                {albumDownloadDialog?.itemDetails?.songs && (
                  <Box sx={{ mt: 2, maxHeight: 200, overflow: 'auto' }}>
                    <Typography variant="caption" color="grey.400" sx={{ mb: 1, display: 'block' }}>
                      Songs:
                    </Typography>
                    <List dense>
                      {albumDownloadDialog.itemDetails.songs
                        .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0))
                        .map((song, idx) => (
                          <ListItem key={song.id} sx={{ py: 0.5 }}>
                            <ListItemText
                              primary={`${idx + 1}. ${song.title}`}
                              primaryTypographyProps={{
                                variant: 'body2',
                                sx: { color: 'grey.300' }
                              }}
                            />
                          </ListItem>
                        ))}
                    </List>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {downloadProgress.total === 0 && (
              <>
                <Button
                  onClick={() => setAlbumDownloadDialog(null)}
                  sx={{ color: 'grey.400' }}
                  disabled={downloading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAlbumDownload}
                  variant="contained"
                  startIcon={<Download />}
                  disabled={downloading}
                  sx={{
                    bgcolor: '#1DB954',
                    '&:hover': { bgcolor: '#1ed760' }
                  }}
                >
                  Download as ZIP
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
