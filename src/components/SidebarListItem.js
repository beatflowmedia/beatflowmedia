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

  // For artists, use the new props if available, otherwise fall back to onArtistSelect
  const handleClick = isArtist
    ? () => (onViewArtist || onArtistSelect)?.(item.name)
    : () => onPlaylistSelect(item);

  // If this is an artist and we have the right panel handler
  if (isArtist && onShowRightPanel) {
    return (
      <div className={`flex items-center w-full px-2 py-1 rounded hover:bg-gray-800 transition group ${isCollapsed ? 'justify-center' : ''}`}>
        {/* Artist Image - opens right panel */}
        <img
          src={!imgError && item.cover ? item.cover : "/images/Logo.png"}
          alt={item.name}
          className={`w-10 h-10 rounded-full object-cover ${isCollapsed ? '' : 'mr-3'} flex-shrink-0 border border-gray-800 cursor-pointer hover:ring-2 hover:ring-green-400`}
          onClick={(e) => {
            e.stopPropagation();
            isCollapsed ? (onViewArtist || onArtistSelect)?.(item.name) : onShowRightPanel(item.name);
          }}
          onError={() => setImgError(true)}
          title={`${isCollapsed ? 'Go to' : 'Open details for'} ${item.name}`}
        />
        {/* Name - loads artist in main area - hidden when collapsed */}
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
              onClick={() => (onViewArtist || onArtistSelect)?.(item.name)}
              title={`Show artist: ${item.name}`}
              tabIndex={0}
            >
              {item.name}
            </button>
            <div className="text-xs text-gray-400 flex items-center mt-0.5">
              {typeIcon.artist} Artist
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default button layout for playlists or simple artist items
  return (
    <button
      className={`flex items-center w-full px-2 py-1 rounded hover:bg-gray-800 transition group text-left ${isCollapsed ? 'justify-center' : ''}`}
      onClick={handleClick}
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
