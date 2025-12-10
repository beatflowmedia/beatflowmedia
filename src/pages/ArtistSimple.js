import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent, CircularProgress, IconButton } from '@mui/material';
import { PlayArrow, Pause, Favorite, FavoriteBorder } from '@mui/icons-material';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { usePlaySong } from '../hooks/usePlaySong';
import { useAuth } from '../context/AuthContext';
import { usePlaylistManager } from '../hooks/usePlaylistManager';
import { usePlayer } from '../context/PlayerContext';
import AddToPlaylistButton from '../utils/AddToPlaylistButton';
import ShareButton from '../utils/ShareButton';
import PlayingIndicator from '../components/PlayingIndicator';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load artist data from Firebase
  useEffect(() => {
    let isCancelled = false;

    const loadArtist = async () => {
      try {
        setLoading(true);
        setError(null);

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

        if (!artistsSnapshot.empty) {
          const artistDoc = artistsSnapshot.docs[0];
          const artistData = { id: artistDoc.id, ...artistDoc.data() };
          setArtist(artistData);

          // Fetch songs for this artist (using artistName field)
          console.log('Querying songs for artistName:', artistName);
          const songsQuery = query(
            collection(db, 'songs'),
            where('artistName', '==', artistName)
          );
          const songsSnapshot = await getDocs(songsQuery);
          const songs = songsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          console.log('Found artist with', songs.length, 'songs');

          // Debug: If no songs found, try querying with 'artist' field instead
          if (songs.length === 0) {
            console.log('No songs found with artistName, trying artist field...');
            const altQuery = query(
              collection(db, 'songs'),
              where('artist', '==', artistName)
            );
            const altSnapshot = await getDocs(altQuery);
            const altSongs = altSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log('Found', altSongs.length, 'songs with artist field');
            setArtistSongs(altSongs);
          } else {
            setArtistSongs(songs);
          }
        } else {
          console.log('Artist not found in Firebase:', artistName);
          setError(`Artist "${artistName}" not found`);
        }
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
    };
  }, [artistId]);

  // Like/favorite toggle handler (DRY - same as Home.js)
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

  return (
    <Box sx={{ p: 4, height: '100%', overflow: 'auto', bgcolor: '#121212' }}>
      {/* Artist Header with cover image */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, alignItems: 'flex-end' }}>
        <img
          src={artist.profileImage || artist.cover || '/images/Logo.png'}
          alt={artist.name}
          style={{ width: 200, height: 200, borderRadius: 8, objectFit: 'cover' }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
            {artist.name}
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.400', mb: 1 }}>
            {artist.monthlyListeners
              ? `${Number(artist.monthlyListeners).toLocaleString()} monthly listeners`
              : 'Music Artist'
            }
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.500' }}>
            {artistSongs.length} {artistSongs.length === 1 ? 'song' : 'songs'}
          </Typography>
        </Box>
      </Box>

      {/* Biography */}
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
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
