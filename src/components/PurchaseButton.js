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
import LicenseAcceptanceDialog from './LicenseAcceptanceDialog';

// A song row shows one number and opens the alternatives on tap. An album button has
// no meaningful alternative to offer, so it opens the plain acceptance dialog
// instead -- not checkout. Both routes capture the licence acceptance; there is no
// longer a path to Stripe that skips it.
const PurchaseButton = ({
  itemId,
  itemType,
  price,
  onPurchaseComplete,
  compact = false,
  track = null,
  withOptions = true,
  // Only used to title the acceptance dialog on the album route, where there is no
  // `track` to read a name from. Optional: the dialog falls back to "This release"
  // rather than rendering an empty heading.
  itemName = null,
  artistName = null,
  // For albums: the caller knows whether its tracks are deliverable; a track prop
  // would be the wrong shape for it. Songs keep using track.previewOnly.
  previewOnly = false
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showAlert } = useModal();
  const [loading, setLoading] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [checking, setChecking] = useState(true);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [acceptOpen, setAcceptOpen] = useState(false);

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
    // Everything else -- albums, and any song rendered without a track object --
    // still has to accept the licence before it can reach Stripe. This used to call
    // startCheckout directly, which is how the album route sold without ever showing
    // the terms. There is no longer a path to checkout that skips assent.
    setAcceptOpen(true);
  };

  // `acceptedAgreement` is the licence version the buyer ticked in the options
  // dialog. It is passed through rather than looked up here so that the value which
  // reaches the server is the one attached to the control the buyer actually saw --
  // re-reading the current version at this point would paper over a terms change
  // that happened while the dialog was open, recording assent to text nobody read.
  const startCheckout = async (type, id, acceptedAgreement) => {
    if (!user) {
      await showAlert('Sign In Required', 'Please sign in to purchase music', 'info');
      return;
    }

    try {
      setLoading(true);

      if (type === 'song') {
        await stripeService.createSongCheckout(user.uid, id, user.email, acceptedAgreement);
      } else if (type === 'album') {
        await stripeService.createAlbumCheckout(user.uid, id, user.email, acceptedAgreement);
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

  /* A preview-only record has no master to deliver, so it has no price to show.
   *
   * create-checkout already REFUSES these, and PurchaseOptionsDialog already
   * explains why. The problem was upstream of both: the button still rendered
   * "$1.99", so the UI advertised a purchase and only corrected itself after the
   * click. A control that states a price it will not honour is the same defect as
   * a fallback image that 404s -- it looks like a working product until it is
   * exercised.
   *
   * Handled here rather than in each surface because every list renders through
   * this component. 134 of 138 records are in this state, so this is the normal
   * case, not an edge one.
   */
  if (previewOnly === true || (track && track.previewOnly === true)) {
    return (
      <Chip
        label="Preview only"
        size={compact ? 'small' : 'medium'}
        sx={{
          bgcolor: 'transparent',
          border: '1px solid',
          borderColor: 'grey.700',
          color: 'grey.400',
          cursor: 'default',
          minHeight: compact ? 32 : 44
        }}
      />
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
          onSelect={(option) => startCheckout(option.type, option.itemId, option.acceptedAgreement)}
        />
      )}

      {!offersOptions && (
        <LicenseAcceptanceDialog
          open={acceptOpen}
          onClose={() => setAcceptOpen(false)}
          itemName={itemName || (track ? track.title : null)}
          artistName={artistName || (track ? track.artistName || track.artist : null)}
          price={displayPrice}
          onConfirm={(acceptedAgreement) => startCheckout(itemType, itemId, acceptedAgreement)}
        />
      )}
    </>
  );
};

export default PurchaseButton;
