import React from "react";
import PropTypes from "prop-types";
import { FaMusic, FaUser } from "react-icons/fa";
import PlayButton from "./PlayButton";

const typeIcon = {
  playlist: <FaMusic className="text-green-400 mr-2" />,
  artist: <FaUser className="text-yellow-400 mr-2" />,
};

const SidebarListItem = ({
  item,
  onViewArtist,     // (artistName) => show artist in main area (Home.js)
  onShowRightPanel, // (artistName) => show artist in right panel
  onPlayArtist,     // (artistName) => play artist's first song
  onPlaylistSelect, // (playlist)   => open playlist
}) => {
  if (item.type === "artist") {
    return (
      <div className="flex items-center w-full px-2 py-1 rounded hover:bg-gray-800 transition group">
        {/* Artist Image - opens right panel */}
        <img
          src={item.cover}
          alt={item.name}
          className="w-10 h-10 rounded object-cover mr-3 flex-shrink-0 border border-gray-800 cursor-pointer hover:ring-2 hover:ring-green-400"
          onClick={() => onShowRightPanel && onShowRightPanel(item.name)}
          onError={e => {
            e.target.onerror = null;
            e.target.src = "/artistImages/default.jpg";
          }}
          title={`Open details for ${item.name}`}
        />
        {/* Name - loads artist in main area */}
        <div className="flex-1 min-w-0">
          <button
            className="truncate text-white text-sm font-semibold group-hover:text-green-300 text-left"
            style={{ background: "none", border: "none", padding: 0, margin: 0 }}
            onClick={() => onViewArtist && onViewArtist(item.name)}
            title={`Show artist: ${item.name}`}
            tabIndex={0}
          >
            {item.name}
          </button>
          <div className="text-xs text-gray-400 flex items-center mt-0.5">
            {typeIcon[item.type]} Artist
          </div>
        </div>
        {/* Play - plays artist */}
        <div className="ml-2">
          <PlayButton
            isPlaying={false}
            onClick={() => onPlayArtist && onPlayArtist(item.name)}
            size={16}
          />
        </div>
      </div>
    );
  }

  // Playlists: click anywhere triggers playlist select
  return (
    <button
      className="flex items-center w-full px-2 py-1 rounded hover:bg-gray-800 transition group text-left"
      onClick={() => onPlaylistSelect && onPlaylistSelect(item)}
      tabIndex={0}
      aria-label={item.name}
    >
      <img
        src={item.cover}
        alt={item.name}
        className="w-10 h-10 rounded object-cover mr-3 flex-shrink-0 border border-gray-800"
        onError={e => {
          e.target.onerror = null;
          e.target.src = "/playlist-default.jpg";
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="truncate text-white text-sm font-semibold group-hover:text-green-300">
          {item.name}
        </div>
        <div className="text-xs text-gray-400 flex items-center mt-0.5">
          {typeIcon[item.type]} Playlist
        </div>
      </div>
    </button>
  );
};

SidebarListItem.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    cover: PropTypes.string,
    type: PropTypes.string.isRequired,
  }).isRequired,
  onViewArtist: PropTypes.func,      // Loads artist in main content area (Home.js)
  onShowRightPanel: PropTypes.func,  // Opens right panel with artist info
  onPlayArtist: PropTypes.func,      // Plays artist's first song
  onPlaylistSelect: PropTypes.func,  // Selects playlist
};

export default SidebarListItem;
