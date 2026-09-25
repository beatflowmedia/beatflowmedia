// src/components/PurchaseOptionsDialog.js
//
// The license chooser. A track row shows ONE price -- the single -- because a row
// has space for one number and a buyer scanning a list wants a comparison, not a
// decision. The alternatives belong here, one tap later.
//
// Every price shown is the price that will actually be charged. create-checkout.js
// resolves the price server-side from Firestore and ignores whatever the client
// sends, so this displays the stored `price` when there is one and only falls back
// to calculateAlbumPrice() when there is not. Quoting a computed number next to a
// different stored one is how a storefront advertises one price and charges another.
//
// WHY THE OPTIONS NO LONGER BUY IMMEDIATELY
// They used to: tapping "This track" went straight to Stripe. That made the license
// summary below them decorative -- it sat under the button that had already been
// pressed, which is browsewrap with extra steps. Enforceable acceptance needs the
// terms shown BEFORE the act that accepts them, so the flow is now
//
//     choose an option  ->  read what it grants  ->  tick to accept  ->  pay
//
// and the pay button is dead until both a choice and a tick exist. The extra tap is
// the entire point: it is the thing that turns a published document into a contract.
// See src/utils/agreements.js for what gets recorded and why.
//
// The subscribe row is deliberately OUTSIDE that gate. It navigates to a plan page
// rather than buying anything here, so gating it behind a download-license
// acceptance would ask for assent to terms that do not govern the action.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Box, Typography,
  Button, Divider, Chip, CircularProgress, useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Close, ShoppingCart, Album as AlbumIcon, AllInclusive, InfoOutlined,
  CheckCircle, RadioButtonUnchecked
} from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { SONG_PRICE, calculateAlbumPrice, formatPrice } from '../utils/pricing';
import { currentAgreementVersion, DOWNLOAD_LICENSE } from '../utils/agreements';
import { getActivePlans } from '../data/pricingPlans';
import LicenseAcceptance from './LicenseAcceptance';

// Fat-finger minimum. An element can look big and still be a small target, so the
// height is set explicitly rather than inferred from padding.
const TAP_TARGET = 44;
const OPTION_MIN_HEIGHT = 72;

const ACCENT = '#1DB954';

function Option({ icon, title, caption, price, note, onClick, disabled, selected }) {
  // `selected` is a boolean only for the purchasable options, which behave as a
  // radio group. The subscribe row passes undefined and stays a plain button, so a
  // screen reader is not told a navigation link is a selectable choice.
  const isChoice = typeof selected === 'boolean';

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      role={isChoice ? 'radio' : undefined}
      aria-checked={isChoice ? selected : undefined}
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
        borderColor: selected ? ACCENT : 'rgba(255,255,255,0.15)',
        borderRadius: 2,
        bgcolor: selected ? 'rgba(29,185,84,0.10)' : 'transparent',
        color: 'inherit',
        font: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'background-color 0.2s, border-color 0.2s',
        '&:hover': disabled ? {} : {
          bgcolor: selected ? 'rgba(29,185,84,0.16)' : 'rgba(255,255,255,0.06)',
          borderColor: ACCENT
        }
      }}
    >
      <Box sx={{ color: ACCENT, display: 'flex' }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>{title}</Typography>
        <Typography sx={{ color: 'grey.400', fontSize: '0.8125rem' }}>{caption}</Typography>
        {note ? (
          <Typography sx={{ color: ACCENT, fontSize: '0.75rem', mt: 0.25 }}>{note}</Typography>
        ) : null}
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: '1rem', whiteSpace: 'nowrap' }}>{price}</Typography>
      {isChoice ? (
        <Box sx={{ display: 'flex', color: selected ? ACCENT : 'grey.600' }}>
          {selected ? <CheckCircle fontSize="small" /> : <RadioButtonUnchecked fontSize="small" />}
        </Box>
      ) : null}
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
  const [choice, setChoice] = useState(null);
  const [accepted, setAccepted] = useState(false);

  const albumId = track ? track.albumId : null;

  // The terms in force right now, read once per render from the canonical module.
  // This is the value that travels to the server and onto the purchase record.
  const agreementVersion = currentAgreementVersion(DOWNLOAD_LICENSE);

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

  // Acceptance is per-transaction and is NOT remembered between openings. A tick
  // that persists across dialogs would record assent the buyer gave once, for a
  // different purchase -- which is the thing a stored acceptance is supposed to
  // disprove. Reset on close so every purchase carries its own affirmative act.
  useEffect(() => {
    if (!open) {
      setChoice(null);
      setAccepted(false);
    }
  }, [open]);

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

  // No published terms means nothing can be accepted, so nothing can be sold. This
  // is unreachable while DOWNLOAD_LICENSE has a current version and is here so that
  // retiring one fails loudly at the checkout rather than selling without assent.
  const canTransact = !!agreementVersion;
  const ready = !!choice && accepted && canTransact;

  const confirm = () => {
    if (!ready) return;
    if (onClose) onClose();
    if (onSelect) {
      onSelect({
        type: choice.type,
        itemId: choice.itemId,
        price: choice.price,
        // What the buyer actually ticked. The server re-checks this against its own
        // copy of agreements.js and refuses anything that is not current, so this is
        // a claim to be verified rather than a value to be trusted.
        acceptedAgreement: agreementVersion
      });
    }
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
            <Box role="radiogroup" aria-label="What to license">
              <Option
                icon={<ShoppingCart />}
                title="This track"
                caption="License this single recording"
                price={formatPrice(songPrice)}
                selected={!!choice && choice.type === 'song'}
                onClick={() => setChoice({ type: 'song', itemId: track.id, price: songPrice })}
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
                  selected={!!choice && choice.type === 'album'}
                  onClick={() => setChoice({ type: 'album', itemId: album.id, price: albumPrice })}
                />
              ) : null}
            </Box>

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
                    // /pricing has never been routed. The subscription page is
                    // 'explore-premium' in AppRoutes.js; navigating to /pricing fell
                    // through the SPA catch-all to a dead route.
                    navigate('/explore-premium');
                  }}
                />
              </>
            ) : null}

            <LicenseAcceptance accepted={accepted} onChange={setAccepted} />

            <Button
              onClick={confirm}
              disabled={!ready}
              fullWidth
              variant="contained"
              sx={{
                mt: 2,
                minHeight: TAP_TARGET + 4,
                fontSize: '1rem',
                fontWeight: 700,
                textTransform: 'none',
                bgcolor: ACCENT,
                color: '#000',
                '&:hover': { bgcolor: '#1ed760' },
                '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.12)', color: 'grey.500' }
              }}
            >
              {choice
                ? 'Continue to payment — ' + formatPrice(choice.price)
                : 'Choose an option above'}
            </Button>

            {choice && !accepted ? (
              <Typography sx={{ color: 'grey.500', fontSize: '0.75rem', mt: 1, textAlign: 'center' }}>
                Accept the license terms to continue.
              </Typography>
            ) : null}

            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                label="One-stop clearance"
                sx={{ bgcolor: 'rgba(29,185,84,0.15)', color: ACCENT, fontWeight: 700 }}
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


