// getDocs import removed - not currently used but needed for future collaborator functionality
import React, { useState, useEffect, useCallback } from 'react';
import {
  Avatar,
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Skeleton
} from '@mui/material';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Pause from '@mui/icons-material/Pause';
import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import ThumbUp from '@mui/icons-material/ThumbUp';
import ThumbUpOffAlt from '@mui/icons-material/ThumbUpOffAlt';
import MoreVert from '@mui/icons-material/MoreVert';
import Share from '@mui/icons-material/Share';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import AddToPlaylistButton from '../utils/AddToPlaylistButton';
import ShareButton from '../utils/ShareButton';
import PurchaseButton from '../components/PurchaseButton';
import PlayingIndicator from '../components/PlayingIndicator';
import Add from '@mui/icons-material/Add';
import People from '@mui/icons-material/People';
import PersonAdd from '@mui/icons-material/PersonAdd';
import QueueMusic from '@mui/icons-material/QueueMusic';
import Shuffle from '@mui/icons-material/Shuffle';
import MusicNote from '@mui/icons-material/MusicNote';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import Search from '@mui/icons-material/Search';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { useLikes } from '../context/LikesContext';
import { useFavorites } from '../context/FavoritesContext';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import { stripeService } from '../services/stripeService';

const SORT_OPTIONS = [
  { label: 'Custom Order', value: 'custom' },
  { label: 'Recently Added', value: 'dateAdded' },
  { label: 'Alphabetical', value: 'alphabetical' },
  { label: 'Artist', value: 'artist' },
  { label: 'Duration', value: 'duration' },
  { label: 'Popularity', value: 'popularity' }
];

