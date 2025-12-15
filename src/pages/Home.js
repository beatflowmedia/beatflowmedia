import { useState, useEffect, memo, useCallback, lazy, Suspense } from "react";
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Skeleton,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from "@mui/material";
import PlayArrow from '@mui/icons-material/PlayArrow';
import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import MoreVert from '@mui/icons-material/MoreVert';
import Share from '@mui/icons-material/Share';
import PlaylistAdd from '@mui/icons-material/PlaylistAdd';
import TrendingUp from '@mui/icons-material/TrendingUp';
import Whatshot from '@mui/icons-material/Whatshot';
import NewReleases from '@mui/icons-material/NewReleases';
import MusicNote from '@mui/icons-material/MusicNote';
import PersonAdd from '@mui/icons-material/PersonAdd';
import PersonRemove from '@mui/icons-material/PersonRemove';
import QueueMusic from '@mui/icons-material/QueueMusic';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import Download from '@mui/icons-material/Download';
import CheckCircle from '@mui/icons-material/CheckCircle';
import PlayingIndicator from "../components/PlayingIndicator";
import SongLikeCount from "../components/SongLikeCount";
import SongPlayCount from "../components/SongPlayCount";
import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import { useLikes } from "../context/LikesContext";
import { usePlaySong } from "../hooks/usePlaySong";
import { toast } from "react-toastify";
import { db } from "../firebaseConfig";
import { collection, onSnapshot, query, orderBy, limit, where } from "firebase/firestore";
import ShareButton from "../utils/ShareButton";
import firebaseCache from "../utils/firebaseCache";
import { stripeService } from "../services/stripeService";
import { useNavigate } from "react-router-dom";

// Lazy load heavy components for better initial page load
const TrendingSongs = lazy(() => import("../components/TrendingSongs"));
const PersonalizedSections = lazy(() => import("../components/PersonalizedSections"));
const Footer = lazy(() => import("../components/Footer"));

