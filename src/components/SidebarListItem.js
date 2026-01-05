import { useState } from "react";
import { FaMusic, FaUser } from "react-icons/fa";
import { MusicNote } from "@mui/icons-material";
import PropTypes from 'prop-types';

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
  isCollapsed = false
}) => {
  const isArtist = item.type === "artist";
  const [imgError, setImgError] = useState(false);

  // Main navigation handlers (DRY - same for artist/playlist)
  const handleNameClick = isArtist
    ? () => (onViewArtist || onArtistSelect)?.(item.name)
    : () => onPlaylistSelect(item);

  // Image click handlers - open right panel when available
  const handleImageClick = (e) => {
    e.stopPropagation();
    if (isCollapsed) {
      // When collapsed, image always navigates
      handleNameClick();
    } else if (onShowRightPanel) {
      // When expanded, image opens right panel
      if (isArtist) {
        onShowRightPanel(item.name);
      } else {
        // For playlists, pass playlist object
        onShowRightPanel({ type: 'playlist', data: item });
      }
    } else {
      // Fallback to navigation
      handleNameClick();
    }
  };

  // If we have the right panel handler (applies to both artist AND playlist)
  if (onShowRightPanel) {
    const imageClass = isArtist ? 'rounded-full' : 'rounded';
    const displayImage = !imgError && item.cover
      ? item.cover
      : isArtist
      ? "/images/Logo.png"
      : null;

    return (
      <div className={`flex items-center w-full px-2 py-1 rounded hover:bg-gray-800 transition group ${isCollapsed ? 'justify-center' : ''}`}>
        {/* Image - opens right panel (DRY for both artist and playlist) */}
        {displayImage ? (
          <img
            src={displayImage}
            alt={item.name}
            className={`w-10 h-10 ${imageClass} object-cover ${isCollapsed ? '' : 'mr-3'} flex-shrink-0 border border-gray-800 cursor-pointer hover:ring-2 hover:ring-green-400`}
            onClick={handleImageClick}
            onError={() => setImgError(true)}
            title={`${isCollapsed ? 'Go to' : 'Open details for'} ${item.name}`}
          />
        ) : (
          <div
            className={`w-10 h-10 ${isCollapsed ? '' : 'mr-3'} flex items-center justify-center flex-shrink-0 rounded border border-gray-800 bg-gray-900 cursor-pointer hover:ring-2 hover:ring-green-400`}
            onClick={handleImageClick}
            title={`${isCollapsed ? 'Go to' : 'Open details for'} ${item.name}`}
          >
            <MusicNote sx={{ fontSize: 20, color: '#9ca3af' }} />
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
  isCollapsed: PropTypes.bool
};

export default SidebarListItem;
