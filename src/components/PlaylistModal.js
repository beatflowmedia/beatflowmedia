import { useState, useEffect , useCallback } from "react";
import {
  addSongToPlaylist,
  subscribeToPlaylists
} from "../utils/PlaylistHelper";
import { toast } from "react-toastify";

const PlaylistModal = ({ song, onClose }) => {
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToPlaylists(setPlaylists);
    return () => unsubscribe();
  }, []);

  const handleAddToPlaylist = useCallback(
    async (playlistId) => {
      try {
        await addSongToPlaylist(playlistId, song);
        toast.success(`Added "${song.title}" to playlist!`);
        onClose();
      } catch (error) {
        toast.error(`Failed to add song: ${error.message}`);
      }
    },
    [song, onClose],
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-white text-xl font-bold mb-4">Add to Playlist</h2>
        {playlists.length === 0 ? (
          <p className="text-gray-400">No playlists available.</p>
        ) : (
          <div className="space-y-2">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                className="w-full p-2 bg-gray-800 hover:bg-gray-700 rounded"
                onClick={() => handleAddToPlaylist(playlist.id)}
              >
                {playlist.name}
              </button>
            ))}
          </div>
        )}
        <button
          className="w-full mt-4 p-2 bg-red-500 hover:bg-red-400 rounded"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PlaylistModal;
