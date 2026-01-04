// src/components/NavBar.jsx
import { memo, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import classNames from "classnames";
import { FaSearch, FaDownload, FaBell, FaCrown, FaUser, FaCog, FaSignOutAlt } from "react-icons/fa";
import { MdLibraryMusic } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import { useModal } from "../hooks/useModal";
import PropTypes from 'prop-types';

const NavBar = ({
  onHomeClick,
  onSearchChange,
  onExplorePremium,
  onWhatsNewClick,
  isBellActive
}) => {
  const { user, signInWithGoogle, signOutUser } = useAuth();
  const navigate = useNavigate();
  const { hasSubscription, loading: subscriptionLoading } = useSubscription(user);
  const { showAlert } = useModal();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleManageSubscription = async () => {
    if (!user) return;

    try {
      const response = await fetch('/.netlify/functions/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      await showAlert('Subscription Management Error', 'Failed to open subscription management. Please try again.', 'error');
    }
  };

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="px-6 flex items-center text-bf-text bg-black border-b border-gray-800"
    >
      {/* LEFT: Logo & Home */}
      <div className="flex items-center space-x-4">
        <Link
          to="/"
          aria-label="Go to Home"
          className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-bf-green rounded"
        >
          <img
            src="/images/Logo.svg"
            alt="BeatFlow Logo"
            className="h-8 w-auto"
          />
          <span className="sr-only">BeatFlow Home</span>
        </Link>
      </div>

      {/* CENTER: Search & Browse */}
      <div className="flex-1 mx-6 flex items-center gap-3">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex-1"
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

        <button
          type="button"
          onClick={() => navigate('/browse')}
          aria-label="Browse music"
          className="p-2 rounded hover:bg-bf-card focus:outline-none focus:ring-2 focus:ring-bf-green transition"
          title="Browse"
        >
          <MdLibraryMusic className="text-bf-subtext hover:text-bf-text text-xl" />
        </button>
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={hasSubscription ? handleManageSubscription : onExplorePremium}
          aria-label={hasSubscription ? "Manage Subscription" : "Get BeatFlow Premium"}
          disabled={subscriptionLoading}
          className="bg-bf-blue text-white px-4 py-2 rounded-full flex items-center space-x-2 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-bf-green transition disabled:opacity-50"
        >
          <FaCrown />
          <span>{subscriptionLoading ? "Loading..." : hasSubscription ? "Manage Subscription" : "Get BeatFlow Premium"}</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/downloads')}
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
              "text-bf-subtext hover:text-bf-text": !isBellActive
            },
          )}
        >
          <FaBell />
        </button>

        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="User Menu"
              className="flex items-center space-x-2 p-2 rounded-full hover:bg-bf-card focus:outline-none focus:ring-2 focus:ring-bf-green transition"
            >
              <img
                src={user.photoURL || '/default-avatar.png'}
                alt={user.displayName || 'User'}
                className="w-8 h-8 rounded-full"
              />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-bf-card border border-gray-700 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-gray-700">
                  <p className="text-white font-semibold truncate">{user.displayName}</p>
                  <p className="text-bf-subtext text-sm truncate">{user.email}</p>
                </div>
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <FaUser />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/downloads');
                    }}
                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <FaDownload />
                    <span>Downloads</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <FaCog />
                    <span>Settings</span>
                  </button>
                  {hasSubscription && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleManageSubscription();
                      }}
                      className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <FaCrown />
                      <span>Manage Subscription</span>
                    </button>
                  )}
                  <div className="border-t border-gray-700 my-2"></div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      signOutUser();
                    }}
                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <FaSignOutAlt />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
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
  onWhatsNewClick: PropTypes.func,
  isBellActive: PropTypes.bool
};

NavBar.defaultProps = {
  onHomeClick: () => {},
  onSearchChange: () => {},
  onExplorePremium: () => {},
  onWhatsNewClick: () => {},
  isBellActive: false
};

export default memo(NavBar);
