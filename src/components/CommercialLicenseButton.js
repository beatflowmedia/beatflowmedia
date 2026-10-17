// src/components/CommercialLicenseButton.js
//
// License ONE track for commercial use. The hand-picking half of the production library.
//
// WHY A SEPARATE CONTROL RATHER THAN A CHOICE INSIDE PurchaseButton
// PurchaseButton already offers a choice -- this song, or the album it is on -- through
// PurchaseOptionsDialog, and that chooser is about WHICH RECORDING. This is a different
// axis: which LICENSE. Folding a $1.99 personal download and a $29 commercial licence
// into one radio group puts two incomparable decisions in one control, and the cheap
// option wins by position.
//
// So the two sit side by side and each says what it is. A buyer who wants the file picks
// the first; a buyer who is cutting a video picks the second, and nothing has to be
// un-picked. That also means the download path -- the only path that currently sells
// anything -- is untouched by this file.
//
// THE PRICE IS DERIVED, not stored. Every song document in the catalogue carries
// price: 199 regardless of pool, so there is no commercial price to read: it comes from
// calculateCommercialPrice, and the server recomputes it and ignores whatever the client
// believed. $29 for a production-library or functional cue, $79 for a released song --
// a cue is background, a released single with a featured artist carries the scene.

import { useState } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import {
  calculateCommercialPrice,
  commercialRateForPool,
  formatPrice
} from '../utils/pricing';
import useLicensedCheckout from '../hooks/useLicensedCheckout';
import useSignInGate from '../hooks/useSignInGate';

const ACCENT = '#1DB954';
const TAP_TARGET = 44;

export default function CommercialLicenseButton({ song, itemId }) {
  const [error, setError] = useState(null);
  const requireSignIn = useSignInGate('Sign in to license this track');

  const { requestCheckout, licenseDialog } = useLicensedCheckout({
    onError: (err) => setError(err.message || 'Could not start checkout.'),
    onRequiresSignIn: requireSignIn
  });

  if (!song) return null;

  // previewOnly means the master cannot be DELIVERED, not that it is not permitted --
  // see src/utils/previewOnly notes and `npm run verify:masters`. Selling a commercial
  // licence to a file that cannot be sent is the one outcome worse than not offering it,
  // so the control is absent rather than disabled-with-an-excuse. create-checkout
  // refuses it server-side too.
  if (song.previewOnly === true) return null;

  const price = calculateCommercialPrice(1, commercialRateForPool(song.assetPool));

  const licenseCommercially = () => {
    setError(null);
    requestCheckout({
      type: 'song',
      licenseType: 'commercial',
      itemId: itemId || song.id,
      itemName: song.title,
      artistName: song.artistName || song.artist,
      price,
      trackCount: 1
    });
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        onClick={licenseCommercially}
        variant="outlined"
        sx={{
          // Full width on a phone, hugging its text from sm up. The base rule is the
          // small screen; nothing here is walked back with a max-width override.
          width: { xs: '100%', sm: 'auto' },
          minHeight: TAP_TARGET,
          px: 3,
          fontSize: '1rem',
          fontWeight: 700,
          // MUI uppercases by default, which turns a price into a shout.
          textTransform: 'none',
          color: ACCENT,
          borderColor: ACCENT,
          '&:hover': { borderColor: '#1ed760', bgcolor: 'rgba(29,185,84,0.08)' }
        }}
      >
        Commercial license — {formatPrice(price)}
      </Button>
      <Typography sx={{ color: 'grey.500', fontSize: '0.75rem', mt: 0.75, lineHeight: 1.5 }}>
        Use it in video, podcasts, apps, games and client work. Permanent, worldwide, one
        payment.
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {licenseDialog}
    </Box>
  );
}
