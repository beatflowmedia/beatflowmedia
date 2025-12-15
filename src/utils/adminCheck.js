/**
 * Platform admin utilities
 * Only perriceconsulting@gmail.com and percyricemusic@gmail.com have admin access
 */

const PLATFORM_ADMINS = [
  'perriceconsulting@gmail.com',
  'percyricemusic@gmail.com'
];

/**
 * Check if user is a platform admin
 * @param {Object} user - Firebase user object with email
 * @returns {boolean} - True if user is admin
 */
export function isPlatformAdmin(user) {
  if (!user || !user.email) return false;
  return PLATFORM_ADMINS.includes(user.email.toLowerCase());
}

/**
 * Check if email is a platform admin
 * @param {string} email - Email to check
 * @returns {boolean} - True if email is admin
 */
export function isAdminEmail(email) {
  if (!email) return false;
  return PLATFORM_ADMINS.includes(email.toLowerCase());
}

/**
 * Get list of platform admins (for security rules)
 * @returns {Array<string>} - List of admin emails
 */
export function getPlatformAdmins() {
  return [...PLATFORM_ADMINS];
}
