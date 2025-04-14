// Favorites.js
// ------------------------------------------------------
// Renders a list of favorite songs. Clicking a song calls onSongSelect.
// ------------------------------------------------------
import React from "react";
import { FaHeart } from "react-icons/fa";

const Favorites = ({ favorites, onSongSelect }) => {
  return (
    <div className="mt-6">
      <h4 className="text-lg font-semibold">Favorites</h4>
      {favorites.length === 0 ? (
        <p className="text-gray-400">No favorite songs yet.</p>
      ) : (
        <div className="space-y-2">
          {favorites.map((song) => (
            <button
              key={song.id}
              onClick={() => onSongSelect(song)}
              className="flex items-center space-x-3 cursor-pointer hover:text-white mt-2"
            >
              <FaHeart size={20} className="text-red-500" />
              <span>{song.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
