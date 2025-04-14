// components/NewPlaylistModal.js
import React, { useState } from "react";

const NewPlaylistModal = ({ onCreate, onCancel }) => {
  const [name, setName] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-white text-xl font-bold mb-4">New Playlist</h2>
        <input
          className="w-full p-2 mb-4 rounded bg-gray-800 text-white"
          placeholder="Enter playlist name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(name)}
            className="px-4 py-2 rounded bg-green-500 hover:bg-green-400 text-white"
            disabled={!name.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewPlaylistModal;
