// src/utils/shareHelper.js

/**
 * Build the canonical URL for a given song id.
 * Now uses a clean `/song/:id` path instead of query params.
 *
 * @param {string} songId
 * @returns {string}
 */
export function getSongUrl(songId) {
  const encoded = encodeURIComponent(songId);
  return `${window.location.origin}/song/${encoded}`;
}

/**
 * Build the share text you want pre-populated for social posts.
 *
 * @param {string} title
 * @param {string} songId
 * @returns {string}
 */
export function getShareText(title, songId) {
  const url = getSongUrl(songId);
  return `🎵 Check out "${title}" on BeatFlow Media! 🔗 ${url}`;
}

/**
 * Open a popup to share on Twitter.
 *
 * @param {string} text — text to tweet (will be URL-encoded internally)
 */
export function shareOnTwitter(text) {
  const href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(href, "_blank", "noopener");
}

/**
 * Open a popup to share on Facebook.
 *
 * @param {string} songUrl — full URL of the song page
 */
export function shareOnFacebook(songUrl) {
  const href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(songUrl)}`;
  window.open(href, "_blank", "noopener");
}

/**
 * Open a popup to share on LinkedIn.
 *
 * @param {string} songUrl — full URL of the song page
 */
export function shareOnLinkedIn(songUrl) {
  const href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(songUrl)}`;
  window.open(href, "_blank", "noopener");
}

/**
 * Open a popup to share on Reddit.
 *
 * @param {string} songUrl — full URL of the song page
 */
export function shareOnReddit(songUrl) {
  const href = `https://www.reddit.com/submit?url=${encodeURIComponent(songUrl)}`;
  window.open(href, "_blank", "noopener");
}

/**
 * Launch the mail client with a pre-filled subject & body.
 *
 * @param {string} subject — email subject line
 * @param {string} body — email body (will be URL-encoded)
 */
export function shareViaEmail(subject, body) {
  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
}

/**
 * Copy any text to the clipboard.
 *
 * @param {string} text
 * @returns {Promise<void>}
 */
export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}
