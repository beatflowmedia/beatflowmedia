import React from "react";

export default function SearchResults({
  query = "",
  onClose = () => {},
  musicData = [],
  playlists = [],
  onSongSelect = () => {},
  onArtistSelect = () => {},
  onPlaylistSelect = () => {}
}) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return null;

  // 🔥 Now also matching artist names!
  const filteredSongs = musicData.filter(
    (song) =>
      song.title?.toLowerCase().includes(normalizedQuery) ||
      song.artist?.toLowerCase().includes(normalizedQuery),
  );

  const allArtists = [
    ...new Set(musicData.map((song) => song.artist).filter(Boolean)),
  ];
  const filteredArtists = allArtists.filter((artist) =>
    artist.toLowerCase().includes(normalizedQuery),
  );

  const filteredPlaylists = playlists.filter((playlist) =>
    playlist.name.toLowerCase().includes(normalizedQuery),
  );

  const noResults =
    filteredSongs.length === 0 &&
    filteredArtists.length === 0 &&
    filteredPlaylists.length === 0;

  return (
    <div className="absolute bg-gray-900 text-white w-full mt-2 rounded-lg shadow-lg p-4 max-h-60 overflow-y-auto z-50">
      {filteredSongs.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-2">Songs</h3>
          {filteredSongs.map((song, index) => (
            <div
              key={index}
              className="p-2 hover:bg-gray-800 rounded cursor-pointer"
              onClick={() => {
                onSongSelect(song);
                onClose();
              }}
            >
              🎵 {song.title}{" "}
              <span className="text-gray-400 text-xs ml-1">
                by {song.artist}
              </span>
            </div>
          ))}
        </div>
      )}

      {filteredArtists.length > 0 && (
        <div className="mt-3">
          <h3 className="text-sm font-bold mb-2">Artists</h3>
          {filteredArtists.map((artist, index) => (
            <div
              key={index}
              className="p-2 hover:bg-gray-800 rounded cursor-pointer"
              onClick={() => {
                onArtistSelect(artist);
                onClose();
              }}
            >
              🎤 {artist}
            </div>
          ))}
        </div>
      )}

      {filteredPlaylists.length > 0 && (
        <div className="mt-3">
          <h3 className="text-sm font-bold mb-2">Playlists</h3>
          {filteredPlaylists.map((playlist, index) => (
            <div
              key={index}
              className="p-2 hover:bg-gray-800 rounded cursor-pointer"
              onClick={() => {
                onPlaylistSelect(playlist);
                onClose();
              }}
            >
              📜 {playlist.name}
            </div>
          ))}
        </div>
      )}

      {noResults && (
        <div className="text-gray-400 text-sm text-center">
          No results found
        </div>
      )}
    </div>
  );
}
