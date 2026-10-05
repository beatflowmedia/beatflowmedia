// src/utils/authedHeaders.js
//
// Build request headers carrying the signed-in user's Firebase ID token.
//
// The functions on the other end (request-payout, create-connect-account,
// update-subscription, approve-submission, reject-submission, create-checkout,
// download-master) derive the acting user from this token rather than from the
// request body. A body can say any user id; a token cannot.
//
// This was `checkoutHeaders()` inside stripeService.js. Four call sites now need the
// same thing, so it lives here under a name that describes what it builds rather than
// the one path that first needed it.

import { auth } from '../firebaseConfig';

/**
 * @param {Record<string,string>} [extra] Additional headers to merge in.
 * @returns {Promise<Record<string,string>>}
 */
export async function authedHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra };

  const user = auth.currentUser;
  if (!user) return headers;

  try {
    const token = await user.getIdToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch (err) {
    // Deliberately not fatal here. The server refuses an unauthenticated call with a
    // 401 the UI can act on; throwing from a header builder would surface as a
    // generic failure that looks like the network, not like being signed out.
    console.warn('authedHeaders: could not mint an ID token:', err?.message || err);
  }

  return headers;
}

export default authedHeaders;
