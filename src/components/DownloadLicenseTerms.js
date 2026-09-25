// src/components/DownloadLicenseTerms.js
//
// What a download purchase actually grants, shown at the point of purchase.
//
// WHY THIS EXISTS
// A summary at the point of sale, because a buyer decides here and will not read
// /terms first. It is the conspicuous notice that makes the acceptance checkbox
// beside it meaningful -- assent to terms nobody was shown is the thing clickwrap
// exists to avoid.
//
// IT MUST NOT DRIFT FROM /terms. Section 4 of src/pages/Terms.js now defines the
// download license in full -- grant, exclusions, reservation of rights, warranty
// scope, AI provenance, termination. Every line below is a compression of a clause
// that exists there. If the two ever disagree, the buyer has been shown one deal and
// bound to another, and the summary is the version they actually read.
//
// (Until 2026-09-19 this was the ONLY place any of it was written down: Terms.js
// mentioned none of public performance, remixes, derivative works or sublicensing,
// while the checkbox asserted the buyer had accepted all four. That gap is closed.)
//
// IT DESCRIBES THE SYSTEM, IT DOES NOT GRANT ANYTHING.
// Every line here matches what the code records. create-checkout writes
// `licenseType: 'personal'` on the purchase, and stripe-webhook writes
// `licenseType: 'perpetual'` on the license row for the same transaction. Those two
// disagree, and the text below says "personal" and "does not expire" because that
// is the union of what the system actually stores -- not because someone decided a
// policy. If the intended grant is broader (commercial use included, as the PRD
// specifies for the somatic pool), the CODE has to say so first and this text
// follows it. Writing a wider grant here than the system records would create the
// grant in the only document the buyer ever reads.
//
// DJs ARE CALLED OUT SPECIFICALLY because a DJ needs three rights a download
// license does not touch: public performance (playing it to an audience),
// adaptation (edits, loops, mashups) and sublicensing (publishing the mix on a
// platform that then gets rights through them). A buyer who assumes "I bought it,
// I can play it" is the one most likely to be wronged by silence here.
//
// NOT LEGAL ADVICE and not a substitute for Terms. This needs a lawyer's review
// before it ships -- especially the DJ and remix lines, which are the expensive
// ones to get wrong.

import { Box, Typography, Link as MuiLink, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const NOT_INCLUDED = [
  'Playing it to an audience — DJ sets, clubs, bars, restaurants, retail, events',
  'Edits, remixes, mashups, or any altered version',
  'Including it in a mix, compilation or playlist you publish or sell',
  'Reselling, sharing or redistributing the file'
];

export default function DownloadLicenseTerms({ compact = false }) {
  return (
    <Box sx={{ mt: compact ? 1.5 : 2 }}>
      <Divider sx={{ mb: 1.5, borderColor: 'rgba(255,255,255,0.12)' }} />

      <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', mb: 0.5 }}>
        What you get
      </Typography>
      <Typography sx={{ color: 'grey.400', fontSize: '0.75rem', lineHeight: 1.5 }}>
        A personal license to download and keep this recording. It does not expire.
      </Typography>

      <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', mt: 1.5, mb: 0.5 }}>
        What it does not cover
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.5, color: 'grey.400' }}>
        {NOT_INCLUDED.map((item) => (
          <Typography
            component="li"
            key={item}
            sx={{ fontSize: '0.75rem', lineHeight: 1.5, mb: 0.25 }}
          >
            {item}
          </Typography>
        ))}
      </Box>

      <Typography sx={{ color: 'grey.400', fontSize: '0.75rem', lineHeight: 1.5, mt: 1.5 }}>
        <Box component="span" sx={{ color: '#1DB954', fontWeight: 700 }}>
          DJing, or playing music in a business?
        </Box>{' '}
        That needs a separate license — a download does not cover it.{' '}
        <MuiLink
          component={RouterLink}
          to="/sync-licensing"
          sx={{ color: '#1DB954', textDecorationColor: 'rgba(29,185,84,0.4)' }}
        >
          Licensing options
        </MuiLink>
      </Typography>

      <Typography sx={{ color: 'grey.600', fontSize: '0.6875rem', mt: 1.5 }}>
        Summary only.{' '}
        <MuiLink
          component={RouterLink}
          to="/terms"
          sx={{ color: 'grey.500' }}
        >
          Full terms
        </MuiLink>{' '}
        apply.
      </Typography>
    </Box>
  );
}
