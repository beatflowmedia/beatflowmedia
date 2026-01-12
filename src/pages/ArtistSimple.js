import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent, CircularProgress, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { PlayArrow, Pause, Favorite, FavoriteBorder, MoreVert, QueueMusic, PlaylistAdd, Share, ShoppingCart } from '@mui/icons-material';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { usePlaySong } from '../hooks/usePlaySong';
import { useAuth } from '../context/AuthContext';
import { usePlaylistManager } from '../hooks/usePlaylistManager';
import { usePlayer } from '../context/PlayerContext';
import AddToPlaylistButton from '../utils/AddToPlaylistButton';
import ShareButton from '../utils/ShareButton';
import PlayingIndicator from '../components/PlayingIndicator';
import PurchaseButton from '../components/PurchaseButton';
import AlbumCard from '../components/AlbumCard';
import useFollowArtist from '../hooks/useFollowArtist';
import { stripeService } from '../services/stripeService';
import { toast } from 'react-toastify';
import { getArtistImageUrl } from '../hooks/useArtistImage';
import SongPlayCount from '../components/SongPlayCount';
import { useArtistFollowers } from '../hooks/useArtistFollowers';
import FanCaptureModal from '../components/FanCaptureModal';
import { fanCaptureService } from '../services/fanCaptureService';

