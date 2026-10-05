/**
 * Platform admin utilities
 *
 * The admin list itself lives in ./platformAdmins.js, which is the single origin and
 * is CommonJS so the Netlify functions can require it too. This module is the client
 * face of it and exists only to keep the ESM import style the UI already uses.
 *
 * Do not add an email address here. Add it to platformAdmins.js, then run
 * `npm run verify:admins` so firestore.rules is checked against it.
 */

import { PLATFORM_ADMIN_EMAILS, isAdminEmail as isAdminEmailCanonical, isPlatformAdmin as isPlatformAdminCanonical } from './platformAdmins';

/**
 * Check if user is a platform admin
 * @param {Object} user - Firebase user object with email
 * @returns {boolean} - True if user is admin
 */
export function isPlatformAdmin(user) {
  return isPlatformAdminCanonical(user);
}

/**
 * Check if email is a platform admin
 * @param {string} email - Email to check
 * @returns {boolean} - True if email is admin
 */
export function isAdminEmail(email) {
  return isAdminEmailCanonical(email);
}

/**
 * Get list of platform admins (for security rules)
 * @returns {Array<string>} - List of admin emails
 */
export function getPlatformAdmins() {
  return [...PLATFORM_ADMIN_EMAILS];
}
