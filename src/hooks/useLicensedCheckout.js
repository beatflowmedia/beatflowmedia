// src/hooks/useLicensedCheckout.js
//
// The only way a page should reach Stripe. ONE acceptance gate, every route.
//
// WHAT THIS REPLACED
// Five pages -- Search, Home, Playlist, ArtistSimple and TrackRow -- each carried
// their own copy of "sign in, check they don't already own it, call
// createSongCheckout". PurchaseButton had a sixth. The copies had already drifted
// (some toast, some showAlert, one checks item.type and the others don't), which is
// the ordinary cost of duplication.
//
// The legal change made it more than untidy. Once create-checkout refuses a sale
// without a recorded license acceptance, every copy that does not collect one stops
// working -- and the failure lands on the buyer as an unexplained error, not on the
// developer as a build break. Patching five call sites would have left a sixth to be
// written next month with no gate at all.
//
// So the gate lives here, attached to the act of buying rather than to the button
// that happens to trigger it. A page cannot start a checkout without rendering the
// dialog that collects assent, because the dialog and the trigger come from the same
// call.
//
// WHAT IT DELIBERATELY DOES NOT DO
// It does not handle sign-in prompts or already-purchased redirects. Those differ
// legitimately per page (a search result behaves differently from an album header)
// and centralizing them would mean inventing one voice for five contexts. Callers
// keep their own checks and call requestCheckout() where they used to call
// stripeService directly.
//
//   const { requestCheckout, licenseDialog } = useLicensedCheckout();
//   ...
//   requestCheckout({ type: 'song', itemId: song.id, itemName: song.title,
//                     artistName: song.artistName, price: song.price });
//   ...
//   return (<>...{licenseDialog}</>);

import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { stripeService } from '../services/stripeService';
import LicenseAcceptanceDialog from '../components/LicenseAcceptanceDialog';

export default function useLicensedCheckout(options = {}) {
  const { onError, onRequiresSignIn } = options;
  const { user } = useAuth();

  // The item waiting on an acceptance. Null means no dialog is open, so one piece
  // of state carries both "what" and "whether", and they cannot disagree.
  const [pending, setPending] = useState(null);

  // Signed out, the dialog never opens.
  //
  // Not a security control -- create-checkout has always refused unauthenticated
  // calls. It is about WHO AGREED. The dialog's tick box records that a named person
  // accepted a named version of the terms at a known moment, and that is the whole
  // value of it. Showing it to someone with no identity collects a promise from
  // nobody, and attaching it to whoever signs in afterwards records an agreement
  // that never happened.
  //
  // The guard lives here rather than in the six pages that call this, because six
  // copies of a check is six chances to forget one -- and the one that gets
  // forgotten is the one that ships.
  const requestCheckout = useCallback((item) => {
    if (!item || !item.itemId) return;
    if (!user) {
      if (onRequiresSignIn) onRequiresSignIn();
      else if (onError) onError(new Error('Please sign in to license music.'));
      return;
    }
    setPending(item);
  }, [user, onRequiresSignIn, onError]);

  const cancel = useCallback(() => setPending(null), []);

  // `pending` here is the value from the render that drew the dialog, which is the
  // item the buyer was actually looking at when they ticked the box. That matters
  // more than it looks: reading it from a ref or re-deriving it would open a gap
  // where the recorded acceptance belongs to a different item than the one shown.
  const confirm = useCallback(
    async (acceptedAgreement) => {
      const item = pending;
      setPending(null);
      if (!item || !user) return;

      try {
        if (item.type === 'album') {
          await stripeService.createAlbumCheckout(user.uid, item.itemId, user.email, acceptedAgreement);
        } else {
          await stripeService.createSongCheckout(user.uid, item.itemId, user.email, acceptedAgreement);
        }
      } catch (error) {
        console.error('Licensed checkout failed:', error);
        if (onError) onError(error);
      }
    },
    [pending, user, onError]
  );

  const licenseDialog = (
    <LicenseAcceptanceDialog
      open={!!pending}
      onClose={cancel}
      itemName={pending ? pending.itemName : null}
      artistName={pending ? pending.artistName : null}
      price={pending ? pending.price : undefined}
      onConfirm={confirm}
    />
  );

  return { requestCheckout, licenseDialog };
}
