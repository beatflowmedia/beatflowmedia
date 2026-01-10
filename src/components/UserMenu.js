import { useState, useRef, useEffect } from "react";
import {
  FaHome,
  FaBell,
  FaDownload,
  FaSearch,
  FaCompass,
  FaBars
} from "react-icons/fa";
import SearchResults from "./SearchResults";
import useClickOutside from "../hooks/useClickOutside";
import { useAuth } from "../context/AuthContext";
import UserMenu from "./UserMenu";

const NavBar = ({
  onWhatsNewClick,
  isBellActive,
  onExplorePremium,
  onBrowseClick,
  onSearchChange,
  toggleSidebar
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const searchResultsRef = useRef();
  const contextRef = useRef();

  const { user, signInWithGoogle, signOutUser } = useAuth();

  useClickOutside(searchResultsRef, () => setShowResults(false));
  useClickOutside(contextRef, () => setIsContextOpen(false));

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearchChange(query);
    setShowResults(!!query.trim());
  };

  useEffect(() => {
    if (!searchQuery.trim()) setShowResults(false);
  }, [searchQuery]);

  return (
    <nav className="bg-black text-white flex items-center justify-between px-4 sm:px-6 py-3 fixed top-0 left-0 w-full z-50 shadow">
      {/* Left Section */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          className="p-2 rounded-full bg-black hover:bg-gray-900"
          onClick={() => window.location.reload()}
          aria-label="Reload Home"
        >
          <img
            src="/images/Logo1.svg"
            alt="BeatFlow Logo"
            className="h-10 w-auto"
            width="120"
            height="40"
          />
        </button>
        <button
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition"
          onClick={() => window.location.reload()}
          aria-label="Home"
        >
          <FaHome size={20} />
        </button>
        <button
          className="p-2 sm:hidden rounded-full bg-gray-800 hover:bg-gray-700"
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <FaBars size={18} />
        </button>
      </div>

      {/* Center Section */}
      <div className="flex-1 max-w-lg w-full px-2">
        <div className="relative flex items-center bg-gray-800 px-4 py-2 rounded-full">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="What do you want to play?"
            className="bg-transparent text-white outline-none px-2 flex-1 text-sm"
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => {
              if (searchQuery.trim()) setShowResults(true);
            }}
            aria-label="Search Music"
          />
          {showResults && (
            <div
              ref={searchResultsRef}
              className="absolute top-full left-0 right-0 z-50 mt-2"
            >
              <SearchResults
                query={searchQuery}
                onClose={() => setShowResults(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 sm:gap-4" ref={contextRef}>
        {/* Show only on larger screens */}
        <button
          onClick={() => onExplorePremium?.()}
          className="hidden lg:inline-block bg-white text-black font-semibold px-4 py-2 rounded-full text-sm hover:bg-gray-200 transition"
          aria-label="Get BeatFlow Premium"
        >
          Get BeatFlow Premium
        </button>

        <button
          className="text-gray-400 hover:text-white transition"
          aria-label="Download App"
        >
          <FaDownload size={18} />
        </button>

        <button
          onClick={onWhatsNewClick}
          className="relative text-gray-400 hover:text-white transition"
          aria-label="What's New Notifications"
        >
          <FaBell size={18} className={isBellActive ? "text-white" : ""} />
        </button>

        {!user ? (
          <button
            onClick={signInWithGoogle}
            className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm hover:bg-orange-600 transition"
            aria-label="Sign In"
          >
            Sign In
          </button>
        ) : (
          <div className="relative z-50">
            <UserMenu
              user={user}
              onExplorePremium={onExplorePremium}
              signOutUser={signOutUser}
            />
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
