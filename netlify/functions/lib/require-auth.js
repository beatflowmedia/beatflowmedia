// netlify/functions/lib/require-auth.js
//
// One place that answers "who is calling, and may they touch this record".
//
// Six deployed functions took an identity straight out of the request body --
// request-payout read `artistId` from JSON and created a Stripe transfer against it.
// That is an IDOR (insecure direct object reference): acting on a caller-supplied id
// without checking the caller owns it. These functions use firebase-admin, so
// firestore.rules never applied; the admin SDK is privileged by design and the
// function is the only thing between the request and the database.
//
// The verify-the-bearer-token pattern below is not new. It is lifted from
// create-checkout.js and download-master.js, which are deployed and working, and it
// replaces the copy in each. Deliberately NOT built on
// netlify/functions/middleware/securityMiddleware.js, which looks like the obvious
// home for it but is not usable as it stands:
//
//   1. It is curried through an `async` function, so `securityMiddleware(o)(handler)`
//      evaluates to a Promise. Netlify calls `exports.handler(event, context)` and a
//      Promise is not callable -- every function wired to it would 500 on the first
//      request.
//   2. The only two functions that use it live in netlify/functions/api/admin/, which
//      Netlify does not pick up as functions at all (nested directories need a
//      dir/dir.js entry file). It has therefore never run in production.
//   3. It requires `jsonwebtoken`, which is in neither dependencies nor
//      devDependencies -- it resolves today only because firebase-admin pulls it in
//      transitively.
//
// Wiring money paths to 600 lines of never-executed middleware that also brings its
// own rate limiting, CORS and request sanitisation is a large blast radius for a fix
// that needs twelve lines. The middleware is a separate finding, not this fix.

const admin = require('firebase-admin');
const { isAdminEmail } = require('../../../src/utils/platformAdmins');

/** Build the refusal shape these functions already return. */
function refuse(statusCode, message) {
  return {
    ok: false,
    response: {
      statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: message })
    }
  };
}

/**
 * Verify the caller's Firebase ID token.
 *
 * AUTHENTICATION ONLY -- it proves who is calling and nothing about what they may do.
 * Callers that act on a record must also check ownership; see requireSelf.
 *
 * @param {object} event Netlify function event
 * @returns {Promise<{ok: true, uid: string, email: string|null, token: object}
 *                  | {ok: false, response: object}>}
 */
async function requireUser(event) {
  // A function that forgot to initialise the SDK would otherwise fail inside
  // verifyIdToken with a message that points nowhere near the cause.
  if (!admin.apps.length) {
    console.error('require-auth: firebase-admin was not initialised before use');
    return refuse(500, 'Server configuration error.');
  }

  const header = event.headers.authorization || event.headers.Authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return refuse(401, 'Sign in to continue.');
  }

  try {
    const token = await admin.auth().verifyIdToken(header.slice(7));
    return {
      ok: true,
      uid: token.uid,
      email: typeof token.email === 'string' ? token.email : null,
      token
    };
  } catch (err) {
    // Logged, not returned: a verification failure reason can disclose whether an
    // account exists or a token merely expired.
    console.warn('require-auth: ID token did not verify:', err.message);
    return refuse(401, 'Your session has expired. Sign in again.');
  }
}

/**
 * Verify the caller AND that they are acting on their own record.
 *
 * This is the half that actually closes the IDOR. Authentication alone does not stop
 * one signed-in artist posting another artist's id.
 *
 * A platform admin may act for another account. That is not a loosening invented
 * here -- firestore.rules already allows isPlatformAdmin() to update and delete
 * records it does not own, and the operator needs to be able to resolve a stuck
 * payout. The allowance is logged so it is visible in the function log rather than
 * being inferred later from an absence.
 *
 * @param {object} event Netlify function event
 * @param {string} claimedId The id taken from the request body
 */
async function requireSelf(event, claimedId) {
  const auth = await requireUser(event);
  if (!auth.ok) return auth;

  if (!claimedId || typeof claimedId !== 'string') {
    return refuse(400, 'Missing or invalid account id.');
  }

  if (auth.uid === claimedId) return auth;

  if (isAdminEmail(auth.email)) {
    console.warn(`require-auth: admin ${auth.email} acting for account ${claimedId}`);
    return { ...auth, actingAsAdmin: true };
  }

  // Deliberately 403 and deliberately vague. The caller is authenticated, so this is
  // an authorisation failure, not an authentication one -- returning 401 would make a
  // client retry the sign-in it already completed. The message does not confirm
  // whether `claimedId` names a real account.
  console.warn(`require-auth: ${auth.uid} tried to act on ${claimedId}`);
  return refuse(403, 'You can only act on your own account.');
}

/**
 * Verify the caller is a platform administrator.
 *
 * Used for acts that are administrative rather than merely authenticated -- approving
 * a submission publishes to the public catalogue. firestore.rules already carries that
 * reasoning in a comment above the songs rules; this is the same rule applied on the
 * path that bypasses it.
 *
 * @param {object} event Netlify function event
 */
async function requireAdmin(event) {
  const auth = await requireUser(event);
  if (!auth.ok) return auth;

  if (!isAdminEmail(auth.email)) {
    console.warn(`require-auth: non-admin ${auth.uid} attempted an admin action`);
    return refuse(403, 'Administrator access required.');
  }

  return auth;
}

module.exports = { requireUser, requireSelf, requireAdmin };
