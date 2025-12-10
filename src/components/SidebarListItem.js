import React, { useState } from "react";
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
  onPlaylistSelect
}) => {
  const isArtist = item.type === "artist";
  const [imgError, setImgError] = useState(false);
  const handleClick = isArtist
    ? () => onArtistSelect(item.name)
    : () => onPlaylistSelect(item);

  return (
    <button
      className="flex items-center w-full px-2 py-1 rounded hover:bg-gray-800 transition group text-left"
      onClick={handleClick}
      tabIndex={0}
      aria-label={item.name}
      title={isArtist ? `Go to artist page: ${item.name}` : item.name}
    >
      {!imgError && item.cover ? (
        <img
          src={item.cover}
          alt={item.name}
          className={`w-10 h-10 mr-3 object-cover flex-shrink-0 ${
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
          className="w-10 h-10 mr-3 object-cover flex-shrink-0 rounded-full"
        />
      ) : (
        <div className="w-10 h-10 mr-3 flex items-center justify-center flex-shrink-0 rounded border border-gray-800 bg-gray-900">
          <MusicNote sx={{ fontSize: 20, color: '#9ca3af' }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="truncate text-white text-sm font-semibold group-hover:text-green-300">
          {item.name}
        </div>
        <div className="text-xs text-gray-400 flex items-center mt-0.5">
          {typeIcon[item.type]} {isArtist ? 'Artist' : 'Playlist'}
        </div>
      </div>
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
  onPlaylistSelect: PropTypes.func
};

export default SidebarListItem;
