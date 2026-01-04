import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import {
  subscribeToPlaylists,
  removeSongFromPlaylist
} from "../utils/PlaylistHelper";
import { toast } from "react-toastify";

export default function PlaylistView({ playlistId, onSongSelect }) {
  const [playlist, setPlaylist] = useState(null);

  useEffect(() => {
    if (!playlistId) return;

    const unsubscribe = subscribeToPlaylists((playlists) => {
      const selectedPlaylist = playlists.find((p) => p.id === playlistId);
      setPlaylist(selectedPlaylist);
    });

    return () => unsubscribe();
  }, [playlistId]);

  if (!playlist) {
    return <p className="text-gray-400 p-4">No playlist selected.</p>;
  }

  return (
    <div className="p-6">
      {/* Playlist Header */}
      <div className="relative w-full h-64 bg-gradient-to-b from-gray-700 to-black rounded-lg overflow-hidden">
        <img
          src={playlist.cover || "/default-playlist-cover.jpg"}
          alt={playlist.name}
          className="absolute w-full h-full object-cover opacity-50"
        />
        <div className="relative z-10 flex flex-col justify-end h-full p-6">
          <h1 className="text-white text-5xl font-bold">{playlist.name}</h1>
          <p className="text-gray-300 text-lg">
            {playlist.songs ? playlist.songs.length : 0}{" "}
            {playlist.songs && playlist.songs.length === 1 ? "song" : "songs"}
          </p>
        </div>
      </div>

      {/* Song List */}
      <h2 className="text-white text-2xl font-bold mt-6">Songs</h2>
      {playlist.songs && playlist.songs.length > 0 ? (
        <div className="mt-4 grid grid-cols-4 gap-4">
          {playlist.songs.map((song) => (
            <div
              key={song.id}
              className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-all cursor-pointer flex items-center justify-between"
            >
              {/* Click to play the song */}
              <div
                className="flex items-center space-x-3 w-full cursor-pointer"
                onClick={() => {
                  console.log("[DEBUG] Playing song from playlist:", song);
                  onSongSelect(song);
                }}
              >
                <img
                  src={song.cover || "data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50"%3E%3Crect width="50" height="50" fill="%23333"/%3E%3C/svg%3E"}
                  alt="Album Cover"
                  className="w-14 h-14 rounded-md"
                />
                <div>
                  <h3 className="text-white font-bold text-sm">{song.title}</h3>
                  <p className="text-gray-400 text-xs">{song.artist}</p>
                </div>
              </div>

              {/* Remove from Playlist Button */}
              <button
                className="text-red-400 hover:text-red-300"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent accidental song play
                  console.log("[DEBUG] Removing song from playlist:", song);
                  removeSongFromPlaylist(playlist.id, song)
                    .then(() =>
                      toast.success(`Removed "${song.title}" from playlist!`),
                    )
                    .catch((error) =>
                      toast.error("Error removing song: " + error.message),
                    );
                }}
                title="Remove from Playlist"
              >
                <FaTrash size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 mt-4">No songs in this playlist.</p>
      )}
    </div>
  );
}
