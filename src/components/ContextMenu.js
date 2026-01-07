// components/ContextMenu.js
import React, { useState, useRef, useEffect } from "react";

const ContextMenu = ({ visible, x, y, items = [], onClose }) => {
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside (race condition guard)
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    // Use timeout to prevent immediate close on right-click that opened menu
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <>
      <div
        ref={menuRef}
        className="fixed z-50 bg-gray-800 text-white rounded shadow-lg py-2 min-w-[160px]"
        style={{ left: x, top: y }}
        onClick={(e) => {
          // Only close if clicking the background, not menu items
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {items.map((item, idx) =>
          item.type === "divider" ? (
            <div key={idx} className="border-t border-gray-700 my-1" />
          ) : item.type === "search" ? (
            <div key={idx} className="px-2 py-2">
              <div className="flex items-center bg-gray-700 rounded px-2 py-1">
                <span className="text-gray-400 mr-2">{item.icon}</span>
                <input
                  type="text"
                  placeholder={item.placeholder || "Search..."}
                  className="bg-transparent text-white text-sm outline-none flex-1"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          ) : (
            <div
              key={idx}
              className="relative"
              onMouseEnter={() => item.submenu && setOpenSubmenuIndex(idx)}
              onMouseLeave={() => item.submenu && setOpenSubmenuIndex(null)}
            >
              <button
                className="flex items-center justify-between px-4 py-2 w-full hover:bg-gray-700 text-left"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!item.submenu) {
                    item.onClick && item.onClick();
                    onClose();
                  }
                }}
              >
                <span className="flex items-center">
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </span>
                {item.submenu && <span className="ml-4">►</span>}
              </button>

              {/* Recursive submenu */}
              {item.submenu && openSubmenuIndex === idx && (
                <div className="absolute left-full top-0 ml-1">
                  <div className="bg-gray-800 text-white rounded shadow-lg py-2 min-w-[200px] max-h-[400px] overflow-y-auto">
                    {item.submenu.map((subitem, subidx) =>
                      subitem.type === "divider" ? (
                        <div key={subidx} className="border-t border-gray-700 my-1" />
                      ) : subitem.type === "search" ? (
                        <div key={subidx} className="px-2 py-2">
                          <div className="flex items-center bg-gray-700 rounded px-2 py-1">
                            <span className="text-gray-400 mr-2">{subitem.icon}</span>
                            <input
                              type="text"
                              placeholder={subitem.placeholder || "Search..."}
                              className="bg-transparent text-white text-sm outline-none flex-1"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      ) : (
                        <button
                          key={subidx}
                          className="flex items-center px-4 py-2 w-full hover:bg-gray-700 text-left"
                          onClick={(e) => {
                            e.stopPropagation();
                            subitem.onClick && subitem.onClick();
                            onClose();
                          }}
                        >
                          <span className="mr-2">{subitem.icon}</span>
                          {subitem.label}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ),
        )}
      </div>
    </>
  );
};

export default ContextMenu;
