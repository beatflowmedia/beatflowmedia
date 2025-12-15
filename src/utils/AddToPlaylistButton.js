// AddToPlaylistButton.js
// ------------------------------------------------------
// A button that, when clicked, shows a dropdown of available playlists.
// Selecting a playlist calls "addSong(playlistId, song)" to add the song.
// ------------------------------------------------------
import { useState } from "react";

export default function AddToPlaylistButton({ song, playlists, addSong }) {
  const [showDropdown, setShowDropdown] = useState(false);

  if (!song || !playlists || !addSong) {
    console.error("Missing props in AddToPlaylistButton:", {
      song,
      playlists,
      addSong
    });
    return null;
  }

  return (
    <div className="relative">
      <button
        className="text-gray-400 hover:text-white"
        onClick={() => setShowDropdown(!showDropdown)}
        title="Add to Playlist"
      >
        ➕
      </button>
      {showDropdown && (
        <div className="absolute right-0 bottom-full mb-2 bg-gray-800 text-white p-2 rounded shadow-lg w-40 max-h-48 overflow-y-auto z-50">
          {playlists.length === 0 ? (
            <p className="text-gray-400 text-xs">No playlists available</p>
          ) : (
            playlists.map((playlist) => (
              <button
                key={playlist.id}
                className="block w-full text-left text-xs p-2 hover:bg-gray-700 rounded"
                style={{ textTransform: 'capitalize' }}
                onClick={() => {
                  addSong(playlist.id, song);
                  setShowDropdown(false);
                  console.log(
                    `Added "${song.title}" to playlist "${playlist.name}"`,
                  );
                }}
              >
                {playlist.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
