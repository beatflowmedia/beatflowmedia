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
import ThumbUp from '@mui/icons-material/ThumbUp';
import ThumbUpOffAlt from '@mui/icons-material/ThumbUpOffAlt';
import MoreVert from '@mui/icons-material/MoreVert';
import Share from '@mui/icons-material/Share';
import PlaylistAdd from '@mui/icons-material/PlaylistAdd';
import TrendingUp from '@mui/icons-material/TrendingUp';
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
import { useFavorites } from "../context/FavoritesContext";
import { usePlaySong } from "../hooks/usePlaySong";
import { toast } from "react-toastify";
import { db } from "../firebaseConfig";
import { collection, onSnapshot, query, orderBy, limit, where } from "firebase/firestore";
import ShareButton from "../utils/ShareButton";
import firebaseCache from "../utils/firebaseCache";
import { stripeService } from "../services/stripeService";
import { useNavigate } from "react-router-dom";
import OptimizedImage from "../components/OptimizedImage";

// Lazy load heavy components for better initial page load
const TrendingSongs = lazy(() => import("../components/TrendingSongs"));
const PersonalizedSections = lazy(() => import("../components/PersonalizedSections"));
const DiscoverWeeklyPreview = lazy(() => import("../components/DiscoverWeeklyPreview"));
const Footer = lazy(() => import("../components/Footer"));

