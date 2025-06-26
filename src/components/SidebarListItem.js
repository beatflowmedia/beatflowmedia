import React, { useState } from "react";
import PropTypes from "prop-types";
import { FaMusic, FaUser, FaPlay, FaEllipsisH } from "react-icons/fa";
import ContextMenu from './ContextMenu';
import * as ctxHelpers from '../utils/contextMenuHelpers';

const typeIcon = {
  playlist: <FaMusic className="text-green-400 mr-2" />,
  artist: <FaUser className="text-yellow-400 mr-2" />,
};

const SidebarListItem = ({
  item,
  onArtistSelect,
  onShowRightPanel,
  onPlaylistSelect,
  onPlayArtist,
  onEditPlaylist,
  onDeletePlaylist,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  // context menu items matching CreatePlaylist
  const optionsMenu = [
    { icon: '▶️', label: 'Add to queue', onClick: () => ctxHelpers.addToQueue(item) },
    { icon: '', label: 'Remove from profile', onClick: () => ctxHelpers.removeFromProfile(item) },
    { icon: '✏️', label: 'Edit details', onClick: () => onEditPlaylist && onEditPlaylist(item) },
    { icon: '🗑️', label: 'Delete', onClick: () => onDeletePlaylist && onDeletePlaylist(item) },
    { icon: '', label: 'Make private', onClick: () => ctxHelpers.makePrivate(item) },
    { icon: '', label: 'Invite collaborators', onClick: () => ctxHelpers.inviteCollaborators(item) },
    { icon: '', label: 'Exclude from your taste profile', onClick: () => ctxHelpers.excludeFromTasteProfile(item) },
    { icon: '', label: 'Move to folder', onClick: () => ctxHelpers.moveToFolder(item) },
    { icon: '', label: 'Share', onClick: () => ctxHelpers.share(item) },
    { icon: '', label: 'Open in Desktop app', onClick: () => ctxHelpers.openInDesktopApp(item) },
  ];

  if (item.type === "artist") {
    return (
      <div className="flex items-center w-full px-2 py-1 rounded hover:bg-gray-800 transition group">
        {/* Info image: opens right panel */}
        <button
          onClick={() => onShowRightPanel(item.name)}
          className="w-10 h-10 mr-3 rounded-full overflow-hidden focus:outline-none"
          title="Show artist info"
        >
          <img src={item.cover} alt={item.name} className="w-full h-full object-cover"/>
        </button>
        {/* Play artist button */}
        <button
          onClick={() => onPlayArtist && onPlayArtist(item.name)}
          className="mr-2 rounded-full p-2 bg-gray-800 hover:bg-green-500 transition focus:outline-none"
          title={`Play songs by ${item.name}`}
        >
          <FaPlay className="text-white" />
        </button>
        {/* Main: load main area */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onArtistSelect(item.name)}
          title={`Go to artist page: ${item.name}`}
        >
          <div className="truncate text-white text-sm font-semibold group-hover:text-green-300">{item.name}</div>
          <div className="text-xs text-gray-400 flex items-center mt-0.5">
            {typeIcon[item.type]}
            Artist
          </div>
        </div>
      </div>
    );
  }
  // Playlist: click anywhere triggers playlist select
  return (
    <div
      className="flex items-center w-full px-2 py-1 rounded hover:bg-gray-800 transition group relative"
      onClick={() => onPlaylistSelect(item)}
      title={item.name}
    >
      <img
        src={item.cover}
        alt={item.name}
        className="w-10 h-10 rounded object-cover mr-3 flex-shrink-0 border border-gray-800"
        onError={e => { e.target.onerror = null; e.target.src = "/playlist-default.jpg"; }}
      />
      <div className="flex-1 min-w-0">
        <div className="truncate text-white text-sm font-semibold group-hover:text-green-300">{item.name}</div>
        <div className="text-xs text-gray-400 flex items-center mt-0.5">
          {typeIcon[item.type]} Playlist
        </div>
      </div>
      <button
        onClick={e => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          setMenuPos({ x: rect.right, y: rect.bottom });
          setMenuVisible(true);
        }}
        className="text-gray-400 hover:text-white p-1 ml-2 focus:outline-none"
        title="Options"
      ><FaEllipsisH /></button>
      <ContextMenu
        visible={menuVisible}
        x={menuPos.x}
        y={menuPos.y}
        items={optionsMenu}
        onClose={() => setMenuVisible(false)}
      />
    </div>
  );
};

SidebarListItem.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    cover: PropTypes.string,
    type: PropTypes.string.isRequired,
  }).isRequired,
  onArtistSelect: PropTypes.func,
  onShowRightPanel: PropTypes.func,
  onPlaylistSelect: PropTypes.func,
  onPlayArtist: PropTypes.func,
  onEditPlaylist: PropTypes.func,
  onDeletePlaylist: PropTypes.func,
};

export default SidebarListItem;
