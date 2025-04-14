// UserProfileMenu.js
// ------------------------------------------------------
// A standalone user profile dropdown menu example, similar to what's in NavBar.
// If you're not using this file, remove it or integrate it as needed.
// ------------------------------------------------------
import React, { useState, useRef, useEffect } from "react";
import { FaUser, FaSignOutAlt, FaCog, FaExternalLinkAlt } from "react-icons/fa";

const UserProfileMenu = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      {/* User Avatar */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="w-10 h-10 bg-orange-500 text-white flex items-center justify-center rounded-full hover:bg-orange-600"
      >
        T
      </button>

      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-56 bg-gray-900 shadow-lg rounded-lg py-2 border border-gray-700 z-50"
        >
          <MenuItem title="Account" link="#" icon={<FaUser />} />
          <MenuItem title="Profile" link="#" icon={<FaUser />} />
          <MenuItem title="Upgrade to Premium" link="#" icon={<FaExternalLinkAlt />} external />
          <MenuItem title="Support" link="#" icon={<FaExternalLinkAlt />} external />
          <MenuItem title="Download" link="#" icon={<FaExternalLinkAlt />} external />
          <MenuItem title="Settings" link="#" icon={<FaCog />} />
          <MenuItem title="Log out" link="#" icon={<FaSignOutAlt />} danger />
        </div>
      )}
    </div>
  );
};

// Reusable menu item
const MenuItem = ({ title, link, icon, external, danger }) => (
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

export default UserProfileMenu;
