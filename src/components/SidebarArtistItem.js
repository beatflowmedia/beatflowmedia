import React from "react";

const SidebarArtistItem = ({
  artist,
  isCollapsed,
  onSelect,
  onRightClick,
  onPlay,
  viewMode = "list", // Accept viewMode
}) => {
  const isCompact = viewMode === "compact";

  if (isCompact) {
    return (
      <div
        key={artist.id}
        className="flex items-center space-x-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-md transition cursor-pointer"
        onClick={() => onPlay(artist.name)}
        onContextMenu={(e) => onRightClick(e, artist.name)}
      >
        <img
          src={`/artistImages/${artist.name}.jpg`}
          alt={artist.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1 text-white">
          <p className="font-medium">{artist.name}</p>
        </div>
        <div className="text-sm text-green-400 hover:text-green-300" onClick={(e) => {
          e.stopPropagation();
          onSelect(artist.name);
        }}>
          View
        </div>
      </div>
    );
  }

  // Default list mode
  return (
    <div
      key={artist.id}
      className="flex space-x-3 w-full items-center"
    >
      <div
        className="relative w-10 h-10 cursor-pointer group"
        onClick={() => onPlay(artist.name)}
        onContextMenu={(e) => onRightClick(e, artist.name)}
        title={`Play ${artist.name}`}
      >
        <img
          src={`/artistImages/${artist.name}.jpg`}
          alt={artist.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" className="w-4 h-4 ml-1">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      {!isCollapsed && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(artist.name);
          }}
          className="text-sm font-medium hover:text-green-400 text-left w-full"
          title={`View songs by ${artist.name}`}
        >
          {artist.name}
        </button>
      )}
    </div>
  );
};

export default SidebarArtistItem;
