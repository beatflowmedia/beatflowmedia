// src/utils/shareHelper.js

/**
 * Build the canonical URL for a given song id.
 */
export function getSongUrl(songId) {
  const encoded = encodeURIComponent(songId);
  return `${window.location.origin}/song/${encoded}`;
}

/**
 * Build the canonical URL for a given playlist id.
 */
export function getPlaylistUrl(playlistId) {
  const encoded = encodeURIComponent(playlistId);
  return `${window.location.origin}/playlist/${encoded}`;
}

/**
 * Build the share text you want pre-populated.
 */
export function getShareText(title, songId) {
  const url = getSongUrl(songId);
  return `🎵 Check out "${title}" on BeatFlow Media! 🔗 ${url}`;
}

/**
 * Build the share text for playlists.
 */
export function getPlaylistShareText(name, playlistId) {
  const url = getPlaylistUrl(playlistId);
  return `🎵 Check out "${name}" playlist on BeatFlow Media! 🔗 ${url}`;
}

export function shareOnTwitter(text) {
  const href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(href, "_blank", "noopener");
}

export function shareOnFacebook(songUrl) {
  const href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(songUrl)}`;
  window.open(href, "_blank", "noopener");
}

export function shareOnLinkedIn(songUrl) {
  const href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(songUrl)}`;
  window.open(href, "_blank", "noopener");
}

export function shareOnReddit(songUrl) {
  const href = `https://www.reddit.com/submit?url=${encodeURIComponent(songUrl)}`;
  window.open(href, "_blank", "noopener");
}

export function shareViaEmail(subject, body) {
  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
}

export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}
