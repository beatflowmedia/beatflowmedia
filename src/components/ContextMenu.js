import React from "react";

const ContextMenu = ({ visible, x, y, items = [], onClose }) => {
  if (!visible) return null;

  return (
    <div
      className="fixed z-50 bg-gray-800 text-white text-sm rounded-md shadow-lg min-w-[200px] overflow-hidden"
      style={{ top: y, left: x }}
      onClick={onClose}
    >
      <ul className="py-1">
        {items.map((item, index) => {
          if (item.type === "divider") {
            return <hr key={`divider-${index}`} className="border-gray-700 my-1" />;
          }

          if (item.submenu) {
            return (
              <li
                key={index}
                className="flex justify-between items-center px-4 py-2 hover:bg-gray-700 cursor-pointer group relative"
              >
                <div className="flex items-center space-x-2">
                  {item.icon && <span className="text-lg">{item.icon}</span>}
                  <span>{item.label}</span>
                </div>
                <span className="ml-auto text-gray-400 group-hover:text-white">▶</span>

                {/* Submenu container */}
                <ul className="absolute left-full top-0 ml-1 bg-gray-800 rounded-md shadow-lg py-1 w-40 hidden group-hover:block z-50">
                  {item.submenu.map((subItem, subIndex) => (
                    <li
                      key={subIndex}
                      onClick={(e) => {
                        e.stopPropagation();
                        subItem.onClick();
                        onClose();
                      }}
                      className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                    >
                      {subItem.label}
                    </li>
                  ))}
                </ul>
              </li>
            );
          }

          return (
            <li
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
                onClose();
              }}
              className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-700 cursor-pointer"
            >
              {item.icon && <span className="text-lg">{item.icon}</span>}
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ContextMenu;
