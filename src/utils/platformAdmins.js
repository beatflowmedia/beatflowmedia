// src/utils/platformAdmins.js
//
// Canonical list of platform administrators.
//
// "Who is an admin" was defined in three places and answered differently in each:
//
//   1. firestore.rules isPlatformAdmin()  -> these two email addresses
//   2. src/utils/adminCheck.js            -> the same two, copied
//   3. firestore.rules submissions rules  -> request.auth.token.admin == true
//
// The third is the dangerous one: `setCustomUserClaims` is never called anywhere in
// this repo, so `token.admin` is never true for anybody. That rule does not grant
// narrow access -- it grants none, which is why approve-submission.js exists as a
// Netlify function using the admin SDK. The function was the way in, and it checked
// nothing.
//
// This module is the single origin. It is CommonJS because the Netlify functions
// require it directly, the same way they already require src/utils/pricing.js and
// src/utils/agreements.js.
//
// firestore.rules cannot import JavaScript, so the list there is a copy that has to
// reconcile back here. `npm run verify:admins` is that reconciler -- a copy with a
// checker is a copy; a copy with a promise to remember is a second source of truth.

const PLATFORM_ADMIN_EMAILS = [
  'perriceconsulting@gmail.com',
  'percyricemusic@gmail.com'
];

/**
 * Is this email address a platform administrator?
 *
 * Compared case-insensitively: Google may present the address with different
 * capitalisation than it was typed in here, and an admin check that fails on
 * capitalisation fails silently -- it looks like a permissions problem.
 *
 * @param {string} email
 * @returns {boolean}
 */
function isAdminEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return PLATFORM_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Is this Firebase user (or decoded ID token) a platform administrator?
 *
 * Accepts either shape because the client holds a user object and the Netlify
 * functions hold a decoded token; both carry `email`.
 *
 * @param {{email?: string}|null|undefined} userOrToken
 * @returns {boolean}
 */
function isPlatformAdmin(userOrToken) {
  return isAdminEmail(userOrToken && userOrToken.email);
}

module.exports = {
  PLATFORM_ADMIN_EMAILS,
  isAdminEmail,
  isPlatformAdmin
};
