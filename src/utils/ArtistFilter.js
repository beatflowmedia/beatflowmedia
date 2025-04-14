// utils/ArtistFilter.js
// ------------------------------------------------------
// Groups songs by normalized artist name (trimmed and lowercased).
// Returns an object where each key is the normalized artist name,
// and the value is an array of songs by that artist.
// ------------------------------------------------------
export const groupSongsByArtist = (allSongs) => {
  const grouped = allSongs.reduce((acc, song) => {
    const normalizedArtist = song.artist ? song.artist.trim().toLowerCase() : "unknown";
    if (!acc[normalizedArtist]) {
      acc[normalizedArtist] = [];
    }
    acc[normalizedArtist].push(song);
    return acc;
  }, {});
  console.log("[DEBUG] Grouped Songs:", grouped); // Debug: output all keys and their songs
  return grouped;
};
