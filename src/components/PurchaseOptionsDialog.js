// src/components/PurchaseOptionsDialog.js
//
// The licence chooser. A track row shows ONE price -- the single -- because a row
// has space for one number and a buyer scanning a list wants a comparison, not a
// decision. The alternatives belong here, one tap later.
//
// Every price shown is the price that will actually be charged. create-checkout.js
// resolves the price server-side from Firestore and ignores whatever the client
// sends, so this displays the stored `price` when there is one and only falls back
// to calculateAlbumPrice() when there is not. Quoting a computed number next to a
// different stored one is how a storefront advertises one price and charges another.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Box, Typography,
  Button, Divider, Chip, CircularProgress, useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Close, ShoppingCart, Album as AlbumIcon, AllInclusive, InfoOutlined } from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { SONG_PRICE, calculateAlbumPrice, formatPrice } from '../utils/pricing';
import { getActivePlans } from '../data/pricingPlans';

// Fat-finger minimum. An element can look big and still be a small target, so the
// height is set explicitly rather than inferred from padding.
const TAP_TARGET = 44;
const OPTION_MIN_HEIGHT = 72;

function Option({ icon, title, caption, price, note, onClick, disabled }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      sx={{
        width: '100%',
        minHeight: OPTION_MIN_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        mb: 1,
        textAlign: 'left',
        border: '1px solid',
        borderColor: 'rgba(255,255,255,0.15)',
        borderRadius: 2,
        bgcolor: 'transparent',
        color: 'inherit',
        font: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'background-color 0.2s, border-color 0.2s',
        '&:hover': disabled ? {} : {
          bgcolor: 'rgba(255,255,255,0.06)',
          borderColor: '#1DB954'
        }
      }}
    >
      <Box sx={{ color: '#1DB954', display: 'flex' }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>{title}</Typography>
        <Typography sx={{ color: 'grey.400', fontSize: '0.8125rem' }}>{caption}</Typography>
        {note ? (
          <Typography sx={{ color: '#1DB954', fontSize: '0.75rem', mt: 0.25 }}>{note}</Typography>
        ) : null}
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: '1rem', whiteSpace: 'nowrap' }}>{price}</Typography>
    </Box>
  );
}

export default function PurchaseOptionsDialog({ open, onClose, track, onSelect }) {
  const theme = useTheme();
  const navigate = useNavigate();
  // Full screen on a phone. A centred dialog with dead margin either side is a
  // desktop pattern that leaves the options cramped in the middle of the screen.
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [album, setAlbum] = useState(null);
  const [loadingAlbum, setLoadingAlbum] = useState(false);

  const albumId = track ? track.albumId : null;

  useEffect(() => {
    let cancelled = false;
    if (!open || !albumId) {
      setAlbum(null);
      return undefined;
    }

    setLoadingAlbum(true);
    getDoc(doc(db, 'albums', albumId))
      .then((snap) => {
        if (cancelled) return;
        setAlbum(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      })
      .catch(() => {
        if (!cancelled) setAlbum(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingAlbum(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, albumId]);

  if (!track) return null;

  const songPrice = track.price || SONG_PRICE;
  const trackCount = album && album.trackCount ? album.trackCount : 0;
  const albumPrice = album ? album.price || calculateAlbumPrice(trackCount || 1) : null;
  // What the bundle actually saves, measured against the same single price above.
  const albumSaving = album && trackCount > 1 ? trackCount * songPrice - albumPrice : 0;

  // create-checkout refuses previewOnly records. Offering a button the server will
  // reject is worse than explaining why there is no button.
  const previewOnly = track.previewOnly === true;

  const cheapestPlan = (getActivePlans() || [])
    .filter((plan) => typeof plan.price === 'number')
    .sort((a, b) => a.price - b.price)[0];

  const choose = (option) => {
    if (onClose) onClose();
    if (onSelect) onSelect(option);
  };

  return (
    <Dialog
      open={!!open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="xs"
      aria-labelledby="purchase-options-title"
      PaperProps={{ sx: { bgcolor: '#181818', color: 'white', borderRadius: fullScreen ? 0 : 3 } }}
    >
      <DialogTitle id="purchase-options-title" sx={{ pr: 7, pb: 1 }}>
        <Typography component="div" sx={{ fontWeight: 800, fontSize: '1.125rem', lineHeight: 1.3 }}>
          {track.title}
        </Typography>
        <Typography component="div" sx={{ color: 'grey.400', fontSize: '0.875rem' }}>
          {track.artistName || track.artist}
        </Typography>
        <IconButton
          onClick={onClose}
          aria-label="Close"
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'grey.400',
            width: TAP_TARGET,
            height: TAP_TARGET
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        {previewOnly ? (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', py: 1 }}>
            <InfoOutlined sx={{ color: 'grey.400', mt: 0.25 }} />
            <Box>
              <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Not available to license yet</Typography>
              <Typography sx={{ color: 'grey.400', fontSize: '0.875rem' }}>
                Only a 30-second preview of this release exists right now. You can stream it,
                but the full-length master is not ready to license.
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
            <Option
              icon={<ShoppingCart />}
              title="This track"
              caption="License this single recording"
              price={formatPrice(songPrice)}
              onClick={() => choose({ type: 'song', itemId: track.id, price: songPrice })}
            />

            {loadingAlbum ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={22} />
              </Box>
            ) : null}

            {album && trackCount > 1 ? (
              <Option
                icon={<AlbumIcon />}
                title={album.title || 'The full album'}
                caption={'All ' + trackCount + ' tracks'}
                price={formatPrice(albumPrice)}
                note={albumSaving > 0 ? 'Save ' + formatPrice(albumSaving) + ' vs buying separately' : null}
                onClick={() => choose({ type: 'album', itemId: album.id, price: albumPrice })}
              />
            ) : null}

            {cheapestPlan ? (
              <>
                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.12)' }} />
                <Option
                  icon={<AllInclusive />}
                  title="Subscribe instead"
                  caption="Unlimited downloads while your plan is active"
                  price={'from ' + formatPrice(cheapestPlan.price) + '/mo'}
                  onClick={() => {
                    if (onClose) onClose();
                    navigate('/pricing');
                  }}
                />
              </>
            ) : null}

            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                label="One-stop clearance"
                sx={{ bgcolor: 'rgba(29,185,84,0.15)', color: '#1DB954', fontWeight: 700 }}
              />
              <Typography sx={{ color: 'grey.500', fontSize: '0.75rem' }}>
                Recording and composition cleared together.
              </Typography>
            </Box>
          </>
        )}

        <Button
          onClick={onClose}
          fullWidth
          sx={{ mt: 3, minHeight: TAP_TARGET, color: 'grey.300', fontSize: '1rem' }}
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
