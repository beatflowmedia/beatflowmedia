import React from "react";
import { FaBell, FaSearch, FaCrown, FaMusic } from "react-icons/fa";

const NavBar = ({
  onWhatsNewClick = () => {},
  isBellActive = false,
  onExplorePremium = () => {},
  onBrowseClick = () => {},
  onSearchChange = () => {},
}) => {
  return (
    <nav className="bg-gray-800 px-6 py-4 flex items-center justify-between fixed top-0 left-0 right-0 z-50 shadow-md">
      {/* Logo/Brand */}
      <div className="flex items-center space-x-2 text-white text-xl font-bold">
        <FaMusic />
        <span>BeatFlow</span>
      </div>

      {/* Center Search */}
      <div className="flex-1 mx-6">
        <input
          type="text"
          placeholder="Search for songs, artists..."
          className="w-full p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 outline-none"
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        {/* Browse */}
        <button
          onClick={onBrowseClick}
          className="text-gray-300 hover:text-white transition"
          title="Browse"
        >
          Browse
        </button>

        {/* Premium */}
        <button
          onClick={onExplorePremium}
          className="text-yellow-400 hover:text-yellow-300 transition flex items-center space-x-1"
          title="Explore Premium"
        >
          <FaCrown />
          <span>Premium</span>
        </button>

        {/* Notifications */}
        <button
          onClick={onWhatsNewClick}
          className={`text-gray-300 hover:text-white transition relative ${
            isBellActive ? "text-green-400" : ""
          }`}
          title="What's New"
        >
          <FaBell />
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
