import { getDocs } from 'firebase/firestore';
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Skeleton from '@mui/material/Skeleton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Fade from '@mui/material/Fade';
import Link from '@mui/material/Link';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import MoreVert from '@mui/icons-material/MoreVert';
import Share from '@mui/icons-material/Share';
import PersonAdd from '@mui/icons-material/PersonAdd';
import PersonRemove from '@mui/icons-material/PersonRemove';
import Shuffle from '@mui/icons-material/Shuffle';
import QueueMusic from '@mui/icons-material/QueueMusic';
import AlbumIcon from '@mui/icons-material/Album';
import MusicNote from '@mui/icons-material/MusicNote';
import LocationOn from '@mui/icons-material/LocationOn';
import Language from '@mui/icons-material/Language';
import Facebook from '@mui/icons-material/Facebook';
import Twitter from '@mui/icons-material/Twitter';
import Instagram from '@mui/icons-material/Instagram';
import YouTube from '@mui/icons-material/YouTube';
import Apple from '@mui/icons-material/Apple';
import VerifiedUser from '@mui/icons-material/VerifiedUser';
import People from '@mui/icons-material/People';
import Visibility from '@mui/icons-material/Visibility';

import { FaSpotify } from 'react-icons/fa';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  increment
} from 'firebase/firestore';
import { toast } from 'react-toastify';

