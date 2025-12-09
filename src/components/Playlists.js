import React from "react";
import { FaMusic, FaPlus, FaTrash } from "react-icons/fa";

const Playlists = ({
  playlists,
  onCreateNewPlaylist,
  onAddSongToPlaylist,
  onRemoveSongFromPlaylist, // ✅ ADD THIS
  selectedSong,
  onSelectPlaylist
}) => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Your Playlists</h2>
        <button
          onClick={() => {
            const name = prompt("Enter playlist name:");
            if (name) onCreateNewPlaylist(name);
          }}
          className="text-gray-400 hover:text-white"
        >
          <FaPlus />
        </button>
      </div>

      {playlists.length === 0 ? (
        <p className="text-gray-400">No playlists created yet.</p>
      ) : (
        <div className="space-y-4">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3
                  className="text-white font-bold cursor-pointer hover:text-green-400"
                  onClick={() => onSelectPlaylist(playlist)}
                >
                  <FaMusic className="inline-block mr-2" />
                  {playlist.name}
                </h3>

                {/* ✅ Add-to-Playlist Icon */}
                {selectedSong && (
                  <button
                    className="text-green-400 hover:text-green-300"
                    title={`Add "${selectedSong.title}"`}
                    onClick={() =>
                      onAddSongToPlaylist(playlist.id, selectedSong)
                    } // ✅ PASS SONG
                  >
                    <FaPlus />
                  </button>
                )}
              </div>

              <ul className="text-sm text-gray-300 space-y-1 ml-6">
                {playlist.songs && playlist.songs.length > 0 ? (
                  playlist.songs.map((song) => (
                    <li
                      key={song.id}
                      className="flex items-center justify-between"
                    >
                      <span>🎵 {song.title}</span>
                      <button
                        className="text-red-400 hover:text-red-300"
                        title="Remove song"
                        onClick={() =>
                          onRemoveSongFromPlaylist &&
                          onRemoveSongFromPlaylist(playlist.id, song)
                        }
                      >
                        <FaTrash />
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">No songs yet</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Playlists;
