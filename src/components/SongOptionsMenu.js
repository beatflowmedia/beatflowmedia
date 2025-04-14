// components/SongOptionsMenu.jsx

import React, { useState, useRef, useEffect } from "react";

function SongOptionsMenu({
  song,
  isFavorite,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onToggleFavorite,
  onGoToArtist,
  onGoToAlbum,
  onViewCredits,
  onOpenDesktopApp,
  onRemoveFromLiked,
  isInPlaylist = false,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close the menu if user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={() => setShowMenu((prev) => !prev)}
        className="text-gray-300 hover:text-white p-1"
        title="More options"
      >
        •••
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 shadow-lg rounded text-sm z-50">
          {/* Add to Playlist */}
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-700"
            onClick={() => {
              setShowMenu(false);
              onAddToPlaylist(song);
            }}
          >
            Add to playlist
          </button>

          {/* Remove from Playlist (only show if isInPlaylist) */}
          {isInPlaylist && (
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-700"
              onClick={() => {
                setShowMenu(false);
                onRemoveFromPlaylist && onRemoveFromPlaylist(song);
              }}
            >
              Remove from playlist
            </button>
          )}

          {/* Liked / Remove from Liked */}
          {isFavorite ? (
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-700"
              onClick={() => {
                setShowMenu(false);
                onRemoveFromLiked(song);
              }}
            >
              Remove from your Liked Songs
            </button>
          ) : (
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-700"
              onClick={() => {
                setShowMenu(false);
                onToggleFavorite(song);
              }}
            >
              Like Song
            </button>
          )}

          {/* Go to artist */}
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-700"
            onClick={() => {
              setShowMenu(false);
              onGoToArtist(song.artist);
            }}
          >
            Go to artist
          </button>

          {/* Go to album */}
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-700"
            onClick={() => {
              setShowMenu(false);
              onGoToAlbum(song);
            }}
          >
            Go to album
          </button>

          {/* View credits */}
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-700"
            onClick={() => {
              setShowMenu(false);
              onViewCredits(song);
            }}
          >
            View credits
          </button>

          {/* Open in Desktop app */}
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-700"
            onClick={() => {
              setShowMenu(false);
              onOpenDesktopApp(song);
            }}
          >
            Open in Desktop app
          </button>
        </div>
      )}
    </div>
  );
}

export default SongOptionsMenu;
