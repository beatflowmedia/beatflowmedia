import React, { useState, useRef } from "react";
import ContextMenu from "./ContextMenu";

const RightPanel = ({ visible, artistInfo, onClose }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const menuButtonRef = useRef(null);

  if (!visible || !artistInfo) return null;

  const {
    name,
    cover,
    monthlyListeners,
    biography,
    credits = [],
    onTour = [],
    nextInQueue,
    videoSrc,
    videoPoster,
  } = artistInfo;

  const menuItems = [
    {
      icon: "➕",
      label: "Add to playlist",
      submenu: [
        { label: "Playlist 1", onClick: () => console.log("Add to Playlist 1") },
        { label: "Playlist 2", onClick: () => console.log("Add to Playlist 2") },
      ],
    },
    {
      icon: "➕",
      label: "Save to your Liked Songs",
      onClick: () => console.log("Saved to Liked Songs"),
    },
    {
      icon: "➕",
      label: "Add to queue",
      onClick: () => console.log("Added to queue"),
    },
    { type: "divider" },
    {
      icon: "📡",
      label: "Go to song radio",
      onClick: () => console.log("Go to song radio"),
    },
    {
      icon: "👤",
      label: "Go to artist",
      submenu: [
        { label: "Main Artist", onClick: () => console.log("Go to artist") },
        { label: "Featured Artist", onClick: () => console.log("Go to featured") },
      ],
    },
    {
      icon: "💿",
      label: "Go to album",
      onClick: () => console.log("Go to album"),
    },
    {
      icon: "🎼",
      label: "View credits",
      onClick: () => console.log("View credits"),
    },
    { type: "divider" },
    {
      icon: "📤",
      label: "Share",
      submenu: [
        { label: "Copy song link", onClick: () => console.log("Copied link") },
        { label: "Embed", onClick: () => console.log("Open embed dialog") },
      ],
    },
    {
      icon: "🖥️",
      label: "Open in Desktop app",
      onClick: () => console.log("Open in Desktop"),
    },
  ];
  
  

  return (
    <div className="fixed right-0 top-16 h-full w-80 bg-gray-900 text-white shadow-lg p-4 overflow-y-auto z-50">
      
      {/* Header Buttons */}
      <div className="flex justify-between items-center mb-4 relative">
        <button
          ref={menuButtonRef}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuPos({ x: rect.right, y: rect.bottom });
            setShowMenu(true);
          }}
          className="text-gray-400 hover:text-white text-2xl px-2"
          title="More options"
        >
          &#x22EE;
        </button>

        <button
          className="text-gray-400 hover:text-white text-xl"
          onClick={onClose}
          title="Close"
        >
          ✖
        </button>

        {/* Dropdown Menu */}
        <ContextMenu
          visible={showMenu}
          x={menuPos.x}
          y={menuPos.y}
          items={menuItems}
          onClose={() => setShowMenu(false)}
        />
      </div>

      {/* Video Section */}
      {videoSrc && (
        <div className="w-full max-w-sm mx-auto bg-black mb-4">
          <video
            className="w-full aspect-[9/16] object-cover"
            controls
            autoPlay
            muted
            poster={videoPoster || cover}
          >
            <source src={videoSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* Artist Header */}
      <div className="flex flex-col items-center">
        <img
          src={cover || "https://via.placeholder.com/300x200"}
          alt={name}
          className="w-full h-40 object-cover rounded-lg"
        />
        <h2 className="text-2xl font-bold mt-4">{name}</h2>
        {monthlyListeners && (
          <p className="text-gray-300 text-sm">
            {monthlyListeners} monthly listeners
          </p>
        )}
      </div>

      {/* Biography */}
      {biography && (
        <div className="mt-4">
          <p className="text-gray-400">{biography}</p>
        </div>
      )}

      {/* Credits */}
      {credits.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-2">Credits</h3>
          <ul className="space-y-2">
            {credits.map((credit, index) => (
              <li key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-white">{credit.name}</p>
                  <p className="text-gray-400 text-sm">{credit.role}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* On Tour */}
      {onTour.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-2">On Tour</h3>
          <ul className="space-y-2">
            {onTour.map((tourItem, index) => (
              <li key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-white">{tourItem.date}</p>
                  <p className="text-gray-400 text-sm">
                    {tourItem.location} • {tourItem.venue}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next in Queue */}
      {nextInQueue && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-2">Next in Queue</h3>
          <div className="flex items-center space-x-3 bg-gray-800 p-2 rounded">
            <img
              src={nextInQueue.cover || "https://via.placeholder.com/50"}
              alt={nextInQueue.title}
              className="w-12 h-12 rounded object-cover"
            />
            <div>
              <p className="text-white">{nextInQueue.title}</p>
              <p className="text-gray-400 text-sm">{nextInQueue.artist}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RightPanel;
