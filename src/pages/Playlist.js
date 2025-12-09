import { getDocs } from 'firebase/firestore';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  Avatar,
  Chip,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
  Tooltip,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Fade,
  Slide
} from '@mui/material';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Pause from '@mui/icons-material/Pause';
import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import MoreVert from '@mui/icons-material/MoreVert';
import Share from '@mui/icons-material/Share';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Add from '@mui/icons-material/Add';
import DragIndicator from '@mui/icons-material/DragIndicator';
import Public from '@mui/icons-material/Public';
import Lock from '@mui/icons-material/Lock';
import People from '@mui/icons-material/People';
import PersonAdd from '@mui/icons-material/PersonAdd';
import PersonRemove from '@mui/icons-material/PersonRemove';
import Download from '@mui/icons-material/Download';
import QueueMusic from '@mui/icons-material/QueueMusic';
import Shuffle from '@mui/icons-material/Shuffle';
import Repeat from '@mui/icons-material/Repeat';
import VolumeUp from '@mui/icons-material/VolumeUp';
import AccessTime from '@mui/icons-material/AccessTime';
import CalendarToday from '@mui/icons-material/CalendarToday';
import MusicNote from '@mui/icons-material/MusicNote';
import PlaylistPlay from '@mui/icons-material/PlaylistPlay';
import PlaylistAdd from '@mui/icons-material/PlaylistAdd';
import FilterList from '@mui/icons-material/FilterList';
import Sort from '@mui/icons-material/Sort';
import Search from '@mui/icons-material/Search';
import Close from '@mui/icons-material/Close';
import Save from '@mui/icons-material/Save';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { toast } from 'react-toastify';

const SORT_OPTIONS = [
  { label: 'Custom Order', value: 'custom' },
  { label: 'Recently Added', value: 'dateAdded' },
  { label: 'Alphabetical', value: 'alphabetical' },
  { label: 'Artist', value: 'artist' },
  { label: 'Duration', value: 'duration' },
  { label: 'Popularity', value: 'popularity' }
];

