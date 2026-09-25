// src/components/LicenseAcceptance.js
//
// The affirmative act. ONE control, every purchase route.
//
// There are two ways to reach Stripe: PurchaseOptionsDialog (a song, where there is
// a single-vs-album choice to make) and LicenseAcceptanceDialog (an album, where
// there is not). Both must capture assent, and they must capture the SAME assent --
// a second copy of this checkbox would drift, and the drift would be one route
// recording agreement while the other quietly sold without it. That failure is
// invisible until someone asks for the record and it is not there.
//
// WHAT MAKES THIS CLICKWRAP RATHER THAN DECORATION
//   - unchecked by default; the buyer performs the act, the page does not perform it
//     for them (a pre-ticked box is assent by the seller, not by the buyer)
//   - the terms summary sits ABOVE it, so the notice precedes the act
//   - the restrictions that will surprise a buyer are named in the label itself, not
//     only behind the link -- a buyer cannot later say the limits were buried
//   - the full text is one tap away and opens in a new tab, so reading it does not
//     destroy the transaction in progress
//   - the caller keeps the pay button disabled until this is true
//
// It deliberately does NOT know which agreement version is current. The host reads
// that from src/utils/agreements.js and sends it, so there is one answer to "what
// was in force" rather than one per control.

import { Box, Typography, Checkbox, Link as MuiLink } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import DownloadLicenseTerms from './DownloadLicenseTerms';

const ACCENT = '#1DB954';
const TAP_TARGET = 44;

export default function LicenseAcceptance({ accepted, onChange, id = 'accept-download-license' }) {
  return (
    <>
      <DownloadLicenseTerms />

      <Box
        component="label"
        htmlFor={id}
        sx={{
          mt: 2,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          minHeight: TAP_TARGET,
          cursor: 'pointer',
          borderRadius: 2,
          border: '1px solid',
          borderColor: accepted ? ACCENT : 'rgba(255,255,255,0.15)',
          bgcolor: accepted ? 'rgba(29,185,84,0.08)' : 'transparent',
          p: 1,
          transition: 'border-color 0.2s, background-color 0.2s'
        }}
      >
        <Checkbox
          id={id}
          checked={!!accepted}
          onChange={(e) => onChange(e.target.checked)}
          sx={{ p: 0.5, color: 'grey.500', '&.Mui-checked': { color: ACCENT } }}
        />
        <Typography sx={{ fontSize: '0.8125rem', lineHeight: 1.5, pt: 0.5 }}>
          I have read and agree to the{' '}
          <MuiLink
            component={RouterLink}
            to="/terms"
            target="_blank"
            rel="noopener"
            // The label is a <label>, so a tap anywhere in it toggles the box.
            // Without this the link would both open the terms AND flip the checkbox,
            // which is the one interaction that must never happen by accident.
            onClick={(e) => e.stopPropagation()}
            sx={{ color: ACCENT, textDecorationColor: 'rgba(29,185,84,0.4)' }}
          >
            Download License Terms
          </MuiLink>
          , including that this license does not cover public performance, DJ use,
          remixes or redistribution.
        </Typography>
      </Box>
    </>
  );
}
