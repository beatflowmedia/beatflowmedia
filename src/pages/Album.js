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
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import MoreVert from '@mui/icons-material/MoreVert';
import Share from '@mui/icons-material/Share';
import QueueMusic from '@mui/icons-material/QueueMusic';
import Shuffle from '@mui/icons-material/Shuffle';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import AccessTime from '@mui/icons-material/AccessTime';
import MusicNote from '@mui/icons-material/MusicNote';
import Star from '@mui/icons-material/Star';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { toast } from 'react-toastify';
import { getDocs, doc, collection, query, where, orderBy, onSnapshot, updateDoc, addDoc, serverTimestamp, increment } from 'firebase/firestore';

function Album() {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, actions } = usePlayer();
  const { user, addLike, removeLike, followArtist, unfollowArtist, isArtistFollowed } = useAuth();

  // State declarations
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [relatedAlbums, setRelatedAlbums] = useState([]);
  const [artist, setArtist] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);

  // ...existing code...
  useEffect(() => {
    async function loadAlbum() {
      setLoading(true);
      setError(null);
      try {
        // Load album data
        // ...existing album loading logic...

        // Load tracks with real-time updates
        const tracksQuery = query(
          collection(db, 'songs'),
          where('albumId', '==', albumId),
          orderBy('trackNumber', 'asc')
        );
        const unsubscribeTracks = onSnapshot(tracksQuery, (snapshot) => {
          const tracksData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setTracks(tracksData);
        });

        // Load reviews
        const reviewsQuery = query(
          collection(db, 'albumReviews'),
          where('albumId', '==', albumId),
          orderBy('createdAt', 'desc')
        );
        const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
          const reviewsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setReviews(reviewsData);
        });

        // Load related albums
        // You may need to fetch albumData first before this step
        // if (albumData.artistId || albumData.genre) {
        //   loadRelatedAlbums(albumData);
        // }

        // Update play count
        // if (albumData.id) {
        //   await updateDoc(doc(db, 'albums', albumData.id), {
        //     viewCount: increment(1)
        //   });
        // }

        setLoading(false);

        return () => {
          unsubscribeTracks();
          unsubscribeReviews();
        };
      } catch (err) {
        console.error('Error loading album:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    loadAlbum();
    // Cleanup function for unsubscribing
    return () => {
      // If you have unsubscribe functions, call them here
    };
  }, [albumId]);

  // Load related albums
  const loadRelatedAlbums = async (albumData) => {
    try {
      let relatedQuery;

      if (albumData.artistId) {
        // Get other albums by the same artist
        relatedQuery = query(
          collection(db, 'albums'),
          where('artistId', '==', albumData.artistId),
          orderBy('releaseDate', 'desc')
        );
      } else if (albumData.genre) {
        // Get albums in the same genre
        relatedQuery = query(
          collection(db, 'albums'),
          where('genre', '==', albumData.genre),
          orderBy('popularity', 'desc')
        );
      }

      if (relatedQuery) {
        const relatedSnapshot = await getDocs(relatedQuery);
        const related = relatedSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(a => a.id !== albumId)
          .slice(0, 6);
        setRelatedAlbums(related);
      }
    } catch (err) {
      console.error('Error loading related albums:', err);
    }
  };

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

  const handleFollowArtist = useCallback(async () => {
    if (!user || !artist) {
      toast.error('Please sign in to follow artists');
      return;
    }

    try {
      const isFollowing = isArtistFollowed(artist.name);
      if (isFollowing) {
        await unfollowArtist(artist.name);
        toast.success(`Unfollowed ${artist.name}`);
      } else {
        await followArtist(artist.name);
        toast.success(`Following ${artist.name}`);
      }
    } catch (err) {
      toast.error('Failed to update follow status');
    }
  }, [user, artist, followArtist, unfollowArtist, isArtistFollowed]);

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
      const newAvgRating = (albumStats.averageRating * albumStats.reviewCount + userRating) / (albumStats.reviewCount + 1);
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

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.900', color: 'white' }}>
      {/* Album Header */}
      <Box
        sx={{
          background: `linear-gradient(180deg, rgba(29,185,84,0.8) 0%, rgba(18,18,18,1) 100%)`,
          p: 4,
          pb: 2
        }}
      >
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
          <Card sx={{ width: 300, height: 300, boxShadow: 3 }}>
            <CardMedia
              component="img"
              height="300"
              image={album?.coverUrl || '/default-album-cover.jpg'}
              alt={album?.title}
            />
          </Card>

          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ color: 'white', opacity: 0.8, mb: 1 }}>
              Album
            </Typography>

            <Typography
              variant="h1"
              sx={{
                fontWeight: 'bold',
                fontSize: { xs: '2rem', sm: '3rem', md: '4rem' },
                mb: 2,
                background: 'linear-gradient(45deg, #fff, #ccc)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {album?.title}
            </Typography>

            {/* Artist Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar
                src={artist?.imageUrl}
                sx={{ width: 32, height: 32, cursor: 'pointer' }}
                onClick={() => navigate(`/artist/${artist?.id}`)}
              >
                {artist?.name?.[0]}
              </Avatar>
              <Typography
                variant="h6"
                sx={{
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
                onClick={() => navigate(`/artist/${artist?.id}`)}
              >
                {artist?.name || album?.artist}
              </Typography>
              {user && artist && (
                <Button
                  size="small"
                  variant={isArtistFollowed(artist.name) ? "outlined" : "contained"}
                  onClick={handleFollowArtist}
                  sx={{
                    bgcolor: isArtistFollowed(artist.name) ? 'transparent' : '#1DB954',
                    borderColor: '#1DB954',
                    color: isArtistFollowed(artist.name) ? '#1DB954' : 'white',
                    '&:hover': {
                      bgcolor: isArtistFollowed(artist.name) ? 'rgba(29, 185, 84, 0.1)' : '#1ed760'
                    }
                  }}
                >
                  {isArtistFollowed(artist.name) ? 'Following' : 'Follow'}
                </Button>
              )}
            </Box>

            {/* Album Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ color: 'grey.300' }}>
                {formatDate(album?.releaseDate)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.300' }}>
                •
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.300' }}>
                {albumStats.trackCount} songs, {albumStats.formattedDuration}
              </Typography>
              {album?.genre && (
                <>
                  <Typography variant="body2" sx={{ color: 'grey.300' }}>
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
                    '& .MuiRating-iconEmpty': { color: 'grey.600' }
                  }}
                />
                <Typography variant="body2" sx={{ color: 'grey.300' }}>
                  {albumStats.averageRating.toFixed(1)} ({albumStats.reviewCount} reviews)
                </Typography>
              </Box>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 3 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                onClick={handlePlayAlbum}
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

              <IconButton
                size="large"
                onClick={() => setReviewDialogOpen(true)}
                sx={{ color: 'grey.300', '&:hover': { color: 'white' } }}
              >
                <Star />
              </IconButton>

              <IconButton
                size="large"
                sx={{ color: 'grey.300', '&:hover': { color: 'white' } }}
              >
                <Share />
              </IconButton>

              <Button
                variant="outlined"
                startIcon={<ShoppingCart />}
                onClick={handlePurchaseAlbum}
                sx={{
                  borderColor: 'grey.500',
                  color: 'white',
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
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
          <TableContainer component={Paper} sx={{ bgcolor: 'transparent', mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { color: 'grey.400', borderColor: 'grey.800' } }}>
                  <TableCell padding="checkbox">#</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Plays</TableCell>
                  <TableCell align="right">
                    <AccessTime />
                  </TableCell>
                  <TableCell padding="checkbox"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tracks.map((track, index) => {
                  const isCurrentTrack = state.queue[state.currentIndex]?.id === track.id;
                  const isLiked = user?.likes?.includes(track.id) || false;

                  return (
                    <TableRow
                      key={track.id}
                      sx={{
                        '&:hover': { bgcolor: 'grey.800' },
                        '& td': { borderColor: 'grey.800', color: 'white' }
                      }}
                    >
                      <TableCell padding="checkbox">
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
                            {track.trackNumber || index + 1}
                          </Typography>
                          <PlayArrow
                            className="play-button"
                            sx={{
                              color: '#1DB954',
                              display: isCurrentTrack && state.isPlaying ? 'block' : 'none'
                            }}
                          />
                        </Box>
                      </TableCell>

                      <TableCell>
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
                        {track.explicit && (
                          <Chip
                            label="E"
                            size="small"
                            sx={{
                              ml: 1,
                              bgcolor: 'grey.600',
                              color: 'white',
                              fontSize: '0.6rem',
                              height: 16
                            }}
                          />
                        )}
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'grey.400' }}>
                          {(track.playCount || 0).toLocaleString()}
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
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
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
            {user && (
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

        {/* Related Albums */}
        {relatedAlbums.length > 0 && (
          <Box>
            <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
              More by {artist?.name || album?.artist}
            </Typography>
            <Grid container spacing={2}>
              {relatedAlbums.map((relatedAlbum) => (
                <Grid item xs={12} sm={6} md={4} lg={2} key={relatedAlbum.id}>
                  <Card
                    sx={{
                      bgcolor: 'grey.800',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.05)', bgcolor: 'grey.700' }
                    }}
                    onClick={() => navigate(`/album/${relatedAlbum.id}`)}
                  >
                    <CardMedia
                      component="img"
                      height="180"
                      image={relatedAlbum.coverUrl || '/default-album-cover.jpg'}
                      alt={relatedAlbum.title}
                    />
                    <CardContent sx={{ p: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: 'white',
                          fontWeight: 'bold',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {relatedAlbum.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'grey.400',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {formatDate(relatedAlbum.releaseDate)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
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
              by {artist?.name || album?.artist}
            </Typography>
            <Typography variant="h4" sx={{ color: '#1DB954', fontWeight: 'bold' }}>
              ${album?.price || '9.99'}
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