function Playlist() {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, actions } = usePlayer();
  const { user, addLike, removeLike } = useAuth();

  // Playlist state
  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [isOwner, setIsOwner] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [sortBy, setSortBy] = useState('custom');
  const [filterQuery, setFilterQuery] = useState('');
  const [showCollaborators, setShowCollaborators] = useState(false);

  // Modal states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [collaboratorDialogOpen, setCollaboratorDialogOpen] = useState(false);
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
  const [collaboratorEmail, setCollaboratorEmail] = useState('');

  // Load playlist data
  useEffect(() => {
    if (!playlistId) return;

    const loadPlaylist = async () => {
      try {
        setLoading(true);

        // Load playlist metadata
        const playlistDoc = await getDoc(doc(db, 'playlists', playlistId));
        if (!playlistDoc.exists()) {
          setError('Playlist not found');
          setLoading(false);
          return;
        }

        const playlistData = { id: playlistDoc.id, ...playlistDoc.data() };
        setPlaylist(playlistData);

        // Check permissions
        const userId = user?.uid;
        setIsOwner(playlistData.createdBy === userId);
        setIsCollaborator(playlistData.collaborators?.includes(userId));

        // Set form data for editing
        setEditForm({
          name: playlistData.name,
          description: playlistData.description || '',
          isPublic: playlistData.isPublic || false,
          allowCollaboration: playlistData.allowCollaboration || false
        });

        // Load tracks with real-time updates
        const tracksQuery = query(
          collection(db, 'playlistTracks'),
          where('playlistId', '==', playlistId)
        );

        const unsubscribe = onSnapshot(tracksQuery, (snapshot) => {
          const tracksData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Sort by order field for custom order
          tracksData.sort((a, b) => (a.order || 0) - (b.order || 0));
          setTracks(tracksData);
          setLoading(false);
        });

        return unsubscribe;
      } catch (err) {
        console.error('Error loading playlist:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadPlaylist();
  }, [playlistId, user]);

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
    const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);

    return {
      trackCount: tracks.length,
      totalDuration: totalDuration,
      formattedDuration: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
      followers: playlist?.followers || 0,
      plays: tracks.reduce((sum, track) => sum + (track.playCount || 0), 0)
    };
  }, [tracks, playlist]);

  // Event handlers
  const handlePlayPlaylist = useCallback(() => {
    if (tracks.length === 0) return;

    // Set entire playlist as queue and start playing
    dispatch({
      type: actions.SET_QUEUE,
      payload: {
        queue: tracks,
        currentIndex: 0
      }
    });
    dispatch({ type: actions.TOGGLE_PLAY });
  }, [tracks, dispatch, actions]);

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
    dispatch({ type: actions.TOGGLE_PLAY });
  }, [tracks, dispatch, actions]);

  const handlePlayTrack = useCallback((track, index) => {
    // Set playlist as queue starting from selected track
    dispatch({
      type: actions.SET_QUEUE,
      payload: {
        queue: filteredAndSortedTracks,
        currentIndex: index
      }
    });
    dispatch({ type: actions.TOGGLE_PLAY });
  }, [filteredAndSortedTracks, dispatch, actions]);

  const handleToggleLike = useCallback(async (track) => {
    if (!user) {
      toast.error('Please sign in to like songs');
      return;
    }

    try {
      const isLiked = user.likes?.includes(track.id);
      if (isLiked) {
        await removeLike(track.id);
        toast.success('Removed from liked songs');
      } else {
        await addLike(track.id);
        toast.success('Added to liked songs');
      }
    } catch (err) {
      toast.error('Failed to update likes');
    }
  }, [user, addLike, removeLike]);

  const handleEditPlaylist = async () => {
    if (!isOwner) return;

    try {
      await updateDoc(doc(db, 'playlists', playlistId), {
        name: editForm.name,
        description: editForm.description,
        isPublic: editForm.isPublic,
        allowCollaboration: editForm.allowCollaboration,
        updatedAt: serverTimestamp()
      });

      setPlaylist(prev => ({
        ...prev,
        ...editForm,
        updatedAt: new Date()
      }));

      setEditDialogOpen(false);
      toast.success('Playlist updated successfully');
    } catch (err) {
      console.error('Error updating playlist:', err);
      toast.error('Failed to update playlist');
    }
  };

  const handleDeletePlaylist = async () => {
    if (!isOwner) return;

    try {
      // Delete playlist document
      await deleteDoc(doc(db, 'playlists', playlistId));

      // Delete all tracks in the playlist
      const tracksToDelete = tracks.map(track =>
        deleteDoc(doc(db, 'playlistTracks', track.id))
      );
      await Promise.all(tracksToDelete);

      toast.success('Playlist deleted successfully');
      navigate('/playlists');
    } catch (err) {
      console.error('Error deleting playlist:', err);
      toast.error('Failed to delete playlist');
    }
  };

  const handleRemoveTrack = async (trackId) => {
    if (!isOwner && !isCollaborator) return;

    try {
      await deleteDoc(doc(db, 'playlistTracks', trackId));
      toast.success('Track removed from playlist');
    } catch (err) {
      console.error('Error removing track:', err);
      toast.error('Failed to remove track');
    }
  };

  const handleReorderTracks = async (result) => {
    if (!result.destination || !isOwner) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    // Reorder tracks locally
    const reorderedTracks = [...filteredAndSortedTracks];
    const [movedTrack] = reorderedTracks.splice(sourceIndex, 1);
    reorderedTracks.splice(destIndex, 0, movedTrack);

    // Update order in database
    try {
      const updatePromises = reorderedTracks.map((track, index) =>
        updateDoc(doc(db, 'playlistTracks', track.id), { order: index })
      );
      await Promise.all(updatePromises);
      toast.success('Playlist order updated');
    } catch (err) {
      console.error('Error reordering tracks:', err);
      toast.error('Failed to update order');
    }
  };

  const handleAddCollaborator = async () => {
    if (!isOwner || !collaboratorEmail) return;

    try {
      // Find user by email
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', collaboratorEmail)
      );
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        toast.error('User not found');
        return;
      }

      const collaboratorId = usersSnapshot.docs[0].id;

      // Add to collaborators
      await updateDoc(doc(db, 'playlists', playlistId), {
        collaborators: arrayUnion(collaboratorId)
      });

      setCollaboratorEmail('');
      setCollaboratorDialogOpen(false);
      toast.success('Collaborator added successfully');
    } catch (err) {
      console.error('Error adding collaborator:', err);
      toast.error('Failed to add collaborator');
    }
  };

  const handleFollowPlaylist = async () => {
    if (!user || isOwner) return;

    try {
      await updateDoc(doc(db, 'playlists', playlistId), {
        followers: arrayUnion(user.uid)
      });

      await updateDoc(doc(db, 'users', user.uid), {
        followedPlaylists: arrayUnion(playlistId)
      });

      toast.success('Following playlist');
    } catch (err) {
      console.error('Error following playlist:', err);
      toast.error('Failed to follow playlist');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.900', color: 'white' }}>
      {/* Playlist Header */}
      <Box
        sx={{
          background: `linear-gradient(180deg, rgba(29,185,84,0.8) 0%, rgba(18,18,18,1) 100%)`,
          p: 4,
          pb: 2
        }}
      >
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
          <Card sx={{ width: 250, height: 250, boxShadow: 3 }}>
            <CardMedia
              component="img"
              height="250"
              image={playlist?.coverUrl || '/default-playlist-cover.jpg'}
              alt={playlist?.name}
            />
          </Card>

          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ color: 'white', opacity: 0.8, mb: 1 }}>
              {playlist?.isPublic ? 'Public Playlist' : 'Private Playlist'}
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
                startIcon={<PlayArrow />}
                onClick={handlePlayPlaylist}
                disabled={tracks.length === 0}
                sx={{
                  bgcolor: '#1DB954',
                  '&:hover': { bgcolor: '#1ed760' },
                  borderRadius: '50px',
                  px: 3
                }}
              >
                Play
              </Button>

              <IconButton
                size="large"
                onClick={handleShufflePlay}
                disabled={tracks.length === 0}
                sx={{ color: 'grey.300', '&:hover': { color: 'white' } }}
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

        {/* Track Table */}
        {filteredAndSortedTracks.length > 0 ? (
          <DragDropContext onDragEnd={handleReorderTracks}>
            <Droppable droppableId="playlist-tracks" isDropDisabled={!isOwner || sortBy !== 'custom'}>
              {(provided) => (
                <TableContainer
                  component={Paper}
                  sx={{ bgcolor: 'transparent' }}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <Table>
                    <TableHead>
                      <TableRow sx={{ '& th': { color: 'grey.400', borderColor: 'grey.800' } }}>
                        <TableCell padding="checkbox">#</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Album</TableCell>
                        <TableCell>Date Added</TableCell>
                        <TableCell align="right">
                          <AccessTime />
                        </TableCell>
                        <TableCell padding="checkbox"></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAndSortedTracks.map((track, index) => {
                        const isCurrentTrack = state.queue[state.currentIndex]?.id === track.id;
                        const isLiked = user?.likes?.includes(track.id) || false;

                        return (
                          <Draggable
                            key={track.id}
                            draggableId={track.id}
                            index={index}
                            isDragDisabled={!isOwner || sortBy !== 'custom'}
                          >
                            {(provided, snapshot) => (
                              <TableRow
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                sx={{
                                  '&:hover': { bgcolor: 'grey.800' },
                                  bgcolor: snapshot.isDragging ? 'grey.700' : 'transparent',
                                  '& td': { borderColor: 'grey.800', color: 'white' }
                                }}
                              >
                                <TableCell padding="checkbox">
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {isOwner && sortBy === 'custom' && (
                                      <Box {...provided.dragHandleProps}>
                                        <DragIndicator sx={{ color: 'grey.500', cursor: 'grab' }} />
                                      </Box>
                                    )}
                                    <Box
                                      sx={{
                                        width: 20,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        '&:hover .track-number': { display: 'none' },
                                        '&:hover .play-button': { display: 'block' }
                                      }}
                                      onClick={() => handlePlayTrack(track, index)}
                                    >
                                      <Typography
                                        variant="body2"
                                        className="track-number"
                                        sx={{
                                          color: isCurrentTrack ? '#1DB954' : 'grey.400',
                                          display: isCurrentTrack && state.isPlaying ? 'none' : 'block'
                                        }}
                                      >
                                        {index + 1}
                                      </Typography>
                                      <PlayArrow
                                        className="play-button"
                                        sx={{
                                          color: '#1DB954',
                                          display: isCurrentTrack && state.isPlaying ? 'block' : 'none'
                                        }}
                                      />
                                    </Box>
                                  </Box>
                                </TableCell>

                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box
                                      component="img"
                                      src={track.coverUrl || '/default-song-cover.jpg'}
                                      alt={track.title}
                                      sx={{ width: 40, height: 40, borderRadius: 1 }}
                                    />
                                    <Box>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontWeight: 'bold',
                                          color: isCurrentTrack ? '#1DB954' : 'white',
                                          cursor: 'pointer',
                                          '&:hover': { textDecoration: 'underline' }
                                        }}
                                        onClick={() => handlePlayTrack(track, index)}
                                      >
                                        {track.title}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: 'grey.400' }}>
                                        {track.artist}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>

                                <TableCell>
                                  <Typography variant="body2" sx={{ color: 'grey.400' }}>
                                    {track.album || 'Unknown Album'}
                                  </Typography>
                                </TableCell>

                                <TableCell>
                                  <Typography variant="body2" sx={{ color: 'grey.400' }}>
                                    {formatDate(track.addedAt)}
                                  </Typography>
                                </TableCell>

                                <TableCell align="right">
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleToggleLike(track)}
                                      sx={{
                                        color: isLiked ? '#e91e63' : 'transparent',
                                        '&:hover': { color: '#e91e63' }
                                      }}
                                    >
                                      {isLiked ? <Favorite /> : <FavoriteBorder />}
                                    </IconButton>

                                    <Typography variant="body2" sx={{ color: 'grey.400', minWidth: 40 }}>
                                      {formatDuration(track.duration || 0)}
                                    </Typography>
                                  </Box>
                                </TableCell>

                                <TableCell padding="checkbox">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      setAnchorEl(e.currentTarget);
                                      setSelectedTrack(track);
                                    }}
                                    sx={{
                                      color: 'transparent',
                                      '&:hover': { color: 'grey.400' }
                                    }}
                                  >
                                    <MoreVert />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Droppable>
          </DragDropContext>
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

      {/* Floating Action Button for Owners */}
      {isOwner && (
        <SpeedDial
          ariaLabel="Playlist actions"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
          FabProps={{
            sx: {
              bgcolor: '#1DB954',
              '&:hover': { bgcolor: '#1ed760' }
            }
          }}
        >
          <SpeedDialAction
            icon={<Add />}
            tooltipTitle="Add songs"
            onClick={() => navigate(`/search?addTo=${playlistId}`)}
          />
          <SpeedDialAction
            icon={<People />}
            tooltipTitle="Manage collaborators"
            onClick={() => setCollaboratorDialogOpen(true)}
          />
          <SpeedDialAction
            icon={<Edit />}
            tooltipTitle="Edit playlist"
            onClick={() => setEditDialogOpen(true)}
          />
        </SpeedDial>
      )}

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
              handleRemoveTrack(selectedTrack.id);
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
      </Menu>

      {/* Edit Playlist Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'grey.800', color: 'white' }
        }}
      >
        <DialogTitle>Edit Playlist</DialogTitle>
        <DialogContent>
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