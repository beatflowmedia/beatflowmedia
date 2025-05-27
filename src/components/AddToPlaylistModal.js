import React, { useState } from "react";

function AddToPlaylistModal({ song, playlists, onClose, onAddToPlaylist, onCreatePlaylist }) {
  const [selectedId, setSelectedId] = useState(playlists[0]?.id || "");
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const handleAdd = () => {
    if (selectedId) {
      onAddToPlaylist(selectedId, song);
    }
  };

  const handleCreate = () => {
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim(), song);
      setNewPlaylistName("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 rounded-lg shadow-lg w-96 p-6 space-y-4 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
          onClick={onClose}
          aria-label="Close"
        >✕</button>
        <h2 className="text-lg font-bold text-white mb-2">Add to Playlist</h2>
        <label className="block text-white text-sm mb-2">Select Playlist</label>
        <select
          className="w-full p-2 mb-4 rounded bg-gray-800 text-white"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          <option value="" disabled>Select a playlist</option>
          {playlists.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          className="w-full mb-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded"
          onClick={handleAdd}
          disabled={!selectedId}
        >
          Add to Playlist
        </button>
        <div className="border-t border-gray-700 pt-3">
          <label className="block text-white text-sm mb-2">Or create new:</label>
          <input
            className="w-full p-2 rounded bg-gray-800 text-white mb-2"
            placeholder="New playlist name"
            value={newPlaylistName}
            onChange={e => setNewPlaylistName(e.target.value)}
          />
          <button
            className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded"
            onClick={handleCreate}
            disabled={!newPlaylistName.trim()}
          >
            Create & Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddToPlaylistModal;
