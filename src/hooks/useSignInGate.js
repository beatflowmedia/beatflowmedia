// src/hooks/useSignInGate.js
//
// "You need an account for this — want to sign in now?" ONE copy.
//
// WHY IT IS A HOOK AND NOT A THIRD INLINE BLOCK
// PurchaseButton worked this out first and left the reasoning in place: there is no
// /signin route in AppRoutes.js, sign-in is a Google popup, so telling a buyer to sign
// in and routing them anywhere is a 404, and telling them without routing is a wall with
// no door. The right behaviour is to OFFER the sign-in where they are.
//
// That block then wanted copying twice more — the collection licence panel and the
// per-track commercial control — which is the rule-of-three line, so it is extracted
// rather than copied a third time.
//
// THE STALE-USER RETURN IS THE SUBTLE PART, and it is why this returns rather than
// continuing. `user` comes from context and is still null in the closure that called
// this, so carrying on after a successful sign-in would read the old value and fall
// through the rest of the flow with no identity. The buyer presses the button again.
// One extra click, always correct; continuing with a stale identity is how an
// acceptance gets recorded against nobody.
//
// PurchaseButton still carries its own copy. Deliberately not collapsed in the same
// change: it is the one path that currently sells anything, and its block is woven into
// a longer flow with its own already-purchased and album-choice branches. Worth doing,
// worth doing on its own.

import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../hooks/useModal';

/**
 * @param {string} title   e.g. "Sign in to license this collection"
 * @returns {() => Promise<void>}  pass as onRequiresSignIn to useLicensedCheckout
 */
export default function useSignInGate(title = 'Sign in to license this music') {
  const { signInWithGoogle } = useAuth();
  const { showAlert, showConfirm } = useModal();

  return useCallback(async () => {
    const wantsToSignIn = await showConfirm(
      title,
      'Your license is recorded against your account, so we need to know who you are ' +
        'before you accept the terms. Sign in with Google to continue.',
      'info'
    );
    if (!wantsToSignIn) return;

    try {
      await signInWithGoogle();
    } catch (err) {
      // Closing the popup is a decision, not a failure, so it is not reported as one.
      if (err?.code !== 'auth/popup-closed-by-user' &&
          err?.code !== 'auth/cancelled-popup-request') {
        await showAlert('Sign In Failed', err.message, 'error');
      }
    }
  }, [title, signInWithGoogle, showAlert, showConfirm]);
}
