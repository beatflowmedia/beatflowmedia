// src/components/CommercialLicenseTerms.js
//
// What a ONE-OFF COMMERCIAL licence grants, shown at the point of purchase.
//
// A SEPARATE FILE FROM DownloadLicenseTerms, DELIBERATELY. The two agree on almost
// nothing: this one PERMITS the sync that the other's longest list exists to forbid.
// Parameterising one component over both would mean every line of copy carrying a
// condition, and the failure mode of getting a condition backwards here is a buyer
// shown permission they do not have, or refused permission they paid for.
//
// Two files is duplication of SHAPE, not of CONTENT -- the rule-of-three caveat. The
// parts that genuinely must not drift are shared: the checkbox and the statutory
// immediate-supply capture live in LicenseAcceptance.js, and the wording below is the
// same text as commercial-license@2026-10-17 in src/utils/agreements.js, which is what
// /changes renders and what a purchase records.
//
// IT DESCRIBES THE SYSTEM, IT DOES NOT GRANT ANYTHING. Same discipline as the download
// summary: create-checkout computes the commercial price, writes
// licenseScope: 'commercial' / licenseTerm: 'perpetual' / licenseGrant: 'sync' into the
// session, and the webhook records those on the licence row. Every line here matches a
// field the code actually stores. Widening it here would create the grant in the only
// document the buyer ever reads.
//
// NOT LEGAL ADVICE. docs/commercial-license-draft.md carries the long text and the
// questions for a reviewer. Unreviewed.

import { Box, Typography, Link as MuiLink, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// LEADS WITH VIDEO because that is what the buyer came for, and because the download
// summary's longest list is the eight things it forbids. A buyer who has seen that page
// needs the contrast stated, not implied.
const INCLUDED = [
  'Video — YouTube, TikTok, Instagram, Facebook, client films, course content',
  'Podcasts, apps, games, presentations and installations',
  'Work you deliver to your own clients, under your own name',
  'Monetised content, worldwide, with no view or download cap',
  'Permanently — the licence does not expire and there is nothing to renew'
];

// NOT A SHORTER VERSION OF THE DOWNLOAD LIST. These are the five exclusions that
// survive into a commercial licence, and the reason each is out is that it is priced
// per negotiation rather than per track: broadcast and cinema carry clearance regimes
// this platform does not administer, paid advertising is priced on spend, and resale of
// the music on its own is competing with BFMG rather than using it.
const NOT_INCLUDED = [
  'Broadcast television or radio, and cinema release',
  'Paid advertising campaigns — TV, radio, cinema or paid social spend',
  'Reselling, sublicensing or redistributing the music on its own',
  'Training or fine-tuning an AI model on the recordings',
  'Registering the recordings with a rights or royalty collection service'
];

export default function CommercialLicenseTerms({ trackCount = null, compact = false }) {
  // Said plainly, because it is the limit most likely to be misread. "Commercial
  // licence" sounds catalogue-wide; it covers what is on the licence.
  const covers = Number.isFinite(trackCount) && trackCount > 0
    ? `the ${trackCount} recording${trackCount === 1 ? '' : 's'} in this purchase`
    : 'the recordings in this purchase';

  return (
    <Box sx={{ mt: compact ? 1.5 : 2 }}>
      <Divider sx={{ mb: 1.5, borderColor: 'rgba(255,255,255,0.12)' }} />

      <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', mb: 0.5 }}>
        What you get
      </Typography>
      <Typography sx={{ color: 'grey.400', fontSize: '0.75rem', lineHeight: 1.5, mb: 1 }}>
        A commercial licence covering {covers}, worldwide, for one payment. It is
        non-exclusive — we licence the same recordings to other people — and it is
        non-transferable. It ends only if you breach these terms, or if the payment is
        later reversed by a refund or chargeback.
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.5, color: 'grey.400' }}>
        {INCLUDED.map((item) => (
          <Typography
            component="li"
            key={item}
            sx={{ fontSize: '0.75rem', lineHeight: 1.5, mb: 0.25 }}
          >
            {item}
          </Typography>
        ))}
      </Box>

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

      {/* THE PROMISE THAT MAKES IT WORTH BUYING, and the one place it is safe to make.
        * Nothing in the catalogue is enrolled in YouTube Content ID or Meta Rights
        * Manager -- that enrolment comes with DistroKid's Social Media Pack, which has
        * never been purchased for any release -- so BFMG will not claim or mute a
        * licensee's video. Stated as "we do not claim", never "no claim can occur": an
        * unrelated rights holder can still raise a false match, and that is outside
        * anyone's control. Promising to clear it would be promising someone else's
        * cooperation. */}
      <Typography sx={{ color: 'grey.400', fontSize: '0.75rem', lineHeight: 1.5, mt: 1.5 }}>
        <Box component="span" sx={{ color: '#1DB954', fontWeight: 700 }}>
          We will not claim or mute your video.
        </Box>{' '}
        Our catalogue is not registered with YouTube Content ID or Meta Rights Manager.
        If a third party claims one anyway, your account gives you a dispute pack — your
        licence number, its verification link, and a statement you can submit to the
        platform.
      </Typography>

      <Typography sx={{ color: 'grey.400', fontSize: '0.75rem', lineHeight: 1.5, mt: 1.5 }}>
        <Box component="span" sx={{ color: '#1DB954', fontWeight: 700 }}>
          Broadcast, cinema or a paid ad campaign?
        </Box>{' '}
        Those are quoted per project.{' '}
        <MuiLink
          component={RouterLink}
          to="/sync-licensing"
          sx={{ color: '#1DB954', textDecorationColor: 'rgba(29,185,84,0.4)' }}
        >
          Request a quote
        </MuiLink>
      </Typography>

      <Typography sx={{ color: 'grey.600', fontSize: '0.6875rem', mt: 1.5 }}>
        Summary only.{' '}
        <MuiLink component={RouterLink} to="/terms" sx={{ color: 'grey.500' }}>
          Full terms
        </MuiLink>{' '}
        apply.
      </Typography>
    </Box>
  );
}
