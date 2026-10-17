// src/components/CollectionLicensePanel.js
//
// Where a collection becomes purchasable. The answer to "how does a buyer license the
// whole thing, or hand-pick tracks?" -- which the collection page previously answered
// with the words "licensable individually" and no control that licensed anything.
//
// IT SHOWS BOTH PRICES SIDE BY SIDE, which is the deliberate part. A buyer who sees only
// $319 cannot tell whether that is the only way in; a buyer who sees only the $29 track
// price will buy four tracks and never learn the volume curve existed. Stating both makes
// the discount visible at the moment the decision is made, and the saving is the argument
// -- 56 tracks at the single-track rate is $1,624, so the collection is 80% off.
//
// THE PRICE IS COMPUTED, NOT STORED, and this component is a SECOND consumer of the same
// function the server charges from (calculateCollectionPrice in src/utils/pricing.js).
// That is the Single Source caveat working as intended: the client holds a derived copy
// so the page can show a number before a round trip, and the server recomputes it from
// Firestore and ignores whatever the client believed. If they ever disagree, the buyer is
// charged the server's figure -- so the risk is a misleading label, not a wrong charge,
// and `npm run verify:price-units` is the reconciler.

import { useState } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import {
  calculateCollectionPrice,
  calculateCommercialPrice,
  commercialRateForPool,
  formatPrice
} from '../utils/pricing';
import useLicensedCheckout from '../hooks/useLicensedCheckout';
import useSignInGate from '../hooks/useSignInGate';

const ACCENT = '#1DB954';
const TAP_TARGET = 44;

export default function CollectionLicensePanel({ collection, licensableCount = null }) {
  const [error, setError] = useState(null);
  const requireSignIn = useSignInGate('Sign in to license this collection');

  const { requestCheckout, licenseDialog } = useLicensedCheckout({
    onError: (err) => setError(err.message || 'Could not start checkout.'),
    // Offers the sign-in where the buyer is standing, rather than announcing the
    // requirement. See useSignInGate for why routing them anywhere would be a 404.
    onRequiresSignIn: requireSignIn
  });

  if (!collection) return null;

  const pool = collection.assetPool || null;

  // THE LIVE COUNT WINS, and the stored one is only a placeholder while the grid loads.
  //
  // create-checkout prices from its own query of the deliverable songs, so if this quoted
  // the stored trackCount the page would advertise one figure and Stripe would bill
  // another. They differ today on at least one collection -- see the note in
  // CollectionPage, and `npm run verify:collections`.
  const liveCount = Number.isFinite(licensableCount) ? licensableCount : null;
  const trackCount = liveCount !== null ? liveCount : Number(collection.trackCount) || 0;

  // Until the grid has reported, the figure on screen is the unverified stored one. The
  // button is held rather than showing a price we cannot promise: it is a few hundred
  // milliseconds, and a price that changes under a buyer's cursor is worse than a wait.
  const priceIsAuthoritative = liveCount !== null;

  // A collection with no tracks is not sellable, and saying so beats a $29 button that
  // delivers nothing. create-checkout refuses it server-side too (assertDeliverable
  // queries for deliverable tracks rather than trusting this count), so this is the
  // honest label for a state the server already blocks.
  if (trackCount < 1) return null;

  const collectionPrice = calculateCollectionPrice(trackCount, pool);
  const trackPrice = calculateCommercialPrice(1, commercialRateForPool(pool));
  const ifBoughtSeparately = trackPrice * trackCount;
  const saving = ifBoughtSeparately - collectionPrice;
  const savingPercent = Math.round((saving / ifBoughtSeparately) * 100);

  const licenseCollection = () => {
    setError(null);
    requestCheckout({
      type: 'collection',
      licenseType: 'commercial',
      itemId: collection.slug || collection.id,
      itemName: collection.title,
      artistName: 'BeatFlow Media Group',
      price: collectionPrice,
      trackCount
    });
  };

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, pb: 3 }}>
      <Box
        sx={{
          // Base rule is the phone: one column. Scaled UP at sm, never walked back.
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          p: { xs: 2, md: 2.5 },
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.03)'
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
            {priceIsAuthoritative
              ? `License all ${trackCount} tracks for commercial use`
              : 'License the whole collection for commercial use'}
          </Typography>
          <Typography sx={{ color: 'grey.400', fontSize: '0.8125rem', mt: 0.5, lineHeight: 1.5 }}>
            One payment, permanent, worldwide. Video, podcasts, apps, games and client
            work — we do not claim or mute your uploads.
          </Typography>
          {priceIsAuthoritative && saving > 0 ? (
            <Typography sx={{ color: ACCENT, fontSize: '0.8125rem', mt: 0.75, fontWeight: 600 }}>
              {formatPrice(trackPrice)} per track on its own — {savingPercent}% off as a
              collection, saving {formatPrice(saving)}
            </Typography>
          ) : null}
        </Box>

        <Box sx={{ flexShrink: 0 }}>
          <Button
            onClick={licenseCollection}
            disabled={!priceIsAuthoritative}
            variant="contained"
            fullWidth
            sx={{
              minHeight: TAP_TARGET + 4,
              px: 3,
              fontSize: '1rem',
              fontWeight: 700,
              // MUI uppercases by default, which turns a price into a shout and is one
              // of the two reasons the storefront button measured 41px.
              textTransform: 'none',
              whiteSpace: 'nowrap',
              bgcolor: ACCENT,
              color: '#000',
              '&:hover': { bgcolor: '#1ed760' },
              '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.12)', color: 'grey.500' }
            }}
          >
            {priceIsAuthoritative
              ? `License collection — ${formatPrice(collectionPrice)}`
              : 'Counting tracks…'}
          </Button>
          <Typography
            sx={{ color: 'grey.500', fontSize: '0.75rem', mt: 1, textAlign: 'center' }}
          >
            Or license any single track below
          </Typography>
        </Box>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {licenseDialog}
    </Box>
  );
}
