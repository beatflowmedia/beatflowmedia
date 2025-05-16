// src/components/NavBar.jsx
import React, { memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import {
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
      className="bg-bf-page fixed top-0 inset-x-0 z-50 px-6 py-3 flex items-center text-bf-text"
    >
      {/* LEFT: Logo & Home */}
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={onHomeClick}
          aria-label="Go to Home"
          className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-bf-green rounded"
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
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-bf-subtext pointer-events-none" />
          <input
            type="text"
            placeholder="What do you want to play?"
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search for songs, artists, or albums"
            className="w-full pl-12 pr-4 py-2 rounded-full bg-bf-card text-bf-text placeholder-bf-subtext outline-none focus:ring-2 focus:ring-bf-green transition"
          />
        </div>
      </form>

      {/* RIGHT: Actions */}
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={onExplorePremium}
          aria-label="Explore Premium"
          className="bg-bf-blue text-white px-4 py-2 rounded-full flex items-center space-x-2 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-bf-green transition"
        >
          <FaCrown />
          <span>Explore Premium</span>
        </button>

        <button
          type="button"
          onClick={onDownloadClick}
          aria-label="Downloads"
          className="p-2 rounded hover:bg-bf-card focus:outline-none focus:ring-2 focus:ring-bf-green transition"
        >
          <FaDownload className="text-bf-subtext hover:text-bf-text" />
        </button>

        <button
          type="button"
          onClick={onWhatsNewClick}
          aria-label="Notifications"
          className={classNames(
            "p-2 rounded hover:bg-bf-card focus:outline-none focus:ring-2 focus:ring-bf-green transition",
            {
              "text-bf-green": isBellActive,
              "text-bf-subtext hover:text-bf-text": !isBellActive,
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
            className="bg-bf-red text-white px-4 py-2 rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-bf-red transition"
          >
            Sign Out
          </button>
        ) : (
          <button
            type="button"
            onClick={signInWithGoogle}
            aria-label="Sign In"
            className="bg-bf-green text-white px-4 py-2 rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-bf-green transition"
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
