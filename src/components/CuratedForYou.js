import { useState, useEffect } from "react";
import { Box, Typography, Grid, Card, CardContent, CardMedia, IconButton, CircularProgress, Chip } from '@mui/material';
import { PlayArrow, Favorite, FavoriteBorder } from '@mui/icons-material';
import { collection, query, where, getDocs, limit as firestoreLimit, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useLikes } from '../context/LikesContext';
import { usePlaySong } from '../hooks/usePlaySong';
import PlayingIndicator from './PlayingIndicator';
import SongPlayCount from './SongPlayCount';
import SongLikeCount from './SongLikeCount';

/**
 * Curated content for the listener based on their preferences and listening history
 */
export default function CuratedForYou() {
  const { user } = useAuth();
  const { likes, addLike, removeLike, isLiked: checkIsLiked } = useLikes();
  const { playSong, isSongPlaying } = usePlaySong();

  const [loading, setLoading] = useState(true);
  const [curatedSections, setCuratedSections] = useState([]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadCuratedContent = async () => {
      try {
        setLoading(true);
        const sections = [];

        // 1. Based on your liked songs
        if (likes && likes.length > 0) {
          const likedSongsData = await fetchLikedSongs(likes);
          if (likedSongsData.length > 0) {
            const genres = extractGenres(likedSongsData);
            const artists = extractArtists(likedSongsData);

            // Get more songs from liked genres
            if (genres.length > 0) {
              const genreSongs = await fetchSongsByGenres(genres, likes);
              if (genreSongs.length > 0) {
                sections.push({
                  title: `Because you like ${genres[0]}`,
                  description: 'Songs matching your favorite genres',
                  icon: '🎵',
                  songs: genreSongs.slice(0, 6)
                });
              }
            }

            // Get more songs from liked artists
            if (artists.length > 0) {
              const artistSongs = await fetchSongsByArtists(artists, likes);
              if (artistSongs.length > 0) {
                sections.push({
                  title: `More from ${artists[0]}`,
                  description: 'Artists you love',
                  icon: '🎤',
                  songs: artistSongs.slice(0, 6)
                });
              }
            }
          }
        }

        // 2. Based on followed artists
        if (user.follows && user.follows.length > 0) {
          const followedSongs = await fetchSongsByArtists(user.follows, likes || []);
          if (followedSongs.length > 0) {
            sections.push({
              title: 'New from artists you follow',
              description: 'Stay updated with your favorite artists',
              icon: '⭐',
              songs: followedSongs.slice(0, 6)
            });
          }
        }

        // 3. Discover new music (songs not played much yet but from popular genres)
        const discoverySongs = await fetchDiscoverySongs(likes || []);
        if (discoverySongs.length > 0) {
          sections.push({
            title: 'Discover new music',
            description: 'Fresh tracks picked for you',
            icon: '🔍',
            songs: discoverySongs.slice(0, 6)
          });
        }

        // 4. Hidden gems (good songs with low play counts)
        const hiddenGems = await fetchHiddenGems(likes || []);
        if (hiddenGems.length > 0) {
          sections.push({
            title: 'Hidden gems',
            description: 'Great tracks you might have missed',
            icon: '💎',
            songs: hiddenGems.slice(0, 6)
          });
        }

        // 5. Trending in your genres
        if (likes && likes.length > 0) {
          const likedSongsData = await fetchLikedSongs(likes);
          const genres = extractGenres(likedSongsData);
          if (genres.length > 0) {
            const trendingInGenre = await fetchTrendingByGenre(genres[0], likes);
            if (trendingInGenre.length > 0) {
              sections.push({
                title: `Trending in ${genres[0]}`,
                description: 'Popular songs in your favorite genre',
                icon: '🔥',
                songs: trendingInGenre.slice(0, 6)
              });
            }
          }
        }

        setCuratedSections(sections);
      } catch (error) {
        console.error('Error loading curated content:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCuratedContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, likes]);

  // Helper functions
  const fetchLikedSongs = async (likedIds) => {
    if (likedIds.length === 0) return [];

    try {
      const songsQuery = query(
        collection(db, 'songs'),
        where('__name__', 'in', likedIds.slice(0, 10))
      );
      const snapshot = await getDocs(songsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching liked songs:', error);
      return [];
    }
  };

  const extractGenres = (songs) => {
    const genreCounts = {};
    songs.forEach(song => {
      if (song.genre) {
        genreCounts[song.genre] = (genreCounts[song.genre] || 0) + 1;
      }
    });
    return Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);
  };

  const extractArtists = (songs) => {
    const artistCounts = {};
    songs.forEach(song => {
      if (song.artist) {
        artistCounts[song.artist] = (artistCounts[song.artist] || 0) + 1;
      }
    });
    return Object.keys(artistCounts).sort((a, b) => artistCounts[b] - artistCounts[a]);
  };

  const fetchSongsByGenres = async (genres, excludeIds = []) => {
    try {
      const songsQuery = query(
        collection(db, 'songs'),
        where('genre', 'in', genres.slice(0, 3)),
        firestoreLimit(20)
      );
      const snapshot = await getDocs(songsQuery);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(song => !excludeIds.includes(song.id));
    } catch (error) {
      console.error('Error fetching songs by genres:', error);
      return [];
    }
  };

  const fetchSongsByArtists = async (artists, excludeIds = []) => {
    try {
      const songsQuery = query(
        collection(db, 'songs'),
        where('artist', 'in', artists.slice(0, 3)),
        firestoreLimit(20)
      );
      const snapshot = await getDocs(songsQuery);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(song => !excludeIds.includes(song.id));
    } catch (error) {
      console.error('Error fetching songs by artists:', error);
      return [];
    }
  };

  const fetchDiscoverySongs = async (excludeIds = []) => {
    try {
      const songsQuery = query(
        collection(db, 'songs'),
        orderBy('releaseDate', 'desc'),
        firestoreLimit(30)
      );
      const snapshot = await getDocs(songsQuery);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(song => !excludeIds.includes(song.id))
        .sort(() => Math.random() - 0.5); // Shuffle
    } catch (error) {
      console.error('Error fetching discovery songs:', error);
      return [];
    }
  };

  const fetchHiddenGems = async (excludeIds = []) => {
    try {
      // Get songs with low play counts but that exist
      const songsQuery = query(
        collection(db, 'songs'),
        firestoreLimit(50)
      );
      const snapshot = await getDocs(songsQuery);
      const songs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(song => !excludeIds.includes(song.id));

      // Sort by play count (ascending) and take the ones with some plays but not too many
      return songs
        .filter(song => (song.playCount || 0) > 0 && (song.playCount || 0) < 100)
        .sort((a, b) => (a.playCount || 0) - (b.playCount || 0));
    } catch (error) {
      console.error('Error fetching hidden gems:', error);
      return [];
    }
  };

  const fetchTrendingByGenre = async (genre, excludeIds = []) => {
    try {
      const songsQuery = query(
        collection(db, 'songs'),
        where('genre', '==', genre),
        orderBy('playCount', 'desc'),
        firestoreLimit(20)
      );
      const snapshot = await getDocs(songsQuery);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(song => !excludeIds.includes(song.id));
    } catch (error) {
      console.error('Error fetching trending by genre:', error);
      return [];
    }
  };

  if (!user) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Sign in to see personalized recommendations
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (curatedSections.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Start exploring music to get personalized recommendations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Like songs and follow artists to help us curate content for you
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {curatedSections.map((section, sectionIndex) => (
        <Box key={sectionIndex} sx={{ mb: 6 }}>
          {/* Section Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h3" sx={{ mr: 1, fontSize: 32 }}>
              {section.icon}
            </Typography>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {section.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {section.description}
              </Typography>
            </Box>
          </Box>

          {/* Songs Grid */}
          <Grid container spacing={2}>
            {section.songs.map((song) => {
              const isPlaying = isSongPlaying(song);
              const isLiked = checkIsLiked(song.id);

              return (
                <Grid item xs={12} sm={6} md={4} lg={2} key={song.id}>
                  <Card
                    sx={{
                      bgcolor: 'background.paper',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                  >
                    {/* Album Art */}
                    <Box sx={{ position: 'relative', paddingTop: '100%' }}>
                      <CardMedia
                        component="img"
                        image={song.cover || '/images/default-cover.jpg'}
                        alt={song.title}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />

                      {/* Play Button Overlay */}
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(0,0,0,0.4)',
                          opacity: 0,
                          transition: 'opacity 0.3s',
                          '&:hover': { opacity: 1 }
                        }}
                      >
                        {isPlaying ? (
                          <PlayingIndicator isPlaying={isPlaying} size="large" />
                        ) : (
                          <IconButton
                            size="large"
                            onClick={() => playSong(song)}
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

                    <CardContent sx={{ p: 2 }}>
                      {/* Song Title */}
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 'bold', mb: 0.5 }}
                        noWrap
                      >
                        {song.title}
                      </Typography>

                      {/* Artist */}
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {song.artist}
                      </Typography>

                      {/* Genre Tag */}
                      {song.genre && (
                        <Chip
                          label={song.genre}
                          size="small"
                          sx={{ mt: 1, height: 20, fontSize: '0.7rem' }}
                        />
                      )}

                      {/* Stats */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                        <SongPlayCount songId={song.id} />
                        <SongLikeCount songId={song.id} />
                      </Box>

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <IconButton
                          size="small"
                          onClick={async () => {
                            if (!user) return;
                            try {
                              if (isLiked) {
                                await removeLike(song.id);
                              } else {
                                await addLike(song.id);
                              }
                            } catch (error) {
                              console.error('Error toggling like:', error);
                            }
                          }}
                          sx={{
                            color: isLiked ? '#e91e63' : 'grey.400',
                            '&:hover': { color: isLiked ? '#ad1457' : '#e91e63' }
                          }}
                        >
                          {isLiked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      ))}
    </Box>
  );
}
