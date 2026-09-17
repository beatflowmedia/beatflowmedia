/**
 * Audio Utility Functions
 * Centralized helpers for handling audio URLs across different data structures
 */

/**
 * Get the audio URL from a song object, checking all possible field names
 * @param {Object} song - Song object from Firestore
 * @returns {string|null} - Audio URL or null if not found
 */
export function getAudioUrl(song) {
  if (!song) return null;

  // Check all possible field names (ordered by preference)
  return song.url || song.audioUrl || song.src || song.streamUrl || null;
}

/**
 * Check if a song has a valid audio URL
 * @param {Object} song - Song object from Firestore
 * @returns {boolean} - True if song has audio URL
 */
export function hasAudioUrl(song) {
  return !!getAudioUrl(song);
}

/**
 * Normalize a song object to use consistent field names
 * Sets 'url' as the standard audio URL field
 * @param {Object} song - Song object from Firestore
 * @returns {Object} - Normalized song object
 */
export function normalizeSong(song) {
  if (!song) return null;

  const audioUrl = getAudioUrl(song);

  return {
    ...song,
    url: audioUrl || song.url, // Ensure 'url' is the primary field
    audioUrl: audioUrl || song.audioUrl, // Keep for backwards compatibility
  };
}
