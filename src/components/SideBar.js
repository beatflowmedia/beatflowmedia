// components/SideBar.js
import { useState , useMemo } from "react";
import SidebarListItem from "./SidebarListItem";
import NewPlaylistModal from "./NewPlaylistModal";
import { FaPlus, FaSearch, FaList, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import PropTypes from 'prop-types';

const FILTERS = [
  { label: "Playlists", value: "playlist" },
  { label: "Artists", value: "artist" },
];

// Helper to group and filter sidebar items
function buildSidebarItems(musicData, playlists, filter, search) {
  const artistSet = new Set();
  const artistItems = musicData
    .filter((song) => {
      if (!song.artist || artistSet.has(song.artist)) return false;
      artistSet.add(song.artist);
      return true;
    })
    .map((artistSong) => ({
      id: `artist-${artistSong.artist}`,
      name: artistSong.artist,
      cover: `/artistImages/${artistSong.artist}.jpg`,
      type: "artist"
    }));

  const playlistItems = playlists.map((p) => ({
    ...p,
    cover: p.imageUrl || p.cover || "/playlist-default.jpg",
    type: "playlist",
    id: p.id
  }));

  let items = [...playlistItems, ...artistItems];
  if (filter) items = items.filter((item) => item.type === filter);
  if (search)
    items = items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()),
    );

  return {
    playlists: items.filter((i) => i.type === "playlist"),
    artists: items.filter((i) => i.type === "artist"),
    all: items
  };
}

const SideBar = ({
  musicData = [],
  playlists = [],
  onPlaylistSelect,
  onArtistSelect,
  onCreatePlaylist,
  onShowRightPanel,
  onPlayArtist,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  const sidebar = useMemo(
    () => buildSidebarItems(musicData, playlists, filter, search),
    [musicData, playlists, filter, search],
  );
  const { playlists: playlistItems, artists: artistItems } = sidebar;

  return (
    <div className="bg-black text-white flex flex-col border-r border-gray-800" style={{ height: "100%", overflow: "hidden", backgroundColor: "#000000" }}>
      {/* Grid handles positioning */}

      {/* Sidebar header: logo, filters, search */}
      <div className="flex flex-col pt-0 pb-2 flex-shrink-0 z-10" style={{ flexShrink: 0, backgroundColor: "#000000" }}>
        {/* Toggle button and header */}
        <div className="flex items-center justify-between px-4 py-2">
          {!isCollapsed && <h2 className="text-sm font-semibold text-gray-400">Your Library</h2>}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <FaChevronRight className="text-gray-400" />
              ) : (
                <FaChevronLeft className="text-gray-400" />
              )}
            </button>
          )}
        </div>

        {/* Filter chips - hidden when collapsed */}
        {!isCollapsed && (
          <div className="flex space-x-2 px-4 mb-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`px-3 py-1 rounded-full text-xs ${
                filter === f.value
                  ? "text-white"
                  : "text-gray-400"
              } hover:bg-gray-900`}
              style={{
                backgroundColor: filter === f.value ? "#1a1a1a" : "#0a0a0a"
              }}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
          <button
            className={`px-3 py-1 rounded-full text-xs ${
              !filter ? "text-white" : "text-gray-400"
            } hover:bg-gray-900`}
            style={{
              backgroundColor: !filter ? "#1a1a1a" : "#0a0a0a"
            }}
            onClick={() => setFilter("")}
          >
            All
          </button>
        </div>
        )}

        {/* Search - hidden when collapsed */}
        {!isCollapsed && (
          <div className="flex items-center px-4 mb-2">
          <FaSearch className="text-gray-600 mr-2" />
          <input
            className="w-full p-1 rounded text-sm text-white border-none"
            style={{ backgroundColor: "#1a1a1a" }}
            placeholder="Search in Your Library"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="ml-2 text-gray-500 hover:text-gray-300" title="Recents">
            <FaList />
          </button>
          <button
            className="rounded-full p-2 ml-2"
            style={{ backgroundColor: "#1a1a1a" }}
            title="Create Playlist"
            onClick={() => setShowModal(true)}
          >
            <FaPlus className="text-gray-400 hover:text-white" />
          </button>
        </div>
        )}
      </div>

      {/* Scrollable library: playlists & artists */}
      <div className="overflow-y-auto flex-1 px-2 pb-2" style={{ flexGrow: 1, flexShrink: 1, minHeight: 0, scrollbarColor: 'inherit', scrollbarWidth: 'inherit' }}>
        {playlistItems.length > 0 && (
          <div className="mb-4">
            {!isCollapsed && (
              <div className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">
                Playlists
              </div>
            )}
            {playlistItems.map((item) => (
              <SidebarListItem
                key={item.id}
                item={item}
                onPlaylistSelect={onPlaylistSelect}
                onShowRightPanel={onShowRightPanel}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        )}
        {artistItems.length > 0 && (
          <div>
            {!isCollapsed && (
              <div className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">
                Artists
              </div>
            )}
            {artistItems.map((item) => (
              <SidebarListItem
                key={item.id}
                item={item}
                onViewArtist={onArtistSelect}
                onShowRightPanel={onShowRightPanel}
                onPlayArtist={onPlayArtist}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        )}
        {!isCollapsed && playlistItems.length === 0 && artistItems.length === 0 && (
          <div className="text-gray-400 text-center pt-4">No items found.</div>
        )}
      </div>
      {/* New Playlist Modal */}
      {showModal && (
        <NewPlaylistModal
          onCreate={(name, image) => {
            onCreatePlaylist(name, image);
            setShowModal(false);
          }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

SideBar.propTypes = {
  musicData: PropTypes.array,
  playlists: PropTypes.array,
  onPlaylistSelect: PropTypes.func.isRequired,
  onArtistSelect: PropTypes.func.isRequired,
  onCreatePlaylist: PropTypes.func.isRequired,
  onShowRightPanel: PropTypes.func,
  onPlayArtist: PropTypes.func,
  isCollapsed: PropTypes.bool,
  onToggleCollapse: PropTypes.func
};

export default SideBar;