import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function Artist() {
  // Hooks must be called first
  const { artistId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, actions } = usePlayer();
  const { user, followArtist, unfollowArtist, isArtistFollowed, addLike, removeLike } = useAuth();
  const { musicData = [], playSong } = useOutletContext() || {};

  // Campaign analytics state
  const [campaignMetrics, setCampaignMetrics] = useState([]);

  // Load campaign metrics for this artist
  useEffect(() => {
    if (!artistId) return;
    const loadCampaignMetrics = async () => {
      try {
        const campaignsQuery = query(
          collection(db, 'campaigns'),
          where('artistId', '==', artistId),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(campaignsQuery);
        const metrics = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCampaignMetrics(metrics);
      } catch (err) {
        console.error('Error loading campaign metrics:', err);
      }
    };
    loadCampaignMetrics();
  }, [artistId]);

  // Artist state
  const [artist, setArtist] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [events, setEvents] = useState([]);
  const [similarArtists, setSimilarArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [activeTab, setActiveTab] = useState(0);
  const [showAllTracks, setShowAllTracks] = useState(false);

  // Load artist data
  useEffect(() => {
    if (!artistId || !musicData) return;

    const loadArtist = async () => {
      try {
        setLoading(true);

        // Decode the artist name from URL
        const decodedArtistName = decodeURIComponent(artistId);

        // Filter songs by artist from musicData.json
        const artistSongs = musicData.filter(song => song.artist === decodedArtistName);

        if (artistSongs.length === 0) {
          setError('Artist not found');
          setLoading(false);
          return;
        }

        // Create artist data from songs
        const artistData = {
          id: decodedArtistName,
          name: decodedArtistName,
          bio: artistSongs[0]?.biography || 'No biography available.',
          cover: artistSongs[0]?.cover || '/images/Logo.png',
          genre: artistSongs[0]?.category || 'Unknown'
        };
        setArtist(artistData);
        setTopTracks(artistSongs);

        setLoading(false);
      } catch (err) {
        console.error('Error loading artist:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadArtist();
  }, [artistId, musicData]);

  // Load similar artists
  const loadSimilarArtists = async (artistData) => {
    try {
      let similarQuery;

      if (artistData.genre) {
        similarQuery = query(
          collection(db, 'artists'),
          where('genre', '==', artistData.genre),
          orderBy('followers', 'desc'),
          limit(8)
        );
      }

      if (similarQuery) {
        const similarSnapshot = await getDocs(similarQuery);
        const similar = similarSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(a => a.id !== artistId);
        setSimilarArtists(similar);
      }
    } catch (err) {
      console.error('Error loading similar artists:', err);
    }
  };

  // Calculate artist stats
  const artistStats = React.useMemo(() => {
    const totalPlays = topTracks.reduce((sum, track) => sum + (track.playCount || 0), 0);
    const totalLikes = topTracks.reduce((sum, track) => sum + (track.likes || 0), 0);

    return {
      followers: artist?.followers || 0,
      monthlyListeners: artist?.monthlyListeners || 0,
      totalPlays,
      totalLikes,
      albumCount: albums.length,
      trackCount: topTracks.length,
      playlistFeatures: playlists.length,
      upcomingEvents: events.length
    };
  }, [artist, topTracks, albums, playlists, events]);

  // Event handlers
  const handlePlayArtist = useCallback(() => {
    if (topTracks.length === 0) return;

    // Set top tracks as queue and start playing
    dispatch({
      type: actions.SET_QUEUE,
      payload: {
        queue: topTracks,
        currentIndex: 0
      }
    });
    dispatch({ type: actions.TOGGLE_PLAY });
  }, [topTracks, dispatch, actions]);

  const handleShufflePlay = useCallback(() => {
    if (topTracks.length === 0) return;

    // Shuffle tracks and start playing
    const shuffled = [...topTracks].sort(() => Math.random() - 0.5);
    dispatch({
      type: actions.SET_QUEUE,
      payload: {
        queue: shuffled,
        currentIndex: 0
      }
    });
    dispatch({ type: actions.TOGGLE_PLAY });
  }, [topTracks, dispatch, actions]);

  const handlePlayTrack = useCallback((track, index) => {
    // Set artist's tracks as queue starting from selected track
    dispatch({
      type: actions.SET_QUEUE,
      payload: {
        queue: topTracks,
        currentIndex: index
      }
    });
    dispatch({ type: actions.TOGGLE_PLAY });
  }, [topTracks, dispatch, actions]);

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

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
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

  const getSocialIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return <Facebook />;
      case 'twitter': return <Twitter />;
      case 'instagram': return <Instagram />;
      case 'youtube': return <YouTube />;
  case 'spotify': return <FaSpotify />;
      case 'apple': return <Apple />;
      case 'website': return <Language />;
      default: return <Language />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
          <Skeleton variant="circular" width={200} height={200} />
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
        <Button variant="contained" onClick={() => navigate('/browse')}>
          Back to Browse
        </Button>
      </Box>
    );
  }

  const displayedTracks = showAllTracks ? topTracks : topTracks.slice(0, 5);

  return (
    <Box sx={{ height: '100%', overflow: 'auto', bgcolor: 'grey.900', color: 'white' }}>
      {/* Artist Header */}
      <Box
        sx={{
          background: `linear-gradient(180deg, rgba(29,185,84,0.8) 0%, rgba(18,18,18,1) 100%)`,
          p: 4,
          pb: 2
        }}
      >
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={artist?.imageUrl}
              sx={{
                width: 200,
                height: 200,
                fontSize: '4rem',
                border: '4px solid rgba(255,255,255,0.1)'
              }}
            >
              {artist?.name?.[0]}
            </Avatar>
            {artist?.verified && (
              <VerifiedUser
                sx={{
                  position: 'absolute',
                  bottom: 10,
                  right: 10,
                  color: '#1DB954',
                  bgcolor: 'white',
                  borderRadius: '50%',
                  fontSize: 24
                }}
              />
            )}
          </Box>

          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'white', opacity: 0.8 }}>
                Artist
              </Typography>
              {artist?.verified && (
                <Chip
                  icon={<VerifiedUser />}
                  label="Verified"
                  size="small"
                  sx={{ bgcolor: '#1DB954', color: 'white' }}
                />
              )}
            </Box>

            <Typography
              variant="h1"
              sx={{
                fontWeight: 'bold',
                fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
                mb: 2,
                background: 'linear-gradient(45deg, #fff, #ccc)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {artist?.name}
            </Typography>

            {/* Stats */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <People sx={{ color: 'grey.300' }} />
                <Typography variant="body2" sx={{ color: 'grey.300' }}>
                  {formatNumber(artistStats.followers)} followers
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Visibility sx={{ color: 'grey.300' }} />
                <Typography variant="body2" sx={{ color: 'grey.300' }}>
                  {formatNumber(artistStats.monthlyListeners)} monthly listeners
                </Typography>
              </Box>
              {artist?.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn sx={{ color: 'grey.300' }} />
                  <Typography variant="body2" sx={{ color: 'grey.300' }}>
                    {artist.location}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Genres */}
            {artist?.genres && (
              <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                {artist.genres.map((genre, index) => (
                  <Chip
                    key={index}
                    label={genre}
                    size="small"
                    sx={{ bgcolor: 'grey.700', color: 'white' }}
                  />
                ))}
              </Box>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                onClick={handlePlayArtist}
                disabled={topTracks.length === 0}
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
                disabled={topTracks.length === 0}
                sx={{ color: 'grey.300', '&:hover': { color: 'white' } }}
              >
                <Shuffle />
              </IconButton>

              {user && (
                <Button
                  variant={isArtistFollowed(artist?.name) ? "outlined" : "contained"}
                  size="large"
                  startIcon={isArtistFollowed(artist?.name) ? <PersonRemove /> : <PersonAdd />}
                  onClick={handleFollowArtist}
                  sx={{
                    bgcolor: isArtistFollowed(artist?.name) ? 'transparent' : '#1DB954',
                    borderColor: '#1DB954',
                    color: isArtistFollowed(artist?.name) ? '#1DB954' : 'white',
                    '&:hover': {
                      bgcolor: isArtistFollowed(artist?.name) ? 'rgba(29, 185, 84, 0.1)' : '#1ed760'
                    }
                  }}
                >
                  {isArtistFollowed(artist?.name) ? 'Following' : 'Follow'}
                </Button>
              )}

              <IconButton
                size="large"
                sx={{ color: 'grey.300', '&:hover': { color: 'white' } }}
              >
                <Share />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Content Tabs */}
      <Box sx={{ p: 3 }}>
        {/* Campaign Analytics Section */}
        {campaignMetrics.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
              Campaign Analytics
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={campaignMetrics} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Area type="monotone" dataKey="impressions" stroke="#1DB954" fill="#1DB954" name="Impressions" />
                <Area type="monotone" dataKey="clicks" stroke="#29b6f6" fill="#29b6f6" name="Clicks" />
                <Area type="monotone" dataKey="conversions" stroke="#e91e63" fill="#e91e63" name="Conversions" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
        <Box sx={{ borderBottom: 1, borderColor: 'grey.700', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(event, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                color: 'grey.400',
                '&.Mui-selected': { color: '#1DB954' }
              },
              '& .MuiTabs-indicator': { backgroundColor: '#1DB954' }
            }}
          >
            <Tab label="Popular" />
            <Tab label="Albums" />
            <Tab label="Playlists" />
            <Tab label="About" />
          </Tabs>
        </Box>

        {/* Popular Tab */}
        {activeTab === 0 && (
          <Fade in timeout={300}>
            <Box>
              {/* Top Tracks */}
              <Typography variant="h5" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
                Popular tracks
              </Typography>

              {displayedTracks.length > 0 ? (
                <Box sx={{ mb: 4 }}>
                  {displayedTracks.map((track, index) => {
                    const isCurrentTrack = state.queue[state.currentIndex]?.id === track.id;
                    const isLiked = user?.likes?.includes(track.id) || false;

                    return (
                      <Box
                        key={track.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 1,
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: 'grey.800',
                            '& .track-number': { display: 'none' },
                            '& .play-button': { display: 'block' },
                            '& .like-button': { opacity: 1 }
                          }
                        }}
                      >
                        <Box
                          sx={{
                            width: 40,
                            textAlign: 'center',
                            cursor: 'pointer'
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

                        <Box
                          component="img"
                          src={track.coverUrl || '/default-song-cover.jpg'}
                          alt={track.title}
                          sx={{ width: 40, height: 40, borderRadius: 1 }}
                        />

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 'bold',
                              color: isCurrentTrack ? '#1DB954' : 'white',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                            onClick={() => handlePlayTrack(track, index)}
                          >
                            {track.title}
                          </Typography>
                          {track.album && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'grey.400',
                                cursor: 'pointer',
                                '&:hover': { textDecoration: 'underline' }
                              }}
                              onClick={() => navigate(`/album/${track.albumId}`)}
                            >
                              {track.album}
                            </Typography>
                          )}
                        </Box>

                        <Typography variant="body2" sx={{ color: 'grey.400', minWidth: 60 }}>
                          {formatNumber(track.playCount || 0)}
                        </Typography>

                        <IconButton
                          size="small"
                          className="like-button"
                          onClick={() => handleToggleLike(track)}
                          sx={{
                            color: isLiked ? '#e91e63' : 'grey.400',
                            opacity: isLiked ? 1 : 0,
                            transition: 'opacity 0.2s',
                            '&:hover': { color: '#e91e63' }
                          }}
                        >
                          {isLiked ? <Favorite /> : <FavoriteBorder />}
                        </IconButton>

                        <Typography variant="body2" sx={{ color: 'grey.400', minWidth: 40 }}>
                          {formatDuration(track.duration || 0)}
                        </Typography>

                        <IconButton
                          size="small"
                          sx={{ color: 'grey.400', '&:hover': { color: 'white' } }}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    );
                  })}

                  {topTracks.length > 5 && (
                    <Button
                      variant="text"
                      onClick={() => setShowAllTracks(!showAllTracks)}
                      sx={{ color: 'grey.400', mt: 2 }}
                    >
                      {showAllTracks ? 'Show less' : `Show all ${topTracks.length} songs`}
                    </Button>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <MusicNote sx={{ fontSize: 64, color: 'grey.600', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: 'grey.400' }}>
                    No tracks available
                  </Typography>
                </Box>
              )}

              {/* Latest Album */}
              {albums.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
                    Latest release
                  </Typography>
                  <Card
                    sx={{
                      bgcolor: 'grey.800',
                      cursor: 'pointer',
                      maxWidth: 400,
                      '&:hover': { bgcolor: 'grey.700' }
                    }}
                    onClick={() => navigate(`/album/${albums[0].id}`)}
                  >
                    <Box sx={{ display: 'flex' }}>
                      <CardMedia
                        component="img"
                        sx={{ width: 120, height: 120 }}
                        image={albums[0].coverUrl || '/default-album-cover.jpg'}
                        alt={albums[0].title}
                      />
                      <CardContent sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: 'grey.400', mb: 1 }}>
                          {albums[0].type || 'Album'} • {formatDate(albums[0].releaseDate)}
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                          {albums[0].title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'grey.400' }}>
                          {albums[0].trackCount} songs
                        </Typography>
                      </CardContent>
                    </Box>
                  </Card>
                </Box>
              )}

              {/* Similar Artists */}
              {similarArtists.length > 0 && (
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
                    Fans also like
                  </Typography>
                  <Grid container spacing={2}>
                    {similarArtists.slice(0, 6).map((similarArtist) => (
                      <Grid item xs={6} sm={4} md={2} key={similarArtist.id}>
                        <Card
                          sx={{
                            bgcolor: 'grey.800',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.05)', bgcolor: 'grey.700' }
                          }}
                          onClick={() => navigate(`/artist/${similarArtist.id}`)}
                        >
                          <Avatar
                            src={similarArtist.imageUrl}
                            sx={{
                              width: '100%',
                              height: 180,
                              borderRadius: 2,
                              mb: 1
                            }}
                          >
                            {similarArtist.name?.[0]}
                          </Avatar>
                          <CardContent sx={{ p: 2, textAlign: 'center' }}>
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
                              {similarArtist.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'grey.400' }}>
                              Artist
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          </Fade>
        )}

        {/* Albums Tab */}
        {activeTab === 1 && (
          <Fade in timeout={300}>
            <Box>
              {albums.length > 0 ? (
                <Grid container spacing={2}>
                  {albums.map((album) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={album.id}>
                      <Card
                        sx={{
                          bgcolor: 'grey.800',
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          '&:hover': { transform: 'scale(1.05)', bgcolor: 'grey.700' }
                        }}
                        onClick={() => navigate(`/album/${album.id}`)}
                      >
                        <CardMedia
                          component="img"
                          height="200"
                          image={album.coverUrl || '/default-album-cover.jpg'}
                          alt={album.title}
                        />
                        <CardContent>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              color: 'white',
                              fontWeight: 'bold',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {album.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'grey.400', mb: 1 }}>
                            {formatDate(album.releaseDate)} • {album.type || 'Album'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'grey.500' }}>
                            {album.trackCount} songs
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <AlbumIcon sx={{ fontSize: 64, color: 'grey.600', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: 'grey.400' }}>
                    No albums available
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
        )}

        {/* Playlists Tab */}
        {activeTab === 2 && (
          <Fade in timeout={300}>
            <Box>
              {playlists.length > 0 ? (
                <Grid container spacing={2}>
                  {playlists.map((playlist) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={playlist.id}>
                      <Card
                        sx={{
                          bgcolor: 'grey.800',
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          '&:hover': { transform: 'scale(1.05)', bgcolor: 'grey.700' }
                        }}
                        onClick={() => navigate(`/playlist/${playlist.id}`)}
                      >
                        <CardMedia
                          component="img"
                          height="200"
                          image={playlist.coverUrl || '/default-playlist-cover.jpg'}
                          alt={playlist.name}
                        />
                        <CardContent>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              color: 'white',
                              fontWeight: 'bold',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {playlist.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'grey.400', mb: 1 }}>
                            By {playlist.creatorName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'grey.500' }}>
                            {formatNumber(playlist.followers || 0)} followers
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <QueueMusic sx={{ fontSize: 64, color: 'grey.600', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: 'grey.400' }}>
                    No playlists featuring this artist
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
        )}

        {/* About Tab */}
        {activeTab === 3 && (
          <Fade in timeout={300}>
            <Box>
              <Grid container spacing={4}>
                <Grid item xs={12} md={8}>
                  {/* Biography */}
                  {artist?.biography && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
                        About
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'grey.300', lineHeight: 1.8 }}>
                        {artist.biography}
                      </Typography>
                    </Box>
                  )}

                  {/* Upcoming Events */}
                  {events.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
                        Upcoming Events
                      </Typography>
                      {events.map((event) => (
                        <Card key={event.id} sx={{ bgcolor: 'grey.800', mb: 2 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <Box>
                                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                                  {event.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'grey.400', mb: 1 }}>
                                  {event.venue} • {event.city}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'grey.400' }}>
                                  {formatDate(event.date)}
                                </Typography>
                              </Box>
                              <Button
                                variant="outlined"
                                size="small"
                                sx={{
                                  borderColor: '#1DB954',
                                  color: '#1DB954',
                                  '&:hover': { borderColor: '#1ed760', color: '#1ed760' }
                                }}
                              >
                                Get Tickets
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12} md={4}>
                  {/* Stats */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
                      Stats
                    </Typography>
                    <List>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary="Monthly Listeners"
                          secondary={formatNumber(artistStats.monthlyListeners)}
                          primaryTypographyProps={{ color: 'grey.400', variant: 'body2' }}
                          secondaryTypographyProps={{ color: 'white', variant: 'h6' }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary="Total Plays"
                          secondary={formatNumber(artistStats.totalPlays)}
                          primaryTypographyProps={{ color: 'grey.400', variant: 'body2' }}
                          secondaryTypographyProps={{ color: 'white', variant: 'h6' }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary="Albums"
                          secondary={artistStats.albumCount}
                          primaryTypographyProps={{ color: 'grey.400', variant: 'body2' }}
                          secondaryTypographyProps={{ color: 'white', variant: 'h6' }}
                        />
                      </ListItem>
                    </List>
                  </Box>

                  {/* Social Links */}
                  {artist?.socialLinks && Object.keys(artist.socialLinks).length > 0 && (
                    <Box>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
                        Links
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {Object.entries(artist.socialLinks).map(([platform, url]) => (
                          <Link
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              color: 'grey.400',
                              textDecoration: 'none',
                              p: 1,
                              borderRadius: 1,
                              '&:hover': {
                                color: 'white',
                                bgcolor: 'grey.800'
                              }
                            }}
                          >
                            {getSocialIcon(platform)}
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                              {platform}
                            </Typography>
                          </Link>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>
          </Fade>
        )}
      </Box>
    </Box>
  );
}

export default Artist;