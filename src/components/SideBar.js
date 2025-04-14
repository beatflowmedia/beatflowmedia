import React, { useState, useMemo } from "react";
import { FaMusic, FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ContextMenu from "./ContextMenu";
import SidebarArtistItem from "./SidebarArtistItem";
import useFollowArtist from "../hooks/useFollowArtist";
import NewPlaylistModal from "./NewPlaylistModal";
import {
  dontPlayArtist,
  pinArtist,
  goToArtistRadio,
  reportArtist,
  shareArtist,
  openInDesktopApp,
} from "../utils/artistContextHelpers";

const SideBar = ({
  musicData = [],
  playlists = [],
  onNavigate = () => {},
  onArtistSelect = () => {},
  onPlaylistSelect = () => {},
  onCreatePlaylist = () => {},
  onPlayArtist = () => {},
}) => {
  const [contextArtist, setContextArtist] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [showNewPlaylistModal, setShowNewPlaylistModal] = useState(false);

  const uniqueArtists = useMemo(() => {
    const seen = new Set();
    let artists = musicData
      .filter(({ artist }) => {
        if (seen.has(artist)) return false;
        seen.add(artist);
        return true;
      })
      .map((song, index) => ({ id: `artist-${index}`, name: song.artist }));

    return artists;
  }, [musicData]);

  const { isFollowing, toggleFollow } = useFollowArtist(contextArtist);

  const handleRightClickArtist = (e, artistName) => {
    e.preventDefault();
    setContextArtist(artistName);
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const artistContextItems = [
    { label: isFollowing ? "Unfollow" : "Follow", onClick: () => toggleFollow() },
    { label: "Don't play this artist", onClick: () => dontPlayArtist(contextArtist) },
    { label: "Pin artist", onClick: () => pinArtist(contextArtist) },
    { label: "Go to artist radio", onClick: () => goToArtistRadio(contextArtist) },
    { label: "Report", onClick: () => reportArtist(contextArtist) },
    { label: "Share", onClick: () => shareArtist(contextArtist) },
    { label: "Open in Desktop app", onClick: () => openInDesktopApp(contextArtist) },
  ];

  return (
    <div className={`bg-gray-900 text-white h-screen flex flex-col ${isCollapsed ? "w-26" : "w-64"} p-6 pt-20 transition-all duration-300 relative`}>
      <div className="flex items-center justify-between mb-4">
        {!isCollapsed && <h3 className="text-xl font-bold">Your Library</h3>}
        <div className="flex items-center space-x-2">
          {!isCollapsed && (
            <button
              className="text-gray-400 hover:text-white"
              title="Create Playlist"
              onClick={() => setShowNewPlaylistModal(true)}
            >
              <FaPlus size={20} />
            </button>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title="Toggle Sidebar"
            className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition"
          >
            {isCollapsed ? <FaChevronRight size={16} /> : <FaChevronLeft size={16} />}
          </button>
        </div>
      </div>

      
      <div>
        {!isCollapsed && <h4 className="text-lg font-semibold mb-2">Artists</h4>}
        {uniqueArtists.length === 0 ? (
          !isCollapsed && <p className="text-gray-400">No artists available.</p>
        ) : (
          <div className={viewMode === "list" ? "space-y-2" : "grid grid-cols-1 gap-3"}>
            {uniqueArtists.map((artistObj) => (
              <SidebarArtistItem
                key={artistObj.id}
                artist={artistObj}
                isCollapsed={isCollapsed}
                onSelect={onArtistSelect}
                onRightClick={handleRightClickArtist}
                onPlay={onPlayArtist}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="mt-6">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold">Playlists</h4>
            <button onClick={() => setShowNewPlaylistModal(true)} className="text-gray-400 hover:text-white">
              <FaPlus size={26} />
            </button>
          </div>
          {playlists.length === 0 ? (
            <p className="text-gray-400 mt-2">No playlists created yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => onPlaylistSelect(playlist)}
                  className="flex items-center space-x-3 cursor-pointer hover:text-white w-full text-left"
                >
                  <FaMusic size={16} />
                  <span className="hover:text-green-400">{playlist.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <ContextMenu
        visible={showMenu}
        x={menuPos.x}
        y={menuPos.y}
        items={artistContextItems}
        onClose={() => setShowMenu(false)}
      />

      {showNewPlaylistModal && (
        <NewPlaylistModal
          onCreate={(name) => {
            onCreatePlaylist(name);
            setShowNewPlaylistModal(false);
          }}
          onCancel={() => setShowNewPlaylistModal(false)}
        />
      )}
    </div>
  );
};

export default SideBar;
