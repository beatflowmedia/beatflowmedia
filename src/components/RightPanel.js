import React, { useState, useRef } from "react";
import ContextMenu from "./ContextMenu";
import PropTypes from 'prop-types';

const RightPanel = ({ visible, content, onClose }) => {
  // content: { type: "artist"|"playlist", info: {...} }
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const menuButtonRef = useRef(null);

  if (!visible || !content) return null;

  // Handle artist and playlist display
  const { type, info = {} } = content;

  // --- Artist "peek" ---
  if (type === "artist") {
    const {
      name,
      cover,
      monthlyListeners,
      biography,
      credits = [],
      onTour = [],
      videoSrc,
      videoPoster
    } = info;

    const artistMenu = [
      { icon: "➕", label: "Add to playlist", onClick: () => {} },
      { icon: "❤️", label: "Save to your Liked Songs", onClick: () => {} },
      { icon: "📤", label: "Share", onClick: () => {} },
      { type: "divider" },
      { icon: "👤", label: "Go to artist", onClick: () => {} },
    ];

    return (
      <div className="bg-gray-900 text-white p-6 overflow-y-auto" style={{ height: "100%", width: "100%" }}>
        {/* Header: More menu and close */}
        <div className="flex justify-between items-center mb-4">
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
        </div>
        {/* Dropdown */}
        <ContextMenu
          visible={showMenu}
          x={menuPos.x}
          y={menuPos.y}
          items={artistMenu}
          onClose={() => setShowMenu(false)}
        />

        {/* Main: Cover, Name, Stats */}
        <div className="flex flex-col items-center mb-4">
          <img
            src={cover || "/artistImages/default.jpg"}
            alt={name}
            className="w-40 h-40 rounded-full object-cover shadow"
          />
          <h2 className="text-2xl font-bold mt-4 mb-1">{name}</h2>
          {monthlyListeners && (
            <div className="text-green-400 text-sm mb-2">
              {monthlyListeners.toLocaleString()} monthly listeners
            </div>
          )}
        </div>

        {/* Bio */}
        {biography && (
          <div className="mb-4 text-gray-300 leading-relaxed">{biography}</div>
        )}

        {/* Video (optional) */}
        {videoSrc && (
          <div className="mb-4">
            <video
              className="w-full aspect-[16/9] object-cover rounded"
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

        {/* Credits (Spotify-style) */}
        {credits.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold mb-2 text-lg">Credits</h3>
            <ul>
              {credits.map((credit, i) => (
                <li
                  key={i}
                  className="flex justify-between text-gray-200 py-1 border-b border-gray-700 last:border-none"
                >
                  <span>{credit.name}</span>
                  <span className="text-gray-400 text-sm">{credit.role}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* On Tour (optional) */}
        {onTour.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold mb-2 text-lg">On Tour</h3>
            <ul>
              {onTour.map((tourItem, i) => (
                <li
                  key={i}
                  className="py-1 border-b border-gray-700 last:border-none"
                >
                  <div className="text-white">{tourItem.date}</div>
                  <div className="text-gray-400 text-sm">
                    {tourItem.location} • {tourItem.venue}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button className="bg-green-500 text-white font-bold px-4 py-2 rounded hover:bg-green-600 transition">
            Play
          </button>
          <button className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition">
            Follow
          </button>
        </div>
      </div>
    );
  }

  // --- Playlist "peek" (Spotify style) ---
  if (type === "playlist") {
    const { name, cover, songs = [], description } = info;

    return (
      <div className="bg-gray-900 text-white p-6 overflow-y-auto" style={{ height: "100%", width: "100%" }}>
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-lg">Playlist Details</span>
          <button
            className="text-gray-400 hover:text-white text-xl"
            onClick={onClose}
            title="Close"
          >
            ✖
          </button>
        </div>
        <div className="flex flex-col items-center mb-4">
          <img
            src={cover || "/playlist-default.jpg"}
            alt={name}
            className="w-40 h-40 rounded-lg object-cover shadow"
          />
          <h2 className="text-2xl font-bold mt-4 mb-2">{name}</h2>
          {description && <p className="text-gray-300 mb-2">{description}</p>}
          <div className="text-gray-400 text-sm">
            {songs.length} song{songs.length !== 1 ? "s" : ""}
          </div>
        </div>
        {/* List a preview of songs */}
        <div className="mb-4">
          <h3 className="font-bold mb-2 text-lg">Songs</h3>
          <ul>
            {songs.slice(0, 5).map((song, i) => (
              <li
                key={i}
                className="flex items-center text-gray-200 py-1 border-b border-gray-800 last:border-none"
              >
                <img
                  src={song.cover}
                  alt={song.title}
                  className="w-10 h-10 mr-2 rounded object-cover"
                />
                <div>
                  <div>{song.title}</div>
                  <div className="text-xs text-gray-400">{song.artist}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <button className="bg-green-500 text-white font-bold px-4 py-2 rounded hover:bg-green-600 transition w-full">
          Play Playlist
        </button>
      </div>
    );
  }

  // Fallback: Unknown panel type
  return null;
};

RightPanel.propTypes = {
  visible: PropTypes.bool,
  content: PropTypes.object, // { type: "artist", info: {...} } or { type: "playlist", info: {...} }
  onClose: PropTypes.func.isRequired
};

export default RightPanel;
