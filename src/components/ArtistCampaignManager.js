/**
 * Artist Campaign Manager - AI Smart Playlist Placement
 *
 * Phase 1: Preview of AI placement system
 * Shows AI-powered playlist matching (no payment required)
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { recommendationService } from '../services/recommendationService';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { FaMusic, FaRobot, FaCheckCircle, FaFire } from 'react-icons/fa';

export default function ArtistCampaignManager() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyzeDialogOpen, setAnalyzeDialogOpen] = useState(false);

  // AI Analysis state
  const [userTracks, setUserTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [matchedPlaylists, setMatchedPlaylists] = useState([]);

  useEffect(() => {
    loadUserTracks();
  }, [user]);

  const loadUserTracks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'songs'), where('uploadedBy', '==', user.uid));
      const snapshot = await getDocs(q);
      const tracks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserTracks(tracks);
    } catch (error) {
      console.error('Error loading tracks:', error);
    }
    setLoading(false);
  };

  const handleAnalyzeTrack = async () => {
    if (!selectedTrack) {
      return;
    }

    setAnalyzing(true);
    try {
      console.log('🤖 Analyzing track for playlist placement...');
      const matches = await recommendationService.getPlaylistPlacementForTrack(selectedTrack);
      setMatchedPlaylists(matches);
      console.log(`✅ Found ${matches.length} compatible playlists`);
    } catch (error) {
      console.error('❌ Error analyzing track:', error);
      setMatchedPlaylists([]);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress sx={{ color: '#1DB954' }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FaRobot size={28} color="#1DB954" />
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>
            AI Smart Playlist Placement
          </Typography>
          <Chip
            label="BETA"
            size="small"
            sx={{
              bgcolor: 'rgba(29, 185, 84, 0.2)',
              color: '#1DB954',
              fontWeight: 'bold'
            }}
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<FaRobot />}
          onClick={() => setAnalyzeDialogOpen(true)}
          disabled={userTracks.length === 0}
          sx={{
            bgcolor: '#1db954',
            '&:hover': { bgcolor: '#1ed760' },
            fontWeight: 'bold'
          }}
        >
          Analyze Track
        </Button>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3, bgcolor: '#0a0a0a', color: '#fff' }}>
        <strong>AI-Powered Playlist Matching:</strong> Our AI analyzes your tracks and finds the best-fit playlists on the platform.
        No payment required - this is automatic placement based on genre compatibility!
      </Alert>

      {/* Empty State */}
      {userTracks.length === 0 ? (
        <Card sx={{ bgcolor: '#181818', textAlign: 'center', p: 6 }}>
          <FaMusic size={48} color="#404040" style={{ marginBottom: 16 }} />
          <Typography variant="h6" sx={{ color: '#b3b3b3', mb: 2 }}>
            No tracks uploaded yet
          </Typography>
          <Typography variant="body2" sx={{ color: '#808080', mb: 3 }}>
            Upload your music to get AI-powered playlist placement recommendations
          </Typography>
        </Card>
      ) : (
        <Card sx={{ bgcolor: '#181818', p: 4 }}>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
            How It Works
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  bgcolor: 'rgba(29, 185, 84, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}>
                  <Typography sx={{ fontSize: '2rem' }}>1️⃣</Typography>
                </Box>
                <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}>
                  Select Your Track
                </Typography>
                <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                  Choose which song you want to analyze for playlist placement
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  bgcolor: 'rgba(29, 185, 84, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}>
                  <FaRobot size={24} color="#1DB954" />
                </Box>
                <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}>
                  AI Analysis
                </Typography>
                <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                  Our AI matches your track's genre and style to compatible playlists
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  bgcolor: 'rgba(29, 185, 84, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}>
                  <FaCheckCircle size={24} color="#1DB954" />
                </Box>
                <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}>
                  Get Matched
                </Typography>
                <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                  See compatibility scores and get placed in best-fit playlists
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, p: 3, bgcolor: '#0a0a0a', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ color: '#1DB954', fontWeight: 'bold', mb: 1 }}>
              🚀 Coming Soon: Phase 2
            </Typography>
            <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
              • Acoustic analysis (tempo, energy, mood matching)<br/>
              • Automatic playlist addition for high-scoring tracks (>85%)<br/>
              • Real-time notifications when your tracks get placed<br/>
              • Analytics dashboard showing playlist performance
            </Typography>
          </Box>
        </Card>
      )}

      {/* Analyze Track Dialog */}
      <Dialog
        open={analyzeDialogOpen}
        onClose={() => !analyzing && setAnalyzeDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#181818', color: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FaRobot size={24} color="#1DB954" />
            <span>AI Playlist Matching</span>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ bgcolor: '#181818', mt: 2 }}>
          {/* Track Selection */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel sx={{ color: '#b3b3b3' }}>Select Track</InputLabel>
            <Select
              value={selectedTrack}
              onChange={(e) => {
                setSelectedTrack(e.target.value);
                setMatchedPlaylists([]); // Clear previous results
              }}
              sx={{
                color: '#fff',
                '.MuiOutlinedInput-notchedOutline': { borderColor: '#404040' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1db954' }
              }}
            >
              {userTracks.map((track) => (
                <MenuItem key={track.id} value={track.id}>
                  {track.title} - {track.artist || track.artistName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Analyze Button */}
          {selectedTrack && matchedPlaylists.length === 0 && !analyzing && (
            <Button
              fullWidth
              variant="contained"
              startIcon={<FaRobot />}
              onClick={handleAnalyzeTrack}
              sx={{
                bgcolor: '#1db954',
                '&:hover': { bgcolor: '#1ed760' },
                py: 1.5,
                mb: 3
              }}
            >
              Analyze with AI
            </Button>
          )}

          {/* Loading State */}
          {analyzing && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#1DB954', mb: 2 }} />
              <Typography sx={{ color: '#b3b3b3' }}>
                AI is analyzing your track...
              </Typography>
            </Box>
          )}

          {/* Results */}
          {matchedPlaylists.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                <FaFire style={{ marginRight: 8 }} color="#1DB954" />
                {matchedPlaylists.length} Compatible Playlists Found
              </Typography>

              <Grid container spacing={2}>
                {matchedPlaylists.map((playlist) => (
                  <Grid item xs={12} key={playlist.id}>
                    <Card sx={{ bgcolor: '#0a0a0a', border: '1px solid #404040' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 'bold' }}>
                              {playlist.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#b3b3b3' }}>
                              By {playlist.creatorName || 'Unknown'}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${Math.round(playlist.compatibilityScore * 100)}% Match`}
                            sx={{
                              bgcolor: playlist.compatibilityScore > 0.8 ? 'rgba(29, 185, 84, 0.2)' : 'rgba(255, 165, 0, 0.2)',
                              color: playlist.compatibilityScore > 0.8 ? '#1DB954' : '#FFA500',
                              fontWeight: 'bold'
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#808080' }}>
                          {playlist.reason}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {matchedPlaylists.some(p => p.compatibilityScore > 0.85) && (
                <Alert severity="success" sx={{ mt: 3, bgcolor: 'rgba(29, 185, 84, 0.1)' }}>
                  <strong>High compatibility detected!</strong> Tracks with >85% match scores will be automatically added to playlists in Phase 2.
                </Alert>
              )}
            </Box>
          )}

          {matchedPlaylists.length === 0 && selectedTrack && !analyzing && (
            <Alert severity="info" sx={{ bgcolor: '#0a0a0a' }}>
              No compatible playlists found. Try uploading tracks in different genres or check back as new playlists are added.
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ bgcolor: '#181818', p: 2 }}>
          <Button
            onClick={() => {
              setAnalyzeDialogOpen(false);
              setSelectedTrack('');
              setMatchedPlaylists([]);
            }}
            sx={{ color: '#b3b3b3' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
