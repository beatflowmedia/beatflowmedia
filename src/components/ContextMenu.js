// components/ContextMenu.js
import React, { useState, useRef } from "react";

const ContextMenu = ({ visible, x, y, items = [], onClose }) => {
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState(null);
  const menuRef = useRef(null);

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
                <div
                  className="absolute left-full top-0 ml-1"
                  style={{ minWidth: '160px' }}
                >
                  <ContextMenu
                    visible={true}
                    x={0}
                    y={0}
                    items={item.submenu}
                    onClose={onClose}
                  />
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
