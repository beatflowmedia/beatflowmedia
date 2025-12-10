// src/utils/buildArtistInfo.js
// ------------------------------------------------------
// Given an artist name and an array of songs, this helper
// builds an artist info object from the FIRST matching song.
// ------------------------------------------------------
export const buildArtistInfo = (artistName, allSongs) => {
  if (!artistName) return null;

  // Filter out all songs matching this artist (case-insensitive)
  const normalizedArtist = artistName.trim().toLowerCase();
  const artistSongs = allSongs.filter(
    (song) => song.artist.trim().toLowerCase() === normalizedArtist,
  );

  if (artistSongs.length === 0) {
    return null; // No matching songs found
  }

  // Use the first matching song as the "primary" data source
  const primarySong = artistSongs[0];

  // Pull fields from the first matching song
  return {
    name: primarySong.artist,
    cover: primarySong.cover || "/images/default-artist.jpg",
    // Use monthlyListeners if you have it in your JSON, otherwise fallback
    monthlyListeners: "Unknown",

    // Pull the actual biography from the first matching song
    biography: primarySong.biography || "No biography available.",

    // Similarly, if your JSON has actual credits, onTour, etc., we can copy them:
    credits: primarySong.credits || [],
    onTour: primarySong.onTour || [],
    nextInQueue: primarySong.nextInQueue || null,
    videoSrc: primarySong.videoSrc || null,
    videoPoster: primarySong.videoPoster || null,

    // Also store all the songs from this artist for auto-selecting the first track
    songs: artistSongs
  };
};
