// src/components/LicenseAcceptanceDialog.js
//
// Acceptance for the purchases that have nothing to choose.
//
// PurchaseOptionsDialog exists because a song can be bought alone or as part of its
// album, and that choice needs a screen. An album has no such choice -- so before
// this file, tapping "License for $23.88" on an album went straight to Stripe with
// no terms shown and no assent captured. Two routes to checkout, one of them
// silently unprotected.
//
// That asymmetry is the whole reason this is a separate, deliberately small dialog
// rather than a flag on the other one: bending the chooser to render a
// nothing-to-choose state would have meant an album flowing through album-fetching
// and radio-group code that does not apply to it, which is how the next person ends
// up with an album quietly priced as a song again.
//
// The acceptance control itself is NOT duplicated here -- see LicenseAcceptance.js.
// What this file adds is only the frame: what is being bought, for how much, and the
// button that is dead until the box is ticked.

import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Box, Typography, Button
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Close } from '@mui/icons-material';
import { formatPrice } from '../utils/pricing';
import { currentAgreementVersion } from '../utils/agreements';
import { ONE_OFF_DOWNLOAD, agreementForProduct } from '../utils/licenseTerms';
import LicenseAcceptance from './LicenseAcceptance';

const ACCENT = '#1DB954';
const TAP_TARGET = 44;

export default function LicenseAcceptanceDialog({
  open,
  onClose,
  itemName,
  artistName,
  price,
  onConfirm,
  // WHICH PRODUCT, so the dialog shows the right terms AND sends the right agreement
  // identifier. It used to hard-code DOWNLOAD_LICENSE, which with a second product on
  // sale would have sent a download acceptance for a commercial purchase -- the exact
  // mismatch create-checkout now refuses. Defaults to the download licence so existing
  // callers are unchanged, and the default is the narrower grant.
  product = ONE_OFF_DOWNLOAD,
  trackCount = null
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [accepted, setAccepted] = useState(false);

  // DERIVED from the product rather than named here. src/utils/licenseTerms.js holds
  // the one mapping of product -> agreement, so the identifier this dialog sends and the
  // one the server demands cannot drift.
  const agreementVersion = currentAgreementVersion(agreementForProduct(product));

  // Per-transaction, never remembered. A tick that survived between purchases would
  // record assent given once for something else entirely.
  useEffect(() => {
    if (!open) setAccepted(false);
  }, [open]);

  const ready = accepted && !!agreementVersion;

  // Some callers (a context menu on a search result) know the item but not its
  // price. Showing "$NaN" is worse than showing nothing, and the amount is not this
  // dialog's to assert anyway -- create-checkout resolves it from Firestore and
  // ignores whatever the client believed. So the total is shown only when known.
  const knownPrice = Number.isFinite(price);

  const confirm = () => {
    if (!ready) return;
    if (onClose) onClose();
    if (onConfirm) onConfirm(agreementVersion);
  };

  return (
    <Dialog
      open={!!open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="xs"
      aria-labelledby="license-acceptance-title"
      PaperProps={{ sx: { bgcolor: '#181818', color: 'white', borderRadius: fullScreen ? 0 : 3 } }}
    >
      <DialogTitle id="license-acceptance-title" sx={{ pr: 7, pb: 1 }}>
        <Typography component="div" sx={{ fontWeight: 800, fontSize: '1.125rem', lineHeight: 1.3 }}>
          {itemName || 'This release'}
        </Typography>
        {artistName ? (
          <Typography component="div" sx={{ color: 'grey.400', fontSize: '0.875rem' }}>
            {artistName}
          </Typography>
        ) : null}
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
        {knownPrice ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              minHeight: 56,
              px: 2,
              py: 1.5,
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 2
            }}
          >
            <Typography sx={{ color: 'grey.300', fontSize: '0.875rem' }}>Total</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
              {formatPrice(price)}
            </Typography>
          </Box>
        ) : null}

        <LicenseAcceptance
          accepted={accepted}
          onChange={setAccepted}
          id="accept-license-direct"
          product={product}
          trackCount={trackCount}
        />

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
          {knownPrice ? 'Continue to payment — ' + formatPrice(price) : 'Continue to payment'}
        </Button>

        {!accepted ? (
          <Typography sx={{ color: 'grey.500', fontSize: '0.75rem', mt: 1, textAlign: 'center' }}>
            Accept the license terms to continue.
          </Typography>
        ) : null}

        <Button
          onClick={onClose}
          fullWidth
          sx={{ mt: 2, minHeight: TAP_TARGET, color: 'grey.300', fontSize: '1rem' }}
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
