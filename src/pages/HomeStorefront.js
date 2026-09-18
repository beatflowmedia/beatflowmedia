// Music Licensing Marketplace - Browse and license tracks for social media
import { useState, useEffect } from "react";
import { Box, Grid, IconButton, Chip, Typography, Button } from "@mui/material";
import { PlayArrow, Pause, Download, Timer, Speed } from '@mui/icons-material';
import { useAuth } from "../context/AuthContext";
import { usePlaySong } from "../hooks/usePlaySong";
import { db } from "../firebaseConfig";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import OptimizedImage from "../components/OptimizedImage";
import { stripeService } from "../services/stripeService";
import { useNavigate } from "react-router-dom";
import { artworkUrl } from '../utils/artwork';

function HomeStorefront({ hideHeader = false, filter = null }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { playSong: playSelectedSong, isSongPlaying } = usePlaySong();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [licensedTrackIds, setLicensedTrackIds] = useState(new Set());

  // Load user's licensed tracks (subscriptions grant access to all)
  useEffect(() => {
    let isMounted = true;
    const loadUserLicenses = async () => {
      if (!user) {
        if (isMounted) setLicensedTrackIds(new Set());
        return;
      }

      try {
        const purchases = await stripeService.getUserPurchases(user.uid);
        if (isMounted) setLicensedTrackIds(new Set(purchases.map(p => p.itemId)));
      } catch (error) {
        console.error('Error loading licenses:', error);
      }
    };

    loadUserLicenses();
    return () => { isMounted = false; };
  }, [user]);

  // Load all available tracks for licensing
  useEffect(() => {
    // isMounted mirrors the loadUserLicenses effect for symmetry. Note: unsubscribe()
    // already synchronously detaches the listener, so this guard is belt-and-suspenders,
    // not a fix for a live race — the callback won't fire after cleanup runs.
    let isMounted = true;
    setLoading(true);

    // The limit has to clear the whole catalogue, not a page of it.
    //
    // "Newest 100, then drop the un-licensable ones" returned ZERO: the 134 seeded
    // records are all previewOnly and all newer than the 4 licensable tracks, which
    // sit at ranks 135-138 by createdAt. The storefront showed "No Tracks Available
    // Yet" while holding four perfectly sellable licences.
    //
    // This cannot be a Firestore where('previewOnly','==',false) instead, which is
    // what it should be: a MISSING field is excluded from a query that mentions it,
    // and those 4 records have no previewOnly field at all, so the server-side
    // filter would hide exactly the tracks we want. Moving it server-side needs the
    // flag written explicitly on every record first.
    //
    // Reads are billed now that the project is on Blaze, so this is a stopgap with a
    // known cost (~138 reads per load), not the end state.
    const tracksQuery = query(
      collection(db, "songs"),
      orderBy("createdAt", "desc"),
      limit(500)
    );

    const unsubscribe = onSnapshot(tracksQuery, (snapshot) => {
      if (!isMounted) return;
      const loadedTracks = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(track => {
          // A licensable track must have playable audio; skip broken/incomplete docs
          // so paying customers never see an un-previewable, un-purchasable grid slot.
          if (!track.audioUrl) {
            console.warn(`[Storefront] Skipping track "${track.title || track.id}" — missing audioUrl`);
            return false;
          }
          // previewOnly means audioUrl points at a 30-second clip, not the master.
          // The record is streamable but not licensable, so it has no place in a
          // grid whose every tile is a buy button. create-checkout refuses these
          // too; this filter is the courtesy, that one is the guarantee.
          if (track.previewOnly === true) {
            return false;
          }
          return true;
        });
      setTracks(loadedTracks);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handlePreviewTrack = (track) => {
    // usePlaySong toggles play/pause when this is already the current track,
    // so the card's play/pause state stays in sync with the global player.
    playSelectedSong(track);
  };

  const handleLicenseTrack = (track) => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Navigate to track page for licensing details
    navigate(`/song/${track.id}`);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--';
    const total = Math.floor(seconds);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', color: 'white' }}>
        Loading marketplace...
      </Box>
    );
  }

  // Apply the active browse-category filter, if any. Soft categories fall back to
  // showing everything when nothing matches yet (e.g. platform tags not populated).
  const matched = filter?.match ? tracks.filter(filter.match) : tracks;
  const visibleTracks = filter?.soft && matched.length === 0 ? tracks : matched;

  if (visibleTracks.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', color: 'white' }}>
        <Box sx={{ fontSize: '3rem', mb: 2 }}>🎵</Box>
        <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold', mb: 1 }}>
          No Tracks Available Yet
        </Box>
        <Box sx={{ color: 'grey.400' }}>
          Check back soon for music to license!
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      px: { xs: 2, sm: 3, md: 4 },
      py: hideHeader ? 0 : 4,
      height: '100%',
      overflow: 'auto',
      bgcolor: 'background.default'
    }}>
      {/* Header */}
      {!hideHeader && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
            Browse Music
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.400' }}>
            {visibleTracks.length} track{visibleTracks.length !== 1 ? 's' : ''} available for licensing
          </Typography>
        </Box>
      )}

      {/* Marketplace Grid - Individual Tracks */}
      <Grid container spacing={3}>
        {visibleTracks.map((track) => {
          const isLicensed = licensedTrackIds.has(track.id);
          const isPreviewing = isSongPlaying(track);

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={track.id}>
              <Box
                sx={{
                  bgcolor: 'rgba(255,255,255,0.05)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.08)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                  }
                }}
              >
                {/* Track Cover Art */}
                <Box sx={{ position: 'relative', paddingTop: '100%' }}>
                  <OptimizedImage
                    src={artworkUrl(track)}
                    alt={track.title || 'Track cover'}
                    fallback="/images/Logo.png"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />

                  {/* Licensed Badge */}
                  {isLicensed && (
                    <Chip
                      icon={<Download />}
                      label="Licensed"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: '#1DB954',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.7rem'
                      }}
                    />
                  )}

                  {/* Preview Button Overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      // Mobile (touch) has no reliable hover, so reveal the preview
                      // control by default on small screens; hover-reveal on desktop.
                      bgcolor: { xs: 'rgba(0,0,0,0.25)', md: 'rgba(0,0,0,0.4)' },
                      opacity: { xs: 1, md: 0 },
                      transition: 'opacity 0.3s',
                      '&:hover, &:focus-within': { opacity: 1 }
                    }}
                  >
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewTrack(track);
                      }}
                      sx={{
                        bgcolor: isPreviewing ? '#ff4444' : '#1DB954',
                        color: 'white',
                        '&:focus-visible': {
                          outline: '3px solid #ffffff',
                          outlineOffset: '2px'
                        },
                        '&:hover': {
                          bgcolor: isPreviewing ? '#ff6666' : '#1ed760',
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      {isPreviewing ? <Pause sx={{ fontSize: 32 }} /> : <PlayArrow sx={{ fontSize: 32 }} />}
                    </IconButton>
                  </Box>
                </Box>

                {/* Track Info */}
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" noWrap sx={{ color: 'white', fontWeight: 'bold', mb: 0.5 }}>
                    {track.title || 'Untitled Track'}
                  </Typography>
                  <Typography variant="body2" noWrap sx={{ color: 'grey.400', mb: 2 }}>
                    {track.artistName || track.artist || 'Unknown Artist'}
                  </Typography>

                  {/* Track Metadata */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {track.duration && (
                      <Chip
                        icon={<Timer />}
                        label={formatDuration(track.duration)}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.7rem' }}
                      />
                    )}
                    {track.bpm && (
                      <Chip
                        icon={<Speed />}
                        label={`${track.bpm} BPM`}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.7rem' }}
                      />
                    )}
                    {track.mainGenre && (
                      <Chip
                        label={track.mainGenre}
                        size="small"
                        sx={{ bgcolor: 'rgba(29,185,84,0.2)', color: '#1DB954', fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>

                  {/* License Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleLicenseTrack(track)}
                    sx={{
                      bgcolor: isLicensed ? 'grey.700' : '#1DB954',
                      color: 'white',
                      fontWeight: 'bold',
                      '&:focus-visible': {
                        outline: '3px solid #ffffff',
                        outlineOffset: '2px'
                      },
                      '&:hover': {
                        bgcolor: isLicensed ? 'grey.600' : '#1ed760'
                      }
                    }}
                  >
                    {isLicensed ? 'View License' : 'License Track'}
                  </Button>
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

export default HomeStorefront;
