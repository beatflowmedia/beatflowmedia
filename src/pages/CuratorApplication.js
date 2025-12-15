// src/pages/CuratorApplication.js
// Curator application form
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  LinearProgress
} from '@mui/material';
import { CheckCircle, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';

const GENRE_OPTIONS = [
  'Hip Hop', 'R&B', 'Pop', 'Rock', 'Electronic', 'Jazz', 'Classical',
  'Country', 'Reggae', 'Latin', 'Indie', 'Alternative', 'Metal', 'Folk',
  'Blues', 'Soul', 'Funk', 'World', 'Ambient', 'Other'
];

const EXPERIENCE_LEVELS = [
  'Less than 1 year',
  '1-2 years',
  '3-5 years',
  '5+ years',
  '10+ years'
];

export default function CuratorApplication() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    experienceLevel: '',
    genres: [],
    playlistLink: '',
    followerCount: '',
    spotifyProfileLink: '',
    instagramLink: '',
    tiktokLink: '',
    whyCurator: '',
    curatorExperience: '',
    availability: ''
  });

  const [proofScreenshot, setProofScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  const MINIMUM_FOLLOWERS = 1000;

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleGenreToggle = (genre) => {
    setForm(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Screenshot must be less than 5MB');
      return;
    }

    setProofScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.name || !form.email || !form.experienceLevel || form.genres.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate follower count
    const followerCount = parseInt(form.followerCount);
    if (!followerCount || followerCount < MINIMUM_FOLLOWERS) {
      toast.error(`You must have at least ${MINIMUM_FOLLOWERS.toLocaleString()} followers to apply`);
      return;
    }

    // Require screenshot proof
    if (!proofScreenshot) {
      toast.error('Please upload a screenshot showing your playlist follower count');
      return;
    }

    if (!user) {
      toast.error('Please sign in to submit your application');
      navigate('/?signin=true');
      return;
    }

    setLoading(true);

    try {
      // Upload screenshot to Firebase Storage
      const screenshotRef = ref(storage, `curator-applications/${user.uid}/${Date.now()}_${proofScreenshot.name}`);
      await uploadBytes(screenshotRef, proofScreenshot);
      const screenshotUrl = await getDownloadURL(screenshotRef);

      // Submit application to Firestore
      await addDoc(collection(db, 'curatorApplications'), {
        userId: user.uid,
        ...form,
        followerCount: followerCount, // Store as number
        proofScreenshotUrl: screenshotUrl,
        status: 'pending',
        submittedAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: null,
        notes: ''
      });

      setSubmitted(true);
      toast.success('Application submitted successfully!');

      // Redirect to home after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#121212', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#1e1e1e' }}>
            <Typography variant="h5" sx={{ color: 'white', mb: 3 }}>
              Please Sign In
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              You need to be signed in to apply as a curator
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/?signin=true')}
              sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
            >
              Sign In
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (submitted) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#121212', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#1e1e1e' }}>
            <CheckCircle sx={{ fontSize: 80, color: '#1DB954', mb: 3 }} />
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
              Application Submitted!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Thank you for applying to become a BeatFlow curator.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              We'll review your application and get back to you within 3-5 business days.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
            >
              Back to Home
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#121212', py: 8 }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/become-curator')}
            sx={{ color: 'text.secondary', mb: 2 }}
          >
            Back
          </Button>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white', mb: 2 }}>
            Curator Application
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Complete the form below to apply to become a BeatFlow curator
          </Typography>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: 'grey.800', '& .MuiLinearProgress-bar': { bgcolor: '#1DB954' } }} />}

        <Paper sx={{ p: 4, bgcolor: '#1e1e1e' }} component="form" onSubmit={handleSubmit}>
          {/* Personal Information */}
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 3 }}>
            Personal Information
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Full Name"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
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
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="email"
                label="Email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
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
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number (Optional)"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
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
            </Grid>
          </Grid>

          {/* Experience */}
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 3 }}>
            Curator Experience
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel sx={{ color: 'grey.400' }}>Experience Level</InputLabel>
                <Select
                  value={form.experienceLevel}
                  onChange={(e) => handleChange('experienceLevel', e.target.value)}
                  label="Experience Level"
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.600' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.500' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1DB954' }
                  }}
                >
                  {EXPERIENCE_LEVELS.map(level => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" sx={{ color: 'grey.400', mb: 2 }}>
                Select genres you specialize in (at least one required) *
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {GENRE_OPTIONS.map(genre => (
                  <Chip
                    key={genre}
                    label={genre}
                    onClick={() => handleGenreToggle(genre)}
                    sx={{
                      bgcolor: form.genres.includes(genre) ? '#1DB954' : 'grey.700',
                      color: 'white',
                      '&:hover': {
                        bgcolor: form.genres.includes(genre) ? '#1ed760' : 'grey.600'
                      }
                    }}
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                required
                label="Tell us about your curation experience"
                placeholder="Describe your experience curating playlists, music discovery skills, and any relevant background..."
                value={form.curatorExperience}
                onChange={(e) => handleChange('curatorExperience', e.target.value)}
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
            </Grid>
          </Grid>

          {/* Playlists & Social */}
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 3 }}>
            Playlists & Social Media
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Main Playlist Link"
                placeholder="https://open.spotify.com/playlist/... or other platform URL"
                value={form.playlistLink}
                onChange={(e) => handleChange('playlistLink', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'grey.600' },
                    '&:hover fieldset': { borderColor: 'grey.500' },
                    '&.Mui-focused fieldset': { borderColor: '#1DB954' }
                  },
                  '& .MuiInputLabel-root': { color: 'grey.400' }
                }}
                helperText="We will verify your follower count from this playlist"
                FormHelperTextProps={{ sx: { color: 'grey.500' } }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                type="number"
                label={`Total Followers (minimum ${MINIMUM_FOLLOWERS.toLocaleString()} required)`}
                placeholder="e.g., 5000"
                value={form.followerCount}
                onChange={(e) => handleChange('followerCount', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'grey.600' },
                    '&:hover fieldset': { borderColor: 'grey.500' },
                    '&.Mui-focused fieldset': { borderColor: '#1DB954' }
                  },
                  '& .MuiInputLabel-root': { color: 'grey.400' }
                }}
                helperText={`You must have at least ${MINIMUM_FOLLOWERS.toLocaleString()} total followers across all playlists`}
                FormHelperTextProps={{ sx: { color: 'grey.500' } }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" sx={{ color: 'grey.400', mb: 2 }}>
                Upload Screenshot Proof * (showing your playlist follower count)
              </Typography>
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: proofScreenshot ? '#1DB954' : 'grey.600',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: '#1DB954',
                    bgcolor: 'rgba(29, 185, 84, 0.05)'
                  }
                }}
                onClick={() => document.getElementById('screenshot-upload').click()}
              >
                <input
                  type="file"
                  id="screenshot-upload"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  style={{ display: 'none' }}
                />
                {screenshotPreview ? (
                  <Box>
                    <Box
                      component="img"
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 300,
                        borderRadius: 2,
                        mb: 2
                      }}
                    />
                    <Typography variant="body2" sx={{ color: '#1DB954', fontWeight: 'bold' }}>
                      ✓ Screenshot uploaded - Click to change
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'grey.500' }}>
                      {proofScreenshot.name}
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="h6" sx={{ color: 'grey.400', mb: 1 }}>
                      Click to upload screenshot
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'grey.500' }}>
                      PNG, JPG or JPEG (max 5MB)
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'grey.600', mt: 1, display: 'block' }}>
                      Screenshot should clearly show your playlist name and follower count
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Spotify Profile Link (Optional)"
                placeholder="https://open.spotify.com/user/..."
                value={form.spotifyProfileLink}
                onChange={(e) => handleChange('spotifyProfileLink', e.target.value)}
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
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Instagram Link (Optional)"
                placeholder="https://instagram.com/..."
                value={form.instagramLink}
                onChange={(e) => handleChange('instagramLink', e.target.value)}
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
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="TikTok Link (Optional)"
                placeholder="https://tiktok.com/@..."
                value={form.tiktokLink}
                onChange={(e) => handleChange('tiktokLink', e.target.value)}
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
            </Grid>
          </Grid>

          {/* Why Curator */}
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 3 }}>
            Additional Information
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                required
                label="Why do you want to be a BeatFlow curator?"
                placeholder="Tell us what motivates you and what you hope to achieve as a curator..."
                value={form.whyCurator}
                onChange={(e) => handleChange('whyCurator', e.target.value)}
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
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Weekly Availability (hours per week)"
                placeholder="e.g., 10-15 hours"
                value={form.availability}
                onChange={(e) => handleChange('availability', e.target.value)}
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
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mb: 3, bgcolor: 'rgba(29, 185, 84, 0.1)', color: 'white' }}>
            Your application will be reviewed within 3-5 business days. We'll contact you via email.
          </Alert>

          {/* Submit Button */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/become-curator')}
              disabled={loading}
              sx={{ color: 'grey.400', borderColor: 'grey.600' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                bgcolor: '#1DB954',
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
                '&:hover': { bgcolor: '#1ed760' }
              }}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
