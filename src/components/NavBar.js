// NavBar.js
import React, { useState, useRef, useEffect } from "react";
import {
  FaHome,
  FaBell,
  FaDownload,
  FaSearch,
  FaUser,
  FaSignOutAlt,
  FaCog,
  FaExternalLinkAlt,
  FaCompass,
} from "react-icons/fa";
import SearchResults from "./SearchResults";
import useClickOutside from "../hooks/useClickOutside";
import { useAuth } from "../context/AuthContext";

const NavBar = ({
  onWhatsNewClick,
  isBellActive,
  onExplorePremium,
  onBrowseClick,
  onSearchChange,
  musicData = [],
  playlists = [],
}) => {

  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();
  const searchResultsRef = useRef();

  const { user, signInWithGoogle, signOutUser } = useAuth();

  useClickOutside(menuRef, () => setMenuOpen(false));
  useClickOutside(searchResultsRef, () => setShowResults(false));

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearchChange(query);
    setShowResults(!!query.trim());
  };

  useEffect(() => {
    if (!searchQuery.trim()) setShowResults(false);
  }, [searchQuery]);

  const avatarContent = () => {
    if (user && user.photoURL) {
      return <img src={user.photoURL} alt="User Avatar" className="w-full h-full object-cover rounded-full" />;
    }
    if (user && user.displayName) {
      return user.displayName[0].toUpperCase();
    }
    return "BFM";
  };

  return (
    <nav className="bg-black text-white flex items-center justify-between px-6 py-3 fixed top-0 left-0 w-full z-50">
      <div className="flex items-center gap-4">
        <button className="bg-black rounded-full p-2" onClick={() => window.location.reload()}>
          <img src="/images/Logo.svg" alt="Logo" className="w-auto h-10" />
        </button>
        <button className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full" onClick={() => window.location.reload()}>
          <FaHome size={30} />
        </button>
      </div>

      <div className="relative flex-1 max-w-lg flex items-center gap-3">
        <button className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full" onClick={onBrowseClick}>
          <FaCompass size={24} className="text-gray-400" />
        </button>

        <div className="relative flex items-center bg-gray-800 px-4 py-2 rounded-full w-full">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="What do you want to play?"
            className="bg-transparent text-white outline-none px-2 flex-1"
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => {
              if (searchQuery.trim()) setShowResults(true);
            }}
          />
          {showResults && (
            <div ref={searchResultsRef} className="absolute top-full left-0 right-0 z-50 mt-2">
              <SearchResults query={searchQuery} onClose={() => setShowResults(false)} />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={() => onExplorePremium && onExplorePremium()}
          className="bg-white text-black font-semibold px-4 py-2 rounded-full hover:bg-gray-200"
        >
          Explore Premium
        </button>
        <FaDownload className="text-gray-400 hover:text-white cursor-pointer" size={20} />
        <button onClick={onWhatsNewClick} className="relative">
          <FaBell
            className={`cursor-pointer transition-colors ${
              isBellActive ? "text-white" : "text-gray-400 hover:text-white"
            }`}
            size={20}
          />
        </button>

        {!user && (
          <button
            onClick={signInWithGoogle}
            className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600"
          >
            Sign In
          </button>
        )}

        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 bg-orange-500 text-white flex items-center justify-center rounded-full overflow-hidden hover:bg-orange-600"
            >
              {avatarContent()}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-900 shadow-lg rounded-lg py-2 border border-gray-700 z-50">
                <MenuItem title="Account" link="#" icon={<FaUser />} />
                <MenuItem title="Profile" link="#" icon={<FaUser />} />
                <MenuItem title="Upgrade to Premium" link="/upgrade-now" icon={<FaExternalLinkAlt />} external />
                <MenuItem title="Support" link="#" icon={<FaExternalLinkAlt />} external />
                <MenuItem title="Download" link="#" icon={<FaExternalLinkAlt />} external />
                <MenuItem title="Settings" link="#" icon={<FaCog />} />
                <MenuItem title="Log out" onClick={signOutUser} icon={<FaSignOutAlt />} danger />
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

const MenuItem = ({ title, link, icon, external, danger, onClick }) => {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-md ${
          danger ? "text-red-400 hover:text-red-500" : ""
        }`}
      >
        <span className="mr-3">{icon}</span> {title}
      </button>
    );
  }
  return (
    <a
      href={link}
      target={external ? "_blank" : "_self"}
      rel="noopener noreferrer"
      className={`flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-md ${
        danger ? "text-red-400 hover:text-red-500" : ""
      }`}
    >
      <span className="mr-3">{icon}</span> {title}
      {external && <FaExternalLinkAlt className="ml-auto text-xs opacity-50" />}
    </a>
  );
};

export default NavBar;
