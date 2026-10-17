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
import CommercialLicenseTerms from './CommercialLicenseTerms';
import { ONE_OFF_DOWNLOAD, ONE_OFF_COMMERCIAL } from '../utils/licenseTerms';

const ACCENT = '#1DB954';
const TAP_TARGET = 44;

export default function LicenseAcceptance({
  accepted,
  onChange,
  id = 'accept-download-license',
  // WHICH PRODUCT the assent is for. Defaults to the download licence, so the five
  // existing call sites keep working unchanged and an omission cannot silently collect
  // commercial assent -- the safe default is the NARROWER grant.
  product = ONE_OFF_DOWNLOAD,
  trackCount = null
}) {
  const isCommercial = product && product.grant === ONE_OFF_COMMERCIAL.grant;

  // Only the LINK LABEL and the named restrictions vary. The checkbox and the statutory
  // statement below do not, and must not: see the long comment on the second statement.
  const termsLabel = isCommercial ? 'Commercial License Terms' : 'Download License Terms';
  const namedLimits = isCommercial
    // The four a commercial buyer is most likely to assume are included. Broadcast and
    // cinema lead because "commercial use" reads as covering them, and a licensee who
    // puts a cue in a TV spot on this licence is in breach of a clause they skimmed.
    ? 'including that this license does not cover broadcast television or radio, ' +
      'cinema, paid advertising campaigns, or reselling the music on its own'
    : 'including that this license does not cover public performance, DJ use, ' +
      'remixes or redistribution';

  return (
    <>
      {isCommercial
        ? <CommercialLicenseTerms trackCount={trackCount} />
        : <DownloadLicenseTerms />}

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
        {/* TWO SEPARATE STATEMENTS, AND THE SECOND ONE IS THE LOAD-BEARING ONE.
          *
          * The first is ordinary clickwrap assent to the terms.
          *
          * The second exists because of a specific statutory mechanic. For digital
          * content delivered without a physical medium, UK Consumer Contracts
          * Regulations 2013 reg.37 and EU Consumer Rights Directive art.16(m) give the
          * buyer a 14-day right to cancel, and let a seller exclude it ONLY if the buyer
          * (a) expressly consents to supply starting immediately, and (b) acknowledges
          * that this loses the cancellation right. Both, before supply begins.
          *
          * Without both, reg.37(4) says the consumer bears NO COST for digital content
          * supplied in the cancellation window. In plain terms: download the master,
          * cancel inside 14 days, pay nothing, keep the file -- the exact friendly-fraud
          * scenario the revocation work was built to answer, except this version is
          * backed by statute and no amount of terms drafting defeats it. The obligations
          * cannot be excluded by terms and conditions; they have to be CAPTURED here.
          *
          * This was previously not captured at all. The box said only "I agree to the
          * terms", which is assent but is neither of the two required elements.
          *
          * WORDED THE SAME FOR BOTH PRODUCTS, and that is a legal judgement, not laziness.
          * A one-off commercial licence is digital content supplied without a physical
          * medium exactly as a download is, so reg.37 / art.16(m) reach it identically and
          * the same two elements have to be captured. Only the noun changes -- "files and
          * licence" rather than "download" -- because that is what is supplied.
          *
          * Worth knowing what this does NOT cover: the CJEU held in C-234/25 (2026) that
          * streaming SUBSCRIPTIONS are digital services, not digital content, so art.16(m)
          * does not apply to them at all and a subscriber keeps the cancellation right
          * regardless of what they tick. This control is for ONE-OFF purchases only, of
          * either kind; a subscription checkout must not reuse it.
          */}
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
            {termsLabel}
          </MuiLink>
          , {namedLimits}.
          <Box component="span" sx={{ display: 'block', mt: 1 }}>
            <strong>
              I ask for my {isCommercial ? 'files and licence' : 'download'} to be made
              available immediately, and I accept that once {isCommercial ? 'they are' : 'it is'},
              I lose my right to cancel this purchase.
            </strong>
          </Box>
        </Typography>
      </Box>
    </>
  );
}
