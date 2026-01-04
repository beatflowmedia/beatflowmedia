// src/components/admin/ContentManagement.js
// Admin component to manage published content - unpublish/takedown for copyright violations
import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Typography,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import {
  VisibilityOff,
  Visibility,
  MusicNote,
  Album as AlbumIcon,
  Search,
  Delete
} from '@mui/icons-material';
import { db } from '../../firebaseConfig';
import { collection, query, getDocs, doc, updateDoc, where, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useModal } from '../../hooks/useModal';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} role="tabpanel">
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ContentManagement() {
  const { showConfirm } = useModal();
  const [activeTab, setActiveTab] = useState(0);
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [filteredAlbums, setFilteredAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Unpublish dialog state
  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState('');
  const [unpublishReason, setUnpublishReason] = useState('');
  const [unpublishNotes, setUnpublishNotes] = useState('');

  useEffect(() => {
    loadContent();
  }, []);

  useEffect(() => {
    filterContent();
  }, [searchQuery, statusFilter, songs, albums]);

  const loadContent = async () => {
    try {
      setLoading(true);

      // Load all songs
      const songsSnapshot = await getDocs(collection(db, 'songs'));
      const songsData = songsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id, // Firestore document ID (override any numeric id from old data)
          legacyId: data.id // Preserve the old numeric ID if it exists
        };
      });
      setSongs(songsData);

      // Load all albums
      const albumsSnapshot = await getDocs(collection(db, 'albums'));
      const albumsData = albumsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id, // Firestore document ID
          legacyId: data.id // Preserve the old numeric ID if it exists
        };
      });
      setAlbums(albumsData);

      console.log('Loaded content:', songsData.length, 'songs,', albumsData.length, 'albums');
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const filterContent = () => {
    const query = searchQuery.toLowerCase();

    // Filter songs
    let filtered = songs.filter(song => {
      const matchesSearch = !query ||
        song.title?.toLowerCase().includes(query) ||
        song.artist?.toLowerCase().includes(query) ||
        song.genre?.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'visible' && song.isVisible !== false) ||
        (statusFilter === 'hidden' && song.isVisible === false);

      return matchesSearch && matchesStatus;
    });
    setFilteredSongs(filtered);

    // Filter albums
    filtered = albums.filter(album => {
      const matchesSearch = !query ||
        album.title?.toLowerCase().includes(query) ||
        album.artist?.toLowerCase().includes(query) ||
        album.genre?.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'visible' && album.isVisible !== false) ||
        (statusFilter === 'hidden' && album.isVisible === false);

      return matchesSearch && matchesStatus;
    });
    setFilteredAlbums(filtered);
  };

  const handleOpenUnpublishDialog = (item, itemType) => {
    setSelectedItem(item);
    setSelectedItemType(itemType);
    setUnpublishReason('');
    setUnpublishNotes('');
    setUnpublishDialogOpen(true);
  };

  const handleUnpublish = async () => {
    if (!selectedItem || !unpublishReason) {
      toast.error('Please select a reason for unpublishing');
      return;
    }

    // Validate item ID
    if (!selectedItem.id || typeof selectedItem.id !== 'string') {
      console.error('Invalid item ID:', selectedItem);
      toast.error('Invalid item - missing or invalid ID');
      return;
    }

    try {
      const collectionName = selectedItemType === 'song' ? 'songs' : 'albums';
      console.log('Unpublishing:', collectionName, selectedItem.id);
      const itemRef = doc(db, collectionName, selectedItem.id);

      // Update the item to set isVisible: false and add takedown info
      await updateDoc(itemRef, {
        isVisible: false,
        takedownReason: unpublishReason,
        takedownNotes: unpublishNotes,
        takedownDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // If unpublishing an album, also hide all its tracks
      if (selectedItemType === 'album') {
        const albumSongsQuery = query(
          collection(db, 'songs'),
          where('albumId', '==', selectedItem.id)
        );
        const albumSongsSnapshot = await getDocs(albumSongsQuery);

        if (albumSongsSnapshot.size > 0) {
          const updatePromises = albumSongsSnapshot.docs.map(songDoc =>
            updateDoc(doc(db, 'songs', songDoc.id), {
              isVisible: false,
              takedownReason: `Album takedown: ${unpublishReason}`,
              takedownNotes: unpublishNotes,
              takedownDate: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
          );
          await Promise.all(updatePromises);
          toast.success(`Album and ${albumSongsSnapshot.size} song(s) unpublished`);
        }
      } else {
        toast.success('Song unpublished successfully');
      }

      // Reload content
      await loadContent();
      setUnpublishDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error unpublishing content:', error);
      toast.error('Failed to unpublish content');
    }
  };

  const handleRepublish = async (item, itemType) => {
    const confirmed = await showConfirm(
      'Republish Content',
      `Are you sure you want to republish this ${itemType}? It will be visible to users again.`,
      'info'
    );

    if (!confirmed) {
      return;
    }

    try {
      const collectionName = itemType === 'song' ? 'songs' : 'albums';
      const itemRef = doc(db, collectionName, item.id);

      await updateDoc(itemRef, {
        isVisible: true,
        takedownReason: null,
        takedownNotes: null,
        takedownDate: null,
        republishedDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // If republishing an album, also show all its tracks
      if (itemType === 'album') {
        const albumSongsQuery = query(
          collection(db, 'songs'),
          where('albumId', '==', item.id)
        );
        const albumSongsSnapshot = await getDocs(albumSongsQuery);

        if (albumSongsSnapshot.size > 0) {
          const updatePromises = albumSongsSnapshot.docs.map(songDoc =>
            updateDoc(doc(db, 'songs', songDoc.id), {
              isVisible: true,
              takedownReason: null,
              takedownNotes: null,
              takedownDate: null,
              republishedDate: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
          );
          await Promise.all(updatePromises);
          toast.success(`Album and ${albumSongsSnapshot.size} song(s) republished`);
        }
      } else {
        toast.success('Song republished successfully');
      }

      await loadContent();
    } catch (error) {
      console.error('Error republishing content:', error);
      toast.error('Failed to republish content');
    }
  };

  const handlePermanentDelete = async (item, itemType) => {
    const firstConfirm = await showConfirm(
      'PERMANENT DELETE',
      `⚠️ Are you sure you want to permanently delete this ${itemType}? This action CANNOT be undone!\n\nItem: "${item.title}"`,
      'error'
    );

    if (!firstConfirm) {
      return;
    }

    const secondConfirm = await showConfirm(
      'Confirm Deletion',
      `This will permanently delete "${item.title}". Are you absolutely sure?`,
      'error'
    );

    if (!secondConfirm) {
      return;
    }

    try {
      const collectionName = itemType === 'song' ? 'songs' : 'albums';
      await deleteDoc(doc(db, collectionName, item.id));

      // If deleting an album, ask about tracks
      if (itemType === 'album') {
        const albumSongsQuery = query(
          collection(db, 'songs'),
          where('albumId', '==', item.id)
        );
        const albumSongsSnapshot = await getDocs(albumSongsQuery);

        if (albumSongsSnapshot.size > 0) {
          const deleteSongs = await showConfirm(
            'Delete Album Songs',
            `Also permanently delete ${albumSongsSnapshot.size} song(s) from this album?`,
            'warning'
          );

          if (deleteSongs) {
            const deletePromises = albumSongsSnapshot.docs.map(songDoc =>
              deleteDoc(doc(db, 'songs', songDoc.id))
            );
            await Promise.all(deletePromises);
            toast.success(`Album and ${albumSongsSnapshot.size} song(s) permanently deleted`);
          } else {
            toast.success('Album deleted (songs kept)');
          }
        }
      } else {
        toast.success('Song permanently deleted');
      }

      await loadContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content');
    }
  };

  return (
    <Box>
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Content Management & Takedown
        </Typography>
        <Typography variant="body2">
          Use this panel to unpublish content that violates platform policies (copyright infringement, ToS violations, etc.).
          Unpublished content is hidden from users but not deleted. You can republish content later if the issue is resolved.
        </Typography>
      </Alert>

      {/* Filters */}
      <Card sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by title, artist, or genre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flex: 1, minWidth: 250 }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="visible">Visible</MenuItem>
              <MenuItem value="hidden">Hidden</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Card>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab label={`Songs (${filteredSongs.length})`} />
        <Tab label={`Albums (${filteredAlbums.length})`} />
      </Tabs>

      {/* Songs Tab */}
      <TabPanel value={activeTab} index={0}>
        <TableContainer component={Card} sx={{ bgcolor: 'background.paper' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cover</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Artist</TableCell>
                <TableCell>Genre</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Loading...</TableCell>
                </TableRow>
              ) : filteredSongs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">No songs found</TableCell>
                </TableRow>
              ) : (
                filteredSongs.map((song) => (
                  <TableRow key={song.id}>
                    <TableCell>
                      <Avatar src={song.coverUrl || song.cover} variant="rounded">
                        <MusicNote />
                      </Avatar>
                    </TableCell>
                    <TableCell>{song.title}</TableCell>
                    <TableCell>{song.artist}</TableCell>
                    <TableCell>{song.genre}</TableCell>
                    <TableCell>
                      {song.isVisible === false ? (
                        <Box>
                          <Chip label="Hidden" color="error" size="small" sx={{ mb: 0.5 }} />
                          {song.takedownReason && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              Reason: {song.takedownReason}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Chip label="Visible" color="success" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {song.isVisible === false ? (
                          <>
                            <Button
                              size="small"
                              startIcon={<Visibility />}
                              onClick={() => handleRepublish(song, 'song')}
                              variant="outlined"
                              color="success"
                            >
                              Republish
                            </Button>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handlePermanentDelete(song, 'song')}
                            >
                              <Delete />
                            </IconButton>
                          </>
                        ) : (
                          <Button
                            size="small"
                            startIcon={<VisibilityOff />}
                            onClick={() => handleOpenUnpublishDialog(song, 'song')}
                            variant="outlined"
                            color="warning"
                          >
                            Unpublish
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Albums Tab */}
      <TabPanel value={activeTab} index={1}>
        <TableContainer component={Card} sx={{ bgcolor: 'background.paper' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cover</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Artist</TableCell>
                <TableCell>Tracks</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Loading...</TableCell>
                </TableRow>
              ) : filteredAlbums.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">No albums found</TableCell>
                </TableRow>
              ) : (
                filteredAlbums.map((album) => (
                  <TableRow key={album.id}>
                    <TableCell>
                      <Avatar src={album.coverUrl} variant="rounded">
                        <AlbumIcon />
                      </Avatar>
                    </TableCell>
                    <TableCell>{album.title}</TableCell>
                    <TableCell>{album.artist}</TableCell>
                    <TableCell>{album.trackCount || 0} tracks</TableCell>
                    <TableCell>
                      {album.isVisible === false ? (
                        <Box>
                          <Chip label="Hidden" color="error" size="small" sx={{ mb: 0.5 }} />
                          {album.takedownReason && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              Reason: {album.takedownReason}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Chip label="Visible" color="success" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {album.isVisible === false ? (
                          <>
                            <Button
                              size="small"
                              startIcon={<Visibility />}
                              onClick={() => handleRepublish(album, 'album')}
                              variant="outlined"
                              color="success"
                            >
                              Republish
                            </Button>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handlePermanentDelete(album, 'album')}
                            >
                              <Delete />
                            </IconButton>
                          </>
                        ) : (
                          <Button
                            size="small"
                            startIcon={<VisibilityOff />}
                            onClick={() => handleOpenUnpublishDialog(album, 'album')}
                            variant="outlined"
                            color="warning"
                          >
                            Unpublish
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Unpublish Dialog */}
      <Dialog
        open={unpublishDialogOpen}
        onClose={() => setUnpublishDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Unpublish {selectedItemType === 'song' ? 'Song' : 'Album'}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            This will hide the {selectedItemType} from all users. The content will not be deleted and can be republished later.
            {selectedItemType === 'album' && ' All songs in this album will also be hidden.'}
          </Alert>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {selectedItemType === 'song' ? 'Song' : 'Album'}: <strong>{selectedItem?.title}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Artist: {selectedItem?.artist}
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Reason for Takedown *</InputLabel>
            <Select
              value={unpublishReason}
              onChange={(e) => setUnpublishReason(e.target.value)}
              label="Reason for Takedown *"
              required
            >
              <MenuItem value="copyright">Copyright Infringement</MenuItem>
              <MenuItem value="dmca">DMCA Takedown Request</MenuItem>
              <MenuItem value="tos">Terms of Service Violation</MenuItem>
              <MenuItem value="inappropriate">Inappropriate Content</MenuItem>
              <MenuItem value="quality">Quality Issues</MenuItem>
              <MenuItem value="duplicate">Duplicate Content</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Additional Notes"
            value={unpublishNotes}
            onChange={(e) => setUnpublishNotes(e.target.value)}
            placeholder="Provide details about the takedown reason, reference numbers, etc."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnpublishDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleUnpublish}
            disabled={!unpublishReason}
          >
            Unpublish {selectedItemType === 'song' ? 'Song' : 'Album'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
