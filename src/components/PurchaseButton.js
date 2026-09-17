// src/components/PurchaseButton.js
// Purchase button component for songs and albums
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, CircularProgress, Chip } from '@mui/material';
import { ShoppingCart, Download } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../hooks/useModal';
import { stripeService } from '../services/stripeService';
import { SONG_PRICE, calculateAlbumPrice, formatPrice } from '../utils/pricing';
import PurchaseOptionsDialog from './PurchaseOptionsDialog';

// A song row shows one number and opens the alternatives on tap. An album button
// has no meaningful alternative to offer, so it still goes straight to checkout.
const PurchaseButton = ({
  itemId,
  itemType,
  price,
  onPurchaseComplete,
  compact = false,
  track = null,
  withOptions = true
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showAlert } = useModal();
  const [loading, setLoading] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [checking, setChecking] = useState(true);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const offersOptions = withOptions && itemType === 'song' && !!track;

  const displayPrice = price || (itemType === 'song' ? SONG_PRICE : calculateAlbumPrice(10));

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

  // Tapping the price opens the chooser when there is a choice to make. Checkout
  // itself stays in one place below, so every route to Stripe is the same route.
  const handlePurchase = async () => {
    if (offersOptions) {
      setOptionsOpen(true);
      return;
    }
    await startCheckout(itemType, itemId);
  };

  const startCheckout = async (type, id) => {
    if (!user) {
      await showAlert('Sign In Required', 'Please sign in to purchase music', 'info');
      return;
    }

    try {
      setLoading(true);

      if (type === 'song') {
        await stripeService.createSongCheckout(user.uid, id, user.email);
      } else if (type === 'album') {
        await stripeService.createAlbumCheckout(user.uid, id, user.email);
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
    <>
      <Button
        variant={compact ? "outlined" : "contained"}
        color="primary"
        size={compact ? "small" : "medium"}
        startIcon={loading ? <CircularProgress size={16} /> : <ShoppingCart />}
        onClick={handlePurchase}
        // A signed-out visitor can still open the chooser -- seeing what a track
        // costs and what else is on offer is the reason to sign in. Sign-in is
        // prompted when they actually choose. Without options there is nothing to
        // show, so the button stays disabled as before.
        disabled={loading || (!user && !offersOptions)}
        aria-haspopup={offersOptions ? 'dialog' : undefined}
        sx={compact
          // 44px is the fat-finger minimum (WCAG 2.5.5). `size="small"` renders
          // about 30px, which looks fine with a mouse and misses on a phone.
          ? { minWidth: '90px', minHeight: 44, fontSize: '0.75rem' }
          : { minHeight: 44 }}
      >
        {loading
          ? 'Processing...'
          : (compact ? formatPrice(displayPrice) : `License for ${formatPrice(displayPrice)}`)}
      </Button>

      {offersOptions && (
        <PurchaseOptionsDialog
          open={optionsOpen}
          onClose={() => setOptionsOpen(false)}
          track={{ ...track, id: track.id || itemId, price: displayPrice }}
          onSelect={(option) => startCheckout(option.type, option.itemId)}
        />
      )}
    </>
  );
};

export default PurchaseButton;