function Playlist() {
  const { id: playlistId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, actions } = usePlayer();
  const { user } = useAuth();
  const { addLike, removeLike, isLiked: checkIsLiked } = useLikes();
  const { addFavorite, removeFavorite, isFavorited: checkIsFavorited } = useFavorites();

  // Playlist state
  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPrivatePlaylist, setIsPrivatePlaylist] = useState(true);

  // UI state
  const [isOwner, setIsOwner] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);

  // Helper to get correct playlist reference
  const getPlaylistRef = () => {
    if (!user?.uid || !playlistId) return null;
    return isPrivatePlaylist
      ? doc(db, 'users', user.uid, 'playlists', playlistId)
      : doc(db, 'playlists', playlistId);
  };
  const [sortBy, setSortBy] = useState('custom');
  const [filterQuery, setFilterQuery] = useState('');

  // Modal states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [, setShareDialogOpen] = useState(false);
  const [, setCollaboratorDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Menu states
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);

  // Form states
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    isPublic: false,
    allowCollaboration: false
  });
  const [newImage, setNewImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Collaborator email state removed - will be needed when collaborator dialog is implemented
  // const [collaboratorEmail, setCollaboratorEmail] = useState('');

  // Load playlist data
  useEffect(() => {
    if (!playlistId || !user?.uid) {
      console.log('No playlistId or user');
      return;
    }

    console.log('=== LOADING PLAYLIST ===', playlistId);
    let unsubscribePrivate;
    let unsubscribePublic;
    let mounted = true;

    // Helper function to load tracks
    async function loadTracks(snapshot) {
      if (!mounted) return;
      const data = snapshot.data();
      const playlistEntries = data?.songs || [];
      console.log('Playlist entries received:', playlistEntries.length);

      // Fetch full song data from songs collection (DRY - single source of truth)
      const fullSongs = await Promise.all(
        playlistEntries.map(async (entry) => {
          // Handle both old format (full song object) and new format (just songId)
          const songId = entry.songId || entry.id;
          const addedAt = entry.addedAt;

          if (!songId) {
            console.error('Playlist entry missing songId:', entry);
            return null;
          }

          try {
            const songDoc = await getDoc(doc(db, 'songs', String(songId)));

            if (songDoc.exists()) {
              const songData = songDoc.data();
              return {
                id: songDoc.id,
                ...songData,
                addedAt: addedAt || entry.addedAt || new Date()
              };
            } else {
              console.error('Song not found in Firestore:', songId);
              return null;
            }
          } catch (err) {
            console.error('Error fetching song:', songId, err);
            return null;
          }
        })
      );

      // Filter out null entries (failed fetches)
      const validSongs = fullSongs.filter(song => song !== null);
      console.log('Loaded', validSongs.length, 'songs from Firestore');

      setTracks(validSongs);
    }

    const setupListeners = async () => {
      if (!mounted) return;
      setLoading(true);
      setError(null);

      console.log('Setting up dual collection listeners...');

      // Listen to BOTH collections simultaneously
      // Private collection listener
      const privateRef = doc(db, 'users', user.uid, 'playlists', playlistId);
      unsubscribePrivate = onSnapshot(
        privateRef,
        async (snapshot) => {
          if (!mounted) return;

          if (snapshot.exists()) {
            // Playlist is in private collection
            console.log('✅ Playlist found in PRIVATE collection');
            setIsPrivatePlaylist(true);

            const playlistData = { id: snapshot.id, ...snapshot.data() };
            console.log('Playlist:', playlistData.name, '(private)');
            setPlaylist(playlistData);
            setIsOwner(true);
            setIsCollaborator(false);

            setEditForm({
              name: playlistData.name,
              description: playlistData.description || '',
              isPublic: playlistData.isPublic || false,
              allowCollaboration: playlistData.allowCollaboration || false
            });

            // Load and display tracks
            await loadTracks(snapshot);
            setLoading(false);
          }
        },
        (error) => {
          console.error('Private listener error:', error);
        }
      );

      // Public collection listener
      const publicRef = doc(db, 'playlists', playlistId);
      unsubscribePublic = onSnapshot(
        publicRef,
        async (snapshot) => {
          if (!mounted) return;

          if (snapshot.exists()) {
            // Playlist is in public collection
            console.log('✅ Playlist found in PUBLIC collection');
            setIsPrivatePlaylist(false);

            const playlistData = { id: snapshot.id, ...snapshot.data() };
            console.log('Playlist:', playlistData.name, '(public)');
            setPlaylist(playlistData);

            // Check if user is owner
            const isUserOwner = playlistData.creatorId === user.uid;
            setIsOwner(isUserOwner);
            setIsCollaborator(false);

            setEditForm({
              name: playlistData.name,
              description: playlistData.description || '',
              isPublic: playlistData.isPublic || false,
              allowCollaboration: playlistData.allowCollaboration || false
            });

            // Load and display tracks
            await loadTracks(snapshot);
            setLoading(false);
          } else if (!playlist) {
            // Only set error if we haven't found it in either collection
            setError('Playlist not found');
            setLoading(false);
            // Auto-redirect back to library after 1 second
            setTimeout(() => {
              navigate('/');
            }, 1000);
          }
        },
        (error) => {
          console.error('Public listener error:', error);
        }
      );
    };

    setupListeners();

    return () => {
      mounted = false;
      if (unsubscribePrivate) {
        console.log('Cleaning up private playlist listener');
        unsubscribePrivate();
      }
      if (unsubscribePublic) {
        console.log('Cleaning up public playlist listener');
        unsubscribePublic();
      }
    };
  }, [playlistId, user?.uid]);

  // Filter and sort tracks
  const filteredAndSortedTracks = React.useMemo(() => {
    let filtered = tracks;

    // Apply filter
    if (filterQuery) {
      const query = filterQuery.toLowerCase();
      filtered = tracks.filter(track =>
        track.title?.toLowerCase().includes(query) ||
        track.artist?.toLowerCase().includes(query) ||
        track.album?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortBy === 'custom') {
      return filtered.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'dateAdded':
          return new Date(b.addedAt || 0) - new Date(a.addedAt || 0);
        case 'alphabetical':
          return (a.title || '').localeCompare(b.title || '');
        case 'artist':
          return (a.artist || '').localeCompare(b.artist || '');
        case 'duration':
          return (b.duration || 0) - (a.duration || 0);
        case 'popularity':
          return (b.playCount || 0) - (a.playCount || 0);
        default:
          return 0;
      }
    });
  }, [tracks, filterQuery, sortBy]);

  // Calculate playlist stats
  const playlistStats = React.useMemo(() => {
    const totalDuration = tracks.reduce((sum, track) => {
      const duration = track.duration || 0;
      return sum + duration;
    }, 0);
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);

    console.log('📊 Playlist Stats:', {
      trackCount: tracks.length,
      totalDuration,
      formattedDuration: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
      tracksWithDuration: tracks.filter(t => t.duration).length
    });

    return {
      trackCount: tracks.length,
      totalDuration: totalDuration,
      formattedDuration: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
      followers: playlist?.followers || 0,
      plays: tracks.reduce((sum, track) => sum + (track.playCount || 0), 0)
    };
  }, [tracks, playlist]);

  // Check if we're currently playing this playlist
  const isPlayingThisPlaylist = React.useMemo(() => {
    const currentTrack = state.queue[state.currentIndex];
    return currentTrack && tracks.some(t => t.id === currentTrack.id) && state.isPlaying;
  }, [state.queue, state.currentIndex, state.isPlaying, tracks]);

  // Event handlers
  const handlePlayPlaylist = useCallback(() => {
    if (tracks.length === 0) return;

    // If already playing this playlist, just toggle pause
    const currentTrack = state.queue[state.currentIndex];
    const isThisPlaylist = currentTrack && tracks.some(t => t.id === currentTrack.id);

    if (isThisPlaylist && state.isPlaying) {
      dispatch({ type: actions.TOGGLE_PLAY });
      return;
    } else if (isThisPlaylist && !state.isPlaying) {
      dispatch({ type: actions.TOGGLE_PLAY });
      return;
    }

    // Otherwise, set entire playlist as queue and start playing
    dispatch({
      type: actions.SET_QUEUE,
      payload: {
        queue: tracks,
        currentIndex: 0
      }
    });

    // Only toggle if not already playing
    if (!state.isPlaying) {
      dispatch({ type: actions.TOGGLE_PLAY });
    }
  }, [tracks, dispatch, actions, state.isPlaying, state.queue, state.currentIndex]);

  const handleShufflePlay = useCallback(() => {
    if (tracks.length === 0) return;

    // Shuffle tracks and start playing
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    dispatch({
      type: actions.SET_QUEUE,
      payload: {
        queue: shuffled,
        currentIndex: 0
      }
    });

    // Only toggle if already playing, otherwise ensure it starts
    if (!state.isPlaying) {
      dispatch({ type: actions.TOGGLE_PLAY });
    }
  }, [tracks, dispatch, actions, state.isPlaying]);

  const handlePlayTrack = useCallback((track, index) => {
    // Set playlist as queue starting from selected track
    dispatch({
      type: actions.SET_QUEUE,
      payload: {
        queue: filteredAndSortedTracks,
        currentIndex: index
      }
    });

    // Always start playing when clicking a track
    if (!state.isPlaying) {
      dispatch({ type: actions.TOGGLE_PLAY });
    }
  }, [filteredAndSortedTracks, dispatch, actions, state.isPlaying]);

  const handleToggleLike = useCallback(async (track) => {
    if (!user) {
      toast.error('Please sign in to like songs');
      return;
    }

    try {
      const liked = checkIsLiked(track.id);
      if (liked) {
        await removeLike(track.id);
        toast.success('Removed from liked songs');
      } else {
        await addLike(track.id);
        toast.success('Added to liked songs');
      }
    } catch (err) {
      toast.error('Failed to update likes');
    }
  }, [user, checkIsLiked, addLike, removeLike]);

  const handleToggleFavorite = useCallback(async (track) => {
    if (!user) {
      toast.error('Please sign in to favorite songs');
      return;
    }

    try {
      const favorited = checkIsFavorited(track.id);
      if (favorited) {
        await removeFavorite(track.id);
        toast.success('Removed from favorites');
      } else {
        await addFavorite(track.id);
        toast.success('Added to favorites');
      }
    } catch (err) {
      toast.error('Failed to update favorites');
    }
  }, [user, checkIsFavorited, addFavorite, removeFavorite]);

  const handlePurchaseTrack = useCallback(async (track) => {
    setAnchorEl(null);
    if (!user) {
      toast.error('Please sign in to purchase music');
      return;
    }

    try {
      const hasPurchased = await stripeService.hasPurchasedSong(user.uid, track.id);
      if (hasPurchased) {
        toast.info('You already own this song! Redirecting to downloads...');
        navigate('/downloads');
        return;
      }

      await stripeService.createSongCheckout(user.uid, track.id, user.email);
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(`Failed to initiate purchase: ${error.message}`);
    }
  }, [user, navigate]);

  const handleEditPlaylist = async () => {
    if (!isOwner || !user?.uid) return;

    try {
      let imageUrl = playlist?.imageUrl;

      // Upload new image if provided
      if (newImage) {
        const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const { storage } = await import('../firebaseConfig');
        const timestamp = Date.now();
        const storageRef = ref(storage, `users/${user.uid}/playlist-covers/${timestamp}_${newImage.name}`);
        await uploadBytes(storageRef, newImage);
        imageUrl = await getDownloadURL(storageRef);
        console.log('✅ Playlist image uploaded:', imageUrl);
      }

      // Check if privacy setting changed
      const privacyChanged = editForm.isPublic !== !isPrivatePlaylist;
      const newIsPrivate = !editForm.isPublic;

      if (privacyChanged) {
        // Privacy changed - need to move playlist between collections
        console.log('Privacy changed:', isPrivatePlaylist ? 'private → public' : 'public → private');

        const { deleteDoc } = await import('firebase/firestore');

        // Get current playlist data
        const currentRef = getPlaylistRef();
        if (!currentRef) return;

        const currentDoc = await getDoc(currentRef);
        if (!currentDoc.exists()) {
          toast.error('Playlist not found');
          return;
        }

        const playlistData = currentDoc.data();

        // Create in new location
        if (newIsPrivate) {
          // Moving to private (users/{uid}/playlists/)
          const privateRef = doc(db, 'users', user.uid, 'playlists', playlistId);
          await setDoc(privateRef, {
            ...playlistData,
            name: editForm.name,
            description: editForm.description,
            allowCollaboration: editForm.allowCollaboration,
            ...(imageUrl && { imageUrl }),
            isPrivate: true,
            updatedAt: serverTimestamp()
          });
          // Delete from public collection
          await deleteDoc(currentRef);
          setIsPrivatePlaylist(true);
        } else {
          // Moving to public (/playlists/)
          const publicRef = doc(db, 'playlists', playlistId);
          await setDoc(publicRef, {
            ...playlistData,
            name: editForm.name,
            description: editForm.description,
            allowCollaboration: editForm.allowCollaboration,
            ...(imageUrl && { imageUrl }),
            creatorId: user.uid,
            isPrivate: false,
            updatedAt: serverTimestamp()
          });
          // Delete from private collection
          await deleteDoc(currentRef);
          setIsPrivatePlaylist(false);
        }
      } else {
        // No privacy change - just update in current location
        const playlistRef = getPlaylistRef();
        if (!playlistRef) return;

        await updateDoc(playlistRef, {
          name: editForm.name,
          description: editForm.description,
          allowCollaboration: editForm.allowCollaboration,
          ...(imageUrl && { imageUrl }),
          updatedAt: serverTimestamp()
        });
      }

      setPlaylist(prev => ({
        ...prev,
        ...editForm,
        imageUrl,
        updatedAt: new Date()
      }));

      setEditDialogOpen(false);
      setNewImage(null);
      setImagePreview(null);
      toast.success('Playlist updated successfully');
    } catch (err) {
      console.error('Error updating playlist:', err);
      toast.error('Failed to update playlist');
    }
  };

  const handleDeletePlaylist = async () => {
    if (!isOwner || !user?.uid) return;

    try {
      const playlistRef = getPlaylistRef();
      if (!playlistRef) return;

      // Delete playlist document (songs are stored in the document, not separately)
      await deleteDoc(playlistRef);

      toast.success('Playlist deleted successfully');
      navigate('/playlists');
    } catch (err) {
      console.error('Error deleting playlist:', err);
      toast.error('Failed to delete playlist');
    }
  };

  const handleRemoveTrack = async (track) => {
    if (!isOwner || !user?.uid) return;

    try {
      const playlistRef = getPlaylistRef();
      if (!playlistRef) return;

      // Remove song from the songs array
      const updatedSongs = tracks.filter((s) => s.id !== track.id);
      await updateDoc(playlistRef, {
        songs: updatedSongs
      });
      toast.success('Track removed from playlist');
    } catch (err) {
      console.error('Error removing track:', err);
      toast.error('Failed to remove track');
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleReorderTracks = async (result) => {
    if (!result.destination || !isOwner || !user?.uid) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    // Reorder tracks locally
    const reorderedTracks = [...tracks];
    const [movedTrack] = reorderedTracks.splice(sourceIndex, 1);
    reorderedTracks.splice(destIndex, 0, movedTrack);

    // Update songs array in database
    try {
      await updateDoc(doc(db, 'users', user.uid, 'playlists', playlistId), {
        songs: reorderedTracks
      });
      toast.success('Playlist order updated');
    } catch (err) {
      console.error('Error reordering tracks:', err);
      toast.error('Failed to update order');
    }
  };

  // Collaborator functionality - currently not used in UI
  // Uncomment when share/collaborator dialogs are implemented
  // const handleAddCollaborator = async () => {
  //   if (!isOwner || !collaboratorEmail) return;
  //
  //   try {
  //     // Find user by email
  //     const usersQuery = query(
  //       collection(db, 'users'),
  //       where('email', '==', collaboratorEmail)
  //     );
  //     const usersSnapshot = await getDocs(usersQuery);
  //
  //     if (usersSnapshot.empty) {
  //       toast.error('User not found');
  //       return;
  //     }
  //
  //     const collaboratorId = usersSnapshot.docs[0].id;
  //
  //     // Add to collaborators
  //     await updateDoc(doc(db, 'playlists', playlistId), {
  //       collaborators: arrayUnion(collaboratorId)
  //     });
  //
  //     setCollaboratorEmail('');
  //     setCollaboratorDialogOpen(false);
  //     toast.success('Collaborator added successfully');
  //   } catch (err) {
  //     console.error('Error adding collaborator:', err);
  //     toast.error('Failed to add collaborator');
  //   }
  // };

  const handleFollowPlaylist = async () => {
    if (!user || isOwner) return;

    try {
      // Note: Following playlists only works for shared/public playlists
      // Since playlists are in user subcollections, this feature may need redesign
      await updateDoc(doc(db, 'users', user.uid), {
        followedPlaylists: arrayUnion(playlistId)
      });

      toast.success('Following playlist');
    } catch (err) {
      console.error('Error following playlist:', err);
      toast.error('Failed to follow playlist');
    }
  };

  // eslint-disable-next-line no-unused-vars
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // eslint-disable-next-line no-unused-vars
  const formatDate = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
          <Skeleton variant="rectangular" width={250} height={250} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={300} height={60} />
            <Skeleton variant="text" width={200} height={30} />
            <Skeleton variant="text" width={400} height={20} />
          </Box>
        </Box>
        {[...Array(8)].map((_, index) => (
          <Skeleton key={index} variant="rectangular" width="100%" height={60} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/playlists')}>
          Back to Playlists
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto', bgcolor: 'grey.900', color: 'white' }}>
      {/* Playlist Header */}
      <Box
        sx={{
          background: `linear-gradient(180deg, rgba(29,185,84,0.8) 0%, rgba(18,18,18,1) 100%)`,
          p: 4,
          pb: 2
        }}
      >
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
          <Card sx={{ width: 250, height: 250, boxShadow: 3, bgcolor: 'grey.800' }}>
            {playlist?.imageUrl || playlist?.coverUrl ? (
              <CardMedia
                component="img"
                height="250"
                image={playlist.imageUrl || playlist.coverUrl}
                alt={playlist?.name}
              />
            ) : (
              <Box
                sx={{
                  width: 250,
                  height: 250,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.800'
                }}
              >
                <MusicNote sx={{ fontSize: 100, color: 'grey.600' }} />
              </Box>
            )}
          </Card>

          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ color: 'white', opacity: 0.8, mb: 1 }}>
              {isPrivatePlaylist ? 'Private Playlist' : 'Public Playlist'}
            </Typography>

            <Typography
              variant="h2"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                background: 'linear-gradient(45deg, #fff, #ccc)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {playlist?.name}
            </Typography>

            {playlist?.description && (
              <Typography variant="body1" sx={{ color: 'grey.300', mb: 2, maxWidth: 600 }}>
                {playlist.description}
              </Typography>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Avatar
                src={playlist?.creatorPhotoURL}
                sx={{ width: 24, height: 24 }}
              >
                {playlist?.creatorName?.[0]}
              </Avatar>
              <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                {playlist?.creatorName}
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.300' }}>
                •
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.300' }}>
                {playlistStats.followers.toLocaleString()} followers
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.300' }}>
                •
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.300' }}>
                {playlistStats.trackCount} songs, {playlistStats.formattedDuration}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={isPlayingThisPlaylist ? <Pause /> : <PlayArrow />}
                onClick={handlePlayPlaylist}
                disabled={tracks.length === 0}
                sx={{
                  bgcolor: '#1DB954',
                  '&:hover': { bgcolor: '#1ed760' },
                  borderRadius: '50px',
                  px: 3
                }}
              >
                {isPlayingThisPlaylist ? 'Pause' : 'Play'}
              </Button>

              <IconButton
                size="large"
                onClick={() => dispatch({ type: actions.TOGGLE_SHUFFLE })}
                disabled={tracks.length === 0}
                sx={{
                  color: state.shuffleOn ? '#1DB954' : 'grey.300',
                  '&:hover': { color: state.shuffleOn ? '#1ed760' : 'white' }
                }}
                title={state.shuffleOn ? 'Disable shuffle' : 'Enable shuffle'}
              >
                <Shuffle />
              </IconButton>

              {!isOwner && user && (
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<PersonAdd />}
                  onClick={handleFollowPlaylist}
                  sx={{
                    borderColor: 'grey.500',
                    color: 'white',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  Follow
                </Button>
              )}

              <IconButton
                size="large"
                onClick={() => setShareDialogOpen(true)}
                sx={{ color: 'grey.300', '&:hover': { color: 'white' } }}
              >
                <Share />
              </IconButton>

              {isOwner && (
                <IconButton
                  size="large"
                  onClick={() => setEditDialogOpen(true)}
                  sx={{ color: 'grey.300', '&:hover': { color: 'white' } }}
                >
                  <Edit />
                </IconButton>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Track List */}
      <Box sx={{ p: 3 }}>
        {/* Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search in playlist..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              size="small"
              sx={{
                minWidth: 250,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'grey.600' },
                  '&:hover fieldset': { borderColor: 'grey.500' },
                  '&.Mui-focused fieldset': { borderColor: '#1DB954' }
                }
              }}
              InputProps={{
                startAdornment: <Search sx={{ color: 'grey.400', mr: 1 }} />
              }}
            />

            <TextField
              select
              label="Sort by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              size="small"
              sx={{ minWidth: 150 }}
              SelectProps={{ native: true }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </TextField>
          </Box>

          <Typography variant="body2" sx={{ color: 'grey.400' }}>
            {filteredAndSortedTracks.length} songs
          </Typography>
        </Box>

        {/* Track List - Same as /artist page */}
        {filteredAndSortedTracks.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filteredAndSortedTracks.map((track, index) => {
              const isCurrentTrack = state.queue[state.currentIndex]?.id === track.id;
              const isPlaying = isCurrentTrack && state.isPlaying;
              const isLiked = checkIsLiked(track.id);
              const isFavorited = checkIsFavorited(track.id);

              return (
                <Card
                  key={track.id}
                  sx={{
                    bgcolor: isCurrentTrack ? '#2a2a2a' : '#1a1a1a',
                    '&:hover': { bgcolor: '#2a2a2a' },
                    cursor: 'pointer',
                    overflow: 'visible'
                  }}
                  onClick={() => handlePlayTrack(track, index)}
                >
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, overflow: 'visible' }}>
                    <Typography sx={{ color: 'grey.500', minWidth: 30 }}>
                      {index + 1}
                    </Typography>
                    <Box sx={{ position: 'relative', width: 40, height: 40 }}>
                      <img
                        src={track.coverUrl || track.cover || '/images/Logo.png'}
                        alt={track.title}
                        style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }}
                      />
                      {isPlaying && (
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(0,0,0,0.6)',
                            borderRadius: 1
                          }}
                        >
                          <PlayingIndicator isPlaying={isPlaying} size="small" />
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ color: 'white', fontWeight: 500 }}>
                        {track.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'grey.400' }}>
                        {track.artist}
                      </Typography>
                    </Box>
                    {/* Purchase Button */}
                    <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', zIndex: 10 }}>
                      <PurchaseButton
                        itemId={track.id}
                        itemType="song"
                        price={track.price || 199}
                        compact={true}
                        artistId={track.artistId}
                        uploadedBy={track.uploadedBy}
                      />
                    </div>
                    {/* Like Button (Thumbs Up) */}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLike(track);
                      }}
                      sx={{
                        color: isLiked ? '#1DB954' : 'grey.400',
                        '&:hover': { color: isLiked ? '#1ed760' : '#1DB954' }
                      }}
                      title={isLiked ? 'Unlike' : 'Like'}
                    >
                      {isLiked ? <ThumbUp fontSize="small" /> : <ThumbUpOffAlt fontSize="small" />}
                    </IconButton>
                    {/* Favorite Button (Heart) */}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(track);
                      }}
                      sx={{
                        color: isFavorited ? '#e91e63' : 'grey.400',
                        '&:hover': { color: isFavorited ? '#f06292' : '#e91e63' }
                      }}
                      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {isFavorited ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                    </IconButton>
                    {/* Add to Playlist Button */}
                    <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', zIndex: 10 }}>
                      <AddToPlaylistButton song={track} playlists={[]} addSong={() => {}} />
                    </div>
                    {/* Share Button */}
                    <ShareButton song={track} iconSize="small" />
                    {/* Play/Pause Button */}
                    <IconButton
                      size="small"
                      sx={{ color: '#1db954' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrentTrack && isPlaying) {
                          // If this track is playing, just pause it
                          dispatch({ type: actions.TOGGLE_PLAY });
                        } else if (isCurrentTrack && !isPlaying) {
                          // If this track is paused, resume it
                          dispatch({ type: actions.TOGGLE_PLAY });
                        } else {
                          // Different track, load and play it
                          handlePlayTrack(track, index);
                        }
                      }}
                    >
                      {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
                    </IconButton>
                    {/* More Options Menu */}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnchorEl(e.currentTarget);
                        setSelectedTrack(track);
                      }}
                      sx={{ color: 'grey.400' }}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <MusicNote sx={{ fontSize: 64, color: 'grey.600', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'grey.400', mb: 1 }}>
              {filterQuery ? 'No tracks match your search' : 'This playlist is empty'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.500', mb: 3 }}>
              {filterQuery ? 'Try a different search term' : 'Add some songs to get started'}
            </Typography>
          </Box>
        )}
      </Box>


      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            bgcolor: 'grey.800',
            border: '1px solid',
            borderColor: 'grey.700'
          }
        }}
      >
        <MenuItem
          onClick={() => {
            handlePlayTrack(selectedTrack, filteredAndSortedTracks.indexOf(selectedTrack));
            setAnchorEl(null);
          }}
          sx={{ color: 'white' }}
        >
          <ListItemIcon>
            <PlayArrow sx={{ color: '#1DB954' }} />
          </ListItemIcon>
          <ListItemText>Play</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            dispatch({ type: actions.ENQUEUE, payload: { item: selectedTrack } });
            setAnchorEl(null);
          }}
          sx={{ color: 'white' }}
        >
          <ListItemIcon>
            <QueueMusic sx={{ color: 'grey.400' }} />
          </ListItemIcon>
          <ListItemText>Add to Queue</ListItemText>
        </MenuItem>

        <Divider sx={{ bgcolor: 'grey.700' }} />

        {(isOwner || isCollaborator) && (
          <MenuItem
            onClick={() => {
              handleRemoveTrack(selectedTrack);
              setAnchorEl(null);
            }}
            sx={{ color: 'white' }}
          >
            <ListItemIcon>
              <Delete sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText>Remove from playlist</ListItemText>
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            // Handle share track
            setAnchorEl(null);
          }}
          sx={{ color: 'white' }}
        >
          <ListItemIcon>
            <Share sx={{ color: 'grey.400' }} />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>

        <Divider sx={{ bgcolor: 'grey.700' }} />

        <MenuItem
          onClick={() => handlePurchaseTrack(selectedTrack)}
          sx={{ color: 'white' }}
        >
          <ListItemIcon>
            <ShoppingCart sx={{ color: '#1DB954' }} />
          </ListItemIcon>
          <ListItemText>Purchase ($0.99)</ListItemText>
        </MenuItem>
      </Menu>

      {/* Edit Playlist Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setNewImage(null);
          setImagePreview(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'grey.800', color: 'white' }
        }}
      >
        <DialogTitle>Edit Playlist</DialogTitle>
        <DialogContent>
          {/* Playlist Cover Image */}
          <Box sx={{ mb: 3, mt: 2 }}>
            <Typography variant="body2" sx={{ color: 'grey.400', mb: 2 }}>
              Playlist Cover
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Card sx={{ width: 150, height: 150, boxShadow: 3, bgcolor: 'grey.700' }}>
                {imagePreview || playlist?.imageUrl ? (
                  <CardMedia
                    component="img"
                    height="150"
                    image={imagePreview || playlist?.imageUrl}
                    alt="Playlist cover"
                  />
                ) : (
                  <Box
                    sx={{
                      width: 150,
                      height: 150,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MusicNote sx={{ fontSize: 60, color: 'grey.600' }} />
                  </Box>
                )}
              </Card>
              <Box>
                <Button
                  variant="outlined"
                  component="label"
                  sx={{
                    borderColor: 'grey.600',
                    color: 'white',
                    '&:hover': { borderColor: '#1DB954' }
                  }}
                >
                  Choose Image
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (!file.type.startsWith('image/')) {
                          toast.error('Please select an image file');
                          return;
                        }
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('Image size must be less than 5MB');
                          return;
                        }
                        setNewImage(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </Button>
                {(newImage || playlist?.imageUrl) && (
                  <Button
                    variant="text"
                    onClick={() => {
                      setNewImage(null);
                      setImagePreview(null);
                    }}
                    sx={{ color: 'error.main', ml: 1 }}
                  >
                    Remove
                  </Button>
                )}
                <Typography variant="caption" sx={{ color: 'grey.500', display: 'block', mt: 1 }}>
                  Max 5MB • JPG, PNG
                </Typography>
              </Box>
            </Box>
          </Box>

          <TextField
            fullWidth
            label="Playlist Name"
            value={editForm.name}
            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'grey.600' },
                '&:hover fieldset': { borderColor: 'grey.500' },
                '&.Mui-focused fieldset': { borderColor: '#1DB954' }
              },
              '& .MuiInputLabel-root': { color: 'grey.400' }
            }}
          />
          <TextField
            fullWidth
            label="Description"
            value={editForm.description}
            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
            margin="normal"
            multiline
            rows={3}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'grey.600' },
                '&:hover fieldset': { borderColor: 'grey.500' },
                '&.Mui-focused fieldset': { borderColor: '#1DB954' }
              },
              '& .MuiInputLabel-root': { color: 'grey.400' }
            }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={editForm.isPublic}
                onChange={(e) => setEditForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#1DB954' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#1DB954' }
                }}
              />
            }
            label="Make playlist public"
            sx={{ mt: 2, color: 'white' }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={editForm.allowCollaboration}
                onChange={(e) => setEditForm(prev => ({ ...prev, allowCollaboration: e.target.checked }))}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#1DB954' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#1DB954' }
                }}
              />
            }
            label="Allow collaboration"
            sx={{ mt: 1, color: 'white' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ color: 'grey.400' }}>
            Cancel
          </Button>
          <Button
            onClick={handleEditPlaylist}
            variant="contained"
            sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: { bgcolor: 'grey.800', color: 'white' }
        }}
      >
        <DialogTitle>Delete Playlist</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{playlist?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: 'grey.400' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeletePlaylist}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Playlist;