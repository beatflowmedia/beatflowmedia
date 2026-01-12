// src/components/NavBar.jsx
import { memo, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import classNames from "classnames";
import { FaSearch, FaDownload, FaBell, FaCrown, FaUser, FaCog, FaSignOutAlt, FaBars, FaTimes, FaCompass } from "react-icons/fa";
import { MdLibraryMusic } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import { useModal } from "../hooks/useModal";
import PropTypes from 'prop-types';

// Shared responsive styles using DRY principle
const styles = {
  // Spacing
  navPadding: {
    padding: 'clamp(0.5rem, calc(0.375rem + 0.5vw), 0.75rem) clamp(0.75rem, calc(0.5rem + 1vw), 1.5rem)'
  },
  logoHeight: {
    height: 'clamp(28px, calc(1.5rem + 0.5vw), 36px)'
  },
  gapSmall: {
    gap: 'clamp(0.25rem, calc(0.125rem + 0.3vw), 0.5rem)'
  },
  gapMedium: {
    gap: 'clamp(0.5rem, calc(0.25rem + 0.5vw), 0.75rem)'
  },
  gapLarge: {
    gap: 'clamp(0.75rem, calc(0.5rem + 0.5vw), 1rem)'
  },

  // Buttons
  iconButton: {
    minWidth: 'clamp(36px, calc(2rem + 0.5vw), 44px)',
    minHeight: 'clamp(36px, calc(2rem + 0.5vw), 44px)',
    padding: 'clamp(0.5rem, calc(0.375rem + 0.3vw), 0.75rem)'
  },
  primaryButton: {
    paddingLeft: 'clamp(0.75rem, calc(0.5rem + 0.5vw), 1rem)',
    paddingRight: 'clamp(0.75rem, calc(0.5rem + 0.5vw), 1rem)',
    paddingTop: 'clamp(0.5rem, calc(0.375rem + 0.3vw), 0.75rem)',
    paddingBottom: 'clamp(0.5rem, calc(0.375rem + 0.3vw), 0.75rem)',
    fontSize: 'clamp(0.75rem, calc(0.7rem + 0.2vw), 0.875rem)',
    minHeight: 'clamp(36px, calc(2rem + 0.5vw), 44px)'
  },

  // Icons
  iconSmall: {
    fontSize: 'clamp(14px, calc(0.875rem + 0.2vw), 16px)'
  },
  iconMedium: {
    fontSize: 'clamp(16px, calc(1rem + 0.3vw), 20px)'
  },

  // Search
  searchInput: {
    paddingLeft: 'clamp(2.25rem, calc(2rem + 0.5vw), 2.5rem)',
    paddingRight: 'clamp(0.5rem, calc(0.375rem + 0.3vw), 0.75rem)',
    paddingTop: 'clamp(0.375rem, calc(0.25rem + 0.3vw), 0.5rem)',
    paddingBottom: 'clamp(0.375rem, calc(0.25rem + 0.3vw), 0.5rem)',
    fontSize: 'clamp(0.75rem, calc(0.7rem + 0.2vw), 0.875rem)'
  },
  searchIcon: {
    fontSize: 'clamp(12px, calc(0.75rem + 0.2vw), 14px)'
  },

  // User menu
  avatar: {
    width: 'clamp(28px, calc(1.5rem + 0.5vw), 36px)',
    height: 'clamp(28px, calc(1.5rem + 0.5vw), 36px)'
  },
  dropdown: {
    marginTop: 'clamp(0.5rem, calc(0.375rem + 0.3vw), 0.75rem)',
    width: 'clamp(200px, calc(12rem + 2vw), 224px)',
    minWidth: '200px'
  },
  dropdownHeader: {
    padding: 'clamp(0.625rem, calc(0.5rem + 0.3vw), 0.75rem)'
  },
  menuItem: {
    paddingLeft: 'clamp(0.75rem, calc(0.5rem + 0.5vw), 1rem)',
    paddingRight: 'clamp(0.75rem, calc(0.5rem + 0.5vw), 1rem)',
    paddingTop: 'clamp(0.5rem, calc(0.375rem + 0.3vw), 0.75rem)',
    paddingBottom: 'clamp(0.5rem, calc(0.375rem + 0.3vw), 0.75rem)',
    fontSize: 'clamp(0.875rem, calc(0.75rem + 0.3vw), 1rem)'
  }
};

const NavBar = ({
  onHomeClick,
  onSearchChange,
  onExplorePremium,
  onWhatsNewClick,
  isBellActive,
  onMobileMenuToggle,
  isMobileMenuOpen
}) => {
  const { user, signInWithGoogle, signOutUser } = useAuth();
  const navigate = useNavigate();
  const { hasSubscription, loading: subscriptionLoading } = useSubscription(user);
  const { showAlert } = useModal();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    };

    if (showUserMenu || showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showMobileMenu]);

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
      className="flex items-center text-bf-text bg-black border-b border-gray-800"
      style={styles.navPadding}
    >
      {/* LEFT: Sidebar Toggle (Mobile) + Logo */}
      <div className="flex items-center" style={styles.gapMedium}>
        {/* Sidebar Toggle Button - Mobile only - toggles library sidebar */}
        <button
          type="button"
          onClick={onMobileMenuToggle}
          aria-label="Toggle Library"
          className="md:hidden rounded hover:bg-bf-card focus:outline-none focus:ring-2 focus:ring-bf-green transition"
          style={styles.iconButton}
        >
          {isMobileMenuOpen ? (
            <FaTimes className="text-bf-text" style={styles.iconMedium} />
          ) : (
            <MdLibraryMusic className="text-bf-text" style={styles.iconMedium} />
          )}
        </button>

        <Link
          to="/"
          aria-label="Go to Home"
          className="flex items-center focus:outline-none focus:ring-2 focus:ring-bf-green rounded"
        >
          <img
            src="/images/Logo1.svg"
            alt="BeatFlow Logo"
            className="w-auto"
            style={styles.logoHeight}
            width="120"
            height="36"
          />
          <span className="sr-only">BeatFlow Home</span>
        </Link>
      </div>

      {/* CENTER: Search - Hidden on mobile */}
      <div className="hidden md:flex flex-1 items-center mx-2 sm:mx-4">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex-1 max-w-2xl"
          role="search"
          aria-label="Site search"
        >
          <div className="relative">
            <FaSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-bf-subtext pointer-events-none"
              style={styles.searchIcon}
            />
            <input
              type="text"
              placeholder="Search..."
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search for songs, artists, or albums"
              className="w-full rounded-full bg-bf-card text-bf-text placeholder-bf-subtext outline-none focus:ring-2 focus:ring-bf-green transition"
              style={styles.searchInput}
            />
          </div>
        </form>
      </div>

      {/* Spacer for mobile */}
      <div className="flex-1 md:hidden"></div>

      {/* RIGHT: Actions */}
      <div className="flex items-center" style={styles.gapSmall}>
        {/* Browse button - hidden on mobile */}
        <button
          type="button"
          onClick={() => navigate('/browse')}
          aria-label="Browse music"
          className="hidden md:flex rounded hover:bg-bf-card focus:outline-none focus:ring-2 focus:ring-bf-green transition"
          title="Browse"
          style={styles.iconButton}
        >
          <MdLibraryMusic
            className="text-bf-subtext hover:text-bf-text"
            style={styles.iconMedium}
          />
        </button>

        {/* Discover Weekly button - hidden on mobile */}
        <button
          type="button"
          onClick={() => navigate('/discover-weekly')}
          aria-label="Discover Weekly"
          className="hidden md:flex rounded hover:bg-bf-card focus:outline-none focus:ring-2 focus:ring-bf-green transition"
          title="Discover Weekly"
          style={styles.iconButton}
        >
          <FaCompass
            className="text-bf-subtext hover:text-bf-text"
            style={styles.iconMedium}
          />
        </button>

        {/* Premium button - hidden on mobile */}
        <button
          type="button"
          onClick={hasSubscription ? handleManageSubscription : onExplorePremium}
          aria-label={hasSubscription ? "Manage Subscription" : "Get BeatFlow Premium"}
          disabled={subscriptionLoading}
          className="hidden md:flex bg-bf-blue text-white rounded-full items-center justify-center hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-bf-green transition disabled:opacity-50"
          style={styles.primaryButton}
        >
          <span className="flex items-center" style={styles.gapSmall}>
            <FaCrown style={styles.iconSmall} />
            <span className="whitespace-nowrap">
              {subscriptionLoading ? "Loading..." : hasSubscription ? "Manage" : "Premium"}
            </span>
          </span>
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={onWhatsNewClick}
          aria-label="Notifications"
          className={classNames(
            "rounded hover:bg-bf-card focus:outline-none focus:ring-2 focus:ring-bf-green transition",
            {
              "text-bf-green": isBellActive,
              "text-bf-subtext hover:text-bf-text": !isBellActive
            },
          )}
          style={styles.iconButton}
        >
          <FaBell style={styles.iconMedium} />
        </button>

        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="User Menu"
              className="flex items-center rounded-full hover:bg-bf-card focus:outline-none focus:ring-2 focus:ring-bf-green transition"
              style={{
                padding: 'clamp(0.125rem, calc(0.0625rem + 0.2vw), 0.25rem)'
              }}
            >
              <img
                src={user.photoURL || '/default-avatar.png'}
                alt={user.displayName || 'User'}
                className="rounded-full"
                style={styles.avatar}
              />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div
                className="absolute right-0 bg-bf-card border border-gray-700 rounded-lg shadow-lg z-50"
                style={styles.dropdown}
              >
                <div
                  className="border-b border-gray-700"
                  style={styles.dropdownHeader}
                >
                  <p
                    className="text-white font-semibold truncate"
                    style={{ fontSize: 'clamp(0.875rem, calc(0.75rem + 0.3vw), 1rem)' }}
                  >{user.displayName}</p>
                  <p
                    className="text-bf-subtext truncate"
                    style={{ fontSize: 'clamp(0.75rem, calc(0.7rem + 0.2vw), 0.875rem)' }}
                  >{user.email}</p>
                </div>
                <div style={{ paddingTop: 'clamp(0.375rem, calc(0.25rem + 0.3vw), 0.5rem)', paddingBottom: 'clamp(0.375rem, calc(0.25rem + 0.3vw), 0.5rem)' }}>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full text-left text-white hover:bg-gray-700 flex items-center"
                    style={{ ...styles.menuItem, ...styles.gapSmall }}
                  >
                    <FaUser style={styles.iconSmall} />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/downloads');
                    }}
                    className="w-full text-left text-white hover:bg-gray-700 flex items-center"
                    style={{ ...styles.menuItem, ...styles.gapSmall }}
                  >
                    <FaDownload style={styles.iconSmall} />
                    <span>Downloads</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left text-white hover:bg-gray-700 flex items-center"
                    style={{ ...styles.menuItem, ...styles.gapSmall }}
                  >
                    <FaCog style={styles.iconSmall} />
                    <span>Settings</span>
                  </button>
                  {hasSubscription && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleManageSubscription();
                      }}
                      className="w-full text-left text-white hover:bg-gray-700 flex items-center"
                      style={{ ...styles.menuItem, ...styles.gapSmall }}
                    >
                      <FaCrown style={styles.iconSmall} />
                      <span>Manage Subscription</span>
                    </button>
                  )}
                  <div
                    className="border-t border-gray-700"
                    style={{ marginTop: 'clamp(0.375rem, calc(0.25rem + 0.3vw), 0.5rem)', marginBottom: 'clamp(0.375rem, calc(0.25rem + 0.3vw), 0.5rem)' }}
                  ></div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      signOutUser();
                    }}
                    className="w-full text-left text-red-400 hover:bg-gray-700 flex items-center"
                    style={{ ...styles.menuItem, ...styles.gapSmall }}
                  >
                    <FaSignOutAlt style={styles.iconSmall} />
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
            className="bg-bf-green text-white rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-bf-green transition whitespace-nowrap hidden md:block"
            style={styles.primaryButton}
          >
            Sign In
          </button>
        )}
      </div>

      {/* Mobile Slide-out Menu */}
      {showMobileMenu && (
        <div
          ref={mobileMenuRef}
          className="fixed top-0 left-0 h-full bg-bf-card border-r border-gray-700 shadow-2xl z-50 md:hidden overflow-y-auto"
          style={{
            width: 'clamp(280px, 80vw, 320px)',
            paddingTop: 'clamp(1rem, calc(0.75rem + 0.5vw), 1.5rem)',
            paddingBottom: 'clamp(1rem, calc(0.75rem + 0.5vw), 1.5rem)'
          }}
        >
          {/* Menu Header */}
          <div className="flex items-center justify-between px-4 mb-6">
            <img
              src="/images/Logo1.svg"
              alt="BeatFlow Logo"
              className="w-auto"
              style={{ height: 'clamp(32px, calc(1.75rem + 0.5vw), 40px)' }}
              width="128"
              height="40"
            />
            <button
              onClick={() => setShowMobileMenu(false)}
              className="rounded hover:bg-gray-700 p-2"
              aria-label="Close menu"
            >
              <FaTimes className="text-bf-text" style={styles.iconMedium} />
            </button>
          </div>

          {/* User Info (if logged in) */}
          {user && (
            <div className="px-4 py-3 mb-2 bg-gray-800 border-y border-gray-700">
              <div className="flex items-center" style={styles.gapMedium}>
                <img
                  src={user.photoURL || '/default-avatar.png'}
                  alt={user.displayName || 'User'}
                  className="rounded-full"
                  style={{ width: '48px', height: '48px' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate text-sm">{user.displayName}</p>
                  <p className="text-bf-subtext truncate text-xs">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Search in mobile menu */}
          <div className="px-4 mb-4">
            <form
              onSubmit={(e) => e.preventDefault()}
              role="search"
              aria-label="Site search"
            >
              <div className="relative">
                <FaSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-bf-subtext pointer-events-none"
                  style={styles.searchIcon}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  onChange={(e) => onSearchChange(e.target.value)}
                  aria-label="Search for songs, artists, or albums"
                  className="w-full rounded-full bg-gray-800 text-bf-text placeholder-bf-subtext outline-none focus:ring-2 focus:ring-bf-green transition"
                  style={styles.searchInput}
                />
              </div>
            </form>
          </div>

          {/* Menu Items */}
          <div className="flex flex-col">
            <button
              onClick={() => {
                setShowMobileMenu(false);
                navigate('/browse');
              }}
              className="w-full text-left text-white hover:bg-gray-700 flex items-center px-4 py-3"
            >
              <MdLibraryMusic className="mr-3" style={styles.iconMedium} />
              <span style={{ fontSize: 'clamp(0.875rem, calc(0.8rem + 0.2vw), 1rem)' }}>Browse Music</span>
            </button>

            <button
              onClick={() => {
                setShowMobileMenu(false);
                navigate('/discover-weekly');
              }}
              className="w-full text-left text-white hover:bg-gray-700 flex items-center px-4 py-3"
            >
              <FaCompass className="mr-3" style={styles.iconMedium} />
              <span style={{ fontSize: 'clamp(0.875rem, calc(0.8rem + 0.2vw), 1rem)' }}>Discover Weekly</span>
            </button>

            {user && (
              <>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    navigate('/profile');
                  }}
                  className="w-full text-left text-white hover:bg-gray-700 flex items-center px-4 py-3"
                >
                  <FaUser className="mr-3" style={styles.iconSmall} />
                  <span style={{ fontSize: 'clamp(0.875rem, calc(0.8rem + 0.2vw), 1rem)' }}>Profile</span>
                </button>

                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    navigate('/downloads');
                  }}
                  className="w-full text-left text-white hover:bg-gray-700 flex items-center px-4 py-3"
                >
                  <FaDownload className="mr-3" style={styles.iconSmall} />
                  <span style={{ fontSize: 'clamp(0.875rem, calc(0.8rem + 0.2vw), 1rem)' }}>Downloads</span>
                </button>

                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left text-white hover:bg-gray-700 flex items-center px-4 py-3"
                >
                  <FaCog className="mr-3" style={styles.iconSmall} />
                  <span style={{ fontSize: 'clamp(0.875rem, calc(0.8rem + 0.2vw), 1rem)' }}>Settings</span>
                </button>
              </>
            )}

            <div className="border-t border-gray-700 my-2"></div>

            {/* Premium/Subscription */}
            <button
              onClick={() => {
                setShowMobileMenu(false);
                if (hasSubscription) {
                  handleManageSubscription();
                } else {
                  onExplorePremium();
                }
              }}
              disabled={subscriptionLoading}
              className="w-full text-left flex items-center px-4 py-3 bg-bf-blue hover:opacity-90 text-white disabled:opacity-50"
            >
              <FaCrown className="mr-3" style={styles.iconSmall} />
              <span style={{ fontSize: 'clamp(0.875rem, calc(0.8rem + 0.2vw), 1rem)' }}>
                {subscriptionLoading ? "Loading..." : hasSubscription ? "Manage Subscription" : "Get Premium"}
              </span>
            </button>

            {user ? (
              <>
                <div className="border-t border-gray-700 my-2"></div>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    signOutUser();
                  }}
                  className="w-full text-left text-red-400 hover:bg-gray-700 flex items-center px-4 py-3"
                >
                  <FaSignOutAlt className="mr-3" style={styles.iconSmall} />
                  <span style={{ fontSize: 'clamp(0.875rem, calc(0.8rem + 0.2vw), 1rem)' }}>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <div className="border-t border-gray-700 my-2"></div>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    signInWithGoogle();
                  }}
                  className="w-full text-left bg-bf-green hover:opacity-90 text-white flex items-center px-4 py-3"
                >
                  <FaUser className="mr-3" style={styles.iconSmall} />
                  <span style={{ fontSize: 'clamp(0.875rem, calc(0.8rem + 0.2vw), 1rem)' }}>Sign In</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Overlay for mobile menu */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setShowMobileMenu(false)}
        ></div>
      )}
    </nav>
  );
};

NavBar.propTypes = {
  onHomeClick: PropTypes.func,
  onSearchChange: PropTypes.func,
  onExplorePremium: PropTypes.func,
  onWhatsNewClick: PropTypes.func,
  isBellActive: PropTypes.bool,
  onMobileMenuToggle: PropTypes.func,
  isMobileMenuOpen: PropTypes.bool
};

NavBar.defaultProps = {
  onHomeClick: () => {},
  onSearchChange: () => {},
  onExplorePremium: () => {},
  onWhatsNewClick: () => {},
  isBellActive: false,
  onMobileMenuToggle: () => {},
  isMobileMenuOpen: false
};

export default memo(NavBar);