function Home() {
  const { dispatch, actions } = usePlayer();
  const { user, followArtist, unfollowArtist, isArtistFollowed } = useAuth();
  const { addLike, removeLike, isLiked: checkIsLiked } = useLikes();
  const { playSong: playSelectedSong, isSongPlaying } = usePlaySong();
  const navigate = useNavigate();
  // Enhanced state management for discovery features
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Content state
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [recentAlbums, setRecentAlbums] = useState([]);
  const [setRecommendedSongs] = useState([]);
  const [featuredArtists, setFeaturedArtists] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [podcasts, setPodcasts] = useState([]);
  const [audiobooks, setAudiobooks] = useState([]);
  const [purchasedSongIds, setPurchasedSongIds] = useState(new Set());

  // UI state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);

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
        console.log('Loaded', songIds.size, 'purchased songs for user');
      } catch (error) {
        console.error('Error loading purchases:', error);
      }
    };

    loadUserPurchases();

    // Listen for purchase completion events
    const handlePurchaseComplete = (event) => {
      if (event.detail?.itemId && event.detail?.itemType === 'song') {
        setPurchasedSongIds(prev => new Set([...prev, event.detail.itemId]));
        console.log('Purchase complete event received, added to purchased songs:', event.detail.itemId);
      }
    };

    window.addEventListener('purchaseComplete', handlePurchaseComplete);
    return () => window.removeEventListener('purchaseComplete', handlePurchaseComplete);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // Only reload when user logs in/out, not when user object changes

  // Load trending content
  useEffect(() => {
    const loadTrendingContent = async () => {
      try {
        setLoading(true);

        // Load trending songs (most played in last 7 days)
        const cacheKey = firebaseCache.generateKey('songs', { orderBy: 'playCount', limit: 20 });
        const cachedTrending = firebaseCache.get(cacheKey);

        if (cachedTrending) {
          console.log('Home: Loaded', cachedTrending.length, 'trending songs from cache');
          setTrendingSongs(cachedTrending);
        }

        const trendingQuery = query(
          collection(db, "songs"),
          orderBy("playCount", "desc"),
          limit(20)
        );

        onSnapshot(trendingQuery, (snapshot) => {
          const trending = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            playCount: doc.data().playCount || 0
          }));
          console.log('Home: Loaded', trending.length, 'trending songs from Firebase');
          setTrendingSongs(trending);
          firebaseCache.set(cacheKey, trending);
        });

        // Load new releases (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newReleasesQuery = query(
          collection(db, "songs"),
          where("releaseDate", ">", thirtyDaysAgo),
          orderBy("releaseDate", "desc"),
          limit(15)
        );

        onSnapshot(newReleasesQuery, (snapshot) => {
          const releases = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.data().id || doc.id  // Preserve original id if exists
          }));
          console.log('Home: Loaded', releases.length, 'new releases from Firebase');
          setNewReleases(releases);
        });

        // Load recent albums
        const recentAlbumsQuery = query(
          collection(db, "albums"),
          orderBy("releaseDate", "desc"),
          limit(10)
        );

        onSnapshot(recentAlbumsQuery, (snapshot) => {
          const albums = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log('Home: Loaded', albums.length, 'recent albums from Firebase');
          setRecentAlbums(albums);
        }, (error) => {
          console.log('Albums collection query failed:', error.message);
          setRecentAlbums([]);
        });

        // Load featured artists
        const artistsQuery = query(
          collection(db, "artists"),
          where("featured", "==", true),
          limit(10)
        );

        onSnapshot(artistsQuery, (snapshot) => {
          const featuredArtistsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setFeaturedArtists(featuredArtistsData);
        });

        // Load podcasts
        const podcastsQuery = query(
          collection(db, "podcast_episodes"),
          orderBy("releaseDate", "desc"),
          limit(20)
        );

        onSnapshot(podcastsQuery, (snapshot) => {
          const podcastsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPodcasts(podcastsData);
        }, (error) => {
          console.log('Podcasts collection not available:', error.message);
          setPodcasts([]);
        });

        // Load audiobooks
        const audiobooksQuery = query(
          collection(db, "audiobooks"),
          orderBy("releaseDate", "desc"),
          limit(20)
        );

        onSnapshot(audiobooksQuery, (snapshot) => {
          const audiobooksData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setAudiobooks(audiobooksData);
        }, (error) => {
          console.log('Audiobooks collection not available:', error.message);
          setAudiobooks([]);
        });

        // Generate personalized recommendations if user is logged in
        if (user) {
          loadPersonalizedContent();
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading content:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadTrendingContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // Only reload when user logs in/out, not when user object changes

  // Simple recommendation algorithm
  const generateRecommendations = useCallback(async (history) => {
    if (!history.length) return;

    // Extract genres and artists from history
    const genres = [...new Set(history.map(h => h.genre).filter(Boolean))];

    try {
      // Find songs with similar genres or from followed artists
      const recommendationsQuery = query(
        collection(db, "songs"),
        where("genre", "in", genres.slice(0, 10)), // Firestore 'in' limit
        limit(20)
      );

      onSnapshot(recommendationsQuery, (snapshot) => {
        const recommendations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          reason: "Based on your listening history"
        }));
        setRecommendedSongs(recommendations);
      });
    } catch (err) {
      console.error("Error generating recommendations:", err);
    }
  }, [setRecommendedSongs]);

  // Load personalized content for authenticated users
  const loadPersonalizedContent = useCallback(async () => {
    if (!user) return;

    try {
      // Load user's listening history for recommendations
      const historyQuery = query(
        collection(db, "listening_history"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(50)
      );

      onSnapshot(historyQuery, (snapshot) => {
        const history = snapshot.docs.map(doc => doc.data());

        // Generate recommendations based on listening history
        generateRecommendations(history);
        setUserActivity(history.slice(0, 10)); // Recent activity
      });

    } catch (err) {
      console.error("Error loading personalized content:", err);
    }
  }, [user, generateRecommendations]);

  // Get current content based on active tab
  const getCurrentContent = () => {
    switch (activeTab) {
      case 0: return trendingSongs; // All
      case 1: return trendingSongs; // Music
      case 2: return newReleases; // New Releases
      case 3: return podcasts; // Podcasts
      case 4: return audiobooks; // Audiobooks
      default: return trendingSongs;
    }
  };

  const currentContent = getCurrentContent();

  // Enhanced interaction handlers - using DRY hook
  const handlePlaySong = useCallback((song) => {
    playSelectedSong(song);
  }, [playSelectedSong]);

  const handleToggleLike = useCallback(async (song) => {
    if (!user) {
      toast.error("Please sign in to like songs");
      return;
    }

    try {
      // Check if already liked
      const liked = checkIsLiked(song.id);

      if (liked) {
        await removeLike(song.id);
        toast.success("Removed from liked songs");
      } else {
        await addLike(song.id);
        toast.success("Added to liked songs");
      }
    } catch (err) {
      toast.error("Failed to update likes");
    }
  }, [checkIsLiked, addLike, removeLike]);

  const handleFollowArtist = useCallback(async (artistName) => {
    if (!user) {
      toast.error("Please sign in to follow artists");
      return;
    }

    try {
      const isFollowing = isArtistFollowed(artistName);

      if (isFollowing) {
        await unfollowArtist(artistName);
        toast.success(`Unfollowed ${artistName}`);
      } else {
        await followArtist(artistName);
        toast.success(`Following ${artistName}`);
      }
    } catch (err) {
      toast.error("Failed to update follow status");
    }
  }, [user, followArtist, unfollowArtist, isArtistFollowed]);

  const handleMenuOpen = useCallback((event, song) => {
    setAnchorEl(event.currentTarget);
    setSelectedSong(song);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedSong(null);
  }, []);

  const handleShare = useCallback((song) => {
    setSelectedSong(song);
    handleMenuClose();
  }, [handleMenuClose]);

  const handleAddToPlaylist = useCallback((song) => {
    setSelectedSong(song);
    handleMenuClose();
  }, [handleMenuClose]);

  const handlePurchase = useCallback(async (song) => {
    handleMenuClose();
    if (!user) {
      toast.error('Please sign in to purchase music');
      return;
    }

    try {
      // Check if already purchased
      if (purchasedSongIds.has(song.id)) {
        toast.info('You already own this song! Redirecting to downloads...');
        navigate('/downloads');
        return;
      }

      // Create checkout session
      await stripeService.createSongCheckout(user.uid, song.id, user.email);
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(`Failed to initiate purchase: ${error.message}`);
    }
  }, [user, navigate, handleMenuClose, purchasedSongIds]);

  // Tab change handler
  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, color: 'white' }}>
          Discover Music
        </Typography>
        <Grid container spacing={2}>
          {[...Array(8)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card sx={{ bgcolor: 'grey.800' }}>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
          Error loading content
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error}
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            color: 'text.primary',
            fontWeight: 'bold',
            mb: 1,
            background: 'linear-gradient(45deg, #1DB954, #1ed760)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          {user ? `Welcome back, ${user.displayName?.split(' ')[0] || 'Music Lover'}!` : 'Discover Amazing Music'}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
          {user ? 'Here\'s what\'s trending and personalized for you' : 'Explore trending tracks and new releases'}
        </Typography>
      </Box>

      {/* Category Filter Pills */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          label="All"
          onClick={() => setActiveTab(0)}
          sx={{
            bgcolor: activeTab === 0 ? 'white' : 'transparent',
            color: activeTab === 0 ? 'black' : 'white',
            border: activeTab === 0 ? 'none' : '1px solid grey',
            '&:hover': { bgcolor: activeTab === 0 ? 'white' : 'rgba(255,255,255,0.1)' }
          }}
        />
        <Chip
          label="Music"
          onClick={() => setActiveTab(1)}
          sx={{
            bgcolor: activeTab === 1 ? 'white' : 'transparent',
            color: activeTab === 1 ? 'black' : 'white',
            border: activeTab === 1 ? 'none' : '1px solid grey',
            '&:hover': { bgcolor: activeTab === 1 ? 'white' : 'rgba(255,255,255,0.1)' }
          }}
        />
        <Chip
          label="New Releases"
          onClick={() => setActiveTab(2)}
          sx={{
            bgcolor: activeTab === 2 ? 'white' : 'transparent',
            color: activeTab === 2 ? 'black' : 'white',
            border: activeTab === 2 ? 'none' : '1px solid grey',
            '&:hover': { bgcolor: activeTab === 2 ? 'white' : 'rgba(255,255,255,0.1)' }
          }}
        />
        <Chip
          label="Podcasts"
          onClick={() => setActiveTab(3)}
          sx={{
            bgcolor: activeTab === 3 ? 'white' : 'transparent',
            color: activeTab === 3 ? 'black' : 'white',
            border: activeTab === 3 ? 'none' : '1px solid grey',
            '&:hover': { bgcolor: activeTab === 3 ? 'white' : 'rgba(255,255,255,0.1)' }
          }}
        />
        <Chip
          label="Audiobooks"
          onClick={() => setActiveTab(4)}
          sx={{
            bgcolor: activeTab === 4 ? 'white' : 'transparent',
            color: activeTab === 4 ? 'black' : 'white',
            border: activeTab === 4 ? 'none' : '1px solid grey',
            '&:hover': { bgcolor: activeTab === 4 ? 'white' : 'rgba(255,255,255,0.1)' }
          }}
        />
      </Box>

      {/* Navigation Tabs - Hidden, kept for functionality */}
      <Box sx={{ display: 'none' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main'
            }
          }}
        >
          <Tab
            icon={<TrendingUp />}
            label={user ? "For You" : "Trending"}
            iconPosition="start"
          />
          <Tab
            icon={<Whatshot />}
            label="Trending"
            iconPosition="start"
          />
          <Tab
            icon={<NewReleases />}
            label="New Releases"
            iconPosition="start"
          />
          {user && (
            <Tab
              icon={<MusicNote />}
              label="Recommended"
              iconPosition="start"
            />
          )}
        </Tabs>
      </Box>

      {/* Personalized Sections (only for logged in users) */}
      {user && (
        <>
          <Box sx={{ mb: 4 }}>
            <Suspense fallback={
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            }>
              <PersonalizedSections />
            </Suspense>
          </Box>
          <Divider sx={{ my: 4 }} />
        </>
      )}

      {/* Trending Songs Section */}
      <Box sx={{ mb: 4 }}>
        <Suspense fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        }>
          <TrendingSongs limit={10} daysBack={7} />
        </Suspense>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Featured Artists Section */}
      {featuredArtists.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ color: 'text.primary', mb: 2, fontWeight: 'bold' }}>
            Featured Artists
          </Typography>
          <Grid container spacing={2}>
            {featuredArtists.slice(0, 5).map((artist) => (
              <Grid item xs={6} sm={4} md={2.4} key={artist.id}>
                <Card
                  sx={{
                    bgcolor: 'background.paper',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    height="120"
                    image={artist.imageUrl || '/default-artist.jpg'}
                    alt={artist.name}
                    loading="lazy"
                    sx={{ borderRadius: '50%', width: 120, height: 120, mx: 'auto', mt: 2 }}
                  />
                  <CardContent sx={{ textAlign: 'center', pb: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                      {artist.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {artist.followers?.toLocaleString() || 0} followers
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Button
                        size="small"
                        variant={isArtistFollowed(artist.name) ? "outlined" : "contained"}
                        onClick={() => handleFollowArtist(artist.name)}
                        sx={{
                          minWidth: 'auto',
                          fontSize: '0.75rem',
                          py: 0.5,
                          bgcolor: isArtistFollowed(artist.name) ? 'transparent' : 'primary.main',
                          borderColor: 'primary.main',
                          color: isArtistFollowed(artist.name) ? 'primary.main' : 'white',
                        }}
                      >
                        {isArtistFollowed(artist.name) ? <PersonRemove sx={{ fontSize: 14 }} /> : <PersonAdd sx={{ fontSize: 14 }} />}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Recently Released Albums Section */}
      {recentAlbums.length > 0 && (
        <>
          <Divider sx={{ my: 4 }} />
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ color: 'text.primary', mb: 2, fontWeight: 'bold' }}>
              Recently Released Albums
            </Typography>
            <Grid container spacing={2}>
              {recentAlbums.map((album) => (
                <Grid item xs={6} sm={4} md={2.4} lg={2} key={album.id}>
                  <Card
                    onClick={() => navigate(`/album/${album.id}`)}
                    sx={{
                      bgcolor: '#1e1e1e',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                        bgcolor: '#282828'
                      }
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="160"
                      image={album.coverUrl || '/default-album.jpg'}
                      alt={album.title}
                      loading="lazy"
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ pb: 2 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          color: 'text.primary',
                          fontWeight: 'bold',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {album.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {album.artistName || album.artist}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <QueueMusic sx={{ fontSize: 14, color: '#1DB954' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {album.trackCount || 0} tracks
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </>
      )}

      {/* Main Content Grid */}
      <Grid container spacing={2}>
        {currentContent.map((song, index) => {
          const isPlaying = isSongPlaying(song);
          const isLiked = checkIsLiked(song.id);
          const isPurchased = purchasedSongIds.has(song.id);

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={song.id}>
              <Card
                sx={{
                  bgcolor: 'background.paper',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  maxWidth: 'clamp(200px, 100%, 280px)',
                  margin: '0 auto',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
              >
                {/* Trending Badge */}
                {activeTab === 1 && index < 3 && (
                  <Chip
                    icon={<TrendingUp />}
                    label={`#${index + 1}`}
                    size="small"
                    color="primary"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      zIndex: 1,
                      fontWeight: 'bold'
                    }}
                  />
                )}

                {/* Purchased Badge */}
                {isPurchased && (
                  <Chip
                    icon={<CheckCircle />}
                    label="Owned"
                    size="small"
                    color="success"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 1,
                      fontWeight: 'bold',
                      bgcolor: '#1DB954',
                      color: 'white'
                    }}
                  />
                )}

                <Box sx={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
                  <CardMedia
                    component="img"
                    image={song.coverUrl || song.cover || '/default-song-cover.jpg'}
                    alt={song.title}
                    loading="lazy"
                    sx={{
                      cursor: 'pointer',
                      width: '100%',
                      height: 'auto',
                      aspectRatio: '1 / 1',
                      objectFit: 'cover'
                    }}
                    onClick={() => handlePlaySong(song)}
                  />

                  {/* Play Overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: isPlaying ? 1 : 0,
                      transition: 'opacity 0.3s',
                      cursor: 'pointer',
                      '&:hover': { opacity: 1 }
                    }}
                    onClick={() => handlePlaySong(song)}
                  >
                    {isPlaying ? (
                      <PlayingIndicator isPlaying={isPlaying} size="large" />
                    ) : (
                      <IconButton
                        size="large"
                        color="primary"
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'primary.light', transform: 'scale(1.1)' }
                        }}
                      >
                        <PlayArrow />
                      </IconButton>
                    )}
                  </Box>
                </Box>

                <CardContent sx={{
                  p: 'clamp(0.75rem, 2vw, 1rem)',
                  '&:last-child': { pb: 'clamp(0.75rem, 2vw, 1rem)' }
                }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: 'text.primary',
                      fontWeight: 'bold',
                      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                      cursor: 'pointer',
                      '&:hover': { color: 'primary.main' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    onClick={() => handlePlaySong(song)}
                  >
                    {song.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                      cursor: 'pointer',
                      '&:hover': { color: 'primary.main' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    onClick={() => handleFollowArtist(song.artist)}
                  >
                    {song.artist}
                  </Typography>

                  {song.genre && activeTab !== 2 && (
                    <Chip
                      label={song.genre}
                      size="small"
                      sx={{
                        mt: 1,
                        bgcolor: 'grey.700',
                        color: 'white',
                        fontSize: '0.7rem'
                      }}
                    />
                  )}

                  {/* Stats */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                    <SongPlayCount songId={song.id} />
                    <SongLikeCount songId={song.id} />
                  </Box>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleLike(song)}
                        sx={{
                          color: isLiked ? '#e91e63' : 'grey.400',
                          '&:hover': { color: isLiked ? '#ad1457' : '#e91e63' }
                        }}
                      >
                        {isLiked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                      </IconButton>

                      <IconButton
                        size="small"
                        onClick={() => handleAddToPlaylist(song)}
                        sx={{ color: 'grey.400', '&:hover': { color: '#1DB954' } }}
                      >
                        <PlaylistAdd fontSize="small" />
                      </IconButton>

                      <ShareButton song={song} iconSize="small" />
                    </Box>

                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, song)}
                      sx={{ color: 'grey.400', '&:hover': { color: 'white' } }}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: 'grey.800',
            border: '1px solid',
            borderColor: 'grey.700'
          }
        }}
      >
        <MenuItem onClick={() => handlePlaySong(selectedSong)} sx={{ color: 'white' }}>
          <ListItemIcon>
            <PlayArrow sx={{ color: '#1DB954' }} />
          </ListItemIcon>
          <ListItemText>Play Now</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => dispatch({ type: actions.ENQUEUE, payload: { item: selectedSong } })} sx={{ color: 'white' }}>
          <ListItemIcon>
            <QueueMusic sx={{ color: 'grey.400' }} />
          </ListItemIcon>
          <ListItemText>Add to Queue</ListItemText>
        </MenuItem>

        <Divider sx={{ bgcolor: 'grey.700' }} />

        <MenuItem onClick={() => handleAddToPlaylist(selectedSong)} sx={{ color: 'white' }}>
          <ListItemIcon>
            <PlaylistAdd sx={{ color: 'grey.400' }} />
          </ListItemIcon>
          <ListItemText>Add to Playlist</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleShare(selectedSong)} sx={{ color: 'white' }}>
          <ListItemIcon>
            <Share sx={{ color: 'grey.400' }} />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>

        <Divider sx={{ bgcolor: 'grey.700' }} />

        <MenuItem onClick={() => handlePurchase(selectedSong)} sx={{ color: 'white' }}>
          <ListItemIcon>
            {purchasedSongIds.has(selectedSong?.id) ? (
              <Download sx={{ color: '#1DB954' }} />
            ) : (
              <ShoppingCart sx={{ color: '#1DB954' }} />
            )}
          </ListItemIcon>
          <ListItemText>
            {purchasedSongIds.has(selectedSong?.id) ? 'Download' : 'Purchase ($0.99)'}
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Recent Activity Section for Logged-in Users */}
      {user && userActivity.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
            Recently Played
          </Typography>
          <Grid container spacing={1}>
            {userActivity.slice(0, 6).map((activity, index) => (
              <Grid item xs={6} sm={4} md={2} key={index}>
                <Card
                  sx={{
                    bgcolor: 'grey.800',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'grey.700' }
                  }}
                  onClick={() => handlePlaySong(activity)}
                >
                  <CardMedia
                    component="img"
                    height="80"
                    image={activity.coverUrl || '/default-song-cover.jpg'}
                    alt={activity.title}
                    loading="lazy"
                  />
                  <CardContent sx={{ p: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'white',
                        fontWeight: 'bold',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {activity.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'grey.400',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {activity.artist}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Footer */}
      <Suspense fallback={<Box sx={{ p: 2 }} />}>
        <Footer />
      </Suspense>
    </Box>
  );
}

export default memo(Home);
