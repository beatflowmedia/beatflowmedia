// src/components/NavBar.jsx
import React, { memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import {
  FaHome,
  FaSearch,
  FaDownload,
  FaBell,
  FaCrown,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const NavBar = ({
  onHomeClick,
  onSearchChange,
  onExplorePremium,
  onDownloadClick,
  onWhatsNewClick,
  isBellActive,
}) => {
  const { user, signInWithGoogle, signOutUser } = useAuth();

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="bg-black fixed top-0 inset-x-0 z-50 px-6 py-3 flex items-center"
    >
      {/* LEFT: Logo & Home */}
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={onHomeClick}
          aria-label="Go to Home"
          className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded"
        >
          <img
            src="/images/Logo.svg"
            alt="BeatFlow Logo"
            className="h-8 w-auto"
          />
          <span className="sr-only">BeatFlow Home</span>
        </button>
      </div>

      {/* CENTER: Search */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex-1 mx-6"
        role="search"
        aria-label="Site search"
      >
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="What do you want to play?"
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search for songs, artists, or albums"
            className="w-full pl-12 pr-4 py-2 rounded-full bg-gray-900 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-yellow-400 transition"
          />
        </div>
      </form>

      {/* RIGHT: Actions */}
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={onExplorePremium}
          aria-label="Explore Premium"
          className="bg-white text-black px-4 py-2 rounded-full flex items-center space-x-2 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
        >
          <FaCrown />
          <span>Explore Premium</span>
        </button>

        <button
          type="button"
          onClick={onDownloadClick}
          aria-label="Downloads"
          className="p-2 rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
        >
          <FaDownload className="text-gray-400 hover:text-white" />
        </button>

        <button
          type="button"
          onClick={onWhatsNewClick}
          aria-label="Notifications"
          className={classNames(
            "p-2 rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition",
            {
              "text-green-400": isBellActive,
              "text-gray-400 hover:text-white": !isBellActive,
            }
          )}
        >
          <FaBell />
        </button>

        {user ? (
          <button
            type="button"
            onClick={signOutUser}
            aria-label="Sign Out"
            className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
          >
            Sign Out
          </button>
        ) : (
          <button
            type="button"
            onClick={signInWithGoogle}
            aria-label="Sign In"
            className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};

NavBar.propTypes = {
  onHomeClick: PropTypes.func,
  onSearchChange: PropTypes.func,
  onExplorePremium: PropTypes.func,
  onDownloadClick: PropTypes.func,
  onWhatsNewClick: PropTypes.func,
  isBellActive: PropTypes.bool,
};

NavBar.defaultProps = {
  onHomeClick: () => {},
  onSearchChange: () => {},
  onExplorePremium: () => {},
  onDownloadClick: () => {},
  onWhatsNewClick: () => {},
  isBellActive: false,
};

export default memo(NavBar);
