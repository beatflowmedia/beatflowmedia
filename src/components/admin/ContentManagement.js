// src/components/admin/ContentManagement.js
// Admin component to manage published content - unpublish/takedown for copyright violations
import { useState, useEffect, useCallback } from 'react';
import { SONG_PRICE } from '../../utils/pricing';
import { PLATFORM_OPTIONS } from '../../config/browseCategories';
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
  Tab,
  Checkbox,
  FormControlLabel,
  Switch,
  Grid
} from '@mui/material';
import {
  VisibilityOff,
  Visibility,
  MusicNote,
  Album as AlbumIcon,
  Search,
  Delete,
  Add,
  Edit as EditIcon,
  CloudUpload,
  Save,
  PlayArrow,
  Pause,
  Warning
} from '@mui/icons-material';
import { db, storage } from '../../firebaseConfig';
import { collection, query, getDocs, doc, updateDoc, where, deleteDoc, orderBy, limit, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import { useModal } from '../../hooks/useModal';
import { usePlayerActions } from '../../hooks/usePlayerActions';
import { hasAudioUrl } from '../../utils/audioUtils';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} role="tabpanel">
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ContentManagement() {
  const { showConfirm } = useModal();
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayerActions();
  const [activeTab, setActiveTab] = useState(0);
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [filteredAlbums, setFilteredAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [moodFilter, setMoodFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [useCaseFilter, setUseCaseFilter] = useState('all');

  // Unpublish dialog state
  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState('');
  const [unpublishReason, setUnpublishReason] = useState('');
  const [unpublishNotes, setUnpublishNotes] = useState('');

  // Album Create/Edit dialog state
  const [albumDialogOpen, setAlbumDialogOpen] = useState(false);
  const [albumDialogMode, setAlbumDialogMode] = useState('create'); // 'create' or 'edit'
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [albumForm, setAlbumForm] = useState({
    title: '',
    artist: '',
    artistName: '',
    cover: '',
    coverUrl: '',
    genre: '',
    releaseDate: '',
    trackCount: 0,
    isAlbum: true // Mark as album project by default
  });

  // Bulk selection state
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [selectedAlbums, setSelectedAlbums] = useState([]);

  // Song Edit dialog state
  const [songDialogOpen, setSongDialogOpen] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [songForm, setSongForm] = useState({
    title: '',
    artist: '',
    mainGenre: '',
    subGenre: '',
    bpm: '',
    mood: [],
    platforms: [],
    duration: 0,
    price: SONG_PRICE, // Default to $29.00
    loopable: false,
    explicit: false
  });
  const [newCoverFile, setNewCoverFile] = useState(null);
  const [newAudioFile, setNewAudioFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  const loadContent = async () => {
    try {
      setLoading(true);

      // Load songs with limit for performance (admin can paginate for more)
      const songsQuery = query(
        collection(db, 'songs'),
        orderBy('createdAt', 'desc'),
        limit(500) // Reasonable limit for admin dashboard, add pagination if needed
      );
      const songsSnapshot = await getDocs(songsQuery);
      const songsData = songsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id, // Firestore document ID (override any numeric id from old data)
          legacyId: data.id // Preserve the old numeric ID if it exists
        };
      });
      setSongs(songsData);

      // Load albums with limit for performance
      const albumsQuery = query(
        collection(db, 'albums'),
        orderBy('createdAt', 'desc'),
        limit(200) // Reasonable limit for admin dashboard
      );
      const albumsSnapshot = await getDocs(albumsQuery);
      const albumsData = albumsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id, // Firestore document ID
          legacyId: data.id // Preserve the old numeric ID if it exists
        };
      });
      setAlbums(albumsData);

      console.log('Loaded content:', songsData.length, 'songs (max 500),', albumsData.length, 'albums (max 200)');
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const filterContent = useCallback(() => {
    const query = searchQuery.toLowerCase();

    // Filter songs
    let filtered = songs.filter(song => {
      const matchesSearch = !query ||
        song.title?.toLowerCase().includes(query) ||
        song.artist?.toLowerCase().includes(query) ||
        song.genre?.toLowerCase().includes(query) ||
        song.mainGenre?.toLowerCase().includes(query) ||
        song.subGenre?.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'visible' && song.isVisible !== false) ||
        (statusFilter === 'hidden' && song.isVisible === false);

      const matchesMood = moodFilter === 'all' ||
        (Array.isArray(song.mood) && song.mood.some(m => m.toLowerCase() === moodFilter.toLowerCase())) ||
        (typeof song.mood === 'string' && song.mood.toLowerCase() === moodFilter.toLowerCase());

      const matchesGenre = genreFilter === 'all' ||
        song.genre?.toLowerCase() === genreFilter.toLowerCase() ||
        song.mainGenre?.toLowerCase() === genreFilter.toLowerCase() ||
        song.subGenre?.toLowerCase() === genreFilter.toLowerCase();

      const matchesUseCase = useCaseFilter === 'all' ||
        (Array.isArray(song.useCase) && song.useCase.some(uc => uc.toLowerCase() === useCaseFilter.toLowerCase())) ||
        (typeof song.useCase === 'string' && song.useCase.toLowerCase() === useCaseFilter.toLowerCase()) ||
        (Array.isArray(song.categories) && song.categories.some(cat => cat.toLowerCase() === useCaseFilter.toLowerCase()));

      return matchesSearch && matchesStatus && matchesMood && matchesGenre && matchesUseCase;
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

      const matchesGenre = genreFilter === 'all' ||
        album.genre?.toLowerCase() === genreFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesGenre;
    });
    setFilteredAlbums(filtered);
  }, [searchQuery, statusFilter, moodFilter, genreFilter, useCaseFilter, songs, albums]);

  useEffect(() => {
    // Set up real-time listeners for songs and albums
    setLoading(true);

    // Listen to songs collection (no orderBy to avoid index requirement)
    const songsQuery = query(
      collection(db, 'songs'),
      limit(500)
    );

    const unsubscribeSongs = onSnapshot(songsQuery, (snapshot) => {
      const songsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          legacyId: data.id
        };
      });

      // Sort client-side by createdAt
      songsData.sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(0);
        const bDate = b.createdAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      });

      setSongs(songsData);
      console.log('🎵 Songs updated:', songsData.length);
    }, (error) => {
      console.error('Error listening to songs:', error);
      toast.error('Failed to load songs');
    });

    // Listen to albums collection (no orderBy to avoid index requirement)
    const albumsQuery = query(
      collection(db, 'albums'),
      limit(200)
    );

    const unsubscribeAlbums = onSnapshot(albumsQuery, (snapshot) => {
      const albumsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          legacyId: data.id
        };
      });

      // Sort client-side by createdAt
      albumsData.sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(0);
        const bDate = b.createdAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      });

      setAlbums(albumsData);
      setLoading(false);
      console.log('💿 Albums updated:', albumsData.length);
    }, (error) => {
      console.error('Error listening to albums:', error);
      toast.error('Failed to load albums');
      setLoading(false);
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeSongs();
      unsubscribeAlbums();
    };
  }, []);

  useEffect(() => {
    filterContent();
  }, [filterContent]);

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

  const handleOpenCreateAlbumDialog = () => {
    setAlbumDialogMode('create');
    setEditingAlbum(null);
    setAlbumForm({
      title: '',
      artist: '',
      artistName: '',
      cover: '/images/Logo.png',
      coverUrl: '',
      genre: '',
      releaseDate: new Date().toISOString().split('T')[0],
      trackCount: 0,
      isAlbum: true // Mark as album project
    });
    setAlbumDialogOpen(true);
  };

  const handleOpenEditAlbumDialog = (album) => {
    setAlbumDialogMode('edit');
    setEditingAlbum(album);
    setAlbumForm({
      title: album.title || '',
      artist: album.artist || album.artistName || '',
      artistName: album.artist || album.artistName || '',
      cover: album.cover || album.coverUrl || '/images/Logo.png',
      coverUrl: album.coverUrl || album.cover || '',
      genre: album.genre || '',
      releaseDate: album.releaseDate || new Date().toISOString().split('T')[0],
      trackCount: album.trackCount || 0,
      isAlbum: album.isAlbum === true // Preserve existing isAlbum value
    });
    setAlbumDialogOpen(true);
  };

  const handleAlbumFormChange = (field, value) => {
    setAlbumForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAlbum = async () => {
    if (!albumForm.title || !albumForm.artist) {
      toast.error('Title and Artist are required');
      return;
    }

    try {
      const albumData = {
        title: albumForm.title,
        artist: albumForm.artist,
        artistName: albumForm.artist,
        cover: albumForm.cover || '/images/Logo.png',
        coverUrl: albumForm.cover || '/images/Logo.png',
        genre: albumForm.genre || '',
        releaseDate: albumForm.releaseDate || new Date().toISOString().split('T')[0],
        trackCount: parseInt(albumForm.trackCount) || 0,
        isAlbum: albumForm.isAlbum === true, // Use toggle value
        isVisible: true,
        updatedAt: serverTimestamp()
      };

      if (albumDialogMode === 'create') {
        // Create new album project (metadata only - files uploaded via Content Ingestion)
        albumData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'albums'), albumData);
        toast.success(`Album project "${albumForm.title}" created. Upload tracks via Content Ingestion tab.`);
        console.log('Created album with ID:', docRef.id);
      } else {
        // Update existing album
        await updateDoc(doc(db, 'albums', editingAlbum.id), albumData);
        toast.success(`Album "${albumForm.title}" updated successfully`);
      }

      setAlbumDialogOpen(false);
      await loadContent();
    } catch (error) {
      console.error('Error saving album:', error);
      toast.error(`Failed to ${albumDialogMode === 'create' ? 'create' : 'update'} album`);
    }
  };

  // Bulk selection handlers
  const handleToggleSong = (songId) => {
    setSelectedSongs(prev =>
      prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId]
    );
  };

  const handleToggleAlbum = (albumId) => {
    setSelectedAlbums(prev =>
      prev.includes(albumId) ? prev.filter(id => id !== albumId) : [...prev, albumId]
    );
  };

  const handleSelectAllSongs = () => {
    if (selectedSongs.length === filteredSongs.length) {
      setSelectedSongs([]);
    } else {
      setSelectedSongs(filteredSongs.map(song => song.id));
    }
  };

  const handleSelectAllAlbums = () => {
    if (selectedAlbums.length === filteredAlbums.length) {
      setSelectedAlbums([]);
    } else {
      setSelectedAlbums(filteredAlbums.map(album => album.id));
    }
  };

  const handleBulkUnpublish = async (itemType) => {
    const items = itemType === 'song' ? selectedSongs : selectedAlbums;
    if (items.length === 0) return;

    const confirmed = await showConfirm(
      'Bulk Unpublish',
      `Are you sure you want to unpublish ${items.length} ${itemType}(s)? They will be hidden from users but not deleted.`,
      'warning'
    );

    if (!confirmed) return;

    try {
      const collectionName = itemType === 'song' ? 'songs' : 'albums';
      const updatePromises = items.map(itemId =>
        updateDoc(doc(db, collectionName, itemId), {
          isVisible: false,
          takedownReason: 'other',
          takedownNotes: 'Bulk unpublish action',
          takedownDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      );

      await Promise.all(updatePromises);
      toast.success(`Successfully unpublished ${items.length} ${itemType}(s)`);

      // Clear selection and reload
      if (itemType === 'song') {
        setSelectedSongs([]);
      } else {
        setSelectedAlbums([]);
      }
      await loadContent();
    } catch (error) {
      console.error('Error bulk unpublishing:', error);
      toast.error('Failed to unpublish some items');
    }
  };

  const handleBulkDelete = async (itemType) => {
    const items = itemType === 'song' ? selectedSongs : selectedAlbums;
    if (items.length === 0) return;

    const firstConfirm = await showConfirm(
      'BULK PERMANENT DELETE',
      `⚠️ Are you sure you want to permanently delete ${items.length} ${itemType}(s)? This action CANNOT be undone!`,
      'error'
    );

    if (!firstConfirm) return;

    const secondConfirm = await showConfirm(
      'Confirm Bulk Deletion',
      `This will permanently delete ${items.length} ${itemType}(s). Are you absolutely sure?`,
      'error'
    );

    if (!secondConfirm) return;

    try {
      const collectionName = itemType === 'song' ? 'songs' : 'albums';
      const deletePromises = items.map(itemId =>
        deleteDoc(doc(db, collectionName, itemId))
      );

      await Promise.all(deletePromises);
      toast.success(`Successfully deleted ${items.length} ${itemType}(s)`);

      // Clear selection and reload
      if (itemType === 'song') {
        setSelectedSongs([]);
      } else {
        setSelectedAlbums([]);
      }
      await loadContent();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Failed to delete some items');
    }
  };

  // Song editing handlers
  const handleOpenEditSongDialog = (song) => {
    setEditingSong(song);
    setSongForm({
      title: song.title || '',
      artist: song.artist || '',
      mainGenre: song.mainGenre || '',
      subGenre: song.subGenre || '',
      bpm: song.bpm || '',
      mood: song.mood || [],
      platforms: song.platforms || [],
      duration: song.duration || 0,
      price: song.price || SONG_PRICE, // Default to $29.00 if not set
      loopable: song.loopable || false,
      explicit: song.explicit || false
    });
    setCoverPreview(song.cover || song.coverUrl || '');
    setNewCoverFile(null);
    setNewAudioFile(null);
    setSongDialogOpen(true);
  };

  const handleSongFormChange = (field, value) => {
    setSongForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        e.target.value = null;
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        e.target.value = null;
        return;
      }

      // Clean up old preview URL if exists
      if (newCoverFile && coverPreview.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreview);
      }

      const previewUrl = URL.createObjectURL(file);
      setNewCoverFile(file);
      setCoverPreview(previewUrl);
      toast.success('Cover image selected');

      // Reset input so same file can be selected again
      e.target.value = null;
    }
  };

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast.error('Please select an audio file');
        e.target.value = null;
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Audio file must be less than 50MB');
        e.target.value = null;
        return;
      }

      // Get duration
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      audio.src = url;
      audio.onloadedmetadata = () => {
        handleSongFormChange('duration', Math.floor(audio.duration));
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        toast.error('Could not read audio file');
        URL.revokeObjectURL(url);
      };

      setNewAudioFile(file);
      toast.success(`Audio file selected: ${file.name}`);

      // Reset input
      e.target.value = null;
    }
  };

  const handleSaveSong = async () => {
    if (!songForm.title || !songForm.artist) {
      toast.error('Title and Artist are required');
      return;
    }

    if (!editingSong || !editingSong.id) {
      toast.error('Invalid song - missing ID');
      console.error('editingSong:', editingSong);
      return;
    }

    try {
      setSaving(true);
      setUploadProgress(0);
      console.log('Saving song:', editingSong.id);

      const updates = {
        title: songForm.title.trim(),
        artist: songForm.artist.trim(),
        mainGenre: songForm.mainGenre || '',
        subGenre: songForm.subGenre || '',
        bpm: songForm.bpm ? parseInt(songForm.bpm) : null,
        mood: songForm.mood || [],
        platforms: songForm.platforms || [],
        loopable: songForm.loopable || false,
        explicit: songForm.explicit || false,
        price: songForm.price ? parseInt(songForm.price) : 0,
        duration: songForm.duration || 0,
        updatedAt: serverTimestamp()
      };

      // Upload new cover if provided
      if (newCoverFile) {
        console.log('Uploading new cover...');
        setUploadProgress(10);
        const coverRef = ref(storage, `songs/covers/${editingSong.id}_${Date.now()}.jpg`);
        await uploadBytes(coverRef, newCoverFile);
        const coverUrl = await getDownloadURL(coverRef);
        updates.cover = coverUrl;
        updates.coverUrl = coverUrl;
        console.log('Cover uploaded:', coverUrl);
      }
      setUploadProgress(50);

      // Upload new audio if provided
      if (newAudioFile) {
        console.log('Uploading new audio...');
        const audioRef = ref(storage, `songs/audio/${editingSong.id}_${Date.now()}.mp3`);
        await uploadBytes(audioRef, newAudioFile);
        const audioUrl = await getDownloadURL(audioRef);
        updates.url = audioUrl;
        updates.audioUrl = audioUrl;
        console.log('Audio uploaded:', audioUrl);
      }
      setUploadProgress(80);

      // Update Firestore
      console.log('Updating Firestore with:', updates);
      await updateDoc(doc(db, 'songs', editingSong.id), updates);
      setUploadProgress(100);

      console.log('Song updated successfully');
      toast.success('Track updated successfully!');
      setSongDialogOpen(false);

      // Clear form state
      setEditingSong(null);
      setNewCoverFile(null);
      setNewAudioFile(null);
      setCoverPreview('');
    } catch (error) {
      console.error('Error updating track:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      toast.error(`Failed to update track: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
      setUploadProgress(0);
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
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
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
          <Button
            variant="outlined"
            onClick={loadContent}
            disabled={loading}
            startIcon={loading ? <CloudUpload /> : <CloudUpload />}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </Box>

        {/* Additional Filters Row */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Genre</InputLabel>
            <Select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              label="Genre"
            >
              <MenuItem value="all">All Genres</MenuItem>
              <MenuItem value="hip-hop">Hip-Hop</MenuItem>
              <MenuItem value="trap">Trap</MenuItem>
              <MenuItem value="r&b">R&B</MenuItem>
              <MenuItem value="pop">Pop</MenuItem>
              <MenuItem value="electronic">Electronic</MenuItem>
              <MenuItem value="rock">Rock</MenuItem>
              <MenuItem value="jazz">Jazz</MenuItem>
              <MenuItem value="classical">Classical</MenuItem>
              <MenuItem value="country">Country</MenuItem>
              <MenuItem value="reggae">Reggae</MenuItem>
              <MenuItem value="latin">Latin</MenuItem>
              <MenuItem value="afrobeat">Afrobeat</MenuItem>
              <MenuItem value="lo-fi">Lo-Fi</MenuItem>
              <MenuItem value="ambient">Ambient</MenuItem>
              <MenuItem value="drill">Drill</MenuItem>
              <MenuItem value="soul">Soul</MenuItem>
              <MenuItem value="funk">Funk</MenuItem>
              <MenuItem value="indie">Indie</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Mood</InputLabel>
            <Select
              value={moodFilter}
              onChange={(e) => setMoodFilter(e.target.value)}
              label="Mood"
            >
              <MenuItem value="all">All Moods</MenuItem>
              <MenuItem value="energetic">Energetic</MenuItem>
              <MenuItem value="chill">Chill</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
              <MenuItem value="uplifting">Uplifting</MenuItem>
              <MenuItem value="emotional">Emotional</MenuItem>
              <MenuItem value="aggressive">Aggressive</MenuItem>
              <MenuItem value="melancholic">Melancholic</MenuItem>
              <MenuItem value="happy">Happy</MenuItem>
              <MenuItem value="sad">Sad</MenuItem>
              <MenuItem value="intense">Intense</MenuItem>
              <MenuItem value="relaxing">Relaxing</MenuItem>
              <MenuItem value="motivational">Motivational</MenuItem>
              <MenuItem value="romantic">Romantic</MenuItem>
              <MenuItem value="mysterious">Mysterious</MenuItem>
              <MenuItem value="playful">Playful</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Use Case</InputLabel>
            <Select
              value={useCaseFilter}
              onChange={(e) => setUseCaseFilter(e.target.value)}
              label="Use Case"
            >
              <MenuItem value="all">All Use Cases</MenuItem>
              <MenuItem value="youtube">YouTube</MenuItem>
              <MenuItem value="podcast">Podcast</MenuItem>
              <MenuItem value="social-media">Social Media</MenuItem>
              <MenuItem value="advertising">Advertising</MenuItem>
              <MenuItem value="film">Film & Video</MenuItem>
              <MenuItem value="gaming">Gaming</MenuItem>
              <MenuItem value="streaming">Streaming</MenuItem>
              <MenuItem value="vlogs">Vlogs</MenuItem>
              <MenuItem value="corporate">Corporate</MenuItem>
              <MenuItem value="events">Events</MenuItem>
              <MenuItem value="background-music">Background Music</MenuItem>
              <MenuItem value="workout">Workout</MenuItem>
              <MenuItem value="study">Study</MenuItem>
              <MenuItem value="meditation">Meditation</MenuItem>
            </Select>
          </FormControl>

          {(genreFilter !== 'all' || moodFilter !== 'all' || useCaseFilter !== 'all') && (
            <Button
              variant="text"
              onClick={() => {
                setGenreFilter('all');
                setMoodFilter('all');
                setUseCaseFilter('all');
              }}
              sx={{ color: 'warning.main' }}
            >
              Clear Filters
            </Button>
          )}
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
        {selectedSongs.length > 0 && (
          <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
              {selectedSongs.length} song(s) selected
            </Typography>
            <Button
              variant="outlined"
              color="warning"
              onClick={() => handleBulkUnpublish('song')}
              startIcon={<VisibilityOff />}
            >
              Bulk Unpublish
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleBulkDelete('song')}
              startIcon={<Delete />}
            >
              Bulk Delete
            </Button>
          </Box>
        )}
        <TableContainer component={Card} sx={{ bgcolor: 'background.paper' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={filteredSongs.length > 0 && selectedSongs.length === filteredSongs.length}
                    indeterminate={selectedSongs.length > 0 && selectedSongs.length < filteredSongs.length}
                    onChange={handleSelectAllSongs}
                  />
                </TableCell>
                <TableCell width="60"></TableCell>
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
                  <TableCell colSpan={8} align="center">Loading...</TableCell>
                </TableRow>
              ) : filteredSongs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">No songs found</TableCell>
                </TableRow>
              ) : (
                filteredSongs.map((song) => (
                  <TableRow key={song.id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedSongs.includes(song.id)}
                        onChange={() => handleToggleSong(song.id)}
                      />
                    </TableCell>
                    <TableCell>
                      {hasAudioUrl(song) ? (
                        <IconButton
                          size="small"
                          onClick={() => {
                            console.log('[ContentManagement] Play button clicked for:', song.title);
                            console.log('[ContentManagement] Song object:', song);
                            console.log('[ContentManagement] Audio URLs:', {
                              url: song.url,
                              audioUrl: song.audioUrl,
                              src: song.src,
                              streamUrl: song.streamUrl
                            });
                            if (currentSong?.id === song.id) {
                              console.log('[ContentManagement] Toggling play for current song');
                              togglePlay();
                            } else {
                              console.log('[ContentManagement] Playing new song:', song.id);
                              playSong(song);
                            }
                          }}
                          sx={{ color: currentSong?.id === song.id ? '#1DB954' : 'text.secondary' }}
                        >
                          {currentSong?.id === song.id && isPlaying ? <Pause /> : <PlayArrow />}
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          disabled
                          title="No audio file"
                          sx={{ color: 'warning.main' }}
                        >
                          <Warning fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                    <TableCell>
                      <Avatar src={song.coverUrl || song.cover} variant="rounded">
                        <MusicNote />
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      {song.title}
                      {!hasAudioUrl(song) && (
                        <Chip
                          label="Missing Audio"
                          size="small"
                          color="warning"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{song.artist}</TableCell>
                    <TableCell>{song.genre || song.mainGenre || '-'}</TableCell>
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
                          <>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenEditSongDialog(song)}
                              title="Edit Song"
                            >
                              <EditIcon />
                            </IconButton>
                            <Button
                              size="small"
                              startIcon={<VisibilityOff />}
                              onClick={() => handleOpenUnpublishDialog(song, 'song')}
                              variant="outlined"
                              color="warning"
                            >
                              Unpublish
                            </Button>
                          </>
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
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          {selectedAlbums.length > 0 ? (
            <>
              <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                {selectedAlbums.length} album(s) selected
              </Typography>
              <Button
                variant="outlined"
                color="warning"
                onClick={() => handleBulkUnpublish('album')}
                startIcon={<VisibilityOff />}
              >
                Bulk Unpublish
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleBulkDelete('album')}
                startIcon={<Delete />}
              >
                Bulk Delete
              </Button>
            </>
          ) : (
            <>
              <Box sx={{ flexGrow: 1 }} />
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleOpenCreateAlbumDialog}
                sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
              >
                Create Album
              </Button>
            </>
          )}
        </Box>
        <TableContainer component={Card} sx={{ bgcolor: 'background.paper' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={filteredAlbums.length > 0 && selectedAlbums.length === filteredAlbums.length}
                    indeterminate={selectedAlbums.length > 0 && selectedAlbums.length < filteredAlbums.length}
                    onChange={handleSelectAllAlbums}
                  />
                </TableCell>
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
                  <TableCell colSpan={7} align="center">Loading...</TableCell>
                </TableRow>
              ) : filteredAlbums.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">No albums found</TableCell>
                </TableRow>
              ) : (
                filteredAlbums.map((album) => (
                  <TableRow key={album.id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedAlbums.includes(album.id)}
                        onChange={() => handleToggleAlbum(album.id)}
                      />
                    </TableCell>
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
                          <>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenEditAlbumDialog(album)}
                              title="Edit Album"
                            >
                              <EditIcon />
                            </IconButton>
                            <Button
                              size="small"
                              startIcon={<VisibilityOff />}
                              onClick={() => handleOpenUnpublishDialog(album, 'album')}
                              variant="outlined"
                              color="warning"
                            >
                              Unpublish
                            </Button>
                          </>
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

      {/* Create/Edit Album Dialog */}
      <Dialog
        open={albumDialogOpen}
        onClose={() => setAlbumDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {albumDialogMode === 'create' ? 'Create New Album Project' : 'Edit Album'}
        </DialogTitle>
        <DialogContent>
          {albumDialogMode === 'create' && (
            <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
              <strong>Note:</strong> This creates album metadata only. To upload audio files,
              go to <strong>Content Ingestion</strong> tab, enable "Batch Processing", toggle "Is Album",
              and upload your tracks. They'll automatically link to this album.
            </Alert>
          )}
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Album Title *"
              value={albumForm.title}
              onChange={(e) => handleAlbumFormChange('title', e.target.value)}
              required
            />

            <TextField
              fullWidth
              label="Artist Name *"
              value={albumForm.artist}
              onChange={(e) => handleAlbumFormChange('artist', e.target.value)}
              required
            />

            <TextField
              fullWidth
              label="Genre"
              value={albumForm.genre}
              onChange={(e) => handleAlbumFormChange('genre', e.target.value)}
              placeholder="e.g., Hip-Hop, Rock, Electronic"
            />

            <TextField
              fullWidth
              label="Album Cover URL"
              value={albumForm.cover}
              onChange={(e) => handleAlbumFormChange('cover', e.target.value)}
              placeholder="/images/Logo.png or https://..."
              helperText="Leave blank to use default logo"
            />

            <TextField
              fullWidth
              label="Release Date"
              type="date"
              value={albumForm.releaseDate}
              onChange={(e) => handleAlbumFormChange('releaseDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label="Track Count"
              type="number"
              value={albumForm.trackCount}
              onChange={(e) => handleAlbumFormChange('trackCount', e.target.value)}
              helperText="Number of tracks in this album"
              inputProps={{ min: 0 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={albumForm.isAlbum === true}
                  onChange={(e) => handleAlbumFormChange('isAlbum', e.target.checked)}
                  color="primary"
                />
              }
              label="Album Project (shows on /projects page)"
            />

            {albumForm.cover && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Cover Preview:
                </Typography>
                <Avatar
                  src={albumForm.cover}
                  variant="rounded"
                  sx={{ width: 200, height: 200 }}
                >
                  <AlbumIcon sx={{ fontSize: 100 }} />
                </Avatar>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlbumDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveAlbum}
            disabled={!albumForm.title || !albumForm.artist}
            sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
          >
            {albumDialogMode === 'create' ? 'Create Album' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Song Dialog */}
      <Dialog
        open={songDialogOpen}
        onClose={() => setSongDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Track</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              {/* Cover Art */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Cover Art</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={coverPreview}
                    sx={{ width: 100, height: 100 }}
                    variant="rounded"
                    key={coverPreview}
                  >
                    <MusicNote />
                  </Avatar>
                  <Box>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUpload />}
                    >
                      Upload New Cover
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleCoverChange}
                      />
                    </Button>
                    {newCoverFile && (
                      <Typography variant="caption" display="block" sx={{ mt: 1, color: 'success.main' }}>
                        ✓ New cover selected: {newCoverFile.name}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>

              {/* Audio File */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Audio File</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                  >
                    Upload New Audio
                    <input
                      type="file"
                      hidden
                      accept="audio/*"
                      onChange={handleAudioChange}
                    />
                  </Button>
                  {newAudioFile && (
                    <Chip
                      label={newAudioFile.name}
                      onDelete={() => setNewAudioFile(null)}
                      color="success"
                    />
                  )}
                </Box>
              </Grid>

              {/* Basic Info */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Track Title"
                  value={songForm.title}
                  onChange={(e) => handleSongFormChange('title', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Artist Name"
                  value={songForm.artist}
                  onChange={(e) => handleSongFormChange('artist', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Main Genre"
                  value={songForm.mainGenre}
                  onChange={(e) => handleSongFormChange('mainGenre', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Sub Genre"
                  value={songForm.subGenre}
                  onChange={(e) => handleSongFormChange('subGenre', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="BPM"
                  value={songForm.bpm}
                  onChange={(e) => handleSongFormChange('bpm', e.target.value)}
                  inputProps={{ min: 60, max: 200 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Duration (seconds)"
                  value={songForm.duration}
                  onChange={(e) => handleSongFormChange('duration', parseInt(e.target.value))}
                  disabled
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Price (cents)"
                  value={songForm.price}
                  onChange={(e) => handleSongFormChange('price', e.target.value)}
                  helperText={songForm.price ? `$${(songForm.price / 100).toFixed(2)}` : ''}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Optimized For Platforms</InputLabel>
                  <Select
                    multiple
                    value={songForm.platforms || []}
                    label="Optimized For Platforms"
                    onChange={(e) => handleSongFormChange('platforms', e.target.value)}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={PLATFORM_OPTIONS.find((p) => p.value === value)?.label || value}
                            size="small"
                            color="primary"
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {PLATFORM_OPTIONS.map((platform) => (
                      <MenuItem key={platform.value} value={platform.value}>
                        <Checkbox checked={(songForm.platforms || []).indexOf(platform.value) > -1} />
                        {platform.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={songForm.loopable}
                      onChange={(e) => handleSongFormChange('loopable', e.target.checked)}
                    />
                  }
                  label="Loopable"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={songForm.explicit}
                      onChange={(e) => handleSongFormChange('explicit', e.target.checked)}
                    />
                  }
                  label="Explicit Content"
                />
              </Grid>

              {/* Upload Progress */}
              {saving && uploadProgress > 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Uploading... {uploadProgress}%
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSongDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSong}
            disabled={saving || !songForm.title || !songForm.artist}
            startIcon={<Save />}
            sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
