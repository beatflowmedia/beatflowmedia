import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../hooks/useModal';
import { curatorPaymentService } from '../services/curatorPaymentService';
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { FaMusic, FaDollarSign, FaRocket, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';

export default function ArtistCampaignManager() {
  const { user } = useAuth();
  const { showAlert } = useModal();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Campaign creation state
  const [userTracks, setUserTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState('');
  const [budget, setBudget] = useState(100);
  const [targetPlaylist, setTargetPlaylist] = useState('');
  const [availablePlaylists, setAvailablePlaylists] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCampaigns();
    loadUserTracks();
  }, [user]);

  const loadCampaigns = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const submissions = await curatorPaymentService.getArtistSubmissions(user.uid);
      setCampaigns(submissions);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
    setLoading(false);
  };

  const loadUserTracks = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'songs'), where('uploadedBy', '==', user.uid));
      const snapshot = await getDocs(q);
      const tracks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserTracks(tracks);
    } catch (error) {
      console.error('Error loading tracks:', error);
    }
  };

  const loadAvailablePlaylists = async () => {
    try {
      // TODO: Load playlists from curators
      // For now, mock data
      setAvailablePlaylists([
        { id: 'pl1', name: 'Indie Vibes', curatorName: 'Sarah Chen', followers: 47000, price: 150 },
        { id: 'pl2', name: 'Hip-Hop Heat', curatorName: 'Marcus Rivera', followers: 28000, price: 100 },
        { id: 'pl3', name: 'Electronic Dreams', curatorName: 'Emily Taylor', followers: 63000, price: 200 }
      ]);
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
  };

  const handleCreateCampaign = async () => {
    if (!selectedTrack || !targetPlaylist || budget < 25) {
      await showAlert('Info', 'Please complete all fields. Minimum budget is $25.', 'info');
      return;
    }

    setSubmitting(true);
    try {
      const playlist = availablePlaylists.find(p => p.id === targetPlaylist);
      const curatorId = 'mock_curator_id'; // TODO: Get from playlist

      const result = await curatorPaymentService.createPlaylistSubmission(
        user.uid,
        curatorId,
        selectedTrack,
        targetPlaylist,
        budget,
        user.email
      );

      // Redirect to Stripe checkout
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      await showAlert('Error', error.message || 'Failed to create campaign', 'error');
    }
    setSubmitting(false);
  };

  const handleNext = async () => {
    if (activeStep === 0 && !selectedTrack) {
      await showAlert('Info', 'Please select a track', 'info');
      return;
    }
    if (activeStep === 1 && !targetPlaylist) {
      await showAlert('Info', 'Please select a playlist', 'info');
      return;
    }
    if (activeStep === 1 && availablePlaylists.length === 0) {
      loadAvailablePlaylists();
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_review':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'completed':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending_review':
        return <FaClock />;
      case 'accepted':
        return <FaCheckCircle />;
      case 'rejected':
        return <FaTimesCircle />;
      case 'completed':
        return <FaCheckCircle />;
      default:
        return <FaClock />;
    }
  };

  const steps = ['Select Your Track', 'Choose Curator Playlist', 'Set Submission Budget'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>
          Playlist Placement Campaigns
        </Typography>
        <Button
          variant="contained"
          startIcon={<FaRocket />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{
            bgcolor: '#1db954',
            '&:hover': { bgcolor: '#1ed760' },
            fontWeight: 'bold'
          }}
        >
          Submit to Playlist
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3, bgcolor: '#0a0a0a', color: '#fff' }}>
        <strong>Pay curators to review and potentially add your tracks to their playlists.</strong> Curators receive payment regardless of acceptance. If rejected, you receive a full refund. Budget range: $25-$1,000 per placement.
      </Alert>

      {/* Active Campaigns */}
      {campaigns.length === 0 ? (
        <Card sx={{ bgcolor: '#181818', textAlign: 'center', p: 6 }}>
          <FaMusic size={48} color="#404040" style={{ marginBottom: 16 }} />
          <Typography variant="h6" sx={{ color: '#b3b3b3', mb: 2 }}>
            No playlist submissions yet
          </Typography>
          <Typography variant="body2" sx={{ color: '#808080', mb: 3 }}>
            Submit your tracks to curator playlists and get discovered by new listeners
          </Typography>
          <Button
            variant="contained"
            startIcon={<FaRocket />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ bgcolor: '#1db954', '&:hover': { bgcolor: '#1ed760' } }}
          >
            Submit to Playlist
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {campaigns.map((campaign) => (
            <Grid item xs={12} key={campaign.id}>
              <Card sx={{ bgcolor: '#181818', color: '#fff' }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FaMusic size={24} color="#1db954" />
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {campaign.trackTitle}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                            To: {campaign.playlistName}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FaDollarSign color="#1db954" />
                        <Typography variant="h6" sx={{ color: '#1db954', fontWeight: 'bold' }}>
                          ${campaign.submissionBudget}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#808080' }}>
                        Submission budget
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Chip
                        icon={getStatusIcon(campaign.status)}
                        label={campaign.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(campaign.status)}
                        sx={{ fontWeight: 'bold' }}
                      />
                      <Typography variant="caption" sx={{ color: '#808080', display: 'block', mt: 1 }}>
                        Submitted {campaign.submittedAt ? new Date(campaign.submittedAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={2}>
                      {campaign.status === 'rejected' && (
                        <Chip label="Refunded" color="error" variant="outlined" size="small" />
                      )}
                      {campaign.status === 'completed' && (
                        <Typography variant="body2" sx={{ color: '#1db954' }}>
                          ✓ Live on playlist
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Campaign Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => !submitting && setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#181818', color: '#fff' }}>
          Submit Track to Curator Playlist
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#181818', mt: 2 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': { color: '#b3b3b3' },
                    '& .MuiStepLabel-label.Mui-active': { color: '#1db954' }
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step 1: Select Track */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="body2" sx={{ color: '#b3b3b3', mb: 2 }}>
                Choose which track you want to submit to a curator's playlist
              </Typography>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#b3b3b3' }}>Select Track</InputLabel>
                <Select
                  value={selectedTrack}
                  onChange={(e) => setSelectedTrack(e.target.value)}
                  sx={{
                    color: '#fff',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: '#404040' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1db954' }
                  }}
                >
                  {userTracks.map((track) => (
                    <MenuItem key={track.id} value={track.id}>
                      {track.title} - {track.artistName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {userTracks.length === 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  You need to upload tracks before submitting to a playlist
                </Alert>
              )}
            </Box>
          )}

          {/* Step 2: Choose Playlist */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="body2" sx={{ color: '#b3b3b3', mb: 2 }}>
                Select a curator playlist for your track placement. Curators typically respond within 48 hours.
              </Typography>
              <Alert severity="info" sx={{ mb: 2, bgcolor: '#0a0a0a' }}>
                <strong>How it works:</strong> Submit your track → Curator reviews within 48 hours → If accepted: added to playlist → If rejected: full refund
              </Alert>
              <Grid container spacing={2}>
                {availablePlaylists.map((playlist) => (
                  <Grid item xs={12} key={playlist.id}>
                    <Card
                      sx={{
                        bgcolor: targetPlaylist === playlist.id ? '#1db95420' : '#0a0a0a',
                        border: targetPlaylist === playlist.id ? '2px solid #1db954' : '1px solid #404040',
                        cursor: 'pointer',
                        '&:hover': { borderColor: '#1db954' }
                      }}
                      onClick={() => setTargetPlaylist(playlist.id)}
                    >
                      <CardContent>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                          {playlist.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                          Curated by {playlist.curatorName}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                          <Chip label={`${(playlist.followers / 1000).toFixed(0)}K followers`} size="small" />
                          <Chip label={`$${playlist.price} suggested`} color="success" size="small" />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Step 3: Set Budget */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="body2" sx={{ color: '#b3b3b3', mb: 2 }}>
                Set your submission budget. This is the curator fee for reviewing your track.
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Submission Budget (USD)"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                InputProps={{
                  startAdornment: <FaDollarSign style={{ marginRight: 8, color: '#1db954' }} />
                }}
                helperText="Minimum: $25 | Maximum: $1,000"
                sx={{
                  '& .MuiInputBase-root': { color: '#fff' },
                  '& .MuiInputLabel-root': { color: '#b3b3b3' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#404040' },
                  '& .MuiFormHelperText-root': { color: '#808080' }
                }}
              />
              <Alert severity="info" sx={{ mt: 2, bgcolor: '#0a0a0a' }}>
                <strong>Payment & Refund Policy:</strong> Your payment is held securely until the curator reviews your track. If accepted, payment is released to the curator and your track is added to their playlist. If rejected, you receive a full refund within 3-5 business days.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#181818', p: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={submitting} sx={{ color: '#b3b3b3' }}>
            Cancel
          </Button>
          {activeStep > 0 && (
            <Button onClick={handleBack} disabled={submitting} sx={{ color: '#1db954' }}>
              Back
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button onClick={handleNext} variant="contained" sx={{ bgcolor: '#1db954', '&:hover': { bgcolor: '#1ed760' } }}>
              Next
            </Button>
          ) : (
            <Button
              onClick={handleCreateCampaign}
              disabled={submitting || budget < 25 || budget > 1000}
              variant="contained"
              sx={{ bgcolor: '#1db954', '&:hover': { bgcolor: '#1ed760' } }}
            >
              {submitting ? 'Processing...' : 'Create & Pay'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
