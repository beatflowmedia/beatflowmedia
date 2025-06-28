// components/ContextMenu.js
import React from "react";

const ContextMenu = ({ visible, x, y, items = [], onClose }) => {
  if (!visible) return null;
  return (
    <div
      className="fixed z-50 bg-gray-800 text-white rounded shadow-lg py-2 min-w-[160px]"
      style={{ left: x, top: y }}
      onClick={onClose}
    >
      {items.map((item, idx) =>
        item.type === "divider" ? (
          <div key={idx} className="border-t border-gray-700 my-1" />
        ) : (
          <button
            key={idx}
            className="flex items-center px-4 py-2 w-full hover:bg-gray-700"
            onClick={() => {
              item.onClick && item.onClick();
              onClose();
            }}
          >
            <span className="mr-2">{item.icon}</span>
            {item.label}
          </button>
        )
      )}
    </div>
  );
};

export default ContextMenu;
