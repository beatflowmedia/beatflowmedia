import { useState } from "react";
import { FaMusic, FaUser, FaPlay, FaPlus, FaFolder, FaLock, FaUserPlus, FaEyeSlash, FaThumbtack, FaShare } from "react-icons/fa";
import { MusicNote } from "@mui/icons-material";
import { BiListPlus } from "react-icons/bi";
import { MdEdit, MdDelete } from "react-icons/md";
import PropTypes from 'prop-types';
import ContextMenu from './ContextMenu';

const typeIcon = {
  playlist: <FaMusic className="text-green-400 mr-2" />,
  artist: <FaUser className="text-yellow-400 mr-2" />
};

const SidebarListItem = ({
  item,
  onArtistSelect,
  onPlaylistSelect,
  onViewArtist,
  onShowRightPanel,
  onPlayArtist,
  onPlayPlaylist,
  isCollapsed = false,
  isMenuOpen = false,
  menuPosition = { x: 0, y: 0 },
  onOpenMenu,
  onCloseMenu
}) => {
  const isArtist = item.type === "artist";
  const [imgError, setImgError] = useState(false);

  // Main navigation handlers (DRY - same for artist/playlist)
  const handleNameClick = isArtist
    ? () => (onViewArtist || onArtistSelect)?.(item.name)
    : () => onPlaylistSelect(item);

  // Image click handlers - open right panel and auto-play (DRY)
  const handleImageClick = (e) => {
    e.stopPropagation();

    // Play immediately using the existing play handlers
    if (isArtist && onPlayArtist) {
      onPlayArtist(item.name);
    } else if (!isArtist && onPlayPlaylist) {
      onPlayPlaylist(item);
    }

    // Also open right panel if available
    if (onShowRightPanel) {
      if (isArtist) {
        onShowRightPanel(item.name);
      } else {
        onShowRightPanel({ type: 'playlist', data: item });
      }
    }
  };

  // Context menu handler (right-click for playlists)
  const handleContextMenu = (e) => {
    if (isArtist || !onOpenMenu) return; // Only for playlists
    e.preventDefault();
    e.stopPropagation();
    onOpenMenu(item.id, { x: e.clientX, y: e.clientY });
  };

  const contextMenuItems = [
    { label: 'Add to queue', icon: <BiListPlus />, onClick: () => console.log('Add to queue', item) },
    { label: 'Remove from profile', icon: <FaEyeSlash />, onClick: () => console.log('Remove from profile', item) },
    { type: 'divider' },
    { label: 'Edit details', icon: <MdEdit />, onClick: () => console.log('Edit details', item) },
    { label: 'Delete', icon: <MdDelete />, onClick: () => console.log('Delete', item) },
    { type: 'divider' },
    { label: 'Create playlist', icon: <FaPlus />, onClick: () => console.log('Create playlist') },
    { label: 'Create folder', icon: <FaFolder />, onClick: () => console.log('Create folder') },
    { type: 'divider' },
    { label: 'Make private', icon: <FaLock />, onClick: () => console.log('Make private', item) },
    { label: 'Invite collaborators', icon: <FaUserPlus />, onClick: () => console.log('Invite collaborators', item) },
    { label: 'Exclude from your taste profile', icon: <FaEyeSlash />, onClick: () => console.log('Exclude from taste profile', item) },
    { label: 'Move to folder', icon: <FaFolder />, onClick: () => console.log('Move to folder', item) },
    { label: 'Pin playlist', icon: <FaThumbtack />, onClick: () => console.log('Pin playlist', item) },
    { type: 'divider' },
    { label: 'Share', icon: <FaShare />, onClick: () => console.log('Share', item) }
  ];

  // If we have the right panel handler (applies to both artist AND playlist)
  if (onShowRightPanel) {
    const imageClass = isArtist ? 'rounded-full' : 'rounded';
    const displayImage = !imgError && item.cover
      ? item.cover
      : isArtist
      ? "/images/Logo.png"
      : null;

    return (
      <div
        className={`flex items-center w-full px-2 py-1 rounded hover:bg-gray-800 transition group ${isCollapsed ? 'justify-center' : ''}`}
        onContextMenu={handleContextMenu}
      >
        {/* Image with play overlay (DRY for both artist and playlist) */}
        {displayImage ? (
          <div className={`relative w-10 h-10 ${isCollapsed ? '' : 'mr-3'} shrink-0`}>
            <img
              src={displayImage}
              alt={item.name}
              className={`w-10 h-10 ${imageClass} object-cover border border-gray-800 cursor-pointer transition-opacity group-hover:opacity-60`}
              onClick={handleImageClick}
              onError={() => setImgError(true)}
              title={`Play ${item.name}`}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <FaPlay className="text-white text-sm" />
            </div>
          </div>
        ) : (
          <div className={`relative w-10 h-10 ${isCollapsed ? '' : 'mr-3'} shrink-0`}>
            <div
              className={`w-10 h-10 flex items-center justify-center rounded border border-gray-800 bg-gray-900 cursor-pointer transition-opacity group-hover:opacity-60`}
              onClick={handleImageClick}
              title={`Play ${item.name}`}
            >
              <MusicNote sx={{ fontSize: 20, color: '#9ca3af' }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <FaPlay className="text-white text-sm" />
            </div>
          </div>
        )}

        {/* Name - navigates to page - hidden when collapsed */}
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <button
              className="truncate text-white text-sm font-semibold group-hover:text-green-300 text-left"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                margin: 0
              }}
              onClick={handleNameClick}
              title={`${isArtist ? 'Show artist' : 'Open playlist'}: ${item.name}`}
              tabIndex={0}
            >
              {item.name}
            </button>
            <button
              className="text-xs text-gray-400 flex items-center mt-0.5 hover:text-green-300 text-left"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                margin: 0
              }}
              onClick={handleNameClick}
              title={`${isArtist ? 'Go to artist page' : 'Go to playlist page'}`}
            >
              {typeIcon[item.type]} {isArtist ? 'Artist' : 'Playlist'}
            </button>
          </div>
        )}

        {/* Context menu */}
        {isMenuOpen && (
          <ContextMenu
            visible={isMenuOpen}
            x={menuPosition.x}
            y={menuPosition.y}
            items={contextMenuItems}
            onClose={onCloseMenu}
          />
        )}
      </div>
    );
  }

  // Default button layout for playlists or simple artist items (no right panel handler)
  return (
    <button
      className={`flex items-center w-full px-2 py-1 rounded hover:bg-gray-800 transition group text-left ${isCollapsed ? 'justify-center' : ''}`}
      onClick={handleNameClick}
      tabIndex={0}
      aria-label={item.name}
      title={isArtist ? `Go to artist page: ${item.name}` : item.name}
    >
      {!imgError && item.cover ? (
        <img
          src={item.cover}
          alt={item.name}
          className={`w-10 h-10 ${isCollapsed ? '' : 'mr-3'} object-cover flex-shrink-0 ${
            isArtist ? 'rounded-full' : 'rounded border border-gray-800'
          }`}
          onError={() => {
            if (!imgError) {
              setImgError(true);
            }
          }}
        />
      ) : isArtist ? (
        <img
          src="/images/Logo.png"
          alt={item.name}
          className={`w-10 h-10 ${isCollapsed ? '' : 'mr-3'} object-cover flex-shrink-0 rounded-full`}
        />
      ) : (
        <div className={`w-10 h-10 ${isCollapsed ? '' : 'mr-3'} flex items-center justify-center flex-shrink-0 rounded border border-gray-800 bg-gray-900`}>
          <MusicNote sx={{ fontSize: 20, color: '#9ca3af' }} />
        </div>
      )}
      {!isCollapsed && (
        <div className="flex-1 min-w-0">
          <div className="truncate text-white text-sm font-semibold group-hover:text-green-300">
            {item.name}
          </div>
          <div className="text-xs text-gray-400 flex items-center mt-0.5">
            {typeIcon[item.type]} {isArtist ? 'Artist' : 'Playlist'}
          </div>
        </div>
      )}
    </button>
  );
};

SidebarListItem.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    cover: PropTypes.string,
    type: PropTypes.string.isRequired
  }).isRequired,
  onArtistSelect: PropTypes.func,
  onPlaylistSelect: PropTypes.func,
  onViewArtist: PropTypes.func,
  onShowRightPanel: PropTypes.func,
  onPlayArtist: PropTypes.func,
  onPlayPlaylist: PropTypes.func,
  isCollapsed: PropTypes.bool,
  isMenuOpen: PropTypes.bool,
  menuPosition: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number
  }),
  onOpenMenu: PropTypes.func,
  onCloseMenu: PropTypes.func
};

export default SidebarListItem;
