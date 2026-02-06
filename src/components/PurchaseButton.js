// src/components/PurchaseButton.js
// Purchase button component for songs and albums
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, CircularProgress, Chip } from '@mui/material';
import { ShoppingCart, Download } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../hooks/useModal';
import { stripeService, DEFAULT_SONG_PRICE, DEFAULT_ALBUM_PRICE } from '../services/stripeService';

const PurchaseButton = ({ itemId, itemType, price, onPurchaseComplete, compact = false, artistId, uploadedBy }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showAlert } = useModal();
  const [loading, setLoading] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [checking, setChecking] = useState(true);

  const displayPrice = price || (itemType === 'song' ? DEFAULT_SONG_PRICE : DEFAULT_ALBUM_PRICE);

  // Check if current user is the artist/uploader
  const isOwnContent = user && (
    (artistId && user.uid === artistId) ||
    (uploadedBy && user.uid === uploadedBy)
  );

  useEffect(() => {

    const checkStatus = async () => {
      await checkPurchaseStatus();
    };

    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, itemId, itemType]);

  // Listen for purchase completion events
  useEffect(() => {
    const handlePurchaseComplete = (event) => {
      if (event.detail?.itemId === itemId) {
        checkPurchaseStatus();
      }
    };

    window.addEventListener('purchaseComplete', handlePurchaseComplete);
    return () => window.removeEventListener('purchaseComplete', handlePurchaseComplete);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const checkPurchaseStatus = async () => {
    if (!user || !itemId) {
      setChecking(false);
      return;
    }

    try {
      setChecking(true);
      let hasPurchased = false;

      if (itemType === 'song') {
        hasPurchased = await stripeService.canDownloadSong(user.uid, itemId);
      } else if (itemType === 'album') {
        hasPurchased = await stripeService.hasPurchasedAlbum(user.uid, itemId);
      }

      setPurchased(hasPurchased);
    } catch (error) {
      console.error('PurchaseButton: Error checking purchase status:', error.message);
    } finally {
      setChecking(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      await showAlert('Sign In Required', 'Please sign in to purchase music', 'info');
      return;
    }

    // Prevent artists from purchasing their own content
    if (isOwnContent) {
      await showAlert('Cannot Purchase', 'You cannot purchase your own music', 'warning');
      return;
    }

    try {
      setLoading(true);

      if (itemType === 'song') {
        await stripeService.createSongCheckout(user.uid, itemId, user.email);
      } else if (itemType === 'album') {
        await stripeService.createAlbumCheckout(user.uid, itemId, user.email);
      }

      // User will be redirected to Stripe checkout
    } catch (error) {
      console.error('Purchase error:', error);
      await showAlert('Purchase Failed', `Failed to initiate purchase: ${error.message}`, 'error');
      setLoading(false);
    }
  };

  const handleDownload = () => {
    // Redirect to downloads page instead of direct download
    navigate('/downloads');
  };

  if (checking) {
    return (
      <Button disabled variant="outlined" size={compact ? "small" : "medium"}>
        <CircularProgress size={16} sx={{ mr: compact ? 0.5 : 1 }} />
        {!compact && 'Checking...'}
      </Button>
    );
  }

  // If user is the artist, show "Your Content" message
  if (isOwnContent) {
    if (compact) {
      return (
        <Chip
          label="Your Content"
          size="small"
          sx={{
            bgcolor: 'grey.700',
            color: 'grey.400',
            cursor: 'default'
          }}
        />
      );
    }

    return (
      <Button
        variant="outlined"
        disabled
        sx={{
          borderColor: 'grey.700',
          color: 'grey.400',
          cursor: 'default',
          '&.Mui-disabled': {
            borderColor: 'grey.700',
            color: 'grey.400'
          }
        }}
      >
        Your Content
      </Button>
    );
  }

  if (purchased) {
    if (compact) {
      return (
        <Chip
          icon={<Download />}
          label="Download"
          color="success"
          size="small"
          onClick={handleDownload}
          sx={{ cursor: 'pointer' }}
        />
      );
    }

    return (
      <Button
        variant="contained"
        color="success"
        startIcon={<Download />}
        onClick={handleDownload}
        sx={{
          bgcolor: '#1DB954',
          '&:hover': { bgcolor: '#1ed760' }
        }}
      >
        Go to Downloads
      </Button>
    );
  }

  return (
    <Button
      variant={compact ? "outlined" : "contained"}
      color="primary"
      size={compact ? "small" : "medium"}
      startIcon={loading ? <CircularProgress size={16} /> : <ShoppingCart />}
      onClick={handlePurchase}
      disabled={loading || !user}
      sx={compact ? { minWidth: '90px', fontSize: '0.75rem' } : {}}
    >
      {loading ? 'Processing...' : (compact ? `$${(displayPrice / 100).toFixed(2)}` : `Buy for $${(displayPrice / 100).toFixed(2)}`)}
    </Button>
  );
};

export default PurchaseButton;
