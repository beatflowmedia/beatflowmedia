import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { toast } from 'react-toastify';
import { fanCaptureService } from '../services/fanCaptureService';
import { useAuth } from '../context/AuthContext';

/**
 * FanCaptureModal - Modal for capturing fan emails with exclusive content incentives
 *
 * Part of 2026 Hybrid Marketing Strategy (Direct-to-fan retention)
 * Implements race condition protection using processing flag
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is open
 * @param {Function} props.onClose - Handler for closing the modal
 * @param {Object} props.artist - Artist object { id, name, photoURL }
 * @param {string} props.incentiveType - Type of incentive (earlyAccess, exclusiveTrack, behindTheScenes, etc.)
 * @param {string} props.incentiveContent - URL or description of the incentive content
 */
function FanCaptureModal({
  open,
  onClose,
  onSuccess,
  artist,
  incentiveType = 'newsletter',
  incentiveContent = ''
}) {
  const { signInWithGoogle, user } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Race condition protection - prevent duplicate submissions
  const processingRef = useRef(false);

  // Track if we're waiting for Google sign-in to complete
  const awaitingGoogleSignInRef = useRef(false);

  // Subscribe user after Google sign-in completes
  useEffect(() => {
    const subscribeAfterGoogleSignIn = async () => {
      if (awaitingGoogleSignInRef.current && user && open) {
        try {
          const result = await fanCaptureService.subscribeToArtist({
            userId: user.uid,
            email: user.email,
            name: user.displayName,
            artistId: artist.id,
            artistName: artist.name,
            incentiveType,
            incentiveContent,
            source: 'fan_capture_modal_google'
          });

          if (result.success) {
            toast.success(result.message);
            onSuccess?.(); // Notify parent component of success
            // Reset and close
            setEmail('');
            setName('');
            setAgreedToTerms(false);
            onClose();
          } else {
            setError(result.message);
          }
        } catch (err) {
          console.error('Error subscribing after Google sign-in:', err);
          setError('Failed to subscribe. Please try again.');
        } finally {
          processingRef.current = false;
          awaitingGoogleSignInRef.current = false;
          setLoading(false);
        }
      }
    };

    subscribeAfterGoogleSignIn();
  }, [user, open, artist, incentiveType, incentiveContent, onClose]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Race condition guard - prevent duplicate submissions
    if (processingRef.current) {
      console.log('⚠️ Form already processing, ignoring duplicate submission');
      return;
    }

    // Validation
    if (!email || !name) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    // Set processing flag BEFORE async operations
    processingRef.current = true;
    setLoading(true);
    setError('');

    try {
      // Use fanCaptureService for consistent handling
      // Don't create accounts for now - just capture emails
      const result = await fanCaptureService.subscribeToArtist({
        email: email.toLowerCase().trim(),
        name: name.trim(),
        artistId: artist.id,
        artistName: artist.name,
        incentiveType,
        incentiveContent,
        source: 'fan_capture_modal',
        createAccount: false // Don't auto-create accounts via email form
      });

      if (result.success) {
        toast.success(result.message);
        onSuccess?.(); // Notify parent component of success

        // Reset form
        setEmail('');
        setName('');
        setAgreedToTerms(false);

        // Close modal
        onClose();
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error capturing fan email:', err);
      setError('Failed to subscribe. Please try again.');
    } finally {
      // Release processing flag
      processingRef.current = false;
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Don't allow closing while processing
    if (processingRef.current) {
      return;
    }

    setEmail('');
    setName('');
    setAgreedToTerms(false);
    setError('');
    onClose();
  };

  const handleGoogleSignIn = async () => {
    // Race condition guard
    if (processingRef.current) {
      console.log('⚠️ Already processing, ignoring duplicate Google sign-in');
      return;
    }

    processingRef.current = true;
    awaitingGoogleSignInRef.current = true;
    setLoading(true);
    setError('');

    try {
      // Sign in with Google
      await signInWithGoogle();

      // After successful sign-in, user context will update
      // The useEffect will handle subscription automatically
      toast.success('Signed in successfully! Subscribing you to updates...');
    } catch (err) {
      console.error('Error signing in with Google:', err);
      setError('Failed to sign in with Google. Please try again or use email below.');
      processingRef.current = false;
      awaitingGoogleSignInRef.current = false;
      setLoading(false);
    }
  };

  const getIncentiveDescription = () => {
    switch (incentiveType) {
      case 'earlyAccess':
        return 'Get early access to new releases';
      case 'exclusiveTrack':
        return 'Download an exclusive track';
      case 'behindTheScenes':
        return 'Access behind-the-scenes content';
      case 'discount':
        return 'Get 20% off your first purchase';
      case 'newsletter':
      default:
        return 'Stay updated with exclusive content';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { bgcolor: 'grey.800', color: 'white' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {artist?.photoURL && (
            <Box
              component="img"
              src={artist.photoURL}
              alt={artist.name}
              sx={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }}
            />
          )}
          <Box>
            <Typography variant="h6">Join {artist?.name}'s Fan Club</Typography>
            <Typography variant="body2" sx={{ color: 'grey.400' }}>
              {getIncentiveDescription()}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Google Sign-in Button */}
          <Button
            fullWidth
            variant="outlined"
            onClick={handleGoogleSignIn}
            disabled={loading}
            sx={{
              borderColor: 'grey.600',
              color: 'white',
              textTransform: 'none',
              py: 1.5,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              '&:hover': {
                borderColor: '#1DB954',
                bgcolor: 'rgba(29, 185, 84, 0.1)'
              }
            }}
          >
            <Box
              component="img"
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              sx={{ width: 20, height: 20 }}
            />
            <Typography variant="body1">Continue with Google</Typography>
          </Button>

          {/* Divider */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
            <Divider sx={{ flex: 1, bgcolor: 'grey.700' }} />
            <Typography variant="body2" sx={{ color: 'grey.500' }}>
              or sign up with email
            </Typography>
            <Divider sx={{ flex: 1, bgcolor: 'grey.700' }} />
          </Box>

          <TextField
            fullWidth
            label="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            required
            disabled={loading}
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

          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            disabled={loading}
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

          <FormControlLabel
            control={
              <Checkbox
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={loading}
                sx={{
                  color: 'grey.400',
                  '&.Mui-checked': { color: '#1DB954' }
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: 'grey.300' }}>
                I agree to receive emails from {artist?.name} and accept the{' '}
                <Typography
                  component="a"
                  href="/terms"
                  target="_blank"
                  sx={{ color: '#1DB954', textDecoration: 'none' }}
                >
                  terms and conditions
                </Typography>
              </Typography>
            }
            sx={{ mt: 2 }}
          />

          {incentiveContent && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'rgba(29, 185, 84, 0.1)',
                borderRadius: 1,
                border: '1px solid rgba(29, 185, 84, 0.3)'
              }}
            >
              <Typography variant="body2" sx={{ color: '#1DB954', fontWeight: 'bold' }}>
                Your Exclusive Content:
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.300', mt: 0.5 }}>
                {incentiveContent}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleClose}
            sx={{ color: 'grey.400' }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: '#1DB954',
              '&:hover': { bgcolor: '#1ed760' },
              minWidth: 120
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'Subscribe'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default FanCaptureModal;