export default function ArtistSimple() {
  console.log('[ArtistSimple] Component mounted/rendered');

  const { id: artistId } = useParams(); // Route param is :id, rename to artistId
  const navigate = useNavigate();
  const { playSong, isSongPlaying, isCurrentSong: checkIsCurrentSong } = usePlaySong();
  const { user, addLike, removeLike } = useAuth();
  const { playlists, addSong } = usePlaylistManager();
  const { dispatch, actions } = usePlayer();

  console.log('[ArtistSimple] artistId from params:', artistId);

  const [artist, setArtist] = useState(null);
  const [artistSongs, setArtistSongs] = useState([]);
  const [artistAlbums, setArtistAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [purchasedSongIds, setPurchasedSongIds] = useState(new Set());
  const [fanCaptureOpen, setFanCaptureOpen] = useState(false);

  // Race condition protection for Get Updates button
  const subscribeProcessingRef = useRef(false);

  // Use follow artist hook
  const { isFollowing, toggleFollow } = useFollowArtist(artist?.name);

  // Use real-time follower count from artistMetrics collection
  const followerCount = useArtistFollowers(artist?.name);

  // Debug: Log artist name being used for following
  useEffect(() => {
    if (artist?.name) {
      console.log('🎯 Artist name used for following:', artist.name);
    }
  }, [artist?.name]);

  // Load user's purchases
  useEffect(() => {
    const loadUserPurchases = async () => {
      if (!user) {
        setPurchasedSongIds(new Set());
        return;
      }

      try {
        const purchases = await stripeService.getUserPurchases(user.uid);
        const songIds = new Set(purchases.map(p => p.itemId));
        setPurchasedSongIds(songIds);
      } catch (error) {
        console.error('Error loading purchases:', error);
      }
    };

    loadUserPurchases();

    // Listen for purchase completion events
    const handlePurchaseComplete = (event) => {
      if (event.detail?.itemId && event.detail?.itemType === 'song') {
        setPurchasedSongIds(prev => new Set([...prev, event.detail.itemId]));
      }
    };

    window.addEventListener('purchaseComplete', handlePurchaseComplete);
    return () => window.removeEventListener('purchaseComplete', handlePurchaseComplete);
  }, [user]);


  // Load artist data from Firebase
  useEffect(() => {
    let isCancelled = false;
    let unsubscribeSongs = null;
    let unsubscribeAlbums = null;

    const loadArtist = async () => {
      try {
        setLoading(true);
        setError(null);
        setArtist(null); // Reset artist when loading new one
        setArtistSongs([]); // Reset songs
        setArtistAlbums([]); // Reset albums

        // Decode the artist name from URL
        const artistName = decodeURIComponent(artistId);
        console.log('[ArtistSimple] Loading artist by name:', artistName);
        console.log('[ArtistSimple] Firebase db:', db ? 'initialized' : 'NOT initialized');

        // Query artists collection by name field
        console.log('[ArtistSimple] Querying artists collection...');
        const artistsQuery = query(
          collection(db, 'artists'),
          where('name', '==', artistName)
        );
        const artistsSnapshot = await getDocs(artistsQuery);
        console.log('[ArtistSimple] Artists query returned:', artistsSnapshot.size, 'documents');

        // Set up real-time listener for songs (try artistName first)
        console.log('Setting up real-time listener for songs with artistName:', artistName);
        const songsQuery = query(
          collection(db, 'songs'),
          where('artistName', '==', artistName)
        );

        unsubscribeSongs = onSnapshot(songsQuery, (snapshot) => {
          let songs = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .filter(song => song.isVisible !== false); // Filter hidden songs

          // If no songs found with artistName, try artist field
          if (songs.length === 0) {
            console.log('No songs with artistName, trying artist field...');
            const altQuery = query(
              collection(db, 'songs'),
              where('artist', '==', artistName)
            );

            // Set up listener for alternate query
            const unsubscribeAlt = onSnapshot(altQuery, (altSnapshot) => {
              const altSongs = altSnapshot.docs
                .map(doc => ({
                  id: doc.id,
                  ...doc.data()
                }))
                .filter(song => song.isVisible !== false);
              console.log('Found', altSongs.length, 'visible songs with artist field (real-time)');
              setArtistSongs(altSongs);
            });

            // Store cleanup for alternate listener
            return () => unsubscribeAlt();
          } else {
            console.log('Found', songs.length, 'visible songs with artistName (real-time)');
            setArtistSongs(songs);
          }
        });

        // Set up real-time listener for albums (try artistName field first)
        console.log('Setting up real-time listener for albums with artistName:', artistName);
        const albumsQuery = query(
          collection(db, 'albums'),
          where('artistName', '==', artistName)
        );

        unsubscribeAlbums = onSnapshot(albumsQuery, (snapshot) => {
          let albums = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .filter(album => album.isVisible !== false); // Filter hidden albums

          // If no albums found with artistName, try artist field
          if (albums.length === 0) {
            console.log('No albums with artistName, trying artist field...');
            const altAlbumsQuery = query(
              collection(db, 'albums'),
              where('artist', '==', artistName)
            );

            // Set up listener for alternate query
            const unsubscribeAlt = onSnapshot(altAlbumsQuery, (altSnapshot) => {
              const altAlbums = altSnapshot.docs
                .map(doc => ({
                  id: doc.id,
                  ...doc.data()
                }))
                .filter(album => album.isVisible !== false);
              console.log('Found', altAlbums.length, 'visible albums with artist field (real-time)');
              setArtistAlbums(altAlbums);
            });

            // Store cleanup for alternate listener
            return () => unsubscribeAlt();
          } else {
            console.log('Found', albums.length, 'visible albums with artistName (real-time)');
            setArtistAlbums(albums);
          }
        });

        // Set artist data from artists collection if exists
        if (!artistsSnapshot.empty) {
          const artistDoc = artistsSnapshot.docs[0];
          const artistData = { id: artistDoc.id, ...artistDoc.data() };
          setArtist(artistData);
          console.log('Found artist document');
        }
        // Note: Minimal artist object creation moved to separate useEffect that depends on artistSongs state
      } catch (err) {
        console.error('[ArtistSimple] Error loading artist:', err);
        if (!isCancelled) {
          setError(err.message);
        }
      } finally {
        if (!isCancelled) {
          console.log('[ArtistSimple] Loading complete, setting loading to false');
          setLoading(false);
        }
      }
    };

    if (artistId) {
      console.log('[ArtistSimple] Starting to load artist, artistId:', artistId);
      loadArtist();
    } else {
      console.log('[ArtistSimple] No artistId provided');
      setLoading(false);
    }

    return () => {
      isCancelled = true;
      // Cleanup onSnapshot listeners if they exist
      if (typeof unsubscribeSongs === 'function') {
        unsubscribeSongs();
      }
      if (typeof unsubscribeAlbums === 'function') {
        unsubscribeAlbums();
      }
    };
  }, [artistId]);

  // Create minimal artist object if we have songs but no artist document
  useEffect(() => {
    if (!artist && artistSongs.length > 0 && artistId) {
      const artistName = decodeURIComponent(artistId);
      console.log('No artist document, but found', artistSongs.length, 'songs. Creating minimal artist object.');
      setArtist({
        name: artistName,
        // Use cover from first song if available
        imageUrl: artistSongs[0]?.coverUrl || artistSongs[0]?.cover || '/default-artist.jpg'
      });
      // Clear any error that might have been set too early
      setError(null);
    }
  }, [artist, artistSongs, artistId, artistSongs.length]);

  // Show error only after giving enough time for real-time listeners to fire
  useEffect(() => {
    if (!artist && artistSongs.length === 0 && !loading && artistId) {
      // Wait for real-time listener to potentially fire
      const timeoutId = setTimeout(() => {
        // Check current state (not closure-captured state)
        setArtistSongs(currentSongs => {
          setArtist(currentArtist => {
            if (!currentArtist && currentSongs.length === 0) {
              const artistName = decodeURIComponent(artistId);
              console.log('Artist not found and no songs found after delay:', artistName);
              setError(`Artist "${artistName}" not found`);
            }
            return currentArtist;
          });
          return currentSongs;
        });
      }, 1500); // Wait 1.5 seconds for real-time listener

      return () => clearTimeout(timeoutId);
    }
  }, [loading, artistId]); // Only depend on loading and artistId, not artist/artistSongs

  // Like/favorite toggle handler (DRY - same as Home.js)
  const handleMenuOpen = (event, song) => {
    setMenuAnchor(event.currentTarget);
    setSelectedSong(song);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedSong(null);
  };

  const handlePurchase = async (song) => {
    handleMenuClose();
    if (!user) {
      toast.error('Please sign in to purchase music');
      return;
    }

    try {
      const hasPurchased = await stripeService.hasPurchasedSong(user.uid, song.id);
      if (hasPurchased) {
        toast.info('You already own this song! Redirecting to downloads...');
        navigate('/downloads');
        return;
      }

      await stripeService.createSongCheckout(user.uid, song.id, user.email);
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(`Failed to initiate purchase: ${error.message}`);
    }
  };

  const handleToggleLike = async (song) => {
    if (!user) {
      console.log('No user logged in');
      return;
    }

    try {
      const isLiked = user.likes?.includes(song.id);
      console.log('Toggle like for song:', song.id, 'Currently liked:', isLiked);

      if (isLiked) {
        await removeLike(song.id);
        console.log('Successfully removed like');
      } else {
        await addLike(song.id);
        console.log('Successfully added like');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleGetUpdates = async () => {
    // Race condition guard - prevent duplicate submissions
    if (subscribeProcessingRef.current) {
      console.log('⚠️ Subscribe already processing, ignoring duplicate click');
      return;
    }

    if (!user) {
      // Not authenticated - show fan capture modal
      setFanCaptureOpen(true);
      return;
    }

    // User is authenticated - directly subscribe them using service
    subscribeProcessingRef.current = true;

    try {
      const result = await fanCaptureService.subscribeToArtist({
        userId: user.uid,
        email: user.email,
        artistId: artist?.id,
        artistName: artist?.name,
        source: 'artist_page',
        incentiveType: 'newsletter',
        incentiveContent: `Get exclusive updates, early access to new releases, and behind-the-scenes content from ${artist?.name}`
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error subscribing to artist updates:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      subscribeProcessingRef.current = false;
    }
  };

  // Play all songs continuously
  const handlePlayAll = () => {
    if (artistSongs.length === 0) return;

    // Clear current queue and set all artist songs as the new queue
    dispatch({ type: actions.SET_QUEUE, payload: { queue: artistSongs, currentIndex: 0 } });
    dispatch({ type: actions.PLAY_AT, payload: 0 });
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !artist) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error" sx={{ mb: 2 }}>
          {error || `Artist "${decodeURIComponent(artistId)}" not found`}
        </Typography>
        <Typography variant="body2" sx={{ color: 'grey.400', mb: 2 }}>
          This artist may not exist in the database yet.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </Box>
    );
  }

  // Get artist image with fallback to first album cover
  const artistImage = getArtistImageUrl(artist, artistAlbums);

  return (
    <Box sx={{ height: '100%', overflow: 'auto', bgcolor: '#121212' }}>
      {/* Artist Header with blurred background */}
      <Box
        sx={{
          position: 'relative',
          p: 4,
          pb: 2,
          mb: 4,
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${artistImage})`,
            backgroundSize: 'cover',
            backgroundPosition: '50% 65%',
            filter: 'blur(50px) brightness(0.5)',
            transform: 'scale(1.1)',
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
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-end', position: 'relative', zIndex: 2 }}>
          <img
            src={artistImage}
            alt={artist.name}
            style={{ width: 200, height: 200, borderRadius: 8, objectFit: 'cover' }}
          />
          <Box sx={{ flex: 1 }}>
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
            {artist.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
            {/* Show real follower count from Firestore */}
            <Typography variant="body1" sx={{ color: 'grey.400' }}>
              {followerCount.toLocaleString()} {followerCount === 1 ? 'follower' : 'followers'}
            </Typography>

            {/* Calculate and show total plays from all songs */}
            {(() => {
              const totalPlays = artistSongs.reduce((sum, song) => sum + (song.playCount || 0), 0);
              if (totalPlays > 0) {
                return (
                  <>
                    <Typography variant="body1" sx={{ color: 'grey.600' }}>•</Typography>
                    <Typography variant="body1" sx={{ color: 'grey.400' }}>
                      {totalPlays.toLocaleString()} total plays
                    </Typography>
                  </>
                );
              }
              return null;
            })()}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
            <Typography variant="body2" sx={{ color: 'grey.500' }}>
              {artistSongs.length} {artistSongs.length === 1 ? 'song' : 'songs'}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleGetUpdates}
              sx={{
                borderColor: '#1DB954',
                color: '#1DB954',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                borderRadius: '20px',
                '&:hover': {
                  bgcolor: 'rgba(29, 185, 84, 0.1)',
                  borderColor: '#1ed760'
                }
              }}
            >
              Get Updates
            </Button>
            {user && (
              <Button
                variant={isFollowing ? "outlined" : "contained"}
                size="small"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFollow();
                }}
                sx={{
                  bgcolor: isFollowing ? 'transparent' : '#1DB954',
                  borderColor: '#1DB954',
                  color: isFollowing ? '#1DB954' : 'white',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  borderRadius: '20px',
                  '&:hover': {
                    bgcolor: isFollowing ? 'rgba(29, 185, 84, 0.1)' : '#1ed760',
                    borderColor: '#1ed760'
                  }
                }}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </Box>
        </Box>
      </Box>
      </Box>

      {/* Biography */}
      <Box sx={{ p: 4, pt: 0 }}>
      {artist.bio && artist.bio !== 'No biography available.' && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            About
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.400', lineHeight: 1.6 }}>
            {artist.bio}
          </Typography>
        </Box>
      )}

      {/* Play All Button */}
      {artistSongs.length > 0 && (
        <Button
          variant="contained"
          startIcon={<PlayArrow />}
          onClick={handlePlayAll}
          sx={{
            bgcolor: '#1db954',
            color: 'white',
            mb: 4,
            '&:hover': { bgcolor: '#1ed760' }
          }}
        >
          Play All
        </Button>
      )}

      {/* Albums Section */}
      {artistAlbums.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" sx={{ color: 'white', mb: 3 }}>
            Albums ({artistAlbums.length})
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 3 }}>
            {artistAlbums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </Box>
        </Box>
      )}

      {/* Songs List */}
      <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
        Songs {artistSongs.length > 0 && `(${artistSongs.length})`}
      </Typography>
      {artistSongs.length === 0 ? (
        <Typography variant="body1" sx={{ color: 'grey.500', textAlign: 'center', py: 4 }}>
          No songs available for this artist.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {artistSongs.map((song, index) => {
            const isCurrentSong = checkIsCurrentSong(song);
            const isPlaying = isSongPlaying(song);
            const isLiked = user?.likes?.includes(song.id);

            return (
              <Card
                key={song.id}
                sx={{
                  bgcolor: isCurrentSong ? '#2a2a2a' : '#1a1a1a',
                  '&:hover': { bgcolor: '#2a2a2a' },
                  cursor: 'pointer',
                  overflow: 'visible'
                }}
                onClick={() => playSong(song)}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, overflow: 'visible' }}>
                  <Typography sx={{ color: 'grey.500', minWidth: 30 }}>
                    {index + 1}
                  </Typography>
                  <Box sx={{ position: 'relative', width: 40, height: 40 }}>
                    <img
                      src={song.coverUrl || song.cover || '/images/Logo.png'}
                      alt={song.title}
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
                      {song.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'grey.400' }}>
                      {song.artistName || artist.name}
                    </Typography>
                  </Box>
                  {/* Play Count */}
                  <Box onClick={(e) => e.stopPropagation()}>
                    <SongPlayCount songId={song.id} />
                  </Box>
                  {/* Purchase Button */}
                  <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', zIndex: 10 }}>
                    <PurchaseButton
                      itemId={song.id}
                      itemType="song"
                      price={song.price || 199}
                      compact={true}
                      artistId={song.artistId}
                      uploadedBy={song.uploadedBy}
                    />
                  </div>
                  {/* Like/Favorite Button */}
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleLike(song);
                    }}
                    sx={{
                      color: isLiked ? '#e91e63' : 'grey.400',
                      '&:hover': { color: isLiked ? '#ad1457' : '#e91e63' }
                    }}
                  >
                    {isLiked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                  </IconButton>
                  {/* Add to Playlist Button */}
                  <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', zIndex: 10 }}>
                    <AddToPlaylistButton song={song} playlists={playlists} addSong={addSong} />
                  </div>
                  {/* Share Button */}
                  <ShareButton song={song} iconSize="small" />
                  {/* Play/Pause Button */}
                  <IconButton
                    size="small"
                    sx={{ color: '#1db954' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      playSong(song);
                    }}
                  >
                    {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
                  </IconButton>
                  {/* More Options Menu */}
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, song);
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
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: 'grey.800',
            border: '1px solid',
            borderColor: 'grey.700'
          }
        }}
      >
        {[
          <MenuItem key="play" onClick={() => { playSong(selectedSong); handleMenuClose(); }} sx={{ color: 'white' }}>
            <ListItemIcon>
              <PlayArrow sx={{ color: '#1DB954' }} />
            </ListItemIcon>
            <ListItemText>Play Now</ListItemText>
          </MenuItem>,

          <MenuItem key="queue" onClick={() => { dispatch({ type: actions.ENQUEUE, payload: { item: selectedSong } }); handleMenuClose(); }} sx={{ color: 'white' }}>
            <ListItemIcon>
              <QueueMusic sx={{ color: 'grey.400' }} />
            </ListItemIcon>
            <ListItemText>Add to Queue</ListItemText>
          </MenuItem>,

          <Divider key="divider1" sx={{ bgcolor: 'grey.700' }} />,

          <MenuItem key="playlist" onClick={() => handleMenuClose()} sx={{ color: 'white' }}>
            <ListItemIcon>
              <PlaylistAdd sx={{ color: 'grey.400' }} />
            </ListItemIcon>
            <ListItemText>Add to Playlist</ListItemText>
          </MenuItem>,

          <MenuItem key="share" onClick={() => handleMenuClose()} sx={{ color: 'white' }}>
            <ListItemIcon>
              <Share sx={{ color: 'grey.400' }} />
            </ListItemIcon>
            <ListItemText>Share</ListItemText>
          </MenuItem>,

          <Divider key="divider2" sx={{ bgcolor: 'grey.700' }} />,

          ...(!purchasedSongIds.has(selectedSong?.id) ? [
            <MenuItem key="purchase" onClick={() => handlePurchase(selectedSong)} sx={{ color: 'white' }}>
              <ListItemIcon>
                <ShoppingCart sx={{ color: '#1DB954' }} />
              </ListItemIcon>
              <ListItemText>Purchase ($1.99)</ListItemText>
            </MenuItem>
          ] : [])
        ]}
      </Menu>

      {/* Fan Capture Modal */}
      <FanCaptureModal
        open={fanCaptureOpen}
        onClose={() => setFanCaptureOpen(false)}
        artist={{
          id: artist?.id,
          name: artist?.name,
          photoURL: artist?.imageUrl
        }}
        incentiveType="newsletter"
        incentiveContent={`Get exclusive updates, early access to new releases, and behind-the-scenes content from ${artist?.name || 'this artist'}`}
      />
    </Box>
    </Box>
  );
}
