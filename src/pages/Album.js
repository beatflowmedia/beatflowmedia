
import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Rating from '@mui/material/Rating';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Share from '@mui/icons-material/Share';
import QueueMusic from '@mui/icons-material/QueueMusic';
import Shuffle from '@mui/icons-material/Shuffle';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import MusicNote from '@mui/icons-material/MusicNote';
import Star from '@mui/icons-material/Star';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { useLikes } from '../context/LikesContext';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { toast } from 'react-toastify';
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import PurchaseButton from '../components/PurchaseButton';
import TrackRowCard from '../components/TrackRowCard';
import { stripeService } from '../services/stripeService';
import { getSongMetrics } from '../services/engagementMetrics';

function Album() {
  const { id: albumId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, actions } = usePlayer();
  const { user, followArtist, unfollowArtist, isArtistFollowed, signInWithGoogle } = useAuth();
  const { addLike, removeLike, isLiked: checkIsLiked } = useLikes();
  const outletContext = useOutletContext() || {};
  const { onOpenRightPanel } = outletContext;

  useEffect(() => {
    console.log('Album page - onOpenRightPanel available:', !!onOpenRightPanel);
  }, [onOpenRightPanel]);

  // State declarations
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [trackMetrics, setTrackMetrics] = useState({});
  const [reviews, setReviews] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);

  // Load album data
  useEffect(() => {
    if (!albumId) {
      console.log('No album ID provided');
      return;
    }

    let unsubscribeTracks = null;
    let unsubscribeReviews = null;

    async function loadAlbum() {
      setLoading(true);
      setError(null);
      try {
        console.log('Loading album with ID:', albumId);

        // Load album data from Firebase
        const albumDocRef = doc(db, 'albums', albumId);
        const albumSnapshot = await getDoc(albumDocRef);

        if (!albumSnapshot.exists()) {
          console.error('Album not found:', albumId);
          setError('Album not found');
          setLoading(false);
          return;
        }

        const albumData = { id: albumSnapshot.id, ...albumSnapshot.data() };
        setAlbum(albumData);
        console.log('✅ Loaded album:', albumData.title, 'with', albumData.trackCount, 'tracks');

        // Load tracks with real-time updates
        const tracksQuery = query(
          collection(db, 'songs'),
          where('albumId', '==', albumId)
        );

        unsubscribeTracks = onSnapshot(tracksQuery, (snapshot) => {
          const tracksData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Sort by trackNumber on client side (avoids Firestore index requirement)
          tracksData.sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));

          console.log('✅ Loaded', tracksData.length, 'tracks for album');
          setTracks(tracksData);
        }, (error) => {
          console.error('Error loading tracks:', error);
        });

        // Load reviews (optional - may not exist)
        const reviewsQuery = query(
          collection(db, 'albumReviews'),
          where('albumId', '==', albumId)
        );

        unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
          const reviewsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Sort by createdAt on client side
          reviewsData.sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime; // Descending order (newest first)
          });

          setReviews(reviewsData);
        }, (error) => {
          // Reviews collection might not exist yet - that's okay
          console.log('Album reviews not available:', error.message);
        });

        setLoading(false);
      } catch (err) {
        console.error('Error loading album:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    loadAlbum();

    // Cleanup function
    return () => {
      if (unsubscribeTracks) unsubscribeTracks();
      if (unsubscribeReviews) unsubscribeReviews();
    };
  }, [albumId]);

  // Load engagement metrics for all tracks
  useEffect(() => {
    async function loadTrackMetrics() {
      if (tracks.length === 0) return;

      const metricsPromises = tracks.map(track => getSongMetrics(track.id));
      const metricsResults = await Promise.all(metricsPromises);

      const metricsMap = {};
      tracks.forEach((track, index) => {
        metricsMap[track.id] = metricsResults[index];
      });

      setTrackMetrics(metricsMap);
    }

    loadTrackMetrics();
  }, [tracks]);

  // Calculate album stats
  const albumStats = React.useMemo(() => {
    const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
      : 0;

    return {
      trackCount: tracks.length,
      totalDuration: totalDuration,
      formattedDuration: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
      totalPlays: tracks.reduce((sum, track) => sum + (track.playCount || 0), 0),
      averageRating: avgRating,
      reviewCount: reviews.length
    };
  }, [tracks, reviews]);

  // Event handlers
  const handlePlayAlbum = useCallback(() => {
    if (tracks.length === 0) return;

    // Set entire album as queue and start playing
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
    // Set album as queue starting from selected track
    dispatch({
      type: actions.SET_QUEUE,
      payload: {
        queue: tracks,
        currentIndex: index
      }
    });
    dispatch({ type: actions.TOGGLE_PLAY });
  }, [tracks, dispatch, actions]);

  const handleToggleLike = useCallback(async (track) => {
    if (!user) {
      toast.error('Please sign in to like songs');
      return;
    }

    try {
      const liked = checkIsLiked(track.id);
      if (liked) {
        await removeLike(track.id);
      } else {
        await addLike(track.id);
      }
    } catch (err) {
      console.error('Failed to update likes:', err);
    }
  }, [checkIsLiked, addLike, removeLike]);

  const handleFollowArtist = useCallback(async () => {
    if (!user || !album?.artist) {
      toast.error('Please sign in to follow artists');
      return;
    }

    try {
      const artistName = album.artist || album.artistName;
      const isFollowing = isArtistFollowed(artistName);
      if (isFollowing) {
        await unfollowArtist(artistName);
        toast.success(`Unfollowed ${artistName}`);
      } else {
        await followArtist(artistName);
        toast.success(`Following ${artistName}`);
      }
    } catch (err) {
      toast.error('Failed to update follow status');
    }
  }, [user, album, followArtist, unfollowArtist, isArtistFollowed]);

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

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please sign in to leave a review');
      return;
    }

    if (!userRating || !userReview.trim()) {
      toast.error('Please provide both rating and review');
      return;
    }

    try {
      await addDoc(collection(db, 'albumReviews'), {
        albumId,
        userId: user.uid,
        userName: user.displayName,
        userPhotoURL: user.photoURL,
        rating: userRating,
        review: userReview.trim(),
        createdAt: serverTimestamp()
      });

      // Update album average rating
      const currentAvgRating = album?.averageRating || 0;
      const currentReviewCount = album?.reviewCount || 0;
      const newAvgRating = (currentAvgRating * currentReviewCount + userRating) / (currentReviewCount + 1);

      await updateDoc(doc(db, 'albums', albumId), {
        averageRating: newAvgRating,
        reviewCount: increment(1)
      });

      setUserRating(0);
      setUserReview('');
      setReviewDialogOpen(false);
      toast.success('Review submitted successfully');
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error('Failed to submit review');
    }
  };

  const handlePurchaseAlbum = () => {
    // Integrate with payment system
    setPurchaseDialogOpen(true);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
          <Skeleton variant="rectangular" width={300} height={300} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={400} height={60} />
            <Skeleton variant="text" width={200} height={30} />
            <Skeleton variant="text" width={300} height={20} />
            <Skeleton variant="text" width={250} height={20} />
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
        <Button variant="contained" onClick={() => navigate('/browse')}>
          Back to Browse
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto', bgcolor: 'grey.900', color: 'white' }}>
      {/* Album Header */}
      <Box
        sx={{
          position: 'relative',
          p: 'clamp(16px, 2vw, 32px)',
          pb: 'clamp(8px, 1vw, 16px)',
          overflow: 'hidden',
          minHeight: 'fit-content',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-20%',
            left: '-20%',
            width: '140%',
            height: '140%',
            backgroundImage: album?.coverUrl ? `url(${album.coverUrl})` : 'none',
            backgroundSize: 'contain',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(50px) brightness(0.5)',
            zIndex: 0
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(18,18,18,0.9) 70%, rgba(18,18,18,1) 100%)',
            zIndex: 1
          }
        }}
      >
        <Box sx={{ display: 'flex', gap: 'clamp(12px, 2vw, 32px)', alignItems: 'flex-end', position: 'relative', zIndex: 2 }}>
          <Card sx={{
            width: 'clamp(120px, 15vw, 300px)',
            height: 'clamp(120px, 15vw, 300px)',
            boxShadow: 3,
            flexShrink: 0
          }}>
            <CardMedia
              component="img"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              image={album?.coverUrl || '/default-album-cover.jpg'}
              alt={album?.title}
            />
          </Card>

          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ color: 'white', opacity: 0.8, mb: 1, fontSize: 'calc(clamp(0.625rem, 0.75vw, 0.875rem))' }}>
              Album
            </Typography>

            <Typography
              variant="h1"
              sx={{
                fontWeight: 'bold',
                fontSize: 'calc(clamp(1rem, 2.5vw, 3.5rem))',
                mb: 'clamp(8px, 1vw, 16px)',
                background: 'linear-gradient(45deg, #fff, #ccc)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.2,
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              {album?.title}
            </Typography>

            {/* Artist Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 16px)', mb: 'clamp(8px, 1vw, 16px)' }}>
              <Avatar
                sx={{
                  width: 'clamp(24px, 2vw, 40px)',
                  height: 'clamp(24px, 2vw, 40px)',
                  fontSize: 'clamp(0.75rem, 1vw, 1rem)',
                  cursor: onOpenRightPanel ? 'pointer' : 'default',
                  '&:hover': onOpenRightPanel ? { opacity: 0.8 } : {}
                }}
                onClick={() => {
                  if (onOpenRightPanel && album?.artist) {
                    onOpenRightPanel({ type: 'artist', artistName: album.artist || album.artistName });
                  }
                }}
              >
                {album?.artist?.[0] || album?.artistName?.[0]}
              </Avatar>
              <Typography
                variant="h6"
                sx={{
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 'calc(clamp(0.625rem, 0.85vw, 1.125rem))',
                  cursor: onOpenRightPanel ? 'pointer' : 'default',
                  '&:hover': onOpenRightPanel ? { textDecoration: 'underline' } : {}
                }}
                onClick={() => {
                  if (onOpenRightPanel && album?.artist) {
                    onOpenRightPanel({ type: 'artist', artistName: album.artist || album.artistName });
                  }
                }}
              >
                {album?.artist || album?.artistName}
              </Typography>
              {onOpenRightPanel && album?.artist && (
                <IconButton
                  size="small"
                  onClick={() => {
                    console.log('Opening artist panel for:', album.artist || album.artistName);
                    onOpenRightPanel({ type: 'artist', artistName: album.artist || album.artistName });
                  }}
                  sx={{
                    color: 'grey.400',
                    '&:hover': { color: 'white' }
                  }}
                  title="View artist info"
                >
                  <InfoOutlined fontSize="small" />
                </IconButton>
              )}
              {user && album?.artist && (
                <Button
                  size="small"
                  variant={isArtistFollowed(album.artist) ? "outlined" : "contained"}
                  onClick={handleFollowArtist}
                  sx={{
                    bgcolor: isArtistFollowed(album.artist) ? 'transparent' : '#1DB954',
                    borderColor: '#1DB954',
                    color: isArtistFollowed(album.artist) ? '#1DB954' : 'white',
                    fontSize: 'calc(clamp(0.625rem, 0.75vw, 0.875rem))',
                    px: 'clamp(8px, 1vw, 16px)',
                    py: 'clamp(4px, 0.5vw, 8px)',
                    '&:hover': {
                      bgcolor: isArtistFollowed(album.artist) ? 'rgba(29, 185, 84, 0.1)' : '#1ed760'
                    }
                  }}
                >
                  {isArtistFollowed(album.artist) ? 'Following' : 'Follow'}
                </Button>
              )}
            </Box>

            {/* Album Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 0.5vw, 8px)', mb: 'clamp(8px, 1vw, 16px)', flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ color: 'grey.300', fontSize: 'calc(clamp(0.5rem, 0.65vw, 0.8rem))' }}>
                {formatDate(album?.releaseDate)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.300', fontSize: 'calc(clamp(0.5rem, 0.65vw, 0.8rem))' }}>
                •
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.300', fontSize: 'calc(clamp(0.5rem, 0.65vw, 0.8rem))' }}>
                {albumStats.trackCount} songs, {albumStats.formattedDuration}
              </Typography>
              {albumStats.totalPlays > 0 && (
                <>
                  <Typography variant="body2" sx={{ color: 'grey.300', fontSize: 'calc(clamp(0.5rem, 0.65vw, 0.8rem))' }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.300', fontSize: 'calc(clamp(0.5rem, 0.65vw, 0.8rem))' }}>
                    {albumStats.totalPlays.toLocaleString()} plays
                  </Typography>
                </>
              )}
              {album?.genre && (
                <>
                  <Typography variant="body2" sx={{ color: 'grey.300', fontSize: 'calc(clamp(0.5rem, 0.65vw, 0.8rem))' }}>
                    •
                  </Typography>
                  <Chip
                    label={album.genre}
                    size="small"
                    sx={{ bgcolor: 'grey.700', color: 'white' }}
                  />
                </>
              )}
            </Box>

            {/* Rating */}
            {albumStats.averageRating > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Rating
                  value={albumStats.averageRating}
                  precision={0.1}
                  readOnly
                  sx={{
                    '& .MuiRating-iconFilled': { color: '#1DB954' },
                    '& .MuiRating-iconEmpty': { color: 'grey.600' },
                    '& .MuiSvgIcon-root': { fontSize: 'calc(clamp(1rem, 1.2vw, 1.5rem))' }
                  }}
                />
                <Typography variant="body2" sx={{ color: 'grey.300', fontSize: 'calc(clamp(0.5rem, 0.65vw, 0.8rem))' }}>
                  {albumStats.averageRating.toFixed(1)} ({albumStats.reviewCount} reviews)
                </Typography>
              </Box>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 'clamp(6px, 0.8vw, 16px)', alignItems: 'center', mt: 'clamp(12px, 1.5vw, 24px)', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrow sx={{ fontSize: 'calc(clamp(0.875rem, 1vw, 1.25rem))' }} />}
                onClick={handlePlayAlbum}
                disabled={tracks.length === 0}
                sx={{
                  bgcolor: '#1DB954',
                  '&:hover': { bgcolor: '#1ed760' },
                  borderRadius: '50px',
                  px: 'clamp(12px, 1.5vw, 24px)',
                  py: 'clamp(6px, 0.8vw, 12px)',
                  fontSize: 'calc(clamp(0.625rem, 0.75vw, 0.875rem))'
                }}
              >
                Play
              </Button>

              <IconButton
                onClick={handleShufflePlay}
                disabled={tracks.length === 0}
                sx={{
                  color: 'grey.300',
                  '&:hover': { color: 'white' },
                  '& .MuiSvgIcon-root': { fontSize: 'calc(clamp(1rem, 1.2vw, 1.5rem))' }
                }}
              >
                <Shuffle />
              </IconButton>

              <IconButton
                onClick={() => setReviewDialogOpen(true)}
                sx={{
                  color: 'grey.300',
                  '&:hover': { color: 'white' },
                  '& .MuiSvgIcon-root': { fontSize: 'calc(clamp(1rem, 1.2vw, 1.5rem))' }
                }}
              >
                <Star />
              </IconButton>

              <IconButton
                sx={{
                  color: 'grey.300',
                  '&:hover': { color: 'white' },
                  '& .MuiSvgIcon-root': { fontSize: 'calc(clamp(1rem, 1.2vw, 1.5rem))' }
                }}
              >
                <Share />
              </IconButton>

              <PurchaseButton
                itemId={albumId}
                itemType="album"
                price={album?.price || 1499}
              />

              <Button
                variant="outlined"
                startIcon={<ShoppingCart />}
                onClick={handlePurchaseAlbum}
                sx={{
                  borderColor: 'grey.500',
                  color: 'white',
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                  display: 'none' // Hide old purchase button
                }}
              >
                Buy Album
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Track List */}
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
          Tracks
        </Typography>

        {tracks.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4 }}>
            {tracks.map((track, index) => {
              const isCurrentTrack = state.queue[state.currentIndex]?.id === track.id;
              const isPlaying = isCurrentTrack && state.isPlaying;
              const isLiked = checkIsLiked(track.id);
              const metrics = trackMetrics[track.id] || {};

              return (
                <TrackRowCard
                  key={track.id}
                  track={track}
                  index={index}
                  isCurrentTrack={isCurrentTrack}
                  isPlaying={isPlaying}
                  isLiked={isLiked}
                  likeCount={metrics.likeCount || 0}
                  onPlay={handlePlayTrack}
                  onToggleLike={handleToggleLike}
                  onMoreOptions={(e, track) => {
                    setAnchorEl(e.currentTarget);
                    setSelectedTrack(track);
                  }}
                  showArtist={true}
                  artistName={album?.artistName}
                  showPurchase={true}
                />
              );
            })}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <MusicNote sx={{ fontSize: 64, color: 'grey.600', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'grey.400' }}>
              No tracks available
            </Typography>
          </Box>
        )}

        {/* Album Description */}
        {album?.description && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
              About this album
            </Typography>
            <Typography variant="body1" sx={{ color: 'grey.300', lineHeight: 1.6 }}>
              {album.description}
            </Typography>
          </Box>
        )}

        {/* Credits */}
        {album?.credits && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
              Credits
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(album.credits).map(([role, people]) => (
                <Grid item xs={12} sm={6} md={4} key={role}>
                  <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                    {role}
                  </Typography>
                  {Array.isArray(people) ? (
                    people.map((person, index) => (
                      <Typography key={index} variant="body2" sx={{ color: 'grey.400' }}>
                        {person}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: 'grey.400' }}>
                      {people}
                    </Typography>
                  )}
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Reviews Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
              Reviews ({albumStats.reviewCount})
            </Typography>
            {user ? (
              <Button
                variant="outlined"
                onClick={() => setReviewDialogOpen(true)}
                sx={{
                  borderColor: '#1DB954',
                  color: '#1DB954',
                  '&:hover': { borderColor: '#1ed760', color: '#1ed760' }
                }}
              >
                Write Review
              </Button>
            ) : (
              <Button
                variant="outlined"
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                    toast.success('Signed in! You can now write a review.');
                  } catch (error) {
                    toast.error('Failed to sign in. Please try again.');
                  }
                }}
                sx={{
                  borderColor: 'grey.600',
                  color: 'grey.400',
                  '&:hover': { borderColor: '#1DB954', color: '#1DB954' }
                }}
              >
                Sign in to Review
              </Button>
            )}
          </Box>

          {reviews.length > 0 ? (
            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
              {reviews.slice(0, 10).map((review) => (
                <Card key={review.id} sx={{ bgcolor: 'grey.800', mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar src={review.userPhotoURL} sx={{ width: 32, height: 32 }}>
                        {review.userName?.[0]}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {review.userName}
                        </Typography>
                        <Rating
                          value={review.rating}
                          readOnly
                          size="small"
                          sx={{
                            '& .MuiRating-iconFilled': { color: '#1DB954' },
                            '& .MuiRating-iconEmpty': { color: 'grey.600' }
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: 'grey.400' }}>
                        {formatDate(review.createdAt)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'grey.300' }}>
                      {review.review}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Star sx={{ fontSize: 48, color: 'grey.600', mb: 2 }} />
              <Typography variant="body1" sx={{ color: 'grey.400' }}>
                No reviews yet. Be the first to review this album!
              </Typography>
            </Box>
          )}
        </Box>
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
            handlePlayTrack(selectedTrack, tracks.indexOf(selectedTrack));
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
          <ListItemText>Purchase ($1.99)</ListItemText>
        </MenuItem>
      </Menu>

      {/* Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'grey.800', color: 'white' }
        }}
      >
        <DialogTitle>Write a Review</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Rate this album
            </Typography>
            <Rating
              value={userRating}
              onChange={(event, newValue) => setUserRating(newValue)}
              size="large"
              sx={{
                '& .MuiRating-iconFilled': { color: '#1DB954' },
                '& .MuiRating-iconEmpty': { color: 'grey.600' }
              }}
            />
          </Box>
          <TextField
            fullWidth
            label="Your Review"
            value={userReview}
            onChange={(e) => setUserReview(e.target.value)}
            multiline
            rows={4}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)} sx={{ color: 'grey.400' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            disabled={!userRating || !userReview.trim()}
            sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>

      {/* Purchase Dialog */}
      <Dialog
        open={purchaseDialogOpen}
        onClose={() => setPurchaseDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'grey.800', color: 'white' }
        }}
      >
        <DialogTitle>Purchase Album</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <CardMedia
              component="img"
              height="200"
              image={album?.coverUrl || '/default-album-cover.jpg'}
              alt={album?.title}
              sx={{ width: 200, height: 200, mx: 'auto', mb: 2, borderRadius: 2 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {album?.title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.400', mb: 2 }}>
              by {album?.artist || album?.artistName}
            </Typography>
            <Typography variant="h4" sx={{ color: '#1DB954', fontWeight: 'bold' }}>
              ${album?.price ? (album.price / 100).toFixed(2) : '14.99'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 3 }}>
            <Chip label="Digital Download" sx={{ bgcolor: 'grey.700', color: 'white' }} />
            <Chip label="High Quality" sx={{ bgcolor: 'grey.700', color: 'white' }} />
            <Chip label="DRM-Free" sx={{ bgcolor: 'grey.700', color: 'white' }} />
          </Box>

          <Typography variant="body2" sx={{ color: 'grey.400', textAlign: 'center' }}>
            Includes {albumStats.trackCount} tracks in high-quality MP3 format
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={() => setPurchaseDialogOpen(false)} sx={{ color: 'grey.400' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<ShoppingCart />}
            sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' }, px: 4 }}
          >
            Purchase Now
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Album;