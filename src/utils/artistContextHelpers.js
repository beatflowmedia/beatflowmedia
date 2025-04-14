// src/utils/artistContextHelpers.js
import { showSuccessToast, showErrorToast } from "./Toast";

/**
 * Unfollow the given artist.
 */
export function unfollowArtist(artistName) {
  // Replace with your real logic (API call, state update, etc.)
  console.log("[unfollowArtist] Unfollowing artist:", artistName);
  showSuccessToast(`You have unfollowed ${artistName}.`);
}

/**
 * Add the artist to a "Don't Play" list.
 */
export function dontPlayArtist(artistName) {
  console.log("[dontPlayArtist] Added to Don't Play list:", artistName);
  showSuccessToast(`You won't hear ${artistName} again.`);
}

/**
 * Pin the artist.
 */
export function pinArtist(artistName) {
  console.log("[pinArtist] Pinning artist:", artistName);
  showSuccessToast(`${artistName} has been pinned.`);
}

/**
 * Navigate to the artist radio.
 */
export function goToArtistRadio(artistName) {
  console.log("[goToArtistRadio] Opening radio for:", artistName);
  showSuccessToast(`Now playing ${artistName}'s radio.`);
}

/**
 * Report the artist.
 */
export function reportArtist(artistName) {
  console.log("[reportArtist] Reporting artist:", artistName);
  showErrorToast(`You have reported ${artistName}.`);
}

/**
 * Share the artist.
 */
export function shareArtist(artistName) {
  console.log("[shareArtist] Sharing artist:", artistName);
  showSuccessToast(`Sharing ${artistName}.`);
}

/**
 * Open the artist in the desktop app.
 */
export function openInDesktopApp(artistName) {
  console.log("[openInDesktopApp] Opening in Desktop app:", artistName);
  showSuccessToast(`Opening ${artistName} in the desktop app.`);
}
