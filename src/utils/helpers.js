// utils/helpers.js
export const filterSongsByArtist = (artistName, allSongs) => {
  return allSongs.filter((song) => song.artist === artistName);
};