function Home() {
  const { dispatch, actions } = usePlayer();
  const { user, followArtist, unfollowArtist, isArtistFollowed } = useAuth();
  const { addLike, removeLike, isLiked: checkIsLiked } = useLikes();
  const { addFavorite, removeFavorite, isFavorited: checkIsFavorited } = useFavorites();
  const { playSong: playSelectedSong, isSongPlaying } = usePlaySong();
  const navigate = useNavigate();
  // Enhanced state management for discovery features
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'music', 'podcasts', 'audiobooks'
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);
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
    const unsubscribers = [];

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

        const unsubTrending = onSnapshot(trendingQuery, (snapshot) => {
          const trending = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              playCount: doc.data().playCount || 0
            }))
            .filter(song => song.isVisible !== false); // Filter out hidden songs
          console.log('Home: Loaded', trending.length, 'visible trending songs from Firebase');
          setTrendingSongs(trending);
          firebaseCache.set(cacheKey, trending);
        });
        unsubscribers.push(unsubTrending);

        // Load new releases (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newReleasesQuery = query(
          collection(db, "songs"),
          where("releaseDate", ">", thirtyDaysAgo),
          orderBy("releaseDate", "desc"),
          limit(15)
        );

        const unsubReleases = onSnapshot(newReleasesQuery, (snapshot) => {
          const releases = snapshot.docs
            .map(doc => ({
              ...doc.data(),
              id: doc.data().id || doc.id  // Preserve original id if exists
            }))
            .filter(song => song.isVisible !== false); // Filter out hidden songs
          console.log('Home: Loaded', releases.length, 'new releases from Firebase (visible only)');
          setNewReleases(releases);
        });
        unsubscribers.push(unsubReleases);

        // Load recent albums
        const recentAlbumsQuery = query(
          collection(db, "albums"),
          orderBy("releaseDate", "desc"),
          limit(10)
        );

        const unsubAlbums = onSnapshot(recentAlbumsQuery, (snapshot) => {
          const albums = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .filter(album => album.isVisible !== false); // Filter hidden albums
          console.log('Home: Loaded', albums.length, 'visible recent albums from Firebase (real-time)');
          setRecentAlbums(albums);
        }, (error) => {
          console.log('Albums collection query failed:', error.message);
          setRecentAlbums([]);
        });
        unsubscribers.push(unsubAlbums);

        // Load featured artists
        const artistsQuery = query(
          collection(db, "artists"),
          where("featured", "==", true),
          limit(10)
        );

        const unsubArtists = onSnapshot(artistsQuery, (snapshot) => {
          const featuredArtistsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setFeaturedArtists(featuredArtistsData);
        });
        unsubscribers.push(unsubArtists);

        // Load podcasts
        const podcastsQuery = query(
          collection(db, "podcast_episodes"),
          orderBy("releaseDate", "desc"),
          limit(20)
        );

        const unsubPodcasts = onSnapshot(podcastsQuery, (snapshot) => {
          const podcastsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPodcasts(podcastsData);
        }, (error) => {
          console.log('Podcasts collection not available:', error.message);
          setPodcasts([]);
        });
        unsubscribers.push(unsubPodcasts);

        // Load audiobooks
        const audiobooksQuery = query(
          collection(db, "audiobooks"),
          orderBy("releaseDate", "desc"),
          limit(20)
        );

        const unsubAudiobooks = onSnapshot(audiobooksQuery, (snapshot) => {
          const audiobooksData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setAudiobooks(audiobooksData);
        }, (error) => {
          console.log('Audiobooks collection not available:', error.message);
          setAudiobooks([]);
        });
        unsubscribers.push(unsubAudiobooks);

        // Following filter is handled in getCurrentContent() function, no separate state needed

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

    // Cleanup all listeners
    return () => {
      unsubscribers.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
    };
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
        const recommendations = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            reason: "Based on your listening history"
          }))
          .filter(song => song.isVisible !== false); // Filter out hidden songs
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

  // Get current content based on active category and following filter
  const getCurrentContent = () => {
    let content = [];

    // Get base content by category
    switch (activeCategory) {
      case 'all':
        content = trendingSongs;
        break;
      case 'music':
        content = trendingSongs;
        break;
      case 'new-releases':
        content = newReleases;
        break;
      case 'podcasts':
        content = podcasts;
        break;
      case 'audiobooks':
        content = audiobooks;
        break;
      default:
        content = trendingSongs;
    }

    // Filter by following if enabled
    if (showFollowingOnly && user?.followedArtists && user.followedArtists.length > 0) {
      console.log('Following filter active. Followed artists:', user.followedArtists);
      content = content.filter(item => {
        const artistName = item.artist || item.creator || '';
        const isFollowed = user.followedArtists.includes(artistName);
        if (isFollowed) {
          console.log('Including item from followed artist:', artistName, item.title);
        }
        return isFollowed;
      });
      console.log('Filtered content count:', content.length);
    }

    return content;
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
  }, [user, checkIsLiked, addLike, removeLike]);

  const handleToggleFavorite = useCallback(async (song) => {
    if (!user) {
      toast.error("Please sign in to favorite songs");
      return;
    }

    try {
      // Check if already favorited
      const favorited = checkIsFavorited(song.id);

      if (favorited) {
        await removeFavorite(song.id);
        toast.success("Removed from favorites");
      } else {
        await addFavorite(song.id);
        toast.success("Added to favorites");
      }
    } catch (err) {
      toast.error("Failed to update favorites");
    }
  }, [user, checkIsFavorited, addFavorite, removeFavorite]);

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
    <Box sx={{
      px: { xs: 'clamp(0.75rem, calc(0.5rem + 1vw), 1rem)', sm: 'clamp(1rem, calc(0.5rem + 2vw), 3rem)' },
      py: 'clamp(1rem, calc(0.5rem + 2vw), 3rem)',
      height: '100%',
      overflow: 'auto',
      bgcolor: 'background.default'
    }}>
      {/* Hero Section */}
      <Box sx={{ mb: 'clamp(1.5rem, calc(1rem + 2vw), 4rem)' }}>
        <Typography
          sx={{
            color: 'text.primary',
            fontWeight: 'bold',
            fontSize: 'clamp(1.5rem, calc(1rem + 2vw), 3rem)',
            lineHeight: 'clamp(1.2, calc(1.1 + 0.2vw), 1.4)',
            mb: 'clamp(0.5rem, calc(0.25rem + 0.5vw), 1rem)',
            background: 'linear-gradient(45deg, #1DB954, #1ed760)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          {user ? `Welcome back, ${user.displayName?.split(' ')[0] || 'Music Lover'}!` : 'Discover Amazing Music'}
        </Typography>
        <Typography sx={{
          color: 'text.secondary',
          fontSize: 'clamp(0.875rem, calc(0.75rem + 0.5vw), 1rem)',
          mb: 'clamp(1rem, calc(0.5rem + 1vw), 2rem)'
        }}>
          {user ? 'Here\'s what\'s trending and personalized for you' : 'Explore trending tracks and new releases'}
        </Typography>
      </Box>

      {/* Category Filter Pills */}
      <Box sx={{ mb: 'clamp(1.5rem, calc(1rem + 1vw), 3rem)', position: 'relative' }}>
        {/* Fade gradient on right edge for mobile */}
        <Box sx={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 'clamp(40px, 10vw, 80px)',
          background: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
          display: { xs: 'block', md: 'none' }
        }} />
        <Box sx={{
          display: 'flex',
          gap: 'clamp(0.5rem, calc(0.25rem + 0.5vw), 1rem)',
          overflowX: 'auto',
          flexWrap: 'nowrap',
          pb: 'clamp(0.5rem, calc(0.25rem + 0.5vw), 1rem)',
          mb: 'clamp(0.75rem, calc(0.5rem + 0.5vw), 1.5rem)',
          pr: { xs: 'clamp(60px, 15vw, 100px)', md: 0 }, // Extra padding on right for mobile
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
        }}>
          <Chip
            label="All"
            onClick={() => setActiveCategory('all')}
            sx={{
              flexShrink: 0,
              fontSize: 'clamp(0.75rem, calc(0.7rem + 0.3vw), 0.875rem)',
              height: 'clamp(28px, calc(1.5rem + 0.5vw), 36px)',
              bgcolor: activeCategory === 'all' ? 'white' : 'transparent',
              color: activeCategory === 'all' ? 'black' : 'white',
              border: activeCategory === 'all' ? 'none' : '1px solid grey',
              '&:hover': { bgcolor: activeCategory === 'all' ? 'white' : 'rgba(255,255,255,0.1)' }
            }}
          />
          <Chip
            label="Music"
            onClick={() => setActiveCategory('music')}
            sx={{
              flexShrink: 0,
              fontSize: 'clamp(0.75rem, calc(0.7rem + 0.3vw), 0.875rem)',
              height: 'clamp(28px, calc(1.5rem + 0.5vw), 36px)',
              bgcolor: activeCategory === 'music' ? 'white' : 'transparent',
              color: activeCategory === 'music' ? 'black' : 'white',
              border: activeCategory === 'music' ? 'none' : '1px solid grey',
              '&:hover': { bgcolor: activeCategory === 'music' ? 'white' : 'rgba(255,255,255,0.1)' }
            }}
          />
          <Chip
            label="New Releases"
            onClick={() => setActiveCategory('new-releases')}
            sx={{
              flexShrink: 0,
              fontSize: 'clamp(0.75rem, calc(0.7rem + 0.3vw), 0.875rem)',
              height: 'clamp(28px, calc(1.5rem + 0.5vw), 36px)',
              bgcolor: activeCategory === 'new-releases' ? 'white' : 'transparent',
              color: activeCategory === 'new-releases' ? 'black' : 'white',
              border: activeCategory === 'new-releases' ? 'none' : '1px solid grey',
              '&:hover': { bgcolor: activeCategory === 'new-releases' ? 'white' : 'rgba(255,255,255,0.1)' }
            }}
          />
          <Chip
            label="Podcasts"
            onClick={() => setActiveCategory('podcasts')}
            sx={{
              flexShrink: 0,
              fontSize: 'clamp(0.75rem, calc(0.7rem + 0.3vw), 0.875rem)',
              height: 'clamp(28px, calc(1.5rem + 0.5vw), 36px)',
              bgcolor: activeCategory === 'podcasts' ? 'white' : 'transparent',
              color: activeCategory === 'podcasts' ? 'black' : 'white',
              border: activeCategory === 'podcasts' ? 'none' : '1px solid grey',
              '&:hover': { bgcolor: activeCategory === 'podcasts' ? 'white' : 'rgba(255,255,255,0.1)' }
            }}
          />
          <Chip
            label="Audiobooks"
            onClick={() => setActiveCategory('audiobooks')}
            sx={{
              flexShrink: 0,
              fontSize: 'clamp(0.75rem, calc(0.7rem + 0.3vw), 0.875rem)',
              height: 'clamp(28px, calc(1.5rem + 0.5vw), 36px)',
              bgcolor: activeCategory === 'audiobooks' ? 'white' : 'transparent',
              color: activeCategory === 'audiobooks' ? 'black' : 'white',
              border: activeCategory === 'audiobooks' ? 'none' : '1px solid grey',
              '&:hover': { bgcolor: activeCategory === 'audiobooks' ? 'white' : 'rgba(255,255,255,0.1)' }
            }}
          />
        </Box>

        {/* Following Filter (only show if user is logged in) */}
        {user && (
          <Box sx={{
            display: 'flex',
            gap: 'clamp(0.5rem, calc(0.25rem + 0.5vw), 1rem)'
          }}>
            <Chip
              label="Following"
              onClick={() => setShowFollowingOnly(!showFollowingOnly)}
              sx={{
                fontSize: 'clamp(0.75rem, calc(0.7rem + 0.3vw), 0.875rem)',
                height: 'clamp(28px, calc(1.5rem + 0.5vw), 36px)',
                bgcolor: showFollowingOnly ? '#1DB954' : 'transparent',
                color: 'white',
                border: showFollowingOnly ? 'none' : '1px solid grey',
                '&:hover': { bgcolor: showFollowingOnly ? '#1ed760' : 'rgba(255,255,255,0.1)' }
              }}
            />
          </Box>
        )}
      </Box>


      {/* Personalized Sections (only for logged in users and 'all'/'music' categories) */}
      {user && (activeCategory === 'all' || activeCategory === 'music') && (
        <>
          <Box sx={{ mb: 'clamp(1.5rem, calc(1rem + 2vw), 4rem)' }}>
            <Suspense fallback={
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                p: 'clamp(1.5rem, calc(1rem + 2vw), 4rem)'
              }}>
                <CircularProgress />
              </Box>
            }>
              <PersonalizedSections />
            </Suspense>
          </Box>
          <Divider sx={{ my: 'clamp(1.5rem, calc(1rem + 2vw), 4rem)' }} />
        </>
      )}

      {/* Discover Weekly Preview (2026 Hybrid Strategy - Algorithmic Seeding) */}
      {(activeCategory === 'all' || activeCategory === 'music') && (
        <>
          <Suspense fallback={
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              p: 'clamp(1.5rem, calc(1rem + 2vw), 4rem)'
            }}>
              <CircularProgress />
            </Box>
          }>
            <DiscoverWeeklyPreview />
          </Suspense>
          <Divider sx={{ my: 'clamp(1.5rem, calc(1rem + 2vw), 4rem)' }} />
        </>
      )}

      {/* Trending Songs Section */}
      <Box sx={{ mb: 'clamp(1.5rem, calc(1rem + 2vw), 4rem)' }}>
        <Suspense fallback={
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            p: 'clamp(1.5rem, calc(1rem + 2vw), 4rem)'
          }}>
            <CircularProgress />
          </Box>
        }>
          <TrendingSongs limit={10} daysBack={7} />
        </Suspense>
      </Box>

      <Divider sx={{ my: 'clamp(1.5rem, calc(1rem + 2vw), 4rem)' }} />

      {/* Featured Artists Section */}
      {featuredArtists.length > 0 && (
        <Box sx={{ mb: 'clamp(1.5rem, calc(1rem + 2vw), 4rem)' }}>
          <Typography sx={{
            color: 'text.primary',
            fontSize: 'clamp(1.125rem, calc(0.875rem + 1vw), 1.75rem)',
            mb: 'clamp(1rem, calc(0.5rem + 1vw), 2rem)',
            fontWeight: 'bold'
          }}>
            Featured Artists
          </Typography>
          <Grid container spacing={'clamp(0.5rem, calc(0.25rem + 1vw), 2rem)'}>
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
                    image={artist.imageUrl || '/default-artist.jpg'}
                    alt={artist.name}
                    loading="lazy"
                    sx={{
                      borderRadius: '50%',
                      width: 'clamp(80px, calc(4rem + 4vw), 140px)',
                      height: 'clamp(80px, calc(4rem + 4vw), 140px)',
                      mx: 'auto',
                      mt: 'clamp(0.5rem, calc(0.25rem + 1vw), 2rem)'
                    }}
                  />
                  <CardContent sx={{
                    textAlign: 'center',
                    pb: 'clamp(0.5rem, calc(0.25rem + 0.5vw), 1rem)'
                  }}>
                    <Typography sx={{
                      color: 'text.primary',
                      fontWeight: 'bold',
                      fontSize: 'clamp(0.75rem, calc(0.7rem + 0.3vw), 1rem)'
                    }}>
                      {artist.name}
                    </Typography>
                    <Typography sx={{
                      color: 'text.secondary',
                      fontSize: 'clamp(0.625rem, calc(0.6rem + 0.2vw), 0.875rem)'
                    }}>
                      {artist.followers?.toLocaleString() || 0} followers
                    </Typography>
                    <Box sx={{ mt: 'clamp(0.5rem, calc(0.25rem + 0.5vw), 1rem)' }}>
                      <Button
                        variant={isArtistFollowed(artist.name) ? "outlined" : "contained"}
                        onClick={() => handleFollowArtist(artist.name)}
                        sx={{
                          minWidth: 'auto',
                          fontSize: 'clamp(0.625rem, calc(0.6rem + 0.2vw), 0.75rem)',
                          minHeight: 'clamp(32px, calc(1.75rem + 0.5vw), 40px)',
                          py: 'clamp(0.25rem, calc(0.125rem + 0.3vw), 0.5rem)',
                          px: 'clamp(0.5rem, calc(0.25rem + 0.5vw), 1rem)',
                          bgcolor: isArtistFollowed(artist.name) ? 'transparent' : 'primary.main',
                          borderColor: 'primary.main',
                          color: isArtistFollowed(artist.name) ? 'primary.main' : 'white',
                        }}
                      >
                        {isArtistFollowed(artist.name) ? <PersonRemove sx={{ fontSize: 'clamp(12px, calc(0.75rem + 0.2vw), 14px)' }} /> : <PersonAdd sx={{ fontSize: 'clamp(12px, calc(0.75rem + 0.2vw), 14px)' }} />}
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
          <Divider sx={{ my: 'clamp(1.5rem, calc(1rem + 2vw), 4rem)' }} />
          <Box sx={{ mb: 'clamp(1.5rem, calc(1rem + 2vw), 4rem)' }}>
            <Typography sx={{
              color: 'text.primary',
              fontSize: 'clamp(1.125rem, calc(0.875rem + 1vw), 1.75rem)',
              mb: 'clamp(1rem, calc(0.5rem + 1vw), 2rem)',
              fontWeight: 'bold'
            }}>
              Recently Released Albums
            </Typography>
            <Grid container spacing={'clamp(0.5rem, calc(0.25rem + 1vw), 2rem)'}>
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
                    <OptimizedImage
                      src={album.coverUrl}
                      alt={album.title}
                      fallback="/default-album.jpg"
                      sx={{
                        width: '100%',
                        height: 'auto',
                        aspectRatio: '1 / 1'
                      }}
                    />
                    <CardContent sx={{ pb: 'clamp(0.5rem, calc(0.25rem + 1vw), 2rem)' }}>
                      <Typography
                        sx={{
                          color: 'text.primary',
                          fontWeight: 'bold',
                          fontSize: 'clamp(0.875rem, calc(0.75rem + 0.3vw), 1rem)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {album.title}
                      </Typography>
                      <Typography
                        sx={{
                          color: 'text.secondary',
                          fontSize: 'clamp(0.75rem, calc(0.7rem + 0.2vw), 0.875rem)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {album.artistName || album.artist}
                      </Typography>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'clamp(0.25rem, calc(0.125rem + 0.3vw), 1rem)',
                        mt: 'clamp(0.25rem, calc(0.125rem + 0.3vw), 1rem)'
                      }}>
                        <QueueMusic sx={{ fontSize: 'clamp(12px, calc(0.75rem + 0.2vw), 14px)', color: '#1DB954' }} />
                        <Typography sx={{
                          color: 'text.secondary',
                          fontSize: 'clamp(0.625rem, calc(0.6rem + 0.2vw), 0.75rem)'
                        }}>
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
          const isFavorited = checkIsFavorited(song.id);
          const isFollowingArtist = song.artist && isArtistFollowed(song.artist);
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
                {activeCategory === 'music' && index < 3 && (
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

                  {song.genre && (
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
                          color: isLiked ? '#1DB954' : 'grey.400',
                          '&:hover': { color: isLiked ? '#1ed760' : '#1DB954' }
                        }}
                        title={isLiked ? 'Unlike' : 'Like'}
                      >
                        {isLiked ? <ThumbUp fontSize="small" /> : <ThumbUpOffAlt fontSize="small" />}
                      </IconButton>

                      <IconButton
                        size="small"
                        onClick={() => handleToggleFavorite(song)}
                        sx={{
                          color: isFavorited ? '#e91e63' : 'grey.400',
                          '&:hover': { color: isFavorited ? '#f06292' : '#e91e63' }
                        }}
                        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {isFavorited ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                      </IconButton>

                      {song.artist && (
                        <IconButton
                          size="small"
                          onClick={() => handleFollowArtist(song.artist)}
                          sx={{
                            color: isFollowingArtist ? '#1DB954' : 'grey.400',
                            '&:hover': { color: isFollowingArtist ? '#1ed760' : '#1DB954' }
                          }}
                          title={isFollowingArtist ? `Unfollow ${song.artist}` : `Follow ${song.artist}`}
                        >
                          {isFollowingArtist ? <PersonRemove fontSize="small" /> : <PersonAdd fontSize="small" />}
                        </IconButton>
                      )}

                      <IconButton
                        size="small"
                        onClick={() => handleAddToPlaylist(song)}
                        sx={{ color: 'grey.400', '&:hover': { color: '#1DB954' } }}
                        title="Add to playlist"
                      >
                        <PlaylistAdd fontSize="small" />
                      </IconButton>

                      <ShareButton song={song} iconSize="small" />
                    </Box>

                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, song)}
                      sx={{ color: 'grey.400', '&:hover': { color: 'white' } }}
                      title="More options"
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
                  <OptimizedImage
                    src={activity.coverUrl}
                    alt={activity.title}
                    height={80}
                    fallback="/default-song-cover.jpg"
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
